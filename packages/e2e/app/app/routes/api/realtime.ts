/**
 * TanStack Start API route — SSE realtime endpoint.
 * GET  /api/realtime  → open SSE stream
 * POST /api/realtime  → client action (subscribe / unsubscribe / publish)
 */
import { createAPIFileRoute } from '@tanstack/start/api'
import { realtime } from '../../server/realtime'

export const APIRoute = createAPIFileRoute('/api/realtime')({
  GET: ({ request }) => realtime.handle(request),
  POST: ({ request }) => realtime.handle(request),
  OPTIONS: () =>
    new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }),
})
