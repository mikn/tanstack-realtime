/**
 * Solid primitive that drives a TanStack DB CollectionConfig's sync engine
 * and exposes the result as a reactive Solid signal.
 *
 * Equivalent to the React `useCollectionSync` hook in app/app/useCollectionSync.ts,
 * adapted for Solid's reactive model: setup runs once when the component mounts
 * (inside its reactive owner), and `onCleanup` handles disposal.
 */
import { createSignal, onCleanup } from 'solid-js'

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
 * Drives a CollectionConfig's sync engine and returns a reactive accessor.
 *
 * Call inside a Solid component (or createRoot) so that `onCleanup` is scoped
 * to the component's lifetime. The factory function is called once on creation.
 *
 * @param getConfig  Factory that returns the CollectionConfig (called once).
 * @param getKey     Optional key extractor for delete operations.
 */
export function createCollectionSync<T>(
  getConfig: () => CollectionLike,
  getKey?: (item: T) => unknown,
): () => Array<T> {
  const [items, setItems] = createSignal<Array<T>>([])
  const map = new Map<unknown, T>()
  let keyCounter = 0

  const config = getConfig()

  const stop = config.sync.sync({
    collection: null,
    begin: () => {},
    write(op) {
      if (op.type === 'insert' || op.type === 'update') {
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
      setItems([...map.values()])
    },
    markReady() {
      setItems([...map.values()])
    },
    truncate() {
      map.clear()
    },
  })

  onCleanup(() => {
    if (typeof stop === 'function') stop()
  })

  return items
}
