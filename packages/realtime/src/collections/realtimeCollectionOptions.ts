import type {
  CollectionConfig,
  InsertMutationFn,
  UpdateMutationFn,
  DeleteMutationFn,
  SyncConfig,
} from '@tanstack/db'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { RealtimeClient, QueryKey } from '../core/types.js'
import { serializeKey } from '../core/serializeKey.js'

/** Shape of messages published to / received from a realtime channel. */
export interface RealtimeChannelMessage<T = unknown> {
  action: 'insert' | 'update' | 'delete'
  data: T
}

export interface RealtimeCollectionConfig<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
> {
  /** The realtime client that manages the underlying transport. */
  client: RealtimeClient
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
   * At least one of `channel` or `channels` must be provided.
   */
  channel?: QueryKey | string

  /**
   * Additional read-only channels to subscribe to.
   *
   * All messages from these channels are processed identically to the
   * primary `channel` (insert / update / delete). This is a fan-in pattern
   * for cases like geographic shards where the same logical collection is
   * spread across multiple channels:
   *
   * @example
   * realtimeCollectionOptions({
   *   client,
   *   channel: 'us-east:orders',           // primary (subscribe + publish-back)
   *   channels: ['eu:orders', 'ap:orders'], // fan-in (subscribe only)
   *   getKey: (o) => o.id,
   * })
   *
   * Cross-collection joins (e.g. orders + inventory) belong at the query
   * layer — compose two `useLiveQuery` results in the component instead.
   */
  channels?: Array<QueryKey | string>

  /**
   * Resolve conflicts when an incoming server value targets a row that
   * already exists in the synced collection state.
   *
   * - `previous`: the last value this sync layer confirmed for that key.
   * - `incoming`: the new value arriving from the server/channel.
   *
   * Return the value to write into the collection. If omitted, the incoming
   * server value always wins (last-write-wins / remote-wins default).
   *
   * @example
   * // Preserve a locally-relevant derived field while accepting server state
   * merge: (prev, next) => ({ ...next, localTag: prev.localTag })
   *
   * // Three-way merge: apply the server's changes onto the previous baseline
   * merge: (prev, next) => ({
   *   ...next,
   *   title: next.updatedAt > prev.updatedAt ? next.title : prev.title,
   * })
   */
  merge?: (previous: T, incoming: T) => T

  /**
   * Called on mount to populate the collection with initial data.
   * The promise resolves to an array of rows.
   */
  queryFn?: () => Promise<T[]>

  /** Called after a local insert. Should persist to the server. */
  onInsert?: InsertMutationFn<T, TKey>
  /** Called after a local update. Should persist to the server. */
  onUpdate?: UpdateMutationFn<T, TKey>
  /** Called after a local delete. Should persist to the server. */
  onDelete?: DeleteMutationFn<T, TKey>
}

