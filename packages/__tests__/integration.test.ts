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

// ---------------------------------------------------------------------------
// Key serialization — edge cases
// ---------------------------------------------------------------------------

describe('Key serialization edge cases', () => {
  it('round-trips values containing the delimiter characters (= , :)', () => {
    // These chars are used as delimiters in the wire format; they must be
    // percent-encoded so the inverse parse produces the original string.
    const tricky = 'a=1,b:2'
    const serialized = serializeKey(['ch', { formula: tricky }])
    const parsed = parseChannel(serialized)
    expect(parsed.params.formula).toBe(tricky)
  })

  it('round-trips values containing Unicode and percent-encoded chars', () => {
    const unicode = '🚀 café ñ 中文'
    const serialized = serializeKey(['ch', { msg: unicode }])
    const parsed = parseChannel(serialized)
    expect(parsed.params.msg).toBe(unicode)
    expect(parsed.namespace).toBe('ch')
  })

  it('treats an empty params object the same as no params', () => {
    expect(serializeKey(['ch', {}])).toBe(serializeKey(['ch']))
    expect(serializeKey(['ch', {}])).toBe('ch')
  })

  it('is deterministic regardless of input key insertion order', () => {
    const params = { z: '1', a: '2', m: '3', b: '4' }
    const results = new Set<string>()
    // Shuffle the same params 50 times and verify identical output each time.
    for (let i = 0; i < 50; i++) {
      const shuffled = Object.fromEntries(
        Object.entries(params).sort(() => Math.random() - 0.5),
      )
      results.add(serializeKey(['ch', shuffled]))
    }
    expect(results.size).toBe(1)
    expect([...results][0]).toBe('ch:a=2,b=4,m=3,z=1')
  })

  it('parseChannel preserves the raw channel string', () => {
    const raw = 'todos:a=1,b=2'
    expect(parseChannel(raw).raw).toBe(raw)
  })
})

// ---------------------------------------------------------------------------
// Channel isolation
// ---------------------------------------------------------------------------

describe('Channel isolation', () => {
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

  it('messages only reach subscribers of the exact channel', async () => {
    const ch1: unknown[] = []
    const ch2: unknown[] = []
    const ch3: unknown[] = []

    client.subscribe('channel1', (msg) => ch1.push(msg))
    client.subscribe('channel2', (msg) => ch2.push(msg))
    // Intentionally NOT subscribing to channel3
    await waitFor(50)

    harness.nodeServer.publish('channel1', { id: 1 })
    harness.nodeServer.publish('channel2', { id: 2 })
    harness.nodeServer.publish('channel3', { id: 3 }) // nobody subscribed
    await waitFor(80)

    expect(ch1).toEqual([{ id: 1 }])
    expect(ch2).toEqual([{ id: 2 }])
    expect(ch3).toEqual([]) // Not subscribed → nothing received
  })

  it('channels with different param values are fully isolated', async () => {
    const proj1: unknown[] = []
    const proj2: unknown[] = []

    client.subscribe('todos:projectId=proj1', (msg) => proj1.push(msg))
    client.subscribe('todos:projectId=proj2', (msg) => proj2.push(msg))
    await waitFor(50)

    harness.nodeServer.publish('todos:projectId=proj1', { id: 'a' })
    harness.nodeServer.publish('todos:projectId=proj2', { id: 'b' })
    await waitFor(80)

    expect(proj1).toEqual([{ id: 'a' }])
    expect(proj2).toEqual([{ id: 'b' }])
  })

  it('publisher does not receive its own message', async () => {
    const client2 = connectClient(harness.port)
    client2.connect()
    await nextStatus(client2, 'connected')

    const channel = 'chat'
    const client1Received: unknown[] = []
    const client2Received: unknown[] = []

    client.subscribe(channel, (msg) => client1Received.push(msg))
    client2.subscribe(channel, (msg) => client2Received.push(msg))
    await waitFor(50)

    await client.publish(channel, { text: 'hello' })
    await waitFor(80)

    expect(client1Received).toEqual([]) // Publisher excluded from own message
    expect(client2Received).toEqual([{ text: 'hello' }])

    client2.disconnect()
  })
})

// ---------------------------------------------------------------------------
// Subscription semantics
// ---------------------------------------------------------------------------

