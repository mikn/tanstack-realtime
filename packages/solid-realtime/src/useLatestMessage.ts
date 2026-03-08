import { createEffect, createSignal, onCleanup } from 'solid-js'
import { serializeKey } from '@tanstack/realtime'
import { useRealtimeClient } from './context.js'
import type { Accessor } from 'solid-js'
import type { QueryKey } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseLatestMessageResult<T> {
  /**
   * Reactive accessor for the most recently received message, or `undefined`
   * before any message has arrived. Updates on every new message — only the
   * latest is kept.
   */
  message: Accessor<T | undefined>
  /**
   * Reactive accessor for a monotonically increasing counter. Incremented each
   * time a new message arrives, even if the payload is referentially equal to
   * the previous one. Useful for triggering effects (e.g. toast notifications)
   * that need to fire on every event regardless of content.
   */
  messageCount: Accessor<number>
}

// ---------------------------------------------------------------------------
// Primitive
// ---------------------------------------------------------------------------

/**
 * Subscribes to a channel and exposes only the most recently received message.
 *
 * Unlike `useSubscribe` (which gives you a callback) or `useLiveChannel`
 * (which accumulates a collection), this primitive is ideal for scenarios where
 * only the latest event matters — notification banners, status updates,
 * live score tickers, and similar patterns.
 *
 * The `messageCount` accessor increments on every message and can be used as a
 * dependency in `createEffect` to trigger side-effects for each event:
 *
 * ```tsx
 * const { message, messageCount } = useLatestMessage<Notification>(
 *   ['notifications', { userId }],
 * )
 *
 * createEffect(() => {
 *   const count = messageCount()
 *   if (count > 0) toast(message()!.text)
 * })
 * ```
 *
 * When `channel` changes the previous message is cleared (`undefined`).
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * function LiveScore(props) {
 *   const { message: score } = useLatestMessage<ScoreUpdate>(
 *     ['scores', { matchId: props.matchId }],
 *   )
 *   return <p>{score() ? `${score()!.home} - ${score()!.away}` : 'Waiting…'}</p>
 * }
 */
export function useLatestMessage<T = unknown>(
  channel: QueryKey | string,
): UseLatestMessageResult<T> {
  const client = useRealtimeClient('useLatestMessage')

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const [message, setMessage] = createSignal<T | undefined>(undefined)
  const [messageCount, setMessageCount] = createSignal(0)

  // Keep a plain counter so the subscription handler doesn't form a closure
  // over a stale signal value.
  let count = 0

  createEffect(() => {
    // Reset when channel changes.
    count = 0
    setMessage(undefined)
    setMessageCount(0)

    const unsub = client.subscribe(serializedChannel, (data) => {
      count += 1
      setMessage(() => data as T)
      setMessageCount(count)
    })

    onCleanup(unsub)
  })

  return { message, messageCount }
}
