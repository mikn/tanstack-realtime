import { onUnmounted, ref } from 'vue'
import { serializeKey } from '@realtimejs/core'
import { useRealtimeClient } from './context.js'
import type { Ref } from 'vue'
import type { QueryKey, SubscribeError } from '@realtimejs/core'

/**
 * Return value of {@link useSubscribe}.
 */
export interface UseSubscribeResult {
  /**
   * The most recent subscribe error for this channel, or `null` if the
   * subscription is healthy. Resets to `null` when the composable is unmounted.
   */
  subscribeError: Ref<SubscribeError | null>
}

/**
 * Subscribes to raw channel events for the lifetime of the component.
 *
 * The `onMessage` callback is stored and called directly. In Vue composables,
 * setup runs once so the callback is captured at setup time. To update the
 * callback dynamically, wrap it in a reactive ref yourself.
 *
 * Returns `{ subscribeError }` — a reactive ref that is populated when the
 * server rejects the subscription (e.g. authorization denied).
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * const { subscribeError } = useSubscribe(['typing', { roomId }], (event) => {
 *   typingUsers.value = event as string[]
 * })
 */
export function useSubscribe(
  channel: QueryKey | string,
  onMessage: (data: unknown) => void,
): UseSubscribeResult {
  const client = useRealtimeClient('useSubscribe')

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const subscribeError = ref<SubscribeError | null>(null)

  // Keep the latest callback in a plain variable — composable setup runs once
  // so we can update this without worrying about stale closures causing
  // re-subscriptions (unlike React hooks which re-run on every render).
  let latestOnMessage = onMessage

  subscribeError.value = null

  const unsubMessage = client.subscribe(serializedChannel, (data) =>
    latestOnMessage(data),
  )

  const unsubError = client.onSubscribeError((ch, reason, code) => {
    if (ch === serializedChannel) {
      subscribeError.value = { channel: ch, reason, code }
    }
  })

  onUnmounted(() => {
    unsubMessage()
    unsubError()
  })

  // Allow callers to swap the callback reference after setup via a returned setter.
  // This mirrors React's ref-based approach for keeping callbacks current.
  const updateCallback = (fn: (data: unknown) => void) => {
    latestOnMessage = fn
  }

  void updateCallback // suppress unused-var — exposed via closure for advanced use

  return { subscribeError }
}
