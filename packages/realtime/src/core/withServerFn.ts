import type {
  DeleteMutationFn,
  InsertMutationFn,
  UpdateMutationFn,
} from '@tanstack/db'

// ---------------------------------------------------------------------------
// withServerFn
// ---------------------------------------------------------------------------

/**
 * Adapts plain async server functions to the TanStack DB mutation callback
 * signature, and sets `serverPublish: true` so the library does not also
 * call `client.publish()` after each mutation.
 *
 * The server function is responsible for calling `nodeServer.publish()` itself.
 * `withServerFn` does **not** call publish — it cannot, because `nodeServer` is
 * a server-only module that cannot be imported in client code.
 *
 * ## Correct usage
 *
 * ```ts
 * // app/functions/tasks.ts  — server-only, can import nodeServer
 * import { createServerFn } from '@tanstack/start'
 * import { nodeServer } from '../server/realtime'
 * import { serializeKey } from '@tanstack/realtime'
 *
 * export const insertTask = createServerFn({ method: 'POST' })
 *   .validator(taskSchema)
 *   .handler(async ({ data }) => {
 *     const task = await db.tasks.create({ data: { ...data, createdBy: ctx.userId } })
 *     // publish happens server-side, inside the server function
 *     nodeServer.publish(
 *       serializeKey(['tasks', { projectId: task.projectId }]),
 *       { action: 'insert', data: task },
 *     )
 *     return task
 *   })
 *
 * // app/collections/tasks.ts  — client or isomorphic
 * import { withServerFn, realtimeCollectionOptions } from '@tanstack/realtime'
 * import { insertTask, updateTask, deleteTask } from '../functions/tasks'
 *
 * const tasksOptions = (projectId: string) =>
 *   realtimeCollectionOptions({
 *     ...withServerFn({
 *       getKey: (t: Task) => t.id,
 *       queryFn: () => fetch(`/api/tasks?projectId=${projectId}`).then(r => r.json()),
 *       onInsert: (data) => insertTask({ data }),
 *       onUpdate: (data) => updateTask({ data }),
 *       onDelete: (data) => deleteTask({ data }),
 *     }),
 *     client: realtimeClient,
 *     channel: ['tasks', { projectId }],
 *     // serverPublish: true is set automatically by withServerFn
 *   })
 * ```
 *
 * ## What it does
 *
 * - Adapts `(data: T) => Promise<T>` to TanStack DB's
 *   `({ transaction }) => Promise<T>` callback shape.
 * - Sets `serverPublish: true` to suppress the library's automatic
 *   `client.publish()` call (the server function already published).
 *
 * ## Security
 *
 * The primary security boundary is the server's `authorize` callback:
 * set `publish: false` for channels whose data is persisted. Even without
 * `serverPublish: true`, a client cannot broadcast to a channel that denies
 * publish access. `serverPublish: true` is an optimization — it avoids an
 * unnecessary rejected round-trip.
 *
 * ## Framework agnostic
 *
 * Any plain async function works: TanStack Start `createServerFn`, an HTTP
 * fetch to your own API, a tRPC mutation, a Hono route handler, etc. The
 * library does not import `@tanstack/start`.
 */
export function withServerFn<T extends object, TKey extends string | number>(options: {
  /** Extract the primary key from a row. */
  getKey: (item: T) => TKey

  /**
   * Fetch initial data. Any async function returning `T[]` — a server
   * function, a plain fetch, etc.
   */
  queryFn: () => Promise<Array<T>>

  /**
   * Called on insert. Should validate, persist, publish (via nodeServer),
   * and return the saved row.
   */
  onInsert?: (data: T) => Promise<T | null | undefined>

  /**
   * Called on update. Should validate, persist, publish (via nodeServer),
   * and return the updated row.
   */
  onUpdate?: (data: T) => Promise<T | null | undefined>

  /**
   * Called on delete. Should delete the record, publish (via nodeServer),
   * and return the deleted row.
   */
  onDelete?: (data: T) => Promise<T | null | undefined>
}): {
  getKey: (item: T) => TKey
  queryFn: () => Promise<Array<T>>
  onInsert: InsertMutationFn<T, TKey> | undefined
  onUpdate: UpdateMutationFn<T, TKey> | undefined
  onDelete: DeleteMutationFn<T, TKey> | undefined
  serverPublish: true
} {
  const { getKey, queryFn, onInsert, onUpdate, onDelete } = options

  return {
    getKey,
    queryFn,
    serverPublish: true as const,

    onInsert: onInsert
      ? async ({ transaction }) => {
          return onInsert(transaction.mutations[0].modified as T)
        }
      : undefined,

    onUpdate: onUpdate
      ? async ({ transaction }) => {
          return onUpdate(transaction.mutations[0].modified as T)
        }
      : undefined,

    onDelete: onDelete
      ? async ({ transaction }) => {
          return onDelete(transaction.mutations[0].modified as T)
        }
      : undefined,
  }
}
