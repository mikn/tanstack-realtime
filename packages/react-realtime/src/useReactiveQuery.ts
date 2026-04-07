import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useSubscribe } from './useSubscribe.js'
import { useOnReconnect } from './useOnReconnect.js'

export type ReactiveQueryResult<T> = {
  data: T
  channel: string
}

type State<T> = {
  data: T | undefined
  channel: string | null
  isFetching: boolean
  error: unknown
  optimisticBase: T | undefined
  isOptimistic: boolean
}

type Action<T> =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; data: T; channel: string }
  | { type: 'FETCH_ERROR'; error: unknown }
  | { type: 'SERVER_UPDATE'; data: T }
  | { type: 'OPTIMISTIC_UPDATE'; transform: (prev: T | undefined) => T }
  | { type: 'ROLLBACK' }

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isFetching: true, error: null }
    case 'FETCH_SUCCESS':
      return {
        data: action.data,
        channel: action.channel,
        isFetching: false,
        error: null,
        optimisticBase: undefined,
        isOptimistic: false,
      }
    case 'FETCH_ERROR':
      return { ...state, isFetching: false, error: action.error }
    case 'SERVER_UPDATE':
      return {
        ...state,
        data: action.data,
        optimisticBase: undefined,
        isOptimistic: false,
      }
    case 'OPTIMISTIC_UPDATE':
      return {
        ...state,
        data: action.transform(state.data),
        // Save snapshot only on first optimistic update
        optimisticBase: state.isOptimistic ? state.optimisticBase : state.data,
        isOptimistic: true,
      }
    case 'ROLLBACK':
      return {
        ...state,
        data: state.optimisticBase,
        optimisticBase: undefined,
        isOptimistic: false,
      }
    default:
      return state
  }
}

export interface UseReactiveQueryOptions {
  enabled?: boolean
  keepPreviousData?: boolean
  refetchOnReconnect?: boolean
}

/**
 * Subscribes to a reactive server query and auto-updates when the server
 * publishes new data on the associated channel.
 *
 * The `serverFn` should return a `ReactiveQueryResult<T>` containing both
 * the initial data and a channel name to subscribe to for live updates.
 *
 * @example
 * const { data, isPending, error, refetch } = useReactiveQuery(
 *   fetchTodos,
 *   { userId },
 * )
 */
export function useReactiveQuery<TResult, TArgs = void>(
  serverFn: (args: TArgs) => Promise<ReactiveQueryResult<TResult>>,
  args: TArgs,
  options: UseReactiveQueryOptions = {},
): {
  data: TResult | undefined
  isPending: boolean
  isFetching: boolean
  error: unknown
  refetch: () => void
  optimisticUpdate: (
    transform: (prev: TResult | undefined) => TResult,
  ) => () => void
  isOptimistic: boolean
} {
  const { enabled = true, refetchOnReconnect = true } = options

  const [state, dispatch] = useReducer(
    reducer as (s: State<TResult>, a: Action<TResult>) => State<TResult>,
    {
      data: undefined,
      channel: null,
      isFetching: false,
      error: null,
      optimisticBase: undefined,
      isOptimistic: false,
    },
  )

  // Stable ref to args to avoid infinite effect loops on object identity changes
  const argsRef = useRef(args)
  useEffect(() => {
    argsRef.current = args
  })

  // Refetch trigger — increment to force a re-fetch
  const [refetchTick, setRefetchTick] = useReducer((n: number) => n + 1, 0)

  // Serialize args to a stable string for effect dependency
  const argsKey = JSON.stringify(args)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    dispatch({ type: 'FETCH_START' })
    serverFn(argsRef.current)
      .then(({ data, channel }) => {
        if (cancelled) return
        dispatch({ type: 'FETCH_SUCCESS', data, channel })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        dispatch({ type: 'FETCH_ERROR', error })
      })
    return () => {
      cancelled = true
    }
  }, [serverFn, argsKey, enabled, refetchTick])

  // Guard: only subscribe when we have a non-empty channel string.
  // useSubscribe does not guard against empty strings internally.
  const activeChannel = state.channel ?? ''

  const handleMessage = useCallback((msg: unknown) => {
    dispatch({ type: 'SERVER_UPDATE', data: msg as TResult })
  }, [])

  // Conditionally subscribe — when activeChannel is empty this hook still
  // mounts but we skip subscribing by passing an empty string only after
  // ensuring useSubscribe handles it. Because useSubscribe calls
  // client.subscribe unconditionally, we pass a no-op guard channel:
  // we use the hook unconditionally (Rules of Hooks) but short-circuit
  // the real subscription by only passing the channel when it's non-empty.
  useSubscribeIfChannelSet(activeChannel, handleMessage)

  useOnReconnect(() => {
    if (refetchOnReconnect) setRefetchTick()
  })

  const optimisticUpdate = useCallback(
    (transform: (prev: TResult | undefined) => TResult) => {
      dispatch({ type: 'OPTIMISTIC_UPDATE', transform })
      return () => dispatch({ type: 'ROLLBACK' })
    },
    [],
  )

  return {
    data: state.data,
    // isPending: true only when we have no data yet and a fetch is in-flight
    isPending: state.data === undefined && state.isFetching,
    isFetching: state.isFetching,
    error: state.error,
    refetch: () => setRefetchTick(),
    optimisticUpdate,
    isOptimistic: state.isOptimistic,
  }
}

/**
 * Internal helper that calls `useSubscribe` only when `channel` is non-empty.
 * This wraps the conditional logic in its own hook to satisfy Rules of Hooks
 * while guarding against subscribing to an empty-string channel.
 */
function useSubscribeIfChannelSet(
  channel: string,
  onMessage: (data: unknown) => void,
): void {
  // We must call useSubscribe unconditionally (Rules of Hooks), but we can
  // direct it to a sentinel no-op channel when the real channel isn't known yet.
  // The sentinel channel '__reactive_query_no_channel__' is intentionally
  // unlikely to collide with any real channel name.
  const safeChannel = channel !== '' ? channel : '__reactive_query_no_channel__'
  useSubscribe(safeChannel, onMessage)
}
