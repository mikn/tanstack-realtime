import type { Store } from '@tanstack/store'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/**
 * The current state of the transport's WebSocket connection.
 *
 * - `'disconnected'` — no connection; `connect()` has not been called or
 *   `disconnect()` was called explicitly.
 * - `'connecting'` — a WebSocket handshake is in progress.
 * - `'connected'` — the connection is open and ready to send/receive.
 * - `'reconnecting'` — the connection was lost unexpectedly; the transport
 *   is waiting to retry with exponential back-off.
 */
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'

export interface PresenceUser<T = unknown> {
  /** Opaque server-assigned identifier, unique per WebSocket connection. */
  connectionId: string
  /** Application data published by this user (cursor position, display name, etc.). */
  data: T
}

export interface ParsedChannel {
  /** The first path segment of the channel key (e.g. `"todos"`). */
  namespace: string
  /** Key-value pairs that follow the namespace (e.g. `{ projectId: "123" }`). */
  params: Record<string, string>
  /** The original serialized channel string passed to `serializeKey`. */
  raw: string
}

/** Structured query key — same shape as TanStack Query. */
export type QueryKey = ReadonlyArray<unknown>

// ---------------------------------------------------------------------------
// Transport interface
// ---------------------------------------------------------------------------

/**
 * The provider-agnostic transport contract.
 * Each preset implements this interface: Node (local), Centrifugo, Ably, etc.
 *
 * The `store` is the single source of truth for connection state.
 * Framework adapters (React, Vue, Solid) observe it reactively via
 * their respective `useStore` hooks.
 */
export interface RealtimeTransport {
  /**
   * Open a connection to the channel server.
   * If the transport is already connected this resolves immediately.
   * If a reconnect cycle is already in progress, returns a Promise that
   * settles once it completes rather than opening a second socket.
   */
  connect(): Promise<void>

  /**
   * Close the connection immediately. No automatic reconnect will occur.
   * Calling `connect()` again after this starts a fresh connection.
   */
  disconnect(): void

  /**
   * Subscribe to messages on `channel`. Returns an unsubscribe function.
   *
   * The server receives the first `subscribe` message when the first listener
   * is added. If the transport is not yet connected, the subscribe message is
   * deferred and sent automatically on the next successful connection
   * (including after reconnects).
   *
   * Calling the returned function removes the listener. When the last
   * listener for a channel is removed the transport sends `unsubscribe` to
   * the server.
   */
  subscribe(channel: string, onMessage: (data: unknown) => void): () => void

  /**
   * Publish `data` to `channel`.
   * Silently dropped if the transport is not currently connected.
   */
  publish(channel: string, data: unknown): Promise<void>

  /**
   * Join the presence set for `channel` with the supplied initial `data`.
   * The server broadcasts the updated presence list to all channel members.
   *
   * Requires the channel to have been subscribed first — the server silently
   * drops `presence:join` from connections that are not authorized on this channel.
   */
  joinPresence(channel: string, data: unknown): void

  /**
   * Merge `data` into the current user's stored presence state and broadcast
   * the updated list to all members of `channel`.
   * Only the supplied fields are updated; all others are preserved.
   */
  updatePresence(channel: string, data: unknown): void

  /**
   * Leave the presence set for `channel`.
   * The server removes this connection from the member list and broadcasts
   * the updated list to all remaining members.
   */
  leavePresence(channel: string): void

  /**
   * Subscribe to presence changes on `channel`. Returns an unsubscribe fn.
   *
   * The callback receives the current list of **other** connected users
   * whenever the presence set changes. The calling connection is always
   * excluded from the list.
   */
  onPresenceChange(
    channel: string,
    callback: (users: ReadonlyArray<PresenceUser>) => void,
  ): () => void

  /** TanStack Store holding the current connection status. */
  readonly store: Store<ConnectionStatus>
}

// ---------------------------------------------------------------------------
// Client interface
// ---------------------------------------------------------------------------

export interface RealtimeClientOptions {
  /** The transport implementation to use (e.g. `nodeTransport()`). */
  transport: RealtimeTransport
}

export interface RealtimeClient {
  /**
   * TanStack Store holding `{ status: ConnectionStatus }`.
   * Observe this with `useStore` in React (or the equivalent in other
   * frameworks) to reactively track the connection state.
   */
  readonly store: Store<{ status: ConnectionStatus }>

  /**
   * Open the connection. Resolves once `status` reaches `'connected'`.
   * Safe to call repeatedly — already connected returns immediately.
   */
  connect(): Promise<void>

  /**
   * Close the connection. No reconnect will be attempted.
   * Collections stop receiving live updates until `connect()` is called again.
   */
  disconnect(): void

  /**
   * Tear down the client and release all internal subscriptions.
   * Call this when the client will no longer be used (e.g. on app teardown
   * or in test cleanup) to prevent memory leaks from the status store subscription.
   */
  destroy(): void

  /**
   * Subscribe to a serialized channel string. Returns an unsubscribe function.
   * Prefer `realtimeCollectionOptions` or `liveChannelOptions` for
   * collection-backed subscriptions.
   */
  subscribe(channel: string, onMessage: (data: unknown) => void): () => void

  /**
   * Publish `data` to a channel.
   * Accepts either a pre-serialized channel string or a `QueryKey` array
   * (which is serialized via `serializeKey` before sending).
   */
  publish(key: QueryKey | string, data: unknown): Promise<void>

  /**
   * Join the presence set for `channel` with the given `data`.
   * `channel` must be a pre-serialized string (use `serializeKey` if needed).
   * The server broadcasts the updated presence list to all channel members.
   */
  joinPresence(channel: string, data: unknown): void

  /**
   * Merge `data` into the current user's stored presence state for `channel`.
   * Only the supplied fields are updated; all others are preserved on the server.
   */
  updatePresence(channel: string, data: unknown): void

  /**
   * Leave the presence set for `channel`.
   * The server removes this connection from the member list and broadcasts
   * the updated list to all remaining members.
   */
  leavePresence(channel: string): void

  /**
   * Subscribe to presence changes on `channel`. Returns an unsubscribe fn.
   * The callback receives the current list of **other** connected users
   * (the calling client is always excluded from the list).
   */
  onPresenceChange(
    channel: string,
    callback: (users: ReadonlyArray<PresenceUser>) => void,
  ): () => void
}
