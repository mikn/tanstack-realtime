import { createEffect, createSignal, onCleanup } from 'solid-js'
import type { Accessor } from 'solid-js'

/** Minimal structural type for a @tanstack/store Store — avoids a direct dep. */
interface TanstackStore<TState> {
  state: TState
  subscribe: (listener: (value: TState) => void) => { unsubscribe: () => void }
}

/**
 * Creates a reactive Solid signal that tracks a selected slice of a
 * `@tanstack/store` Store. The signal updates whenever the store state
 * changes and the selected value differs by reference.
 *
 * @internal
 */
export function createStoreSignal<TState, TSelected>(
  store: TanstackStore<TState>,
  selector: (state: TState) => TSelected,
): Accessor<TSelected> {
  const [value, setValue] = createSignal<TSelected>(selector(store.state))

  createEffect(() => {
    const sub = store.subscribe(() => {
      setValue(() => selector(store.state))
    })
    onCleanup(() => sub.unsubscribe())
  })

  return value
}
