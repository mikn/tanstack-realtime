import { ref } from 'vue'
import type { Ref } from 'vue'

export interface UseReactiveMutationOptions<TArgs, TResult> {
  onSuccess?: (result: TResult, args: TArgs) => void
  onError?: (error: unknown, args: TArgs) => void
}

export interface UseReactiveMutationResult<TArgs, TResult> {
  mutate: (args: TArgs) => Promise<TResult>
  isPending: Ref<boolean>
  error: Ref<unknown>
  data: Ref<TResult | undefined>
  reset: () => void
}

/**
 * Wraps a server mutation function with reactive pending/error/data state.
 *
 * Unlike `useReactiveQuery`, mutations are triggered imperatively via `mutate`.
 * No channel subscription is set up — mutations are fire-and-forget with
 * reactive status tracking.
 *
 * @example
 * const { mutate, isPending, error } = useReactiveMutation(
 *   (args) => createTodo(args),
 *   { onSuccess: () => refetch() },
 * )
 *
 * await mutate({ title: 'Buy milk' })
 */
export function useReactiveMutation<TArgs, TResult>(
  serverFn: (args: TArgs) => Promise<TResult>,
  options: UseReactiveMutationOptions<TArgs, TResult> = {},
): UseReactiveMutationResult<TArgs, TResult> {
  const isPending = ref(false)
  const error = ref<unknown>(null)
  const data = ref<TResult | undefined>(undefined) as Ref<TResult | undefined>

  async function mutate(args: TArgs): Promise<TResult> {
    isPending.value = true
    error.value = null
    try {
      const result = await serverFn(args)
      data.value = result as TResult
      options.onSuccess?.(result, args)
      return result
    } catch (e) {
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
