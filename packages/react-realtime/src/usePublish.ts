import { use, useCallback } from 'react'
import type { QueryKey } from '@tanstack/realtime'
import { serializeKey } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'

/**
 * Returns a stable `publish` function bound to `channel`.
 * The returned function is memoized and only changes when the resolved
 * channel key changes.
 *
 * The function returns a `Promise<void>` that resolves when the transport
 * has dispatched the message; you can `await` it if you need backpressure
 * (e.g. confirm delivery before showing a sent indicator).
 *
 * @example
 * const publish = usePublish(['typing', { roomId }])
 * publish({ userId: currentUser.id, isTyping: true })
 *
 * @example
 * // Await delivery
 * const publish = usePublish(['messages', { roomId }])
 * await publish({ id: crypto.randomUUID(), text })
 */
export function usePublish(channel: QueryKey | string) {
  const client = use(RealtimeContext)
  if (!client) {
    throw new Error(
      '[realtime] usePublish must be used inside <RealtimeProvider>.',
    )
  }

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  return useCallback(
    (data: unknown): Promise<void> => client.publish(serializedChannel, data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, serializedChannel],
  )
}
