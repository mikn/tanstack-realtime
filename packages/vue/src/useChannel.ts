import { onUnmounted, ref } from 'vue'
import { serializeKey } from '@realtimejs/core'
import { useRealtimeClient } from './context.js'
import type { Ref } from 'vue'
import type { QueryKey, SubscribeError } from '@realtimejs/core'

export interface UseChannelResult {
  /**
   * Stable publish function bound to `channel`.
   * Returns a `Promise<void>` that resolves when the transport dispatches the
   * message — `await` it for backpressure or optimistic UI confirmation.
   */
  publish: (data: unknown) => Promise<void>
  /**
   * The most recent subscribe error for this channel, or `null` if the
   * subscription is healthy.
   * Only populated when `onMessage` is provided (subscribe-mode).
   */
  subscribeError: Ref<SubscribeError | null>
}

/**
 * Convenience composable that combines `useSubscribe` and `usePublish` for a
 * single channel — eliminating the need to repeat the channel key in two calls.
 *
 * The `onMessage` callback is **optional**. Omit it for publish-only scenarios.
 * The subscription is only established when `onMessage` is provided.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * // Chat room — send and receive on the same channel
 * const messages = ref<Message[]>([])
 * const { publish } = useChannel(
 *   ['chat', { roomId }],
 *   (raw) => messages.value.push(raw as Message),
 * )
 *
 * @example
 * // Publish-only — no subscription
 * const { publish } = useChannel(['analytics', { page }])
 * await publish({ event: 'pageview' })
 */
export function useChannel(
  channel: QueryKey | string,
  onMessage?: (data: unknown) => void,
): UseChannelResult {
  const client = useRealtimeClient('useChannel')

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const subscribeError = ref<SubscribeError | null>(null)

  const latestOnMessage = onMessage

  let unsubMessage: (() => void) | null = null
  let unsubError: (() => void) | null = null

  if (latestOnMessage) {
    subscribeError.value = null

    unsubMessage = client.subscribe(serializedChannel, (data) =>
      latestOnMessage(data),
    )

    unsubError = client.onSubscribeError((ch, reason, code) => {
      if (ch === serializedChannel) {
        subscribeError.value = { channel: ch, reason, code }
      }
    })
  }

  onUnmounted(() => {
    unsubMessage?.()
    unsubError?.()
  })

  const publish = (data: unknown): Promise<void> =>
    client.publish(serializedChannel, data)

  return { publish, subscribeError }
}