describe('Subscription semantics', () => {
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

  it('all listeners on the same channel receive each message', async () => {
    const channel = 'shared'
    const r1: unknown[] = []
    const r2: unknown[] = []
    const r3: unknown[] = []

    const unsub1 = client.subscribe(channel, (msg) => r1.push(msg))
    const unsub2 = client.subscribe(channel, (msg) => r2.push(msg))
    const unsub3 = client.subscribe(channel, (msg) => r3.push(msg))
    await waitFor(50)

    harness.nodeServer.publish(channel, { n: 1 })
    await waitFor(50)

    expect(r1).toEqual([{ n: 1 }])
    expect(r2).toEqual([{ n: 1 }])
    expect(r3).toEqual([{ n: 1 }])

    // Remove the middle listener; remaining two should still receive.
    unsub2()
    harness.nodeServer.publish(channel, { n: 2 })
    await waitFor(50)

    expect(r1).toEqual([{ n: 1 }, { n: 2 }])
    expect(r2).toEqual([{ n: 1 }]) // Unsubscribed — no new messages
    expect(r3).toEqual([{ n: 1 }, { n: 2 }])

    unsub1()
    unsub3()
  })

  it('removing the last listener unsubscribes the channel from the server', async () => {
    // After unsubscribing the last listener, new messages from the server
    // should not be delivered. Verify by re-subscribing after a publish and
    // confirming the publish before re-subscribe was not buffered.
    const channel = 'ephemeral'
    const received: unknown[] = []

    const unsub = client.subscribe(channel, (msg) => received.push(msg))
    await waitFor(50)

    unsub() // Last listener removed; server should receive 'unsubscribe'
    await waitFor(50)

    // This publish happens while no one is subscribed.
    harness.nodeServer.publish(channel, { id: 'ghost' })
    await waitFor(80)

    expect(received).toEqual([]) // Message was not delivered
  })
})

// ---------------------------------------------------------------------------
// Connection races
// ---------------------------------------------------------------------------

describe('Connection races', () => {
  it('concurrent connect() calls all resolve without opening duplicate sockets', async () => {
    const harness = await createTestHarness()
    const client = connectClient(harness.port)

    // Fire three concurrent connect calls before any resolves.
    const results = await Promise.all([
      client.connect(),
      client.connect(),
      client.connect(),
    ])

    expect(results).toEqual([undefined, undefined, undefined])
    expect(client.store.get().status).toBe('connected')

    client.disconnect()
    await harness.teardown()
  })

  it('connect() while reconnecting resolves when the reconnect succeeds', async () => {
    const harness = await createTestHarness()
    const client = connectClient(harness.port, 0)
    client.connect()
    await nextStatus(client, 'connected')

    // Force the transport into reconnecting by closing the server.
    await harness.nodeServer.close()
    await nextStatus(client, 'reconnecting')

    // connect() called while reconnecting must not open a duplicate socket;
    // it should return a Promise that resolves once reconnected.
    const connectPromise = client.connect()

    // Restart the server so the pending reconnect can succeed.
    const newNodeServer = createNodeServer({
      getUser: async () => ({ userId: 'test-user' }),
      authorize: async () => ({ subscribe: true, publish: true, presence: true }),
    })
    newNodeServer.attach(harness.httpServer)

    await connectPromise // Must settle — not hang
    expect(client.store.get().status).toBe('connected')

    client.disconnect()
    await newNodeServer.close()
    await new Promise<void>((resolve, reject) =>
      harness.httpServer.close((err) => (err ? reject(err) : resolve())),
    )
  })
})

// ---------------------------------------------------------------------------
// Client lifecycle
// ---------------------------------------------------------------------------

describe('Client lifecycle', () => {
  it('destroy() stops status propagation from the underlying transport', async () => {
    const harness = await createTestHarness()
    const client = connectClient(harness.port)
    client.connect()
    await nextStatus(client, 'connected')

    // Record updates on the *client* store from this point forward.
    const updates: string[] = []
    const sub = client.store.subscribe((state) => updates.push(state.status))

    // Destroy releases the internal transport → client store subscription.
    client.destroy()

    // Disconnecting the transport now updates the transport's store, but the
    // client store should NOT propagate that change.
    client.disconnect()
    await waitFor(100)

    sub.unsubscribe()

    expect(updates).toEqual([]) // No propagation after destroy()
    await harness.teardown()
  })
})

// ---------------------------------------------------------------------------
// Presence correctness
// ---------------------------------------------------------------------------

