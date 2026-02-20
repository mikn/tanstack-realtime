/**
 * Integration tests for @tanstack/realtime + @tanstack/realtime-preset-node.
 *
 * Tests exercise the full stack:
 *   createNodeServer → attach → nodeTransport → createRealtimeClient → connect
 *
 * We run a real HTTP + WebSocket server in-process so the transport exercises
 * the actual wire protocol without any mocking.
 */

import { createServer } from 'http'
import type { Server } from 'http'
import {
  serializeKey,
  parseChannel,
  createRealtimeClient,
} from '@tanstack/realtime'
import type { ParsedChannel, PresenceUser } from '@tanstack/realtime'
import type { ChannelPermissions } from '@tanstack/realtime/server'
import { createNodeServer, nodeTransport } from '@tanstack/realtime-preset-node'
import type { NodeServer } from '@tanstack/realtime-preset-node'
import type { RealtimeClient } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

interface TestHarness {
  port: number
  nodeServer: NodeServer
  httpServer: Server
  teardown: () => Promise<void>
}

type AuthorizeFn = (
  userId: string,
  channel: ParsedChannel,
) => Promise<ChannelPermissions>

async function createTestHarness(
  authorize: AuthorizeFn = async () => ({
    subscribe: true,
    publish: true,
    presence: true,
  }),
): Promise<TestHarness> {
  const httpServer = createServer()
  const nodeServer = createNodeServer({
    // Default: accept all connections as 'test-user'
    getUser: async () => ({ userId: 'test-user' }),
    authorize,
  })
  nodeServer.attach(httpServer)

  await new Promise<void>((resolve) => httpServer.listen(0, resolve))
  const port = (httpServer.address() as { port: number }).port

  return {
    port,
    nodeServer,
    httpServer,
    teardown: async () => {
      await nodeServer.close()
      await new Promise<void>((resolve, reject) =>
        httpServer.close((err) => (err ? reject(err) : resolve())),
      )
    },
  }
}

function connectClient(port: number, jitter = 0): RealtimeClient {
  return createRealtimeClient({
    transport: nodeTransport({
      url: `ws://localhost:${port}`,
      initialDelay: 100,
      maxDelay: 500,
      jitter,
    }),
  })
}

function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function nextStatus(
  client: RealtimeClient,
  target: string,
): Promise<string> {
  if (client.store.get().status === target) return Promise.resolve(target)
  return new Promise((resolve) => {
    const sub = client.store.subscribe((state) => {
      if (state.status === target) {
        sub.unsubscribe()
        resolve(state.status)
      }
    })
  })
}

// ---------------------------------------------------------------------------
// Key Serialization
// ---------------------------------------------------------------------------

describe('serializeKey', () => {
  it('encodes a single-segment key as the namespace', () => {
    expect(serializeKey(['todos'])).toBe('todos')
  })

  it('encodes a key with one param', () => {
    expect(serializeKey(['todos', { projectId: '123' }])).toBe(
      'todos:projectId=123',
    )
  })

  it('sorts object keys deterministically', () => {
    const a = serializeKey(['todos', { b: '2', a: '1' }])
    const b = serializeKey(['todos', { a: '1', b: '2' }])
    expect(a).toBe(b)
    expect(a).toBe('todos:a=1,b=2')
  })

  it('URI-encodes special characters in values', () => {
    const result = serializeKey(['channel', { name: 'hello world' }])
    expect(result).toBe('channel:name=hello%20world')
  })
})

describe('parseChannel', () => {
  it('parses a namespace-only channel', () => {
    const parsed = parseChannel('todos')
    expect(parsed).toEqual({ namespace: 'todos', params: {}, raw: 'todos' })
  })

  it('parses a channel with one param', () => {
    const parsed = parseChannel('todos:projectId=123')
    expect(parsed).toEqual({
      namespace: 'todos',
      params: { projectId: '123' },
      raw: 'todos:projectId=123',
    })
  })

  it('parses a channel with multiple params', () => {
    const parsed = parseChannel('todos:a=1,b=2')
    expect(parsed).toEqual({
      namespace: 'todos',
      params: { a: '1', b: '2' },
      raw: 'todos:a=1,b=2',
    })
  })

  it('decodes URI-encoded values', () => {
    const parsed = parseChannel('channel:name=hello%20world')
    expect(parsed.params.name).toBe('hello world')
  })

  it('is the inverse of serializeKey for single-param channels', () => {
    const key = ['todos', { projectId: '123' }] as const
    const serialized = serializeKey(key)
    const parsed = parseChannel(serialized)
    expect(parsed.namespace).toBe('todos')
    expect(parsed.params.projectId).toBe('123')
  })
})

