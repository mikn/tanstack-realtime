import { use, useCallback, useEffect, useRef, useState } from 'react'
import { mergePn, pnDecrement, pnIncrement, pnValue } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'
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
  value: number
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
 *   <button onClick={() => increment()}>▲ {value}</button>
 *   <button onClick={() => decrement()}>▼</button>
 * )
 */
export function useSyncedCounter<
  TParams extends Record<string, unknown> = Record<string, unknown>,
>(
  def: SyncedCounterDef<TParams>,
  options: UseSyncedCounterOptions<TParams>,
): UseSyncedCounterResult {
  const client = use(RealtimeContext)
  if (!client) {
    throw new Error(
      '[realtime] useSyncedCounter must be used inside <RealtimeProvider>.',
    )
  }

  const { params, initial = 0 } = options
  const channel = def.resolveChannel(params)

  // CRDT state in a ref so mutation callbacks always close over the latest value.
  const crdtRef = useRef<PnState>({ inc: {}, dec: {} })
  // Track whether we have received any server state yet.
  const hasServerState = useRef(false)
  // The initial offset is added to local-only deltas before server state arrives.
  const initialRef = useRef(initial)

  const [value, setValue] = useState(initial)

  // Keep channel ref stable for the effect to avoid double-subscribe on hot reload.
  const channelRef = useRef(channel)
  channelRef.current = channel

  useEffect(() => {
    // Reset when channel changes.
    crdtRef.current = { inc: {}, dec: {} }
    hasServerState.current = false
    initialRef.current = options.initial ?? 0
    setValue(initialRef.current)

    const unsub = client.subscribe(channelRef.current, (raw) => {
      const msg = raw as {
        _crdt?: string
        inc?: Record<string, number>
        dec?: Record<string, number>
      }
      if (msg._crdt !== 'pn') return

      // Merge server state with any local ops we already applied.
      const serverState: PnState = { inc: msg.inc ?? {}, dec: msg.dec ?? {} }
      const merged = mergePn(serverState, crdtRef.current)
      crdtRef.current = merged
      hasServerState.current = true
      setValue(pnValue(merged))
    })

    return unsub
    // `options.initial` intentionally excluded — channel change is the only
    // trigger that should reset state. Matches the usePresence convention.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, channel])

  const increment = useCallback(
    (by = 1) => {
      const next = pnIncrement(crdtRef.current, client.clientId, by)
      crdtRef.current = next

      // Before server state: display initial + local delta so there's no jump.
      setValue(
        hasServerState.current
          ? pnValue(next)
          : initialRef.current + pnValue(next),
      )

      void client.publish(channelRef.current, {
        _crdt: 'pn',
        inc: next.inc,
        dec: next.dec,
      })
    },
    [client],
  )

  const decrement = useCallback(
    (by = 1) => {
      const next = pnDecrement(crdtRef.current, client.clientId, by)
      crdtRef.current = next

      setValue(
        hasServerState.current
          ? pnValue(next)
          : initialRef.current + pnValue(next),
      )

      void client.publish(channelRef.current, {
        _crdt: 'pn',
        inc: next.inc,
        dec: next.dec,
      })
    },
    [client],
  )

  return { value, increment, decrement }
}
