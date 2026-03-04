import {
  createServerStream,
  normalizePermissions,
  parseChannel,
  serializeKey,
} from '@tanstack/realtime'
import type {
  AuthorizeFn,
  LifecycleHooks,
  QueryKey,
  ServerStream,
} from '@tanstack/realtime'
import type { ClientAction, ServerEvent } from './protocol.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Opaque handle returned by `createSseHandler`. */
export interface SseHandler {
  /**
   * Handle an incoming HTTP `Request` and return a `Response`.
   *
   * - GET  → opens an SSE stream for the client.
   * - POST → dispatches a client action (subscribe / unsubscribe / publish).
   *
   * All other methods receive a `405 Method Not Allowed` response.
   */
  handle: (req: Request) => Promise<Response>

  /**
   * Push a message to all connections subscribed to `channel`.
   * Useful for server-initiated broadcasts (e.g. from a database trigger or
   * server function).
   */
  broadcast: (channel: string, data: unknown) => void

  /**
   * Return the current number of active SSE connections.
   * Useful for health checks and tests.
   */
  connectionCount: () => number

  /**
   * Create a server-side stream for pushing events to a channel.
   *
   * The stream handle wraps `broadcast()` and adds sentinel events for
   * `done()` and `error()`. Clients consume via `streamChannelOptions`.
   *
   * @example
   * const stream = sseHandler.createStream({ channel: ['ai', { sessionId }] })
   * for await (const chunk of llmResponse) {
   *   await stream.push({ type: 'token', content: chunk })
   * }
   * await stream.done()
   */
  createStream: <TEvent = unknown>(options: {
    channel: QueryKey | string
    hmacKey?: string
  }) => ServerStream<TEvent>
}

export interface SseHandlerOptions extends LifecycleHooks {
  /**
   * Interval in milliseconds for sending SSE keep-alive pings.
   * Set to `0` to disable pings.
   * @default 30_000
   */
  pingInterval?: number

  /**
   * Authenticate the incoming HTTP request.
   *
   * Return `{ userId: string }` to allow the request, or `null` / `undefined`
   * to reject with **401 Unauthorized**. When omitted every request is allowed
   * (no authentication enforced — suitable for development and internal APIs).
   *
   * Called on **every** request (GET stream open and POST actions) so
   * short-lived tokens are re-validated on every POST.
   *
   * The `Request` object gives access to headers, cookies, and URL search
   * params, so any auth mechanism (Bearer JWT, session cookie, API key,
   * signed URL param) is supported.
   *
   * Pair with `sseTransport({ getToken })` on the client side so the token
   * is included in the `Authorization: Bearer <token>` header.
   *
   * @example
   * // Validate a Bearer JWT from the Authorization header
   * getUser: async (req) => {
   *   const auth = req.headers.get('Authorization')
   *   if (!auth?.startsWith('Bearer ')) return null
   *   try {
   *     const { sub } = await verifyJwt(auth.slice(7), JWT_SECRET)
   *     return { userId: sub }
   *   } catch {
   *     return null
   *   }
   * }
   *
   * @example
   * // API key from query param (e.g. for server-to-server connections)
   * getUser: (req) => {
   *   const key = new URL(req.url).searchParams.get('apiKey')
   *   return key === MY_API_KEY ? { userId: 'server' } : null
   * }
   */
  getUser?: (
    req: Request,
  ) =>
    | { userId: string }
    | null
    | undefined
    | Promise<{ userId: string } | null | undefined>

  /**
   * Authorize a channel action for an already-authenticated user.
   *
   * Receives `(userId, parsedChannel)` and returns
   * `ChannelPermissions | boolean`. The handler checks the relevant
   * permission (`subscribe` or `publish`) per action.
   *
   * When omitted all authenticated users are permitted on all channels.
   *
   * Called **after** `getUser` succeeds, so `userId` is always set.
   * Unsubscribe actions are always allowed (they cannot be used to exfiltrate
   * data and must succeed to avoid subscription leaks).
   *
   * @example
   * authorize: async (userId, channel) => {
   *   const member = await db.getProjectMember(userId, channel.params.projectId)
   *   return member
   *     ? { subscribe: true, publish: member.role === 'editor', presence: true }
   *     : false
   * }
   */
  authorize?: AuthorizeFn
}

// ---------------------------------------------------------------------------
// createSseHandler
// ---------------------------------------------------------------------------

