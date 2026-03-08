/**
 * Vue composable that drives a TanStack DB CollectionConfig's sync engine
 * and exposes the result as a reactive Vue ref.
 *
 * Equivalent to the Solid `createCollectionSync` primitive in app-solid,
 * adapted for Vue's reactivity model: setup runs once during component setup,
 * and `onUnmounted` handles disposal.
 */
import { onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'

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
 * Drives a CollectionConfig's sync engine and returns a reactive ref.
 *
 * Call inside a Vue component's `setup` (or `<script setup>`) so that
 * `onUnmounted` is scoped to the component's lifetime.
 *
 * @param getConfig  Factory that returns the CollectionConfig (called once).
 * @param getKey     Optional key extractor for delete operations.
 */
export function useCollectionSync<T>(
  getConfig: () => CollectionLike,
  getKey?: (item: T) => unknown,
): Ref<Array<T>> {
  const items = ref<Array<T>>([]) as Ref<Array<T>>
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
      items.value = [...map.values()]
    },
    markReady() {
      items.value = [...map.values()]
    },
    truncate() {
      map.clear()
    },
  })

  onUnmounted(() => {
    if (typeof stop === 'function') stop()
  })

  return items
}
