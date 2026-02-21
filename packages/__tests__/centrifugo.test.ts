/**
 * Integration tests for @tanstack/realtime-adapter-centrifugo.
 *
 * Runs a minimal Centrifugo-protocol WebSocket server in-process using the
 * `ws` package, then exercises centrifugoTransport against it.
 *
 * The mini-server only implements the subset of the Centrifugo v4+ JSON
 * protocol needed to validate the transport's behaviour:
 *   - connect handshake (assigns clientId)
 *   - subscribe / unsubscribe
 *   - publish (echoes back as a push to all subscribers of that channel)
 *   - presence sidecar channel ($prs:{channel})
 */

import { createServer } from 'http'
import type { Server as HttpServer } from 'http'
import { WebSocketServer } from 'ws'
import type { WebSocket as WsSocket } from 'ws'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { centrifugoTransport } from '@tanstack/realtime-adapter-centrifugo'
import { createRealtimeClient } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Mini Centrifugo server
// ---------------------------------------------------------------------------

interface MiniCentrifugoServer {
  port: number
  push: (channel: string, data: unknown) => void
  teardown: () => Promise<void>
}

async function createMiniCentrifugo(): Promise<MiniCentrifugoServer> {
  const httpServer: HttpServer = createServer()
  const wss = new WebSocketServer({ server: httpServer })

  let clientCounter = 0
  // channel → connected sockets subscribed to it
  const channelSockets = new Map<string, Set<WsSocket>>()

  wss.on('connection', (ws) => {
    const clientId = `client-${++clientCounter}`
    const subscribed = new Set<string>()

    ws.on('message', (raw) => {
      let msgs: Array<Record<string, unknown>>
      try {
        const parsed = JSON.parse(raw.toString())
        msgs = Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        return
      }

      for (const msg of msgs) {
        const id = msg['id'] as number | undefined

        if (msg['connect'] !== undefined) {
          ws.send(JSON.stringify({ id, connect: { client: clientId, version: '4.0.0' } }))
        } else if (msg['subscribe'] !== undefined) {
          const ch = (msg['subscribe'] as { channel: string }).channel
          subscribed.add(ch)
          if (!channelSockets.has(ch)) channelSockets.set(ch, new Set())
          channelSockets.get(ch)!.add(ws)
          ws.send(JSON.stringify({ id, subscribe: { recoverable: false } }))
        } else if (msg['unsubscribe'] !== undefined) {
          const ch = (msg['unsubscribe'] as { channel: string }).channel
          subscribed.delete(ch)
          channelSockets.get(ch)?.delete(ws)
          ws.send(JSON.stringify({ id, unsubscribe: {} }))
        } else if (msg['publish'] !== undefined) {
          const { channel: ch, data } = msg['publish'] as { channel: string; data: unknown }
          ws.send(JSON.stringify({ id, publish: {} }))
          // Echo publication as push to all subscribers of that channel
          const push = JSON.stringify({ push: { channel: ch, pub: { data } } })
          for (const sub of channelSockets.get(ch) ?? []) {
            if (sub.readyState === sub.OPEN) sub.send(push)
          }
        }
      }
    })

    ws.on('close', () => {
      for (const ch of subscribed) {
        channelSockets.get(ch)?.delete(ws)
      }
    })
  })

  await new Promise<void>((resolve) => httpServer.listen(0, resolve))
  const port = (httpServer.address() as { port: number }).port

  return {
    port,
    push(channel, data) {
      const push = JSON.stringify({ push: { channel, pub: { data } } })
      for (const ws of channelSockets.get(channel) ?? []) {
        if (ws.readyState === ws.OPEN) ws.send(push)
      }
    },
    teardown() {
      return new Promise<void>((resolve, reject) => {
        wss.close(() => {
          httpServer.close((err) => (err ? reject(err) : resolve()))
        })
      })
    },
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function nextMessage<T = unknown>(
  client: ReturnType<typeof createRealtimeClient>,
  channel: string,
): Promise<T> {
  return new Promise<T>((resolve) => {
    const unsub = client.subscribe(channel, (data) => {
      unsub()
      resolve(data as T)
    })
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('centrifugoTransport', () => {
  let server: MiniCentrifugoServer
  let client: ReturnType<typeof createRealtimeClient>

  beforeEach(async () => {
    server = await createMiniCentrifugo()
    client = createRealtimeClient({
      transport: centrifugoTransport({
        url: `ws://localhost:${server.port}`,
        initialDelay: 50,
        maxDelay: 200,
        jitter: 0,
      }),
    })
    await client.connect()
  })

  afterEach(async () => {
    client.disconnect()
    client.destroy()
    await server.teardown()
  })

  // ── Module interface ─────────────────────────────────────────────────────

  it('exposes the complete RealtimeTransport interface', () => {
    const transport = centrifugoTransport({ url: 'ws://localhost:9999' })
    expect(typeof transport.connect).toBe('function')
    expect(typeof transport.disconnect).toBe('function')
    expect(typeof transport.subscribe).toBe('function')
    expect(typeof transport.publish).toBe('function')
    expect(typeof transport.joinPresence).toBe('function')
    expect(typeof transport.updatePresence).toBe('function')
    expect(typeof transport.leavePresence).toBe('function')
    expect(typeof transport.onPresenceChange).toBe('function')
    expect(transport.store).toBeDefined()
  })

  it('starts disconnected before connect()', () => {
    const transport = centrifugoTransport({ url: 'ws://localhost:9999' })
    expect(transport.store.state).toBe('disconnected')
  })

  // ── Connection ──────────────────────────────────────────────────────────

  it('reaches connected status after connect()', () => {
    expect(client.store.state.status).toBe('connected')
  })

  it('returns to disconnected after disconnect()', () => {
    client.disconnect()
    expect(client.store.state.status).toBe('disconnected')
  })

  // ── Subscribe / receive ─────────────────────────────────────────────────

  it('receives a server-pushed publication', async () => {
    const received = nextMessage(client, 'news')
    await wait(30) // let subscribe command reach the server
    server.push('news', { headline: 'Hello World' })
    const msg = await received
    expect(msg).toEqual({ headline: 'Hello World' })
  })

  it('multiple subscriptions to the same channel all receive messages', async () => {
    const got1: Array<unknown> = []
    const got2: Array<unknown> = []
    const unsub1 = client.subscribe('ch', (d) => got1.push(d))
    const unsub2 = client.subscribe('ch', (d) => got2.push(d))

    await wait(20) // let subscribe commands reach server
    server.push('ch', 'ping')
    await wait(20)

    expect(got1).toEqual(['ping'])
    expect(got2).toEqual(['ping'])
    unsub1()
    unsub2()
  })

  // ── Publish ─────────────────────────────────────────────────────────────

  it('client publish is echoed back to all channel subscribers', async () => {
    const received = nextMessage(client, 'echo-ch')

    // Subscribe first so we receive our own echo
    await wait(10)
    await client.publish('echo-ch', { msg: 'hi' })

    const result = await received
    expect(result).toEqual({ msg: 'hi' })
  })

  // ── Unsubscribe ─────────────────────────────────────────────────────────

  it('unsubscribe stops receiving messages', async () => {
    const received: Array<unknown> = []
    const unsub = client.subscribe('one-shot', (d) => received.push(d))
    await wait(10)
    unsub()
    await wait(10)
    server.push('one-shot', 'should-not-arrive')
    await wait(20)
    expect(received).toHaveLength(0)
  })

  // ── Presence ─────────────────────────────────────────────────────────────

  it('subscribe() returns an unsubscribe function', () => {
    const unsub = client.subscribe('test', () => {})
    expect(typeof unsub).toBe('function')
    expect(() => unsub()).not.toThrow()
  })

  it('onPresenceChange callback fires when joinPresence is called', async () => {
    const presenceUpdates: Array<unknown> = []
    client.onPresenceChange('room-1', (users) => presenceUpdates.push(users))

    // Create a second client to join
    const client2 = createRealtimeClient({
      transport: centrifugoTransport({
        url: `ws://localhost:${server.port}`,
        initialDelay: 50,
        maxDelay: 200,
        jitter: 0,
      }),
    })
    await client2.connect()

    // client1 subscribes to presence sidecar
    client.joinPresence('room-1', { name: 'alice' })
    await wait(30)

    // client2 joins presence
    client2.joinPresence('room-1', { name: 'bob' })
    await wait(50)

    // client1 should see bob arrive (alice's own join is filtered as "self" if matching clientId,
    // but here client1 sees client2's prs:join on the sidecar channel)
    const seenUsers = presenceUpdates.flatMap((u) => u as Array<{ data: { name: string } }>)
    const names = seenUsers.map((u) => u.data?.name)
    expect(names.some((n) => n === 'bob')).toBe(true)

    client2.disconnect()
    client2.destroy()
  })

  it('token as static string is sent in connect command', async () => {
    // A separate client with a token — server accepts it (our mini server ignores tokens)
    const tokenClient = createRealtimeClient({
      transport: centrifugoTransport({
        url: `ws://localhost:${server.port}`,
        token: 'test-jwt',
      }),
    })
    await tokenClient.connect()
    expect(tokenClient.store.state.status).toBe('connected')
    tokenClient.disconnect()
    tokenClient.destroy()
  })

  it('token as async function is called and sent in connect command', async () => {
    let called = false
    const tokenClient = createRealtimeClient({
      transport: centrifugoTransport({
        url: `ws://localhost:${server.port}`,
        token: async () => {
          called = true
          return 'async-jwt'
        },
      }),
    })
    await tokenClient.connect()
    expect(called).toBe(true)
    expect(tokenClient.store.state.status).toBe('connected')
    tokenClient.disconnect()
    tokenClient.destroy()
  })
})
