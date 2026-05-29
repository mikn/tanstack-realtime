import { onUnmounted, ref } from 'vue'
import { serializeKey } from '@realtimejs/core'
import { useRealtimeClient } from './context.js'
import type { Ref } from 'vue'
import type { QueryKey } from '@realtimejs/core'

export interface UseChannelStatsResult {
  /**
   * Total number of messages received on this channel since the component
   * mounted (or since the channel last changed).
   */
  messageCount: Ref<number>
  /**
   * Timestamp (ms since epoch) of the most recently received message.
   * `null` before any message has arrived.
   */
  lastMessageAt: Ref<number | null>
}

/**
 * Subscribes to a channel and tracks per-channel statistics.
 *
 * Provides a running message count and the timestamp of the last received
 * message. Useful for debug overlays, admin dashboards, and monitoring
 * components that need to observe channel activity without consuming the
 * message payloads themselves.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * const { messageCount, lastMessageAt } = useChannelStats(channel)
 *
 * // In template:
 * // <span>{{ messageCount }} msgs · last {{ lastMessageAt }}</span>
 */
export function useChannelStats(
  channel: QueryKey | string,
): UseChannelStatsResult {
  const client = useRealtimeClient('useChannelStats')

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const messageCount = ref(0)
  const lastMessageAt = ref<number | null>(null)

  let count = 0

  const unsub = client.subscribe(serializedChannel, () => {
    count += 1
    messageCount.value = count
    lastMessageAt.value = Date.now()
  })

  onUnmounted(() => unsub())

  return { messageCount, lastMessageAt }
}
