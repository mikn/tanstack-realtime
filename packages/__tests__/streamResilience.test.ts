/**
 * Tests for stream resilience features:
 * - Framework metadata stripping (_seq, _ts, _signature)
 * - Heartbeat filtering
 * - Sequence deduplication
 * - Stale detection timer
 * - Checkpoint support
 *
 * Uses a synchronous mock client and mock publish to test without a real server.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Store } from '@tanstack/store'
import {
  STREAM_DONE,
  STREAM_ERROR,
  STREAM_HEARTBEAT,
  createRealtimeClient,
  createServerStream,
  serverStreamCallbacks,
  streamChannelOptions,
} from '@tanstack/realtime'
import type { PublishFn, RealtimeTransport } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Mock transport — synchronous event dispatch, no network
// ---------------------------------------------------------------------------

function createMockTransport(): RealtimeTransport & {
  emit: (channel: string, data: unknown) => void
} {
  const listeners = new Map<string, Set<(data: unknown) => void>>()
  const store = new Store<
    'disconnected' | 'connected' | 'connecting' | 'reconnecting'
  >('connected')

  return {
    store,
    connect() {
      return Promise.resolve()
    },
    disconnect() {},
    subscribe(channel, onMessage) {
      if (!listeners.has(channel)) listeners.set(channel, new Set())
      listeners.get(channel)!.add(onMessage)
      return () => {
        listeners.get(channel)?.delete(onMessage)
      }
    },
    publish() {
      return Promise.resolve()
    },
    emit(channel, data) {
      const cbs = listeners.get(channel)
      if (cbs) for (const cb of cbs) cb(data)
    },
  }
}

// Sync helper for driving streamChannelOptions
function driveSyncWithStaleAfter(
  config: ReturnType<typeof streamChannelOptions<any, any>>,
) {
  const updates: Array<{
    status: string
    state: unknown
    error?: string
  }> = []

  const cleanup = config.sync.sync({
    begin: () => {},
    write: (op: any) => {
      const o = op as {
        type: string
        value: { status: string; state: unknown; error?: string }
      }
      if (o.type === 'update') {
        updates.push({
          status: o.value.status,
          state: o.value.state,
          error: o.value.error,
        })
      }
    },
    commit: () => {},
    markReady: () => {},
    collection: null as any,
    truncate: () => {},
  } as any)

  return { updates, cleanup: cleanup as unknown as () => void }
}

// ---------------------------------------------------------------------------
// Framework metadata stripping
// ---------------------------------------------------------------------------

describe('streamChannelOptions — metadata stripping', () => {
  let mockTransport: ReturnType<typeof createMockTransport>
  let client: ReturnType<typeof createRealtimeClient>

  beforeEach(() => {
    mockTransport = createMockTransport()
    client = createRealtimeClient({ transport: mockTransport })
  })

  it('strips _seq and _ts from events before calling reduce', () => {
    const receivedEvents: Array<unknown> = []
    const opts = streamChannelOptions({
      client,
      channel: 'strip-meta',
      initial: '',
      reduce: (s: string, e: { type: string; content: string }) => {
        receivedEvents.push(e)
        return s + e.content
      },
    })

    const { updates } = driveSyncWithStaleAfter(opts)

    // Emit events WITH framework metadata (as a producer would)
    mockTransport.emit('strip-meta', {
      type: 'token',
      content: 'Hi',
      _seq: 1,
      _ts: Date.now(),
    })

    expect(updates).toHaveLength(1)
    expect(updates[0].state).toBe('Hi')
    // The reduce callback should NOT see _seq or _ts
    const event = receivedEvents[0] as Record<string, unknown>
    expect(event._seq).toBeUndefined()
    expect(event._ts).toBeUndefined()
    expect(event.type).toBe('token')
    expect(event.content).toBe('Hi')
  })

  it('strips _signature from events before calling reduce', () => {
    const receivedEvents: Array<unknown> = []
    const opts = streamChannelOptions({
      client,
      channel: 'strip-sig',
      initial: '',
      reduce: (s: string, e: Record<string, unknown>) => {
        receivedEvents.push(e)
        return s
      },
    })

    driveSyncWithStaleAfter(opts)

    mockTransport.emit('strip-sig', {
      type: 'token',
      _seq: 1,
      _ts: 123,
      _signature: 'abc123',
    })

    const event = receivedEvents[0] as Record<string, unknown>
    expect(event._signature).toBeUndefined()
  })

  it('passes through events without framework metadata unchanged', () => {
    const receivedEvents: Array<unknown> = []
    const opts = streamChannelOptions({
      client,
      channel: 'no-meta',
      initial: '',
      reduce: (s: string, e: string) => {
        receivedEvents.push(e)
        return s + e
      },
    })

    driveSyncWithStaleAfter(opts)

    // Emit a plain string (no framework metadata)
    mockTransport.emit('no-meta', 'Hello')

    expect(receivedEvents[0]).toBe('Hello')
  })
})

// ---------------------------------------------------------------------------
// Heartbeat filtering
// ---------------------------------------------------------------------------

describe('streamChannelOptions — heartbeat filtering', () => {
  let mockTransport: ReturnType<typeof createMockTransport>
  let client: ReturnType<typeof createRealtimeClient>

  beforeEach(() => {
    mockTransport = createMockTransport()
    client = createRealtimeClient({ transport: mockTransport })
  })

  it('heartbeat events do not trigger reduce', () => {
    const reduceCalls: Array<unknown> = []
    const opts = streamChannelOptions({
      client,
      channel: 'hb-filter',
      initial: '',
      reduce: (s: string, e: unknown) => {
        reduceCalls.push(e)
        return s + 'x'
      },
    })

    const { updates } = driveSyncWithStaleAfter(opts)

    // Emit a heartbeat
    mockTransport.emit('hb-filter', {
      type: STREAM_HEARTBEAT,
      _seq: 1,
      _ts: Date.now(),
    })

    // Emit a real event
    mockTransport.emit('hb-filter', {
      type: 'token',
      _seq: 2,
      _ts: Date.now(),
    })

    // Only the real event should trigger reduce
    expect(reduceCalls).toHaveLength(1)
    expect(updates).toHaveLength(1)
    expect(updates[0].status).toBe('streaming')
  })

  it('heartbeat events are not passed to isDone or isError', () => {
    const isDoneCalls: Array<unknown> = []
    const isErrorCalls: Array<unknown> = []

    const opts = streamChannelOptions({
      client,
      channel: 'hb-callbacks',
      initial: '',
      reduce: (s: string) => s,
      isDone: (_s, e) => {
        isDoneCalls.push(e)
        return false
      },
      isError: (_s, e) => {
        isErrorCalls.push(e)
        return false
      },
    })

    driveSyncWithStaleAfter(opts)

    mockTransport.emit('hb-callbacks', {
      type: STREAM_HEARTBEAT,
      _seq: 1,
      _ts: Date.now(),
    })

    expect(isDoneCalls).toHaveLength(0)
    expect(isErrorCalls).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Sequence deduplication
// ---------------------------------------------------------------------------

describe('streamChannelOptions — sequence deduplication', () => {
  let mockTransport: ReturnType<typeof createMockTransport>
  let client: ReturnType<typeof createRealtimeClient>

  beforeEach(() => {
    mockTransport = createMockTransport()
    client = createRealtimeClient({ transport: mockTransport })
  })

  it('deduplicates events with already-seen _seq values', () => {
    const opts = streamChannelOptions({
      client,
      channel: 'dedup',
      initial: '',
      reduce: (s: string, e: { content: string }) => s + e.content,
    })

    const { updates } = driveSyncWithStaleAfter(opts)

    mockTransport.emit('dedup', { content: 'A', _seq: 1, _ts: 1 })
    mockTransport.emit('dedup', { content: 'B', _seq: 2, _ts: 2 })
    // Replay seq 1 — should be ignored
    mockTransport.emit('dedup', { content: 'A-dup', _seq: 1, _ts: 3 })
    mockTransport.emit('dedup', { content: 'C', _seq: 3, _ts: 4 })

    expect(updates).toHaveLength(3)
    expect(updates[0].state).toBe('A')
    expect(updates[1].state).toBe('AB')
    expect(updates[2].state).toBe('ABC')
  })

  it('accepts events without _seq (backwards compatible)', () => {
    const opts = streamChannelOptions({
      client,
      channel: 'no-seq',
      initial: '',
      reduce: (s: string, e: string) => s + e,
    })

    const { updates } = driveSyncWithStaleAfter(opts)

    mockTransport.emit('no-seq', 'A')
    mockTransport.emit('no-seq', 'B')

    expect(updates).toHaveLength(2)
    expect(updates[1].state).toBe('AB')
  })
})

// ---------------------------------------------------------------------------
// Stale detection
// ---------------------------------------------------------------------------

describe('streamChannelOptions — stale detection', () => {
  let mockTransport: ReturnType<typeof createMockTransport>
  let client: ReturnType<typeof createRealtimeClient>

  beforeEach(() => {
    vi.useFakeTimers()
    mockTransport = createMockTransport()
    client = createRealtimeClient({ transport: mockTransport })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('transitions to stale after staleAfter ms with no events', () => {
    const opts = streamChannelOptions({
      client,
      channel: 'stale-test',
      initial: '',
      reduce: (s: string, e: { content: string }) => s + e.content,
      staleAfter: 5000,
    })

    const { updates } = driveSyncWithStaleAfter(opts)

    // Emit one event to start the stream
    mockTransport.emit('stale-test', { content: 'Hi', _seq: 1, _ts: 1 })
    expect(updates[0].status).toBe('streaming')

    // Advance past the stale threshold
    vi.advanceTimersByTime(5001)

    expect(updates).toHaveLength(2)
    expect(updates[1].status).toBe('stale')
    // State should be preserved
    expect(updates[1].state).toBe('Hi')
  })

  it('does not go stale if events keep arriving', () => {
    const opts = streamChannelOptions({
      client,
      channel: 'not-stale',
      initial: 0,
      reduce: (s: number) => s + 1,
      staleAfter: 5000,
    })

    const { updates } = driveSyncWithStaleAfter(opts)

    // Emit events faster than the stale threshold
    mockTransport.emit('not-stale', { _seq: 1, _ts: 1 })
    vi.advanceTimersByTime(3000)
    mockTransport.emit('not-stale', { _seq: 2, _ts: 2 })
    vi.advanceTimersByTime(3000)
    mockTransport.emit('not-stale', { _seq: 3, _ts: 3 })
    vi.advanceTimersByTime(3000)

    // All updates should be 'streaming', never 'stale'
    expect(updates.every((u) => u.status === 'streaming')).toBe(true)
  })

  it('recovers from stale to streaming when events resume', () => {
    const opts = streamChannelOptions({
      client,
      channel: 'stale-recover',
      initial: '',
      reduce: (s: string, e: { content: string }) => s + e.content,
      staleAfter: 5000,
    })

    const { updates } = driveSyncWithStaleAfter(opts)

    // Stream starts
    mockTransport.emit('stale-recover', { content: 'A', _seq: 1, _ts: 1 })
    expect(updates[0].status).toBe('streaming')

    // Go stale
    vi.advanceTimersByTime(5001)
    expect(updates[1].status).toBe('stale')

    // Events resume — should go back to streaming
    mockTransport.emit('stale-recover', { content: 'B', _seq: 2, _ts: 2 })
    expect(updates[2].status).toBe('streaming')
    expect(updates[2].state).toBe('AB')
  })

  it('heartbeats reset the stale timer', () => {
    const opts = streamChannelOptions({
      client,
      channel: 'hb-stale',
      initial: '',
      reduce: (s: string) => s,
      staleAfter: 5000,
    })

    const { updates } = driveSyncWithStaleAfter(opts)

    // Emit an event to start the stream
    mockTransport.emit('hb-stale', { _seq: 1, _ts: 1 })
    expect(updates[0].status).toBe('streaming')

    // Advance partially, then send heartbeat
    vi.advanceTimersByTime(3000)
    mockTransport.emit('hb-stale', {
      type: STREAM_HEARTBEAT,
      _seq: 2,
      _ts: 2,
    })

    // Advance another 3s (total 6s since initial event, but only 3s since heartbeat)
    vi.advanceTimersByTime(3000)

    // Should NOT be stale because heartbeat reset the timer
    expect(updates.some((u) => u.status === 'stale')).toBe(false)

    // Now advance past the threshold from the heartbeat
    vi.advanceTimersByTime(2001)
    expect(updates.some((u) => u.status === 'stale')).toBe(true)
  })

  it('stale timer is cleared on done', () => {
    const opts = streamChannelOptions({
      client,
      channel: 'stale-done',
      initial: '',
      reduce: (s: string, _e: { type: string }) => s,
      isDone: (_, e) => e.type === STREAM_DONE,
      staleAfter: 5000,
    })

    const { updates } = driveSyncWithStaleAfter(opts)

    mockTransport.emit('stale-done', {
      type: 'token',
      _seq: 1,
      _ts: 1,
    })
    mockTransport.emit('stale-done', {
      type: STREAM_DONE,
      _seq: 2,
      _ts: 2,
    })

    // Advance past stale threshold — should NOT trigger stale because stream is done
    vi.advanceTimersByTime(10000)

    const statuses = updates.map((u) => u.status)
    expect(statuses).toEqual(['streaming', 'done'])
  })

  it('stale timer is cleared on error', () => {
    const opts = streamChannelOptions({
      client,
      channel: 'stale-err',
      initial: '',
      reduce: (s: string) => s,
      isError: (_, e: { type: string; message?: string }) =>
        e.type === STREAM_ERROR ? (e.message ?? 'error') : false,
      staleAfter: 5000,
    })

    const { updates } = driveSyncWithStaleAfter(opts)

    mockTransport.emit('stale-err', {
      type: 'token',
      _seq: 1,
      _ts: 1,
    })
    mockTransport.emit('stale-err', {
      type: STREAM_ERROR,
      message: 'fail',
      _seq: 2,
      _ts: 2,
    })

    vi.advanceTimersByTime(10000)

    const statuses = updates.map((u) => u.status)
    expect(statuses).toEqual(['streaming', 'error'])
  })

  it('stale timer is cleared on cleanup', () => {
    const opts = streamChannelOptions({
      client,
      channel: 'stale-cleanup',
      initial: 0,
      reduce: (s: number) => s + 1,
      staleAfter: 5000,
    })

    const { updates, cleanup } = driveSyncWithStaleAfter(opts)

    mockTransport.emit('stale-cleanup', { _seq: 1, _ts: 1 })
    cleanup()

    // Advance past stale threshold — no stale status because cleanup stopped everything
    vi.advanceTimersByTime(10000)

    expect(updates).toHaveLength(1)
    expect(updates[0].status).toBe('streaming')
  })

  it('does not trigger stale when staleAfter is not configured', () => {
    const opts = streamChannelOptions({
      client,
      channel: 'no-stale-config',
      initial: '',
      reduce: (s: string) => s,
      // No staleAfter configured
    })

    const { updates } = driveSyncWithStaleAfter(opts)

    mockTransport.emit('no-stale-config', { _seq: 1, _ts: 1 })
    vi.advanceTimersByTime(100000) // Very long silence

    // Should never go stale
    expect(updates).toHaveLength(1)
    expect(updates[0].status).toBe('streaming')
  })
})

// ---------------------------------------------------------------------------
// createServerStream — resilience features
// ---------------------------------------------------------------------------

describe('createServerStream — heartbeat', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('emits heartbeat events at the configured interval', async () => {
    const calls: Array<{ data: unknown }> = []
    const publish: PublishFn = (_ch, data) => {
      calls.push({ data })
      return Promise.resolve()
    }

    createServerStream({
      publish,
      channel: 'hb-emit',
      heartbeat: { interval: 1000 },
    })

    vi.advanceTimersByTime(3500)
    // Allow microtasks from the fire-and-forget publish to flush
    await vi.advanceTimersByTimeAsync(0)

    // Should have emitted ~3 heartbeats (at 1s, 2s, 3s)
    const heartbeats = calls.filter(
      (c) => (c.data as any).type === STREAM_HEARTBEAT,
    )
    expect(heartbeats.length).toBeGreaterThanOrEqual(3)

    // Heartbeats should carry _seq and _ts
    for (const hb of heartbeats) {
      expect(typeof (hb.data as any)._seq).toBe('number')
      expect(typeof (hb.data as any)._ts).toBe('number')
    }
  })

  it('stops heartbeats on done()', async () => {
    const calls: Array<{ data: unknown }> = []
    const publish: PublishFn = (_ch, data) => {
      calls.push({ data })
      return Promise.resolve()
    }

    const stream = createServerStream({
      publish,
      channel: 'hb-stop',
      heartbeat: { interval: 1000 },
    })

    vi.advanceTimersByTime(2500)
    await vi.advanceTimersByTimeAsync(0)

    const countBeforeDone = calls.length
    await stream.done()

    vi.advanceTimersByTime(5000)
    await vi.advanceTimersByTimeAsync(0)

    // Only the done sentinel should have been added after done()
    expect(calls.length).toBe(countBeforeDone + 1)
    expect((calls[calls.length - 1].data as any).type).toBe(STREAM_DONE)
  })

  it('stops heartbeats on error()', async () => {
    const calls: Array<{ data: unknown }> = []
    const publish: PublishFn = (_ch, data) => {
      calls.push({ data })
      return Promise.resolve()
    }

    const stream = createServerStream({
      publish,
      channel: 'hb-err-stop',
      heartbeat: { interval: 1000 },
    })

    vi.advanceTimersByTime(2500)
    await vi.advanceTimersByTimeAsync(0)

    const countBeforeError = calls.length
    await stream.error('fail')

    vi.advanceTimersByTime(5000)
    await vi.advanceTimersByTimeAsync(0)

    // Only the error sentinel should have been added
    expect(calls.length).toBe(countBeforeError + 1)
    expect((calls[calls.length - 1].data as any).type).toBe(STREAM_ERROR)
  })
})

describe('createServerStream — sequence numbers', () => {
  it('assigns monotonically increasing _seq to every event', async () => {
    const calls: Array<{ data: unknown }> = []
    const publish: PublishFn = (_ch, data) => {
      calls.push({ data })
      return Promise.resolve()
    }

    const stream = createServerStream({ publish, channel: 'seq-test' })

    await stream.push({ type: 'a' })
    await stream.push({ type: 'b' })
    await stream.push({ type: 'c' })
    await stream.done()

    expect(calls).toHaveLength(4)
    expect((calls[0].data as any)._seq).toBe(1)
    expect((calls[1].data as any)._seq).toBe(2)
    expect((calls[2].data as any)._seq).toBe(3)
    expect((calls[3].data as any)._seq).toBe(4) // done sentinel
  })

  it('exposes current seq via readonly property', async () => {
    const publish: PublishFn = () => Promise.resolve()
    const stream = createServerStream({ publish, channel: 'seq-prop' })

    expect(stream.seq).toBe(0)
    await stream.push({ type: 'a' })
    expect(stream.seq).toBe(1)
    await stream.push({ type: 'b' })
    expect(stream.seq).toBe(2)
  })
})

describe('createServerStream — checkpoint', () => {
  it('calls checkpoint handler at event-count intervals', async () => {
    const checkpoints: Array<{
      seq: number
      state: { content: string }
    }> = []
    const publish: PublishFn = () => Promise.resolve()

    const stream = createServerStream<{ delta: string }, { content: string }>({
      publish,
      channel: 'cp-events',
      checkpoint: {
        initial: { content: '' },
        reduce: (s, e) => ({ content: s.content + e.delta }),
        interval: { events: 3 },
        handler: (cp) => {
          checkpoints.push({ seq: cp.seq, state: cp.state })
          return Promise.resolve()
        },
      },
    })

    await stream.push({ delta: 'A' })
    await stream.push({ delta: 'B' })
    expect(checkpoints).toHaveLength(0) // Not yet at 3 events

    await stream.push({ delta: 'C' })
    expect(checkpoints).toHaveLength(1)
    expect(checkpoints[0].state.content).toBe('ABC')
    expect(checkpoints[0].seq).toBe(3)

    await stream.push({ delta: 'D' })
    await stream.push({ delta: 'E' })
    await stream.push({ delta: 'F' })
    expect(checkpoints).toHaveLength(2)
    expect(checkpoints[1].state.content).toBe('ABCDEF')
  })

  it('calls checkpoint handler on done() with final state', async () => {
    const checkpoints: Array<{ state: { content: string } }> = []
    const publish: PublishFn = () => Promise.resolve()

    const stream = createServerStream<{ delta: string }, { content: string }>({
      publish,
      channel: 'cp-done',
      checkpoint: {
        initial: { content: '' },
        reduce: (s, e) => ({ content: s.content + e.delta }),
        interval: { events: 100 }, // High threshold — won't trigger from events
        handler: (cp) => {
          checkpoints.push({ state: cp.state })
          return Promise.resolve()
        },
      },
    })

    await stream.push({ delta: 'Hello' })
    await stream.push({ delta: ' World' })
    expect(checkpoints).toHaveLength(0) // Not enough events

    await stream.done()
    expect(checkpoints).toHaveLength(1)
    expect(checkpoints[0].state.content).toBe('Hello World')
  })

  it('calls checkpoint handler on error() with last good state', async () => {
    const checkpoints: Array<{ state: { content: string } }> = []
    const publish: PublishFn = () => Promise.resolve()

    const stream = createServerStream<{ delta: string }, { content: string }>({
      publish,
      channel: 'cp-error',
      checkpoint: {
        initial: { content: '' },
        reduce: (s, e) => ({ content: s.content + e.delta }),
        interval: { events: 100 },
        handler: (cp) => {
          checkpoints.push({ state: cp.state })
          return Promise.resolve()
        },
      },
    })

    await stream.push({ delta: 'Partial' })
    await stream.error('upstream died')

    expect(checkpoints).toHaveLength(1)
    expect(checkpoints[0].state.content).toBe('Partial')
  })

  it('calls checkpoint handler at time intervals', async () => {
    vi.useFakeTimers()

    const checkpoints: Array<{ state: { n: number } }> = []
    const publish: PublishFn = () => Promise.resolve()

    createServerStream<{ inc: number }, { n: number }>({
      publish,
      channel: 'cp-time',
      checkpoint: {
        initial: { n: 0 },
        reduce: (s, e) => ({ n: s.n + e.inc }),
        interval: { time: 1000 },
        handler: (cp) => {
          checkpoints.push({ state: cp.state })
          return Promise.resolve()
        },
      },
    })

    vi.advanceTimersByTime(3500)
    await vi.advanceTimersByTimeAsync(0)

    expect(checkpoints.length).toBeGreaterThanOrEqual(3)

    vi.useRealTimers()
  })
})

// ---------------------------------------------------------------------------
// End-to-end: server stream with resilience → streamChannelOptions consumer
// ---------------------------------------------------------------------------

describe('end-to-end: resilient server stream → consumer', () => {
  it('server heartbeats keep consumer from going stale', () => {
    vi.useFakeTimers()

    // Wire up: server publishes → consumer receives
    const subscribers = new Map<string, Set<(data: unknown) => void>>()
    const publish: PublishFn = (channel, data) => {
      const ch = typeof channel === 'string' ? channel : String(channel)
      const subs = subscribers.get(ch)
      if (subs) for (const cb of subs) cb(data)
      return Promise.resolve()
    }

    const mockClient = {
      clientId: 'test',
      store: new Store({ status: 'connected' as const }),
      connect: async () => {},
      disconnect: () => {},
      destroy: () => {},
      subscribe: (channel: string, onMessage: (data: unknown) => void) => {
        if (!subscribers.has(channel)) subscribers.set(channel, new Set())
        subscribers.get(channel)!.add(onMessage)
        return () => subscribers.get(channel)?.delete(onMessage)
      },
      publish: async () => {},
    }

    // Consumer with stale detection
    type Ev = { type: string; content?: string; message?: string }
    const opts = streamChannelOptions<string, Ev>({
      client: mockClient as any,
      channel: 'e2e-resilient',
      initial: '',
      reduce: (s, e) => (e.type === 'token' ? s + (e.content ?? '') : s),
      ...serverStreamCallbacks,
      staleAfter: 5000,
    })

    const { updates } = driveSyncWithStaleAfter(opts)

    // Server creates a stream with heartbeats
    const stream = createServerStream<Ev>({
      publish,
      channel: 'e2e-resilient',
      heartbeat: { interval: 2000 },
    })

    // Push one event
    stream.push({ type: 'token', content: 'Hi' })

    // Advance 4s — no new data events, but heartbeat at 2s should reset timer
    vi.advanceTimersByTime(2001)
    // Heartbeat fires here (at 2s), which resets the 5s stale timer

    vi.advanceTimersByTime(2000)
    // Total: 4s since initial event, 2s since heartbeat — NOT stale

    const staleUpdates = updates.filter((u) => u.status === 'stale')
    expect(staleUpdates).toHaveLength(0)

    vi.useRealTimers()
  })
})
