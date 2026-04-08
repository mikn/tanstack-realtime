import { ref } from 'vue'
import { createOptimisticCache } from '@tanstack/realtime'
import { useRealtimeClient } from './context.js'
import type { OptimisticCache, ReactiveMutationFn } from '@tanstack/realtime'
import type { Ref } from 'vue'

export interface UseMutationOptions<TArgs, TResult> {
  onSuccess?: (result: TResult, args: TArgs) => void
  onError?: (error: unknown, args: TArgs) => void
  /**
   * Declarative optimistic update. Called synchronously before the server
   * request fires. Use `cache.update(queryFn, args, transform)` to speculatively
   * mutate any reactive query's cached data. Automatically rolled back on error.
   */
  optimistic?: (cache: OptimisticCache, args: TArgs) => void
}

export interface UseMutationResult<TArgs, TResult> {
  mutate: (args: TArgs) => Promise<TResult>
  isPending: Ref<boolean>
  error: Ref<unknown>
  data: Ref<TResult | undefined>
  reset: () => void
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
 * // Component.vue
 * const { mutate, isPending, error } = useMutation(createTodo, {
 *   onSuccess: () => refetch(),
 * })
 * await mutate({ title: 'Buy milk' })
 */
export function useMutation<TArgs, TResult>(
  serverFn: ReactiveMutationFn<TArgs, TResult>,
  options: UseMutationOptions<TArgs, TResult> = {},
): UseMutationResult<TArgs, TResult> {
  const client = useRealtimeClient('useMutation')
  const isPending = ref(false)
  const error = ref<unknown>(null)
  const data = ref<TResult | undefined>(undefined) as Ref<TResult | undefined>

  async function mutate(args: TArgs): Promise<TResult> {
    isPending.value = true
    error.value = null

    let rollback: (() => void) | null = null
    if (options.optimistic != null) {
      const { cache, rollback: rb } = createOptimisticCache(client)
      options.optimistic(cache, args)
      rollback = rb
    }

    try {
      const result = await serverFn(args)
      data.value = result as TResult
      options.onSuccess?.(result, args)
      return result
    } catch (e) {
      rollback?.()
      error.value = e
      options.onError?.(e, args)
      throw e
    } finally {
      isPending.value = false
    }
  }

  function reset() {
    isPending.value = false
    error.value = null
    data.value = undefined
  }

  return { mutate, isPending, error, data, reset }
}
