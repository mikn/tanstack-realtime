import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'
import { deriveCacheKey, getOrCreateQueryCollection } from '@tanstack/realtime'
import { useRealtimeClient } from './context.js'
import { useOnReconnect } from './useOnReconnect.js'
import type { Accessor } from 'solid-js'
import type { Collection } from '@tanstack/db'
import type { QueryEntry, ReactiveQueryResult } from '@tanstack/realtime'

export type { ReactiveQueryResult }

export interface CreateReactiveQueryOptions {
  enabled?: Accessor<boolean>
  refetchOnReconnect?: Accessor<boolean>
}

/**
 * Fetches data from a server function that returns `{ data, channel }`, then
 * subscribes to the returned channel for live updates.
 *
 * Unlike the previous implementation, this version stores query state in a
 * module-level TanStack DB Collection registry. Components sharing the same
 * `(serverFn, args)` pair share one collection, one fetch, and one SSE
 * subscription.
 *
 * Re-fetches automatically when `args` changes (tracked reactively via
 * Solid's fine-grained reactivity).
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * const { data, isPending, isFetching, error, refetch } = createReactiveQuery(
 *   (args) => fetchTodosWithChannel(args),
 *   () => ({ userId: props.userId }),
 * )
 */
export function createReactiveQuery<TResult, TArgs>(
  serverFn: (args: TArgs) => Promise<ReactiveQueryResult<TResult>>,
  args: Accessor<TArgs>,
  options: CreateReactiveQueryOptions = {},
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const client = useRealtimeClient('createReactiveQuery')

  // Per-hook local state
  const [isFetching, setIsFetching] = createSignal(false)
  const [isOptimistic, setIsOptimistic] = createSignal(false)

  // Reactive signal that holds the current QueryEntry read from the collection.
  // We update it manually by subscribing to collection changes.
  const [entry, setEntry] = createSignal<QueryEntry<TResult> | undefined>(
    undefined,
  )

  // The current registry entry (collection + refetch). Null when disabled.
  const [registryEntry, setRegistryEntry] = createSignal<{
    collection: Collection<QueryEntry<unknown>, string>
    refetch: () => void
  } | null>(null)

  // Derived cache key — recomputed whenever args changes.
  const cacheKey = createMemo(() => {
    const enabled = options.enabled?.() ?? true
    if (!enabled) return null
    return deriveCacheKey(serverFn as Function, args())
  })

  // Effect: obtain (or create) the collection whenever the cache key changes.
  createEffect(() => {
    const key = cacheKey()
    if (key == null) {
      setRegistryEntry(null)
      return
    }

    const re = getOrCreateQueryCollection<TResult>(
      key,
      serverFn as (a: unknown) => Promise<ReactiveQueryResult<TResult>>,
      args(),
      client,
    )

    setRegistryEntry(
      re as {
        collection: Collection<QueryEntry<unknown>, string>
        refetch: () => void
      },
    )

    // Subscribe to collection changes so that `entry` stays reactive.
    const col = re.collection as Collection<QueryEntry<TResult>, string>

    // Read current value immediately.
    const current = col.get('result')
    setEntry(current)

    // Listen for future changes.
    const sub = col.subscribeChanges(() => {
      setEntry(col.get('result'))
      // Clear fetching flag once data arrives.
      if (col.get('result')?.value !== undefined) {
        setIsFetching(false)
      }
      // Clear optimistic flag when server value changes (a new sync write
      // arrived, meaning the server confirmed or replaced the optimistic value).
      if (isOptimistic()) {
        setIsOptimistic(false)
      }
    })

    onCleanup(() => {
      sub.unsubscribe()
    })
  })

  // Auto-reconnect refetch
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useOnReconnect(() => {
    const shouldRefetch = options.refetchOnReconnect?.() ?? true
    if (shouldRefetch) {
      setIsFetching(true)
      registryEntry()?.refetch()
    }
  })

  const typedEntry = createMemo(() => entry())

  const data = createMemo(() => typedEntry()?.value)

  const isPending = createMemo(() => {
    const enabled = options.enabled?.() ?? true
    if (!enabled) return false
    const e = typedEntry()
    return (e === undefined || e.value === undefined) && e?.error == null
  })

  const error = createMemo(() => typedEntry()?.error ?? null)

  function optimisticUpdate(
    transform: (prev: TResult | undefined) => TResult,
  ): () => void {
    const col = registryEntry()?.collection as
      | Collection<QueryEntry<TResult>, string>
      | undefined
    if (col == null) return () => undefined

    const snapshot = col.get('result')?.value
    setIsOptimistic(true)
    const newValue = transform(snapshot)

    col.update('result', (draft) => {
      ;(draft as QueryEntry<TResult>).value = newValue
    })

    return () => {
      setIsOptimistic(false)
      col.update('result', (draft) => {
        ;(draft as QueryEntry<TResult>).value = snapshot
      })
    }
  }

  function refetch() {
    setIsFetching(true)
    registryEntry()?.refetch()
  }

  return {
    data,
    isPending,
    isFetching,
    error,
    isOptimistic,
    optimisticUpdate,
    refetch,
  }
}
