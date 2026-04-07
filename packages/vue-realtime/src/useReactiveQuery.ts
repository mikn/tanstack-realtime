import { computed, onUnmounted, ref, shallowRef, toValue, watch } from 'vue'
import { deriveCacheKey, getOrCreateQueryCollection } from '@tanstack/realtime'
import { useRealtimeClient } from './context.js'
import { useOnReconnect } from './useOnReconnect.js'
import type { QueryEntry, ReactiveQueryResult } from '@tanstack/realtime'
import type { Collection } from '@tanstack/db'
import type { ComputedRef, MaybeRef, Ref } from 'vue'

export type { ReactiveQueryResult }

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
 * Unlike the previous implementation, this version stores query state in a
 * module-level TanStack DB Collection registry. Components sharing the same
 * `(serverFn, args)` pair share one collection, one fetch, and one SSE
 * subscription.
 *
 * Re-fetches automatically when `args` changes. Must be used inside
 * `<RealtimeProvider>`.
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

  // Per-hook local state
  const isFetching = ref(false)
  const isOptimistic = ref(false)
  const snapshotRef: { current: TResult | undefined } = { current: undefined }
  const optimisticValueRef = ref<TResult | undefined>(undefined)

  // Reactive entry read from the shared collection
  // shallowRef avoids Vue's deep UnwrapRef transformation on generic types
  const entry = shallowRef<QueryEntry<TResult> | undefined>(undefined)

  const data: Ref<TResult | undefined> = computed(
    () => entry.value?.value,
  ) as unknown as Ref<TResult | undefined>

  const error: Ref<unknown> = computed(
    () => entry.value?.error ?? null,
  ) as unknown as Ref<unknown>

  const isPending: ComputedRef<boolean> = computed(() => {
    const enabled = toValue(options.enabled) ?? true
    if (!enabled) return false
    return entry.value?.value === undefined && entry.value?.error == null
  })

  // Track the current collection + its cleanup so we can swap on args change
  let collectionRef: Collection<QueryEntry<unknown>, string> | null = null
  let registryRefetch: (() => void) | null = null
  let changesUnsub: (() => void) | null = null

  function setupCollection(currentArgs: TArgs): void {
    // Tear down previous subscription
    changesUnsub?.()
    changesUnsub = null
    collectionRef = null
    registryRefetch = null

    const enabled = toValue(options.enabled) ?? true
    if (!enabled) {
      entry.value = undefined
      return
    }

    const cacheKey = deriveCacheKey(serverFn as Function, currentArgs)

    const registryEntry = getOrCreateQueryCollection<TResult>(
      cacheKey,
      serverFn as (a: unknown) => Promise<ReactiveQueryResult<TResult>>,
      currentArgs,
      client,
    )

    collectionRef = registryEntry.collection
    registryRefetch = registryEntry.refetch

    const typedCollection = collectionRef as unknown as Collection<
      QueryEntry<TResult>,
      string
    >

    // Subscribe to changes for reactivity (get() always returns undefined here
    // before sync starts, so we rely solely on subscribeChanges for initial value)
    const sub = typedCollection.subscribeChanges((changes) => {
      for (const change of changes) {
        if (change.key === 'result') {
          if (change.type === 'delete') {
            entry.value = undefined
            if (isOptimistic.value) {
              isOptimistic.value = false
              optimisticValueRef.value = undefined
            }
          } else {
            const incoming = change.value
            entry.value = incoming
            // Clear fetching flag once data arrives
            if (isFetching.value && incoming.value !== undefined) {
              isFetching.value = false
            }
            // Only clear optimistic flag when the server pushes a value
            // different from what we set optimistically
            if (
              isOptimistic.value &&
              incoming.value !== optimisticValueRef.value
            ) {
              isOptimistic.value = false
              optimisticValueRef.value = undefined
            }
          }
        }
      }
    })

    changesUnsub = () => sub.unsubscribe()
  }

  // Watch args and enabled, re-run setup when they change
  watch(
    [() => toValue(args), () => toValue(options.enabled) ?? true],
    ([currentArgs]) => {
      setupCollection(currentArgs)
    },
    {
      immediate: true,
      deep: true,
    },
  )

  function optimisticUpdate(
    transform: (prev: TResult | undefined) => TResult,
  ): () => void {
    if (collectionRef == null) return () => undefined

    const typedCollection = collectionRef as unknown as Collection<
      QueryEntry<TResult>,
      string
    >

    snapshotRef.current = entry.value?.value
    const newValue = transform(snapshotRef.current)
    optimisticValueRef.value = newValue
    isOptimistic.value = true

    typedCollection.update('result', (draft) => {
      ;(draft as QueryEntry<TResult>).value = newValue
    })

    return () => {
      isOptimistic.value = false
      optimisticValueRef.value = undefined
      const snapshot = snapshotRef.current
      typedCollection.update('result', (draft) => {
        ;(draft as QueryEntry<TResult>).value = snapshot
      })
    }
  }

  function refetch(): void {
    isFetching.value = true
    registryRefetch?.()
  }

  // Auto-reconnect refetch
  useOnReconnect(() => {
    const shouldRefetch = toValue(options.refetchOnReconnect) ?? true
    if (shouldRefetch) refetch()
  })

  onUnmounted(() => {
    changesUnsub?.()
    changesUnsub = null
  })

  return {
    data: data as unknown as Ref<TResult | undefined>,
    isPending,
    isFetching,
    error: error,
    refetch,
    optimisticUpdate,
    isOptimistic,
  }
}
