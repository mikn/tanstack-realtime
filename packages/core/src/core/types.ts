import type { Store } from '@tanstack/store'
import type { HookHandle, HookRegistration } from './hooks.js'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/**
 * The current state of the transport's connection.
 *
 * - `'disconnected'` — no connection; `connect()` has not been called or
 *   `disconnect()` was called explicitly.
 * - `'connecting'` — a connection attempt is in progress.
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
  /** Opaque server-assigned identifier, unique per client connection. */
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

/** Payload delivered when a subscribe attempt is rejected by the server. */
export interface SubscribeError {
  channel: string
  reason: string
  code?: number
}

/** Structured query key — same shape as TanStack Query. */
export type QueryKey = ReadonlyArray<unknown>

// ---------------------------------------------------------------------------
// Transport capabilities — the public adapter capability contract
// ---------------------------------------------------------------------------

/**
 * The public capability contract that every transport adapter declares.
 *
 * `TransportCapabilities` is an **honest, machine-readable description** of
 * what a transport/provider can actually do. The provider-adapter layer
 * (`@realtimejs/adapter-*`) uses it to:
 *  - gate features at the hook boundary so the DX degrades predictably
 *    (e.g. `usePresence` throws an actionable error on a transport that
 *    reports `presence: false`), and
 *  - drive the conformance kit's "capability honesty" battery, which asserts
 *    that declared flags match observed behavior.
 *
 * Every adapter SHOULD declare its capabilities explicitly on the transport
 * (`transport.capabilities`). Transports that don't declare them still work —
 * {@link getCapabilities} derives a conservative back-compat default from the
 * transport's shape.
 *
 * @see getCapabilities for the defaulting rules.
 * @see RealtimeTransport.capabilities for where adapters declare these.
 */
export interface TransportCapabilities {
  /**
   * Transport can carry presence (join/update/leave + member lists).
   *
   * `true` only when the provider holds server-side membership state and the
   * transport implements {@link PresenceCapable}. SSE-style receive-only
   * streams report `false`.
   */
  presence: boolean
  /**
   * Transport/provider can replay missed messages by offset/epoch after a gap.
   *
   * `true` when the provider tracks per-channel offsets/epochs and can resume
   * a subscription from a known position after a reconnect (server-assisted
   * gap recovery). `false` when recovery is best-effort / client-only.
   */
  serverAssistedRecovery: boolean
  /**
   * Provider offers server-side message history retrieval.
   *
   * `true` when past messages can be fetched on demand (e.g. a separate
   * history API). Declared for adapters to advertise; consumed by future
   * history/pagination tooling.
   */
  history: boolean
  /**
   * Transport supports fire-and-forget ephemeral messages (no persistence).
   *
   * Defaults to `true` for any pub/sub transport — fire-and-forget delivery
   * is the baseline behavior of every transport in this library.
   */
  ephemeral: boolean
}

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
  connect: () => Promise<void>

  /**
   * Close the connection immediately. No automatic reconnect will occur.
   * Calling `connect()` again after this starts a fresh connection.
   */
  disconnect: () => void

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
   *
   * Transport implementations receive `unknown` data. For typed
   * subscriptions, use {@link RealtimeClient.subscribe} which narrows the
   * type via a generic parameter.
   */
  subscribe: (channel: string, onMessage: (data: unknown) => void) => () => void

  /**
   * Register a callback for subscribe errors (e.g. authorization denied).
   * Called when the server rejects a subscription attempt.
   * Returns an unsubscribe function.
   */
  onSubscribeError?: (
    callback: (channel: string, reason: string, code?: number) => void,
  ) => () => void

  /**
   * Publish `data` to `channel`.
   * Silently dropped if the transport is not currently connected.
   *
   * Transport implementations accept `unknown` data. For typed
   * publishes, use {@link RealtimeClient.publish} which constrains the
   * type via a generic parameter.
   */
  publish: (channel: string, data: unknown) => Promise<void>

  /** TanStack Store holding the current connection status. */
  readonly store: Store<ConnectionStatus>

  /**
   * Register hooks into the transport's lifecycle pipeline.
   * Returns a handle to remove the hooks.
   *
   * Hooks run in priority order (lower first). Multiple hooks of the
   * same type form a pipeline — `beforeDeliver` hooks run sequentially,
   * and if any returns `false`, the message is suppressed.
   */
  hook: (registration: HookRegistration) => HookHandle

  /**
   * Declared {@link TransportCapabilities} for this transport.
   *
   * **Optional** — existing and third-party transports that don't declare
   * capabilities continue to work. When omitted, {@link getCapabilities}
   * derives a conservative back-compat default from the transport's shape.
   *
   * Every first-party adapter declares this explicitly so the hook layer and
   * the conformance kit can reason about what the transport actually supports.
   * Wrapper transports (coordinated / SharedWorker / BroadcastChannel) forward
   * the **inner** transport's capabilities so wrapping a presence-capable
   * provider still reports `presence: true`.
   */
  readonly capabilities?: TransportCapabilities
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
  joinPresence: (channel: string, data: unknown) => void

  /**
   * Merge `data` into the current user's stored presence state and broadcast
   * the updated list to all members of `channel`.
   * Only the supplied fields are updated; all others are preserved.
   */
  updatePresence: (channel: string, data: unknown) => void

  /**
   * Leave the presence set for `channel`.
   * The server removes this connection from the member list and broadcasts
   * the updated list to all remaining members.
   */
  leavePresence: (channel: string) => void

  /**
   * Subscribe to presence changes on `channel`. Returns an unsubscribe fn.
   *
   * The callback receives the current list of **other** connected users
   * whenever the presence set changes. The calling connection is always
   * excluded from the list.
   */
  onPresenceChange: (
    channel: string,
    callback: (users: ReadonlyArray<PresenceUser>) => void,
  ) => () => void
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
  return (
    typeof (transport as Partial<PresenceCapable>).joinPresence === 'function'
  )
}

