import { createEffect, createSignal, onCleanup } from 'solid-js'
import { mergePn, pnDecrement, pnIncrement, pnValue } from '@realtimejs/core'
import { useRealtimeClient } from './context.js'
import type { Accessor } from 'solid-js'
import type { PnState, SyncedCounterDef } from '@realtimejs/core'

export interface UseSyncedCounterOptions<
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Runtime params used to resolve the channel key. */
  params: TParams
  /**
   * Value to display before the first server message arrives.
   * Does not affect CRDT state — once the server responds the correct total
   * is computed from the full per-client vector.
   *
   * @default 0
   */
  initial?: number
}

export interface UseSyncedCounterResult {
  /** Reactive accessor for the current counter value. */
  value: Accessor<number>
  /**
   * Increment the counter by `by` (default 1).
   * Applied instantly and broadcast to all peers.
   * Safe to call concurrently from multiple clients — increments always add up.
   */
  increment: (by?: number) => void
  /**
   * Decrement the counter by `by` (default 1).
   * Applied instantly and broadcast to all peers.
   */
  decrement: (by?: number) => void
}

/**
 * Subscribe to a shared counter channel backed by a PN-Counter CRDT.
 *
 * Concurrent `increment()` / `decrement()` calls from any number of clients
 * always converge to the correct total — no increments are ever lost, even
 * with simultaneous offline edits.
 *
 * @example
 * const { value, increment, decrement } = useSyncedCounter(postVotes, {
 *   params: { postId: post.id },
 *   initial: post.votes,
 * })
 *
 * return (
 *   <>
 *     <button onClick={() => increment()}>▲ {value()}</button>
 *     <button onClick={() => decrement()}>▼</button>
 *   </>
 * )
 */
export function useSyncedCounter<
  TParams extends Record<string, unknown> = Record<string, unknown>,
>(
  def: SyncedCounterDef<TParams>,
  options: UseSyncedCounterOptions<TParams>,
): UseSyncedCounterResult {
  const client = useRealtimeClient('useSyncedCounter')

  const { params, initial = 0 } = options
  const channel = def.resolveChannel(params)

  // CRDT state in a plain var so mutation callbacks always close over the
  // latest value without creating reactive dependencies.
  let crdt: PnState = { inc: {}, dec: {} }
  let hasServerState = false
  let currentInitial = initial
  let currentChannel = channel

  const [value, setValue] = createSignal(initial)

  createEffect(() => {
    currentChannel = channel
    // Reset when channel changes.
    crdt = { inc: {}, dec: {} }
    hasServerState = false
    currentInitial = options.initial ?? 0
    setValue(currentInitial)

    const unsub = client.subscribe(channel, (raw) => {
      const msg = raw as {
        _crdt?: string
        inc?: Record<string, number>
        dec?: Record<string, number>
      }
      if (msg._crdt !== 'pn') return

      // Merge server state with any local ops we already applied.
      const serverState: PnState = { inc: msg.inc ?? {}, dec: msg.dec ?? {} }
      const merged = mergePn(serverState, crdt)
      crdt = merged
      hasServerState = true
      setValue(pnValue(merged))
    })

    onCleanup(unsub)
    // `options.initial` intentionally excluded — channel change is the only
    // trigger that should reset state.
  })

  function increment(by = 1): void {
    const next = pnIncrement(crdt, client.clientId, by)
    crdt = next

    // Before server state: display initial + local delta so there's no jump.
    setValue(hasServerState ? pnValue(next) : currentInitial + pnValue(next))

    void client.publish(currentChannel, {
      _crdt: 'pn',
      inc: next.inc,
      dec: next.dec,
    })
  }

  function decrement(by = 1): void {
    const next = pnDecrement(crdt, client.clientId, by)
    crdt = next

    setValue(hasServerState ? pnValue(next) : currentInitial + pnValue(next))

    void client.publish(currentChannel, {
      _crdt: 'pn',
      inc: next.inc,
      dec: next.dec,
    })
  }

  return { value, increment, decrement }
}
