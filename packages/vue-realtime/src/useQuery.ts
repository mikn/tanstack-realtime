import { computed, onUnmounted, ref, shallowRef, toValue, watch } from 'vue'
import { deriveCacheKey, getOrCreateQueryCollection } from '@tanstack/realtime'
import { useRealtimeClient } from './context.js'
import { useOnReconnect } from './useOnReconnect.js'
import type { ReactiveQueryFn } from '@tanstack/realtime'
import type { Collection } from '@tanstack/db'
import type { ComputedRef, MaybeRef, Ref } from 'vue'

export interface UseQueryOptions<TItem> {
  /** Extract a stable string key from each item. Required. */
  getKey: (item: TItem) => string
  enabled?: MaybeRef<boolean>
  refetchOnReconnect?: MaybeRef<boolean>
}

export interface UseQueryResult<TItem> {
  /** The live array of items from the server, or `[]` before the first fetch. */
  data: Ref<Array<TItem>>
  /** The TanStack DB collection — pass to `useLiveQuery` for client-side queries. */
  collection: Ref<Collection<TItem, string> | null>
  /** `true` while the initial fetch is in progress. */
  isPending: ComputedRef<boolean>
  /** `true` while any fetch is in progress (including background re-fetches). */
  isFetching: Ref<boolean>
  /** The error from the last failed fetch, or `null` if the last fetch succeeded. */
  error: Ref<unknown>
  /** Manually trigger a re-fetch with the current args. */
  refetch: () => void
}

/**
 * Subscribes to a reactive server query and auto-updates when the server
 * publishes new data on the associated channel.
 *
 * Components sharing the same `(serverFn, args)` pair share one collection,
 * one fetch, and one SSE subscription via the module-level registry.
 *
 * `serverFn` must be a function created with `realtime.query()`.
 *
 * The returned `collection` is a fully typed TanStack DB `Collection` —
 * pass it to a live query composable for client-side filtering, sorting,
 * or joining.
 *
 * @example
 * // server.ts
 * export const getTodos = realtime.query(async ({ teamId }) =>
 *   db.select().from(todos).where(eq(todos.teamId, teamId))
 * )
 *
 * // Component.vue
 * const { data, isPending } = useQuery(
 *   getTodos,
 *   computed(() => ({ teamId: currentTeamId.value })),
 *   { getKey: (t) => t.id },
 * )
 */
export function useQuery<TArgs, TItem>(
  serverFn: ReactiveQueryFn<TArgs, Array<TItem>>,
  args: MaybeRef<TArgs>,
  options: UseQueryOptions<TItem>,
): UseQueryResult<TItem> {
  const client = useRealtimeClient('useQuery')

  const isFetching = ref(false)
  const error: Ref<unknown> = ref(null)
  const isReady = ref(false)
  const itemsMap = shallowRef<Map<string, TItem>>(new Map())

  const collection: Ref<Collection<TItem, string> | null> = ref(null)

  const data = computed(() =>
    Array.from(itemsMap.value.values()),
  ) as unknown as Ref<Array<TItem>>

  const isPending: ComputedRef<boolean> = computed(() => {
    const enabled = toValue(options.enabled) ?? true
    if (!enabled) return false
    return !isReady.value
  })

  let cleanupFns: Array<() => void> = []

  function teardown() {
    for (const fn of cleanupFns) fn()
    cleanupFns = []
  }

  function setupCollection(currentArgs: TArgs): void {
    teardown()

    const enabled = toValue(options.enabled) ?? true
    if (!enabled) {
      collection.value = null
      isReady.value = false
      error.value = null
      itemsMap.value = new Map()
      return
    }

    const cacheKey = deriveCacheKey(
      serverFn as unknown as Function,
      currentArgs,
    )

    const re = getOrCreateQueryCollection<TItem>(
      cacheKey,
      serverFn as unknown as (
        a: unknown,
      ) => Promise<{ data: Array<TItem>; channel: string }>,
      currentArgs,
      options.getKey,
      client,
    )

    collection.value = re.collection as unknown as Collection<TItem, string>

    // Sync state that may have already resolved
    if (re.isReady) isReady.value = true
    if (re.error != null) error.value = re.error
    itemsMap.value = new Map(re.currentItems)

    const onReady = () => {
      isReady.value = true
    }
    re.readyListeners.add(onReady)

    const onError = (e: unknown) => {
      error.value = e
    }
    re.errorListeners.add(onError)

    const onData = () => {
      isFetching.value = false
      itemsMap.value = new Map(re.currentItems)
    }
    re.dataListeners.add(onData)

    const sub = (
      re.collection as unknown as Collection<TItem, string>
    ).subscribeChanges((changes) => {
      const next = new Map(itemsMap.value)
      for (const change of changes) {
        if (change.type === 'delete') {
          next.delete(String(change.key))
        } else {
          next.set(String(change.key), change.value)
        }
      }
      itemsMap.value = next
    })

    cleanupFns.push(
      () => re.readyListeners.delete(onReady),
      () => re.errorListeners.delete(onError),
      () => re.dataListeners.delete(onData),
      () => sub.unsubscribe(),
    )
  }

  watch(
    [() => toValue(args), () => toValue(options.enabled) ?? true],
    ([currentArgs]) => {
      setupCollection(currentArgs)
    },
    { immediate: true, deep: true },
  )

  function refetch(): void {
    isFetching.value = true
    const cacheKey = deriveCacheKey(
      serverFn as unknown as Function,
      toValue(args),
    )
    const re = getOrCreateQueryCollection<TItem>(
      cacheKey,
      serverFn as unknown as (
        a: unknown,
      ) => Promise<{ data: Array<TItem>; channel: string }>,
      toValue(args),
      options.getKey,
      client,
    )
    re.refetch()
  }

  useOnReconnect(() => {
    const shouldRefetch = toValue(options.refetchOnReconnect) ?? true
    if (shouldRefetch) refetch()
  })

  onUnmounted(() => {
    teardown()
  })

  return {
    data: data as unknown as Ref<Array<TItem>>,
    collection,
    isPending,
    isFetching,
    error,
    refetch,
  }
}