// ---------------------------------------------------------------------------
// Connection lifecycle
// ---------------------------------------------------------------------------

describe('Connection lifecycle', () => {
  let harness: TestHarness
  let client: RealtimeClient

  beforeEach(async () => {
    harness = await createTestHarness()
    client = connectClient(harness.port)
  })

  afterEach(async () => {
    client.disconnect()
    await harness.teardown()
  })

  it('starts in disconnected state', () => {
    expect(client.store.get().status).toBe('disconnected')
  })

  it('transitions disconnected → connecting → connected', async () => {
    const connectedPromise = nextStatus(client, 'connected')
    client.connect()
    expect(client.store.get().status).toBe('connecting')
    await connectedPromise
    expect(client.store.get().status).toBe('connected')
  })

  it('returns to disconnected on explicit disconnect', async () => {
    client.connect()
    await nextStatus(client, 'connected')

    const disconnectedPromise = nextStatus(client, 'disconnected')
    client.disconnect()
    await disconnectedPromise
    expect(client.store.get().status).toBe('disconnected')
  })

  it('rejects connections when getUser returns null', async () => {
    const rejecting = await createTestHarness()
    // Override to reject
    const httpServer2 = createServer()
    const nodeServer2 = createNodeServer({
      getUser: async () => null,
      authorize: async () => ({ subscribe: true, publish: true, presence: true }),
    })
    nodeServer2.attach(httpServer2)
    await new Promise<void>((resolve) => httpServer2.listen(0, resolve))
    const port2 = (httpServer2.address() as { port: number }).port

    const rejectClient = connectClient(port2)
    rejectClient.connect()
    await nextStatus(rejectClient, 'reconnecting')
    rejectClient.disconnect()

    await nodeServer2.close()
    await new Promise<void>((resolve, reject) =>
      httpServer2.close((err) => (err ? reject(err) : resolve())),
    )
    await rejecting.teardown()
  })
})

// ---------------------------------------------------------------------------
// Publish / Subscribe
// ---------------------------------------------------------------------------

