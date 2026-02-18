import { WebSocketServer, WebSocket } from 'ws'
import type { IncomingMessage, Server } from 'http'
import type {
  RealtimeAdapter,
  ClientMessage,
  ServerMessage,
  PresenceEvent,
} from './types.js'
import { memoryAdapter } from './adapters/memory.js'

export interface RealtimeServerOptions {
  /**
   * Called on each WebSocket upgrade request to authenticate the connection.
   * Return a user object (e.g. { userId }) to allow, or null to reject.
   */
  authenticate?: (
    req: IncomingMessage,
  ) => Promise<Record<string, unknown> | null>
  /** Adapter for multi-instance deployments. Defaults to in-memory. */
  adapter?: RealtimeAdapter
  /** WebSocket path. Defaults to '/_realtime' */
  path?: string
}

interface ConnectionState {
  connectionId: string
  ws: WebSocket
  user: Record<string, unknown> | null
  /** Set of serialized query keys this connection is subscribed to */
  subscriptions: Set<string>
  /** Map of presence channel key -> presence data */
  presenceChannels: Map<string, unknown>
}

// Presence channel state: channel key -> connectionId -> data
type PresenceChannels = Map<string, Map<string, unknown>>

let idCounter = 0
function generateId(): string {
  return `${Date.now()}-${++idCounter}`
}

