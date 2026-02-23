/**
 * @tanstack/realtime-adapter-centrifugo
 *
 * Centrifugo transport adapter for @tanstack/realtime.
 *
 * Implements the Centrifugo v4+ JSON WebSocket protocol so you can use
 * @tanstack/realtime with a self-hosted Centrifugo server.
 *
 * @example
 * import { centrifugoTransport } from '@tanstack/realtime-adapter-centrifugo'
 * import { createRealtimeClient } from '@tanstack/realtime'
 *
 * export const realtimeClient = createRealtimeClient({
 *   transport: centrifugoTransport({
 *     url: 'wss://my-centrifugo.example.com/connection/websocket',
 *     token: () => fetchAuthToken(),
 *   }),
 * })
 */

export { centrifugoTransport } from './transport.js'
export type { CentrifugoTransportOptions } from './transport.js'
