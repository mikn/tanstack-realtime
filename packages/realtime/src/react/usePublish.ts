import { use, useCallback } from 'react'
import { serializeKey } from '../core/serializeKey.js'
import { RealtimeContext } from './context.js'
import type { QueryKey } from '../core/types.js'

/**
 * Returns a stable `publish` function bound to `channel`.
 *
 * @example
 * const publish = usePublish(['chat:typing', { roomId }])
 * publish({ userId: currentUser.id, isTyping: true })
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
    (data: unknown) => client.publish(serializedChannel, data),

    [client, serializedChannel],
  )
}
