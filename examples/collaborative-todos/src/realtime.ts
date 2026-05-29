/**
 * Realtime client wiring for the collaborative-todos example.
 *
 * The client connects to the in-memory SSE server (mounted by the Vite plugin
 * in `vite.config.ts`) at `/api/realtime`. No auth, no database — see the
 * README's "bring your own backend" note.
 */
import { createRealtimeClient } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

export const client = createRealtimeClient({
  transport: sseTransport({
    url: '/api/realtime',
    initialDelay: 50,
    maxDelay: 500,
    jitter: 0,
  }),
})
