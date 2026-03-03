import { use, useEffect, useRef, useState } from 'react'
import { serializeKey } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'
import type { QueryKey, SubscribeError } from '@tanstack/realtime'

/**
 * Return value of {@link useSubscribe}.
 */
export interface UseSubscribeResult {
  /**
   * The most recent subscribe error for this channel, or `null` if the
   * subscription is healthy.  Resets to `null` when `channel` changes.
   */
  subscribeError: SubscribeError | null
}

/**
 * Subscribes to raw channel events for the lifetime of the component.
 *
 * The `onMessage` callback is kept current via a ref so it always sees the
 * latest props/state without triggering a re-subscription on every render.
 * The subscription is torn down and re-established only when `channel` changes.
 *
 * Returns `{ subscribeError }` — a reactive state that is populated when the
 * server rejects the subscription (e.g. authorization denied).
 *
 * @example
 * const { subscribeError } = useSubscribe(['typing', { roomId }], (event) => {
 *   setTypingUsers(event as string[])
 * })
 *
 * if (subscribeError) {
 *   return <div>Access denied: {subscribeError.reason}</div>
 * }
 */
export function useSubscribe(
  channel: QueryKey | string,
  onMessage: (data: unknown) => void,
): UseSubscribeResult {
  const client = use(RealtimeContext)
  if (!client) {
    throw new Error(
      '[realtime] useSubscribe must be used inside <RealtimeProvider>.',
    )
  }

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const [subscribeError, setSubscribeError] = useState<SubscribeError | null>(
    null,
  )

  // Keep the latest callback in a ref so the subscription is not torn down and
  // re-established on every render when the caller does not memoize onMessage.
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    // Reset error state when channel changes.
    setSubscribeError(null)

    const unsubMessage = client.subscribe(serializedChannel, (data) =>
      onMessageRef.current(data),
    )

    const unsubError = client.onSubscribeError((ch, reason, code) => {
      if (ch === serializedChannel) {
        setSubscribeError({ channel: ch, reason, code })
      }
    })

    return () => {
      unsubMessage()
      unsubError()
    }
  }, [client, serializedChannel])

  return { subscribeError }
}