/**
 * Creates a TanStack DB `CollectionConfig` backed by one or more realtime
 * channels.
 *
 * The collection:
 * 1. Loads initial data via `queryFn` when it first activates.
 * 2. Subscribes to the primary `channel` (and any additional `channels`) for
 *    live inserts / updates / deletes from other clients.
 * 3. After `onInsert` / `onUpdate` / `onDelete` succeed, publishes the result
 *    back to the **primary** channel so other clients receive it.
 * 4. When `merge` is provided, incoming server values for keys the collection
 *    already holds are merged rather than overwritten, enabling conflict
 *    resolution between concurrent edits.
 *
 * @example
 * // Single channel with conflict-aware merge
 * export const todosCollection = createCollection(
 *   realtimeCollectionOptions({
 *     client,
 *     id: 'todos',
 *     schema: todoSchema,
 *     getKey: (t) => t.id,
 *     channel: ['todos', { projectId: '123' }],
 *     queryFn: () => getTodos({ data: { projectId: '123' } }),
 *     merge: (prev, next) => ({ ...next, localDraft: prev.localDraft }),
 *     onInsert: async ({ transaction }) =>
 *       addTodo({ data: transaction.mutations[0].modified }),
 *   })
 * )
 *
 * @example
 * // Geographic shard fan-in — all regions in one collection
 * export const ordersCollection = createCollection(
 *   realtimeCollectionOptions({
 *     client,
 *     channel: 'us-east:orders',
 *     channels: ['eu:orders', 'ap:orders'],
 *     getKey: (o) => o.id,
 *   })
 * )
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
    merge,
    queryFn,
    onInsert,
    onUpdate,
    onDelete,
    ...collectionConfig
  } = config

  if (!channel && (!additionalChannels || additionalChannels.length === 0)) {
    throw new Error(
      '[realtimeCollectionOptions] At least one of `channel` or `channels` must be provided.',
    )
  }

  // The primary channel is used for both subscribe and publish-back.
  const primaryChannel = channel
    ? typeof channel === 'string'
      ? channel
      : serializeKey(channel)
    : undefined

  // Full set of subscribe channels: primary + additional fan-in.
  const allChannels: string[] = [
    ...(primaryChannel ? [primaryChannel] : []),
    ...(additionalChannels ?? []).map((ch) =>
      typeof ch === 'string' ? ch : serializeKey(ch),
    ),
  ]

  // Track the last confirmed value per key so merge() can receive it.
  // This is closure-scoped so multiple sync restarts share the same map.
  const syncedValues = new Map<TKey, T>()

  /**
   * Process one raw channel message inside an open sync transaction.
   * Caller must wrap in begin() / commit().
   */
  function applyMessage(
    raw: unknown,
    write: (op: { type: 'insert' | 'update' | 'delete'; value?: T; key?: TKey }) => void,
  ): void {
    const msg = raw as RealtimeChannelMessage<T>
    if (!msg || typeof msg.action !== 'string') return

    if (msg.action === 'delete') {
      const key = config.getKey(msg.data as T)
      write({ type: 'delete', key })
      syncedValues.delete(key)
    } else {
      const incoming = msg.data as T
      const key = config.getKey(incoming)
      const previous = syncedValues.get(key)

      const value =
        merge && previous !== undefined ? merge(previous, incoming) : incoming

      write({ type: msg.action === 'insert' ? 'insert' : 'update', value })
      syncedValues.set(key, value)
    }
  }

  const sync: SyncConfig<T, TKey> = {
    // Full row updates — the channel publishes complete rows, not diffs.
    rowUpdateMode: 'full',

    sync({ begin, write, commit, markReady }) {
      let stopped = false
      const unsubs: Array<() => void> = []

      // Subscribe to all channels (primary + fan-in).
      for (const ch of allChannels) {
        const unsub = client.subscribe(ch, (raw) => {
          if (stopped) return
          begin({ immediate: true })
          applyMessage(raw, write)
          commit()
        })
        unsubs.push(unsub)
      }

      // Load initial data.
      if (queryFn) {
        queryFn()
          .then((rows) => {
            if (stopped) return
            begin()
            for (const row of rows) {
              write({ type: 'insert', value: row })
              syncedValues.set(config.getKey(row), row)
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

      return () => {
        stopped = true
        for (const unsub of unsubs) unsub()
      }
    },
  }

  // ---------------------------------------------------------------------------
  // Mutation wrappers — publish result to primary channel after success.
  // ---------------------------------------------------------------------------

  const wrappedOnInsert: InsertMutationFn<T, TKey> | undefined = onInsert
    ? async (params) => {
        const result = await onInsert(params)
        if (result != null && primaryChannel) {
          syncedValues.set(config.getKey(result), result)
          await client.publish(primaryChannel, {
            action: 'insert',
            data: result,
          } satisfies RealtimeChannelMessage)
        }
        return result
      }
    : undefined

  const wrappedOnUpdate: UpdateMutationFn<T, TKey> | undefined = onUpdate
    ? async (params) => {
        const result = await onUpdate(params)
        if (result != null && primaryChannel) {
          syncedValues.set(config.getKey(result), result)
          await client.publish(primaryChannel, {
            action: 'update',
            data: result,
          } satisfies RealtimeChannelMessage)
        }
        return result
      }
    : undefined

  const wrappedOnDelete: DeleteMutationFn<T, TKey> | undefined = onDelete
    ? async (params) => {
        const result = await onDelete(params)
        if (result != null && primaryChannel) {
          syncedValues.delete(config.getKey(result))
          await client.publish(primaryChannel, {
            action: 'delete',
            data: result,
          } satisfies RealtimeChannelMessage)
        }
        return result
      }
    : undefined

  return {
    ...collectionConfig,
    sync,
    ...(wrappedOnInsert && { onInsert: wrappedOnInsert }),
    ...(wrappedOnUpdate && { onUpdate: wrappedOnUpdate }),
    ...(wrappedOnDelete && { onDelete: wrappedOnDelete }),
  }
}
