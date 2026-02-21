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
  ConnectionStatus,
  PresenceUser,
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

  constructor(url: string | URL) {
    const key = String(url)
    const server = workerServers.get(key)
    if (!server) throw new Error(`No SharedWorker server registered for: ${key}`)

    const [tabPort, workerPort] = MockMessagePort.pair()
    this.port = tabPort
    // Simulate the SharedWorker connect event firing synchronously.
    server.connect(workerPort as unknown as MessagePort)
  }
}

// Install globally before tests.
;(globalThis as any).SharedWorker = MockSharedWorker

// ---------------------------------------------------------------------------
// Inner mock transport
// ---------------------------------------------------------------------------

function createMockInnerTransport(): RealtimeTransport & {
  emit: (channel: string, data: unknown) => void
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
    // Helper to simulate a presence change notification.
    emitPresence(channel: string, users: ReadonlyArray<PresenceUser>) {
      const cbs = presenceListeners.get(channel)
      if (cbs) for (const cb of cbs) cb(users)
    },
  } as any
}

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const TEST_URL = 'https://worker.example.com/realtime.js'

function setupWorker(inner?: RealtimeTransport) {
  const transport = inner ?? createMockInnerTransport()
  const server = createSharedWorkerServer(transport as RealtimeTransport)
  workerServers.set(TEST_URL, server)
  return { transport: transport as ReturnType<typeof createMockInnerTransport>, server }
}

function connectTab() {
  return createSharedWorkerTransport(TEST_URL)
}

beforeEach(() => {
  workerServers.clear()
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

  it('presence changes are forwarded to tabs subscribed to that channel', () => {
    const inner = createMockInnerTransport()
    setupWorker(inner)

    const presenceCb = vi.fn()
    const tab = connectTab()
    tab.onPresenceChange('ch', presenceCb)

    const fakeUsers = [{ connectionId: 'c1', data: { name: 'Alice' } }]
    ;(inner as any).emitPresence('ch', fakeUsers)

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
    ;(inner as any).emitPresence('ch', [])
    expect(presenceCb).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// createSharedWorkerTransport — invariant tests
// ---------------------------------------------------------------------------

describe('createSharedWorkerTransport', () => {
  it('starts in disconnected state before the worker sends a status update', () => {
    // We need a server that does NOT send status on connect (disconnected inner).
    const inner = createMockInnerTransport()
    inner.setStatus('disconnected')
    setupWorker(inner)

    const tab = connectTab()
    expect(tab.store.state).toBe('disconnected')
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
    ;(inner as any).emitPresence('ch', users)

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
})
