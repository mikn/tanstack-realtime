import { computed, onUnmounted, ref, shallowRef, toValue, watch } from 'vue'
import { deriveCacheKey, getOrCreateQueryCollection } from '@tanstack/realtime'
import { useRealtimeClient } from './context.js'
import { useOnReconnect } from './useOnReconnect.js'
import type { QueryEntry, ReactiveQueryFn } from '@tanstack/realtime'
import type { Collection } from '@tanstack/db'
import type { ComputedRef, MaybeRef, Ref } from 'vue'

export interface UseQueryOptions {
  enabled?: MaybeRef<boolean>
  refetchOnReconnect?: MaybeRef<boolean>
}

export interface UseQueryResult<TResult> {
  /** The most recently fetched (or server-pushed) data, or `undefined` before the first fetch. */
  data: Ref<TResult | undefined>
  /** `true` when data is `undefined` AND a fetch is in progress (initial load). */
  isPending: ComputedRef<boolean>
  /** `true` while any fetch is in progress (including background re-fetches). */
  isFetching: Ref<boolean>
  /** The error from the last failed fetch, or `null` if the last fetch succeeded. */
  error: Ref<unknown>
  /** Manually trigger a re-fetch with the current args. */
  refetch: () => void
  /** Apply an optimistic update. Returns a rollback function. */
  optimisticUpdate: (
    transform: (prev: TResult | undefined) => TResult,
  ) => () => void
  /** `true` while an optimistic update is in effect and has not yet been confirmed by the server. */
  isOptimistic: Ref<boolean>
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
 * // Component.vue
 * const { data, isPending, error } = useQuery(
 *   getTodos,
 *   computed(() => ({ teamId: currentTeamId.value })),
 * )
 */
export function useQuery<TArgs, TResult>(
  serverFn: ReactiveQueryFn<TArgs, TResult>,
  args: MaybeRef<TArgs>,
  options: UseQueryOptions = {},
): UseQueryResult<TResult> {
  const client = useRealtimeClient('useQuery')

  const isFetching = ref(false)
  const isOptimistic = ref(false)
  const snapshotRef: { current: TResult | undefined } = { current: undefined }
  const optimisticValueRef = ref<TResult | undefined>(undefined)

  const entry = shallowRef<QueryEntry<TResult> | undefined>(undefined)

  const data: Ref<TResult | undefined> = computed(
    () => entry.value?.value,
  ) as unknown as Ref<TResult | undefined>

  const error: Ref<unknown> = computed(
    () => entry.value?.error ?? null,
  ) as unknown as Ref<unknown>

  const isPending: ComputedRef<boolean> = computed(() => {
    const enabled = toValue(options.enabled) ?? true
    if (!enabled) return false
    return entry.value?.value === undefined && entry.value?.error == null
  })

  let collectionRef: Collection<QueryEntry<unknown>, string> | null = null
  let registryRefetch: (() => void) | null = null
  let changesUnsub: (() => void) | null = null

  function setupCollection(currentArgs: TArgs): void {
    changesUnsub?.()
    changesUnsub = null
    collectionRef = null
    registryRefetch = null

    const enabled = toValue(options.enabled) ?? true
    if (!enabled) {
      entry.value = undefined
      return
    }

    const cacheKey = deriveCacheKey(
      serverFn as unknown as Function,
      currentArgs,
    )

    const registryEntry = getOrCreateQueryCollection<TResult>(
      cacheKey,
      serverFn as unknown as (
        a: unknown,
      ) => Promise<{ data: TResult; channel: string }>,
      currentArgs,
      client,
    )

    collectionRef = registryEntry.collection
    registryRefetch = registryEntry.refetch

    const typedCollection = collectionRef as unknown as Collection<
      QueryEntry<TResult>,
      string
    >

    const sub = typedCollection.subscribeChanges((changes) => {
      for (const change of changes) {
        if (change.key === 'result') {
          if (change.type === 'delete') {
            entry.value = undefined
            if (isOptimistic.value) {
              isOptimistic.value = false
              optimisticValueRef.value = undefined
            }
          } else {
            const incoming = change.value
            entry.value = incoming
            if (isFetching.value && incoming.value !== undefined) {
              isFetching.value = false
            }
            if (
              isOptimistic.value &&
              incoming.value !== optimisticValueRef.value
            ) {
              isOptimistic.value = false
              optimisticValueRef.value = undefined
            }
          }
        }
      }
    })

    changesUnsub = () => sub.unsubscribe()
  }

  watch(
    [() => toValue(args), () => toValue(options.enabled) ?? true],
    ([currentArgs]) => {
      setupCollection(currentArgs)
    },
    {
      immediate: true,
      deep: true,
    },
  )

  function optimisticUpdate(
    transform: (prev: TResult | undefined) => TResult,
  ): () => void {
    if (collectionRef == null) return () => undefined

    const typedCollection = collectionRef as unknown as Collection<
      QueryEntry<TResult>,
      string
    >

    snapshotRef.current = entry.value?.value
    const newValue = transform(snapshotRef.current)
    optimisticValueRef.value = newValue
    isOptimistic.value = true

    typedCollection.update('result', (draft) => {
      ;(draft as QueryEntry<TResult>).value = newValue
    })

    return () => {
      isOptimistic.value = false
      optimisticValueRef.value = undefined
      const snapshot = snapshotRef.current
      typedCollection.update('result', (draft) => {
        ;(draft as QueryEntry<TResult>).value = snapshot
      })
    }
  }

  function refetch(): void {
    isFetching.value = true
    registryRefetch?.()
  }

  useOnReconnect(() => {
    const shouldRefetch = toValue(options.refetchOnReconnect) ?? true
    if (shouldRefetch) refetch()
  })

  onUnmounted(() => {
    changesUnsub?.()
    changesUnsub = null
  })

  return {
    data: data as unknown as Ref<TResult | undefined>,
    isPending,
    isFetching,
    error,
    refetch,
    optimisticUpdate,
    isOptimistic,
  }
}
