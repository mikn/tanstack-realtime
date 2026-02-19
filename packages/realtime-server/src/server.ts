import { WebSocketServer, WebSocket } from 'ws'
import type { IncomingMessage, Server } from 'http'
import { serializeKey } from '@tanstack/realtime-core'
import type {
  RealtimeAdapter,
  ClientMessage,
  ServerMessage,
  PresenceEvent,
  QueryKey,
} from './types.js'
import { memoryAdapter } from './adapters/memory.js'

// Re-export so consumers can import serializeKey from this package.
export { serializeKey }

export interface RealtimeServerOptions {
  /**
   * Called on each WebSocket upgrade request to authenticate the connection.
   * Return a user object (e.g. `{ userId }`) to allow, or `null` to reject.
   * This is a security boundary — always provide it in production.
   */
  authenticate: (req: IncomingMessage) => Promise<Record<string, unknown> | null>
  /** Adapter for multi-instance deployments. Defaults to the in-memory adapter. */
  adapter?: RealtimeAdapter
  /** WebSocket path. Defaults to `/_realtime`. */
  path?: string
}

interface ConnectionState {
  readonly connectionId: string
  readonly ws: WebSocket
  readonly user: Record<string, unknown>
  /** Serialized query keys this connection is subscribed to */
  readonly subscriptions: Set<string>
  /** Presence channels this connection has joined: channel key → presence data */
  readonly presenceChannels: Map<string, unknown>
}

// Presence channel state: serialized channel key → connectionId → data
type PresenceChannels = Map<string, Map<string, unknown>>

export interface RealtimeServer {
  /**
   * Publish an invalidation signal. All clients subscribed to keys matching
   * `key` (by prefix) will be asked to refetch.
   */
  publish(key: QueryKey): Promise<void>
  /**
   * Attach the WebSocket server to a running HTTP server.
   * Call this once during application startup, before the server starts
   * accepting connections.
   */
  attach(server: Server | { server?: Server; httpServer?: Server }): void
  /** Close all connections, drain presence state, and clean up. */
  close(): Promise<void>
}

/**
 * Deep structural equality. Used by `segmentMatches` to compare key segments
 * without serializing to JSON, which avoids redundant stringify calls.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    const arrB = b as unknown[]
    if (a.length !== arrB.length) return false
    return a.every((v, i) => deepEqual(v, arrB[i]))
  }
  const objA = a as Record<string, unknown>
  const objB = b as Record<string, unknown>
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)
  if (keysA.length !== keysB.length) return false
  return keysA.every((k) => k in objB && deepEqual(objA[k], objB[k]))
}

/**
 * Checks whether two key segments are compatible under TanStack Query's
 * prefix-match semantics.
 *
 * For plain-object segments the published object is treated as a subset:
 * every key it carries must exist with an equal value in the subscribed
 * object (the subscribed object may have additional keys).
 * For all other types strict deep equality is required.
 */
function segmentMatches(published: unknown, subscribed: unknown): boolean {
  if (deepEqual(published, subscribed)) return true
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
    return Object.keys(pub).every((k) => k in sub && deepEqual(pub[k], sub[k]))
  }
  return false
}