/**
 * Creates a Fetch-API–compatible SSE handler.
 *
 * Mount it on a route in any edge/serverless runtime that speaks the Fetch API
 * (Cloudflare Workers, Deno, Bun, Next.js Edge Routes, etc.) as well as
 * Node.js (via a thin adapter such as `@hono/node-server`).
 *
 * ## ⚠️ Stateful (single-process only)
 *
 * The handler maintains an **in-memory** map of open SSE connections. This
 * means:
 * - `broadcast()` only reaches clients connected to the **same process**.
 * - It is **not** compatible with stateless serverless platforms where each
 *   invocation is isolated (e.g. Vercel Edge Functions, Cloudflare Workers
 *   with cold starts).
 *
 * For serverless fan-out, pair the handler with a backing pub/sub store:
 * - **Cloudflare**: Durable Objects (single instance = persistent state)
 * - **Redis / Upstash**: subscribe to a Redis channel in each instance and
 *   call `broadcast()` when a message arrives.
 *
 * ## Authentication
 *
 * Pass `getUser` to enable per-request authentication and `authorize` for
 * per-channel access control. Both are optional — omit them for open
 * development endpoints.
 *
 * @example
 * // Cloudflare Worker / Hono — authenticated
 * const sse = createSseHandler({
 *   getUser: async (req) => {
 *     const token = req.headers.get('Authorization')?.slice(7)
 *     return token ? await verifyToken(token) : null
 *   },
 *   authorize: (userId, channel) => canAccess(userId, channel),
 * })
 *
 * app.all('/_realtime/sse', (c) => sse.handle(c.req.raw))
 *
 * @example
 * // Standalone — no framework, no auth (development)
 * const sse = createSseHandler()
 * export default { fetch: (req) => sse.handle(req) }
 *
 * @example
 * // Server-initiated broadcast (e.g. from a TanStack Start server function)
 * const sse = createSseHandler({ getUser: validateToken })
 *
 * export const updateTodo = createServerFn()(async ({ id, data }) => {
 *   await db.todos.update(id, data)
 *   sse.broadcast(`todos:${data.projectId}`, { action: 'update', data })
 * })
 */
