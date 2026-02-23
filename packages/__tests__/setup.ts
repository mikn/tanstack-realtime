/**
 * Global vitest setup file.
 *
 * Polyfills the WebSocket global using the `ws` package when running in
 * Node.js environments that don't have it natively (Node < 21).
 */
import { WebSocket } from 'ws'

if (typeof globalThis.WebSocket === 'undefined') {
  // @ts-expect-error — ws's WebSocket is not 100% identical to the browser type
  globalThis.WebSocket = WebSocket
}
