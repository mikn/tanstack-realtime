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

  it('delivers each presence event exactly once (no double fan-out)', async () => {
    const key = serializeKey(['doc', { id: 'no-double-fanout' }])

    client1.presenceJoin(key, { name: 'Alice' })
    await waitFor(50)

    // Count every presence event client1 receives after client2 joins
    const receivedEvents: Array<{ type: string }> = []
    const unsub = client1.onPresence((presenceKey, event) => {
      if (presenceKey === key) receivedEvents.push({ type: event.type })
    })

    client2.presenceJoin(key, { name: 'Bob' })
    await waitFor(100)
    client2.presenceUpdate(key, { cursor: { x: 1, y: 2 } })
    await waitFor(100)
    client2.presenceLeave(key)
    await waitFor(100)

    const joins = receivedEvents.filter((e) => e.type === 'join')
    const updates = receivedEvents.filter((e) => e.type === 'update')
    const leaves = receivedEvents.filter((e) => e.type === 'leave')

    expect(joins.length).toBe(1)
    expect(updates.length).toBe(1)
    expect(leaves.length).toBe(1)
    unsub()
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

// ---------------------------------------------------------------------------
// Regression tests — each covers a specific bug that was fixed in review
// ---------------------------------------------------------------------------

describe('Regression: multiple presence channels cleaned up on disconnect', () => {
  it('broadcasts leave for every presence channel when a connection drops', async () => {
    const harness = await createTestHarness()
    const observer = connectClient(harness.port)
    const dropper = connectClient(harness.port)
    observer.connect()
    dropper.connect()
    await Promise.all([
      nextStatus(observer, 'connected'),
      nextStatus(dropper, 'connected'),
    ])

    const ch1 = serializeKey(['doc', { id: 'ch1' }])
    const ch2 = serializeKey(['doc', { id: 'ch2' }])
    const ch3 = serializeKey(['doc', { id: 'ch3' }])

    // observer joins all three channels
    observer.presenceJoin(ch1, { name: 'Observer' })
    observer.presenceJoin(ch2, { name: 'Observer' })
    observer.presenceJoin(ch3, { name: 'Observer' })

    // dropper joins all three channels
    dropper.presenceJoin(ch1, { name: 'Dropper' })
    dropper.presenceJoin(ch2, { name: 'Dropper' })
    dropper.presenceJoin(ch3, { name: 'Dropper' })
    await waitFor(100)

    // Track every leave event the observer receives
    const leaveChannels: string[] = []
    const unsub = observer.onPresence((key, event) => {
      if (event.type === 'leave') leaveChannels.push(key)
    })

    // Forcefully drop the dropper's connection
    const { wss } = harness.realtime
    if (!wss) throw new Error('No wss')
    const allWsClients = Array.from(wss.clients)
    allWsClients[allWsClients.length - 1]?.terminate()

    await waitFor(200)

    // Must receive exactly one leave per channel — the Map-snapshot fix
    // prevents the for-of loop from skipping channels as it mutates.
    expect(leaveChannels.sort()).toEqual([ch1, ch2, ch3].sort())

    unsub()
    observer.destroy()
    dropper.destroy()
    await harness.teardown()
  })
})

describe('Regression: authenticate throws (not null) causes 4001', () => {
  it('closes the WebSocket with code 4001 when authenticate throws', async () => {
    const harness = await createTestHarness({
      authenticate: async () => {
        throw new Error('DB unavailable')
      },
    })

    const client = connectClient(harness.port)
    client.connect()

    // The client should be pushed to 'reconnecting' because the server
    // closed the connection right after the upgrade.
    await nextStatus(client, 'reconnecting')
    expect(client.status).toBe('reconnecting')

    client.destroy()
    await harness.teardown()
  })
})

describe('Regression: presence data merging — late joiners get full state', () => {
  it('accumulates incremental updates so late joiners receive the merged state via sync', async () => {
    const harness = await createTestHarness()
    const earlyClient = connectClient(harness.port)
    const lateClient = connectClient(harness.port)
    earlyClient.connect()
    lateClient.connect()
    await Promise.all([
      nextStatus(earlyClient, 'connected'),
      nextStatus(lateClient, 'connected'),
    ])

    const key = serializeKey(['doc', { id: 'merge-test' }])

    // earlyClient joins then incrementally updates different fields
    earlyClient.presenceJoin(key, { name: 'Alice', cursor: null, status: 'viewing' })
    await waitFor(30)
    earlyClient.presenceUpdate(key, { cursor: { x: 100, y: 200 } })
    await waitFor(30)
    earlyClient.presenceUpdate(key, { status: 'editing' })
    await waitFor(30)

    // lateClient joins and should receive the fully merged state in the sync
    const syncPromise = new Promise<{
      users: Array<{ connectionId: string; data: unknown }>
    }>((resolve) => {
      const unsub = lateClient.onPresence((presenceKey, event) => {
        if (presenceKey === key && event.type === 'sync') {
          unsub()
          resolve(event)
        }
      })
    })

    lateClient.presenceJoin(key, { name: 'Bob', cursor: null, status: 'viewing' })
    const sync = await syncPromise

    const alice = sync.users.find(
      (u) => (u.data as Record<string, unknown>).name === 'Alice',
    )
    expect(alice).toBeDefined()
    // All three fields should reflect the accumulated state, not just the last delta
    expect((alice!.data as Record<string, unknown>).cursor).toEqual({ x: 100, y: 200 })
    expect((alice!.data as Record<string, unknown>).status).toBe('editing')

    earlyClient.destroy()
    lateClient.destroy()
    await harness.teardown()
  })
})

describe('Regression: custom WebSocket path', () => {
  it('accepts connections on a user-specified path', async () => {
    const httpServer = createServer()
    const realtime = createRealtimeServer({
      adapter: memoryAdapter(),
      path: '/_rt',
    })
    realtime.attach(httpServer)
    await new Promise<void>((resolve) => httpServer.listen(0, resolve))
    const port = (httpServer.address() as { port: number }).port

    const client = createRealtimeClient({
      url: `ws://localhost:${port}/_rt`,
      reconnect: { initialDelay: 100, maxDelay: 500, jitter: 0 },
    })
    client.connect()
    await nextStatus(client, 'connected')
    expect(client.status).toBe('connected')

    client.destroy()
    await realtime.close()
    await new Promise<void>((resolve, reject) =>
      httpServer.close((err) => (err ? reject(err) : resolve())),
    )
  })
})

describe('Regression: publish with no subscribers does not throw', () => {
  it('resolves without error when no client is subscribed to the key', async () => {
    const harness = await createTestHarness()
    await expect(
      harness.realtime.publish(['todos', { projectId: 'ghost' }]),
    ).resolves.toBeUndefined()
    await harness.teardown()
  })
})

describe('Regression: createRealtimeClient requires url outside browser', () => {
  it('throws synchronously when url is omitted in a non-browser (Node.js) environment', () => {
    // The test runner is Node.js where window is undefined.
    // resolveUrl() must throw rather than silently default to localhost.
    expect(() => createRealtimeClient()).toThrow(/No WebSocket URL provided/)
  })
})

describe('Regression: server instances are isolated', () => {
  it('two server instances on different ports do not share subscription state', async () => {
    const harness1 = await createTestHarness()
    const harness2 = await createTestHarness()

    const clientA = connectClient(harness1.port)
    const clientB = connectClient(harness2.port)
    clientA.connect()
    clientB.connect()
    await Promise.all([
      nextStatus(clientA, 'connected'),
      nextStatus(clientB, 'connected'),
    ])

    const key = serializeKey(['shared'])
    clientA.subscribe(key)
    clientB.subscribe(key)
    await waitForServerProcessing()

    // Publishing on harness1 must NOT reach clientB (connected to harness2)
    let clientBReceived = false
    const unsubB = clientB.onInvalidate(() => {
      clientBReceived = true
    })

    const clientAInvalidated = nextInvalidate(clientA)
    await harness1.realtime.publish(['shared'])
    expect(await clientAInvalidated).toBe(key)

    await waitFor(100)
    expect(clientBReceived).toBe(false)

    unsubB()
    clientA.destroy()
    clientB.destroy()
    await harness1.teardown()
    await harness2.teardown()
  })
})

describe('Regression: presence sync on reconnect rejoin', () => {
  it('receives a presence:sync after reconnecting to a channel', async () => {
    const harness = await createTestHarness()
    const persistentClient = connectClient(harness.port)
    const reconnectingClient = connectClient(harness.port)
    persistentClient.connect()
    reconnectingClient.connect()
    await Promise.all([
      nextStatus(persistentClient, 'connected'),
      nextStatus(reconnectingClient, 'connected'),
    ])

    const key = serializeKey(['doc', { id: 'rejoin-sync' }])

    // persistentClient is already in the channel when reconnectingClient joins
    persistentClient.presenceJoin(key, { name: 'Bob' })
    await waitFor(50)

    reconnectingClient.presenceJoin(key, { name: 'Alice' })
    await waitFor(50)

    // Register the sync listener BEFORE forcing the disconnect so it catches
    // the sync that arrives after the automatic rejoin.
    const syncAfterReconnect = new Promise<{
      users: Array<{ connectionId: string; data: unknown }>
    }>((resolve) => {
      const unsub = reconnectingClient.onPresence((presenceKey, event) => {
        if (presenceKey === key && event.type === 'sync') {
          unsub()
          resolve(event)
        }
      })
    })

    // Force-terminate reconnectingClient's socket
    const { wss } = harness.realtime
    if (!wss) throw new Error('No wss')
    const wsClients = Array.from(wss.clients)
    // The last client to connect is reconnectingClient
    wsClients[wsClients.length - 1]?.terminate()

    await nextStatus(reconnectingClient, 'reconnecting')
    await nextStatus(reconnectingClient, 'connected')

    // After reconnect the client re-sends presence:join and the server
    // responds with presence:sync containing the current roster.
    const sync = await syncAfterReconnect

    const bob = sync.users.find(
      (u) => (u.data as Record<string, unknown>).name === 'Bob',
    )
    expect(bob).toBeDefined()

    persistentClient.destroy()
    reconnectingClient.destroy()
    await harness.teardown()
  })
})

describe('Regression: batchInvalidateAll fires first batch immediately after reconnect', () => {
  it('delivers the first batch without waiting for the stagger delay', async () => {
    const harness = await createTestHarness()

    // Use a very large stagger (500 ms) to make the timing observable.
    // If the first batch were delayed by stagger, it would arrive ~500 ms
    // after reconnect — much longer than the 50 ms budget we check.
    const client = createRealtimeClient({
      url: `ws://localhost:${harness.port}/_realtime`,
      reconnect: { initialDelay: 100, maxDelay: 500, jitter: 0 },
      refetch: { stagger: 500, maxConcurrency: 5 },
    })

    client.connect()
    await nextStatus(client, 'connected')

    // Subscribe to 3 keys — all fit within the first batch (maxConcurrency 5)
    const keys = ['ka', 'kb', 'kc'].map((k) => serializeKey([k]))
    keys.forEach((k) => client.subscribe(k))
    await waitForServerProcessing()

    // Force disconnect to trigger automatic reconnect + batchInvalidateAll
    const { wss } = harness.realtime
    if (!wss) throw new Error('No wss')
    Array.from(wss.clients).forEach((ws) => ws.terminate())

    await nextStatus(client, 'reconnecting')

    const received: string[] = []
    const unsub = client.onInvalidate((k) => received.push(k))

    await nextStatus(client, 'connected')

    // Give 50 ms — enough for the synchronous first flush but not enough
    // for a 500 ms stagger delay.
    await waitFor(50)

    expect(received.sort()).toEqual(keys.sort())

    unsub()
    client.destroy()
    await harness.teardown()
  })
})

describe('Regression: scheduleReconnect does not double-increment attempt on concurrent calls', () => {
  it('second reconnect attempt uses correct exponential backoff', async () => {
    const harness = await createTestHarness()
    // initialDelay 100 ms, jitter 0 so delays are deterministic
    const client = connectClient(harness.port)

    client.connect()
    await nextStatus(client, 'connected')

    // First forced disconnect → reconnect attempt 1
    const { wss } = harness.realtime
    if (!wss) throw new Error('No wss')
    Array.from(wss.clients).forEach((ws) => ws.terminate())
    await nextStatus(client, 'reconnecting')
    await nextStatus(client, 'connected')

    // Second forced disconnect → reconnect attempt 1 again (counter reset on
    // successful connect). Delay should be 100 ms, not 400 ms (double-increment
    // would produce 100*2^2 = 400 ms which would timeout the 250 ms window).
    Array.from(wss.clients).forEach((ws) => ws.terminate())
    await nextStatus(client, 'reconnecting')

    // Reconnect should succeed within 250 ms (100 ms delay + overhead).
    // A double-incremented attempt would use a 400 ms delay, causing a timeout.
    const connectedPromise = nextStatus(client, 'connected')
    await expect(Promise.race([
      connectedPromise,
      waitFor(250).then(() => Promise.reject(new Error('timeout'))),
    ])).resolves.toBe('connected')

    client.destroy()
    await harness.teardown()
  })
})
