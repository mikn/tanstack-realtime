import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'
import { deriveCacheKey, getOrCreateQueryCollection } from '@tanstack/realtime'
import { useRealtimeClient } from './context.js'
import { useOnReconnect } from './useOnReconnect.js'
import type { Accessor } from 'solid-js'
import type { Collection } from '@tanstack/db'
import type { QueryEntry, ReactiveQueryFn } from '@tanstack/realtime'

export interface CreateQueryOptions {
  enabled?: Accessor<boolean>
  refetchOnReconnect?: Accessor<boolean>
}

/**
 * Fetches data from a reactive server function and subscribes to the returned
 * channel for live updates.
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
 * // Component.tsx (Solid)
 * const { data, isPending, error } = createQuery(
 *   getTodos,
 *   () => ({ teamId: props.teamId }),
 * )
 */
export function createQuery<TArgs, TResult>(
  serverFn: ReactiveQueryFn<TArgs, TResult>,
  args: Accessor<TArgs>,
  options: CreateQueryOptions = {},
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const client = useRealtimeClient('createQuery')

  const [isFetching, setIsFetching] = createSignal(false)
  const [isOptimistic, setIsOptimistic] = createSignal(false)
  const [optimisticValue, setOptimisticValue] = createSignal<
    TResult | undefined
  >(undefined)

  const [entry, setEntry] = createSignal<QueryEntry<TResult> | undefined>(
    undefined,
  )

  const [registryEntry, setRegistryEntry] = createSignal<{
    collection: Collection<QueryEntry<unknown>, string>
    refetch: () => void
  } | null>(null)

  const cacheKey = createMemo(() => {
    const enabled = options.enabled?.() ?? true
    if (!enabled) return null
    return deriveCacheKey(serverFn as unknown as Function, args())
  })

  createEffect(() => {
    const key = cacheKey()
    if (key == null) {
      setRegistryEntry(null)
      return
    }

    const re = getOrCreateQueryCollection<TResult>(
      key,
      serverFn as unknown as (
        a: unknown,
      ) => Promise<{ data: TResult; channel: string }>,
      args(),
      client,
    )

    setRegistryEntry(
      re as {
        collection: Collection<QueryEntry<unknown>, string>
        refetch: () => void
      },
    )

    const col = re.collection as Collection<QueryEntry<TResult>, string>

    const current = col.get('result')
    setEntry(current)

    const sub = col.subscribeChanges((changes) => {
      const resultChange = changes.find((c) => c.key === 'result')
      if (resultChange === undefined) return

      const incoming =
        resultChange.type === 'delete' ? undefined : resultChange.value

      if (incoming?.value !== undefined) {
        setIsFetching(false)
      }
      if (isOptimistic() && incoming?.value !== optimisticValue()) {
        setIsOptimistic(false)
        setOptimisticValue(undefined)
      }
      setEntry(incoming)
    })

    onCleanup(() => {
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
    const newValue = transform(snapshot)
    setOptimisticValue(() => newValue)
    setIsOptimistic(true)

    col.update('result', (draft) => {
      ;(draft as QueryEntry<TResult>).value = newValue
    })

    return () => {
      setIsOptimistic(false)
      setOptimisticValue(undefined)
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
