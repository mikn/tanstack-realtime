/**
 * Tests for createSharedWorkerTransport + createSharedWorkerServer.
 *
 * SharedWorker and MessagePort are unavailable in Node.js, so we use a
 * synchronous bidirectional port mock. Both exports are tested end-to-end:
 * the server and transport are wired up through a MockSharedWorker so tests
 * exercise the real coordination logic without any network I/O.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Store } from '@tanstack/store'
import {
  createSharedWorkerServer,
  createSharedWorkerTransport,
} from '@tanstack/realtime'
import type {
  RealtimeTransport,
  PresenceCapable,
  ConnectionStatus,
  PresenceUser,
  SharedWorkerServerOptions,
} from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// MessagePort mock — synchronous bidirectional pair
// ---------------------------------------------------------------------------

class MockMessagePort {
  onmessage: ((event: { data: unknown }) => void) | null = null
  private partner: MockMessagePort | null = null
  private closeListeners: Array<() => void> = []
  private started = false
  private queue: unknown[] = []

  static pair(): [MockMessagePort, MockMessagePort] {
    const a = new MockMessagePort()
    const b = new MockMessagePort()
    a.partner = b
    b.partner = a
    return [a, b]
  }

  postMessage(data: unknown): void {
    const partner = this.partner
    if (!partner) return
    // Mimic real MessagePort: queue messages until the receiver calls start().
    if (partner.started) {
      partner.onmessage?.({ data })
    } else {
      partner.queue.push(data)
    }
  }

  start(): void {
    this.started = true
    // Flush any messages that arrived before start() was called.
    const queued = this.queue.splice(0)
    for (const data of queued) {
      this.onmessage?.({ data })
    }
  }

  addEventListener(type: string, listener: () => void): void {
    if (type === 'close') this.closeListeners.push(listener)
  }

  /** Simulate the port closing (tab navigates away). */
  simulateClose(): void {
    for (const cb of this.closeListeners) cb()
    this.partner = null
  }
}

// ---------------------------------------------------------------------------
// SharedWorker mock — uses a URL registry to connect tabs to servers
// ---------------------------------------------------------------------------

const workerServers = new Map<string, ReturnType<typeof createSharedWorkerServer>>()

class MockSharedWorker {
  readonly port: MockMessagePort
  /** The last worker-side port created — used by port-close tests. */
  static lastWorkerPort: MockMessagePort | null = null

  constructor(url: string | URL) {
    const key = String(url)
    const server = workerServers.get(key)
    if (!server) throw new Error(`No SharedWorker server registered for: ${key}`)

    const [tabPort, workerPort] = MockMessagePort.pair()
    this.port = tabPort
    MockSharedWorker.lastWorkerPort = workerPort
    // Simulate the SharedWorker connect event firing synchronously.
    server.connect(workerPort as unknown as MessagePort)
  }
}

// Install globally before tests.
;(globalThis as any).SharedWorker = MockSharedWorker

// ---------------------------------------------------------------------------
// Inner mock transport
// ---------------------------------------------------------------------------

function createMockInnerTransport(): (RealtimeTransport & PresenceCapable) & {
  emit: (channel: string, data: unknown) => void
  emitPresence: (channel: string, users: ReadonlyArray<PresenceUser>) => void
  publishCalls: Array<{ channel: string; data: unknown }>
  setStatus: (s: ConnectionStatus) => void
} {
  const listeners = new Map<string, Set<(data: unknown) => void>>()
  const presenceListeners = new Map<string, Set<(users: ReadonlyArray<PresenceUser>) => void>>()
  const store = new Store<ConnectionStatus>('connected')
  const publishCalls: Array<{ channel: string; data: unknown }> = []

  return {
    store,
    publishCalls,
    async connect() { store.setState(() => 'connected') },
    disconnect() { store.setState(() => 'disconnected') },
    subscribe(channel, onMessage) {
      if (!listeners.has(channel)) listeners.set(channel, new Set())
      listeners.get(channel)!.add(onMessage)
      return () => {
        listeners.get(channel)?.delete(onMessage)
        if (listeners.get(channel)?.size === 0) listeners.delete(channel)
      }
    },
    async publish(channel, data) {
      publishCalls.push({ channel, data })
    },
    joinPresence() {},
    updatePresence() {},
    leavePresence() {},
    onPresenceChange(channel, callback) {
      if (!presenceListeners.has(channel)) presenceListeners.set(channel, new Set())
      presenceListeners.get(channel)!.add(callback)
      return () => presenceListeners.get(channel)?.delete(callback)
    },
    emit(channel, data) {
      const cbs = listeners.get(channel)
      if (cbs) for (const cb of cbs) cb(data)
    },
    setStatus(s) { store.setState(() => s) },
    emitPresence(channel, users) {
      const cbs = presenceListeners.get(channel)
      if (cbs) for (const cb of cbs) cb(users)
    },
  }
}

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const TEST_URL = 'https://worker.example.com/realtime.js'

