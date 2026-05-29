/**
 * Creates a RealtimeClient connected via SSE to the Vite dev server.
 * userId is read from URL search params so Playwright can inject it per context:
 *   http://localhost:3002/?userId=alice
 *
 * withPresence wraps sseTransport to add presence over pub/sub channels.
 */
import { createRealtimeClient } from '@realtimejs/vue'
import { sseTransport } from '@realtimejs/adapter-sse'
import { withPresence } from './withPresence.js'

const params = new URLSearchParams(
  typeof window !== 'undefined' ? window.location.search : '',
)

export const userId = params.get('userId') ?? 'anonymous'

const myConnectionId =
  typeof crypto !== 'undefined' ? crypto.randomUUID() : `${Date.now()}`

export const client = createRealtimeClient({
  transport: withPresence(
    sseTransport({
      url: '/api/core',
      initialDelay: 50,
      maxDelay: 200,
      jitter: 0,
    }),
    myConnectionId,
  ),
})
