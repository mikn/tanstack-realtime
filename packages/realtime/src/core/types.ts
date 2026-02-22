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
// Transport interface — base + optional presence capability
// ---------------------------------------------------------------------------

/**
 * The core transport contract: connection lifecycle and pub/sub.
 *
 * This is the interface to implement for a custom transport. Presence support
 * is opt-in — additionally implement {@link PresenceCapable} to enable
 * `joinPresence`, `updatePresence`, `leavePresence`, and `onPresenceChange`
 * on both the transport and the {@link RealtimeClient}.
 *
 * All built-in transports (Node preset, Centrifugo adapter, SharedWorker)
 * implement both `RealtimeTransport` and {@link PresenceCapable}. Custom
 * transports that do not require presence implement only `RealtimeTransport`
 * — no presence no-op stubs needed.
 *
 * Use {@link hasPresence} to check for presence capability at runtime when
 * writing generic middleware.
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

  /** TanStack Store holding the current connection status. */
  readonly store: Store<ConnectionStatus>
}

/**
 * Optional transport extension for realtime presence.
 *
 * Implement this alongside {@link RealtimeTransport} to unlock the full
 * presence API (`joinPresence`, `updatePresence`, `leavePresence`,
 * `onPresenceChange`) on both the transport and the {@link RealtimeClient}.
 *
 * Use the {@link hasPresence} type guard to branch on presence support at
 * runtime when writing generic transport middleware.
 *
 * @example
 * // Check at runtime before calling presence methods
 * if (hasPresence(transport)) {
 *   transport.joinPresence('channel', { name: 'Alice' })
 * }
 */
export interface PresenceCapable {
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
}

/**
 * Type guard — returns `true` when `transport` implements {@link PresenceCapable}.
 *
 * Use this in generic middleware or utility code that accepts any
 * {@link RealtimeTransport} but should conditionally enable presence features:
 *
 * @example
 * function myMiddleware(inner: RealtimeTransport) {
 *   return {
 *     ...inner,
 *     joinPresence(channel: string, data: unknown) {
 *       if (hasPresence(inner)) inner.joinPresence(channel, data)
 *       else throw new Error('Transport does not support presence')
 *     },
 *   }
 * }
 */
export function hasPresence(
  transport: RealtimeTransport,
): transport is RealtimeTransport & PresenceCapable {
  return typeof (transport as Partial<PresenceCapable>).joinPresence === 'function'
}

// ---------------------------------------------------------------------------
// Client interface
// ---------------------------------------------------------------------------

export interface RealtimeClientOptions {
  /**
   * The transport implementation.
   *
   * Accepts any {@link RealtimeTransport}. Presence features (`joinPresence`,
   * `updatePresence`, `leavePresence`, `onPresenceChange`) are automatically
   * enabled when the transport also implements {@link PresenceCapable}.
   * Calling those methods on a client whose transport lacks presence support
   * throws a descriptive `Error` at runtime.
   */
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
   *
   * Also restores the internal status-listener if `destroy()` was previously
   * called, making the client safe to reconnect after teardown (e.g. in
   * React Strict Mode where effects fire twice).
   */
  connect(): Promise<void>

  /**
   * Close the connection. No reconnect will be attempted.
   * Collections stop receiving live updates until `connect()` is called again.
   */
  disconnect(): void

  /**
   * Release the internal status-store subscription.
   *
   * Call this when the client will no longer be used (e.g. on app teardown).
   * After `destroy()`, the client's own `store.status` will no longer mirror
   * the transport's connection state until `connect()` is called again.
   *
   * **React lifecycle**: if you pass the client to `<RealtimeProvider>`,
   * the provider will call `destroy()` for you on unmount. It is safe to
   * reconnect the same client instance after `destroy()`.
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
   *
   * @throws {Error} if the underlying transport does not implement {@link PresenceCapable}.
   */
  joinPresence(channel: string, data: unknown): void

  /**
   * Merge `data` into the current user's stored presence state for `channel`.
   * Only the supplied fields are updated; all others are preserved on the server.
   *
   * @throws {Error} if the underlying transport does not implement {@link PresenceCapable}.
   */
  updatePresence(channel: string, data: unknown): void

  /**
   * Leave the presence set for `channel`.
   * The server removes this connection from the member list and broadcasts
   * the updated list to all remaining members.
   *
   * @throws {Error} if the underlying transport does not implement {@link PresenceCapable}.
   */
  leavePresence(channel: string): void

  /**
   * Subscribe to presence changes on `channel`. Returns an unsubscribe fn.
   * The callback receives the current list of **other** connected users
   * (the calling client is always excluded from the list).
   *
   * @throws {Error} if the underlying transport does not implement {@link PresenceCapable}.
   */
  onPresenceChange(
    channel: string,
    callback: (users: ReadonlyArray<PresenceUser>) => void,
  ): () => void
}
