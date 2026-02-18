import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { serializeKey } from '@tanstack/realtime-client'
import { useRealtimeContext } from './context.js'

type RealtimeQueryOptions<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends ReadonlyArray<unknown> = ReadonlyArray<unknown>,
> = UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>

/**
 * A drop-in replacement for `useQuery` that subscribes to realtime invalidations.
 *
 * The query key is used as the subscription channel. When the server publishes
 * an invalidation for a matching key, TanStack Query refetches via `queryFn`.
 *
 * @example
 * ```tsx
 * const { data } = useRealtimeQuery({
 *   queryKey: ['todos', { projectId }],
 *   queryFn: () => api.getTodos(projectId),
 * })
 * ```
 */
export function useRealtimeQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends ReadonlyArray<unknown> = ReadonlyArray<unknown>,
>(
  options: RealtimeQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
) {
  const { client } = useRealtimeContext()
  const queryClient = useQueryClient()
  const serializedKey = serializeKey(options.queryKey as ReadonlyArray<unknown>)
  const serializedKeyRef = useRef(serializedKey)
  serializedKeyRef.current = serializedKey

  useEffect(() => {
    // Subscribe to invalidation signals for this query key
    client.subscribe(serializedKey)

    const unsubscribeInvalidate = client.onInvalidate((key) => {
      if (key === serializedKeyRef.current) {
        queryClient.invalidateQueries({ queryKey: options.queryKey as unknown[] })
      }
    })

    return () => {
      client.unsubscribe(serializedKey)
      unsubscribeInvalidate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, serializedKey, queryClient])

  return useQuery(options)
}
