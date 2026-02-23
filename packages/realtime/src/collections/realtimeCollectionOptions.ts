import { serializeKey } from '../core/serializeKey.js'
import {
  advanceClock,
  initOrFromArray,
  lwwWins,
  mergeOr,
  mergePn,
  orAdd,
  orRemove,
  orValues,
  pnDecrement,
  pnIncrement,
  pnValue,
  tickClock,
} from '../core/crdt.js'
import type {
  CollectionConfig,
  DeleteMutationFn,
  InsertMutationFn,
  SyncConfig,
  UpdateMutationFn,
} from '@tanstack/db'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { QueryKey, RealtimeClient } from '../core/types.js'
import type {
  CrdtFields,
  CrdtMessageHeader,
  CrdtRowState,
  LwwState,
  LwwWire,
  OrState,
  OrWire,
  PnState,
  PnWire,
} from '../core/crdt.js'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Shape of messages published to / received from a realtime channel. */
export interface RealtimeChannelMessage<T = unknown> {
  action: 'insert' | 'update' | 'delete'
  data: T
  /**
   * CRDT metadata — present when the sender uses `fields` in
   * `realtimeCollectionOptions`. Receivers use this for correct per-field
   * convergence. Non-CRDT receivers can safely ignore it and read `data`.
   */
  _crdt?: CrdtMessageHeader
}