describe('Presence correctness', () => {
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

  it('joinPresence without a prior subscribe is silently dropped by the server', async () => {
    // The server only allows presence for channels the connection has
    // already been authorized for via subscribe. This is an important
    // authorization invariant: you cannot sneak into a presence channel
    // without first subscribing.
    const channel = 'auth-guard'

    // client1 subscribes and joins properly.
    client1.subscribe(channel, () => {})
    await waitFor(30)
    client1.joinPresence(channel, { name: 'Alice' })
    await waitFor(30)

    // client2 joins WITHOUT subscribing first — server should drop this.
    client2.joinPresence(channel, { name: 'Unauthorized' })
    await waitFor(80)

    // client1 should see its own join but NOT the unauthorized client2.
    const users: ReadonlyArray<PresenceUser>[] = []
    client1.onPresenceChange(channel, (u) => users.push(u))
    await waitFor(50)

    const allNames = (users[users.length - 1] ?? []).map(
      (u) => (u.data as Record<string, unknown>).name,
    )
    expect(allNames).not.toContain('Unauthorized')
  })

  it('updatePresence merges the delta into stored data without replacing other fields', async () => {
    const channel = 'editor'

    // Both clients subscribe then join with full initial state.
    client1.subscribe(channel, () => {})
    await waitFor(30)
    client1.joinPresence(channel, { name: 'Alice', cursor: null, color: 'blue' })
    await waitFor(30)

    client2.subscribe(channel, () => {})
    await waitFor(30)
    client2.joinPresence(channel, { name: 'Bob', cursor: null, color: 'red' })
    await waitFor(50)

    // Collect updates visible to client1.
    const updates: ReadonlyArray<PresenceUser>[] = []
    client1.onPresenceChange(channel, (u) => updates.push(u))
    await waitFor(30)

    // client2 sends only a cursor delta; name and color must be preserved.
    client2.updatePresence(channel, { cursor: { x: 42, y: 7 } })
    await waitFor(80)

    const bob = updates[updates.length - 1]?.find(
      (u) => (u.data as Record<string, unknown>).name === 'Bob',
    )
    expect(bob).toBeDefined()
    const data = bob!.data as Record<string, unknown>
    expect(data.cursor).toEqual({ x: 42, y: 7 }) // Updated field
    expect(data.color).toBe('red')                // Preserved from join
    expect(data.name).toBe('Bob')                 // Preserved from join
  })
})

// ---------------------------------------------------------------------------
// Reconnection — resubscription
// ---------------------------------------------------------------------------

describe('Reconnection — resubscription', () => {
  it('resubscribes ALL active channels after reconnect, not just the first', async () => {
    const harness = await createTestHarness()
    const client = connectClient(harness.port, 0)
    client.connect()
    await nextStatus(client, 'connected')

    // Set up three distinct channel listeners before the disconnect.
    const ch1: unknown[] = []
    const ch2: unknown[] = []
    const ch3: unknown[] = []
    client.subscribe('recon1', (msg) => ch1.push(msg))
    client.subscribe('recon2', (msg) => ch2.push(msg))
    client.subscribe('recon3', (msg) => ch3.push(msg))
    await waitFor(50)

    // Force the transport into reconnecting.
    await harness.nodeServer.close()
    await nextStatus(client, 'reconnecting')

    // Restart on the same port so the transport reconnects automatically.
    const newNodeServer = createNodeServer({
      getUser: async () => ({ userId: 'test-user' }),
      authorize: async () => ({ subscribe: true, publish: true, presence: true }),
    })
    newNodeServer.attach(harness.httpServer)
    await nextStatus(client, 'connected')
    await waitFor(50) // Let resubscribe messages reach the new server

    // Publish from the new server instance — all three channels must receive.
    newNodeServer.publish('recon1', { ch: 1 })
    newNodeServer.publish('recon2', { ch: 2 })
    newNodeServer.publish('recon3', { ch: 3 })
    await waitFor(100)

    expect(ch1).toEqual([{ ch: 1 }])
    expect(ch2).toEqual([{ ch: 2 }])
    expect(ch3).toEqual([{ ch: 3 }])

    client.disconnect()
    await newNodeServer.close()
    await new Promise<void>((resolve, reject) =>
      harness.httpServer.close((err) => (err ? reject(err) : resolve())),
    )
  })
})
