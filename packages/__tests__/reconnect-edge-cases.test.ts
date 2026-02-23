/**
 * Unit tests for nodeTransport reconnect edge cases.
 *
 * Uses a mock WebSocket class and fake timers to exercise reconnect logic
 * without a real network.
 *
 * Node.js 22 exposes a native `globalThis.WebSocket` which transport.ts
 * prefers over the `ws` package. We replace it with a controllable mock
 * inside `vi.hoisted()` (which runs before any module imports) and restore
 * it after the suite.
 *
 * Covers:
 *  - Backoff delay is capped at maxDelay after many connection failures
 *  - scheduleReconnect() does not create duplicate timers (guard: if (reconnectTimer) return)
 *  - disconnect() during reconnect wait cancels the pending timer
 *  - getToken() rejection triggers scheduleReconnect (not a crash)
 *  - reconnectAttempt counter resets to 0 on successful connection
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

// Import AFTER vi.hoisted so transport.ts picks up MockWebSocket as `WS`.
import { nodeTransport } from '@tanstack/realtime-preset-node'

// ---------------------------------------------------------------------------
// vi.hoisted() runs before module imports, giving us a chance to replace
// globalThis.WebSocket so transport.ts captures the mock as its module-level
// `WS` constant (which is evaluated once at load time).
// ---------------------------------------------------------------------------

const { MockWebSocket, restoreGlobalWs } = vi.hoisted(() => {
  type EventListener = (...args: Array<unknown>) => void

  class MockWebSocket {
    static CONNECTING = 0
    static OPEN = 1
    static CLOSING = 2
    static CLOSED = 3

    /** All instances created during the current test — reset in beforeEach. */
    static instances: Array<MockWebSocket> = []

    readyState: number = MockWebSocket.CONNECTING
    readonly url: string
    private readonly _listeners = new Map<string, Set<EventListener>>()

    constructor(url: string) {
      this.url = url
      MockWebSocket.instances.push(this)
    }

    addEventListener(event: string, cb: EventListener): void {
      if (!this._listeners.has(event)) this._listeners.set(event, new Set())
      this._listeners.get(event)!.add(cb)
    }

    removeEventListener(event: string, cb: EventListener): void {
      this._listeners.get(event)?.delete(cb)
    }

    send(_data: string): void {}

    close(): void {
      this.readyState = MockWebSocket.CLOSED
      this._emit('close')
    }

    // ── Test helpers ──────────────────────────────────────────────────────

    /** Simulate a successful server accept. */
    _open(): void {
      this.readyState = MockWebSocket.OPEN
      this._emit('open')
    }

    /** Simulate an unexpected server-side close (triggers reconnect). */
    _closeUnexpectedly(): void {
      this.readyState = MockWebSocket.CLOSED
      this._emit('close')
    }

    private _emit(event: string, ...args: Array<unknown>): void {
      for (const cb of this._listeners.get(event) ?? []) cb(...args)
    }
  }

  // Save whatever WebSocket Node.js exposes (native in v18+) so we can
  // restore it once all tests in this file are done.
  const g = globalThis as unknown as Record<string, unknown>
  const saved = g['WebSocket']
  g['WebSocket'] = MockWebSocket

  const restoreGlobalWs = () => {
    if (saved === undefined) {
      delete g['WebSocket']
    } else {
      g['WebSocket'] = saved
    }
  }

  return { MockWebSocket, restoreGlobalWs }
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('nodeTransport — reconnect edge cases', () => {
  beforeEach(() => {
    MockWebSocket.instances = []
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  afterAll(() => {
    restoreGlobalWs()
  })

  // ── 1. Backoff ceiling ───────────────────────────────────────────────────
  //
  // With jitter=0 the formula is deterministic: delay = min(initial * 2^n, max).
  // We verify behavior by checking that each reconnect fires at the expected
  // time and that attempts beyond the cap all use exactly maxDelay.

  it('backoff delay is capped at maxDelay after many connection failures', async () => {
    const transport = nodeTransport({
      url: 'ws://localhost:9999',
      initialDelay: 50,
      maxDelay: 200,
      jitter: 0, // deterministic: delay = min(50 * 2^(attempt-1), 200)
    })

    void transport.connect().catch(() => {})
    await Promise.resolve()
    expect(MockWebSocket.instances.length).toBe(1)

    // Attempt 1 → delay = 50 ms.
    MockWebSocket.instances[0]._closeUnexpectedly()
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(49) // 1 ms short → no reconnect yet
    await Promise.resolve()
    expect(MockWebSocket.instances.length).toBe(1)
    await vi.advanceTimersByTimeAsync(2) // past 50 ms → reconnect fires
    await Promise.resolve()
    expect(MockWebSocket.instances.length).toBe(2)

    // Attempt 2 → delay = 100 ms.
    MockWebSocket.instances[1]._closeUnexpectedly()
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(99)
    await Promise.resolve()
    expect(MockWebSocket.instances.length).toBe(2)
    await vi.advanceTimersByTimeAsync(2)
    await Promise.resolve()
    expect(MockWebSocket.instances.length).toBe(3)

    // Attempt 3 → delay = min(200, 200) = 200 ms — first capped value.
    MockWebSocket.instances[2]._closeUnexpectedly()
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(199)
    await Promise.resolve()
    expect(MockWebSocket.instances.length).toBe(3)
    await vi.advanceTimersByTimeAsync(2)
    await Promise.resolve()
    expect(MockWebSocket.instances.length).toBe(4)

    // Attempt 4 → delay = min(400, 200) = 200 ms — still capped at maxDelay.
    MockWebSocket.instances[3]._closeUnexpectedly()
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(199)
    await Promise.resolve()
    expect(MockWebSocket.instances.length).toBe(4) // still waiting
    await vi.advanceTimersByTimeAsync(2)
    await Promise.resolve()
    expect(MockWebSocket.instances.length).toBe(5) // fired after exactly maxDelay

    transport.disconnect()
  })

  // ── 2. No duplicate timers ───────────────────────────────────────────────

  it('scheduleReconnect does not create duplicate timers on rapid close events', async () => {
    const transport = nodeTransport({
      url: 'ws://localhost:9999',
      initialDelay: 1000,
      maxDelay: 30_000,
      jitter: 0,
    })

    void transport.connect().catch(() => {})
    await Promise.resolve() // let openSocket() create the first socket

    expect(MockWebSocket.instances.length).toBe(1)
    const ws = MockWebSocket.instances[0]

    // Emit close three times rapidly. Only the first call to scheduleReconnect
    // should set a timer; the rest are no-ops (guard: if (reconnectTimer) return).
    ws._closeUnexpectedly()
    ws._closeUnexpectedly()
    ws._closeUnexpectedly()
    await Promise.resolve()

    // Advance time past initialDelay — only one reconnect should fire.
    await vi.advanceTimersByTimeAsync(1500)
    await Promise.resolve()

    expect(MockWebSocket.instances.length).toBe(2) // original + exactly one reconnect
    transport.disconnect()
  })

  // ── 3. Disconnect during reconnect wait ──────────────────────────────────

  it('disconnect() during reconnect wait cancels the pending timer', async () => {
    const transport = nodeTransport({
      url: 'ws://localhost:9999',
      initialDelay: 1000,
      maxDelay: 30_000,
      jitter: 0,
    })

    void transport.connect().catch(() => {})
    await Promise.resolve()

    // Trigger a reconnect cycle.
    MockWebSocket.instances[0]._closeUnexpectedly()
    await Promise.resolve()
    expect(transport.store.get()).toBe('reconnecting')

    // Disconnect before the timer fires.
    transport.disconnect()
    expect(transport.store.get()).toBe('disconnected')

    // Advance time well past initialDelay — no new socket should be created.
    await vi.advanceTimersByTimeAsync(5000)
    await Promise.resolve()

    expect(MockWebSocket.instances.length).toBe(1) // no reconnect happened
  })

  // ── 4. getToken() failure triggers scheduleReconnect ─────────────────────

  it('getToken() rejection schedules a retry instead of crashing', async () => {
    let callCount = 0
    const transport = nodeTransport({
      url: 'ws://localhost:9999',
      initialDelay: 100,
      maxDelay: 30_000,
      jitter: 0,
      getToken: () => {
        callCount++
        if (callCount < 3) return Promise.reject(new Error('token fetch failed'))
        return Promise.resolve('valid-token')
      },
    })

    void transport.connect().catch(() => {})

    // Call 1 fails → scheduleReconnect (delay 100 ms) → no socket yet.
    await Promise.resolve()
    expect(MockWebSocket.instances.length).toBe(0)

    // Advance past delay 1 (100 ms) → call 2 fails → scheduleReconnect (200 ms).
    await vi.advanceTimersByTimeAsync(150)
    await Promise.resolve()
    expect(MockWebSocket.instances.length).toBe(0)

    // Advance past delay 2 (200 ms) → call 3 succeeds → socket created.
    await vi.advanceTimersByTimeAsync(250)
    await Promise.resolve()
    expect(MockWebSocket.instances.length).toBe(1)
    expect(callCount).toBe(3)

    transport.disconnect()
  })

  // ── 5. reconnectAttempt resets on successful connection ──────────────────

  it('reconnectAttempt resets to 0 after a successful connection', async () => {
    const transport = nodeTransport({
      url: 'ws://localhost:9999',
      initialDelay: 100,
      maxDelay: 10_000,
      jitter: 0,
    })

    void transport.connect().catch(() => {})
    await Promise.resolve()

    // Fail twice to push reconnectAttempt up to 2.
    for (let i = 0; i < 2; i++) {
      MockWebSocket.instances[
        MockWebSocket.instances.length - 1
      ]._closeUnexpectedly()
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(500)
      await Promise.resolve()
    }

    // Open the third socket successfully — should reset reconnectAttempt to 0.
    MockWebSocket.instances[MockWebSocket.instances.length - 1]._open()
    await Promise.resolve()
    expect(transport.store.get()).toBe('connected')

    // Immediately fail this connection.
    MockWebSocket.instances[
      MockWebSocket.instances.length - 1
    ]._closeUnexpectedly()
    await Promise.resolve()
    expect(transport.store.get()).toBe('reconnecting')

    // If reconnectAttempt was reset to 0, the next delay = initialDelay * 2^0 = 100 ms.
    // If it had NOT reset (still at 2), the delay would be 400 ms — a 150 ms
    // advance would NOT produce a new socket.
    await vi.advanceTimersByTimeAsync(150)
    await Promise.resolve()

    // A new socket should have been created, proving the counter was reset.
    expect(MockWebSocket.instances.length).toBeGreaterThan(3)

    transport.disconnect()
  })
})
