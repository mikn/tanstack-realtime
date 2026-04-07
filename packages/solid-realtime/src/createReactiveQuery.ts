import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'
import { useRealtimeClient } from './context.js'
import type { Accessor } from 'solid-js'

export type ReactiveQueryResult<T> = {
  data: T
  channel: string
}

export interface CreateReactiveQueryOptions {
  enabled?: Accessor<boolean>
  refetchOnReconnect?: Accessor<boolean>
}

/**
 * Fetches data from a server function that returns `{ data, channel }`, then
 * subscribes to the returned channel for live updates.
 *
 * Re-fetches automatically when `args` changes (tracked reactively via
 * Solid's fine-grained reactivity). The subscription is torn down and
 * re-established whenever the channel changes.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * const { data, isPending, isFetching, error, refetch } = createReactiveQuery(
 *   (args) => fetchTodosWithChannel(args),
 *   () => ({ userId: props.userId }),
 * )
 */
export function createReactiveQuery<TResult, TArgs>(
  serverFn: (args: TArgs) => Promise<ReactiveQueryResult<TResult>>,
  args: Accessor<TArgs>,
  options: CreateReactiveQueryOptions = {},
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const client = useRealtimeClient('createReactiveQuery')

  const [data, setData] = createSignal<TResult | undefined>(undefined)
  const [channel, setChannel] = createSignal<string>('')
  const [isFetching, setIsFetching] = createSignal(false)
  const [error, setError] = createSignal<unknown>(null)
  const [refetchTick, setRefetchTick] = createSignal(0)
  const [optimisticBase, setOptimisticBase] = createSignal<TResult | undefined>(
    undefined,
  )
  const [isOptimistic, setIsOptimistic] = createSignal(false)

  const isPending = createMemo(() => data() === undefined && isFetching())

  // Fetch effect: re-runs whenever args() or refetchTick() changes
  createEffect(() => {
    const currentArgs = args()
    refetchTick() // subscribe to manual refetch trigger
    const enabled = options.enabled?.() ?? true
    if (!enabled) return

    setIsFetching(true)
    setError(null)

    let cancelled = false
    serverFn(currentArgs)
      .then(({ data: d, channel: c }) => {
        if (cancelled) return
        setData(() => d)
        setChannel(c)
        setIsFetching(false)
        setOptimisticBase(undefined)
        setIsOptimistic(false)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e)
        setIsFetching(false)
      })

    onCleanup(() => {
      cancelled = true
    })
  })

  // Subscription effect: re-runs whenever the channel changes.
  // We manage subscriptions directly via the client so we can react to the
  // channel value that arrives asynchronously from the server.
  createEffect(() => {
    const currentChannel = channel()

    // Guard: don't subscribe to an empty channel (initial state before fetch)
    if (!currentChannel) return

    const unsubMessage = client.subscribe(currentChannel, (msg: unknown) => {
      setData(() => msg as TResult)
      setOptimisticBase(undefined) // Clear optimistic state
      setIsOptimistic(false)
    })

    // Subscribe to subscription errors (non-fatal — just track)
    const unsubError = client.onSubscribeError((_ch) => {
      // Channel-level error handling could be added here if needed
    })

    onCleanup(() => {
      unsubMessage()
      unsubError()
    })
  })

  // Auto-reconnect refetch effect
  createEffect(() => {
    const shouldRefetch = options.refetchOnReconnect?.() ?? true
    if (!shouldRefetch) return

    let prevStatus = client.store.state.status
    const sub = client.store.subscribe((state) => {
      const newStatus = state.status
      if (prevStatus !== 'connected' && newStatus === 'connected') {
        setRefetchTick((n) => n + 1)
      }
      prevStatus = newStatus
    })

    onCleanup(() => sub.unsubscribe())
  })

  function optimisticUpdate(
    transform: (prev: TResult | undefined) => TResult,
  ): () => void {
    // Save snapshot only on first optimistic update
    setOptimisticBase((prev) => (isOptimistic() ? prev : data()))
    setIsOptimistic(true)
    setData(() => transform(data()))

    // Return rollback function
    return () => {
      setData(() => optimisticBase())
      setOptimisticBase(undefined)
      setIsOptimistic(false)
    }
  }

  return {
    data,
    isPending,
    isFetching,
    error,
    isOptimistic,
    optimisticUpdate,
    refetch: () => setRefetchTick((n) => n + 1),
  }
}
