/**
 * @realtimejs/adapter-pusher
 *
 * Pusher Channels (hosted SaaS) **and** self-hosted Soketi transport adapter
 * for @realtimejs/core. Soketi speaks the Pusher protocol, so the same adapter
 * works against both — point `wsHost`/`wsPort` at Soketi for self-hosting.
 *
 * ## Conventions (servers must follow these)
 * - **Message event name** — realtime.js channels carry opaque `data`; Pusher
 *   is `(event, data)`. The adapter binds to a single event, `'message'`
 *   ({@link PUSHER_MESSAGE_EVENT}). Servers publishing to Pusher must emit
 *   `'message'`.
 * - **Presence channels** — a realtime.js channel `ch` maps to the Pusher
 *   presence channel `presence-ch` ({@link PUSHER_PRESENCE_PREFIX}).
 * - **Client publish** — `publish()` uses a Pusher *client event*
 *   (`client-message`, {@link PUSHER_CLIENT_MESSAGE_EVENT}), which Pusher only
 *   permits on private/presence channels with client events enabled. Public
 *   fan-out is server-published (your serverless endpoint → Pusher HTTP API).
 *
 * @example
 * import { pusherTransport } from '@realtimejs/adapter-pusher'
 * import { createRealtimeClient } from '@realtimejs/core'
 *
 * export const realtimeClient = createRealtimeClient({
 *   transport: pusherTransport({
 *     key: 'app-key',
 *     cluster: 'eu',
 *     authEndpoint: '/api/pusher/auth',
 *   }),
 * })
 */

export { pusherTransport } from './transport.js'
export {
  PUSHER_MESSAGE_EVENT,
  PUSHER_CLIENT_MESSAGE_EVENT,
  PUSHER_PRESENCE_PREFIX,
} from './transport.js'
export type {
  PusherTransportOptions,
  PusherLike,
  PusherChannelLike,
  PusherConnectionLike,
  PusherMembersLike,
} from './transport.js'
