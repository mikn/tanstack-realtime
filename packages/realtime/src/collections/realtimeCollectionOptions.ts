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

/** Shape of messages published to / received from the realtime channel. */
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
   * The channel this collection subscribes to.
   * Accepts a QueryKey array (serialized to a flat channel string)
   * or a pre-serialized channel string.
   */
  channel: QueryKey | string
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
 * Creates a TanStack DB `CollectionConfig` backed by a realtime channel.
 *
 * The collection:
 * 1. Loads initial data via `queryFn` when it first activates.
 * 2. Subscribes to the channel for live inserts/updates/deletes from other clients.
 * 3. After `onInsert` / `onUpdate` / `onDelete` succeed, publishes the result
 *    to the channel so other clients receive it.
 *
 * @example
 * export const todosCollection = createCollection(
 *   realtimeCollectionOptions({
 *     client: realtimeClient,
 *     id: 'todos',
 *     schema: todoSchema,
 *     getKey: (item) => item.id,
 *     channel: ['todos', { projectId: '123' }],
 *     queryFn: () => getTodos({ data: { projectId: '123' } }),
 *     onInsert: async ({ transaction }) => {
 *       return await addTodo({ data: transaction.mutations[0].modified })
 *     },
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
    queryFn,
    onInsert,
    onUpdate,
    onDelete,
    ...collectionConfig
  } = config

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const sync: SyncConfig<T, TKey> = {
    // Full row updates — the channel publishes complete rows, not diffs.
    rowUpdateMode: 'full',

    sync({ begin, write, commit, markReady }) {
      let stopped = false

      // Subscribe to incoming channel messages from other clients.
      const unsub = client.subscribe(serializedChannel, (raw) => {
        if (stopped) return
        const msg = raw as RealtimeChannelMessage<T>
        if (!msg || typeof msg.action !== 'string') return

        begin({ immediate: true })
        if (msg.action === 'delete') {
          // Deletes supply only the key; value comes from the existing row.
          write({ type: 'delete', key: config.getKey(msg.data as T) })
        } else {
          // Inserts/updates supply the full value; key is derived by getKey.
          write({
            type: msg.action === 'insert' ? 'insert' : 'update',
            value: msg.data as T,
          })
        }
        commit()
      })

      // Load initial data.
      if (queryFn) {
        queryFn()
          .then((rows) => {
            if (stopped) return
            begin()
            for (const row of rows) {
              write({ type: 'insert', value: row })
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
        unsub()
      }
    },
  }

  // Wrap mutation handlers to publish results to the channel after success.
  const wrappedOnInsert: InsertMutationFn<T, TKey> | undefined = onInsert
    ? async (params) => {
        const result = await onInsert(params)
        if (result != null) {
          await client.publish(serializedChannel, {
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
        if (result != null) {
          await client.publish(serializedChannel, {
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
        if (result != null) {
          await client.publish(serializedChannel, {
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
