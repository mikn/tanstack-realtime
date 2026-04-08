import { createSignal } from 'solid-js'
import type { ReactiveMutationFn } from '@tanstack/realtime'

export interface CreateMutationOptions<TArgs, TResult> {
  onSuccess?: (result: TResult, args: TArgs) => void
  onError?: (error: unknown, args: TArgs) => void
}

/**
 * Wraps a server mutation function (created with `realtime.mutation()`) with
 * reactive pending/error/data state.
 *
 * @example
 * // server.ts
 * export const createTodo = realtime.mutation(async ({ title }) => {
 *   return await db.insert(todos).values({ title }).returning()
 * })
 *
 * // Component.tsx (Solid)
 * const { mutate, isPending, error } = createMutation(createTodo, {
 *   onSuccess: () => refetch(),
 * })
 * await mutate({ title: 'Buy milk' })
 */
export function createMutation<TArgs, TResult>(
  serverFn: ReactiveMutationFn<TArgs, TResult>,
  options: CreateMutationOptions<TArgs, TResult> = {},
) {
  const [isPending, setIsPending] = createSignal(false)
  const [error, setError] = createSignal<unknown>(null)
  const [data, setData] = createSignal<TResult | undefined>(undefined)

  async function mutate(args: TArgs): Promise<TResult> {
    setIsPending(true)
    setError(null)
    try {
      const result = await serverFn(args)
      setData(() => result)
      options.onSuccess?.(result, args)
      return result
    } catch (e) {
      setError(e)
      options.onError?.(e, args)
      throw e
    } finally {
      setIsPending(false)
    }
  }

  function reset() {
    setIsPending(false)
    setError(null)
    setData(undefined)
  }

  return { mutate, isPending, error, data, reset }
}
