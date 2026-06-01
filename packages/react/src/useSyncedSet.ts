import { use, useCallback, useEffect, useRef, useState } from 'react'
import {
  initOrFromArray,
  mergeOr,
  orAdd,
  orHas,
  orRemove,
  orValues,
} from '@realtimejs/core'
import { RealtimeContext } from './context.js'
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
  values: Array<T>
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
 *     {tags.map(tag => (
 *       <Tag key={tag} label={tag} onRemove={() => remove(tag)} />
 *     ))}
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
  const client = use(RealtimeContext)
  if (!client) {
    throw new Error(
      '[realtime] useSyncedSet must be used inside <RealtimeProvider>.',
    )
  }

  const { params, initial = [] } = options
  const channel = def.resolveChannel(params)

  // Seed OR-Set state from the initial array.
  // Entries get fresh unique tags — same as if each item had been `add()`ed.
  const crdtRef = useRef<OrState>(initOrFromArray(initial))

  const [values, setValues] = useState<Array<T>>(initial)

  const channelRef = useRef(channel)
  channelRef.current = channel

  useEffect(() => {
    // Reset when channel changes.
    const initItems = options.initial ?? []
    crdtRef.current = initOrFromArray(initItems)
    setValues(initItems)

    const unsub = client.subscribe(channelRef.current, (raw) => {
      const msg = raw as {
        _crdt?: string
        entries?: Array<{ key: string; value: unknown; tag: string }>
      }
      if (msg._crdt !== 'or') return

      const incoming: OrState = { entries: msg.entries ?? [] }
      const merged = mergeOr(crdtRef.current, incoming)
      crdtRef.current = merged
      setValues(orValues<T>(merged))
    })

    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, channel])

  const add = useCallback(
    (item: T) => {
      const next = orAdd(crdtRef.current, item)
      crdtRef.current = next
      setValues(orValues<T>(next))

      void client.publish(channelRef.current, {
        _crdt: 'or',
        entries: next.entries,
      })
    },
    [client],
  )

  const remove = useCallback(
    (item: T) => {
      const next = orRemove(crdtRef.current, item)
      crdtRef.current = next
      setValues(orValues<T>(next))

      void client.publish(channelRef.current, {
        _crdt: 'or',
        entries: next.entries,
      })
    },
    [client],
  )

  const has = useCallback(
    (item: T): boolean => orHas(crdtRef.current, item),
    [],
  )

  return { values, add, remove, has }
}