/**
 * Returns true when `publishedKey` (a serialized query-key array) should
 * invalidate `subscribedKey` under TanStack Query's prefix-match semantics.
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
    for (let i = 0; i < published.length; i++) {
      if (!segmentMatches(published[i]!, subscribed[i]!)) return false
    }
    return true
  } catch {
    return false
  }
}

function sendMessage(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

export function createRealtimeServer(
  options: RealtimeServerOptions,
): RealtimeServer {
  const { authenticate, path = '/_realtime' } = options

  const adapter: RealtimeAdapter = options.adapter ?? memoryAdapter()

  let wss: WebSocketServer | null = null
  let idCounter = 0

  // connectionId → state
  const connections = new Map<string, ConnectionState>()

  // serialized channel key → Map<connectionId, data>
  const presenceChannels: PresenceChannels = new Map()

  /**
   * Re-entrancy guard: true while we are synchronously publishing a local
   * presence event to the adapter. Used to suppress the adapter's echo-back
   * on single-instance deployments (the memory adapter fires callbacks
   * synchronously during publish). On multi-instance deployments (NATS, Redis)
   * the callback arrives asynchronously, so the guard is already false and
   * cross-instance events are processed normally.
   */
  let publishingPresenceLocally = false

  // Set up adapter subscriptions. Both promises must resolve before publish()
  // is safe to call, hence the combined Promise.all gate.
  const adapterReady = Promise.all([
    adapter.subscribe((serializedKey) => {
      fanOutInvalidation(serializedKey)
    }),
    adapter.subscribePresence((channel, event) => {
      // Skip events that we just published on this instance to avoid
      // delivering them twice (direct fan-out + adapter echo-back).
      if (publishingPresenceLocally) return
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
      if (!conn.presenceChannels.has(channel)) continue

      let msg: ServerMessage
      switch (event.type) {
        case 'join':
          msg = { type: 'presence:join', key: channel, connectionId: event.connectionId, data: event.data }
          break
        case 'update':
          msg = { type: 'presence:update', key: channel, connectionId: event.connectionId, data: event.data }
          break
        case 'leave':
          msg = { type: 'presence:leave', key: channel, connectionId: event.connectionId }
          break
        case 'sync':
          msg = { type: 'presence:sync', key: channel, users: event.users }
          break
      }
      sendMessage(conn.ws, msg)
    }
  }

  function publishPresenceLocal(
    channel: string,
    event: PresenceEvent,
    excludeConnectionId: string | null,
  ) {
    // Fan out immediately to local connections (excluding the sender).
    fanOutPresence(channel, event, excludeConnectionId)

    // Publish to the adapter for cross-instance delivery.
    // The re-entrancy guard suppresses the echo-back on single-instance
    // deployments where the adapter fires the callback synchronously.
    publishingPresenceLocally = true
    adapter.publishPresence(channel, event).catch((err) => {
      console.error('[realtime] presence publish error', err)
    }).finally(() => {
      publishingPresenceLocally = false
    })
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

        // Send the current roster to the joining connection.
        const currentUsers = Array.from(channelMap.entries())
          .filter(([id]) => id !== conn.connectionId)
          .map(([id, data]) => ({ connectionId: id, data }))
        sendMessage(conn.ws, {
          type: 'presence:sync',
          key: channel,
          users: currentUsers,
        })

        // Broadcast join to all other participants.
        const joinEvent: PresenceEvent = {
          type: 'join',
          connectionId: conn.connectionId,
          data: msg.data,
        }
        publishPresenceLocal(channel, joinEvent, conn.connectionId)
        break
      }

      case 'presence:update': {
        const channel = msg.key
        const channelMap = presenceChannels.get(channel)
        if (!channelMap) break

        // Merge the incoming delta into the stored full state.
        const existing = channelMap.get(conn.connectionId) ?? {}
        const merged =
          typeof existing === 'object' && existing !== null
            ? { ...(existing as Record<string, unknown>), ...(msg.data as Record<string, unknown>) }
            : msg.data
        channelMap.set(conn.connectionId, merged)
        conn.presenceChannels.set(channel, merged)

        const updateEvent: PresenceEvent = {
          type: 'update',
          connectionId: conn.connectionId,
          data: merged,
        }
        publishPresenceLocal(channel, updateEvent, conn.connectionId)
        break
      }

      case 'presence:leave': {
        handlePresenceLeave(conn, msg.key)
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
    publishPresenceLocal(channel, leaveEvent, conn.connectionId)
  }

  function handleDisconnect(conn: ConnectionState) {
    connections.delete(conn.connectionId)
    // Snapshot the keys first: handlePresenceLeave mutates conn.presenceChannels.
    for (const channel of Array.from(conn.presenceChannels.keys())) {
      handlePresenceLeave(conn, channel)
    }
  }

  function initWss(server: Server) {
    wss = new WebSocketServer({ server, path })

    wss.on('connection', async (ws, req) => {
      let user: Record<string, unknown>
      try {
        const result = await authenticate(req)
        if (result === null) {
          ws.close(4001, 'Unauthorized')
          return
        }
        user = result
      } catch {
        ws.close(4001, 'Authentication error')
        return
      }

      const connectionId = `${Date.now()}-${++idCounter}`
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
        // The 'close' event always follows 'error' on a WebSocket; let it
        // trigger the disconnect logic rather than doing it twice.
      })
    })
  }

  // Build the concrete object first (without a type annotation so TypeScript
  // does not apply excess-property checks). Assigning it to `RealtimeServer`
  // afterwards lets TypeScript verify that all required methods are present.
  const concrete = {
    // Exposed on the concrete object (not on the RealtimeServer interface)
    // for test infrastructure that needs direct socket access. Production
    // code should use the typed interface only.
    get wss() {
      return wss
    },

    async publish(key: QueryKey): Promise<void> {
      await adapterReady
      // Route through the adapter so that all instances (including this one)
      // receive the invalidation via the subscriber callback. The memory
      // adapter fires synchronously, so local connections are notified before
      // this method returns.
      await adapter.publish(serializeKey(key))
    },

    attach(
      serverOrNitro: Server | { server?: Server; httpServer?: Server },
    ): void {
      const candidate = serverOrNitro as {
        listen?: unknown
        on?: unknown
        server?: Server
        httpServer?: Server
      }
      let httpServer: Server | null = null

      if (
        typeof candidate.listen === 'function' &&
        typeof candidate.on === 'function'
      ) {
        httpServer = serverOrNitro as Server
      } else {
        httpServer = candidate.server ?? candidate.httpServer ?? null
      }

      if (!httpServer) {
        throw new Error(
          '[realtime] Could not find HTTP server to attach to. ' +
            'Pass the http.Server directly, or a Nitro/Vinxi instance ' +
            '(which exposes `.server` or `.httpServer`).',
        )
      }
      initWss(httpServer)
    },

    async close(): Promise<void> {
      // terminate() skips the closing handshake for an immediate shutdown.
      for (const conn of connections.values()) {
        conn.ws.terminate()
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

  // Widen to the public interface. TypeScript verifies all required methods
  // are present via assignability. The extra `wss` accessor is preserved on
  // the runtime object and is accessible via type assertion in test helpers.
  const server: RealtimeServer = concrete
  return server
}
