import { createEffect, createSignal, onCleanup } from 'solid-js'
import { serializeKey } from '@realtimejs/core'
import { useRealtimeClient } from './context.js'
import type { Accessor } from 'solid-js'
import type { QueryKey } from '@realtimejs/core'

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
   * Reactive accessor for an ordered list of received messages, oldest first,
   * capped at `maxMessages`. Starts empty and grows as messages arrive.
   * Resets when `channel` changes.
   */
  messages: Accessor<ReadonlyArray<T>>
  /**
   * Discard all buffered messages without changing the subscription.
   */
  clear: () => void
}

// ---------------------------------------------------------------------------
// Primitive
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
 * TanStack DB collection. This primitive is intentionally ephemeral — messages
 * received before the component mounts are not replayed.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * function ChatRoom(props) {
 *   const { messages } = useChannelHistory<Message>(
 *     ['chat', { roomId: props.roomId }],
 *     { maxMessages: 100 },
 *   )
 *
 *   return (
 *     <ul>
 *       <For each={messages()}>
 *         {(m) => <li>{m.author}: {m.text}</li>}
 *       </For>
 *     </ul>
 *   )
 * }
 */
export function useChannelHistory<T = unknown>(
  channel: QueryKey | string,
  options: UseChannelHistoryOptions = {},
): UseChannelHistoryResult<T> {
  const client = useRealtimeClient('useChannelHistory')

  const { maxMessages = 50 } = options

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const [messages, setMessages] = createSignal<ReadonlyArray<T>>([])

  // Keep options in a plain var so changes to maxMessages take effect on the
  // next message without re-subscribing.
  let currentMax = maxMessages

  createEffect(() => {
    currentMax = maxMessages
    // Reset history when channel changes.
    setMessages([])

    const unsub = client.subscribe(serializedChannel, (data) => {
      setMessages((prev) => {
        const next = [...prev, data as T]
        // Trim to cap — slice from the end to keep most-recent messages.
        return next.length > currentMax
          ? next.slice(next.length - currentMax)
          : next
      })
    })

    onCleanup(unsub)
  })

  const clear = () => setMessages([])

  return { messages, clear }
}
