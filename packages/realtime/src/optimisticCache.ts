import {
  deriveCacheKey,
  getOrCreateQueryCollection,
} from './queryCollectionRegistry.js'
import type { RealtimeClient } from './core/types.js'
import type { ReactiveQueryFn } from './queryCollectionRegistry.js'

/**
 * Declarative optimistic update API passed to `useMutation`'s `optimistic` callback.
 *
 * Call `cache.update(queryFn, args, transform)` to optimistically update any
 * reactive query's cached data. All updates are tracked for automatic rollback
 * if the mutation fails.
 *
 * @example
 * useMutation(createTodo, {
 *   optimistic: (cache, args) => {
 *     cache.update(getTodos, { teamId: args.teamId }, (prev) => [
 *       ...(prev ?? []),
 *       { id: 'temp', title: args.title, done: false },
 *     ])
 *   },
 * })
 */
export interface OptimisticCache {
  update: <TArgs, TResult>(
    queryFn: ReactiveQueryFn<TArgs, TResult>,
    args: TArgs,
    transform: (prev: TResult | undefined) => TResult,
  ) => void
}

/**
 * Creates a scoped `OptimisticCache` and a paired `rollback` function.
 *
 * Call `cache.update(...)` to speculatively mutate cached query data.
 * Call `rollback()` to restore all snapshots taken before the updates.
 *
 * Intended for use inside `useMutation`'s internal mutate flow:
 * apply optimistic updates before the server call, then rollback on error
 * (or let the SSE push confirm on success).
 */
export function createOptimisticCache(client: RealtimeClient): {
  cache: OptimisticCache
  rollback: () => void
} {
  const rollbacks: Array<() => void> = []

  const cache: OptimisticCache = {
    update<TArgs, TResult>(
      queryFn: ReactiveQueryFn<TArgs, TResult>,
      args: TArgs,
      transform: (prev: TResult | undefined) => TResult,
    ): void {
      const key = deriveCacheKey(queryFn as unknown as Function, args)
      const entry = getOrCreateQueryCollection<TResult>(
        key,
        queryFn as unknown as (
          a: unknown,
        ) => Promise<{ data: TResult; channel: string }>,
        args,
        client,
      )

      const snapshot = (
        entry.collection as unknown as {
          get: (key: string) => { value: TResult | undefined } | undefined
        }
      ).get('result')?.value

      entry.collection.update('result', (draft) => {
        const newValue = transform(
          (draft as unknown as { value: TResult | undefined }).value,
        )
        ;(draft as unknown as { value: TResult }).value = newValue
      })

      rollbacks.push(() => {
        entry.collection.update('result', (draft) => {
          ;(draft as unknown as { value: TResult | undefined }).value = snapshot
        })
      })
    },
  }

  return {
    cache,
    rollback: () => {
      rollbacks.reverse().forEach((rb) => rb())
      rollbacks.length = 0
    },
  }
}
