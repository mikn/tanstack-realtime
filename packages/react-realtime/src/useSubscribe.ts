import { use, useEffect, useRef } from 'react'
import type { QueryKey } from '@tanstack/realtime'
import { serializeKey } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'

/**
 * Subscribes to raw channel events for the lifetime of the component.
 *
 * The `onMessage` callback is kept current via a ref so it always sees the
 * latest props/state without triggering re-subscription on every render.
 *
 * @example
 * useSubscribe(['chat:typing', { roomId }], (event) => {
 *   setTypingUsers(...)
 * })
 */
export function useSubscribe(
  channel: QueryKey | string,
  onMessage: (data: unknown) => void,
) {
  const client = use(RealtimeContext)
  if (!client) {
    throw new Error(
      '[realtime] useSubscribe must be used inside <RealtimeProvider>.',
    )
  }

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  // Keep the latest callback in a ref so the subscription is not torn down and
  // re-established on every render when the caller does not memoize onMessage.
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    return client.subscribe(serializedChannel, (data) =>
      onMessageRef.current(data),
    )
  }, [client, serializedChannel])
}
