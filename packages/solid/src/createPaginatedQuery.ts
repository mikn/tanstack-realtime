import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'
import { useRealtimeClient } from './context.js'
import type { Accessor } from 'solid-js'
import type { ReactiveQueryFn } from '@realtimejs/core'

export type PaginatedPage<TItem> = {
  items: Array<TItem>
  nextCursor: string | number | null
}

type PageEntry<TItem> = {
  items: Array<TItem>
  nextCursor: string | number | null
  channel: string
}

export interface CreatePaginatedQueryOptions {
  pageSize?: Accessor<number>
  enabled?: Accessor<boolean>
  refetchOnReconnect?: Accessor<boolean>
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
 * // Component.tsx (Solid)
 * const { items, isPending, hasNextPage, fetchNextPage } = createPaginatedQuery(
 *   getTodos,
 *   () => ({ teamId: props.teamId }),
 * )
 */
export function createPaginatedQuery<
  TItem,
  TArgs extends { cursor?: string | number | null; limit?: number },
>(
  serverFn: ReactiveQueryFn<TArgs, PaginatedPage<TItem>>,
  args: Accessor<Omit<TArgs, 'cursor' | 'limit'>>,
  options: CreatePaginatedQueryOptions = {},
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const client = useRealtimeClient('createPaginatedQuery')

  const [pages, setPages] = createSignal<Array<PageEntry<TItem>>>([])
  const [isFetching, setIsFetching] = createSignal(false)
  const [isFetchingNextPage, setIsFetchingNextPage] = createSignal(false)
  const [error, setError] = createSignal<unknown>(null)
  const [refetchTick, setRefetchTick] = createSignal(0)

  const isPending = createMemo(() => pages().length === 0 && isFetching())
  const hasNextPage = createMemo(() => {
    const last = pages().at(-1)
    return last != null && last.nextCursor != null
  })
  const items = createMemo(() => pages().flatMap((p) => p.items))

  createEffect(() => {
    const currentArgs = args()
    refetchTick()
    const enabled = options.enabled?.() ?? true
    if (!enabled) return

    setIsFetching(true)
    setError(null)

    const pageSize = options.pageSize?.() ?? 20
    let cancelled = false

    serverFn({
      ...(currentArgs as object),
      cursor: null,
      limit: pageSize,
    } as unknown as TArgs)
      .then(({ data, channel }) => {
        if (cancelled) return
        setPages([{ items: data.items, nextCursor: data.nextCursor, channel }])
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

  createEffect(() => {
    const ps = pages()
    const page1Channel = ps[0]?.channel ?? ''
    if (!page1Channel) return

    const unsub = client.subscribe(page1Channel, (msg: unknown) => {
      const page = msg as PaginatedPage<TItem>
      setPages((prev) => {
        if (prev.length === 0) return prev
        return [
          { ...prev[0], items: page.items, nextCursor: page.nextCursor },
          ...prev.slice(1),
        ]
      })
    })

    onCleanup(unsub)
  })

  createEffect(() => {
    const shouldRefetch = options.refetchOnReconnect?.() ?? true
    if (!shouldRefetch) return

    let prevStatus = client.store.state.status
    const sub = client.store.subscribe((state) => {
      const newStatus = state.status
      if (prevStatus !== 'connected' && newStatus === 'connected') {
        setPages([])
        setRefetchTick((n) => n + 1)
      }
      prevStatus = newStatus
    })

    onCleanup(() => sub.unsubscribe())
  })

  async function fetchNextPage(): Promise<void> {
    if (!hasNextPage() || isFetchingNextPage()) return
    const ps = pages()
    const cursor = ps[ps.length - 1].nextCursor
    const pageSize = options.pageSize?.() ?? 20

    setIsFetchingNextPage(true)
    setError(null)

    try {
      const { data, channel } = await serverFn({
        ...(args() as object),
        cursor,
        limit: pageSize,
      } as unknown as TArgs)
      setPages((prev) => [
        ...prev,
        { items: data.items, nextCursor: data.nextCursor, channel },
      ])
    } catch (e) {
      setError(e)
      throw e
    } finally {
      setIsFetchingNextPage(false)
    }
  }

  function refetch(): void {
    setPages([])
    setRefetchTick((n) => n + 1)
  }

  return {
    items,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    error,
    fetchNextPage,
    refetch,
  }
}
