// ---------------------------------------------------------------------------
// Reference PartyKit room server (Durable Object) for @realtimejs/adapter-partykit
// ---------------------------------------------------------------------------
//
// This is a MINIMAL, correct reference implementation of the wire protocol in
// `protocol.ts`, suitable for copy-pasting into a PartyKit project. PartyKit
// rooms ARE stateful (each room is a Cloudflare Durable Object), so a server
// handler holding membership/subscription state is the appropriate model here
// (unlike the serverless SSE adapter, whose handler is per-request).
//
// It is exported for documentation and to type-check in CI; it is NOT exercised
// by the conformance kit (the kit tests the CLIENT transport against a fake).
//
// ## Usage in a PartyKit project
//
// ```ts
// // party/realtime.ts
// import { RealtimeRoomServer } from '@realtimejs/adapter-partykit/server'
// export default RealtimeRoomServer
// ```
//
// To depend on PartyKit's own connection/room types, replace the structural
// `PartyConnectionLike` / `PartyRoomLike` below with `import type * as Party
// from 'partykit/server'` (`Party.Connection` / `Party.Room`). They are kept
// structural here so this package does not take a hard dependency on the
// PartyKit server SDK.
// ---------------------------------------------------------------------------

import type {
  ClientEnvelope,
  PresenceMember,
  ServerEnvelope,
} from './protocol.js'

/** Structural subset of a PartyKit `Party.Connection`. */
export interface PartyConnectionLike {
  /** The room-assigned connection id (stable for the connection's lifetime). */
  readonly id: string
  /** Send a frame to this one connection. */
  send: (message: string) => void
  /**
   * Per-connection state bag. PartyKit exposes `setState`/`state`; we use it to
   * stash the set of subscribed channels and presence payloads for this conn.
   */
  setState?: (state: ConnectionState) => void
  state?: ConnectionState | null
}

/** Structural subset of a PartyKit `Party.Room`. */
export interface PartyRoomLike {
  /** Iterate every currently-connected connection in this room. */
  getConnections: () => Iterable<PartyConnectionLike>
}

interface ConnectionState {
  /** Channels this connection is subscribed to. */
  channels: Array<string>
  /** channel → presence data this connection has joined with. */
  presence: Record<string, unknown>
}

function getState(conn: PartyConnectionLike): ConnectionState {
  let state = conn.state ?? null
  if (!state) {
    state = { channels: [], presence: {} }
    conn.setState?.(state)
  }
  return state
}

function setState(conn: PartyConnectionLike, state: ConnectionState): void {
  conn.setState?.(state)
}

function sendEnvelope(
  conn: PartyConnectionLike,
  envelope: ServerEnvelope,
): void {
  conn.send(JSON.stringify(envelope))
}

/**
 * Compute the current member list for `channel` across all room connections,
 * and broadcast a `{type:'presence'}` envelope to every connection subscribed
 * to that channel. Membership is derived purely from live connection state —
 * the Durable Object holds it. Self-exclusion is performed client-side (the
 * adapter drops the member whose id matches the `connected` envelope it
 * received), so the server reports the FULL list including the recipient.
 */
function broadcastPresence(room: PartyRoomLike, channel: string): void {
  const members: Array<PresenceMember> = []
  for (const conn of room.getConnections()) {
    const state = getState(conn)
    if (channel in state.presence) {
      members.push({ connectionId: conn.id, data: state.presence[channel] })
    }
  }
  for (const conn of room.getConnections()) {
    const state = getState(conn)
    if (state.channels.includes(channel) || channel in state.presence) {
      sendEnvelope(conn, { type: 'presence', channel, members })
    }
  }
}

/** Fan a `message` out to every connection subscribed to `channel`. */
function fanOut(room: PartyRoomLike, channel: string, data: unknown): void {
  for (const conn of room.getConnections()) {
    if (getState(conn).channels.includes(channel)) {
      sendEnvelope(conn, { type: 'message', channel, data })
    }
  }
}

/**
 * Handle a connection opening: tell the client its connection id (for presence
 * self-exclusion) and initialise its state.
 */
export function onConnect(conn: PartyConnectionLike): void {
  setState(conn, { channels: [], presence: {} })
  sendEnvelope(conn, { type: 'connected', connectionId: conn.id })
}

/** Handle one inbound client envelope, applying it against room state. */
export function onMessage(
  raw: string,
  conn: PartyConnectionLike,
  room: PartyRoomLike,
): void {
  let envelope: ClientEnvelope
  try {
    envelope = JSON.parse(raw) as ClientEnvelope
  } catch {
    return
  }
  const state = getState(conn)

  switch (envelope.type) {
    case 'subscribe':
      if (!state.channels.includes(envelope.channel)) {
        state.channels.push(envelope.channel)
        setState(conn, state)
      }
      break
    case 'unsubscribe':
      state.channels = state.channels.filter((c) => c !== envelope.channel)
      setState(conn, state)
      break
    case 'publish':
      fanOut(room, envelope.channel, envelope.data)
      break
    case 'presence:join':
    case 'presence:update':
      state.presence[envelope.channel] = envelope.data
      setState(conn, state)
      broadcastPresence(room, envelope.channel)
      break
    case 'presence:leave': {
      delete state.presence[envelope.channel]
      setState(conn, state)
      broadcastPresence(room, envelope.channel)
      break
    }
  }
}

/**
 * Handle a connection closing: drop its membership and notify the channels it
 * was present on so peers see it leave.
 */
export function onClose(conn: PartyConnectionLike, room: PartyRoomLike): void {
  const state = getState(conn)
  const presenceChannels = Object.keys(state.presence)
  // Clear before broadcasting so the leaving connection is excluded.
  state.presence = {}
  state.channels = []
  setState(conn, state)
  for (const channel of presenceChannels) broadcastPresence(room, channel)
}

/**
 * A drop-in PartyKit `Server` class implementing the realtime.js wire protocol.
 * Export it as the default from your party file.
 *
 * The `room` is injected by PartyKit into the constructor; the structural
 * {@link PartyRoomLike} keeps this free of a hard PartyKit SDK dependency.
 */
export class RealtimeRoomServer {
  constructor(readonly room: PartyRoomLike) {}

  onConnect(conn: PartyConnectionLike): void {
    onConnect(conn)
  }

  onMessage(message: string, sender: PartyConnectionLike): void {
    onMessage(message, sender, this.room)
  }

  onClose(conn: PartyConnectionLike): void {
    onClose(conn, this.room)
  }
}
