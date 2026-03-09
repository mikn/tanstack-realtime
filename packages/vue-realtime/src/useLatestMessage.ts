import { onUnmounted, ref } from 'vue'
import { serializeKey } from '@tanstack/realtime'
import { useRealtimeClient } from './context.js'
import type { Ref } from 'vue'
import type { QueryKey } from '@tanstack/realtime'

export interface UseLatestMessageResult<T> {
  /**
   * The most recently received message, or `undefined` before any message
   * has arrived. Updates on every new message — only the latest is kept.
   */
  message: Ref<T | undefined>
  /**
   * Monotonically increasing counter. Incremented each time a new message
   * arrives, even if the payload is referentially equal to the previous one.
   * Useful for triggering watchers (e.g. toast notifications) that need to
   * fire on every event regardless of content.
   */
  messageCount: Ref<number>
}

/**
 * Subscribes to a channel and exposes only the most recently received message.
 *
 * Unlike `useSubscribe` (which gives you a callback) or `useLiveChannel`
 * (which accumulates a collection), this composable is ideal for scenarios
 * where only the latest event matters — notification banners, status updates,
 * live score tickers, and similar patterns.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * const { message, messageCount } = useLatestMessage<Notification>(
 *   ['notifications', { userId }],
 * )
 *
 * watch(messageCount, () => {
 *   if (message.value) toast(message.value.text)
 * })
 */
export function useLatestMessage<T = unknown>(
  channel: QueryKey | string,
): UseLatestMessageResult<T> {
  const client = useRealtimeClient('useLatestMessage')

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const message = ref<T | undefined>(undefined) as Ref<T | undefined>
  const messageCount = ref(0)

  let count = 0

  const unsub = client.subscribe(serializedChannel, (data) => {
    count += 1
    message.value = data as T
    messageCount.value = count
  })

  onUnmounted(() => unsub())

  return { message, messageCount }
}
