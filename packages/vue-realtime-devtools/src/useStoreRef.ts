import { onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'

/** Minimal structural type for a @tanstack/store Store — avoids a direct dep. */
interface TanstackStore<TState> {
  state: TState
  subscribe: (listener: (value: TState) => void) => { unsubscribe: () => void }
}

/**
 * Creates a reactive Vue ref that tracks a selected slice of a
 * `@tanstack/store` Store. The ref updates whenever the store state changes.
 *
 * @internal
 */
export function useStoreRef<TState, TSelected>(
  store: TanstackStore<TState>,
  selector: (state: TState) => TSelected,
): Ref<TSelected> {
  const value = ref<TSelected>(selector(store.state)) as Ref<TSelected>

  const sub = store.subscribe(() => {
    value.value = selector(store.state)
  })

  onUnmounted(() => sub.unsubscribe())

  return value
}
