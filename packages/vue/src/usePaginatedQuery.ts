import { computed, onUnmounted, ref, toValue, watch } from 'vue'
import { useRealtimeClient } from './context.js'
import type { ReactiveQueryFn } from '@realtimejs/core'
import type { ComputedRef, MaybeRef, Ref } from 'vue'

export type PaginatedPage<TItem> = {
  items: Array<TItem>
  nextCursor: string | number | null
}

type PageEntry<TItem> = {
  items: Array<TItem>
  nextCursor: string | number | null
  channel: string
}

export interface UsePaginatedQueryOptions {
  pageSize?: MaybeRef<number>
  enabled?: MaybeRef<boolean>
  refetchOnReconnect?: MaybeRef<boolean>
}

/**
 * Fetches paginated data from a reactive server function and subscribes to
 * live updates for the first page.
 *
 * `serverFn` must be a function created with `realtime.query()` whose args
 * include optional `cursor` and `limit` fields for pagination.
 *
 * @example
 * // server.ts
 * export const getTodos = realtime.query(async ({ teamId, cursor, limit }) =>
 *   // ... paginated query
 * )
 *
 * // Component.vue
 * const { items, isPending, hasNextPage, fetchNextPage } = usePaginatedQuery(
 *   getTodos,
 *   computed(() => ({ teamId: currentTeamId.value })),
 * )
 */
export function usePaginatedQuery<
  TItem,
  TArgs extends { cursor?: string | number | null; limit?: number },
>(
  serverFn: ReactiveQueryFn<TArgs, PaginatedPage<TItem>>,
  args: MaybeRef<Omit<TArgs, 'cursor' | 'limit'>>,
  options: UsePaginatedQueryOptions = {},
) {
  const client = useRealtimeClient('usePaginatedQuery')

  const pages = ref<Array<PageEntry<TItem>>>([]) as Ref<Array<PageEntry<TItem>>>
  const isFetching = ref(false)
  const isFetchingNextPage = ref(false)
  const error = ref<unknown>(null)

  const isPending: ComputedRef<boolean> = computed(
    () => pages.value.length === 0 && isFetching.value,
  )
  const hasNextPage: ComputedRef<boolean> = computed(() => {
    const last = pages.value.at(-1)
    return last != null && last.nextCursor != null
  })
  const items: ComputedRef<Array<TItem>> = computed(() =>
    pages.value.flatMap((p) => p.items),
  )

  async function fetchFirstPage(): Promise<void> {
    const enabled = toValue(options.enabled) ?? true
    if (!enabled) return

    isFetching.value = true
    error.value = null

    try {
      const pageSize = toValue(options.pageSize) ?? 20
      const { data, channel } = await serverFn({
        ...(toValue(args) as object),
        cursor: null,
        limit: pageSize,
      } as unknown as TArgs)
      pages.value = [
        { items: data.items, nextCursor: data.nextCursor, channel },
      ]
    } catch (e) {
      error.value = e
    } finally {
      isFetching.value = false
    }
  }

  async function fetchNextPage(): Promise<void> {
    if (!hasNextPage.value || isFetchingNextPage.value) return
    const lastPage = pages.value[pages.value.length - 1]
    const cursor = lastPage.nextCursor
    const pageSize = toValue(options.pageSize) ?? 20

    isFetchingNextPage.value = true
    error.value = null

    try {
      const { data, channel } = await serverFn({
        ...(toValue(args) as object),
        cursor,
        limit: pageSize,
      } as unknown as TArgs)
      pages.value = [
        ...pages.value,
        { items: data.items, nextCursor: data.nextCursor, channel },
      ]
    } catch (e) {
      error.value = e
      throw e
    } finally {
      isFetchingNextPage.value = false
    }
  }

  function refetch(): void {
    pages.value = []
    void fetchFirstPage()
  }

  watch(
    () => toValue(args),
    () => {
      refetch()
    },
    { immediate: true, deep: true },
  )

  const page1Channel = computed(() => pages.value[0]?.channel ?? '')
  let unsubPage1: (() => void) | null = null

  watch(page1Channel, (newChannel) => {
    unsubPage1?.()
    unsubPage1 = null
    if (!newChannel) return
    unsubPage1 = client.subscribe(newChannel, (msg: unknown) => {
      if (pages.value.length > 0) {
        const page = msg as PaginatedPage<TItem>
        pages.value = [
          { ...pages.value[0], items: page.items, nextCursor: page.nextCursor },
          ...pages.value.slice(1),
        ]
      }
    })
  })

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
          refetch()
        }
        prevStatus = newStatus
      })
      realtimeUnsub = sub.unsubscribe
    },
    { immediate: true },
  )

  onUnmounted(() => {
    unsubPage1?.()
    stopReconnectWatch()
    realtimeUnsub?.()
    realtimeUnsub = null
  })

  return {
    items,
    isPending,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    error,
    fetchNextPage,
    refetch,
  }
}
