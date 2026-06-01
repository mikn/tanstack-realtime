/**
 * Realtime client for the ai-streaming example. Connects to the in-memory SSE
 * server (Vite dev middleware) at `/api/realtime`; no auth, no database.
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
