import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'
import { useRealtimeClient } from './context.js'
import type { Accessor } from 'solid-js'

export type ReactiveQueryResult<T> = {
  data: T
  channel: string
}

export interface CreateReactiveQueryOptions {
  enabled?: Accessor<boolean>
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

  return {
    data,
    isPending,
    isFetching,
    error,
    refetch: () => setRefetchTick((n) => n + 1),
  }
}
