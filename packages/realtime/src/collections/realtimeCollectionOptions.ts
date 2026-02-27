import { serializeKey } from '../core/serializeKey.js'
import {
  advanceClock,
  compactOr,
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
  /**
   * Client-generated nonce for echo suppression. Present only when the
   * sender uses `optimistic: true`. The receiving client checks this +
   * `_clientId` to skip processing messages it originated itself.
   */
  _nonce?: string
  /**
   * Client ID of the originator. Used together with `_nonce` for echo
   * suppression in optimistic mode.
   */
  _clientId?: string
}

export interface RealtimeCollectionConfig<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = never,
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

  /**
   * When `true`, published messages from this client include `_nonce` and
   * `_clientId` fields. When such messages are echoed back from the channel,
   * they are suppressed (not applied twice).
   *
   * This works with TanStack DB's built-in optimistic transaction system:
   * - The mutation callback runs asynchronously
   * - If the callback rejects, TanStack DB rolls back the optimistic state
   * - The publish-back happens after the callback succeeds
   * - Echo suppression prevents double-application
   *
   * @default false
   */
  optimistic?: boolean

  /**
   * Called when an optimistic mutation fails (the `onInsert`/`onUpdate`/
   * `onDelete` callback throws). Useful for showing toast notifications.
   *
   * Only relevant when `optimistic: true`. TanStack DB handles the actual
   * rollback automatically — this callback is for UI feedback only.
   */
  onOptimisticError?: (params: {
    action: 'insert' | 'update' | 'delete'
    key: TKey
    error: unknown
  }) => void

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
        const merged = compactOr(mergeOr(prevState, wire))
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
  TSchema extends StandardSchemaV1 = never,
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
    optimistic = false,
    onOptimisticError,
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

  // Echo suppression: track nonces of in-flight optimistic operations.
  // When we receive a message with a matching _clientId + _nonce, we skip it.
  let nonceCounter = 0
  const pendingNonces = new Set<string>()

  function generateNonce(): string {
    return `${client?.clientId ?? 'unknown'}-${++nonceCounter}`
  }

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

    // Echo suppression: if this message originated from us (optimistic mode),
    // skip it to prevent double-application. The optimistic state was already
    // applied by TanStack DB's transaction system.
    if (optimistic && msg._nonce && msg._clientId === client?.clientId) {
      if (pendingNonces.has(msg._nonce)) {
        pendingNonces.delete(msg._nonce)
        return
      }
    }

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

  function buildPublishMessage(
    action: 'insert' | 'update' | 'delete',
    data: T,
    entry: RowEntry<T> | undefined,
    nonce: string | undefined,
  ): RealtimeChannelMessage {
    const crdtFields =
      entry && fields
        ? buildCrdtFields(entry, data, fields, client!.clientId)
        : {}
    return {
      action,
      data: stripLocalFields(data, fields),
      ...(Object.keys(crdtFields).length > 0 && {
        _crdt: { fields: crdtFields },
      }),
      ...(nonce && { _nonce: nonce, _clientId: client!.clientId }),
    }
  }

  const wrappedOnInsert: InsertMutationFn<T, TKey> | undefined = onInsert
    ? async (params) => {
        const nonce = optimistic ? generateNonce() : undefined
        if (nonce) pendingNonces.add(nonce)

        let result: T | null | undefined
        try {
          result = await onInsert(params)
        } catch (err) {
          if (nonce) pendingNonces.delete(nonce)
          if (onOptimisticError) {
            const key =
              params.transaction.mutations[0].key as TKey
            onOptimisticError({ action: 'insert', key, error: err })
          }
          throw err
        }

        if (result != null) {
          const key = getKey(result)
          const entry: RowEntry<T> = {
            row: result,
            crdt: initCrdtFromRow(result, fields),
          }
          syncedEntries.set(key, entry)

          if (primaryChannel && client) {
            try {
              await client.publish(
                primaryChannel,
                buildPublishMessage('insert', result, entry, nonce),
              )
            } catch {
              // Publish failed after mutation succeeded. Clean up the nonce
              // to prevent it from leaking in pendingNonces forever.
              if (nonce) pendingNonces.delete(nonce)
            }
          }
        } else if (nonce) {
          pendingNonces.delete(nonce)
        }
        return result
      }
    : undefined

  const wrappedOnUpdate: UpdateMutationFn<T, TKey> | undefined = onUpdate
    ? async (params) => {
        const nonce = optimistic ? generateNonce() : undefined
        if (nonce) pendingNonces.add(nonce)

        let result: T | null | undefined
        try {
          result = await onUpdate(params)
        } catch (err) {
          if (nonce) pendingNonces.delete(nonce)
          if (onOptimisticError) {
            const key =
              params.transaction.mutations[0].key as TKey
            onOptimisticError({ action: 'update', key, error: err })
          }
          throw err
        }

        if (result != null) {
          const key = getKey(result)
          const entry: RowEntry<T> = syncedEntries.get(key) ?? {
            row: result,
            crdt: initCrdtFromRow(result, fields),
          }
          syncedEntries.set(key, entry)

          if (primaryChannel && client) {
            // buildPublishMessage calls buildCrdtFields which reads entry.row
            // as the previous state for delta computation. We must NOT update
            // entry.row until after the message is built.
            const msg = buildPublishMessage('update', result, entry, nonce)
            entry.row = result
            try {
              await client.publish(primaryChannel, msg)
            } catch {
              if (nonce) pendingNonces.delete(nonce)
            }
          }
        } else if (nonce) {
          pendingNonces.delete(nonce)
        }
        return result
      }
    : undefined

  const wrappedOnDelete: DeleteMutationFn<T, TKey> | undefined = onDelete
    ? async (params) => {
        const nonce = optimistic ? generateNonce() : undefined
        if (nonce) pendingNonces.add(nonce)

        let result: T | null | undefined
        try {
          result = await onDelete(params)
        } catch (err) {
          if (nonce) pendingNonces.delete(nonce)
          if (onOptimisticError) {
            const key =
              params.transaction.mutations[0].key as TKey
            onOptimisticError({ action: 'delete', key, error: err })
          }
          throw err
        }

        if (result != null) {
          syncedEntries.delete(getKey(result))

          if (primaryChannel && client) {
            try {
              await client.publish(
                primaryChannel,
                buildPublishMessage('delete', result, undefined, nonce),
              )
            } catch {
              if (nonce) pendingNonces.delete(nonce)
            }
          }
        } else if (nonce) {
          pendingNonces.delete(nonce)
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
