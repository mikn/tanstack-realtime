import { createSseHandler } from '@tanstack/realtime-adapter-sse'
import { createServerStream, serializeKey } from '@tanstack/realtime'
import type { PublishFn, QueryKey, ServerStream } from '@tanstack/realtime'
import type { SseHandlerOptions } from '@tanstack/realtime-adapter-sse'

// ---------------------------------------------------------------------------
// PublishBackend — pluggable pub/sub storage interface
// ---------------------------------------------------------------------------

/**
 * External pub/sub backend for routing publish calls across server processes.
 *
 * In single-process deployments (development, small apps, TanStack Start on
 * a single Node.js instance), the default in-process broadcasting is sufficient
 * — no backend is needed.
 *
 * For multi-process or horizontally-scaled deployments, implement this
 * interface to fan out through your preferred storage without being tied to
 * any specific provider:
 *
 * - **Redis / Upstash**: `publish` → `PUBLISH`, `subscribe` → `SUBSCRIBE`
 * - **Postgres**: `publish` → `NOTIFY`, `subscribe` → `LISTEN`
 * - **Cloudflare Durable Objects**: single-instance actor (omit `subscribe`)
 * - **Any database-level trigger**: write a row, poll or LISTEN for changes
 *
 * The interface intentionally mirrors how TanStack DB treats its own storage
 * adapters — it defines the contract (what must happen), not the mechanism
 * (how it happens). Bring your own storage.
 *
 * @example
 * // Redis backend (using ioredis)
 * import Redis from 'ioredis'
 *
 * const pub = new Redis(process.env.REDIS_URL)
 * const sub = new Redis(process.env.REDIS_URL)
 *
 * const backend: PublishBackend = {
 *   async publish(channel, data) {
 *     await pub.publish('realtime', JSON.stringify({ channel, data }))
 *   },
 *   subscribe(onMessage) {
 *     void sub.subscribe('realtime')
 *     sub.on('message', (_ch, msg) => {
 *       const { channel, data } = JSON.parse(msg) as { channel: string; data: unknown }
 *       onMessage(channel, data)
 *     })
 *     return () => { void sub.unsubscribe('realtime') }
 *   },
 * }
 *
 * @example
 * // Postgres LISTEN/NOTIFY backend
 * import { Client } from 'pg'
 *
 * const pgPub = new Client(process.env.DATABASE_URL)
 * const pgSub = new Client(process.env.DATABASE_URL)
 * await pgPub.connect()
 * await pgSub.connect()
 *
 * const backend: PublishBackend = {
 *   async publish(channel, data) {
 *     const payload = JSON.stringify({ channel, data })
 *     await pgPub.query(`SELECT pg_notify('realtime', $1)`, [payload])
 *   },
 *   subscribe(onMessage) {
 *     pgSub.on('notification', (msg) => {
 *       if (msg.channel !== 'realtime' || !msg.payload) return
 *       const { channel, data } = JSON.parse(msg.payload) as { channel: string; data: unknown }
 *       onMessage(channel, data)
 *     })
 *     void pgSub.query('LISTEN realtime')
 *     return () => { void pgSub.query('UNLISTEN realtime') }
 *   },
 * }
 */
export interface PublishBackend {
  /**
   * Publish a message so that all subscribed clients — across every server
   * process — receive it.
   *
   * Called by the handler's `publish` method (and by `createStream`) whenever
   * a server function wants to broadcast an update.
   *
   * For single-process deployments, you can ignore multi-process concerns and
   * simply call your in-process broadcaster directly. For multi-process, write
   * to a shared store (Redis channel, Postgres NOTIFY, etc.) so every instance
   * is woken up via `subscribe`.
   */
  publish: (channel: string, data: unknown) => Promise<void>

  /**
   * Subscribe to messages arriving from external storage so this process can
   * forward them to its local SSE connections.
   *
   * Called once when the handler is created. The returned function is called
   * during `dispose()` to clean up the subscription.
   *
   * **Only needed for multi-process deployments.** In single-process mode
   * (no `backend` provided), messages go directly to local SSE clients and
   * no subscription is required.
   *
   * When a message arrives from storage, call `onMessage(channel, data)`.
   * The handler will then broadcast it to all SSE clients on this process
   * that are subscribed to `channel`.
   */
  subscribe?: (
    onMessage: (channel: string, data: unknown) => void,
  ) => () => void
}