describe('Publish / Subscribe', () => {
  let harness: TestHarness
  let client: RealtimeClient

  beforeEach(async () => {
    harness = await createTestHarness()
    client = connectClient(harness.port)
    client.connect()
    await nextStatus(client, 'connected')
  })

  afterEach(async () => {
    client.disconnect()
    await harness.teardown()
  })

  it('client receives a message published by the server', async () => {
    const channel = serializeKey(['todos', { projectId: '42' }])

    const received = new Promise<unknown>((resolve) => {
      const unsub = client.subscribe(channel, (data) => {
        unsub()
        resolve(data)
      })
    })

    await waitFor(30) // let subscribe message reach server
    harness.nodeServer.publish(channel, { action: 'insert', data: { id: '1', text: 'hello' } })

    const msg = await received
    expect(msg).toEqual({ action: 'insert', data: { id: '1', text: 'hello' } })
  })

  it('two clients both receive a server-published message', async () => {
    const client2 = connectClient(harness.port)
    client2.connect()
    await nextStatus(client2, 'connected')

    const channel = serializeKey(['shared', { room: 'main' }])

    const r1 = new Promise<unknown>((resolve) => {
      const unsub = client.subscribe(channel, (d) => { unsub(); resolve(d) })
    })
    const r2 = new Promise<unknown>((resolve) => {
      const unsub = client2.subscribe(channel, (d) => { unsub(); resolve(d) })
    })

    await waitFor(30)
    harness.nodeServer.publish(channel, { hello: 'world' })

    expect(await r1).toEqual({ hello: 'world' })
    expect(await r2).toEqual({ hello: 'world' })

    client2.disconnect()
  })

  it('client-side publish fans out to other subscribers', async () => {
    const client2 = connectClient(harness.port)
    client2.connect()
    await nextStatus(client2, 'connected')

    const channel = serializeKey(['chat', { roomId: 'abc' }])

    // client2 subscribes and listens
    const received = new Promise<unknown>((resolve) => {
      const unsub = client2.subscribe(channel, (d) => { unsub(); resolve(d) })
    })

    await waitFor(30)
    // client1 subscribes (needed for authorization) and publishes
    client.subscribe(channel, () => {})
    await waitFor(30)
    await client.publish(channel, { type: 'message', text: 'hi!' })

    expect(await received).toEqual({ type: 'message', text: 'hi!' })
    client2.disconnect()
  })

  it('unsubscribed client does not receive messages', async () => {
    const channel = serializeKey(['events'])

    let received = false
    const unsub = client.subscribe(channel, () => { received = true })

    await waitFor(20)
    unsub()
    await waitFor(20)

    harness.nodeServer.publish(channel, { ping: true })
    await waitFor(100)

    expect(received).toBe(false)
  })

  it('subscribe denied by authorize does not deliver messages', async () => {
    const harness2 = await createTestHarness(async (_, channel) => ({
      subscribe: channel.namespace === 'allowed',
      publish: false,
      presence: false,
    }))

    const restrictedClient = connectClient(harness2.port)
    restrictedClient.connect()
    await nextStatus(restrictedClient, 'connected')

    const denied = serializeKey(['denied'])

    let received = false
    restrictedClient.subscribe(denied, () => { received = true })
    await waitFor(50)

    harness2.nodeServer.publish(denied, { secret: true })
    await waitFor(50)

    expect(received).toBe(false)

    restrictedClient.disconnect()
    await harness2.teardown()
  })
})

// ---------------------------------------------------------------------------
// Presence
// ---------------------------------------------------------------------------

