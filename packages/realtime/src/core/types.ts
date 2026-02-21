import type { Store } from '@tanstack/store'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'

export interface PresenceUser<T = unknown> {
  connectionId: string
  data: T
}

/**
 * A parsed channel key.
 * `namespace` is the first segment (e.g. "todos").
 * `params` are the key-value pairs that follow (e.g. `{ projectId: "123" }`).
 * `raw` is the original serialized string.
 */
export interface ParsedChannel {
  namespace: string
  params: Record<string, string>
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
 * The `status` store is the single source of truth for connection state.
 * Framework adapters (React, Vue, Solid) observe it reactively via
 * their respective `useStore` hooks.
 */
export interface RealtimeTransport {
  /** Open a connection to the channel server. */
  connect(): Promise<void>
  /** Close the connection immediately (no reconnect). */
  disconnect(): void

  /**
   * Subscribe to messages on `channel`. Returns an unsubscribe function.
   * The callback fires for every message the server delivers to this channel.
   */
  subscribe(channel: string, onMessage: (data: unknown) => void): () => void

  /**
   * Publish `data` to `channel`.
   * In the Node preset this calls the `/_realtime/publish` endpoint.
   * In Centrifugo/Ably presets it uses the client-side WebSocket.
   */
  publish(channel: string, data: unknown): Promise<void>

  // Presence
  joinPresence(channel: string, data: unknown): void
  updatePresence(channel: string, data: unknown): void
  leavePresence(channel: string): void
  /**
   * Subscribe to presence updates on `channel`. Callback receives the
   * full current user list whenever it changes. Returns an unsubscribe fn.
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
  /** The transport implementation to use (e.g. nodeTransport()). */
  transport: RealtimeTransport
}

export interface RealtimeClient {
  /** TanStack Store holding the current connection status. */
  readonly store: Store<{ status: ConnectionStatus }>

  /** Open the connection. Collections subscribe to channels after this. */
  connect(): Promise<void>
  /** Close the connection. Collections stop receiving live updates. */
  disconnect(): void
  /**
   * Tear down the client and release all internal resources.
   * Call this when the client will no longer be used (e.g. in component cleanup
   * or test teardown) to prevent memory leaks from store subscriptions.
   */
  destroy(): void

  /** Subscribe to a serialized channel key. Returns an unsubscribe function. */
  subscribe(channel: string, onMessage: (data: unknown) => void): () => void

  /** Publish data to a serialized channel key. */
  publish(key: QueryKey | string, data: unknown): Promise<void>

  // Presence helpers (serialized channel key)
  joinPresence(channel: string, data: unknown): void
  updatePresence(channel: string, data: unknown): void
  leavePresence(channel: string): void
  onPresenceChange(
    channel: string,
    callback: (users: ReadonlyArray<PresenceUser>) => void,
  ): () => void
}
