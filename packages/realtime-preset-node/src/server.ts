import { WebSocketServer, WebSocket } from 'ws'
import { randomBytes } from 'crypto'
import type { IncomingMessage, Server } from 'http'
import { parseChannel } from '@tanstack/realtime'
import type { ChannelPermissions } from '@tanstack/realtime/server'
import type { ParsedChannel, PresenceUser } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Wire protocol
// ---------------------------------------------------------------------------

type ClientMsg =
  | { type: 'subscribe'; channel: string }
  | { type: 'unsubscribe'; channel: string }
  | { type: 'publish'; channel: string; data: unknown }
  | { type: 'presence:join'; channel: string; data: unknown }
  | { type: 'presence:update'; channel: string; data: unknown }
  | { type: 'presence:leave'; channel: string }

type ServerMsg =
  | { type: 'subscribe:ok'; channel: string }
  | { type: 'subscribe:error'; channel: string; code: number; reason: string }
  | { type: 'message'; channel: string; data: unknown }
  | { type: 'presence:update'; channel: string; users: ReadonlyArray<PresenceUser> }

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface NodeServerOptions {
  /**
   * Extract the authenticated user from the HTTP upgrade request.
   * Return `{ userId: string }` to allow, or `null` to reject.
   */
  getUser: (req: IncomingMessage) => Promise<{ userId: string } | null>
  /**
   * Called for each channel operation to check permissions.
   * Identical to the authorize function used in production presets
   * so that local dev and production share the same auth logic.
   */
  authorize: (userId: string, channel: ParsedChannel) => Promise<ChannelPermissions>
  /** WebSocket path. Defaults to `/_realtime`. */
  path?: string
}

export interface NodeServer {
  /** Attach to a running HTTP server. Call once during startup. */
  attach(server: Server): void
  /**
   * Publish data to a channel from server code (e.g. server functions).
   * Sends to all subscribers with `subscribe: true` for this channel.
   */
  publish(channel: string, data: unknown): void
  /** Close all connections and shut down. */
  close(): Promise<void>
}

// ---------------------------------------------------------------------------
// Internal connection state
// ---------------------------------------------------------------------------

interface ConnectionState {
  readonly connectionId: string
  readonly ws: WebSocket
  readonly userId: string
  /** channel → permissions */
  readonly authorizedChannels: Map<string, ChannelPermissions>
  /** presence channels this connection has joined: channel → data */
  readonly presenceChannels: Map<string, unknown>
}

// channel → Map<connectionId, data>
type PresenceChannels = Map<string, Map<string, unknown>>

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates an in-process WebSocket server for local development and export.
 *
 * - No external infrastructure required.
 * - Authorization calls `authorize` directly on each channel subscribe.
 * - Presence is managed in-memory.
 * - Scales to a single process (ideal for local dev + exported apps).
 *
 * @example
 * // server/realtime.ts
 * import { createNodeServer } from '@tanstack/realtime-preset-node'
 * import { authorize } from './realtime.auth'
 *
 * export const nodeServer = createNodeServer({
 *   getUser: async (req) => {
 *     const session = await getSession(req)
 *     return session ? { userId: session.userId } : null
 *   },
 *   authorize,
 * })
 *
 * // In your HTTP server setup:
 * nodeServer.attach(httpServer)
 */