// ---------------------------------------------------------------------------
// Options and return type
// ---------------------------------------------------------------------------

/**
 * Options for `createStartHandler`.
 *
 * All fields from `SseHandlerOptions` are inherited (`getUser`, `authorize`,
 * `pingInterval`). The only addition is `backend` for multi-process pub/sub.
 */
export interface StartHandlerOptions extends SseHandlerOptions {
  /**
   * External pub/sub backend for multi-process or scaled deployments.
   *
   * When omitted (the default), messages published via `handler.publish()`
   * or `handler.createStream()` are delivered in-process to the SSE clients
   * connected to this server instance. This is ideal for:
   *
   * - Local development
   * - Single-process TanStack Start apps (the common case on Node.js)
   * - Cloudflare Workers with a single Durable Object per channel
   *
   * Pass a `PublishBackend` to route publishes through a shared store
   * (Redis, Postgres LISTEN/NOTIFY, etc.) so all server instances fan out
   * the message to their own local SSE connections.
   */
  backend?: PublishBackend
}

/**
 * A TanStack Start–compatible realtime handler produced by `createStartHandler`.
 */
export interface StartRealtimeHandler {
  /**
   * Handle an incoming HTTP request.
   *
   * Mount this on a TanStack Start API route to serve the SSE stream (GET)
   * and client actions (POST). OPTIONS is handled for CORS pre-flight.
   *
   * ```ts
   * // app/routes/api/realtime.ts
   * import { createAPIFileRoute } from '@tanstack/start/api'
   * import { realtime } from '../../server/realtime'
   *
   * export const Route = createAPIFileRoute('/api/realtime')({
   *   GET: ({ request }) => realtime.handle(request),
   *   POST: ({ request }) => realtime.handle(request),
   *   OPTIONS: ({ request }) => realtime.handle(request),
   * })
   * ```
   */
  handle: (req: Request) => Promise<Response>

  /**
   * Publish data to a channel from server code.
   *
   * Accepts a `QueryKey` array (serialized via `serializeKey`) or a
   * pre-serialized channel string. All subscribed clients receive the message.
   *
   * Use this in TanStack Start server functions after mutating your database:
   *
   * ```ts
   * // app/server/functions/todos.ts
   * import { createServerFn } from '@tanstack/start'
   * import { realtimePublish } from '../realtime'
   *
   * export const updateTodo = createServerFn({ method: 'POST' })
   *   .handler(async ({ data }) => {
   *     const updated = await db.todos.update(data.id, data)
   *     await realtimePublish(['todos', { projectId: data.projectId }], {
   *       action: 'update',
   *       data: updated,
   *     })
   *     return updated
   *   })
   * ```
   *
   * When a `PublishBackend` is configured, the message is routed through it
   * so all server instances fan out to their connected clients.
   */
  publish: PublishFn

  /**
   * Create a server-side stream handle for pushing ordered events to a channel.
   *
   * Returns a `ServerStream` with `push()`, `done()`, and `error()` methods.
   * Each pushed event is wrapped with `_seq` and `_ts` metadata for
   * deduplication and stale detection on the client side.
   *
   * Mirrors the API of `createServerStream()` from the core package.
   * Clients consume via `streamChannelOptions` or the `useStream` hook.
   *
   * ```ts
   * // app/server/functions/ai.ts
   * export const generateAI = createServerFn({ method: 'POST' })
   *   .handler(async ({ data }) => {
   *     const stream = realtime.createStream({
   *       channel: ['ai', { sessionId: data.sessionId }],
   *     })
   *     for await (const chunk of llm.stream(data.prompt)) {
   *       await stream.push({ type: 'token', content: chunk })
   *     }
   *     await stream.done()
   *   })
   * ```
   *
   * When a `PublishBackend` is configured, each `stream.push()` routes through
   * it so all server instances can forward events to their local SSE clients.
   */
  createStream: <TEvent = unknown>(options: {
    channel: QueryKey | string
    hmacKey?: string
  }) => ServerStream<TEvent>

  /**
   * Release resources held by this handler.
   *
   * When a `PublishBackend` with `subscribe` was provided, this calls the
   * unsubscribe function returned by `backend.subscribe()`. Call `dispose()`
   * on server shutdown or during hot-module replacement.
   */
  dispose: () => void
}

// ---------------------------------------------------------------------------
// createStartHandler
// ---------------------------------------------------------------------------

