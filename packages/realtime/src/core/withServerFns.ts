import type {
  DeleteMutationFn,
  InsertMutationFn,
  UpdateMutationFn,
} from '@tanstack/db'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface WithServerFnsOptions<
  T extends object,
  TKey extends string | number,
> {
  /**
   * Fetches the initial list of rows for `queryFn`.
   *
   * Must be a thunk — capture any filter parameters via closure so the
   * function itself takes no arguments.
   *
   * In TanStack Start this is the call-site of a `createServerFn`, not the
   * `createServerFn` definition itself (which must remain at module level).
   *
   * @example
   * query: () => fetchTodos({ data: { projectId } })
   */
  query: () => Promise<Array<T>>

  /**
   * Persists a newly inserted row. Must return the saved row as stored by
   * the server (with any server-assigned fields such as `id` or `createdAt`).
   *
   * The returned value is automatically published to the channel by
   * `realtimeCollectionOptions` — no manual `publish()` call needed.
   *
   * @example
   * insert: createTodo  // (args: { data: NewTodo }) => Promise<Todo>
   */
  insert: (args: { data: T }) => Promise<T | null | undefined>

  /**
   * Persists an updated row. Must return the saved row.
   *
   * The returned value is automatically published to the channel.
   *
   * @example
   * update: updateTodo  // (args: { data: Todo }) => Promise<Todo>
   */
  update: (args: { data: T }) => Promise<T | null | undefined>

  /**
   * Deletes a row. Return value is ignored.
   *
   * @example
   * delete: deleteTodo  // (args: { data: Todo }) => Promise<void>
   */
  delete: (args: { data: T }) => Promise<unknown>

  /**
   * Extract the primary key from a row.
   *
   * Defaults to `(item) => (item as any).id` — override when your primary
   * key field is named differently or is a number.
   *
   * @example
   * getKey: (t) => t.todoId
   */
  getKey?: (item: T) => TKey
}

// ---------------------------------------------------------------------------
// withServerFns
// ---------------------------------------------------------------------------

/**
 * Generates `{ getKey, queryFn, onInsert, onUpdate, onDelete }` from a set of
 * async functions (typically TanStack Start `createServerFn` callables), ready
 * to spread into `realtimeCollectionOptions`.
 *
 * This is the server-function equivalent of `withRest` — use it when your
 * persistence layer is reached via server functions rather than REST endpoints.
 *
 * The `transaction.mutations[0].modified` unwrapping is handled internally so
 * your server functions receive a plain `{ data: T }` argument, matching the
 * standard `createServerFn` calling convention.
 *
 * ```ts
 * // server/todos.ts  (module level — required by the Start bundler plugin)
 * export const fetchTodos = createServerFn()
 *   .handler(({ data }: { data: { projectId: string } }) =>
 *     db.select().from(todos).where(eq(todos.projectId, data.projectId))
 *   )
 * export const createTodo = createServerFn({ method: 'POST' })
 *   .handler(({ data }: { data: NewTodo }) =>
 *     db.insert(todos).values(data).returning().then((r) => r[0])
 *   )
 * export const updateTodo = createServerFn({ method: 'POST' })
 *   .handler(({ data }: { data: Todo }) =>
 *     db.update(todos).set(data).where(eq(todos.id, data.id)).returning().then((r) => r[0])
 *   )
 * export const deleteTodo = createServerFn({ method: 'POST' })
 *   .handler(({ data }: { data: Todo }) =>
 *     db.delete(todos).where(eq(todos.id, data.id))
 *   )
 *
 * // features/todos/collection.ts
 * import { withServerFns, realtimeCollectionOptions } from '@tanstack/realtime'
 * import { fetchTodos, createTodo, updateTodo, deleteTodo } from '../../server/todos'
 *
 * const todosOptions = (projectId: string) =>
 *   realtimeCollectionOptions({
 *     ...withServerFns({
 *       query: () => fetchTodos({ data: { projectId } }),
 *       insert: createTodo,
 *       update: updateTodo,
 *       delete: deleteTodo,
 *     }),
 *     client: realtimeClient,
 *     channel: ['todos', { projectId }],
 *   })
 * ```
 *
 * **How broadcast works**
 *
 * By default (no `serverAuthoritative: true`), `realtimeCollectionOptions`
 * automatically publishes the value returned by each callback to the channel.
 * Your server functions just need to return the saved row — no manual
 * `publish()` call is needed anywhere.
 *
 * If your server functions call `realtimePublish` themselves, add
 * `serverAuthoritative: true` to the spread to prevent the client from
 * publishing a duplicate.
 */
export function withServerFns<
  T extends object,
  TKey extends string | number = string,
>(
  options: WithServerFnsOptions<T, TKey>,
): {
  getKey: (item: T) => TKey
  queryFn: () => Promise<Array<T>>
  onInsert: InsertMutationFn<T, TKey>
  onUpdate: UpdateMutationFn<T, TKey>
  onDelete: DeleteMutationFn<T, TKey>
} {
  const getKey =
    options.getKey ??
    ((item: T) => (item as Record<string, unknown>).id as TKey)

  return {
    getKey,

    queryFn: options.query,

    onInsert: ({ transaction }) =>
      options.insert({ data: transaction.mutations[0].modified }),

    onUpdate: ({ transaction }) =>
      options.update({ data: transaction.mutations[0].modified }),

    onDelete: ({ transaction }) =>
      options.delete({ data: transaction.mutations[0].modified }),
  }
}
