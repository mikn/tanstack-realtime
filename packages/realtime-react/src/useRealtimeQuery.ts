import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { serializeKey } from '@tanstack/realtime-client'
import { useRealtimeContext } from './context.js'

type AnyKey = ReadonlyArray<unknown>

type RealtimeQueryOptions<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends AnyKey = AnyKey,
> = UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>

/**
 * A drop-in replacement for `useQuery` that subscribes to realtime
 * invalidations over the WebSocket.
 *
 * The query key is used as the subscription channel. When the server publishes
 * an invalidation for a matching key, TanStack Query refetches via `queryFn`.
 * If no WebSocket connection is active the hook behaves exactly like `useQuery`.
 *
 * Only subscribes when `enabled` is not `false` — queries that are disabled
 * don't participate in realtime updates.
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
  TQueryKey extends AnyKey = AnyKey,
>(
  options: RealtimeQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
) {
  const { client } = useRealtimeContext()
  const queryClient = useQueryClient()

  const serializedKey = serializeKey(options.queryKey as AnyKey)
  // Keep a ref so the invalidation listener always sees the current key
  // without needing to be recreated.
  const serializedKeyRef = useRef(serializedKey)
  serializedKeyRef.current = serializedKey

  const enabled = options.enabled !== false

  useEffect(() => {
    if (!enabled) return

    client.subscribe(serializedKey)

    const unsubscribe = client.onInvalidate((key) => {
      if (key === serializedKeyRef.current) {
        void queryClient.invalidateQueries({
          queryKey: options.queryKey as unknown[],
        })
      }
    })

    return () => {
      client.unsubscribe(serializedKey)
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, serializedKey, queryClient, enabled])

  return useQuery(options)
}
