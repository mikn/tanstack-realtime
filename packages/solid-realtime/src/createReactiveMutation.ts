import { createSignal } from 'solid-js'

export interface CreateReactiveMutationOptions<TArgs, TResult> {
  onSuccess?: (result: TResult, args: TArgs) => void
  onError?: (error: unknown, args: TArgs) => void
}

/**
 * Wraps a server mutation function with reactive pending/error/data state.
 *
 * Unlike `createReactiveQuery`, mutations are triggered imperatively via
 * `mutate`. No channel subscription is set up — mutations are fire-and-forget
 * with reactive status tracking.
 *
 * @example
 * const { mutate, isPending, error } = createReactiveMutation(
 *   (args) => createTodo(args),
 *   { onSuccess: () => refetch() },
 * )
 *
 * await mutate({ title: 'Buy milk' })
 */
export function createReactiveMutation<TArgs, TResult>(
  serverFn: (args: TArgs) => Promise<TResult>,
  options: CreateReactiveMutationOptions<TArgs, TResult> = {},
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
