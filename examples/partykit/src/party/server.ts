/**
 * PartyKit room server for the realtime.js PartyKit example.
 *
 * This is the SERVER side of the provider-adapter story. It runs on PartyKit /
 * Cloudflare Durable Objects (one room == one Durable Object) and speaks the
 * exact wire protocol that `@realtimejs/adapter-partykit`'s `partykitTransport`
 * expects (see `@realtimejs/adapter-partykit/protocol`).
 *
 * All the protocol logic lives in the adapter's REFERENCE server,
 * `@realtimejs/adapter-partykit/server` (`RealtimeRoomServer` + the
 * `onConnect`/`onMessage`/`onClose` handlers). We do NOT re-implement
 * subscribe/publish fan-out or presence here — we only bridge PartyKit's
 * `Party.Server` lifecycle to the reference handlers.
 *
 * ## Why a thin adapter class instead of `export default RealtimeRoomServer`?
 * The reference server depends on small *structural* types
 * (`PartyConnectionLike` / `PartyRoomLike`) so the package takes no hard
 * dependency on the PartyKit SDK. PartyKit's real `Party.Connection` is
 * `WebSocket & { id, state, setState, ... }`, but its `state`/`setState` are
 * typed with an `ImmutableObject<T>` wrapper that is structurally narrower than
 * the reference server's mutable `ConnectionState`. The shapes line up at
 * RUNTIME (the per-connection bag round-trips the exact object we store), but
 * not at the TYPE level. So instead of weakening the reference types, we bridge
 * here: a tiny `asLike()` coercion (through `unknown`) at the call boundary, plus
 * narrowing `onMessage` to a string. The bridge is small, fully typed against
 * `Party.Server`, and isolates the single unavoidable cast.
 */
import { RealtimeRoomServer } from '@realtimejs/adapter-partykit/server'
import type {
  PartyConnectionLike,
  PartyRoomLike,
} from '@realtimejs/adapter-partykit/server'
import type * as Party from 'partykit/server'

/**
 * Coerce a PartyKit `Connection` to the reference server's structural
 * `PartyConnectionLike`. The only divergence is PartyKit's `ImmutableObject`
 * wrapper on the per-connection `state` bag; at runtime `state`/`setState`
 * faithfully round-trip the `ConnectionState` the reference handlers store, so
 * this cast is sound. Centralised here so the rest of the class stays cast-free.
 */
function asLike(connection: Party.Connection): PartyConnectionLike {
  return connection as unknown as PartyConnectionLike
}

export default class RealtimeServer implements Party.Server {
  /**
   * The reference server holds no state of its own beyond the `room` reference —
   * all membership/subscription state lives on each connection's `state` bag
   * (the Durable Object). PartyKit constructs one `Server` per room (DO), so a
   * single reference instance per room is exactly right.
   */
  private readonly realtime: RealtimeRoomServer

  constructor(readonly room: Party.Room) {
    // `Party.Room` exposes `getConnections(): Iterable<Connection>`, satisfying
    // `PartyRoomLike` modulo the same `ImmutableObject` state wrapper as above.
    this.realtime = new RealtimeRoomServer(room as unknown as PartyRoomLike)
  }

  onConnect(connection: Party.Connection): void {
    // The reference handler sends the `connected` envelope so the client learns
    // its connection id for presence self-exclusion.
    this.realtime.onConnect(asLike(connection))
  }

  onMessage(
    message: string | ArrayBuffer | ArrayBufferView,
    sender: Party.Connection,
  ): void {
    // The reference protocol is JSON text; ignore any binary frames.
    if (typeof message !== 'string') return
    // The reference handler parses the envelope, applies it against `sender`'s
    // state, and fans out over the room.
    this.realtime.onMessage(message, asLike(sender))
  }

  onClose(connection: Party.Connection): void {
    this.realtime.onClose(asLike(connection))
  }
}
