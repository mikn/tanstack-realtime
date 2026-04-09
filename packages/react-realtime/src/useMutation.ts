import { use, useCallback, useReducer } from 'react'
import { createOptimisticCache } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'
import type { OptimisticCache, ReactiveMutationFn } from '@tanstack/realtime'

type MutationState<TResult> = {
  isPending: boolean
  error: unknown
  data: TResult | undefined
}

type MutationAction<TResult> =
  | { type: 'MUTATE_START' }
  | { type: 'MUTATE_SUCCESS'; data: TResult }
  | { type: 'MUTATE_ERROR'; error: unknown }
  | { type: 'RESET' }

function mutationReducer<TResult>(
  state: MutationState<TResult>,
  action: MutationAction<TResult>,
): MutationState<TResult> {
  switch (action.type) {
    case 'MUTATE_START':
      return { ...state, isPending: true, error: null }
    case 'MUTATE_SUCCESS':
      return { isPending: false, error: null, data: action.data }
    case 'MUTATE_ERROR':
      return { ...state, isPending: false, error: action.error }
    case 'RESET':
      return { isPending: false, error: null, data: undefined }
    default:
      return state
  }
}

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

/**
 * Wraps a server mutation function (created with `realtime.mutation()`) with
 * pending/error state management.
 *
 * Returns a stable `mutate` function along with reactive `isPending`, `error`,
 * and `data` fields. Call `reset()` to clear state back to initial values.
 *
 * @example
 * // server.ts
 * export const createTodo = realtime.mutation(async ({ title }) => {
 *   return await db.insert(todos).values({ title }).returning()
 * })
 *
 * // Component.tsx
 * const { mutate, isPending, error } = useMutation(createTodo, {
 *   onSuccess: (result) => console.log('Created:', result),
 * })
 * await mutate({ title: 'Buy milk' })
 */
export function useMutation<TArgs, TResult>(
  serverFn: ReactiveMutationFn<TArgs, TResult>,
  options: UseMutationOptions<TArgs, TResult> = {},
): {
  mutate: (args: TArgs) => Promise<TResult>
  isPending: boolean
  error: unknown
  data: TResult | undefined
  reset: () => void
} {
  const client = use(RealtimeContext)
  const { onSuccess, onError, optimistic } = options

  const [state, dispatch] = useReducer(
    mutationReducer as (
      s: MutationState<TResult>,
      a: MutationAction<TResult>,
    ) => MutationState<TResult>,
    { isPending: false, error: null, data: undefined },
  )

  const mutate = useCallback(
    async (args: TArgs): Promise<TResult> => {
      dispatch({ type: 'MUTATE_START' })

      let rollback: (() => void) | null = null
      if (optimistic != null && client != null) {
        const { cache, rollback: rb } = createOptimisticCache()
        optimistic(cache, args)
        rollback = rb
      }

      try {
        const result = await serverFn(args)
        dispatch({ type: 'MUTATE_SUCCESS', data: result })
        onSuccess?.(result, args)
        return result
      } catch (error) {
        rollback?.()
        dispatch({ type: 'MUTATE_ERROR', error })
        onError?.(error, args)
        throw error
      }
    },
    [serverFn, onSuccess, onError, optimistic, client],
  )

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  return {
    mutate,
    isPending: state.isPending,
    error: state.error,
    data: state.data,
    reset,
  }
}
