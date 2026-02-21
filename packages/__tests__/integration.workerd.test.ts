/**
 * Integration tests for @tanstack/realtime-preset-workerd.
 *
 * The workerd preset uses a different protocol from the Node preset:
 *   - One WebSocket per channel (not a single multiplexed connection)
 *   - Channel is part of the URL path: /_realtime/{encodedChannel}?token=...
 *   - Auth token passed as a query parameter (not a wire message)
 *   - Server sends `connected` immediately; no `subscribe` handshake
 *
 * Because Durable Objects only run inside the Cloudflare workerd runtime, we
 * test the client-side transport (`workerdTransport`) against a **minimal
 * external Node.js WebSocket server** that speaks the same wire protocol.
 * This validates the transport logic without requiring wrangler or miniflare.
 */

import { createServer } from 'http'
import type { IncomingMessage } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { randomBytes } from 'crypto'
import { createRealtimeClient } from '@tanstack/realtime'
import type { RealtimeClient, PresenceUser } from '@tanstack/realtime'
import { workerdTransport } from '@tanstack/realtime-preset-workerd'

// ---------------------------------------------------------------------------
// Minimal workerd-protocol test server
//
// Mirrors the RealtimeChannel Durable Object behaviour:
//   • One "room" per channel key (path segment after /_realtime/)
//   • Sends `{ type: 'connected', connectionId }` on upgrade
//   • Fans out `{ type: 'message', data }` on publish
//   • Maintains a presence set; broadcasts `{ type: 'presence:update', users }`
// ---------------------------------------------------------------------------

interface WorkerdConn {
  ws: WebSocket
  connectionId: string
  presenceData?: Record<string, unknown>
}

interface WorkerdRoom {
  conns: Map<string, WorkerdConn>
}

interface WorkerdTestServer {
  port: number
  teardown: () => Promise<void>
  /** Simulate server-side publish (like POST /_realtime/{channel}/publish). */
  publish: (channel: string, data: unknown) => void
  /** Force-close every open WebSocket (triggers client reconnect logic). */
  closeAllConnections: () => void
}

async function createWorkerdTestServer(
  authorize: (token: string | null, channel: string) => boolean = () => true,
): Promise<WorkerdTestServer> {
  const rooms = new Map<string, WorkerdRoom>()
  const allSockets = new Set<WebSocket>()

  function getRoom(channel: string): WorkerdRoom {
    let room = rooms.get(channel)
    if (!room) {
      room = { conns: new Map() }
      rooms.set(channel, room)
    }
    return room
  }

  function roomFanout(room: WorkerdRoom, msg: unknown): void {
    const raw = JSON.stringify(msg)
    for (const conn of room.conns.values()) {
      if (conn.ws.readyState === WebSocket.OPEN) conn.ws.send(raw)
    }
  }

  function broadcastPresence(room: WorkerdRoom): void {
    const users = [...room.conns.values()]
      .filter((c) => c.presenceData !== undefined)
      .map((c) => ({ connectionId: c.connectionId, data: c.presenceData }))
    roomFanout(room, { type: 'presence:update', users })
  }

  const httpServer = createServer()
  const wss = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', (req: IncomingMessage, socket, head) => {
    const url = new URL(req.url ?? '', 'http://localhost')
    const match = url.pathname.match(/^\/_realtime\/(.+)$/)
    if (!match) {
      socket.destroy()
      return
    }

    const channel = decodeURIComponent(match[1]!)
    const token = url.searchParams.get('token')

    if (!authorize(token, channel)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      const connectionId = randomBytes(4).toString('hex')
      const room = getRoom(channel)
      const conn: WorkerdConn = { ws, connectionId }
      room.conns.set(connectionId, conn)
      allSockets.add(ws)

      ws.send(JSON.stringify({ type: 'connected', connectionId }))

      ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString()) as Record<string, unknown>

        switch (msg.type) {
          case 'publish': {
            roomFanout(room, { type: 'message', data: msg.data })
            break
          }
          case 'presence:join': {
            conn.presenceData = msg.data as Record<string, unknown>
            broadcastPresence(room)
            break
          }
          case 'presence:update': {
            conn.presenceData = msg.data as Record<string, unknown>
            broadcastPresence(room)
            break
          }
          case 'presence:leave': {
            conn.presenceData = undefined
            broadcastPresence(room)
            break
          }
        }
      })

      ws.on('close', () => {
        room.conns.delete(connectionId)
        allSockets.delete(ws)
        broadcastPresence(room)
        if (room.conns.size === 0) rooms.delete(channel)
      })
    })
  })

  await new Promise<void>((resolve) => httpServer.listen(0, resolve))
  const port = (httpServer.address() as { port: number }).port

  return {
    port,

    publish(channel, data) {
      const room = rooms.get(channel)
      if (room) roomFanout(room, { type: 'message', data })
    },

    closeAllConnections() {
      for (const ws of allSockets) {
        ws.terminate()
      }
    },

    teardown: () =>
      new Promise<void>((resolve, reject) => {
        // Terminate all connections first so httpServer.close() can finish.
        for (const ws of allSockets) ws.terminate()
        wss.close()
        httpServer.close((err) => (err ? reject(err) : resolve()))
      }),
  }
}

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------

