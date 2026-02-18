/**
 * Integration tests for TanStack Realtime.
 *
 * These tests exercise the full hot path:
 *   createRealtimeServer → attach → client connects → subscribe → publish → invalidate
 *
 * We test end-to-end by running a real HTTP + WebSocket server in-process
 * and connecting the RealtimeClient (which uses the built-in WebSocket API).
 */

import { createServer } from 'http'
import type { Server } from 'http'
import {
  createRealtimeServer,
  memoryAdapter,
  serializeKey as serverSerializeKey,
} from '@tanstack/realtime-server'
import { createRealtimeClient, serializeKey } from '@tanstack/realtime-client'
import type { RealtimeClient } from '@tanstack/realtime-client'
import type { RealtimeServerOptions } from '@tanstack/realtime-server'

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

interface TestHarness {
  port: number
  realtime: ReturnType<typeof createRealtimeServer>
  httpServer: Server
  teardown: () => Promise<void>
}

async function createTestHarness(opts: {
  authenticate?: RealtimeServerOptions['authenticate']
} = {}): Promise<TestHarness> {
  const httpServer = createServer()
  const realtime = createRealtimeServer({
    adapter: memoryAdapter(),
    authenticate: opts.authenticate,
  })
  realtime.attach(httpServer)

  await new Promise<void>((resolve) => httpServer.listen(0, resolve))
  const port = (httpServer.address() as { port: number }).port

  return {
    port,
    realtime,
    httpServer,
    teardown: async () => {
      await realtime.close()
      await new Promise<void>((resolve, reject) =>
        httpServer.close((err) => (err ? reject(err) : resolve())),
      )
    },
  }
}

function connectClient(port: number): RealtimeClient {
  return createRealtimeClient({
    url: `ws://localhost:${port}/_realtime`,
    reconnect: { initialDelay: 100, maxDelay: 500, jitter: 0 },
    refetch: { stagger: 10, maxConcurrency: 5 },
  })
}

function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function nextStatus(
  client: RealtimeClient,
  target: string,
): Promise<string> {
  // Resolve immediately if already at the target status
  if (client.status === target) return Promise.resolve(target)
  return new Promise((resolve) => {
    const unsub = client.onStatus((s) => {
      if (s === target) {
        unsub()
        resolve(s)
      }
    })
  })
}

/** Wait for the server to process messages sent over the local WebSocket */
function waitForServerProcessing(): Promise<void> {
  return waitFor(30)
}

