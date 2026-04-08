import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'
import { deriveCacheKey, getOrCreateQueryCollection } from '@tanstack/realtime'
import { useRealtimeClient } from './context.js'
import { useOnReconnect } from './useOnReconnect.js'
import type { Accessor } from 'solid-js'
import type { Collection } from '@tanstack/db'
import type { ReactiveQueryFn } from '@tanstack/realtime'

export interface CreateQueryOptions<TItem> {
  /** Extract a stable string key from each item. Required. */
  getKey: (item: TItem) => string
  enabled?: Accessor<boolean>
  refetchOnReconnect?: Accessor<boolean>
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
 * use it with `createLiveQuery` for client-side filtering, sorting, or joining.
 *
 * @example
 * // server.ts
 * export const getTodos = realtime.query(async ({ teamId }) =>
 *   db.select().from(todos).where(eq(todos.teamId, teamId))
 * )
 *
 * // Component.tsx (Solid)
 * const { data, isPending } = createQuery(
 *   getTodos,
 *   () => ({ teamId: props.teamId }),
 *   { getKey: (t) => t.id },
 * )
 */
export function createQuery<TArgs, TItem>(
  serverFn: ReactiveQueryFn<TArgs, Array<TItem>>,
  args: Accessor<TArgs>,
  options: CreateQueryOptions<TItem>,
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const client = useRealtimeClient('createQuery')

  const [isFetching, setIsFetching] = createSignal(false)
  const [error, setError] = createSignal<unknown>(null)
  const [isReady, setIsReady] = createSignal(false)
  const [itemsMap, setItemsMap] = createSignal<Map<string, TItem>>(new Map())

  const [registryEntry, setRegistryEntry] = createSignal<ReturnType<
    typeof getOrCreateQueryCollection<TItem>
  > | null>(null)

  const cacheKey = createMemo(() => {
    const enabled = options.enabled?.() ?? true
    if (!enabled) return null
    return deriveCacheKey(serverFn as unknown as Function, args())
  })

  createEffect(() => {
    const key = cacheKey()
    if (key == null) {
      setRegistryEntry(null)
      setItemsMap(new Map())
      setIsReady(false)
      setError(null)
      return
    }

    const re = getOrCreateQueryCollection<TItem>(
      key,
      serverFn as unknown as (
        a: unknown,
      ) => Promise<{ data: Array<TItem>; channel: string }>,
      args(),
      options.getKey,
      client,
    )

    setRegistryEntry(re)

    // Sync any state that already resolved before this effect ran
    if (re.isReady) setIsReady(true)
    if (re.error != null) setError(re.error)
    setItemsMap(new Map(re.currentItems))

    // Listen for first-ready signal
    const onReady = () => setIsReady(true)
    re.readyListeners.add(onReady)

    // Listen for errors
    const onError = (e: unknown) => setError(e)
    re.errorListeners.add(onError)

    // Listen for data updates to clear isFetching and refresh itemsMap
    const onData = () => {
      setIsFetching(false)
      setItemsMap(new Map(re.currentItems))
    }
    re.dataListeners.add(onData)

    // Subscribe to collection changes to keep itemsMap reactive
    const sub = (re.collection as Collection<TItem, string>).subscribeChanges(
      (changes) => {
        setItemsMap((prev) => {
          const next = new Map(prev)
          for (const change of changes) {
            if (change.type === 'delete') {
              next.delete(String(change.key))
            } else {
              next.set(String(change.key), change.value)
            }
          }
          return next
        })
      },
    )

    onCleanup(() => {
      re.readyListeners.delete(onReady)
      re.errorListeners.delete(onError)
      re.dataListeners.delete(onData)
      sub.unsubscribe()
    })
  })

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useOnReconnect(() => {
    const shouldRefetch = options.refetchOnReconnect?.() ?? true
    if (shouldRefetch) {
      setIsFetching(true)
      registryEntry()?.refetch()
    }
  })

  const data = createMemo(() => Array.from(itemsMap().values()))

  const collection = createMemo(
    () =>
      (registryEntry()?.collection ?? null) as Collection<TItem, string> | null,
  )

  const isPending = createMemo(() => {
    const enabled = options.enabled?.() ?? true
    if (!enabled) return false
    return !isReady()
  })

  function refetch() {
    setIsFetching(true)
    registryEntry()?.refetch()
  }

  return {
    data,
    collection,
    isPending,
    isFetching,
    error,
    refetch,
  }
}
