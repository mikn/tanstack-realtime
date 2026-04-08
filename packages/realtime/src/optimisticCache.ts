import {
  deriveCacheKey,
  lookupQueryCollection,
} from './queryCollectionRegistry.js'
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
  update: <TArgs, TItem extends Record<string, unknown>>(
    queryFn: ReactiveQueryFn<TArgs, Array<TItem>>,
    args: TArgs,
    transform: (prev: Array<TItem>) => Array<TItem>,
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
export function createOptimisticCache(): {
  cache: OptimisticCache
  rollback: () => void
} {
  const rollbacks: Array<() => void> = []

  const cache: OptimisticCache = {
    update<TArgs, TItem extends Record<string, unknown>>(
      queryFn: ReactiveQueryFn<TArgs, Array<TItem>>,
      args: TArgs,
      transform: (prev: Array<TItem>) => Array<TItem>,
    ): void {
      const key = deriveCacheKey(queryFn as unknown as Function, args)
      const entry = lookupQueryCollection<TItem>(key)
      if (entry == null) {
        // Query not currently mounted — skip silently.
        return
      }

      // Snapshot the server-confirmed state for rollback.
      const snapshot = new Map(entry.currentItems)

      // Compute the new optimistic item list.
      const prevItems = Array.from(entry.currentItems.values())
      const newItems = transform(prevItems)

      const prevKeys = new Set(snapshot.keys())
      const newKeys = new Set(newItems.map((item) => entry.getKey(item)))

      // Delete items removed by the transform.
      for (const k of prevKeys) {
        if (!newKeys.has(k)) {
          entry.collection.delete(k)
          entry.currentItems.delete(k)
        }
      }

      // Insert new items / update changed items.
      for (const item of newItems) {
        const k = entry.getKey(item)
        if (prevKeys.has(k)) {
          entry.collection.update(k, (draft) => {
            Object.assign(draft as object, item)
          })
        } else {
          entry.collection.insert(item)
        }
        entry.currentItems.set(k, item)
      }

      rollbacks.push(() => {
        const currentKeys = new Set(entry.currentItems.keys())
        const snapshotKeys = new Set(snapshot.keys())

        // Delete items that were added by the optimistic update.
        for (const k of currentKeys) {
          if (!snapshotKeys.has(k)) {
            entry.collection.delete(k)
          }
        }

        // Restore items that were updated or removed.
        for (const [k, item] of snapshot) {
          if (!currentKeys.has(k)) {
            entry.collection.insert(item)
          } else {
            entry.collection.update(k, (draft) => {
              Object.assign(draft as object, item)
            })
          }
        }

        // Restore the tracking map.
        entry.currentItems.clear()
        for (const [k, item] of snapshot) {
          entry.currentItems.set(k, item)
        }
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
