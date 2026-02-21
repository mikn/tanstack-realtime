/**
 * Tests for shared transport (createSharedTransport).
 *
 * Since BroadcastChannel is not available in Node.js, we mock it globally.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Store } from '@tanstack/store'
import { createSharedTransport } from '@tanstack/realtime'
import type {
  RealtimeTransport,
  ConnectionStatus,
  PresenceUser,
} from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// BroadcastChannel mock
// ---------------------------------------------------------------------------

class MockBroadcastChannel {
  static channels = new Map<string, Set<MockBroadcastChannel>>()

  name: string
  onmessage: ((event: { data: unknown }) => void) | null = null

  constructor(name: string) {
    this.name = name
    if (!MockBroadcastChannel.channels.has(name)) {
      MockBroadcastChannel.channels.set(name, new Set())
    }
    MockBroadcastChannel.channels.get(name)!.add(this)
  }

  postMessage(data: unknown) {
    const peers = MockBroadcastChannel.channels.get(this.name)
    if (peers) {
      for (const peer of peers) {
        if (peer !== this && peer.onmessage) {
          // Simulate async delivery (like real BroadcastChannel).
          peer.onmessage({ data })
        }
      }
    }
  }

  close() {
    MockBroadcastChannel.channels.get(this.name)?.delete(this)
  }

  static reset() {
    MockBroadcastChannel.channels.clear()
  }
}

// Install globally.
;(globalThis as any).BroadcastChannel = MockBroadcastChannel

// ---------------------------------------------------------------------------
// Mock inner transport
// ---------------------------------------------------------------------------

function createMockTransport(): RealtimeTransport & {
  emit: (channel: string, data: unknown) => void
  setStatus: (s: ConnectionStatus) => void
  publishCalls: Array<{ channel: string; data: unknown }>
} {
  const listeners = new Map<string, Set<(data: unknown) => void>>()
  const store = new Store<ConnectionStatus>('connected')
  const publishCalls: Array<{ channel: string; data: unknown }> = []

  return {
    store,
    publishCalls,
    async connect() {
      store.setState(() => 'connected')
    },
    disconnect() {
      store.setState(() => 'disconnected')
    },
    subscribe(channel, onMessage) {
      if (!listeners.has(channel)) listeners.set(channel, new Set())
      listeners.get(channel)!.add(onMessage)
      return () => {
        listeners.get(channel)?.delete(onMessage)
      }
    },
    async publish(channel, data) {
      publishCalls.push({ channel, data })
    },
    joinPresence() {},
    updatePresence() {},
    leavePresence() {},
    onPresenceChange(
      _ch: string,
      _cb: (users: ReadonlyArray<PresenceUser>) => void,
    ) {
      return () => {}
    },
    emit(channel: string, data: unknown) {
      const cbs = listeners.get(channel)
      if (cbs) for (const cb of cbs) cb(data)
    },
    setStatus(s: ConnectionStatus) {
      store.setState(() => s)
    },
  }
}

describe('createSharedTransport', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    MockBroadcastChannel.reset()
  })

  afterEach(() => {
    vi.useRealTimers()
    MockBroadcastChannel.reset()
  })

  it('creates a shared transport', () => {
    const transport = createSharedTransport({
      createTransport: createMockTransport,
      channelName: 'test-1',
    })
    expect(transport).toBeDefined()
    expect(transport.store).toBeDefined()
    transport.destroy()
  })

  it('elects itself as leader when alone', () => {
    const transport = createSharedTransport({
      createTransport: createMockTransport,
      channelName: 'test-alone',
    })

    // After the election timeout (~200ms), should be leader.
    vi.advanceTimersByTime(300)
    expect(transport.isLeader).toBe(true)
    transport.destroy()
  })

  it('provides subscribe method', () => {
    const mockInner = createMockTransport()
    const transport = createSharedTransport({
      createTransport: () => mockInner,
      channelName: 'test-sub',
    })
    vi.advanceTimersByTime(300) // become leader

    const cb = vi.fn()
    const unsub = transport.subscribe('ch', cb)
    expect(typeof unsub).toBe('function')

    unsub()
    transport.destroy()
  })

  it('provides publish method', async () => {
    const mockInner = createMockTransport()
    const transport = createSharedTransport({
      createTransport: () => mockInner,
      channelName: 'test-pub',
    })
    vi.advanceTimersByTime(300) // become leader

    await transport.publish('ch', { msg: 'hello' })
    expect(mockInner.publishCalls).toHaveLength(1)
    expect(mockInner.publishCalls[0]!.data).toEqual({ msg: 'hello' })
    transport.destroy()
  })

  it('destroy cleans up', () => {
    const transport = createSharedTransport({
      createTransport: createMockTransport,
      channelName: 'test-destroy',
    })
    vi.advanceTimersByTime(300)

    transport.destroy()
    // After destroy, operations should not throw.
    expect(transport.isLeader).toBe(false)
  })

  it('mirrors inner transport status', () => {
    const mockInner = createMockTransport()
    const transport = createSharedTransport({
      createTransport: () => mockInner,
      channelName: 'test-status',
    })
    vi.advanceTimersByTime(300) // become leader

    mockInner.setStatus('reconnecting')
    expect(transport.store.state).toBe('reconnecting')

    mockInner.setStatus('connected')
    expect(transport.store.state).toBe('connected')

    transport.destroy()
  })

  it('starts with disconnected status', () => {
    const transport = createSharedTransport({
      createTransport: createMockTransport,
      channelName: 'test-initial',
    })
    expect(transport.store.state).toBe('disconnected')
    transport.destroy()
  })

  it('has presence methods', () => {
    const transport = createSharedTransport({
      createTransport: createMockTransport,
      channelName: 'test-presence',
    })
    vi.advanceTimersByTime(300)

    // These should not throw.
    transport.joinPresence('ch', { name: 'test' })
    transport.updatePresence('ch', { name: 'updated' })
    transport.leavePresence('ch')

    const unsub = transport.onPresenceChange('ch', () => {})
    expect(typeof unsub).toBe('function')
    unsub()

    transport.destroy()
  })
})
