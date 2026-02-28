import { serializeKey } from './serializeKey.js'
import type {
  DeleteMutationFn,
  InsertMutationFn,
  UpdateMutationFn,
} from '@tanstack/db'
import type { QueryKey } from './types.js'
import type { PublishFn } from '../server/index.js'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * A TanStack Start server function (or any async function that runs on the
 * server). The library does not import `@tanstack/start` — any function
 * matching this shape works.
 */
export type ServerMutationFn<T> = (args: { data: unknown }) => Promise<T>

export interface WithServerFnOptions<
  T extends object,
  TKey extends string | number,
> {
  /** Extract the primary key from a row. */
  getKey: (item: T) => TKey

  /**
   * Fetch initial data. Runs on the client, exactly like `withRest`'s queryFn.
   *
   * You can also supply a TanStack Start server function here — all that
   * matters is that it returns `Promise<T[]>`.
   */
  queryFn: () => Promise<Array<T>>

  /**
   * The channel this collection publishes to. Must match the channel passed
   * to `realtimeCollectionOptions` so the server publishes to the same key.
   */
  channel: QueryKey | string

  /**
   * Server-side publish function from your preset.
   *
   * @example
   * import { nodeServer } from './realtime.server'
   * publish: (ch, data) => { nodeServer.publish(ch, data); return Promise.resolve() }
   */
  publish: PublishFn

  /**
   * Server function called for inserts. Receives the row data, should
   * validate, persist, and return the saved row. The library will call
   * `publish` with the result automatically.
   */
  onInsert: ServerMutationFn<T>

  /**
   * Server function called for updates. Receives the row data, should
   * validate, persist, and return the updated row.
   */
  onUpdate: ServerMutationFn<T>

  /**
   * Server function called for deletes. Receives the row data, should
   * delete the record and return the deleted row (for broadcast).
   */
  onDelete?: ServerMutationFn<T>
}

// ---------------------------------------------------------------------------
// withServerFn
// ---------------------------------------------------------------------------

/**
 * Generate `{ getKey, queryFn, onInsert, onUpdate, onDelete, serverPublish }`
 * that wire TanStack Start server functions (or any async server-side
 * handlers) to `realtimeCollectionOptions`.
 *
 * Each mutation is validated and persisted by the server function, then
 * the result is published to the channel server-side — the client never
 * touches the channel for writes.
 *
 * Spread the result into `realtimeCollectionOptions`:
 *
 * ```ts
 * import { withServerFn, realtimeCollectionOptions } from '@tanstack/realtime'
 * import { insertTask, updateTask, deleteTask } from './functions/tasks'
 * import { nodeServer } from './server/realtime'
 *
 * const tasksOptions = (projectId: string) =>
 *   realtimeCollectionOptions({
 *     ...withServerFn<Task, string>({
 *       getKey: (t) => t.id,
 *       queryFn: () => fetch('/api/tasks').then((r) => r.json()),
 *       channel: ['tasks', { projectId }],
 *       publish: (ch, data) => {
 *         nodeServer.publish(
 *           typeof ch === 'string' ? ch : serializeKey(ch),
 *           data,
 *         )
 *         return Promise.resolve()
 *       },
 *       onInsert: insertTask,
 *       onUpdate: updateTask,
 *       onDelete: deleteTask,
 *     }),
 *     client: realtimeClient,
 *     channel: ['tasks', { projectId }],
 *   })
 * ```
 *
 * **Key difference from `withRest`**: `withRest` publishes from the client
 * after the REST call succeeds. `withServerFn` publishes from the server
 * inside the mutation, and sets `serverPublish: true` so the client's
 * auto-publish is suppressed.
 */
export function withServerFn<T extends object, TKey extends string | number>(
  options: WithServerFnOptions<T, TKey>,
): {
  getKey: (item: T) => TKey
  queryFn: () => Promise<Array<T>>
  onInsert: InsertMutationFn<T, TKey>
  onUpdate: UpdateMutationFn<T, TKey>
  onDelete: DeleteMutationFn<T, TKey> | undefined
  serverPublish: true
} {
  const { getKey, queryFn, channel, publish, onInsert, onUpdate, onDelete } =
    options

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  return {
    getKey,
    queryFn,

    // The library signals that the server handles the publish.
    serverPublish: true as const,

    onInsert: async ({ transaction }) => {
      const data = transaction.mutations[0].modified
      const result = await onInsert({ data })
      // Server function returned the persisted row — now broadcast it.
      await publish(serializedChannel, { action: 'insert', data: result })
      return result
    },

    onUpdate: async ({ transaction }) => {
      const data = transaction.mutations[0].modified
      const result = await onUpdate({ data })
      await publish(serializedChannel, { action: 'update', data: result })
      return result
    },

    onDelete: onDelete
      ? async ({ transaction }) => {
          const data = transaction.mutations[0].modified
          const result = await onDelete({ data })
          await publish(serializedChannel, { action: 'delete', data: result })
          return result
        }
      : undefined,
  }
}
