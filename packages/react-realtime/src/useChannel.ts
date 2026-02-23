import { use, useCallback, useEffect, useRef } from 'react'
import { serializeKey } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'
import type { QueryKey } from '@tanstack/realtime'

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
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Convenience hook that combines `useSubscribe` and `usePublish` for a single
 * channel — eliminating the need to repeat the channel key in two hooks.
 *
 * The `onMessage` callback is **optional**. Omit it for publish-only scenarios.
 * The subscription is only established when `onMessage` is provided.
 *
 * The callback is kept current via a ref so it always sees the latest closure
 * values without triggering a re-subscription when the function reference
 * changes between renders.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * // Chat room — send and receive on the same channel
 * function ChatRoom({ roomId }: { roomId: string }) {
 *   const [messages, setMessages] = useState<Message[]>([])
 *   const { publish } = useChannel(
 *     ['chat', { roomId }],
 *     (raw) => setMessages((prev) => [...prev, raw as Message]),
 *   )
 *
 *   return (
 *     <>
 *       {messages.map((m) => <p key={m.id}>{m.text}</p>)}
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
  const client = use(RealtimeContext)
  if (!client) {
    throw new Error(
      '[realtime] useChannel must be used inside <RealtimeProvider>.',
    )
  }

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  // Keep the latest callback in a ref so the subscription is not torn down
  // and re-established on every render when the caller does not memoize it.
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!onMessageRef.current) return
    return client.subscribe(serializedChannel, (data) =>
      onMessageRef.current?.(data),
    )
    // Re-subscribe only when the channel string or client instance changes.
  }, [client, serializedChannel, Boolean(onMessage)]) // eslint-disable-line react-hooks/exhaustive-deps

  const publish = useCallback(
    (data: unknown): Promise<void> => client.publish(serializedChannel, data),
    [client, serializedChannel],
  )

  return { publish }
}
