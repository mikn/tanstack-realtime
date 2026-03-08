import { use, useEffect, useRef, useState } from 'react'
import { serializeKey } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'
import type { QueryKey } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
   * Starts empty and grows as messages arrive. Resets when `channel` changes.
   */
  messages: ReadonlyArray<T>
  /**
   * Discard all buffered messages without changing the subscription.
   */
  clear: () => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Subscribes to a channel and buffers the last `maxMessages` messages in order.
 *
 * Useful for chat UIs, activity feeds, and audit logs where you want an
 * in-memory history of recent events without a full database collection.
 * When the buffer reaches `maxMessages` the oldest entry is dropped (ring
 * buffer semantics).
 *
 * The buffer resets automatically when `channel` changes. Call `clear()` to
 * manually flush it (e.g. when a user navigates away and comes back).
 *
 * For persistent / server-backed history prefer `useLiveChannel` with a
 * TanStack DB collection. This hook is intentionally ephemeral — messages
 * received before the component mounts are not replayed.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * function ChatRoom({ roomId }: { roomId: string }) {
 *   const { messages } = useChannelHistory<Message>(
 *     ['chat', { roomId }],
 *     { maxMessages: 100 },
 *   )
 *
 *   return (
 *     <ul>
 *       {messages.map((m) => (
 *         <li key={m.id}>{m.author}: {m.text}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 */
export function useChannelHistory<T = unknown>(
  channel: QueryKey | string,
  options: UseChannelHistoryOptions = {},
): UseChannelHistoryResult<T> {
  const client = use(RealtimeContext)
  if (!client) {
    throw new Error(
      '[realtime] useChannelHistory must be used inside <RealtimeProvider>.',
    )
  }

  const { maxMessages = 50 } = options

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const [messages, setMessages] = useState<ReadonlyArray<T>>([])

  // Keep options in a ref so changes to maxMessages take effect on the next
  // message without re-subscribing.
  const maxRef = useRef(maxMessages)
  maxRef.current = maxMessages

  useEffect(() => {
    // Reset history when channel changes.
    setMessages([])

    const unsub = client.subscribe(serializedChannel, (data) => {
      setMessages((prev) => {
        const next = [...prev, data as T]
        // Trim to cap — slice from the end to keep most-recent messages.
        return next.length > maxRef.current
          ? next.slice(next.length - maxRef.current)
          : next
      })
    })

    return unsub
  }, [client, serializedChannel])

  const clear = () => setMessages([])

  return { messages, clear }
}
