import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { deriveCacheKey, getOrCreateQueryCollection } from '@realtimejs/core'
import { RealtimeContext } from './context.js'
import { useOnReconnect } from './useOnReconnect.js'
import type { ReactiveQueryFn } from '@realtimejs/core'
import type { Collection } from '@tanstack/db'

export interface UseQueryOptions<TItem> {
  /** Extract a stable string key from each item. Required. */
  getKey: (item: TItem) => string
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
 * The returned `collection` is a fully typed TanStack DB `Collection` —
 * pass it to `useLiveQuery` for client-side filtering, sorting, or joining.
 *
 * @example
 * // server.ts
 * export const getTodos = realtime.query(async ({ teamId }) =>
 *   db.select().from(todos).where(eq(todos.teamId, teamId))
 * )
 *
 * // Component.tsx
 * const { data, collection, isPending } = useQuery(getTodos, { teamId }, {
 *   getKey: (t) => t.id,
 * })
 *
 * // Client-side filter via TanStack DB
 * const { data: active } = useLiveQuery(
 *   (q) => q.from({ todos: collection }).where('done', '=', false),
 *   [collection],
 * )
 */
export function useQuery<TArgs, TItem extends Record<string, unknown>>(
  serverFn: ReactiveQueryFn<TArgs, Array<TItem>>,
  args: TArgs,
  options: UseQueryOptions<TItem>,
): {
  data: Array<TItem>
  collection: Collection<TItem, string> | null
  isPending: boolean
  isFetching: boolean
  error: unknown
  refetch: () => void
} {
  const client = use(RealtimeContext)
  const { getKey, enabled = true, refetchOnReconnect = true } = options

  const argsJson = JSON.stringify(args)
  const cacheKey = useMemo(
    () => deriveCacheKey(serverFn as unknown as Function, args),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serverFn, argsJson],
  )

  const registryEntry = useMemo(
    () =>
      enabled && client != null
        ? getOrCreateQueryCollection<TItem>(
            cacheKey,
            serverFn as unknown as (
              a: unknown,
            ) => Promise<{ data: Array<TItem>; channel: string }>,
            args,
            getKey,
            client,
          )
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacheKey, client, enabled],
  )

  const collection = registryEntry?.collection ?? null

  const { data: items, isLoading } = useLiveQuery(
    (q) => (collection != null ? q.from({ result: collection }) : null),
    [collection],
  )

  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<unknown>(null)

  // Subscribe to error notifications from the registry entry
  useEffect(() => {
    if (registryEntry == null) return
    const onError = (e: unknown) => setError(e)
    registryEntry.errorListeners.add(onError)
    // Sync any error that may have already occurred
    if (registryEntry.error != null) setError(registryEntry.error)
    return () => {
      registryEntry.errorListeners.delete(onError)
    }
  }, [registryEntry])

  // Clear isFetching when new data arrives
  const isFetchingRef = useRef(false)
  isFetchingRef.current = isFetching
  useEffect(() => {
    if (registryEntry == null) return
    const onData = () => {
      if (isFetchingRef.current) setIsFetching(false)
    }
    registryEntry.dataListeners.add(onData)
    return () => {
      registryEntry.dataListeners.delete(onData)
    }
  }, [registryEntry])

  const refetch = useCallback(() => {
    setIsFetching(true)
    registryEntry?.refetch()
  }, [registryEntry])

  useOnReconnect(() => {
    if (refetchOnReconnect) refetch()
  })

  return {
    data: items ?? [],
    collection,
    isPending: !enabled ? false : isLoading,
    isFetching: isLoading || isFetching,
    error,
    refetch,
  }
}
