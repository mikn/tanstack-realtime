// ---------------------------------------------------------------------------
// SSE Wire Protocol Types
// ---------------------------------------------------------------------------
//
// The SSE adapter uses a single HTTP endpoint (configurable path, default
// `/_realtime/sse`) for both the event stream (GET) and client-to-server
// actions (POST).
//
// Server → Client  (SSE events, each line: `data: <json>\n\n`)
// Client → Server  (POST body: JSON)
// ---------------------------------------------------------------------------

/** Messages the server sends over the SSE stream. */
export type ServerEvent =
  | { type: 'connected'; connectionId: string }
  | { type: 'message'; channel: string; data: unknown }
  | { type: 'ping' }

/** Actions the client POSTs to the server. */
export type ClientAction =
  | { action: 'subscribe'; connectionId: string; channel: string }
  | { action: 'unsubscribe'; connectionId: string; channel: string }
  | { action: 'publish'; channel: string; data: unknown }

/** Options for the SSE endpoint path. */
export interface SsePathOptions {
  /**
   * URL path for the SSE endpoint (both GET stream and POST actions).
   * Must match `path` in both `createSseHandler` and `sseTransport`.
   * @default '/_realtime/sse'
   */
  path?: string
}
