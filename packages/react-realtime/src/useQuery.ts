import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { deriveCacheKey, getOrCreateQueryCollection } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'
import { useOnReconnect } from './useOnReconnect.js'
import type { QueryEntry, ReactiveQueryFn } from '@tanstack/realtime'
import type { Collection } from '@tanstack/db'

export interface UseQueryOptions {
  enabled?: boolean
  refetchOnReconnect?: boolean
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
 * @example
 * // server.ts
 * export const getTodos = realtime.query(async ({ teamId }) =>
 *   db.select().from(todos).where(eq(todos.teamId, teamId))
 * )
 *
 * // Component.tsx
 * const { data, isPending, error } = useQuery(getTodos, { teamId })
 */
export function useQuery<TArgs, TResult>(
  serverFn: ReactiveQueryFn<TArgs, TResult>,
  args: TArgs,
  options: UseQueryOptions = {},
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

  const argsJson = JSON.stringify(args)
  const cacheKey = useMemo(
    () => deriveCacheKey(serverFn as unknown as Function, args),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serverFn, argsJson],
  )

  const registryEntry = useMemo(
    () =>
      enabled && client != null
        ? getOrCreateQueryCollection<TResult>(
            cacheKey,
            serverFn as unknown as (
              a: unknown,
            ) => Promise<{ data: TResult; channel: string }>,
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

  const { data: entry, isLoading } = useLiveQuery(
    (q) =>
      collection != null ? q.from({ result: collection }).findOne() : null,
    [collection],
  )

  const [isFetching, setIsFetching] = useState(false)
  const [isOptimistic, setIsOptimistic] = useState(false)
  const snapshotRef = useRef<TResult | undefined>(undefined)
  const optimisticValueRef = useRef<TResult | undefined>(undefined)

  const typedEntry = entry as QueryEntry<TResult> | undefined
  const entryValue = typedEntry?.value

  useEffect(() => {
    if (!isOptimistic) return
    if (entryValue !== optimisticValueRef.current) {
      setIsOptimistic(false)
      optimisticValueRef.current = undefined
    }
  }, [entryValue, isOptimistic])

  const prevEntryValueRef = useRef<TResult | undefined>(undefined)
  useEffect(() => {
    if (
      isFetching &&
      entryValue !== undefined &&
      entryValue !== prevEntryValueRef.current
    ) {
      setIsFetching(false)
    }
    prevEntryValueRef.current = entryValue
  }, [entryValue, isFetching])

  const optimisticUpdate = useCallback(
    (transform: (prev: TResult | undefined) => TResult) => {
      if (collection == null) return () => undefined

      snapshotRef.current = (entry as QueryEntry<TResult> | undefined)?.value
      const newValue = transform(snapshotRef.current)
      optimisticValueRef.current = newValue
      setIsOptimistic(true)

      collection.update('result', (draft) => {
        ;(draft as QueryEntry<TResult>).value = newValue
      })

      return () => {
        setIsOptimistic(false)
        optimisticValueRef.current = undefined
        const snapshot = snapshotRef.current
        collection.update('result', (draft) => {
          ;(draft as QueryEntry<TResult>).value = snapshot
        })
      }
    },
    [collection, entry],
  )

  const refetch = useCallback(() => {
    setIsFetching(true)
    registryEntry?.refetch()
  }, [registryEntry])

  useOnReconnect(() => {
    if (refetchOnReconnect) refetch()
  })

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
