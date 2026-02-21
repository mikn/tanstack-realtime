import type { ChannelPermissions } from './types.js'

interface ConnectionMeta {
  connectionId: string
  permissions: ChannelPermissions
  presenceData?: Record<string, unknown>
}

/**
 * Durable Object that manages all WebSocket connections for a **single channel**.
 *
 * Each channel key (e.g. `todos?teamId=123`) maps to its own `RealtimeChannel`
 * instance — this is the "granular key" pattern that avoids a single contention
 * ceiling. Cloudflare hibernates idle DO instances automatically, so you only
 * pay for active channels.
 *
 * ## Usage in your Worker
 *
 * ```ts
 * // worker.ts
 * export { RealtimeChannel } from '@tanstack/realtime-preset-workerd'
 * export { createWorkerdHandler } from '@tanstack/realtime-preset-workerd'
 * ```
 *
 * ```toml
 * # wrangler.toml
 * [[durable_objects.bindings]]
 * name = "REALTIME_CHANNEL"
 * class_name = "RealtimeChannel"
 *
 * [[migrations]]
 * tag = "v1"
 * new_classes = ["RealtimeChannel"]
 * ```
 *
 * Auth is enforced by the Worker handler before the WebSocket is forwarded
 * here — the DO trusts the `X-Realtime-Connection-Id` and
 * `X-Realtime-Permissions` headers injected by {@link createWorkerdHandler}.
 * Do **not** expose the DO's URL directly to clients.
 */
export class RealtimeChannel {
  private readonly ctx: DurableObjectState

  constructor(ctx: DurableObjectState) {
    this.ctx = ctx
  }

  async fetch(request: Request): Promise<Response> {
    // ── WebSocket upgrade ──────────────────────────────────────────────────
    if (request.headers.get('Upgrade') === 'websocket') {
      const connectionId =
        request.headers.get('X-Realtime-Connection-Id') ?? crypto.randomUUID()

      const rawPerms = request.headers.get('X-Realtime-Permissions')
      const permissions: ChannelPermissions = rawPerms
        ? (JSON.parse(rawPerms) as ChannelPermissions)
        : { subscribe: false, publish: false, presence: false }

      const pair = new WebSocketPair()
      // Object.values order is guaranteed for integer-keyed properties
      const [client, server] = Object.values(pair)

      // Hibernatable WebSocket API — the DO can be evicted between messages.
      // Tag by connectionId so we can target individual sockets if needed.
      this.ctx.acceptWebSocket(server, [connectionId])

      // Persist metadata through hibernation cycles.
      server.serializeAttachment({
        connectionId,
        permissions,
      } satisfies ConnectionMeta)

      server.send(JSON.stringify({ type: 'connected', connectionId }))

      return new Response(null, { status: 101, webSocket: client })
    }

    // ── HTTP publish (server-side push) ────────────────────────────────────
    if (request.method === 'POST') {
      const body = (await request.json()) as { data: unknown }
      this.fanout(JSON.stringify({ type: 'message', data: body.data }))
      return new Response('OK', { status: 200 })
    }

    return new Response('Not found', { status: 404 })
  }

  async webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer,
  ): Promise<void> {
    if (typeof message !== 'string') return

    const msg = JSON.parse(message) as Record<string, unknown>
    const meta = ws.deserializeAttachment() as ConnectionMeta

    switch (msg.type) {
      case 'publish': {
        if (!meta.permissions.publish) {
          ws.send(
            JSON.stringify({ type: 'error', message: 'Not authorized to publish' }),
          )
          return
        }
        this.fanout(JSON.stringify({ type: 'message', data: msg.data }))
        break
      }

      case 'presence:join': {
        if (!meta.permissions.presence) return
        ws.serializeAttachment({
          ...meta,
          presenceData: msg.data as Record<string, unknown>,
        })
        this.broadcastPresence()
        break
      }

      case 'presence:update': {
        if (!meta.permissions.presence) return
        ws.serializeAttachment({
          ...meta,
          presenceData: msg.data as Record<string, unknown>,
        })
        this.broadcastPresence()
        break
      }

      case 'presence:leave': {
        ws.serializeAttachment({ ...meta, presenceData: undefined })
        this.broadcastPresence()
        break
      }
    }
  }

  async webSocketClose(_ws: WebSocket): Promise<void> {
    // Presence snapshot is recalculated from the remaining live sockets.
    this.broadcastPresence()
  }

  async webSocketError(_ws: WebSocket): Promise<void> {
    this.broadcastPresence()
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /** Send a pre-serialized message to every connected socket. */
  private fanout(msg: string): void {
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(msg)
      } catch {
        // Socket may have closed between getWebSockets() and send().
      }
    }
  }

  /**
   * Build the current presence snapshot from hibernation-safe attachment data
   * and broadcast it to every connected socket.
   *
   * Only connections that have called `presence:join` (i.e. have `presenceData`
   * set) appear in the snapshot.
   */
  private broadcastPresence(): void {
    const users = this.ctx
      .getWebSockets()
      .map((ws) => {
        const meta = ws.deserializeAttachment() as ConnectionMeta
        return meta.presenceData !== undefined
          ? { connectionId: meta.connectionId, data: meta.presenceData }
          : null
      })
      .filter((u): u is NonNullable<typeof u> => u !== null)

    this.fanout(JSON.stringify({ type: 'presence:update', users }))
  }
}
