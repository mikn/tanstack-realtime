/**
 * Creates a RealtimeClient connected via SSE to the TanStack Start server.
 * userId is read from URL search params so Playwright can inject it per context:
 *   http://localhost:3000/?userId=alice
 *
 * withPresence wraps sseTransport to add presence over pub/sub channels.
 * All window accesses are guarded for SSR safety.
 */
import { createRealtimeClient } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'
import { withPresence } from './withPresence.js'

const params =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams()

export const userId = params.get('userId') ?? 'anonymous'

const myConnectionId =
  typeof crypto !== 'undefined' ? crypto.randomUUID() : `${Date.now()}`

export const client = createRealtimeClient({
  transport: withPresence(
    sseTransport({
      url: '/api/realtime',
      initialDelay: 50,
      maxDelay: 200,
      jitter: 0,
    }),
    myConnectionId,
  ),
})

if (typeof window !== 'undefined') {
  client.connect()
}
