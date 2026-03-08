import { onUnmounted, ref } from 'vue'
import { mergePn, pnDecrement, pnIncrement, pnValue } from '@tanstack/realtime'
import { useRealtimeClient } from './context.js'
import type { Ref } from 'vue'
import type { PnState, SyncedCounterDef } from '@tanstack/realtime'

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
  /** Current counter value, reactive. */
  value: Ref<number>
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
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * const { value, increment, decrement } = useSyncedCounter(postVotes, {
 *   params: { postId: post.id },
 *   initial: post.votes,
 * })
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

  // CRDT state — plain variable, updated synchronously.
  let crdtState: PnState = { inc: {}, dec: {} }
  // Track whether we have received any server state yet.
  let hasServerState = false
  const initialValue = initial

  const value = ref<number>(initial)

  const unsub = client.subscribe(channel, (raw) => {
    const msg = raw as {
      _crdt?: string
      inc?: Record<string, number>
      dec?: Record<string, number>
    }
    if (msg._crdt !== 'pn') return

    const serverState: PnState = { inc: msg.inc ?? {}, dec: msg.dec ?? {} }
    const merged = mergePn(serverState, crdtState)
    crdtState = merged
    hasServerState = true
    value.value = pnValue(merged)
  })

  onUnmounted(() => unsub())

  const increment = (by = 1): void => {
    const next = pnIncrement(crdtState, client.clientId, by)
    crdtState = next

    // Before server state: display initial + local delta so there's no jump.
    value.value = hasServerState ? pnValue(next) : initialValue + pnValue(next)

    void client.publish(channel, {
      _crdt: 'pn',
      inc: next.inc,
      dec: next.dec,
    })
  }

  const decrement = (by = 1): void => {
    const next = pnDecrement(crdtState, client.clientId, by)
    crdtState = next

    value.value = hasServerState ? pnValue(next) : initialValue + pnValue(next)

    void client.publish(channel, {
      _crdt: 'pn',
      inc: next.inc,
      dec: next.dec,
    })
  }

  // Suppress unused-var for initialValue (used in increment/decrement closures).
  void initialValue

  return { value, increment, decrement }
}