/**
 * Create a TanStack Start–compatible realtime handler.
 *
 * This is the recommended entry point for adding realtime to a TanStack Start
 * application. It composes `createSseHandler` (from `@tanstack/realtime-adapter-sse`)
 * with a transport-agnostic `publish` function, so your server functions never
 * need to know or care which transport delivers messages to clients.
 *
 * **Single-process usage (recommended starting point):**
 *
 * ```ts
 * // app/server/realtime.ts
 * import { createStartHandler } from '@tanstack/realtime-preset-start'
 * import { getSession } from './auth'
 *
 * export const realtime = createStartHandler({
 *   getUser: async (req) => {
 *     const session = await getSession(req)
 *     return session ? { userId: session.userId } : null
 *   },
 * })
 *
 * // Named export for use in server functions
 * export const realtimePublish = realtime.publish
 * ```
 *
 * ```ts
 * // app/routes/api/realtime.ts
 * import { createAPIFileRoute } from '@tanstack/start/api'
 * import { realtime } from '../../server/realtime'
 *
 * export const Route = createAPIFileRoute('/api/realtime')({
 *   GET: ({ request }) => realtime.handle(request),
 *   POST: ({ request }) => realtime.handle(request),
 *   OPTIONS: ({ request }) => realtime.handle(request),
 * })
 * ```
 *
 * ```ts
 * // app/server/functions/todos.ts
 * import { createServerFn } from '@tanstack/start'
 * import { realtimePublish } from '../realtime'
 *
 * export const updateTodo = createServerFn({ method: 'POST' })
 *   .handler(async ({ data }) => {
 *     const updated = await db.todos.update(data.id, data)
 *     await realtimePublish(['todos', { projectId: data.projectId }], {
 *       action: 'update',
 *       data: updated,
 *     })
 *     return updated
 *   })
 * ```
 *
 * **Multi-process usage with a custom backend:**
 *
 * Provide a `backend` to fan out publishes through your preferred storage.
 * The interface is deliberately minimal — implement `publish` and optionally
 * `subscribe`. See {@link PublishBackend} for Redis and Postgres examples.
 *
 * ```ts
 * // app/server/realtime.ts
 * import { createStartHandler, type PublishBackend } from '@tanstack/realtime-preset-start'
 *
 * // Example: connect any pub/sub store by implementing two methods
 * const backend: PublishBackend = {
 *   async publish(channel, data) {
 *     // Write to your storage (Redis, Postgres NOTIFY, etc.)
 *     await myStore.publish(channel, data)
 *   },
 *   subscribe(onMessage) {
 *     // Subscribe to your storage; call onMessage when a message arrives
 *     return myStore.subscribe(onMessage)
 *   },
 * }
 *
 * export const realtime = createStartHandler({ backend })
 * export const realtimePublish = realtime.publish
 * ```
 */
export function createStartHandler(
  options: StartHandlerOptions = {},
): StartRealtimeHandler {
  const { backend, ...sseOptions } = options
  const sse = createSseHandler(sseOptions)

  // If the backend provides a subscribe hook, wire it up so messages arriving
  // from other processes are broadcast to local SSE connections.
  let unsubscribeBackend: (() => void) | undefined
  if (backend?.subscribe) {
    unsubscribeBackend = backend.subscribe((channel, data) => {
      sse.broadcast(channel, data)
    })
  }

  // The publish function is the single entry point for all server-initiated
  // broadcasts, regardless of whether a backend is configured.
  const publish: PublishFn = async (
    channel: QueryKey | string,
    data: unknown,
  ): Promise<void> => {
    const ch = typeof channel === 'string' ? channel : serializeKey(channel)
    if (backend) {
      // Route through the external backend so every server instance is notified.
      // Each instance's `subscribe` callback will call sse.broadcast() locally.
      await backend.publish(ch, data)
    } else {
      // Single-process: deliver directly to local SSE connections.
      sse.broadcast(ch, data)
    }
  }

  return {
    handle: (req: Request) => sse.handle(req),

    publish,

    createStream<TEvent = unknown>(opts: {
      channel: QueryKey | string
      hmacKey?: string
    }): ServerStream<TEvent> {
      // Use the handler's publish so multi-process fan-out works correctly
      // (e.g. an AI stream running on process A reaches clients on process B).
      return createServerStream<TEvent>({
        publish,
        channel: opts.channel,
        hmacKey: opts.hmacKey,
      })
    },

    dispose() {
      unsubscribeBackend?.()
    },
  }
}
