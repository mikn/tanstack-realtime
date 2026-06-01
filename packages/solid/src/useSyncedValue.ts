import { createEffect, createSignal, onCleanup } from 'solid-js'
import { advanceClock, lwwWins, tickClock } from '@realtimejs/core'
import { useRealtimeClient } from './context.js'
import type { Accessor } from 'solid-js'
import type { LwwState, SyncedValueDef } from '@realtimejs/core'

export interface UseSyncedValueOptions<
  T,
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Runtime params used to resolve the channel key. */
  params: TParams
  /**
   * Value to display before the first server message arrives.
   * Once the server responds, LWW semantics take over: the write with the
   * highest Lamport clock wins regardless of arrival order.
   */
  initial: T
}

export interface UseSyncedValueResult<T> {
  /** Reactive accessor for the current value. */
  value: Accessor<T>
  /**
   * Set a new value and broadcast it to all peers.
   * Applied instantly. Uses a Lamport clock with clientId tie-breaking so
   * concurrent writes from multiple clients always converge to the same value.
   */
  set: (value: T) => void
}

/**
 * Subscribe to a shared value channel backed by a LWW-Register CRDT.
 *
 * The last write always wins, resolved by Lamport clock then client ID for
 * deterministic tie-breaking. Every connected client converges to the same
 * value regardless of message arrival order.
 *
 * @example
 * const { value: cursor, set: setCursor } = useSyncedValue(activeCursor, {
 *   params: { userId },
 *   initial: { x: 0, y: 0 },
 * })
 *
 * // Update on mouse move:
 * const onMouseMove = (e) => setCursor({ x: e.clientX, y: e.clientY })
 */
export function useSyncedValue<
  T,
  TParams extends Record<string, unknown> = Record<string, unknown>,
>(
  def: SyncedValueDef<T, TParams>,
  options: UseSyncedValueOptions<T, TParams>,
): UseSyncedValueResult<T> {
  const client = useRealtimeClient('useSyncedValue')

  const { params, initial } = options
  const channel = def.resolveChannel(params)

  // Current LWW state: { clock, clientId } for the winning value.
  // Starts at clock=0 so any server message (clock >= 1) will win.
  let lww: LwwState = { clock: 0, clientId: '' }
  let currentChannel = channel

  const [value, setValue] = createSignal<T>(initial)

  createEffect(() => {
    currentChannel = channel
    // Reset when channel changes.
    lww = { clock: 0, clientId: '' }
    setValue(() => options.initial)

    const unsub = client.subscribe(channel, (raw) => {
      const msg = raw as {
        _crdt?: string
        value?: T
        clock?: number
        clientId?: string
      }
      if (msg._crdt !== 'lww') return

      const incoming = {
        clock: msg.clock ?? 0,
        clientId: msg.clientId ?? '',
      }

      advanceClock(incoming.clock)

      if (lwwWins(lww, incoming)) {
        lww = incoming
        setValue(() => msg.value as T)
      }
    })

    onCleanup(unsub)
  })

  function set(newValue: T): void {
    const clock = tickClock()
    const state: LwwState = { clock, clientId: client.clientId }

    // Optimistic update — only apply if we would win our own race.
    if (lwwWins(lww, state)) {
      lww = state
      setValue(() => newValue)
    }

    void client.publish(currentChannel, {
      _crdt: 'lww',
      value: newValue,
      clock,
      clientId: client.clientId,
    })
  }

  return { value, set }
}