/**
 * Resolve the {@link TransportCapabilities} for any {@link RealtimeTransport}.
 *
 * This is the single source of truth the hook layer and conformance kit use to
 * decide what a transport supports.
 *
 * **Defaulting rule** (back-compat for transports that don't declare
 * `capabilities`):
 *  - If `transport.capabilities` is present, it is returned verbatim — the
 *    adapter's declared contract always wins.
 *  - Otherwise a conservative default is derived from the transport's shape:
 *    ```ts
 *    {
 *      presence: hasPresence(transport), // true only if it implements PresenceCapable
 *      serverAssistedRecovery: false,    // assume no server-assisted gap recovery
 *      history: false,                   // assume no history API
 *      ephemeral: true,                  // any pub/sub transport can fire-and-forget
 *    }
 *    ```
 *
 * `ephemeral` defaults to `true` because fire-and-forget delivery is the
 * baseline behavior of every transport; the other flags default to the safe,
 * least-capable assumption so undeclared transports never over-promise.
 *
 * @example
 * if (!getCapabilities(transport).presence) {
 *   // degrade gracefully — presence is unavailable on this transport
 * }
 */
export function getCapabilities(
  transport: RealtimeTransport,
): TransportCapabilities {
  if (transport.capabilities) return transport.capabilities
  return {
    presence: hasPresence(transport),
    serverAssistedRecovery: false,
    history: false,
    ephemeral: true,
  }
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
   * Stable, session-unique identifier for this client.
   *
   * Generated once when `createRealtimeClient` is called. Used internally
   * for CRDT tie-breaking (LWW) and per-client counter vectors (PN-Counter).
   * Expose it to your server if you need to associate realtime events with
   * a specific browser tab or user session.
   */
  readonly clientId: string

  /**
   * TanStack Store holding `{ status: ConnectionStatus }`.
   * Observe this with `useStore` in React (or the equivalent in other
   * frameworks) to reactively track the connection state.
   */
  readonly store: Store<{ status: ConnectionStatus }>

  /**
   * The resolved {@link TransportCapabilities} of the underlying transport.
   *
   * Computed once via {@link getCapabilities} when the client is created.
   * Read this to branch UI/feature code on what the transport supports —
   * e.g. `if (client.capabilities.presence)` before mounting presence UI.
   * Calling presence methods when `capabilities.presence` is `false` throws an
   * actionable `[realtime]` error.
   */
  readonly capabilities: TransportCapabilities

  /**
   * Open the connection. Resolves once `status` reaches `'connected'`.
   * Safe to call repeatedly — already connected returns immediately.
   *
   * Also restores the internal status-listener if `destroy()` was previously
   * called, making the client safe to reconnect after teardown (e.g. in
   * React Strict Mode where effects fire twice).
   */
  connect: () => Promise<void>

  /**
   * Close the connection. No reconnect will be attempted.
   * Collections stop receiving live updates until `connect()` is called again.
   */
  disconnect: () => void

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
  destroy: () => void

  /**
   * Subscribe to a serialized channel string. Returns an unsubscribe function.
   *
   * The type parameter `T` narrows the message data type. Defaults to
   * `unknown` — use it when you know the shape of messages on a channel.
   *
   * Prefer `realtimeCollectionOptions` or `liveChannelOptions` for
   * collection-backed subscriptions.
   */
  subscribe: <T = unknown>(
    channel: string,
    onMessage: (data: T) => void,
  ) => () => void

  /**
   * Publish `data` to a channel.
   *
   * The type parameter `T` constrains the data type. Defaults to `unknown`.
   *
   * Accepts either a pre-serialized channel string or a `QueryKey` array
   * (which is serialized via `serializeKey` before sending).
   */
  publish: <T = unknown>(key: QueryKey | string, data: T) => Promise<void>

  /**
   * Join the presence set for `channel` with the given `data`.
   * `channel` must be a pre-serialized string (use `serializeKey` if needed).
   * The server broadcasts the updated presence list to all channel members.
   *
   * @throws {Error} if the underlying transport does not implement {@link PresenceCapable}.
   */
  joinPresence: (channel: string, data: unknown) => void

  /**
   * Merge `data` into the current user's stored presence state for `channel`.
   * Only the supplied fields are updated; all others are preserved on the server.
   *
   * @throws {Error} if the underlying transport does not implement {@link PresenceCapable}.
   */
  updatePresence: (channel: string, data: unknown) => void

  /**
   * Leave the presence set for `channel`.
   * The server removes this connection from the member list and broadcasts
   * the updated list to all remaining members.
   *
   * @throws {Error} if the underlying transport does not implement {@link PresenceCapable}.
   */
  leavePresence: (channel: string) => void

  /**
   * Subscribe to presence changes on `channel`. Returns an unsubscribe fn.
   * The callback receives the current list of **other** connected users
   * (the calling client is always excluded from the list).
   *
   * @throws {Error} if the underlying transport does not implement {@link PresenceCapable}.
   */
  onPresenceChange: (
    channel: string,
    callback: (users: ReadonlyArray<PresenceUser>) => void,
  ) => () => void

  /**
   * Register a callback that fires when the server rejects a subscription
   * attempt. Returns an unsubscribe function.
   *
   * If the underlying transport does not implement `onSubscribeError`, the
   * returned function is a no-op.
   */
  onSubscribeError: (
    callback: (channel: string, reason: string, code?: number) => void,
  ) => () => void

  /**
   * Register hooks into the transport's lifecycle pipeline.
   * Delegates to the underlying transport's `hook()` method.
   */
  hook: (registration: HookRegistration) => HookHandle
}
