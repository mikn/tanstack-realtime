/**
 * @tanstack/realtime-adapter-sse
 *
 * Server-Sent Events (SSE) transport adapter for @tanstack/realtime.
 *
 * - `sseTransport` — client transport using fetch() + ReadableStream
 * - `createSseHandler` — server handler compatible with the Fetch API
 *   (Cloudflare Workers, Deno, Bun, Next.js Edge Routes, Node.js via adapter)
 */

export { sseTransport } from './transport.js'
export type { SseTransportOptions } from './transport.js'

export { createSseHandler } from './handler.js'
export type { SseHandler, SseHandlerOptions } from './handler.js'

export type { ServerEvent, ClientAction, SsePathOptions } from './protocol.js'
