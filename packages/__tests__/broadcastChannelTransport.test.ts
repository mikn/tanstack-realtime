/**
 * Unit tests for BroadcastChannel-based multi-tab transport.
 *
 * Since BroadcastChannel doesn't exist in Node.js (prior to v22.x) and these
 * tests run in a single process, we mock BroadcastChannel to simulate
 * multi-tab scenarios. Each "tab" is a separate transport instance sharing
 * the same mock BroadcastChannel hub.
 */

import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { Store } from '@tanstack/store'
import type {
  ConnectionStatus,
  PresenceCapable,
  PresenceUser,
  RealtimeTransport,
} from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Mock BroadcastChannel — simulates cross-tab messaging within a test
// ---------------------------------------------------------------------------

type BCListener = (event: MessageEvent) => void

/** All open channels keyed by name. */
const channelRegistry = new Map<string, Set<MockBroadcastChannel>>()
/** All BC instances in creation order — useful for tests that need to close a specific tab's channel. */
const allInstances: Array<MockBroadcastChannel> = []

class MockBroadcastChannel {
  readonly name: string
  onmessage: BCListener | null = null
  private _closed = false

  constructor(name: string) {
    this.name = name
    if (!channelRegistry.has(name)) channelRegistry.set(name, new Set())
    channelRegistry.get(name)!.add(this)
    allInstances.push(this)
  }

  postMessage(data: unknown): void {
    if (this._closed) return
    const peers = channelRegistry.get(this.name)
    if (!peers) return
    for (const peer of peers) {
      // BroadcastChannel does NOT deliver to sender
      if (peer !== this && peer.onmessage) {
        peer.onmessage({ data } as MessageEvent)
      }
    }
  }

  close(): void {
    this._closed = true
    this.onmessage = null
    channelRegistry.get(this.name)?.delete(this)
  }
}

// Install the mock before importing the transport module
const g = globalThis as unknown as Record<string, unknown>
const savedBC = g['BroadcastChannel']
g['BroadcastChannel'] = MockBroadcastChannel

// Also mock crypto.randomUUID so we control tab IDs
let nextUUID = 0
const savedRandomUUID = crypto.randomUUID.bind(crypto)
Object.defineProperty(crypto, 'randomUUID', {
  value: () => `tab-${String(++nextUUID).padStart(3, '0')}`,
  configurable: true,
  writable: true,
})

// Now import after mocks are in place
const { createBroadcastChannelTransport, isBroadcastChannelSupported } =
  await import('@tanstack/realtime')

// ---------------------------------------------------------------------------
// Test helpers — create mock inner transports
// ---------------------------------------------------------------------------

interface MockInnerTransport extends RealtimeTransport, PresenceCapable {
  _subs: Map<string, Set<(data: unknown) => void>>
  _presenceSubs: Map<string, Set<(users: ReadonlyArray<PresenceUser>) => void>>
  _simulateMessage: (channel: string, data: unknown) => void
  _simulatePresence: (
    channel: string,
    users: ReadonlyArray<PresenceUser>,
  ) => void
}

