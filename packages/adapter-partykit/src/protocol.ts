// ---------------------------------------------------------------------------
// PartyKit Wire Protocol
// ---------------------------------------------------------------------------
//
// realtime.js multiplexes ALL of its channels over a SINGLE PartyKit room
// connection (the "hub" room). Each realtime.js channel is carried inside a
// JSON envelope on that one socket, routed by the `channel` field. This mirrors
// the Centrifugo adapter's single-socket/envelope design (and deliberately
// AVOIDS the per-channel double-bind class that bit the Pusher adapter — there
// is exactly one `message` listener on the socket, fanned out by channel).
//
// The naming follows the existing SSE wire protocol conventions
// (`type: 'message' | 'subscribe:error'`, `connectionId`, `channel`, `data`).
//
//   Client → Server   (PartySocket.send(JSON.stringify(envelope)))
//   Server → Client   (PartyKit room broadcast → socket 'message' event)
// ---------------------------------------------------------------------------

/** Presence-lifecycle action carried inside a `presence` client envelope. */
export type PresenceAction = 'join' | 'update' | 'leave'

/** Envelopes the client sends up to the PartyKit room over the single socket. */
export type ClientEnvelope =
  | { type: 'subscribe'; channel: string }
  | { type: 'unsubscribe'; channel: string }
  | { type: 'publish'; channel: string; data: unknown }
  | { type: 'presence:join'; channel: string; data: unknown }
  | { type: 'presence:update'; channel: string; data: unknown }
  | { type: 'presence:leave'; channel: string }

/** Envelopes the PartyKit room sends down to the client over the single socket. */
export type ServerEnvelope =
  | { type: 'connected'; connectionId: string }
  | { type: 'message'; channel: string; data: unknown }
  | { type: 'subscribe:error'; channel: string; reason: string; code?: number }
  | {
      type: 'presence'
      channel: string
      members: ReadonlyArray<PresenceMember>
    }

/**
 * A single presence member as reported by the room (the Durable Object holds
 * membership). `connectionId` is the room-assigned connection id; the adapter
 * excludes the member whose id equals the `connectionId` it learned from the
 * `connected` envelope on connect (self-exclusion — see {@link partykitTransport}).
 */
export interface PresenceMember {
  connectionId: string
  data: unknown
}
