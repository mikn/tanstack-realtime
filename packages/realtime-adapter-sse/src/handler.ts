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
}

export interface SseHandlerOptions {
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
   * Authorize a `subscribe` or `publish` action for an already-authenticated
   * user.
   *
   * Return `true` to allow, `false` to reject with **403 Forbidden**.
   * When omitted all authenticated users are permitted on all channels.
   *
   * Called **after** `getUser` succeeds, so `userId` is always set.
   * Unsubscribe actions are always allowed (they cannot be used to exfiltrate
   * data and must succeed to avoid subscription leaks).
   *
   * @example
   * authorize: async ({ userId, action, channel }) => {
   *   if (action === 'publish') {
   *     // Only channel owners may publish
   *     return db.isChannelOwner(userId, channel)
   *   }
   *   // All authenticated users may subscribe
   *   return true
   * }
   */
  authorize?: (params: {
    userId: string
    action: 'subscribe' | 'publish'
    channel: string
  }) => boolean | Promise<boolean>
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
 *   authorize: ({ userId, action, channel }) => canAccess(userId, channel),
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
  const { pingInterval = 30_000, getUser, authorize } = options

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

    for (const [channel, subs] of channelSubs) {
      subs.delete(connectionId)
      if (subs.size === 0) channelSubs.delete(channel)
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
    return authorize({ userId, action, channel })
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

        // Send the "connected" event so the client learns its connectionId.
        ctrl.enqueue(sseChunk({ type: 'connected', connectionId }))

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
        if (!channelSubs.has(channel)) channelSubs.set(channel, new Set())
        channelSubs.get(channel)!.add(connectionId)
        return new Response(null, { status: 204 })
      }
      case 'unsubscribe': {
        // Always allow unsubscribes — they are cleanup operations and cannot
        // be used to exfiltrate data.
        const { connectionId, channel } = body
        channelSubs.get(channel)?.delete(connectionId)
        if (channelSubs.get(channel)?.size === 0) channelSubs.delete(channel)
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
  }
}
