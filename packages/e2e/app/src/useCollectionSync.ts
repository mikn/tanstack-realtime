/**
 * Minimal React hook that drives a TanStack DB CollectionConfig's sync engine
 * and exposes the result as plain React state.
 *
 * This mirrors the `driveSync` helper used in the Vitest unit tests
 * (spectrum.test.ts, docsExamples.test.ts) but integrates with the React
 * lifecycle so components re-render on every commit/markReady call.
 *
 * No dependency on @tanstack/react-db or useLiveQuery — the hook is
 * intentionally minimal so the demo app exercises the collection options
 * code paths without additional framework overhead.
 */

import { useEffect, useRef, useState } from 'react'

// Loose type mirroring CollectionConfig.sync.sync's callback parameter.
interface SyncCallbacks {
  collection: null
  begin: (opts?: unknown) => void
  write: (op: { type: string; key?: unknown; value?: unknown }) => void
  commit: () => void
  markReady: () => void
  truncate: () => void
}

interface CollectionLike {
  sync: {
    sync: (callbacks: SyncCallbacks) => (() => void) | void
  }
}

/**
 * Drives a CollectionConfig's sync engine and returns a reactive array of items.
 *
 * @param getConfig  A stable factory that returns the CollectionConfig.
 *                   Pass a function so the config is created once on mount.
 * @param getKey     Optional key extractor. Required when the collection uses
 *                   delete operations: TanStack DB's write callback omits `key`
 *                   for insert/update messages, so without this function inserts
 *                   use auto-increment keys that don't match the delete key.
 */
export function useCollectionSync<T>(
  getConfig: () => CollectionLike,
  getKey?: (item: T) => unknown,
): Array<T> {
  const [items, setItems] = useState<Array<T>>([])
  // Stable ref so we don't re-run the effect when `items` changes.
  const getConfigRef = useRef(getConfig)
  getConfigRef.current = getConfig

  useEffect(() => {
    const map = new Map<unknown, T>()
    let stopped = false
    let keyCounter = 0

    const config = getConfigRef.current()

    const stop = config.sync.sync({
      collection: null,
      begin: () => {},
      write(op) {
        if (op.type === 'insert' || op.type === 'update') {
          // TanStack DB's ChangeMessageOrDeleteKeyMessage omits `key` for
          // insert/update. Derive it from getKey if provided, else auto-increment.
          const key =
            op.key !== undefined
              ? op.key
              : getKey && op.value !== undefined
                ? getKey(op.value as T)
                : ++keyCounter
          map.set(key, op.value as T)
        } else if (op.type === 'delete') {
          map.delete(op.key)
        }
      },
      commit() {
        if (!stopped) setItems([...map.values()])
      },
      markReady() {
        if (!stopped) setItems([...map.values()])
      },
      truncate() {
        map.clear()
      },
    })

    return () => {
      stopped = true
      if (typeof stop === 'function') stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // getConfig / getKey are accessed via refs — intentionally omitted.

  return items
}
