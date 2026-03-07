import { use, useEffect, useRef, useState } from 'react'
import { serializeKey } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'
import type { QueryKey } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseLatestMessageResult<T> {
  /**
   * The most recently received message, or `undefined` before any message
   * has arrived. Updates on every new message — only the latest is kept.
   */
  message: T | undefined
  /**
   * Monotonically increasing counter. Incremented each time a new message
   * arrives, even if the payload is referentially equal to the previous one.
   * Useful for triggering effects (e.g. toast notifications) that need to
   * fire on every event regardless of content.
   */
  messageCount: number
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Subscribes to a channel and exposes only the most recently received message.
 *
 * Unlike `useSubscribe` (which gives you a callback) or `useLiveChannel`
 * (which accumulates a collection), this hook is ideal for scenarios where
 * only the latest event matters — notification banners, status updates,
 * live score tickers, and similar patterns.
 *
 * The `messageCount` field increments on every message and can be used as a
 * dependency in `useEffect` to trigger side-effects for each event:
 *
 * ```tsx
 * const { message, messageCount } = useLatestMessage<Notification>(
 *   ['notifications', { userId }],
 * )
 *
 * useEffect(() => {
 *   if (message) toast(message.text)
 * }, [messageCount])
 * ```
 *
 * When `channel` changes the previous message is cleared (`undefined`).
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * function LiveScore({ matchId }: { matchId: string }) {
 *   const { message: score } = useLatestMessage<ScoreUpdate>(
 *     ['scores', { matchId }],
 *   )
 *   return <p>{score ? `${score.home} - ${score.away}` : 'Waiting…'}</p>
 * }
 */
export function useLatestMessage<T = unknown>(
  channel: QueryKey | string,
): UseLatestMessageResult<T> {
  const client = use(RealtimeContext)
  if (!client) {
    throw new Error(
      '[realtime] useLatestMessage must be used inside <RealtimeProvider>.',
    )
  }

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const [state, setState] = useState<UseLatestMessageResult<T>>({
    message: undefined,
    messageCount: 0,
  })

  // Keep a ref so the effect handler doesn't form a closure over stale count.
  const countRef = useRef(0)

  useEffect(() => {
    // Reset when channel changes.
    countRef.current = 0
    setState({ message: undefined, messageCount: 0 })

    const unsub = client.subscribe(serializedChannel, (data) => {
      countRef.current += 1
      setState({ message: data as T, messageCount: countRef.current })
    })

    return unsub
  }, [client, serializedChannel])

  return state
}
