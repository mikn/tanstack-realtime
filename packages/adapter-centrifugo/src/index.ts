/**
 * @realtimejs/adapter-centrifugo
 *
 * Centrifugo transport adapter for @realtimejs/core.
 *
 * Implements the Centrifugo v4+ JSON WebSocket protocol so you can use
 * @realtimejs/core with a self-hosted Centrifugo server.
 *
 * @example
 * import { centrifugoTransport } from '@realtimejs/adapter-centrifugo'
 * import { createRealtimeClient } from '@realtimejs/core'
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
