import { createEffect, createSignal, onCleanup } from 'solid-js'
import { serializeKey } from '@realtimejs/core'
import { useRealtimeClient } from './context.js'
import type { Accessor } from 'solid-js'
import type { QueryKey } from '@realtimejs/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseChannelStatsResult {
  /**
   * Reactive accessor for the total number of messages received on this
   * channel since the component mounted (or since the channel last changed).
   */
  messageCount: Accessor<number>
  /**
   * Reactive accessor for the timestamp (ms since epoch) of the most recently
   * received message. `null` before any message has arrived.
   */
  lastMessageAt: Accessor<number | null>
}

// ---------------------------------------------------------------------------
// Primitive
// ---------------------------------------------------------------------------

/**
 * Subscribes to a channel and tracks per-channel statistics.
 *
 * Provides a running message count and the timestamp of the last received
 * message. Useful for debug overlays, admin dashboards, and monitoring
 * components that need to observe channel activity without consuming the
 * message payloads themselves.
 *
 * Statistics reset automatically when `channel` changes.
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * function ChannelDebugBadge(props) {
 *   const { messageCount, lastMessageAt } = useChannelStats(props.channel)
 *   return (
 *     <span>
 *       {messageCount()} msgs
 *       <Show when={lastMessageAt()}>
 *         {(ts) => ` · last ${new Date(ts()).toLocaleTimeString()}`}
 *       </Show>
 *     </span>
 *   )
 * }
 */
export function useChannelStats(
  channel: QueryKey | string,
): UseChannelStatsResult {
  const client = useRealtimeClient('useChannelStats')

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const [messageCount, setMessageCount] = createSignal(0)
  const [lastMessageAt, setLastMessageAt] = createSignal<number | null>(null)

  // Plain counter so the subscription handler doesn't close over a stale signal.
  let count = 0

  createEffect(() => {
    // Reset when channel changes.
    count = 0
    setMessageCount(0)
    setLastMessageAt(null)

    const unsub = client.subscribe(serializedChannel, () => {
      count += 1
      setMessageCount(count)
      setLastMessageAt(Date.now())
    })

    onCleanup(unsub)
  })

  return { messageCount, lastMessageAt }
}
