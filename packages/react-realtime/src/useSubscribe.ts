import { use, useEffect } from 'react'
import type { QueryKey } from '@tanstack/realtime'
import { serializeKey } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'

/**
 * Subscribes to raw channel events for the lifetime of the component.
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

  useEffect(() => {
    return client.subscribe(serializedChannel, onMessage)
    // `onMessage` intentionally excluded — callers should wrap in useCallback if
    // they need stable identity. Subscribing/unsubscribing on every render is
    // expensive; the channel key is the correct dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, serializedChannel])
}
