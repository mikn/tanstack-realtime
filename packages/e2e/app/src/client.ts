/**
 * Creates a RealtimeClient connected to Centrifugo.
 * The WebSocket URL and user ID are read from URL search params so that
 * Playwright tests can inject them per browser context without a build step.
 *
 *   http://localhost:5173/?centrifugoPort=8765&userId=alice
 */

import { createRealtimeClient } from '@tanstack/realtime'
import { centrifugoTransport } from '@tanstack/realtime-adapter-centrifugo'

const params = new URLSearchParams(window.location.search)

export const centrifugoPort = params.get('centrifugoPort') ?? '8000'
export const userId = params.get('userId') ?? 'anonymous'

export const client = createRealtimeClient({
  transport: centrifugoTransport({
    url: `ws://127.0.0.1:${centrifugoPort}/connection/websocket`,
    // Must match the "prs" namespace in centrifugo global-setup.ts.
    presencePrefix: 'prs:',
    initialDelay: 50,
    maxDelay: 200,
    jitter: 0,
  }),
})

// Connect immediately so the app is live as soon as the page loads.
client.connect()