describe('Presence', () => {
  let harness: TestHarness
  let client1: RealtimeClient
  let client2: RealtimeClient

  beforeEach(async () => {
    harness = await createTestHarness()
    client1 = connectClient(harness.port)
    client2 = connectClient(harness.port)
    client1.connect()
    client2.connect()
    await Promise.all([
      nextStatus(client1, 'connected'),
      nextStatus(client2, 'connected'),
    ])
  })

  afterEach(async () => {
    client1.disconnect()
    client2.disconnect()
    await harness.teardown()
  })

  async function subscribeAndJoin(
    c: RealtimeClient,
    channel: string,
    data: object,
  ) {
    c.subscribe(channel, () => {}) // authorize the channel
    await waitFor(30)
    c.joinPresence(channel, data)
    await waitFor(30)
  }

  it('broadcasts presence to all joined users when someone joins', async () => {
    const channel = serializeKey(['editor', { documentId: 'doc1' }])

    await subscribeAndJoin(client1, channel, { name: 'Alice' })

    const presenceUpdate = new Promise<ReadonlyArray<PresenceUser>>((resolve) => {
      const unsub = client1.onPresenceChange(channel, (users) => {
        // Wait until we see at least one other user (Bob)
        if (users.some((u) => (u.data as Record<string, unknown>).name === 'Bob')) {
          unsub()
          resolve(users)
        }
      })
    })

    await subscribeAndJoin(client2, channel, { name: 'Bob' })

    const users = await presenceUpdate
    expect(users.some((u) => (u.data as Record<string, unknown>).name === 'Bob')).toBe(true)
  })

  it('updates are merged and broadcast', async () => {
    const channel = serializeKey(['editor', { documentId: 'doc2' }])

    await subscribeAndJoin(client1, channel, { name: 'Alice', cursor: null })
    await subscribeAndJoin(client2, channel, { name: 'Bob', cursor: null })

    const updateReceived = new Promise<ReadonlyArray<PresenceUser>>((resolve) => {
      const unsub = client1.onPresenceChange(channel, (users) => {
        const bob = users.find(
          (u) => (u.data as Record<string, unknown>).name === 'Bob',
        )
        if ((bob?.data as Record<string, unknown> | undefined)?.cursor != null) {
          unsub()
          resolve(users)
        }
      })
    })

    client2.updatePresence(channel, { cursor: { x: 100, y: 200 } })

    const users = await updateReceived
    const bob = users.find((u) => (u.data as Record<string, unknown>).name === 'Bob')
    expect((bob!.data as Record<string, unknown>).cursor).toEqual({ x: 100, y: 200 })
  })

  it('removes user from presence when they leave', async () => {
    const channel = serializeKey(['editor', { documentId: 'doc3' }])

    await subscribeAndJoin(client1, channel, { name: 'Alice' })
    await subscribeAndJoin(client2, channel, { name: 'Bob' })

    const leaveReceived = new Promise<ReadonlyArray<PresenceUser>>((resolve) => {
      const unsub = client1.onPresenceChange(channel, (users) => {
        if (!users.some((u) => (u.data as Record<string, unknown>).name === 'Bob')) {
          unsub()
          resolve(users)
        }
      })
    })

    client2.leavePresence(channel)

    const users = await leaveReceived
    expect(users.some((u) => (u.data as Record<string, unknown>).name === 'Bob')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Reconnection
// ---------------------------------------------------------------------------

describe('Reconnection', () => {
  it('reconnects automatically and resubscribes after server closes connection', async () => {
    const harness = await createTestHarness()
    const client = connectClient(harness.port, 0) // no jitter for deterministic timing
    client.connect()
    await nextStatus(client, 'connected')

    const channel = serializeKey(['todos'])
    client.subscribe(channel, () => {})
    await waitFor(30)

    // Force-close by shutting down the WS server (clients will error+close)
    await harness.nodeServer.close()

    await nextStatus(client, 'reconnecting')

    // Restart the server on the same port
    const newNodeServer = createNodeServer({
      getUser: async () => ({ userId: 'test-user' }),
      authorize: async () => ({ subscribe: true, publish: true, presence: true }),
    })
    newNodeServer.attach(harness.httpServer)

    await nextStatus(client, 'connected')
    expect(client.store.get().status).toBe('connected')

    // After reconnect, the subscription should be reestablished
    const received = new Promise<unknown>((resolve) => {
      const unsub = client.subscribe(channel, (d) => { unsub(); resolve(d) })
    })
    await waitFor(30)
    newNodeServer.publish(channel, { ping: true })
    expect(await received).toEqual({ ping: true })

    client.disconnect()
    await newNodeServer.close()
    await new Promise<void>((resolve, reject) =>
      harness.httpServer.close((err) => (err ? reject(err) : resolve())),
    )
  })

  it('does not reconnect after explicit disconnect', async () => {
    const harness = await createTestHarness()
    const client = connectClient(harness.port, 0)
    client.connect()
    await nextStatus(client, 'connected')

    client.disconnect()
    await nextStatus(client, 'disconnected')

    await waitFor(300)
    expect(client.store.get().status).toBe('disconnected')
    await harness.teardown()
  })
})

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------

describe('Authorization', () => {
  it('authorize is called with the correct namespace and params', async () => {
    const calls: Array<{ userId: string; channel: ParsedChannel }> = []

    const harness = await createTestHarness(async (userId, channel) => {
      calls.push({ userId, channel })
      return { subscribe: true, publish: false, presence: false }
    })

    const client = connectClient(harness.port)
    client.connect()
    await nextStatus(client, 'connected')

    const channel = serializeKey(['todos', { projectId: 'proj-1' }])
    client.subscribe(channel, () => {})
    await waitFor(50)

    expect(calls.length).toBeGreaterThanOrEqual(1)
    const call = calls.find((c) => c.channel.namespace === 'todos')
    expect(call).toBeDefined()
    expect(call!.channel.params.projectId).toBe('proj-1')
    expect(call!.userId).toBe('test-user')

    client.disconnect()
    await harness.teardown()
  })
})
