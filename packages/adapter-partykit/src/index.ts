/**
 * @realtimejs/adapter-partykit
 *
 * PartyKit / Cloudflare Durable Objects transport adapter for @realtimejs/core.
 * This adapter proves the `RealtimeTransport` (+ `PresenceCapable`) contract
 * against a structurally different infra model than Centrifugo/Pusher: the room
 * server (a Durable Object) holds membership and fan-out state at the edge.
 *
 * ## Single multiplexed connection
 * realtime.js multiplexes ALL its channels over ONE PartyKit room connection
 * (the "hub"), carrying each channel inside JSON envelopes routed by a `channel`
 * field — see {@link ClientEnvelope}/{@link ServerEnvelope} in `./protocol`.
 * This mirrors the Centrifugo single-socket design and structurally avoids the
 * per-channel double-bind class (there is exactly one `message` listener).
 *
 * ## Presence via Durable Object membership
 * The room/DO holds connection membership. `joinPresence`/`updatePresence`/
 * `leavePresence` send `presence:*` envelopes; `onPresenceChange` fires from
 * `{type:'presence'}` pushes. The adapter learns its own `connectionId` from
 * the `{type:'connected'}` envelope and excludes self from reported members.
 *
 * ## Reference server
 * A minimal, correct reference room server implementing the wire protocol is
 * available at `@realtimejs/adapter-partykit/server`.
 *
 * @example
 * import { partykitTransport } from '@realtimejs/adapter-partykit'
 * import { createRealtimeClient } from '@realtimejs/core'
 *
 * export const realtimeClient = createRealtimeClient({
 *   transport: partykitTransport({
 *     host: 'my-app.username.partykit.dev',
 *     room: 'hub',
 *   }),
 * })
 */

export { partykitTransport } from './transport.js'
export type { PartyKitTransportOptions, PartySocketLike } from './transport.js'
export type {
  ClientEnvelope,
  ServerEnvelope,
  PresenceAction,
  PresenceMember,
} from './protocol.js'