export function createNodeServer(options: NodeServerOptions): NodeServer {
  const { getUser, authorize, path = '/_realtime' } = options

  let wss: WebSocketServer | null = null
  const connections = new Map<string, ConnectionState>()
  const presenceChannels: PresenceChannels = new Map()

  function sendTo(ws: WebSocket, msg: ServerMsg) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
    }
  }

  function fanOut(channel: string, data: unknown, excludeConnectionId?: string) {
    for (const conn of connections.values()) {
      if (conn.connectionId === excludeConnectionId) continue
      const perms = conn.authorizedChannels.get(channel)
      if (perms?.subscribe) {
        sendTo(conn.ws, { type: 'message', channel, data })
      }
    }
  }

  function broadcastPresence(channel: string) {
    const channelMap = presenceChannels.get(channel)
    if (!channelMap) return
    const users: PresenceUser[] = Array.from(channelMap.entries()).map(
      ([connectionId, data]) => ({ connectionId, data }),
    )
    for (const conn of connections.values()) {
      if (conn.presenceChannels.has(channel)) {
        sendTo(conn.ws, { type: 'presence:update', channel, users })
      }
    }
  }

  function handlePresenceLeave(conn: ConnectionState, channel: string) {
    conn.presenceChannels.delete(channel)
    const channelMap = presenceChannels.get(channel)
    if (!channelMap) return
    channelMap.delete(conn.connectionId)
    if (channelMap.size === 0) presenceChannels.delete(channel)
    else broadcastPresence(channel)
  }

  function handleDisconnect(conn: ConnectionState) {
    connections.delete(conn.connectionId)
    for (const channel of Array.from(conn.presenceChannels.keys())) {
      handlePresenceLeave(conn, channel)
    }
  }

  async function handleMessage(conn: ConnectionState, raw: string) {
    let msg: ClientMsg
    try {
      msg = JSON.parse(raw) as ClientMsg
    } catch {
      return
    }

    switch (msg.type) {
      case 'subscribe': {
        const parsed = parseChannel(msg.channel)
        const perms = await authorize(conn.userId, parsed)
        if (!perms.subscribe) {
          sendTo(conn.ws, {
            type: 'subscribe:error',
            channel: msg.channel,
            code: 4403,
            reason: 'unauthorized',
          })
          return
        }
        conn.authorizedChannels.set(msg.channel, perms)
        sendTo(conn.ws, { type: 'subscribe:ok', channel: msg.channel })
        break
      }

      case 'unsubscribe': {
        conn.authorizedChannels.delete(msg.channel)
        break
      }

      case 'publish': {
        const perms = conn.authorizedChannels.get(msg.channel)
        if (!perms?.publish) return
        fanOut(msg.channel, msg.data, conn.connectionId)
        break
      }

      case 'presence:join': {
        const perms = conn.authorizedChannels.get(msg.channel)
        if (!perms?.presence) return
        let channelMap = presenceChannels.get(msg.channel)
        if (!channelMap) {
          channelMap = new Map()
          presenceChannels.set(msg.channel, channelMap)
        }
        channelMap.set(conn.connectionId, msg.data)
        conn.presenceChannels.set(msg.channel, msg.data)
        broadcastPresence(msg.channel)
        break
      }

      case 'presence:update': {
        const perms = conn.authorizedChannels.get(msg.channel)
        if (!perms?.presence) return
        const channelMap = presenceChannels.get(msg.channel)
        if (!channelMap) return
        // Merge delta into stored state
        const existing = channelMap.get(conn.connectionId) ?? {}
        const merged =
          typeof existing === 'object' && existing !== null
            ? { ...(existing as Record<string, unknown>), ...(msg.data as Record<string, unknown>) }
            : msg.data
        channelMap.set(conn.connectionId, merged)
        conn.presenceChannels.set(msg.channel, merged)
        broadcastPresence(msg.channel)
        break
      }

      case 'presence:leave': {
        handlePresenceLeave(conn, msg.channel)
        break
      }
    }
  }

  const server: NodeServer = {
    attach(httpServer: Server) {
      wss = new WebSocketServer({ server: httpServer, path })

      wss.on('connection', async (ws, req) => {
        let userInfo: { userId: string }
        try {
          const result = await getUser(req)
          if (!result) {
            ws.close(4001, 'Unauthorized')
            return
          }
          userInfo = result
        } catch {
          ws.close(4001, 'Authentication error')
          return
        }

        const connectionId = `${Date.now()}-${randomBytes(4).toString('hex')}`
        const conn: ConnectionState = {
          connectionId,
          ws,
          userId: userInfo.userId,
          authorizedChannels: new Map(),
          presenceChannels: new Map(),
        }
        connections.set(connectionId, conn)

        ws.on('message', (data) => {
          handleMessage(conn, data.toString()).catch((err) => {
            console.error('[realtime:node] message handler error', err)
          })
        })

        ws.on('close', () => handleDisconnect(conn))
        ws.on('error', () => {
          // 'close' always follows 'error' — let it handle the cleanup.
        })
      })
    },

    publish(channel: string, data: unknown) {
      fanOut(channel, data)
    },

    async close(): Promise<void> {
      for (const conn of connections.values()) {
        conn.ws.terminate()
      }
      connections.clear()
      presenceChannels.clear()
      await new Promise<void>((resolve) => {
        if (wss) wss.close(() => resolve())
        else resolve()
      })
    },
  }

  return server
}
