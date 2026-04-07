import { computed, onUnmounted, ref, toValue, watch } from 'vue'
import { useRealtimeClient } from './context.js'
import type { ComputedRef, MaybeRef, Ref } from 'vue'

export type ReactiveQueryResult<T> = {
  data: T
  channel: string
}

export interface UseReactiveQueryOptions {
  enabled?: MaybeRef<boolean>
  refetchOnReconnect?: MaybeRef<boolean>
}

export interface UseReactiveQueryResult<TResult> {
  /** The most recently fetched (or server-pushed) data, or `undefined` before the first fetch. */
  data: Ref<TResult | undefined>
  /** `true` when data is `undefined` AND a fetch is in progress (initial load). */
  isPending: ComputedRef<boolean>
  /** `true` while any fetch is in progress (including background re-fetches). */
  isFetching: Ref<boolean>
  /** The error from the last failed fetch, or `null` if the last fetch succeeded. */
  error: Ref<unknown>
  /** Manually trigger a re-fetch with the current args. */
  refetch: () => void
  /** Apply an optimistic update. Returns a rollback function. */
  optimisticUpdate: (
    transform: (prev: TResult | undefined) => TResult,
  ) => () => void
  /** `true` while an optimistic update is in effect and has not yet been confirmed by the server. */
  isOptimistic: Ref<boolean>
}

/**
 * Fetches data from a server function that returns `{ data, channel }`, then
 * subscribes to the returned channel for live updates.
 *
 * Re-fetches automatically when `args` changes. The subscription is torn down
 * and re-established whenever the channel changes (i.e. when args change and
 * the server returns a new channel).
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * const { data, isPending, isFetching, error, refetch } = useReactiveQuery(
 *   (args) => fetchTodosWithChannel(args),
 *   computed(() => ({ userId: currentUserId.value })),
 * )
 */
export function useReactiveQuery<TResult, TArgs>(
  serverFn: (args: TArgs) => Promise<ReactiveQueryResult<TResult>>,
  args: MaybeRef<TArgs>,
  options: UseReactiveQueryOptions = {},
): UseReactiveQueryResult<TResult> {
  const client = useRealtimeClient('useReactiveQuery')

  const data = ref<TResult | undefined>(undefined) as Ref<TResult | undefined>
  const channel: Ref<string> = ref('')
  const isFetching: Ref<boolean> = ref(false)
  const error: Ref<unknown> = ref(null)

  const optimisticBase = ref<TResult | undefined>(undefined) as Ref<
    TResult | undefined
  >
  const isOptimistic = ref(false)

  const isPending: ComputedRef<boolean> = computed(
    () => data.value === undefined && isFetching.value,
  )

  async function fetchData(): Promise<void> {
    const enabled = toValue(options.enabled) ?? true
    if (!enabled) return

    isFetching.value = true
    error.value = null

    try {
      const result = await serverFn(toValue(args))
      data.value = result.data
      channel.value = result.channel
      optimisticBase.value = undefined
      isOptimistic.value = false
    } catch (e) {
      error.value = e
    } finally {
      isFetching.value = false
    }
  }

  function optimisticUpdate(
    transform: (prev: TResult | undefined) => TResult,
  ): () => void {
    optimisticBase.value = isOptimistic.value
      ? optimisticBase.value
      : data.value
    isOptimistic.value = true
    data.value = transform(data.value) as TResult | undefined

    return () => {
      data.value = optimisticBase.value
      optimisticBase.value = undefined
      isOptimistic.value = false
    }
  }

  // Watch args and re-fetch when they change
  watch(
    () => toValue(args),
    () => {
      void fetchData()
    },
    {
      immediate: true,
      deep: true,
    },
  )

  // Manage the subscription manually so we can react to channel changes.
  // We cannot call useSubscribe here because that takes a static string at
  // setup time; our channel arrives asynchronously from the server.
  let unsubMessage: (() => void) | null = null
  let unsubError: (() => void) | null = null

  watch(channel, (newChannel) => {
    // Tear down any previous subscription
    unsubMessage?.()
    unsubError?.()
    unsubMessage = null
    unsubError = null

    // Guard: don't subscribe to an empty channel (initial state before fetch)
    if (!newChannel) return

    unsubMessage = client.subscribe(newChannel, (msg: unknown) => {
      data.value = msg as TResult
      optimisticBase.value = undefined
      isOptimistic.value = false
    })

    unsubError = client.onSubscribeError((_ch) => {
      // Subscription-level errors are surfaced via subscribeError on useSubscribe;
      // here we simply ignore them — consumers can wrap with useSubscribe if needed.
    })
  })

  // Auto-reconnect refetch
  let realtimeUnsub: (() => void) | null = null

  const stopReconnectWatch = watch(
    () => toValue(options.refetchOnReconnect) ?? true,
    (shouldRefetch) => {
      realtimeUnsub?.()
      realtimeUnsub = null
      if (!shouldRefetch) return

      let prevStatus = client.store.state.status
      const sub = client.store.subscribe((state) => {
        const newStatus = state.status
        if (prevStatus !== 'connected' && newStatus === 'connected') {
          void fetchData()
        }
        prevStatus = newStatus
      })
      realtimeUnsub = sub.unsubscribe
    },
    { immediate: true },
  )

  onUnmounted(() => {
    unsubMessage?.()
    unsubError?.()
    stopReconnectWatch()
    realtimeUnsub?.()
    realtimeUnsub = null
  })

  return {
    data,
    isPending,
    isFetching,
    error,
    refetch: () => {
      void fetchData()
    },
    optimisticUpdate,
    isOptimistic,
  }
}