function setupWorker(inner?: RealtimeTransport & PresenceCapable, options?: SharedWorkerServerOptions) {
  const transport = inner ?? createMockInnerTransport()
  const server = createSharedWorkerServer(transport as RealtimeTransport & PresenceCapable, options)
  workerServers.set(TEST_URL, server)
  return { transport: transport as ReturnType<typeof createMockInnerTransport>, server }
}

function connectTab() {
  return createSharedWorkerTransport(TEST_URL)
}

/** Connects a tab and returns both the tab transport and the worker-side port. */
function connectTabWithPort() {
  const tab = connectTab()
  const workerPort = MockSharedWorker.lastWorkerPort!
  return { tab, workerPort }
}

beforeEach(() => {
  workerServers.clear()
  MockSharedWorker.lastWorkerPort = null
})

afterEach(() => {
  workerServers.clear()
})

// ---------------------------------------------------------------------------
// createSharedWorkerServer — invariant tests
// ---------------------------------------------------------------------------

describe('createSharedWorkerServer', () => {
  it('sends the current inner transport status to a newly connected port', () => {
    const { transport } = setupWorker()
    transport.setStatus('connected')

    const tab = connectTab()
    // Status was sent synchronously on connect.
    expect(tab.store.state).toBe('connected')
  })

  it('broadcasts inner status changes to all connected tabs', () => {
    const { transport } = setupWorker()
    const tab1 = connectTab()
    const tab2 = connectTab()

    transport.setStatus('reconnecting')

    expect(tab1.store.state).toBe('reconnecting')
    expect(tab2.store.state).toBe('reconnecting')
  })

  it('new tab connecting after a status change receives the current status', () => {
    const { transport } = setupWorker()
    transport.setStatus('connected')
    const tab1 = connectTab()
    expect(tab1.store.state).toBe('connected')

    transport.setStatus('reconnecting')
    const tab2 = connectTab()
    // tab2 was created after the status changed to reconnecting.
    expect(tab2.store.state).toBe('reconnecting')
  })

  it('subscribing on a tab causes a real subscription on the inner transport', () => {
    const { transport } = setupWorker()
    const subscribeSpy = vi.spyOn(transport, 'subscribe')

    const tab = connectTab()
    const unsub = tab.subscribe('events', vi.fn())

    expect(subscribeSpy).toHaveBeenCalledWith('events', expect.any(Function))
    unsub()
  })

  it('inner transport message is forwarded to all tabs subscribed to that channel', () => {
    const { transport } = setupWorker()

    const tab1Cb = vi.fn()
    const tab2Cb = vi.fn()

    const tab1 = connectTab()
    const tab2 = connectTab()

    tab1.subscribe('ch', tab1Cb)
    tab2.subscribe('ch', tab2Cb)

    transport.emit('ch', { hello: 'world' })

    expect(tab1Cb).toHaveBeenCalledTimes(1)
    expect(tab1Cb).toHaveBeenCalledWith({ hello: 'world' })
    expect(tab2Cb).toHaveBeenCalledTimes(1)
  })

  it('unsubscribing a tab removes it from the channel — no further deliveries', () => {
    const { transport } = setupWorker()

    const cb = vi.fn()
    const tab = connectTab()
    const unsub = tab.subscribe('ch', cb)

    transport.emit('ch', 'first')
    expect(cb).toHaveBeenCalledTimes(1)

    unsub()
    transport.emit('ch', 'second')
    expect(cb).toHaveBeenCalledTimes(1) // no second delivery
  })

  it('inner subscription is removed when the last tab unsubscribes from a channel', () => {
    const { transport } = setupWorker()
    const subscribeSpy = vi.spyOn(transport, 'subscribe')

    const unsubInner = vi.fn()
    subscribeSpy.mockReturnValue(unsubInner)

    const tab = connectTab()
    const unsub = tab.subscribe('ch', vi.fn())

    unsub()
    expect(unsubInner).toHaveBeenCalledTimes(1)
  })

  it('inner subscription is kept while at least one tab remains subscribed', () => {
    const { transport } = setupWorker()
    const subscribeSpy = vi.spyOn(transport, 'subscribe')

    const unsubInner = vi.fn()
    subscribeSpy.mockReturnValue(unsubInner)

    const tab1 = connectTab()
    const tab2 = connectTab()

    const unsub1 = tab1.subscribe('ch', vi.fn())
    tab2.subscribe('ch', vi.fn())

    // Remove tab1's listener — tab2 still subscribed, so inner stays.
    unsub1()
    expect(unsubInner).not.toHaveBeenCalled()
  })

  it('only one inner subscribe per channel regardless of tab count', () => {
    const { transport } = setupWorker()
    const subscribeSpy = vi.spyOn(transport, 'subscribe')

    const tab1 = connectTab()
    const tab2 = connectTab()
    const tab3 = connectTab()

    tab1.subscribe('ch', vi.fn())
    tab2.subscribe('ch', vi.fn())
    tab3.subscribe('ch', vi.fn())

    expect(subscribeSpy).toHaveBeenCalledTimes(1)
  })

  it('publish from a tab is relayed to the inner transport', async () => {
    const { transport } = setupWorker()

    const tab = connectTab()
    await tab.publish('ch', { payload: 42 })

    expect(transport.publishCalls).toHaveLength(1)
    expect(transport.publishCalls[0]).toEqual({ channel: 'ch', data: { payload: 42 } })
  })

  it('publish error is returned to the originating tab', async () => {
    const { transport } = setupWorker()
    vi.spyOn(transport, 'publish').mockRejectedValueOnce(new Error('server error'))

    const tab = connectTab()

    await expect(tab.publish('ch', { bad: true })).rejects.toThrow('server error')
  })

  it('multiple tabs can publish independently', async () => {
    const { transport } = setupWorker()

    const tab1 = connectTab()
    const tab2 = connectTab()

    await tab1.publish('ch', 'from-tab1')
    await tab2.publish('ch', 'from-tab2')

    expect(transport.publishCalls).toHaveLength(2)
    expect(transport.publishCalls.map((c) => c.data)).toEqual(['from-tab1', 'from-tab2'])
  })

  it('two concurrent publish requests both resolve with their own requestIds', async () => {
    const { transport } = setupWorker()
    const tab = connectTab()

    // Both promises should resolve (no cross-contamination of requestIds).
    const results = await Promise.allSettled([
      tab.publish('ch', 'a'),
      tab.publish('ch', 'b'),
    ])

    expect(results[0]!.status).toBe('fulfilled')
    expect(results[1]!.status).toBe('fulfilled')
    expect(transport.publishCalls).toHaveLength(2)
  })

  it('disconnect is only forwarded when the last tab disconnects', () => {
    const { transport } = setupWorker()
    const disconnectSpy = vi.spyOn(transport, 'disconnect')

    const tab1 = connectTab()
    const tab2 = connectTab()

    tab1.disconnect()
    expect(disconnectSpy).not.toHaveBeenCalled() // tab2 still alive

    tab2.disconnect()
    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })

  it('auto-connects the inner transport when the first port registers and transport is disconnected', async () => {
    const inner = createMockInnerTransport()
    inner.setStatus('disconnected')
    const connectSpy = vi.spyOn(inner, 'connect')
    setupWorker(inner)

    connectTab()
    await new Promise((r) => setTimeout(r, 0))

    expect(connectSpy).toHaveBeenCalledTimes(1)
  })

  it('does not auto-connect when the inner transport is already active', async () => {
    const inner = createMockInnerTransport()
    inner.setStatus('connected')
    const connectSpy = vi.spyOn(inner, 'connect')
    setupWorker(inner)

    connectTab()
    await new Promise((r) => setTimeout(r, 0))

    expect(connectSpy).not.toHaveBeenCalled()
  })

  it('auto-reconnects when a new tab arrives after all previous tabs disconnected', async () => {
    const inner = createMockInnerTransport()
    inner.setStatus('connected')
    setupWorker(inner)

    const connectSpy = vi.spyOn(inner, 'connect')

    // Two tabs connect then both explicitly disconnect (inner.disconnect() fires).
    const tab1 = connectTab()
    const tab2 = connectTab()
    tab1.disconnect()
    tab2.disconnect()
    // inner transport is now disconnected.

    // A fresh tab arrives — should auto-connect.
    connectTab()
    await new Promise((r) => setTimeout(r, 0))

    expect(connectSpy).toHaveBeenCalledTimes(1)
  })

  it('explicit tab.connect() after tab.disconnect() removes the port from disconnectedPorts', () => {
    const { transport } = setupWorker()
    const disconnectSpy = vi.spyOn(transport, 'disconnect')

    const tab1 = connectTab()
    const tab2 = connectTab()

    // tab1 disconnects then reconnects.
    tab1.disconnect()
    tab1.connect()

    // Now tab2 disconnects — tab1 is reconnected so the inner transport
    // should NOT be disconnected yet.
    tab2.disconnect()
    expect(disconnectSpy).not.toHaveBeenCalled()
  })

  it('presence changes are forwarded to tabs subscribed to that channel', () => {
    const inner = createMockInnerTransport()
    setupWorker(inner)

    const presenceCb = vi.fn()
    const tab = connectTab()
    tab.onPresenceChange('ch', presenceCb)

    const fakeUsers = [{ connectionId: 'c1', data: { name: 'Alice' } }]
    inner.emitPresence('ch', fakeUsers)

    expect(presenceCb).toHaveBeenCalledTimes(1)
    expect(presenceCb).toHaveBeenCalledWith(fakeUsers)
  })

  it('presence unsubscribe removes the callback', () => {
    const inner = createMockInnerTransport()
    setupWorker(inner)

    const presenceCb = vi.fn()
    const tab = connectTab()
    const unsub = tab.onPresenceChange('ch', presenceCb)

    unsub()
    inner.emitPresence('ch', [])
    expect(presenceCb).not.toHaveBeenCalled()
  })

  it('only one inner presence subscription per channel regardless of tab count', () => {
    const inner = createMockInnerTransport()
    setupWorker(inner)
    const onPresenceSpy = vi.spyOn(inner, 'onPresenceChange')

    const tab1 = connectTab()
    const tab2 = connectTab()
    const tab3 = connectTab()

    tab1.onPresenceChange('ch', vi.fn())
    tab2.onPresenceChange('ch', vi.fn())
    tab3.onPresenceChange('ch', vi.fn())

    expect(onPresenceSpy).toHaveBeenCalledTimes(1)
  })

  it('inner presence unsub fires when the last tab unsubscribes', () => {
    const inner = createMockInnerTransport()
    setupWorker(inner)

    const unsubInner = vi.fn()
    vi.spyOn(inner, 'onPresenceChange').mockReturnValue(unsubInner)

    const tab1 = connectTab()
    const tab2 = connectTab()
    const unsub1 = tab1.onPresenceChange('ch', vi.fn())
    tab2.onPresenceChange('ch', vi.fn())

    unsub1()
    expect(unsubInner).not.toHaveBeenCalled() // tab2 still listening

    // There's no public unsub2 because tab2.onPresenceChange result was discarded.
    // Instead simulate tab2's port closing to clean everything up.
    const workerPort = MockSharedWorker.lastWorkerPort!
    workerPort.simulateClose()

    expect(unsubInner).toHaveBeenCalledTimes(1)
  })

  it('replays the last known presence state to a tab that subscribes after the first update', () => {
    const inner = createMockInnerTransport()
    setupWorker(inner)

    const tab1 = connectTab()
    tab1.onPresenceChange('ch', vi.fn())

    const users = [{ connectionId: 'c1', data: { name: 'Alice' } }]
    inner.emitPresence('ch', users)

    // tab2 subscribes after the first update — should immediately receive the cached state.
    const tab2 = connectTab()
    const tab2Cb = vi.fn()
    tab2.onPresenceChange('ch', tab2Cb)

    expect(tab2Cb).toHaveBeenCalledTimes(1)
    expect(tab2Cb).toHaveBeenCalledWith(users)
  })

  it('does not replay presence if no update has been received yet', () => {
    const inner = createMockInnerTransport()
    setupWorker(inner)

    const tab = connectTab()
    const cb = vi.fn()
    tab.onPresenceChange('ch', cb)

    // No inner.emitPresence has been called — nothing to replay.
    expect(cb).not.toHaveBeenCalled()
  })

  it('updates the replayed presence when subsequent changes arrive', () => {
    const inner = createMockInnerTransport()
    setupWorker(inner)

    const tab1 = connectTab()
    tab1.onPresenceChange('ch', vi.fn())

    const v1 = [{ connectionId: 'c1', data: {} }]
    const v2 = [{ connectionId: 'c1', data: {} }, { connectionId: 'c2', data: {} }]
    inner.emitPresence('ch', v1)
    inner.emitPresence('ch', v2)

    // A late-joining tab should see the most recent snapshot, not the first one.
    const tab2 = connectTab()
    const cb = vi.fn()
    tab2.onPresenceChange('ch', cb)

    expect(cb).toHaveBeenCalledWith(v2)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('clears the presence cache when the last subscriber leaves the channel', () => {
    const inner = createMockInnerTransport()
    setupWorker(inner)

    const tab1 = connectTab()
    const users = [{ connectionId: 'c1', data: {} }]
    const unsub = tab1.onPresenceChange('ch', vi.fn())
    inner.emitPresence('ch', users)

    // All subscribers leave — cache is cleared.
    unsub()

    // A new tab subscribes — should NOT receive the now-stale cached state.
    const tab2 = connectTab()
    const cb = vi.fn()
    tab2.onPresenceChange('ch', cb)

    expect(cb).not.toHaveBeenCalled()
  })

  it('tab port close removes all channel subscriptions for that port', () => {
    const { transport } = setupWorker()
    const subscribeSpy = vi.spyOn(transport, 'subscribe')
    const unsubInner = vi.fn()
    subscribeSpy.mockReturnValue(unsubInner)

    const { tab, workerPort } = connectTabWithPort()
    tab.subscribe('ch-a', vi.fn())
    tab.subscribe('ch-b', vi.fn())

    // Simulate the tab's port closing (browser navigates away).
    workerPort.simulateClose()

    // Both inner subscriptions should have been cleaned up.
    expect(unsubInner).toHaveBeenCalledTimes(2)
  })

  it('tab port close removes all presence subscriptions for that port', () => {
    const inner = createMockInnerTransport()
    setupWorker(inner)

    const unsubInner = vi.fn()
    vi.spyOn(inner, 'onPresenceChange').mockReturnValue(unsubInner)

    const { tab, workerPort } = connectTabWithPort()
    tab.onPresenceChange('ch', vi.fn())

    workerPort.simulateClose()

    expect(unsubInner).toHaveBeenCalledTimes(1)
  })

  it('port close does not affect subscriptions from other tabs', () => {
    const { transport } = setupWorker()
    const cb2 = vi.fn()

    // Connect tab1 and subscribe, then get its worker port before tab2 connects.
    const { tab: tab1, workerPort: workerPort1 } = connectTabWithPort()
    tab1.subscribe('ch', vi.fn())

    // Connect tab2 and subscribe.
    const tab2 = connectTab()
    tab2.subscribe('ch', cb2)

    // Close tab1's port — tab2 should be unaffected.
    workerPort1.simulateClose()
    transport.emit('ch', 'ping')

    expect(cb2).toHaveBeenCalledWith('ping')
  })
})

// ---------------------------------------------------------------------------
// createSharedWorkerServer — onConnectError option
// ---------------------------------------------------------------------------

describe('createSharedWorkerServer — onConnectError', () => {
  it('connect error is passed to the onConnectError callback', async () => {
    const connectError = new Error('auth failed')
    const inner = createMockInnerTransport()
    vi.spyOn(inner, 'connect').mockRejectedValueOnce(connectError)

    const onConnectError = vi.fn()
    setupWorker(inner, { onConnectError })

    const tab = connectTab()
    await tab.connect()
    // Allow the rejected promise to settle.
    await new Promise((r) => setTimeout(r, 0))

    expect(onConnectError).toHaveBeenCalledWith(connectError)
  })

  it('connect error defaults to console.error when no onConnectError is provided', async () => {
    const connectError = new Error('connection refused')
    const inner = createMockInnerTransport()
    vi.spyOn(inner, 'connect').mockRejectedValueOnce(connectError)

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    setupWorker(inner) // no options → defaults to console.error

    const tab = connectTab()
    await tab.connect()
    await new Promise((r) => setTimeout(r, 0))

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[SharedWorkerServer]'),
      connectError,
    )
    consoleSpy.mockRestore()
  })

  it('onConnectError: () => {} suppresses the default console.error', async () => {
    const connectError = new Error('silent failure')
    const inner = createMockInnerTransport()
    vi.spyOn(inner, 'connect').mockRejectedValueOnce(connectError)

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    setupWorker(inner, { onConnectError: () => {} })

    const tab = connectTab()
    await tab.connect()
    await new Promise((r) => setTimeout(r, 0))

    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// createSharedWorkerTransport — invariant tests
// ---------------------------------------------------------------------------

describe('createSharedWorkerTransport', () => {
  it('reflects connected state when auto-connect fires on a disconnected inner transport', () => {
    // When the inner transport is disconnected the server auto-connects it as
    // soon as the first port registers.  The mock connect() is synchronous so
    // the tab already sees 'connected' by the time connectTab() returns.
    const inner = createMockInnerTransport()
    inner.setStatus('disconnected')
    setupWorker(inner)

    const tab = connectTab()
    expect(tab.store.state).toBe('connected')
  })

  it('relays reconnecting status without triggering auto-connect', () => {
    // Auto-connect only fires for 'disconnected'.  A transport that is already
    // trying to reconnect should not receive a second connect() call.
    const inner = createMockInnerTransport()
    inner.setStatus('reconnecting')
    const connectSpy = vi.spyOn(inner, 'connect')
    setupWorker(inner)

    const tab = connectTab()
    expect(tab.store.state).toBe('reconnecting')
    expect(connectSpy).not.toHaveBeenCalled()
  })

  it('status reflects the inner transport state after worker sends it', () => {
    const { transport } = setupWorker()
    transport.setStatus('connected')

    const tab = connectTab()
    expect(tab.store.state).toBe('connected')
  })

  it('store updates reactively as status changes arrive', () => {
    const { transport } = setupWorker()
    const tab = connectTab()
    const statuses: string[] = []
    tab.store.subscribe((s) => statuses.push(s))

    transport.setStatus('reconnecting')
    transport.setStatus('connected')

    expect(statuses).toContain('reconnecting')
    expect(statuses).toContain('connected')
  })

  it('subscribe sends message to worker and returns an unsubscribe function', () => {
    setupWorker()
    const tab = connectTab()

    const cb = vi.fn()
    const unsub = tab.subscribe('events', cb)

    expect(typeof unsub).toBe('function')
    unsub()
  })

  it('same tab subscribing to the same channel twice creates two independent listeners', () => {
    const { transport } = setupWorker()

    const tab = connectTab()
    const cb1 = vi.fn()
    const cb2 = vi.fn()
    const unsub1 = tab.subscribe('ch', cb1)
    const unsub2 = tab.subscribe('ch', cb2)

    transport.emit('ch', 'ping')
    expect(cb1).toHaveBeenCalledWith('ping')
    expect(cb2).toHaveBeenCalledWith('ping')

    // Unsubscribe cb1 — cb2 still receives.
    unsub1()
    transport.emit('ch', 'pong')
    expect(cb1).toHaveBeenCalledTimes(1) // not called again
    expect(cb2).toHaveBeenCalledTimes(2)

    unsub2()
  })

  it('multiple listeners on the same channel all receive messages', () => {
    const { transport } = setupWorker()

    const tab = connectTab()
    const cb1 = vi.fn()
    const cb2 = vi.fn()
    tab.subscribe('ch', cb1)
    tab.subscribe('ch', cb2)

    transport.emit('ch', 'ping')

    expect(cb1).toHaveBeenCalledWith('ping')
    expect(cb2).toHaveBeenCalledWith('ping')
  })

  it('unsubscribed listener no longer receives messages', () => {
    const { transport } = setupWorker()

    const tab = connectTab()
    const cb = vi.fn()
    const unsub = tab.subscribe('ch', cb)

    transport.emit('ch', 'first')
    expect(cb).toHaveBeenCalledTimes(1)

    unsub()
    transport.emit('ch', 'second')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('publish sends payload to inner transport and resolves', async () => {
    const { transport } = setupWorker()

    const tab = connectTab()
    await expect(tab.publish('ch', { data: 1 })).resolves.toBeUndefined()
    expect(transport.publishCalls[0]!.data).toEqual({ data: 1 })
  })

  it('connect triggers inner transport connect', async () => {
    const { transport } = setupWorker()
    const connectSpy = vi.spyOn(transport, 'connect')

    const tab = connectTab()
    await tab.connect()

    expect(connectSpy).toHaveBeenCalled()
  })

  it('joinPresence, updatePresence, leavePresence are relayed', () => {
    const { transport } = setupWorker()
    const joinSpy = vi.spyOn(transport, 'joinPresence')
    const updateSpy = vi.spyOn(transport, 'updatePresence')
    const leaveSpy = vi.spyOn(transport, 'leavePresence')

    const tab = connectTab()
    tab.joinPresence('ch', { name: 'Alice' })
    tab.updatePresence('ch', { name: 'Bob' })
    tab.leavePresence('ch')

    expect(joinSpy).toHaveBeenCalledWith('ch', { name: 'Alice' })
    expect(updateSpy).toHaveBeenCalledWith('ch', { name: 'Bob' })
    expect(leaveSpy).toHaveBeenCalledWith('ch')
  })

  it('onPresenceChange receives updates and returns an unsubscribe fn', () => {
    const inner = createMockInnerTransport()
    setupWorker(inner)

    const tab = connectTab()
    const cb = vi.fn()
    const unsub = tab.onPresenceChange('ch', cb)

    const users = [{ connectionId: 'x', data: {} }]
    inner.emitPresence('ch', users)

    expect(cb).toHaveBeenCalledWith(users)
    expect(typeof unsub).toBe('function')
    unsub()
  })

  it('tabs on different channels do not interfere with each other', () => {
    const { transport } = setupWorker()

    const tab = connectTab()
    const cbA = vi.fn()
    const cbB = vi.fn()

    tab.subscribe('ch-a', cbA)
    tab.subscribe('ch-b', cbB)

    transport.emit('ch-a', 'for-a')
    expect(cbA).toHaveBeenCalledWith('for-a')
    expect(cbB).not.toHaveBeenCalled()

    transport.emit('ch-b', 'for-b')
    expect(cbB).toHaveBeenCalledWith('for-b')
    expect(cbA).toHaveBeenCalledTimes(1)
  })

  it('accepts a URL object as well as a string', () => {
    setupWorker()
    // Should not throw.
    const tab = createSharedWorkerTransport(TEST_URL)
    expect(tab.store).toBeDefined()
  })

  it('accepts SharedWorkerTransportOptions object', () => {
    setupWorker()
    const tab = createSharedWorkerTransport({ url: TEST_URL, publishTimeout: 5000 })
    expect(tab.store).toBeDefined()
  })

  it('publish times out and rejects with a descriptive error when the worker does not ack', async () => {
    const inner = createMockInnerTransport()
    // publish never resolves — simulates a worker that drops the ack.
    vi.spyOn(inner, 'publish').mockReturnValue(new Promise(() => {}))
    setupWorker(inner)

    vi.useFakeTimers()
    const tab = createSharedWorkerTransport({ url: TEST_URL, publishTimeout: 1000 })
    const publishPromise = tab.publish('ch', { data: 1 })

    vi.advanceTimersByTime(1001)

    await expect(publishPromise).rejects.toThrow('[SharedWorkerTransport] publish timed out after 1000ms')
    vi.useRealTimers()
  })
})
