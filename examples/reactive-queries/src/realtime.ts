/**
 * Realtime client wiring for the reactive-queries demo.
 *
 * The client connects to the SSE server (mounted by the Vite plugin in
 * `vite.config.ts`) at `/api/realtime`. `RealtimeProvider` subscribes to the
 * internal batch channel automatically, so invalidation batches published by
 * the reactive engine fan out to every mounted `useQuery` with no extra wiring.
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
