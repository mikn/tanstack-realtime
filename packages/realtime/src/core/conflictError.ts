// ---------------------------------------------------------------------------
// ConflictError
// ---------------------------------------------------------------------------

/**
 * Throw this from an `onInsert`, `onUpdate`, or `onDelete` server function
 * when a concurrent edit is detected — for example, when a Drizzle
 * optimistic-lock check finds that the row's `version` column no longer
 * matches the client's copy.
 *
 * Carry the current server state in `opts.current` so the client's
 * `onOptimisticError` handler can present a conflict UI with both the user's
 * attempted change and the state that won.
 *
 * ```ts
 * // Server function (TanStack Start)
 * export const updateTodo = createServerFn({ method: 'POST' })
 *   .handler(async ({ data }: { data: Todo }) => {
 *     const existing = await db.select().from(todos)
 *       .where(eq(todos.id, data.id))
 *       .then((r) => r[0])
 *
 *     if (existing.version !== data.version) {
 *       throw new ConflictError('Concurrent edit', { current: existing })
 *     }
 *
 *     return db.update(todos)
 *       .set({ ...data, version: data.version + 1 })
 *       .where(eq(todos.id, data.id))
 *       .returning()
 *       .then((r) => r[0])
 *   })
 *
 * // Collection config
 * realtimeCollectionOptions({
 *   ...withServerFns({ query, insert, update, delete: deleteTodo }),
 *   client,
 *   channel: ['todos', { projectId }],
 *   onOptimisticError: ({ error, action, key }) => {
 *     if (isConflictError<Todo>(error)) {
 *       showConflictDialog({ current: error.current })
 *     }
 *   },
 * })
 * ```
 */
export class ConflictError<T = unknown> extends Error {
  /**
   * Stable discriminant that survives TanStack Start's network serialization,
   * where `instanceof` checks may fail because the error is reconstructed on
   * the client from a plain object.  Always check with `isConflictError()`.
   */
  readonly type = 'ConflictError' as const

  /** The authoritative server state at the time of the conflict. */
  readonly current: T

  constructor(message: string, opts: { current: T }) {
    super(message)
    this.name = 'ConflictError'
    this.current = opts.current
  }
}

/**
 * Type guard for `ConflictError` that works even after network serialization.
 *
 * Use this instead of `instanceof ConflictError` inside `onOptimisticError`
 * because TanStack Start reconstructs thrown errors on the client as plain
 * objects, which breaks prototype chain checks.
 *
 * @example
 * onOptimisticError: ({ error }) => {
 *   if (isConflictError<Todo>(error)) {
 *     showConflictDialog({ current: error.current })
 *   }
 * }
 */
export function isConflictError<T = unknown>(
  err: unknown,
): err is ConflictError<T> {
  if (err instanceof ConflictError) return true
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type: unknown }).type === 'ConflictError'
  )
}