export interface RealtimeCollectionConfig<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
> {
  /**
   * The realtime client that manages the underlying transport.
   *
   * Required when using `channel`, `channels`, `fields`, or
   * `refetchOnReconnect`. Optional for server-only collections that
   * only use `queryFn` + mutation callbacks.
   */
  client?: RealtimeClient
  /** Collection id — must be unique across all collections. */
  id?: string
  /** Zod / Standard Schema for type validation. */
  schema?: TSchema
  /** Extract the primary key from a row. */
  getKey: (item: T) => TKey

  /**
   * The primary channel this collection subscribes to and publishes back to
   * after a successful mutation.
   *
   * Accepts a QueryKey array (serialized to a flat channel string) or a
   * pre-serialized channel string.
   *
   * When omitted (and `channels` is also omitted), the collection operates
   * in server-only mode: `queryFn` loads data, mutations persist via
   * `onInsert` / `onUpdate` / `onDelete`, and no peer sync occurs.
   * Add a channel to enable realtime peer sync.
   */
  channel?: QueryKey | string

  /**
   * Additional read-only channels to subscribe to.
   *
   * All messages from these channels are processed identically to the
   * primary `channel` (insert / update / delete). This is a fan-in pattern
   * for cases like geographic shards where the same logical collection is
   * spread across multiple channels.
   *
   * @example
   * realtimeCollectionOptions({
   *   client,
   *   channel: 'us-east:orders',           // primary (subscribe + publish-back)
   *   channels: ['eu:orders', 'ap:orders'], // fan-in (subscribe only)
   *   getKey: (o) => o.id,
   * })
   */
  channels?: Array<QueryKey | string>

  /**
   * Declare the convergence behaviour for individual fields.
   *
   * Without `fields`, incoming server values always overwrite local state
   * (last-write-wins). With `fields`, each listed field follows its CRDT
   * semantics — concurrent edits from multiple clients converge correctly
   * without data loss.
   *
   * ```ts
   * fields: {
   *   title:    'lww',        // Last-write-wins (Lamport clock, clientId tie-break)
   *   votes:    'pn-counter', // Concurrent increments always add up correctly
   *   tags:     'or-set',     // Concurrent add/remove never conflicts
   *   draft:    'local',      // Never sent or received — client-only UI state
   * }
   * ```
   *
   * Fields not listed here fall back to incoming-wins.
   *
   * **Mutations**: after `onInsert` / `onUpdate` succeed, the library
   * automatically infers the CRDT operation from the value delta and embeds
   * the correct CRDT state in the published message so other clients merge it
   * correctly — no extra work required.
   */
  fields?: CrdtFields<T>

  /**
   * Called on mount to populate the collection with initial data.
   * The promise resolves to an array of rows.
   */
  queryFn?: () => Promise<Array<T>>

  /**
   * When `true`, `queryFn` is automatically re-called after every reconnection
   * gap (any transition through `'disconnected'` or `'reconnecting'` followed
   * by `'connected'`). The results are diffed against the current collection
   * state so only changed rows produce insert / update / delete operations.
   *
   * @default false
   */
  refetchOnReconnect?: boolean

  /**
   * Transform a raw channel message into the standard
   * `{ action: 'insert' | 'update' | 'delete', data: T }` shape, or return
   * `null` / `undefined` to discard the message entirely.
   *
   * **When to use**: your server publishes messages in a format that differs
   * from `RealtimeChannelMessage<T>`. Common cases include Supabase
   * (`{ eventType: 'INSERT', new: T, old: T }`), Postgres logical replication
   * (`{ op: 'c' | 'u' | 'd', after: T }`), or any custom envelope.
   *
   * @example
   * onMessage: (raw) => {
   *   const e = raw as { eventType: string; new: Todo; old: Todo }
   *   if (e.eventType === 'INSERT') return { action: 'insert', data: e.new }
   *   if (e.eventType === 'UPDATE') return { action: 'update', data: e.new }
   *   if (e.eventType === 'DELETE') return { action: 'delete', data: e.old }
   *   return null
   * }
   */
  onMessage?: (raw: unknown) => RealtimeChannelMessage<T> | null | undefined

  /** Called after a local insert. Should persist to the server. */
  onInsert?: InsertMutationFn<T, TKey>
  /** Called after a local update. Should persist to the server. */
  onUpdate?: UpdateMutationFn<T, TKey>
  /** Called after a local delete. Should persist to the server. */
  onDelete?: DeleteMutationFn<T, TKey>
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type WriteOp<T, TKey> =
  | { type: 'insert' | 'update'; value: T }
  | { type: 'delete'; key: TKey }

interface RowEntry<T> {
  row: T
  crdt: CrdtRowState
}

// ---------------------------------------------------------------------------
// CRDT helpers
// ---------------------------------------------------------------------------

function initCrdtFromRow<T extends object>(
  row: T,
  fields: CrdtFields<T> | undefined,
): CrdtRowState {
  if (!fields) return {}
  const crdt: CrdtRowState = {}
  for (const [field, fieldType] of Object.entries(fields)) {
    const value = (row as Record<string, unknown>)[field]
    if (fieldType === 'lww') {
      crdt[field] = { clock: 0, clientId: '' } satisfies LwwState
    } else if (fieldType === 'pn-counter') {
      const num = typeof value === 'number' ? value : 0
      crdt[field] = {
        inc: num > 0 ? { __seed__: num } : {},
        dec: num < 0 ? { __seed__: -num } : {},
      } satisfies PnState
    } else if (fieldType === 'or-set') {
      crdt[field] = initOrFromArray(Array.isArray(value) ? value : [])
    }
    // 'local' fields need no CRDT state
  }
  return crdt
}

function stripLocalFields<T extends object>(
  row: T,
  fields: CrdtFields<T> | undefined,
): T {
  if (!fields) return row
  const stripped = { ...row } as Record<string, unknown>
  for (const [field, fieldType] of Object.entries(fields)) {
    if (fieldType === 'local') delete stripped[field]
  }
  return stripped as T
}

function mergeCrdtRow<T extends object>(
  prevEntry: RowEntry<T>,
  incoming: T,
  crdtHeader: CrdtMessageHeader | undefined,
  fields: CrdtFields<T>,
  clientId: string,
): RowEntry<T> {
  const result = { ...incoming } as Record<string, unknown>
  const prevRow = prevEntry.row as Record<string, unknown>
  const newCrdt: CrdtRowState = { ...prevEntry.crdt }

  for (const [field, fieldType] of Object.entries(fields)) {
    if (fieldType === 'local') {
      result[field] = prevRow[field]
      continue
    }

    if (fieldType === 'lww') {
      const prevState = prevEntry.crdt[field] as LwwState | undefined
      const wire = crdtHeader?.fields[field] as LwwWire | undefined
      if (wire) {
        advanceClock(wire.clock)
        if (!prevState || lwwWins(prevState, wire)) {
          result[field] = wire.value
          newCrdt[field] = {
            clock: wire.clock,
            clientId: wire.clientId,
          } satisfies LwwState
        } else {
          result[field] = prevRow[field]
        }
      } else {
        // No clock info — incoming wins, stamp with current clock.
        const clock = tickClock()
        result[field] = (incoming as Record<string, unknown>)[field]
        newCrdt[field] = { clock, clientId } satisfies LwwState
      }
      continue
    }

    if (fieldType === 'pn-counter') {
      const prevState: PnState = (prevEntry.crdt[field] as
        | PnState
        | undefined) ?? {
        inc: {},
        dec: {},
      }
      const wire = crdtHeader?.fields[field] as PnWire | undefined
      if (wire) {
        const merged = mergePn(prevState, wire)
        newCrdt[field] = merged
        result[field] = pnValue(merged)
      } else {
        // No CRDT header — cannot safely merge; preserve current value.
        result[field] = pnValue(prevState)
      }
      continue
    }

    if (fieldType === 'or-set') {
      const prevState: OrState = (prevEntry.crdt[field] as
        | OrState
        | undefined) ?? {
        entries: [],
      }
      const wire = crdtHeader?.fields[field] as OrWire | undefined
      if (wire) {
        const merged = mergeOr(prevState, wire)
        newCrdt[field] = merged
        result[field] = orValues(merged)
      } else {
        // No CRDT header — cannot safely merge; preserve current value.
        result[field] = orValues(prevState)
      }
      continue
    }
  }

  return { row: result as T, crdt: newCrdt }
}

/**
 * Build `_crdt.fields` for an outgoing mutation publish.
 * Infers CRDT operations from value deltas and updates stored CRDT state.
 */
function buildCrdtFields<T extends object>(
  entry: RowEntry<T>,
  result: T,
  fields: CrdtFields<T>,
  clientId: string,
): Record<string, LwwWire | PnWire | OrWire> {
  const crdtFields: Record<string, LwwWire | PnWire | OrWire> = {}
  const prevRow = entry.row as Record<string, unknown>
  const newRow = result as Record<string, unknown>

  for (const [field, fieldType] of Object.entries(fields)) {
    if (fieldType === 'local') continue

    if (fieldType === 'lww') {
      const clock = tickClock()
      crdtFields[field] = {
        type: 'lww',
        value: newRow[field],
        clock,
        clientId,
      } satisfies LwwWire
      entry.crdt[field] = { clock, clientId } satisfies LwwState
      continue
    }

    if (fieldType === 'pn-counter') {
      const prevState: PnState = (entry.crdt[field] as PnState | undefined) ?? {
        inc: {},
        dec: {},
      }
      const prevNum = typeof prevRow[field] === 'number' ? prevRow[field] : 0
      const newNum = typeof newRow[field] === 'number' ? newRow[field] : 0
      const delta = newNum - prevNum
      const newState =
        delta >= 0
          ? pnIncrement(prevState, clientId, delta)
          : pnDecrement(prevState, clientId, -delta)
      entry.crdt[field] = newState
      crdtFields[field] = {
        type: 'pn',
        inc: newState.inc,
        dec: newState.dec,
      } satisfies PnWire
      continue
    }

    if (fieldType === 'or-set') {
      const prevState: OrState = (entry.crdt[field] as OrState | undefined) ?? {
        entries: [],
      }
      const prevKeys = new Set(
        (Array.isArray(prevRow[field])
          ? (prevRow[field] as Array<unknown>)
          : []
        ).map((v) => JSON.stringify(v)),
      )
      const newKeys = new Set(
        (Array.isArray(newRow[field])
          ? (newRow[field] as Array<unknown>)
          : []
        ).map((v) => JSON.stringify(v)),
      )
      let newState = prevState
      for (const k of prevKeys) {
        if (!newKeys.has(k))
          newState = orRemove(newState, JSON.parse(k) as unknown)
      }
      for (const k of newKeys) {
        if (!prevKeys.has(k))
          newState = orAdd(newState, JSON.parse(k) as unknown)
      }
      entry.crdt[field] = newState
      crdtFields[field] = {
        type: 'or',
        entries: newState.entries,
      } satisfies OrWire
    }
  }

  return crdtFields
}

// ---------------------------------------------------------------------------
// realtimeCollectionOptions
// ---------------------------------------------------------------------------

/**
 * Creates a TanStack DB `CollectionConfig` with progressive realtime
 * capabilities. Start with server-only data, add realtime features one
 * config key at a time.
 *
 * **The spectrum** — each line adds a capability, nothing else changes:
 *
 * | Config                          | Behaviour                            |
 * |---------------------------------|--------------------------------------|
 * | `queryFn`                       | Server-only data loading             |
 * | `+ onInsert/Update/Delete`      | Server-persisted mutations            |
 * | `+ client + channel`            | Realtime peer sync                   |
 * | `+ fields`                      | Per-field CRDT convergence           |
 * | `+ refetchOnReconnect`          | Automatic gap recovery               |
 *
 * @example
 * // 1. Server-only — works without a realtime client
 * realtimeCollectionOptions({
 *   getKey: (t) => t.id,
 *   queryFn: () => fetchTodos(projectId),
 *   onInsert: async ({ transaction }) => createTodo(transaction.mutations[0].modified),
 * })
 *
 * @example
 * // 2. Add realtime peer sync — just add client + channel
 * realtimeCollectionOptions({
 *   client,
 *   getKey: (t) => t.id,
 *   channel: ['todos', { projectId }],
 *   queryFn: () => fetchTodos(projectId),
 *   onUpdate: async ({ transaction }) => updateTodo(transaction.mutations[0].modified),
 * })
 *
 * @example
 * // 3. Add CRDT convergence — just add fields
 * realtimeCollectionOptions({
 *   client,
 *   getKey: (t) => t.id,
 *   channel: ['todos', { projectId }],
 *   queryFn: () => fetchTodos(projectId),
 *   fields: {
 *     title:    'lww',        // last writer wins
 *     votes:    'pn-counter', // concurrent increments never lost
 *     tags:     'or-set',     // concurrent add/remove always correct
 *     draft:    'local',      // client-only, never synced
 *   },
 *   onUpdate: async ({ transaction }) => updateTodo(transaction.mutations[0].modified),
 * })
 */
export function realtimeCollectionOptions<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
>(
  config: RealtimeCollectionConfig<T, TKey, TSchema>,
): CollectionConfig<T, TKey, TSchema> {
  const {
    client,
    channel,
    channels: additionalChannels,
    fields,
    queryFn,
    refetchOnReconnect = false,
    onInsert,
    onUpdate,
    onDelete,
    onMessage,
    getKey,
    ...collectionConfig
  } = config

  const hasRealtimeFeatures =
    channel != null ||
    (additionalChannels != null && additionalChannels.length > 0) ||
    fields != null ||
    refetchOnReconnect

  if (hasRealtimeFeatures && !client) {
    throw new Error(
      '[realtimeCollectionOptions] `client` is required when using `channel`, `channels`, `fields`, or `refetchOnReconnect`.',
    )
  }

  const primaryChannel = channel
    ? typeof channel === 'string'
      ? channel
      : serializeKey(channel)
    : undefined

  const allChannels: Array<string> = [
    ...(primaryChannel ? [primaryChannel] : []),
    ...(additionalChannels ?? []).map((ch) =>
      typeof ch === 'string' ? ch : serializeKey(ch),
    ),
  ]

  // Per-row: derived plain row + per-field CRDT internal state.
  const syncedEntries = new Map<TKey, RowEntry<T>>()

  // ---------------------------------------------------------------------------
  // Message processing
  // ---------------------------------------------------------------------------

  function applyMessage(
    raw: unknown,
    write: (op: WriteOp<T, TKey>) => void,
  ): void {
    const msg: RealtimeChannelMessage<T> | null | undefined = onMessage
      ? onMessage(raw)
      : (raw as RealtimeChannelMessage<T>)

    if (!msg || typeof msg.action !== 'string') return

    if (msg.action === 'delete') {
      const key = getKey(msg.data)
      write({ type: 'delete', key })
      syncedEntries.delete(key)
      return
    }

    const incoming = msg.data
    const key = getKey(incoming)
    const existing = syncedEntries.get(key)

    if (!existing || !fields) {
      // First time we see this key, or no CRDT fields declared: seed from incoming.
      const crdt = initCrdtFromRow(incoming, fields)
      write({
        type: msg.action === 'insert' ? 'insert' : 'update',
        value: incoming,
      })
      syncedEntries.set(key, { row: incoming, crdt })
      return
    }

    const crdtHeader = (raw as Partial<RealtimeChannelMessage<T>>)._crdt
    // `fields` requires `client` (validated above), so client is guaranteed here.
    const merged = mergeCrdtRow(
      existing,
      incoming,
      crdtHeader,
      fields,
      client!.clientId,
    )
    write({ type: 'update', value: merged.row })
    syncedEntries.set(key, merged)
  }

  // ---------------------------------------------------------------------------
  // Sync config
  // ---------------------------------------------------------------------------

  const sync: SyncConfig<T, TKey> = {
    rowUpdateMode: 'full',

    sync({ begin, write, commit, markReady }) {
      let stopped = false
      const unsubs: Array<() => void> = []

      if (client) {
        for (const ch of allChannels) {
          const unsub = client.subscribe(ch, (raw) => {
            if (stopped) return
            begin({ immediate: true })
            applyMessage(raw, write)
            commit()
          })
          unsubs.push(unsub)
        }
      }

      if (queryFn) {
        queryFn()
          .then((rows) => {
            if (stopped) return
            begin()
            for (const row of rows) {
              write({ type: 'insert', value: row })
              syncedEntries.set(getKey(row), {
                row,
                crdt: initCrdtFromRow(row, fields),
              })
            }
            commit()
            markReady()
          })
          .catch((err) => {
            console.error('[realtime] queryFn error', err)
            markReady()
          })
      } else {
        markReady()
      }

      let statusSub: { unsubscribe: () => void } | null = null
      if (refetchOnReconnect && queryFn && client) {
        let wasGapped = false

        async function refetchFromServer(): Promise<void> {
          const rows = await queryFn!()
          if (stopped) return

          const newKeys = new Set(rows.map((r) => getKey(r)))

          begin()
          for (const row of rows) {
            const key = getKey(row)
            const existing = syncedEntries.get(key)

            if (existing && fields) {
              const merged = mergeCrdtRow(
                existing,
                row,
                undefined,
                fields,
                client!.clientId,
              )
              write({ type: 'update', value: merged.row })
              syncedEntries.set(key, merged)
            } else {
              const crdt = initCrdtFromRow(row, fields)
              write({ type: existing ? 'update' : 'insert', value: row })
              syncedEntries.set(key, { row, crdt })
            }
          }

          const staleKeys = [...syncedEntries.keys()].filter(
            (k) => !newKeys.has(k),
          )
          for (const key of staleKeys) {
            write({ type: 'delete', key })
            syncedEntries.delete(key)
          }
          commit()
        }

        statusSub = client.store.subscribe(({ status }) => {
          if (status === 'reconnecting' || status === 'disconnected')
            wasGapped = true
          if (status === 'connected' && wasGapped) {
            wasGapped = false
            if (!stopped) {
              refetchFromServer().catch((err) => {
                console.error('[realtime] refetchOnReconnect error', err)
              })
            }
          }
        })
      }

      return () => {
        stopped = true
        statusSub?.unsubscribe()
        for (const unsub of unsubs) unsub()
        syncedEntries.clear()
      }
    },
  }

  // ---------------------------------------------------------------------------
  // Mutation wrappers
  // ---------------------------------------------------------------------------

  const wrappedOnInsert: InsertMutationFn<T, TKey> | undefined = onInsert
    ? async (params) => {
        const result = await onInsert(params)
        if (result != null) {
          const key = getKey(result)
          const entry: RowEntry<T> = {
            row: result,
            crdt: initCrdtFromRow(result, fields),
          }
          syncedEntries.set(key, entry)

          if (primaryChannel && client) {
            const crdtFields = fields
              ? buildCrdtFields(entry, result, fields, client.clientId)
              : {}
            await client.publish(primaryChannel, {
              action: 'insert',
              data: stripLocalFields(result, fields),
              ...(Object.keys(crdtFields).length > 0 && {
                _crdt: { fields: crdtFields },
              }),
            } satisfies RealtimeChannelMessage)
          }
        }
        return result
      }
    : undefined

  const wrappedOnUpdate: UpdateMutationFn<T, TKey> | undefined = onUpdate
    ? async (params) => {
        const result = await onUpdate(params)
        if (result != null) {
          const key = getKey(result)
          const entry: RowEntry<T> = syncedEntries.get(key) ?? {
            row: result,
            crdt: initCrdtFromRow(result, fields),
          }
          syncedEntries.set(key, entry)

          if (primaryChannel && client) {
            const crdtFields = fields
              ? buildCrdtFields(entry, result, fields, client.clientId)
              : {}
            entry.row = result
            await client.publish(primaryChannel, {
              action: 'update',
              data: stripLocalFields(result, fields),
              ...(Object.keys(crdtFields).length > 0 && {
                _crdt: { fields: crdtFields },
              }),
            } satisfies RealtimeChannelMessage)
          }
        }
        return result
      }
    : undefined

  const wrappedOnDelete: DeleteMutationFn<T, TKey> | undefined = onDelete
    ? async (params) => {
        const result = await onDelete(params)
        if (result != null) {
          syncedEntries.delete(getKey(result))

          if (primaryChannel && client) {
            await client.publish(primaryChannel, {
              action: 'delete',
              data: result,
            } satisfies RealtimeChannelMessage)
          }
        }
        return result
      }
    : undefined

  return {
    ...collectionConfig,
    getKey,
    sync,
    ...(wrappedOnInsert && { onInsert: wrappedOnInsert }),
    ...(wrappedOnUpdate && { onUpdate: wrappedOnUpdate }),
    ...(wrappedOnDelete && { onDelete: wrappedOnDelete }),
  }
}