function createMockInner(): MockInnerTransport {
  const store = new Store<ConnectionStatus>('disconnected')
  const subs = new Map<string, Set<(data: unknown) => void>>()
  const presenceSubs = new Map<
    string,
    Set<(users: ReadonlyArray<PresenceUser>) => void>
  >()

  return {
    store,
    _subs: subs,
    _presenceSubs: presenceSubs,

    connect() {
      store.setState(() => 'connected')
      return Promise.resolve()
    },
    disconnect() {
      store.setState(() => 'disconnected')
    },
    subscribe(channel, onMessage) {
      if (!subs.has(channel)) subs.set(channel, new Set())
      subs.get(channel)!.add(onMessage)
      return () => {
        subs.get(channel)?.delete(onMessage)
        if (subs.get(channel)?.size === 0) subs.delete(channel)
      }
    },
    async publish() {},
    hook() {
      return { unhook: () => {} }
    },
    joinPresence() {},
    updatePresence() {},
    leavePresence() {},
    onPresenceChange(channel, cb) {
      if (!presenceSubs.has(channel)) presenceSubs.set(channel, new Set())
      presenceSubs.get(channel)!.add(cb)
      return () => {
        presenceSubs.get(channel)?.delete(cb)
        if (presenceSubs.get(channel)?.size === 0) presenceSubs.delete(channel)
      }
    },

    _simulateMessage(channel: string, data: unknown) {
      const listeners = subs.get(channel)
      if (listeners) for (const cb of listeners) cb(data)
    },
    _simulatePresence(channel: string, users: ReadonlyArray<PresenceUser>) {
      const listeners = presenceSubs.get(channel)
      if (listeners) for (const cb of listeners) cb(users)
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BroadcastChannel transport', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    channelRegistry.clear()
    allInstances.length = 0
    nextUUID = 0
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    channelRegistry.clear()
  })

  // ── Feature detection ───────────────────────────────────────────────────

  it('isBroadcastChannelSupported returns true when BroadcastChannel is available', () => {
    expect(isBroadcastChannelSupported()).toBe(true)
  })

  // ── Single tab becomes leader ───────────────────────────────────────────

  it('first tab becomes leader and connects inner transport', async () => {
    let innerCreated = false
    const mockInner = createMockInner()

    const transport = createBroadcastChannelTransport(
      () => {
        innerCreated = true
        return mockInner
      },
      { name: 'test-single-leader' },
    )

    // Before election timeout, not yet leader
    expect(innerCreated).toBe(false)

    // Fire the 150ms discovery timer + 150ms election timer
    await vi.advanceTimersByTimeAsync(350)

    expect(innerCreated).toBe(true)

    // connect() should work on the leader
    await transport.connect()
    expect(mockInner.store.get()).toBe('connected')
  })

  // ── Status broadcasting ─────────────────────────────────────────────────

  it('leader broadcasts status changes to followers', async () => {
    const mockInner = createMockInner()

    // Tab 1 — will be leader (tab-001)
    const tab1 = createBroadcastChannelTransport(() => mockInner, {
      name: 'test-status',
    })

    // Wait for tab1 to become leader
    await vi.advanceTimersByTimeAsync(350)

    // Tab 2 — will be follower (tab-002)
    const tab2 = createBroadcastChannelTransport(() => createMockInner(), {
      name: 'test-status',
    })

    // Tab2's hello triggers leader announcement
    await vi.advanceTimersByTimeAsync(10)

    // Connect leader
    await tab1.connect()
    await vi.advanceTimersByTimeAsync(10)

    // Follower should see 'connected' status
    expect(tab2.store.get()).toBe('connected')
  })

  // ── Subscription fan-out ────────────────────────────────────────────────

  it('messages from inner transport are delivered to follower subscribers', async () => {
    const mockInner = createMockInner()

    // Tab 1 — leader
    createBroadcastChannelTransport(() => mockInner, { name: 'test-fanout' })
    await vi.advanceTimersByTimeAsync(350)

    // Tab 2 — follower
    const tab2 = createBroadcastChannelTransport(() => createMockInner(), {
      name: 'test-fanout',
    })
    await vi.advanceTimersByTimeAsync(10)

    const received: Array<unknown> = []
    tab2.subscribe('ch1', (data) => received.push(data))
    await vi.advanceTimersByTimeAsync(10)

    // Simulate a message on the inner transport
    mockInner._simulateMessage('ch1', { msg: 'hello' })
    await vi.advanceTimersByTimeAsync(10)

    expect(received).toEqual([{ msg: 'hello' }])
  })

  it('leader delivers messages to its own local subscribers', async () => {
    const mockInner = createMockInner()

    const tab1 = createBroadcastChannelTransport(() => mockInner, {
      name: 'test-leader-local',
    })
    await vi.advanceTimersByTimeAsync(350)

    const received: Array<unknown> = []
    tab1.subscribe('ch1', (data) => received.push(data))
    await vi.advanceTimersByTimeAsync(10)

    mockInner._simulateMessage('ch1', { msg: 'self' })
    expect(received).toEqual([{ msg: 'self' }])
  })

  // ── Subscription deduplication ──────────────────────────────────────────

  it('multiple tabs subscribing to the same channel use one inner subscription', async () => {
    const mockInner = createMockInner()

    const tab1 = createBroadcastChannelTransport(() => mockInner, {
      name: 'test-dedup',
    })
    await vi.advanceTimersByTimeAsync(350)

    // Tab1 (leader) subscribes
    tab1.subscribe('ch1', () => {})
    await vi.advanceTimersByTimeAsync(10)
    expect(mockInner._subs.get('ch1')?.size).toBe(1) // one inner sub

    // Tab2 (follower) subscribes to same channel
    const tab2 = createBroadcastChannelTransport(() => createMockInner(), {
      name: 'test-dedup',
    })
    await vi.advanceTimersByTimeAsync(10)
    tab2.subscribe('ch1', () => {})
    await vi.advanceTimersByTimeAsync(10)

    // Still only one inner subscription
    expect(mockInner._subs.get('ch1')?.size).toBe(1)
  })

  // ── Unsubscribe ─────────────────────────────────────────────────────────

  it('unsubscribing the last listener tears down the inner subscription', async () => {
    const mockInner = createMockInner()

    const tab1 = createBroadcastChannelTransport(() => mockInner, {
      name: 'test-unsub',
    })
    await vi.advanceTimersByTimeAsync(350)

    const unsub = tab1.subscribe('ch1', () => {})
    await vi.advanceTimersByTimeAsync(10)
    expect(mockInner._subs.has('ch1')).toBe(true)

    unsub()
    await vi.advanceTimersByTimeAsync(10)
    expect(mockInner._subs.has('ch1')).toBe(false)
  })

  // ── Presence ────────────────────────────────────────────────────────────

  it('presence changes are broadcast to followers', async () => {
    const mockInner = createMockInner()

    createBroadcastChannelTransport(() => mockInner, { name: 'test-presence' })
    await vi.advanceTimersByTimeAsync(350)

    const tab2 = createBroadcastChannelTransport(() => createMockInner(), {
      name: 'test-presence',
    })
    await vi.advanceTimersByTimeAsync(10)

    const users: Array<ReadonlyArray<PresenceUser>> = []
    tab2.onPresenceChange('ch1', (u) => users.push(u))
    await vi.advanceTimersByTimeAsync(10)

    mockInner._simulatePresence('ch1', [
      { connectionId: 'c1', data: { name: 'Alice' } },
    ])
    await vi.advanceTimersByTimeAsync(10)

    expect(users).toHaveLength(1)
    expect(users[0]).toEqual([{ connectionId: 'c1', data: { name: 'Alice' } }])
  })

  // ── Connect / disconnect lifecycle ──────────────────────────────────────

  it('disconnect on leader disconnects inner transport', async () => {
    const mockInner = createMockInner()

    const tab1 = createBroadcastChannelTransport(() => mockInner, {
      name: 'test-disconnect',
    })
    await vi.advanceTimersByTimeAsync(350)
    await tab1.connect()
    expect(mockInner.store.get()).toBe('connected')

    tab1.disconnect()
    expect(mockInner.store.get()).toBe('disconnected')
  })

  // ── Leader re-election ──────────────────────────────────────────────────

  it('follower becomes leader when leader heartbeat times out (tab crash)', async () => {
    const mockInner1 = createMockInner()
    let inner2Created = false

    // Tab 1 — leader (tab-001), with fast heartbeat for test
    const _tab1 = createBroadcastChannelTransport(() => mockInner1, {
      name: 'test-reelection',
      heartbeatMs: 100,
      leaderTimeoutMs: 300,
    })
    await vi.advanceTimersByTimeAsync(350)
    await _tab1.connect()

    // Tab 2 — follower (tab-002), same heartbeat settings
    createBroadcastChannelTransport(
      () => {
        inner2Created = true
        const m = createMockInner()
        // Auto-connect because userCalledConnect is false for tab2
        // but becomeLeader will connect if the old leader had
        return m
      },
      { name: 'test-reelection', heartbeatMs: 100, leaderTimeoutMs: 300 },
    )
    await vi.advanceTimersByTimeAsync(10)

    // "Crash" tab1 by closing its BroadcastChannel — this prevents
    // heartbeats from being delivered, simulating a tab crash.
    // allInstances[0] is tab1's BC (created first).
    allInstances[0]?.close()

    // Wait for heartbeat timeout (300ms) + leaderWatch interval (100ms)
    // + election (150ms) + safety margin
    await vi.advanceTimersByTimeAsync(1000)

    // Tab 2 should now be leader with its own inner transport
    expect(inner2Created).toBe(true)
  })

  // ── Follower re-registration after leader change ────────────────────────

  it('followers re-register subscriptions when new leader is elected after heartbeat timeout', async () => {
    const mockInner1 = createMockInner()
    const mockInner2 = createMockInner()

    // Tab 1 — leader
    createBroadcastChannelTransport(() => mockInner1, {
      name: 'test-reregister',
      heartbeatMs: 100,
      leaderTimeoutMs: 300,
    })
    await vi.advanceTimersByTimeAsync(350)

    // Tab 2 — follower with a subscription
    const tab2 = createBroadcastChannelTransport(() => mockInner2, {
      name: 'test-reregister',
      heartbeatMs: 100,
      leaderTimeoutMs: 300,
    })
    await vi.advanceTimersByTimeAsync(10)
    tab2.subscribe('important-channel', () => {})
    await vi.advanceTimersByTimeAsync(10)

    // Verify inner1 has the subscription (via follower → leader registration)
    expect(mockInner1._subs.has('important-channel')).toBe(true)

    // "Crash" leader by closing its BC (stops heartbeats from reaching tab2)
    allInstances[0]?.close()

    // Wait for heartbeat timeout + leaderWatch interval + election + safety
    await vi.advanceTimersByTimeAsync(1000)

    // Tab2 is now leader — it should have subscribed on its own inner
    // because becomeLeader() iterates localSubs and subscribes each
    expect(mockInner2._subs.has('important-channel')).toBe(true)
  })

  // ── Election tiebreaker ─────────────────────────────────────────────────

  it('tab with lowest ID wins election when multiple tabs start simultaneously', async () => {
    const inners: Array<MockInnerTransport> = []

    // Create 3 tabs at once — they'll get IDs tab-001, tab-002, tab-003
    for (let i = 0; i < 3; i++) {
      createBroadcastChannelTransport(
        () => {
          const m = createMockInner()
          inners.push(m)
          return m
        },
        { name: 'test-tiebreak' },
      )
    }

    // Wait for discovery + election
    await vi.advanceTimersByTimeAsync(500)

    // Only one inner transport should have been created (the leader's)
    expect(inners.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

afterEach(() => {
  channelRegistry.clear()
})

// Restore globals after all tests
afterAll(() => {
  if (savedBC === undefined) {
    delete g['BroadcastChannel']
  } else {
    g['BroadcastChannel'] = savedBC
  }
  Object.defineProperty(crypto, 'randomUUID', {
    value: savedRandomUUID,
    configurable: true,
    writable: true,
  })
})