function connectClient(port: number): RealtimeClient {
  return createRealtimeClient({
    transport: workerdTransport({
      url: `ws://localhost:${port}`,
      retryDelay: 50,
      maxRetryDelay: 200,
    }),
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function nextMessage<T>(client: RealtimeClient, channel: string): Promise<T> {
  return new Promise((resolve) => {
    const unsub = client.subscribe(channel, (data) => {
      unsub()
      resolve(data as T)
    })
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('workerdTransport — subscribe & publish', () => {
  let server: WorkerdTestServer
  let client: RealtimeClient

  beforeEach(async () => {
    server = await createWorkerdTestServer()
    client = connectClient(server.port)
    await client.connect()
  })

  afterEach(async () => {
    client.disconnect()
    await server.teardown()
  })

  it('receives a message published by another client on the same channel', async () => {
    const channel = 'chat?roomId=1'
    const publisher = connectClient(server.port)
    await publisher.connect()

    const received = nextMessage<{ text: string }>(client, channel)
    await wait(80) // allow both WebSockets to complete the handshake
    await publisher.publish(channel, { text: 'hello' })

    await expect(received).resolves.toEqual({ text: 'hello' })
    publisher.disconnect()
  })

  it('does not receive messages from a different channel', async () => {
    const messages: unknown[] = []
    client.subscribe('chat?roomId=other', (d) => messages.push(d))
    await wait(80)

    server.publish('chat?roomId=1', { text: 'wrong channel' })
    await wait(50)

    expect(messages).toHaveLength(0)
  })

  it('multiple subscribers on the same channel all receive the message', async () => {
    const channel = 'broadcast?id=1'
    const results: unknown[] = []

    client.subscribe(channel, (d) => results.push(d))
    client.subscribe(channel, (d) => results.push(d))

    // Both subscriptions share one underlying WebSocket — wait for it to open.
    await wait(100)

    server.publish(channel, 'ping')
    await wait(50)

    expect(results).toHaveLength(2)
    expect(results).toEqual(['ping', 'ping'])
  })

  it('unsubscribing the last listener closes the channel WebSocket', async () => {
    const channel = 'ephemeral?id=1'
    const messages: unknown[] = []

    const unsub = client.subscribe(channel, (d) => messages.push(d))
    await wait(80)
    unsub()
    await wait(50)

    // Server publish after unsubscribe should not be delivered.
    server.publish(channel, 'after-unsub')
    await wait(50)

    expect(messages).toHaveLength(0)
  })

  it('each channel uses an independent WebSocket connection', async () => {
    const chA = 'room?id=a'
    const chB = 'room?id=b'
    const aMessages: unknown[] = []
    const bMessages: unknown[] = []

    client.subscribe(chA, (d) => aMessages.push(d))
    client.subscribe(chB, (d) => bMessages.push(d))
    await wait(100)

    server.publish(chA, 'A')
    server.publish(chB, 'B')
    await wait(50)

    expect(aMessages).toEqual(['A'])
    expect(bMessages).toEqual(['B'])
  })
})

describe('workerdTransport — presence', () => {
  let server: WorkerdTestServer
  let client1: RealtimeClient
  let client2: RealtimeClient

  beforeEach(async () => {
    server = await createWorkerdTestServer()
    client1 = connectClient(server.port)
    client2 = connectClient(server.port)
    await Promise.all([client1.connect(), client2.connect()])
  })

  afterEach(async () => {
    client1.disconnect()
    client2.disconnect()
    await server.teardown()
  })

  it('joinPresence adds the user to the presence snapshot', async () => {
    const channel = 'doc?id=1'
    const snapshots: Array<PresenceUser[]> = []

    client1.onPresenceChange(channel, (users) => snapshots.push(users))
    await wait(80)

    client1.joinPresence(channel, { name: 'Alice' })
    client2.joinPresence(channel, { name: 'Bob' })
    await wait(100)

    const last = snapshots.at(-1)!
    expect(last.some((u) => u.data.name === 'Bob')).toBe(true)
  })

  it('self is always excluded from the presence snapshot (others-only)', async () => {
    const channel = 'doc?id=self'
    const snapshots: Array<PresenceUser[]> = []

    client1.onPresenceChange(channel, (users) => snapshots.push(users))
    await wait(80)

    client1.joinPresence(channel, { name: 'Alice' })
    client2.joinPresence(channel, { name: 'Bob' })
    await wait(100)

    // Every snapshot client1 receives must never contain Alice (self).
    expect(snapshots.length).toBeGreaterThan(0)
    for (const snap of snapshots) {
      expect(snap.some((u) => u.data.name === 'Alice')).toBe(false)
    }
  })

  it('updatePresence propagates the new data', async () => {
    const channel = 'doc?id=update'
    const snapshots: Array<PresenceUser[]> = []

    client1.onPresenceChange(channel, (users) => snapshots.push(users))
    await wait(80)

    client2.joinPresence(channel, { cursor: null })
    await wait(50)

    client2.updatePresence(channel, { cursor: { x: 100, y: 200 } })
    await wait(50)

    const last = snapshots.at(-1)!
    expect(last[0]?.data.cursor).toEqual({ x: 100, y: 200 })
  })

  it('leavePresence removes the user from the snapshot', async () => {
    const channel = 'doc?id=leave'
    const snapshots: Array<PresenceUser[]> = []

    client1.onPresenceChange(channel, (users) => snapshots.push(users))
    await wait(80)

    client2.joinPresence(channel, { name: 'Bob' })
    await wait(50)
    client2.leavePresence(channel)
    await wait(50)

    const last = snapshots.at(-1)!
    expect(last.some((u) => u.data.name === 'Bob')).toBe(false)
  })

  it('presence snapshot is empty after all users leave', async () => {
    const channel = 'doc?id=empty'
    let latest: PresenceUser[] = []

    client1.onPresenceChange(channel, (users) => { latest = users })
    await wait(80)

    client1.joinPresence(channel, { name: 'Alice' })
    client2.joinPresence(channel, { name: 'Bob' })
    await wait(50)

    client1.leavePresence(channel)
    client2.leavePresence(channel)
    await wait(50)

    expect(latest).toHaveLength(0)
  })
})

describe('workerdTransport — auth', () => {
  it('rejects connections with an invalid token', async () => {
    const server = await createWorkerdTestServer(
      (token) => token === 'valid-token',
    )

    const client = createRealtimeClient({
      transport: workerdTransport({
        url: `ws://localhost:${server.port}`,
        getAuthToken: () => 'bad-token',
      }),
    })
    await client.connect()

    const messages: unknown[] = []
    client.subscribe('channel', (d) => messages.push(d))
    await wait(100)

    server.publish('channel', 'should-not-arrive')
    await wait(50)

    expect(messages).toHaveLength(0)
    client.disconnect()
    await server.teardown()
  })

  it('accepts connections with a valid token', async () => {
    const server = await createWorkerdTestServer(
      (token) => token === 'valid-token',
    )

    const client = createRealtimeClient({
      transport: workerdTransport({
        url: `ws://localhost:${server.port}`,
        getAuthToken: () => 'valid-token',
      }),
    })
    await client.connect()

    const messages: unknown[] = []
    client.subscribe('channel', (d) => messages.push(d))
    await wait(100) // allow WebSocket handshake to complete

    server.publish('channel', 'hello')
    await wait(50)

    expect(messages).toEqual(['hello'])
    client.disconnect()
    await server.teardown()
  })
})

describe('workerdTransport — reconnection', () => {
  it('reconnects after the server force-closes the WebSocket', async () => {
    const server = await createWorkerdTestServer()
    const client = connectClient(server.port)
    await client.connect()

    const messages: unknown[] = []
    client.subscribe('live?id=1', (d) => messages.push(d))
    await wait(100)

    // Verify initial delivery works.
    server.publish('live?id=1', 'before-disconnect')
    await wait(50)
    expect(messages).toEqual(['before-disconnect'])

    // Force-close all server-side sockets (simulates a DO eviction or restart).
    server.closeAllConnections()

    // The transport should reconnect within retryDelay (50ms) + handshake.
    await wait(300)

    server.publish('live?id=1', 'after-reconnect')
    await wait(100)

    expect(messages).toContain('after-reconnect')

    client.disconnect()
    await server.teardown()
  })
})
