import { use, useEffect, useRef, useState } from 'react'
import { serializeKey } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'
import type { QueryKey } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseChannelStatsResult {
  /**
   * Total number of messages received on this channel since the component
   * mounted (or since the channel last changed).
   */
  messageCount: number
  /**
   * Timestamp (ms since epoch) of the most recently received message.
   * `null` before any message has arrived.
   */
  lastMessageAt: number | null
}

// ---------------------------------------------------------------------------
// Hook
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
 * function ChannelDebugBadge({ channel }: { channel: string }) {
 *   const { messageCount, lastMessageAt } = useChannelStats(channel)
 *   return (
 *     <span>
 *       {messageCount} msgs
 *       {lastMessageAt && ` · last ${new Date(lastMessageAt).toLocaleTimeString()}`}
 *     </span>
 *   )
 * }
 *
 * @example
 * // Monitor multiple channels in a debug panel
 * const channels = ['chat:room1', 'presence:room1', 'cursors:room1']
 * return channels.map((ch) => {
 *   const stats = useChannelStats(ch) // call per-channel
 *   return <ChannelRow key={ch} channel={ch} stats={stats} />
 * })
 */
export function useChannelStats(
  channel: QueryKey | string,
): UseChannelStatsResult {
  const client = use(RealtimeContext)
  if (!client) {
    throw new Error(
      '[realtime] useChannelStats must be used inside <RealtimeProvider>.',
    )
  }

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const [stats, setStats] = useState<UseChannelStatsResult>({
    messageCount: 0,
    lastMessageAt: null,
  })

  // Mutable counter to avoid stale closures when updating state.
  const countRef = useRef(0)

  useEffect(() => {
    countRef.current = 0
    setStats({ messageCount: 0, lastMessageAt: null })

    const unsub = client.subscribe(serializedChannel, () => {
      countRef.current += 1
      setStats({ messageCount: countRef.current, lastMessageAt: Date.now() })
    })

    return unsub
  }, [client, serializedChannel])

  return stats
}
