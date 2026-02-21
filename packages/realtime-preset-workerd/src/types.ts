/**
 * Options for {@link workerdTransport}.
 */
export interface WorkerdTransportOptions {
  /**
   * Base URL of the realtime server (e.g. `https://my-server.example.com`).
   *
   * In a browser context the URL is derived from `window.location` if omitted.
   * Must be provided when running inside Cloudflare Workers (no `window`).
   */
  url?: string

  /**
   * URL path prefix matching the server's configured path.
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
