/**
 * Realtime client for the chat example.
 *
 * The current user's id comes from the `?userId=` query param so you can open
 * multiple tabs as different users (`?userId=alice`, `?userId=bob`). It is
 * forwarded to the SSE endpoint so the server's `getUser` auth stub picks it
 * up, and used as the presence/typing identity.
 *
 * `withPresence` wraps the SSE transport to add presence over pub/sub channels.
 */
import { createRealtimeClient } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'
import { withPresence } from './withPresence.js'

const params =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams()

export const userId =
  params.get('userId') ?? `guest-${Math.random().toString(36).slice(2, 6)}`

const connectionId =
  typeof crypto !== 'undefined' ? crypto.randomUUID() : `${Date.now()}`

export const client = createRealtimeClient({
  transport: withPresence(
    sseTransport({
      url: `/api/realtime?userId=${encodeURIComponent(userId)}`,
      initialDelay: 50,
      maxDelay: 500,
      jitter: 0,
    }),
    connectionId,
  ),
})
