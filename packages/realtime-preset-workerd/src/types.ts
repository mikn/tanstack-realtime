/**
 * Permissions granted to a connection for a specific channel.
 */
export interface ChannelPermissions {
  /** Whether the connection may receive published messages. */
  subscribe: boolean
  /** Whether the connection may publish messages to the channel. */
  publish: boolean
  /** Whether the connection may join the presence set. */
  presence: boolean
}

/**
 * Options for {@link createWorkerdHandler}.
 */
export interface WorkerdHandlerOptions {
  /**
   * URL path prefix under which the realtime endpoint is mounted.
   *
   * The Worker will handle:
   * - `GET  {path}/{channel}` with `Upgrade: websocket` — client connections
   * - `POST {path}/{channel}/publish` — server-side push (requires publish permission)
   *
   * @default '/_realtime'
   */
  path?: string

  /**
   * Extract the caller's auth token from the incoming `Request`.
   *
   * Return `null` to indicate an unauthenticated request; the `authorize`
   * callback will still be called so you can allow anonymous connections.
   */
  getAuthToken: (request: Request) => string | null | Promise<string | null>

  /**
   * Decide what a token is allowed to do on a channel.
   *
   * Return `null` (or permissions with all fields `false`) to deny access
   * entirely. Called once per incoming connection before the WebSocket
   * handshake is accepted.
   *
   * @param token - The value returned by `getAuthToken`, may be `null`.
   * @param channel - The decoded channel key (e.g. `todos?teamId=123`).
   */
  authorize: (
    token: string | null,
    channel: string,
  ) => ChannelPermissions | null | Promise<ChannelPermissions | null>
}

/**
 * Env binding required by the Worker handler produced by {@link createWorkerdHandler}.
 *
 * Extend this interface in your own `Env` type:
 *
 * ```ts
 * interface Env extends WorkerdEnv {
 *   MY_KV: KVNamespace
 * }
 * ```
 */
export interface WorkerdEnv {
  /** Durable Object namespace for per-channel state. Bind as `REALTIME_CHANNEL`. */
  REALTIME_CHANNEL: DurableObjectNamespace
}

/**
 * Options for {@link workerdTransport}.
 */
export interface WorkerdTransportOptions {
  /**
   * Base URL of the Worker (e.g. `https://my-worker.example.com`).
   *
   * In a browser context the URL is derived from `window.location` if omitted.
   * Must be provided when running inside Cloudflare Workers (no `window`).
   */
  url?: string

  /**
   * URL path prefix matching the server's `path` option.
   * @default '/_realtime'
   */
  path?: string

  /**
   * Return the auth token to include with each channel connection.
   * Called once per channel WebSocket when the connection opens.
   */
  getAuthToken?: () => string | null | Promise<string | null>

  /**
   * Base reconnection delay in milliseconds.
   * @default 1000
   */
  retryDelay?: number

  /**
   * Maximum reconnection delay in milliseconds.
   * @default 30_000
   */
  maxRetryDelay?: number
}