function nextInvalidate(client: RealtimeClient): Promise<string> {
  return new Promise((resolve) => {
    const unsub = client.onInvalidate((key) => {
      unsub()
      resolve(key)
    })
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Connection lifecycle', () => {
  let harness: TestHarness
  let client: RealtimeClient

  beforeEach(async () => {
    harness = await createTestHarness()
    client = connectClient(harness.port)
  })

  afterEach(async () => {
    client.destroy()
    await harness.teardown()
  })

  it('transitions from disconnected → connecting → connected', async () => {
    expect(client.status).toBe('disconnected')

    const connectedPromise = nextStatus(client, 'connected')
    client.connect()
    expect(client.status).toBe('connecting')
    await connectedPromise
    expect(client.status).toBe('connected')
  })

  it('transitions to disconnected on explicit disconnect', async () => {
    client.connect()
    await nextStatus(client, 'connected')

    const disconnectedPromise = nextStatus(client, 'disconnected')
    client.disconnect()
    await disconnectedPromise
    expect(client.status).toBe('disconnected')
  })

  it('does not auto-connect on creation', () => {
    expect(client.status).toBe('disconnected')
  })
})

describe('Invalidation — hot path', () => {
  let harness: TestHarness
  let client: RealtimeClient

  beforeEach(async () => {
    harness = await createTestHarness()
    client = connectClient(harness.port)
    client.connect()
    await nextStatus(client, 'connected')
  })

  afterEach(async () => {
    client.destroy()
    await harness.teardown()
  })

  it('delivers an invalidation signal to a subscribed client', async () => {
    const key = ['todos', { projectId: '123' }] as const
    const serialized = serializeKey(key)

    client.subscribe(serialized)
    await waitForServerProcessing()

    const invalidated = nextInvalidate(client)
    await harness.realtime.publish(key)
    expect(await invalidated).toBe(serialized)
  })

  it('delivers to multiple clients subscribed to the same key', async () => {
    const client2 = connectClient(harness.port)
    client2.connect()
    await nextStatus(client2, 'connected')

    const key = ['todos', { projectId: 'shared' }] as const
    const serialized = serializeKey(key)

    client.subscribe(serialized)
    client2.subscribe(serialized)
    await waitForServerProcessing()

    const [inv1, inv2] = await Promise.all([
      nextInvalidate(client),
      nextInvalidate(client2),
      harness.realtime.publish(key),
    ])

    expect(inv1).toBe(serialized)
    expect(inv2).toBe(serialized)
    client2.destroy()
  })

  it('does not deliver invalidation to an unsubscribed client', async () => {
    const key = ['todos', { projectId: 'xyz' }] as const
    const serialized = serializeKey(key)

    // Subscribe then unsubscribe; wait for server to process both
    client.subscribe(serialized)
    client.unsubscribe(serialized)
    await waitForServerProcessing()

    let received = false
    const unsub = client.onInvalidate(() => {
      received = true
    })

    await harness.realtime.publish(key)
    await waitFor(100)
    expect(received).toBe(false)
    unsub()
  })

  it('does not deliver invalidation to a different key', async () => {
    const key1 = ['todos', { projectId: '123' }] as const
    const key2 = ['todos', { projectId: '456' }] as const

    client.subscribe(serializeKey(key1))

    let received = false
    const unsub = client.onInvalidate(() => {
      received = true
    })

    await harness.realtime.publish(key2)
    await waitFor(100)
    expect(received).toBe(false)
    unsub()
  })
})

describe('Key prefix matching', () => {
  let harness: TestHarness
  let client: RealtimeClient

  beforeEach(async () => {
    harness = await createTestHarness()
    client = connectClient(harness.port)
    client.connect()
    await nextStatus(client, 'connected')
  })

  afterEach(async () => {
    client.destroy()
    await harness.teardown()
  })

  it('publishing to a prefix key invalidates more-specific subscriptions', async () => {
    // Subscribe with a more specific key
    const specificKey = ['todos', { projectId: '123', status: 'active' }] as const
    const serializedSpecific = serializeKey(specificKey)

    client.subscribe(serializedSpecific)
    await waitForServerProcessing()

    const invalidated = nextInvalidate(client)
    // Publish to the prefix key
    await harness.realtime.publish(['todos', { projectId: '123' }])

    expect(await invalidated).toBe(serializedSpecific)
  })

  it('publishing to a specific key does NOT invalidate prefix subscriptions', async () => {
    const prefixKey = ['todos', { projectId: '123' }] as const
    const serializedPrefix = serializeKey(prefixKey)

    client.subscribe(serializedPrefix)
    await waitForServerProcessing()

    let received = false
    const unsub = client.onInvalidate(() => { received = true })

    await harness.realtime.publish(['todos', { projectId: '123', status: 'active' }])
    await waitFor(100)
    expect(received).toBe(false)
    unsub()
  })

  it('exact match always invalidates', async () => {
    const key = ['todos'] as const
    const serialized = serializeKey(key)
    client.subscribe(serialized)
    await waitForServerProcessing()

    const invalidated = nextInvalidate(client)
    await harness.realtime.publish(key)
    expect(await invalidated).toBe(serialized)
  })

  it('object key ordering is normalized (hashKey semantics)', async () => {
    // Subscribe with keys in one order
    const subscribedKey = [{ b: 2, a: 1 }] as const
    const publishedKey = [{ a: 1, b: 2 }] as const

    // serializeKey should produce identical strings
    expect(serializeKey(subscribedKey)).toBe(serializeKey(publishedKey))

    const serialized = serializeKey(subscribedKey)
    client.subscribe(serialized)
    await waitForServerProcessing()

    const invalidated = nextInvalidate(client)
    await harness.realtime.publish(publishedKey)
    expect(await invalidated).toBe(serialized)
  })
})

describe('Reconnection', () => {
  let harness: TestHarness
  let client: RealtimeClient

  beforeEach(async () => {
    harness = await createTestHarness()
    client = connectClient(harness.port)
    client.connect()
    await nextStatus(client, 'connected')
  })

  afterEach(async () => {
    client.destroy()
    await harness.teardown()
  })

  it('reconnects automatically after server closes the connection', async () => {
    // Force-close all WebSocket connections by closing the wss
    const { wss } = harness.realtime
    if (!wss) throw new Error('No wss')

    for (const client of wss.clients) {
      client.terminate()
    }

    // Should transition to reconnecting then connected
    await nextStatus(client, 'reconnecting')
    await nextStatus(client, 'connected')
    expect(client.status).toBe('connected')
  })

  it('resubscribes to all keys after reconnect and invalidates them', async () => {
    const key = ['todos', { projectId: 'reconnect-test' }] as const
    const serialized = serializeKey(key)
    client.subscribe(serialized)

    // Collect all invalidations
    const invalidations: string[] = []
    const unsub = client.onInvalidate((k) => invalidations.push(k))

    // Force disconnect
    const { wss } = harness.realtime
    if (!wss) throw new Error('No wss')
    for (const ws of wss.clients) ws.terminate()

    await nextStatus(client, 'reconnecting')
    await nextStatus(client, 'connected')

    // After reconnect, all active subscriptions should be invalidated
    await waitFor(200) // wait for staggered batch
    expect(invalidations.some((k) => k === serialized)).toBe(true)
    unsub()
  })

  it('does not reconnect after explicit disconnect', async () => {
    client.disconnect()
    await nextStatus(client, 'disconnected')

    // Wait to make sure no reconnection happens
    await waitFor(500)
    expect(client.status).toBe('disconnected')
  })
})

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
    client1.destroy()
    client2.destroy()
    await harness.teardown()
  })

  it('sends presence:sync to the joining user with current members', async () => {
    const key = serializeKey(['doc', { id: 'abc' }])

    // Client1 joins first
    client1.presenceJoin(key, { name: 'Alice', cursor: null })

    // Wait for server to process
    await waitFor(50)

    // Client2 joins and should receive a sync with Alice
    const syncReceived = new Promise<{ users: any[] }>((resolve) => {
      const unsub = client2.onPresence((presenceKey, event) => {
        if (presenceKey === key && event.type === 'sync') {
          unsub()
          resolve(event)
        }
      })
    })

    client2.presenceJoin(key, { name: 'Bob', cursor: null })
    const sync = await syncReceived

    expect(sync.users.length).toBeGreaterThanOrEqual(1)
    const alice = sync.users.find((u) => (u.data as any).name === 'Alice')
    expect(alice).toBeDefined()
  })

  it('broadcasts join to existing members when a new user joins', async () => {
    const key = serializeKey(['doc', { id: 'broadcast-test' }])

    // Client1 joins first
    client1.presenceJoin(key, { name: 'Alice' })
    await waitFor(50)

    // Client1 should receive a join event when client2 joins
    const joinReceived = new Promise<{ connectionId: string; data: any }>(
      (resolve) => {
        const unsub = client1.onPresence((presenceKey, event) => {
          if (presenceKey === key && event.type === 'join') {
            unsub()
            resolve(event)
          }
        })
      },
    )

    client2.presenceJoin(key, { name: 'Bob' })
    const join = await joinReceived

    expect((join.data as any).name).toBe('Bob')
  })

  it('broadcasts presence updates to other users', async () => {
    const key = serializeKey(['doc', { id: 'update-test' }])

    client1.presenceJoin(key, { name: 'Alice', cursor: null })
    client2.presenceJoin(key, { name: 'Bob', cursor: null })
    await waitFor(100)

    const updateReceived = new Promise<{ connectionId: string; data: any }>(
      (resolve) => {
        const unsub = client1.onPresence((presenceKey, event) => {
          if (presenceKey === key && event.type === 'update') {
            unsub()
            resolve(event)
          }
        })
      },
    )

    client2.presenceUpdate(key, { cursor: { x: 100, y: 200 } })
    const update = await updateReceived

    expect((update.data as any).cursor).toEqual({ x: 100, y: 200 })
  })

  it('broadcasts leave event when a user leaves', async () => {
    const key = serializeKey(['doc', { id: 'leave-test' }])

    client1.presenceJoin(key, { name: 'Alice' })
    client2.presenceJoin(key, { name: 'Bob' })
    await waitFor(100)

    const leaveReceived = new Promise<{ connectionId: string }>((resolve) => {
      const unsub = client1.onPresence((presenceKey, event) => {
        if (presenceKey === key && event.type === 'leave') {
          unsub()
          resolve(event)
        }
      })
    })

    client2.presenceLeave(key)
    const leave = await leaveReceived

    expect(leave.connectionId).toBeDefined()
  })

  it('broadcasts leave when a connection drops', async () => {
    const key = serializeKey(['doc', { id: 'disconnect-leave' }])

    client1.presenceJoin(key, { name: 'Alice' })
    client2.presenceJoin(key, { name: 'Bob' })
    await waitFor(100)

    const leaveReceived = new Promise<{ connectionId: string }>((resolve) => {
      const unsub = client1.onPresence((presenceKey, event) => {
        if (presenceKey === key && event.type === 'leave') {
          unsub()
          resolve(event)
        }
      })
    })

    // Force-close client2's connection
    const { wss } = harness.realtime
    if (!wss) throw new Error('No wss')
    // Terminate the second connected client (client2)
    const clients = Array.from(wss.clients)
    expect(clients.length).toBeGreaterThanOrEqual(2)
    clients[clients.length - 1]?.terminate()

    const leave = await leaveReceived
    expect(leave.connectionId).toBeDefined()
  })
})

