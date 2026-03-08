import { createEffect, createSignal, onCleanup } from 'solid-js'
import { serializeKey } from '@tanstack/realtime'
import { useRealtimeClient } from './context.js'
import type { Accessor } from 'solid-js'
import type { QueryKey, SubscribeError } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseChannelResult {
  /**
   * Stable publish function bound to `channel`.
   * Returns a `Promise<void>` that resolves when the transport dispatches the
   * message — `await` it for backpressure or optimistic UI confirmation.
   */
  publish: (data: unknown) => Promise<void>
  /**
   * Reactive accessor for the most recent subscribe error for this channel,
   * or `null` if the subscription is healthy. Resets to `null` when `channel`
   * changes. Only populated when `onMessage` is provided (subscribe-mode).
   */
  subscribeError: Accessor<SubscribeError | null>
}

// ---------------------------------------------------------------------------
// Primitive
// ---------------------------------------------------------------------------

/**
 * Convenience primitive that combines `useSubscribe` and `usePublish` for a
 * single channel — eliminating the need to repeat the channel key.
 *
 * The `onMessage` callback is **optional**. Omit it for publish-only scenarios.
 * The subscription is only established when `onMessage` is provided.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * // Chat room — send and receive on the same channel
 * function ChatRoom(props) {
 *   const [messages, setMessages] = createSignal<Message[]>([])
 *   const { publish } = useChannel(
 *     ['chat', { roomId: props.roomId }],
 *     (raw) => setMessages((prev) => [...prev, raw as Message]),
 *   )
 *
 *   return (
 *     <>
 *       <For each={messages()}>{(m) => <p>{m.text}</p>}</For>
 *       <button onClick={() => publish({ id: crypto.randomUUID(), text: 'Hi!' })}>
 *         Send
 *       </button>
 *     </>
 *   )
 * }
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

  const [subscribeError, setSubscribeError] =
    createSignal<SubscribeError | null>(null)

  // Keep the latest callback in a plain variable so the subscription is not
  // torn down and re-established when the function reference changes.
  let latestOnMessage = onMessage

  createEffect(() => {
    setSubscribeError(null)
    latestOnMessage = onMessage

    if (!onMessage) return

    const unsubMessage = client.subscribe(serializedChannel, (data) =>
      latestOnMessage?.(data),
    )

    const unsubError = client.onSubscribeError((ch, reason, code) => {
      if (ch === serializedChannel) {
        setSubscribeError({ channel: ch, reason, code })
      }
    })

    onCleanup(() => {
      unsubMessage()
      unsubError()
    })
  })

  const publish = (data: unknown): Promise<void> =>
    client.publish(serializedChannel, data)

  return { publish, subscribeError }
}
