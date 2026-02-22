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
  handle(req: Request): Promise<Response>

  /**
   * Push a message to all connections subscribed to `channel`.
   * Useful for server-initiated broadcasts (e.g. from a database trigger).
   */
  broadcast(channel: string, data: unknown): void

  /**
   * Return the current number of active SSE connections.
   * Useful for health checks and tests.
   */
  connectionCount(): number
}

export interface SseHandlerOptions {
  /**
   * Interval in milliseconds for sending SSE keep-alive pings.
   * Set to `0` to disable pings.
   * @default 30_000
   */
  pingInterval?: number
}

// ---------------------------------------------------------------------------
// createSseHandler
// ---------------------------------------------------------------------------

/**
 * Creates a Fetch-API–compatible SSE handler.
 *
 * Mount it on a route in any edge/serverless runtime that speaks the Fetch API
 * (Cloudflare Workers, Deno, Bun, Next.js Edge Routes, etc.) as well as
 * Node.js (via a thin adapter).
 *
 * @example
 * // Cloudflare Worker / Hono
 * const sse = createSseHandler()
 *
 * app.all('/_realtime/sse', (c) => sse.handle(c.req.raw))
 *
 * @example
 * // Standalone — no framework
 * const sse = createSseHandler()
 * export default { fetch: (req) => sse.handle(req) }
 */
export function createSseHandler(options: SseHandlerOptions = {}): SseHandler {
  const { pingInterval = 30_000 } = options

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

  // ---------------------------------------------------------------------------
  // GET — open SSE stream
  // ---------------------------------------------------------------------------

  function handleGet(req: Request): Response {
    const url = new URL(req.url)
    const connectionId =
      url.searchParams.get('connectionId') ?? crypto.randomUUID()

    let ctrl!: ReadableStreamDefaultController<Uint8Array>

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        ctrl = controller
        controllers.set(connectionId, ctrl)

        // Send the "connected" event so the client learns its connectionId.
        ctrl.enqueue(
          sseChunk({ type: 'connected', connectionId }),
        )

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
    let body: ClientAction
    try {
      body = (await req.json()) as ClientAction
    } catch {
      return new Response('Bad Request', { status: 400 })
    }

    switch (body.action) {
      case 'subscribe': {
        const { connectionId, channel } = body
        if (!channelSubs.has(channel)) channelSubs.set(channel, new Set())
        channelSubs.get(channel)!.add(connectionId)
        return new Response(null, { status: 204 })
      }
      case 'unsubscribe': {
        const { connectionId, channel } = body
        channelSubs.get(channel)?.delete(connectionId)
        if (channelSubs.get(channel)?.size === 0) channelSubs.delete(channel)
        return new Response(null, { status: 204 })
      }
      case 'publish': {
        const { channel, data } = body
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