export function createSseHandler(options: SseHandlerOptions = {}): SseHandler {
  const {
    pingInterval = 30_000,
    getUser,
    authorize,
    onClientConnect,
    onClientDisconnect,
    onFirstSubscriber,
    onChannelEmpty,
  } = options

  const enc = new TextEncoder()

  // connectionId → ReadableStream controller
  const controllers = new Map<
    string,
    ReadableStreamDefaultController<Uint8Array>
  >()

  // channel → Set of connectionIds
  const channelSubs = new Map<string, Set<string>>()

  // connectionId → ping timer
  const pingTimers = new Map<string, ReturnType<typeof setInterval>>()

  // connectionId → userId (for lifecycle hooks)
  const connectionUserIds = new Map<string, string>()

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function sseChunk(event: ServerEvent): Uint8Array {
    return enc.encode(`data: ${JSON.stringify(event)}\n\n`)
  }

  function sendTo(connectionId: string, event: ServerEvent): void {
    const ctrl = controllers.get(connectionId)
    if (!ctrl) return
    try {
      ctrl.enqueue(sseChunk(event))
    } catch {
      // Controller already closed; clean up stale entry.
      cleanup(connectionId)
    }
  }

  function cleanup(connectionId: string): void {
    controllers.delete(connectionId)

    const timer = pingTimers.get(connectionId)
    if (timer !== undefined) {
      clearInterval(timer)
      pingTimers.delete(connectionId)
    }

    // Fire lifecycle: onClientDisconnect
    const userId = connectionUserIds.get(connectionId)
    connectionUserIds.delete(connectionId)
    if (userId && onClientDisconnect) {
      try {
        onClientDisconnect({ connectionId, userId })
      } catch (err) {
        console.error('[realtime:sse] onClientDisconnect error', err)
      }
    }

    for (const [channel, subs] of channelSubs) {
      subs.delete(connectionId)
      if (subs.size === 0) {
        channelSubs.delete(channel)
        // Fire lifecycle: onChannelEmpty
        if (onChannelEmpty) {
          try {
            onChannelEmpty(channel)
          } catch (err) {
            console.error('[realtime:sse] onChannelEmpty error', err)
          }
        }
      }
    }
  }

  /** Resolve the user from the request, or null if not authenticated. */
  async function resolveUser(req: Request): Promise<{ userId: string } | null> {
    if (!getUser) return { userId: 'anonymous' }
    const user = await getUser(req)
    return user ?? null
  }

  /** Check authorization for a channel action. Returns false to reject. */
  async function checkAuthorize(
    userId: string,
    action: 'subscribe' | 'publish',
    channel: string,
  ): Promise<boolean> {
    if (!authorize) return true

    const parsed = parseChannel(channel)
    const result = await authorize(userId, parsed)
    const perms = normalizePermissions(result)
    return perms[action]
  }

  // ---------------------------------------------------------------------------
  // GET — open SSE stream
  // ---------------------------------------------------------------------------

  async function handleGet(req: Request): Promise<Response> {
    const user = await resolveUser(req)
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const url = new URL(req.url)
    const connectionId =
      url.searchParams.get('connectionId') ?? crypto.randomUUID()

    let ctrl!: ReadableStreamDefaultController<Uint8Array>

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        ctrl = controller
        controllers.set(connectionId, ctrl)
        connectionUserIds.set(connectionId, user.userId)

        // Send the "connected" event so the client learns its connectionId.
        ctrl.enqueue(sseChunk({ type: 'connected', connectionId }))

        // Fire lifecycle: onClientConnect
        if (onClientConnect) {
          try {
            onClientConnect({ connectionId, userId: user.userId })
          } catch (err) {
            console.error('[realtime:sse] onClientConnect error', err)
          }
        }

        // Periodic pings to keep the connection alive through proxies.
        if (pingInterval > 0) {
          const timer = setInterval(() => {
            try {
              ctrl.enqueue(sseChunk({ type: 'ping' }))
            } catch {
              clearInterval(timer)
            }
          }, pingInterval)
          pingTimers.set(connectionId, timer)
        }
      },
      cancel() {
        cleanup(connectionId)
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        // Allow the client to read this from a different origin.
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  // ---------------------------------------------------------------------------
  // POST — client actions
  // ---------------------------------------------------------------------------

  async function handlePost(req: Request): Promise<Response> {
    const user = await resolveUser(req)
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    let body: ClientAction
    try {
      body = (await req.json()) as ClientAction
    } catch {
      return new Response('Bad Request', { status: 400 })
    }

    switch (body.action) {
      case 'subscribe': {
        const { connectionId, channel } = body
        const allowed = await checkAuthorize(user.userId, 'subscribe', channel)
        if (!allowed) {
          return new Response('Forbidden', { status: 403 })
        }
        const isFirst =
          !channelSubs.has(channel) || channelSubs.get(channel)!.size === 0
        if (!channelSubs.has(channel)) channelSubs.set(channel, new Set())
        channelSubs.get(channel)!.add(connectionId)
        // Fire lifecycle: onFirstSubscriber
        if (isFirst && onFirstSubscriber) {
          try {
            onFirstSubscriber(channel)
          } catch (err) {
            console.error('[realtime:sse] onFirstSubscriber error', err)
          }
        }
        return new Response(null, { status: 204 })
      }
      case 'unsubscribe': {
        // Always allow unsubscribes — they are cleanup operations and cannot
        // be used to exfiltrate data.
        const { connectionId, channel } = body
        channelSubs.get(channel)?.delete(connectionId)
        if (channelSubs.get(channel)?.size === 0) {
          channelSubs.delete(channel)
          // Fire lifecycle: onChannelEmpty
          if (onChannelEmpty) {
            try {
              onChannelEmpty(channel)
            } catch (err) {
              console.error('[realtime:sse] onChannelEmpty error', err)
            }
          }
        }
        return new Response(null, { status: 204 })
      }
      case 'publish': {
        const { channel, data } = body
        const allowed = await checkAuthorize(user.userId, 'publish', channel)
        if (!allowed) {
          return new Response('Forbidden', { status: 403 })
        }
        const event: ServerEvent = { type: 'message', channel, data }
        const subs = channelSubs.get(channel)
        if (subs) {
          for (const cid of subs) sendTo(cid, event)
        }
        return new Response(null, { status: 204 })
      }
      default:
        return new Response('Bad Request', { status: 400 })
    }
  }

  // ---------------------------------------------------------------------------
  // Public interface
  // ---------------------------------------------------------------------------

  return {
    async handle(req) {
      if (req.method === 'GET') return handleGet(req)
      if (req.method === 'POST') return handlePost(req)
      if (req.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        })
      }
      return new Response('Method Not Allowed', { status: 405 })
    },

    broadcast(channel, data) {
      const event: ServerEvent = { type: 'message', channel, data }
      const subs = channelSubs.get(channel)
      if (!subs) return
      for (const cid of subs) sendTo(cid, event)
    },

    connectionCount() {
      return controllers.size
    },

    createStream<TEvent = unknown>(opts: {
      channel: QueryKey | string
      hmacKey?: string
    }): ServerStream<TEvent> {
      const handler = this
      return createServerStream<TEvent>({
        publish: (ch, data) => {
          const serialized = typeof ch === 'string' ? ch : serializeKey(ch)
          handler.broadcast(serialized, data)
          return Promise.resolve()
        },
        channel: opts.channel,
        hmacKey: opts.hmacKey,
      })
    },
  }
}