function sendMessage(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

/**
 * Checks whether two key segments are compatible under TanStack Query's
 * prefix-match semantics. For object segments, the published object is
 * treated as a subset — all its keys must exist with equal values in the
 * subscribed object. For other types, equality is required.
 */
function segmentMatches(published: unknown, subscribed: unknown): boolean {
  if (JSON.stringify(published) === JSON.stringify(subscribed)) return true
  // Object subset: every key in the published object must equal the same key
  // in the subscribed object (subscribed may have additional keys).
  if (
    typeof published === 'object' &&
    published !== null &&
    !Array.isArray(published) &&
    typeof subscribed === 'object' &&
    subscribed !== null &&
    !Array.isArray(subscribed)
  ) {
    const pub = published as Record<string, unknown>
    const sub = subscribed as Record<string, unknown>
    return Object.keys(pub).every(
      (k) => k in sub && JSON.stringify(pub[k]) === JSON.stringify(sub[k]),
    )
  }
  return false
}

/**
 * Checks whether a published serialized key matches a subscriber's key.
 * Uses TanStack Query's prefix-match semantics: a published key invalidates
 * any subscriber whose key starts with the published key's segments.
 *
 * Both keys are JSON-serialized arrays. We parse both and check prefix.
 */
function keyMatchesSubscription(
  publishedKey: string,
  subscribedKey: string,
): boolean {
  if (publishedKey === subscribedKey) return true
  try {
    const published = JSON.parse(publishedKey) as unknown[]
    const subscribed = JSON.parse(subscribedKey) as unknown[]
    if (!Array.isArray(published) || !Array.isArray(subscribed)) return false
    if (published.length > subscribed.length) return false
    // Check that every segment of the published key matches the subscribed key
    for (let i = 0; i < published.length; i++) {
      if (!segmentMatches(published[i], subscribed[i])) return false
    }
    return true
  } catch {
    return false
  }
}

export interface RealtimeServer {
  /**
   * Publish an invalidation signal. All clients subscribed to matching keys
   * will receive an invalidate message.
   */
  publish(key: ReadonlyArray<unknown>): Promise<void>
  /**
   * Attach the WebSocket server to an existing HTTP server.
   * Call this once during application startup.
   */
  attach(server: Server | { server?: Server; httpServer?: Server }): void
  /** Close all connections and clean up. */
  close(): Promise<void>
  /** Returns a raw WebSocketServer for testing */
  readonly wss: WebSocketServer | null
}

export function createRealtimeServer(
  options: RealtimeServerOptions = {},
): RealtimeServer {
  const {
    authenticate = async () => ({}),
    path = '/_realtime',
  } = options

  const adapter: RealtimeAdapter = options.adapter ?? memoryAdapter()

  let wss: WebSocketServer | null = null

  // connectionId -> state
  const connections = new Map<string, ConnectionState>()

  // presence: serialized key -> Map<connectionId, data>
  const presenceChannels: PresenceChannels = new Map()

  // Set up adapter subscription
  const adapterReady = Promise.all([
    adapter.subscribe((serializedKey) => {
      fanOutInvalidation(serializedKey)
    }),
    adapter.subscribePresence((channel, event) => {
      fanOutPresence(channel, event, null)
    }),
  ])

  function fanOutInvalidation(serializedKey: string) {
    for (const conn of connections.values()) {
      for (const sub of conn.subscriptions) {
        if (keyMatchesSubscription(serializedKey, sub)) {
          sendMessage(conn.ws, { type: 'invalidate', key: sub })
        }
      }
    }
  }

  function fanOutPresence(
    channel: string,
    event: PresenceEvent,
    excludeConnectionId: string | null,
  ) {
    for (const conn of connections.values()) {
      if (conn.connectionId === excludeConnectionId) continue
      if (conn.presenceChannels.has(channel)) {
        const msg: ServerMessage =
          event.type === 'join'
            ? {
                type: 'presence:join',
                key: channel,
                connectionId: event.connectionId,
                data: event.data,
              }
            : event.type === 'update'
              ? {
                  type: 'presence:update',
                  key: channel,
                  connectionId: event.connectionId,
                  data: event.data,
                }
              : event.type === 'leave'
                ? {
                    type: 'presence:leave',
                    key: channel,
                    connectionId: event.connectionId,
                  }
                : {
                    type: 'presence:sync',
                    key: channel,
                    users: event.users ?? [],
                  }
        sendMessage(conn.ws, msg)
      }
    }
  }

  function handleConnection(ws: WebSocket, req: IncomingMessage) {
    // authenticate is called before this
  }

  function handleMessage(conn: ConnectionState, raw: string) {
    let msg: ClientMessage
    try {
      msg = JSON.parse(raw) as ClientMessage
    } catch {
      return
    }

    switch (msg.type) {
      case 'subscribe':
        conn.subscriptions.add(msg.key)
        break

      case 'unsubscribe':
        conn.subscriptions.delete(msg.key)
        break

      case 'presence:join': {
        const channel = msg.key
        let channelMap = presenceChannels.get(channel)
        if (!channelMap) {
          channelMap = new Map()
          presenceChannels.set(channel, channelMap)
        }
        channelMap.set(conn.connectionId, msg.data)
        conn.presenceChannels.set(channel, msg.data)

        // Send current presence state to the joining connection
        const currentUsers = Array.from(channelMap.entries())
          .filter(([id]) => id !== conn.connectionId)
          .map(([id, data]) => ({ connectionId: id, data }))
        sendMessage(conn.ws, {
          type: 'presence:sync',
          key: channel,
          users: currentUsers,
        })

        // Broadcast join to all other connections on this channel
        const joinEvent: PresenceEvent = {
          type: 'join',
          connectionId: conn.connectionId,
          data: msg.data,
        }
        fanOutPresence(channel, joinEvent, conn.connectionId)
        adapter
          .publishPresence(channel, joinEvent)
          .catch((err) => console.error('[realtime] presence publish error', err))
        break
      }

      case 'presence:update': {
        const channel = msg.key
        const channelMap = presenceChannels.get(channel)
        if (!channelMap) break
        // Merge update into existing data
        const existing = channelMap.get(conn.connectionId) ?? {}
        const merged =
          typeof existing === 'object' && existing !== null
            ? { ...(existing as object), ...(msg.data as object) }
            : msg.data
        channelMap.set(conn.connectionId, merged)
        conn.presenceChannels.set(channel, merged)

        const updateEvent: PresenceEvent = {
          type: 'update',
          connectionId: conn.connectionId,
          data: merged,
        }
        fanOutPresence(channel, updateEvent, conn.connectionId)
        adapter
          .publishPresence(channel, updateEvent)
          .catch((err) => console.error('[realtime] presence publish error', err))
        break
      }

      case 'presence:leave': {
        const channel = msg.key
        handlePresenceLeave(conn, channel)
        break
      }
    }
  }

  function handlePresenceLeave(conn: ConnectionState, channel: string) {
    const channelMap = presenceChannels.get(channel)
    if (!channelMap) return
    channelMap.delete(conn.connectionId)
    conn.presenceChannels.delete(channel)
    if (channelMap.size === 0) {
      presenceChannels.delete(channel)
    }

    const leaveEvent: PresenceEvent = {
      type: 'leave',
      connectionId: conn.connectionId,
    }
    fanOutPresence(channel, leaveEvent, conn.connectionId)
    adapter
      .publishPresence(channel, leaveEvent)
      .catch((err) => console.error('[realtime] presence publish error', err))
  }

  function handleDisconnect(conn: ConnectionState) {
    connections.delete(conn.connectionId)
    // Broadcast leave to all presence channels
    for (const channel of conn.presenceChannels.keys()) {
      handlePresenceLeave(conn, channel)
    }
  }

  function initWss(server: Server) {
    wss = new WebSocketServer({ server, path })

    wss.on('connection', async (ws, req) => {
      // Authenticate
      let user: Record<string, unknown> | null = null
      try {
        user = await authenticate(req)
      } catch {
        ws.close(4001, 'Authentication error')
        return
      }
      if (user === null) {
        ws.close(4001, 'Unauthorized')
        return
      }

      const connectionId = generateId()
      const conn: ConnectionState = {
        connectionId,
        ws,
        user,
        subscriptions: new Set(),
        presenceChannels: new Map(),
      }
      connections.set(connectionId, conn)

      ws.on('message', (data) => {
        handleMessage(conn, data.toString())
      })

      ws.on('close', () => {
        handleDisconnect(conn)
      })

      ws.on('error', () => {
        handleDisconnect(conn)
      })
    })
  }

  return {
    get wss() {
      return wss
    },

    async publish(key: ReadonlyArray<unknown>): Promise<void> {
      await adapterReady
      const serializedKey = serializeKey(key)
      // Route through the adapter so multi-instance deployments work correctly.
      // The adapter's subscribe callback (set up in adapterReady) will call
      // fanOutInvalidation for all instances including this one.
      await adapter.publish(serializedKey)
    },

    attach(
      serverOrNitro: Server | { server?: Server; httpServer?: Server },
    ): void {
      // Support raw http.Server and Nitro/framework wrapper objects.
      const candidate: any = serverOrNitro
      let httpServer: Server | null = null

      if (typeof candidate.listen === 'function' && typeof candidate.on === 'function') {
        // Passed a raw Node.js http.Server (or compatible)
        httpServer = candidate as Server
      } else if (candidate.server != null) {
        httpServer = candidate.server as Server
      } else if (candidate.httpServer != null) {
        httpServer = candidate.httpServer as Server
      }

      if (!httpServer) {
        throw new Error(
          '[realtime] Could not find HTTP server to attach to. Pass the http.Server directly or a Nitro instance.',
        )
      }
      initWss(httpServer)
    },

    async close(): Promise<void> {
      for (const conn of connections.values()) {
        conn.ws.close()
      }
      connections.clear()
      presenceChannels.clear()
      await new Promise<void>((resolve) => {
        if (wss) {
          wss.close(() => resolve())
        } else {
          resolve()
        }
      })
      await adapter.close()
    },
  }
}

/**
 * Serialize a query key using deterministic JSON with sorted object keys.
 * Mirrors TanStack Query's hashKey behavior.
 */
export function serializeKey(key: ReadonlyArray<unknown>): string {
  return JSON.stringify(key, (_, val) => {
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      return Object.fromEntries(
        Object.entries(val as Record<string, unknown>).sort(([a], [b]) =>
          a.localeCompare(b),
        ),
      )
    }
    return val
  })
}
