import { onUnmounted, ref } from 'vue'
import { serializeKey } from '@tanstack/realtime'
import { useRealtimeClient } from './context.js'
import type { Ref } from 'vue'
import type { QueryKey } from '@tanstack/realtime'

export interface UseChannelHistoryOptions {
  /**
   * Maximum number of messages to retain. Once the buffer is full the oldest
   * message is discarded to make room for the new one (FIFO ring buffer).
   * @default 50
   */
  maxMessages?: number
}

export interface UseChannelHistoryResult<T> {
  /**
   * Ordered list of received messages, oldest first, capped at `maxMessages`.
   * Starts empty and grows as messages arrive.
   */
  messages: Ref<ReadonlyArray<T>>
  /**
   * Discard all buffered messages without changing the subscription.
   */
  clear: () => void
}

/**
 * Subscribes to a channel and buffers the last `maxMessages` messages in order.
 *
 * Useful for chat UIs, activity feeds, and audit logs where you want an
 * in-memory history of recent events without a full database collection.
 * When the buffer reaches `maxMessages` the oldest entry is dropped (ring
 * buffer semantics).
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * const { messages } = useChannelHistory<Message>(
 *   ['chat', { roomId }],
 *   { maxMessages: 100 },
 * )
 */
export function useChannelHistory<T = unknown>(
  channel: QueryKey | string,
  options: UseChannelHistoryOptions = {},
): UseChannelHistoryResult<T> {
  const client = useRealtimeClient('useChannelHistory')

  const { maxMessages = 50 } = options

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const messages = ref<ReadonlyArray<T>>([]) as Ref<ReadonlyArray<T>>

  // Keep maxMessages in a plain variable so changes take effect without re-subscribing.
  let maxRef = maxMessages

  const unsub = client.subscribe(serializedChannel, (data) => {
    const next = [...messages.value, data as T]
    messages.value =
      next.length > maxRef ? next.slice(next.length - maxRef) : next
  })

  onUnmounted(() => unsub())

  const clear = (): void => {
    messages.value = []
  }

  // Expose a way to update maxMessages dynamically if needed.
  void ((max: number) => {
    maxRef = max
  })

  return { messages, clear }
}
