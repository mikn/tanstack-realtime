import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useOnReconnect } from './useOnReconnect.js'
import { useSubscribe } from './useSubscribe.js'
import type { ReactiveQueryResult } from './useReactiveQuery.js'

export type PaginatedPage<TItem> = {
  items: Array<TItem>
  nextCursor: string | number | null
}

type PageEntry<TItem> = {
  items: Array<TItem>
  nextCursor: string | number | null
  channel: string
}

type PaginatedState<TItem> = {
  pages: Array<PageEntry<TItem>>
  isFetching: boolean
  isFetchingNextPage: boolean
  error: unknown
}

type PaginatedAction<TItem> =
  | { type: 'FETCH_START' }
  | {
      type: 'FETCH_SUCCESS'
      items: Array<TItem>
      nextCursor: string | number | null
      channel: string
    }
  | { type: 'FETCH_ERROR'; error: unknown }
  | { type: 'FETCH_NEXT_START' }
  | {
      type: 'FETCH_NEXT_SUCCESS'
      items: Array<TItem>
      nextCursor: string | number | null
      channel: string
    }
  | { type: 'FETCH_NEXT_ERROR'; error: unknown }
  | { type: 'UPDATE_PAGE_ONE'; items: Array<TItem> }
  | { type: 'RESET' }

function paginatedReducer<TItem>(
  state: PaginatedState<TItem>,
  action: PaginatedAction<TItem>,
): PaginatedState<TItem> {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isFetching: true, error: null }
    case 'FETCH_SUCCESS':
      return {
        pages: [
          {
            items: action.items,
            nextCursor: action.nextCursor,
            channel: action.channel,
          },
        ],
        isFetching: false,
        isFetchingNextPage: false,
        error: null,
      }
    case 'FETCH_ERROR':
      return { ...state, isFetching: false, error: action.error }
    case 'FETCH_NEXT_START':
      return { ...state, isFetchingNextPage: true, error: null }
    case 'FETCH_NEXT_SUCCESS':
      return {
        ...state,
        pages: [
          ...state.pages,
          {
            items: action.items,
            nextCursor: action.nextCursor,
            channel: action.channel,
          },
        ],
        isFetchingNextPage: false,
      }
    case 'FETCH_NEXT_ERROR':
      return { ...state, isFetchingNextPage: false, error: action.error }
    case 'UPDATE_PAGE_ONE':
      if (state.pages.length === 0) return state
      return {
        ...state,
        pages: [
          { ...state.pages[0], items: action.items },
          ...state.pages.slice(1),
        ],
      }
    case 'RESET':
      return {
        pages: [],
        isFetching: false,
        isFetchingNextPage: false,
        error: null,
      }
    default:
      return state
  }
}

export interface UseReactivePaginatedQueryOptions {
  pageSize?: number
  enabled?: boolean
  refetchOnReconnect?: boolean
}

export function useReactivePaginatedQuery<TItem, TArgs>(
  serverFn: (
    args: TArgs & { cursor: string | number | null; limit: number },
  ) => Promise<ReactiveQueryResult<PaginatedPage<TItem>>>,
  args: TArgs,
  options: UseReactivePaginatedQueryOptions = {},
): {
  items: Array<TItem>
  isPending: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  error: unknown
  fetchNextPage: () => Promise<void>
  refetch: () => void
} {
  const { pageSize = 20, enabled = true, refetchOnReconnect = true } = options

  const [state, dispatch] = useReducer(
    paginatedReducer as (
      s: PaginatedState<TItem>,
      a: PaginatedAction<TItem>,
    ) => PaginatedState<TItem>,
    { pages: [], isFetching: false, isFetchingNextPage: false, error: null },
  )

  const argsRef = useRef(args)
  useEffect(() => {
    argsRef.current = args
  })

  const argsKey = JSON.stringify(args)
  const [refetchTick, setRefetchTick] = useReducer((n: number) => n + 1, 0)

  // Initial page fetch
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    dispatch({ type: 'FETCH_START' })
    serverFn({
      ...(argsRef.current as object),
      cursor: null,
      limit: pageSize,
    } as TArgs & { cursor: null; limit: number })
      .then(({ data, channel }) => {
        if (cancelled) return
        dispatch({
          type: 'FETCH_SUCCESS',
          items: data.items,
          nextCursor: data.nextCursor,
          channel,
        })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        dispatch({ type: 'FETCH_ERROR', error })
      })
    return () => {
      cancelled = true
    }
  }, [serverFn, argsKey, enabled, refetchTick, pageSize])

  // Subscribe to page 1 channel for live updates
  const page1Channel = state.pages[0]?.channel ?? ''
  const safeChannel =
    page1Channel !== '' ? page1Channel : '__paginated_no_channel__'

  const handlePageOneMessage = useCallback((msg: unknown) => {
    const page = msg as PaginatedPage<TItem>
    dispatch({ type: 'UPDATE_PAGE_ONE', items: page.items })
  }, [])

  useSubscribe(safeChannel, handlePageOneMessage)

  const refetch = useCallback(() => {
    dispatch({ type: 'RESET' })
    setRefetchTick()
  }, [])

  useOnReconnect(() => {
    if (refetchOnReconnect) refetch()
  })

  const lastPage = state.pages.at(-1)
  const hasNextPage = lastPage != null && lastPage.nextCursor != null

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || state.isFetchingNextPage) return
    const cursor = lastPage.nextCursor
    dispatch({ type: 'FETCH_NEXT_START' })
    try {
      const { data, channel } = await serverFn({
        ...(argsRef.current as object),
        cursor,
        limit: pageSize,
      } as TArgs & { cursor: string | number | null; limit: number })
      dispatch({
        type: 'FETCH_NEXT_SUCCESS',
        items: data.items,
        nextCursor: data.nextCursor,
        channel,
      })
    } catch (error) {
      dispatch({ type: 'FETCH_NEXT_ERROR', error })
      throw error
    }
  }, [serverFn, hasNextPage, state.isFetchingNextPage, lastPage, pageSize])

  const items = state.pages.flatMap((p) => p.items)

  return {
    items,
    isPending: state.pages.length === 0 && state.isFetching,
    isFetchingNextPage: state.isFetchingNextPage,
    hasNextPage,
    error: state.error,
    fetchNextPage,
    refetch,
  }
}
