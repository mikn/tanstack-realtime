/**
 * CRDT primitives — conflict-free replicated data types.
 *
 * All CRDT operations are:
 * - Commutative:  order of messages doesn't matter
 * - Associative:  grouping of merges doesn't matter
 * - Idempotent:   applying the same message twice is the same as once
 *
 * These properties make CRDTs safe to use with the offline queue and gap
 * recovery: ops can be replayed, reordered, or deduplicated without data loss.
 */

// ---------------------------------------------------------------------------
// Client identity
// ---------------------------------------------------------------------------

/**
 * Generate a stable, session-unique client ID.
 * Used for LWW tie-breaking and PN-Counter per-client vectors.
 */
export function generateClientId(): string {
  return typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

// ---------------------------------------------------------------------------
// Lamport clock — monotonically increasing counter for causal ordering.
//
// In browser environments a single module-level clock is fine because each
// tab gets its own module instance. In persistent server processes (e.g.
// Node.js servers handling requests for many users), a module-global clock
// leaks state across clients. Use `createClock()` for per-instance isolation.
// ---------------------------------------------------------------------------

let _clock = 0

/** Increment the local clock and return the new value. Call before publishing. */
export function tickClock(): number {
  return ++_clock
}

/** Advance the local clock past an incoming value. Call on every receive. */
export function advanceClock(incoming: number): void {
  if (incoming >= _clock) _clock = incoming + 1
}

/**
 * Reset the module-global clock to zero. Intended for testing only.
 * @internal
 */
export function resetClock(): void {
  _clock = 0
}

// ---------------------------------------------------------------------------
// Scoped Lamport clock — per-instance isolation for server environments.
// ---------------------------------------------------------------------------

export interface LamportClock {
  /** Increment and return the new clock value. */
  tick: () => number
  /** Advance past an incoming value. */
  advance: (incoming: number) => void
  /** Current clock value (readonly). */
  readonly value: number
}

/**
 * Create an isolated Lamport clock instance.
 *
 * Use this on the server side where multiple clients share the same process.
 * Each `createRealtimeClient` or request handler gets its own clock so
 * clock values don't leak between unrelated clients.
 *
 * In browser environments the module-level `tickClock` / `advanceClock`
 * are fine because each tab has its own module instance.
 */
export function createClock(): LamportClock {
  let clock = 0
  return {
    tick: () => ++clock,
    advance: (incoming: number) => {
      if (incoming >= clock) clock = incoming + 1
    },
    get value() {
      return clock
    },
  }
}

// ---------------------------------------------------------------------------
// Field type declaration
// ---------------------------------------------------------------------------

/**
 * Declare the convergence behaviour for a field in a collection:
 *
 * - `'lww'`        Last-Write-Wins using Lamport clocks. Use for text,
 *                  enums, timestamps — anything where the most recent
 *                  write should win.
 *
 * - `'pn-counter'` PN-Counter. Use for vote counts, inventory levels, or
 *                  any numeric field mutated by increment / decrement.
 *                  Concurrent increments from multiple clients are never
 *                  lost — they always add up.
 *
 * - `'or-set'`     Observed-Remove Set. Use for tags, reactions, or any
 *                  array field where concurrent add/remove must converge
 *                  correctly. An add always wins over a concurrent remove.
 *
 * - `'local'`      Client-only field; never sent or received over the
 *                  wire. Use for UI state like `isEditing`, `localDraft`.
 */
export type CrdtFieldType = 'lww' | 'pn-counter' | 'or-set' | 'local'

/**
 * Map of field names to their CRDT semantics.
 * Unlisted fields fall back to incoming-wins (remote state always applied).
 */
export type CrdtFields<T extends object> = {
  [K in keyof T]?: CrdtFieldType
}

// ---------------------------------------------------------------------------
// LWW-Register (Last-Write-Wins)
// ---------------------------------------------------------------------------

/**
 * Metadata stored per LWW field per row so future messages can be compared.
 */
export interface LwwState {
  clock: number
  clientId: string
}

/** Wire payload for one LWW field inside `_crdt.fields`. */
export interface LwwWire {
  type: 'lww'
  value: unknown
  clock: number
  clientId: string
}

/** Returns true when the incoming `b` should win over the current `a`. */
export function lwwWins(
  a: LwwState,
  b: { clock: number; clientId: string },
): boolean {
  return b.clock > a.clock || (b.clock === a.clock && b.clientId > a.clientId)
}

// ---------------------------------------------------------------------------
// PN-Counter (Positive-Negative Counter)
// ---------------------------------------------------------------------------

/**
 * PN-Counter state: two grow-only counters per client ID.
 * Each client only ever increases its own sub-counter.
 *
 * value = Σ(inc[clientId]) − Σ(dec[clientId])
 * merge = element-wise max across all client IDs
 */
export interface PnState {
  /** clientId → total increments ever applied by that client */
  inc: Record<string, number>
  /** clientId → total decrements ever applied by that client */
  dec: Record<string, number>
}

/** Wire payload for one PN-Counter field or a standalone counter channel. */
export interface PnWire {
  type: 'pn'
  inc: Record<string, number>
  dec: Record<string, number>
}

/** Derive the numeric value from PN-Counter state. */
export function pnValue(state: PnState): number {
  let total = 0
  for (const v of Object.values(state.inc)) total += v
  for (const v of Object.values(state.dec)) total -= v
  return total
}

/** Merge two PN-Counter states: element-wise max per client ID. */
export function mergePn(a: PnState, b: PnState): PnState {
  const inc: Record<string, number> = { ...a.inc }
  const dec: Record<string, number> = { ...a.dec }
  for (const [id, v] of Object.entries(b.inc)) {
    if ((inc[id] ?? 0) < v) inc[id] = v
  }
  for (const [id, v] of Object.entries(b.dec)) {
    if ((dec[id] ?? 0) < v) dec[id] = v
  }
  return { inc, dec }
}

/** Return a new PnState after incrementing this client's counter by `by`. */
export function pnIncrement(state: PnState, clientId: string, by = 1): PnState {
  return {
    inc: { ...state.inc, [clientId]: (state.inc[clientId] ?? 0) + by },
    dec: state.dec,
  }
}

/** Return a new PnState after decrementing this client's counter by `by`. */
export function pnDecrement(state: PnState, clientId: string, by = 1): PnState {
  return {
    inc: state.inc,
    dec: { ...state.dec, [clientId]: (state.dec[clientId] ?? 0) + by },
  }
}

// ---------------------------------------------------------------------------
// OR-Set (Observed-Remove Set)
// ---------------------------------------------------------------------------

/**
 * Each element is paired with a unique tag generated at add-time.
 *
 * - Add  : append a new (value, tag) pair with a fresh UUID.
 * - Remove: drop all entries whose `key` matches the target value.
 * - Merge : union of all (tag → entry) pairs.
 *
 * "Add wins" over a concurrent remove: a re-add after a remove gets a new
 * tag that the remove has never seen, so it survives the merge.
 */
export interface OrEntry {
  /** JSON.stringify(value) — used for structural equality checks. */
  key: string
  value: unknown
  /** UUID unique to this specific add operation. */
  tag: string
}

export interface OrState {
  entries: Array<OrEntry>
}

/** Wire payload for one OR-Set field or a standalone synced-set channel. */
export interface OrWire {
  type: 'or'
  entries: Array<OrEntry>
}

/** Derive the current set values (deduped by key). */
export function orValues<T>(state: OrState): Array<T> {
  const seen = new Map<string, T>()
  for (const e of state.entries) seen.set(e.key, e.value as T)
  return Array.from(seen.values())
}

/** Merge two OR-Set states: union of all entries keyed by tag. */
export function mergeOr(a: OrState, b: OrState): OrState {
  const seen = new Map<string, OrEntry>()
  for (const e of a.entries) seen.set(e.tag, e)
  for (const e of b.entries) seen.set(e.tag, e)
  return { entries: Array.from(seen.values()) }
}

/**
 * Compact an OR-Set by keeping only one tag per unique value (key).
 *
 * Over time, repeated add/remove cycles accumulate tombstone-style entries.
 * `compactOr` deduplicates: for each unique `key`, only the *last* tag is
 * retained. This is semantics-preserving because `orValues` already dedupes
 * by key, and `orRemove` drops *all* entries for a key.
 *
 * Call periodically (e.g. after merge) to bound memory growth.
 */
export function compactOr(state: OrState): OrState {
  // Keep the last entry per key (iterating forward, later entries overwrite).
  const byKey = new Map<string, OrEntry>()
  for (const e of state.entries) byKey.set(e.key, e)
  return { entries: Array.from(byKey.values()) }
}

/** Return a new OrState with `value` added (fresh unique tag). */
export function orAdd(state: OrState, value: unknown): OrState {
  const key = JSON.stringify(value)
  const tag =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return { entries: [...state.entries, { key, value, tag }] }
}

/** Return a new OrState with all entries matching `value` removed. */
export function orRemove(state: OrState, value: unknown): OrState {
  const key = JSON.stringify(value)
  return { entries: state.entries.filter((e) => e.key !== key) }
}

/** Return true if the OR-Set contains `value`. */
export function orHas(state: OrState, value: unknown): boolean {
  const key = JSON.stringify(value)
  return state.entries.some((e) => e.key === key)
}

/**
 * Build an initial OrState from a plain array.
 * Each element gets a fresh unique tag, as if it had been `orAdd`ed.
 * Use this when seeding OR-Set state from a `queryFn` result or `initial` value.
 */
export function initOrFromArray(items: Array<unknown>): OrState {
  let state: OrState = { entries: [] }
  for (const item of items) state = orAdd(state, item)
  return state
}

// ---------------------------------------------------------------------------
// Internal per-row CRDT state (used inside realtimeCollectionOptions)
// ---------------------------------------------------------------------------

/** Internal state stored per field per row. */
export type CrdtFieldState = LwwState | PnState | OrState

/** Map of field name → CRDT internal state for one row. */
export type CrdtRowState = Record<string, CrdtFieldState>

// ---------------------------------------------------------------------------
// Wire format for the _crdt header attached to channel messages
// ---------------------------------------------------------------------------

/** Per-field CRDT payload embedded in `_crdt.fields` of a channel message. */
export type CrdtFieldWire = LwwWire | PnWire | OrWire

/**
 * The `_crdt` header attached to channel messages when a collection uses
 * `fields`. Receivers use this to perform correct CRDT merges instead of
 * last-write-wins. Non-CRDT receivers can safely ignore this field and read
 * the plain `data` values, which always reflect the current derived state.
 */
export interface CrdtMessageHeader {
  fields: Record<string, CrdtFieldWire>
}
