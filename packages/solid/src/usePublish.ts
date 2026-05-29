import { serializeKey } from '@realtimejs/core'
import { useRealtimeClient } from './context.js'
import type { QueryKey } from '@realtimejs/core'

/**
 * Returns a stable `publish` function bound to `channel`.
 *
 * In Solid, the component function runs once so the returned function is
 * always stable — no memoization wrapper needed.
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
export function usePublish(
  channel: QueryKey | string,
): (data: unknown) => Promise<void> {
  const client = useRealtimeClient('usePublish')

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  return (data: unknown): Promise<void> =>
    client.publish(serializedChannel, data)
}