describe('Authentication', () => {
  it('rejects connections when authenticate returns null', async () => {
    const harness = await createTestHarness({
      authenticate: async () => null,
    })

    const client = connectClient(harness.port)
    client.connect()

    // Status should go to reconnecting (connection was rejected)
    await nextStatus(client, 'reconnecting')

    client.destroy()
    await harness.teardown()
  })

  it('accepts connections when authenticate returns a user object', async () => {
    const harness = await createTestHarness({
      authenticate: async () => ({ userId: 'test-user' }),
    })

    const client = connectClient(harness.port)
    client.connect()
    await nextStatus(client, 'connected')

    expect(client.status).toBe('connected')
    client.destroy()
    await harness.teardown()
  })
})

describe('Key serialization', () => {
  it('produces deterministic output regardless of object key order', () => {
    const a = serializeKey(['todos', { b: 2, a: 1 }])
    const b = serializeKey(['todos', { a: 1, b: 2 }])
    expect(a).toBe(b)
  })

  it('produces different output for different values', () => {
    const a = serializeKey(['todos', { projectId: '123' }])
    const b = serializeKey(['todos', { projectId: '456' }])
    expect(a).not.toBe(b)
  })

  it('client and server produce identical serializations', () => {
    const key = ['todos', { projectId: '123', status: 'active' }] as const
    expect(serializeKey(key)).toBe(serverSerializeKey(key))
  })

  it('handles nested objects', () => {
    const key = ['a', { z: { b: 1, a: 2 }, y: 0 }] as const
    const serialized = serializeKey(key)
    // Keys should be sorted at all levels
    expect(serialized).toBe(JSON.stringify(['a', { y: 0, z: { a: 2, b: 1 } }]))
  })
})

describe('Multi-client fan-out', () => {
  it('invalidates all subscribers across many clients', async () => {
    const harness = await createTestHarness()
    const N = 10
    const clients = Array.from({ length: N }, () => connectClient(harness.port))

    // Connect all clients
    await Promise.all(
      clients.map((c) => {
        c.connect()
        return nextStatus(c, 'connected')
      }),
    )

    const key = ['shared', { room: 'main' }] as const
    const serialized = serializeKey(key)

    // All subscribe
    clients.forEach((c) => c.subscribe(serialized))

    // Wait for all subscribe messages to reach the server
    await waitFor(100)

    // Collect invalidations
    const received: string[] = []
    const unsubs = clients.map((c) =>
      c.onInvalidate((k) => received.push(k)),
    )

    await harness.realtime.publish(key)
    await waitFor(200)

    expect(received.length).toBe(N)
    expect(received.every((k) => k === serialized)).toBe(true)

    unsubs.forEach((u) => u())
    clients.forEach((c) => c.destroy())
    await harness.teardown()
  })
})
