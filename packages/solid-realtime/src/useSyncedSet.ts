import { createEffect, createSignal, onCleanup } from 'solid-js'
import {
  initOrFromArray,
  mergeOr,
  orAdd,
  orHas,
  orRemove,
  orValues,
} from '@tanstack/realtime'
import { useRealtimeClient } from './context.js'
import type { Accessor } from 'solid-js'
import type { OrState, SyncedSetDef } from '@tanstack/realtime'

export interface UseSyncedSetOptions<
  T,
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Runtime params used to resolve the channel key. */
  params: TParams
  /**
   * Initial set elements to display before the first server message arrives.
   * Once the server responds, OR-Set semantics take over and this value is
   * no longer used.
   *
   * @default []
   */
  initial?: Array<T>
}

export interface UseSyncedSetResult<T> {
  /** Reactive accessor for the current set elements. */
  values: Accessor<Array<T>>
  /**
   * Add an element to the set and broadcast to all peers.
   * Applied instantly. Concurrent `add()` calls from any client always
   * survive — an add always wins over a concurrent `remove()`.
   */
  add: (item: T) => void
  /**
   * Remove an element from the set and broadcast to all peers.
   * Applied instantly. If another client concurrently adds the same element,
   * the add wins and the element remains in the set.
   */
  remove: (item: T) => void
  /**
   * Returns true if `item` is currently in the set.
   * Uses structural equality (JSON.stringify) so objects are compared by value.
   */
  has: (item: T) => boolean
}

/**
 * Subscribe to a shared set channel backed by an OR-Set CRDT.
 *
 * Concurrent `add()` and `remove()` calls from any number of clients
 * always converge correctly. An add always wins over a concurrent remove —
 * re-adding an item after it was removed creates a fresh entry that any
 * in-flight removes cannot affect.
 *
 * @example
 * const { values: tags, add, remove, has } = useSyncedSet(postTags, {
 *   params: { postId: post.id },
 *   initial: post.tags,
 * })
 *
 * return (
 *   <>
 *     <For each={tags()}>
 *       {(tag) => <Tag label={tag} onRemove={() => remove(tag)} />}
 *     </For>
 *     <button onClick={() => add('important')}>+ important</button>
 *   </>
 * )
 */
export function useSyncedSet<
  T,
  TParams extends Record<string, unknown> = Record<string, unknown>,
>(
  def: SyncedSetDef<T, TParams>,
  options: UseSyncedSetOptions<T, TParams>,
): UseSyncedSetResult<T> {
  const client = useRealtimeClient('useSyncedSet')

  const { params, initial = [] } = options
  const channel = def.resolveChannel(params)

  // Seed OR-Set state from the initial array.
  let crdt: OrState = initOrFromArray(initial)
  let currentChannel = channel

  const [values, setValues] = createSignal<Array<T>>(initial)

  createEffect(() => {
    currentChannel = channel
    // Reset when channel changes.
    const initItems = options.initial ?? []
    crdt = initOrFromArray(initItems)
    setValues([...initItems])

    const unsub = client.subscribe(channel, (raw) => {
      const msg = raw as {
        _crdt?: string
        entries?: Array<{ key: string; value: unknown; tag: string }>
      }
      if (msg._crdt !== 'or') return

      const incoming: OrState = { entries: msg.entries ?? [] }
      const merged = mergeOr(crdt, incoming)
      crdt = merged
      setValues(orValues<T>(merged))
    })

    onCleanup(unsub)
    // options.initial intentionally excluded — channel change is the only trigger
  })

  function add(item: T): void {
    const next = orAdd(crdt, item)
    crdt = next
    setValues(orValues<T>(next))

    void client.publish(currentChannel, {
      _crdt: 'or',
      entries: next.entries,
    })
  }

  function remove(item: T): void {
    const next = orRemove(crdt, item)
    crdt = next
    setValues(orValues<T>(next))

    void client.publish(currentChannel, {
      _crdt: 'or',
      entries: next.entries,
    })
  }

  function has(item: T): boolean {
    return orHas(crdt, item)
  }

  return { values, add, remove, has }
}
