import { use, useCallback, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { deriveCacheKey, getOrCreateQueryCollection } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'
import { useOnReconnect } from './useOnReconnect.js'
import type { QueryEntry, ReactiveQueryResult } from '@tanstack/realtime'
import type { Collection } from '@tanstack/db'

export type { ReactiveQueryResult }

export interface UseReactiveQueryOptions {
  enabled?: boolean
  refetchOnReconnect?: boolean
}

/**
 * Subscribes to a reactive server query and auto-updates when the server
 * publishes new data on the associated channel.
 *
 * Unlike the previous `useReducer`-based implementation, this version stores
 * query state in a module-level TanStack DB Collection registry. Components
 * sharing the same `(serverFn, args)` pair share one collection, one fetch,
 * and one SSE subscription.
 *
 * The `serverFn` should return a `ReactiveQueryResult<T>` containing both
 * the initial data and a channel name to subscribe to for live updates.
 *
 * **Note on `enabled`:** When `enabled` is `false`, no collection is created
 * and no fetch is performed. The hook returns a pending state.
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
  isOptimistic: boolean
  optimisticUpdate: (
    transform: (prev: TResult | undefined) => TResult,
  ) => () => void
  refetch: () => void
} {
  const client = use(RealtimeContext)
  const { enabled = true, refetchOnReconnect = true } = options

  // Compute a stable serialised cache key for this (serverFn, args) pair.
  // JSON.stringify(args) is used as the args part, so args must be
  // JSON-serialisable. The serverFn is identified by object identity.
  const argsJson = JSON.stringify(args)
  const cacheKey = useMemo(
    () => deriveCacheKey(serverFn as Function, args),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serverFn, argsJson],
  )

  // Retrieve (or lazily create) the shared collection for this query.
  // When `enabled` is false we skip this and return a pending state instead.
  const registryEntry = useMemo(
    () =>
      enabled && client != null
        ? getOrCreateQueryCollection<TResult>(
            cacheKey,
            serverFn as (a: unknown) => Promise<ReactiveQueryResult<TResult>>,
            args,
            client,
          )
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacheKey, client, enabled],
  )

  const collection = registryEntry?.collection as
    | (Collection<QueryEntry<TResult>, string> & { singleResult?: true })
    | null

  // useLiveQuery must be called unconditionally (Rules of Hooks).
  // When `collection` is null (disabled), pass null so the hook returns
  // undefined data.
  const { data: entry, isLoading } = useLiveQuery(
    (q) =>
      collection != null ? q.from({ result: collection }).findOne() : null,
    [collection],
  )

  const [isFetching, setIsFetching] = useState(false)
  const [isOptimistic, setIsOptimistic] = useState(false)
  const snapshotRef = useRef<TResult | undefined>(undefined)

  // Clear optimistic flag when the server value changes.
  const prevValueRef = useRef<TResult | undefined>(undefined)
  const currentValue = (entry as QueryEntry<TResult> | undefined)?.value
  if (prevValueRef.current !== currentValue && isOptimistic) {
    setIsOptimistic(false)
  }
  prevValueRef.current = currentValue

  // Clear fetching flag once data arrives.
  const prevEntryRef = useRef<QueryEntry<TResult> | undefined>(undefined)
  if (
    isFetching &&
    prevEntryRef.current !== (entry as QueryEntry<TResult> | undefined) &&
    (entry as QueryEntry<TResult> | undefined)?.value !== undefined
  ) {
    setIsFetching(false)
  }
  prevEntryRef.current = entry as QueryEntry<TResult> | undefined

  const optimisticUpdate = useCallback(
    (transform: (prev: TResult | undefined) => TResult) => {
      if (collection == null) return () => undefined

      snapshotRef.current = (entry as QueryEntry<TResult> | undefined)?.value
      setIsOptimistic(true)
      const newValue = transform(snapshotRef.current)

      collection.update('result', (draft) => {
        ;(draft as QueryEntry<TResult>).value = newValue
      })

      return () => {
        setIsOptimistic(false)
        const snapshot = snapshotRef.current
        collection.update('result', (draft) => {
          ;(draft as QueryEntry<TResult>).value = snapshot
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collection, (entry as QueryEntry<TResult> | undefined)?.value],
  )

  const refetch = useCallback(() => {
    setIsFetching(true)
    registryEntry?.refetch()
  }, [registryEntry])

  useOnReconnect(() => {
    if (refetchOnReconnect) refetch()
  })

  const typedEntry = entry as QueryEntry<TResult> | undefined

  return {
    data: typedEntry?.value,
    isPending: !enabled
      ? false
      : (isLoading || typedEntry?.value === undefined) &&
        typedEntry?.error == null,
    isFetching: isLoading || isFetching,
    error: typedEntry?.error ?? null,
    isOptimistic,
    optimisticUpdate,
    refetch,
  }
}
