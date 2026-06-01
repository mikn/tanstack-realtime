import { onUnmounted, ref } from 'vue'
import {
  initOrFromArray,
  mergeOr,
  orAdd,
  orHas,
  orRemove,
  orValues,
} from '@realtimejs/core'
import { useRealtimeClient } from './context.js'
import type { Ref } from 'vue'
import type { OrState, SyncedSetDef } from '@realtimejs/core'

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
  /** Current set elements, reactive. */
  values: Ref<Array<T>>
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
 * always converge correctly. An add always wins over a concurrent remove.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * const { values: tags, add, remove, has } = useSyncedSet(postTags, {
 *   params: { postId: post.id },
 *   initial: post.tags,
 * })
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
  let crdtState: OrState = initOrFromArray(initial)

  const values = ref<Array<T>>(initial) as Ref<Array<T>>

  const unsub = client.subscribe(channel, (raw) => {
    const msg = raw as {
      _crdt?: string
      entries?: Array<{ key: string; value: unknown; tag: string }>
    }
    if (msg._crdt !== 'or') return

    const incoming: OrState = { entries: msg.entries ?? [] }
    const merged = mergeOr(crdtState, incoming)
    crdtState = merged
    values.value = orValues<T>(merged)
  })

  onUnmounted(() => unsub())

  const add = (item: T): void => {
    const next = orAdd(crdtState, item)
    crdtState = next
    values.value = orValues<T>(next)

    void client.publish(channel, {
      _crdt: 'or',
      entries: next.entries,
    })
  }

  const remove = (item: T): void => {
    const next = orRemove(crdtState, item)
    crdtState = next
    values.value = orValues<T>(next)

    void client.publish(channel, {
      _crdt: 'or',
      entries: next.entries,
    })
  }

  const has = (item: T): boolean => orHas(crdtState, item)

  return { values, add, remove, has }
}
