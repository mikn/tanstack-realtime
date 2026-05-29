/**
 * Tests for tick-based batching hook (useTickBatching).
 *
 * Covers:
 * - Tick batching batches multiple setState() calls into one frame per tick
 * - Delta compression sends only changed fields
 * - Tick counter advances monotonically
 * - Tick collection writes batch into one begin/commit cycle
 * - Entity removal
 * - onTick listener management
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyDelta,
  computeDelta,
  createMockTransport,
  tickCollectionOptions,
  useTickBatching,
} from '@realtimejs/core'
import type { TickFrame } from '@realtimejs/core'

// ---------------------------------------------------------------------------
// Tests: Delta compression helpers
// ---------------------------------------------------------------------------

describe('computeDelta / applyDelta', () => {
  it('computeDelta returns null when nothing changed', () => {
    const prev = { x: 1, y: 2 }
    const next = { x: 1, y: 2 }
    expect(computeDelta(prev, next)).toBeNull()
  })

  it('computeDelta returns only changed fields', () => {
    const prev = { x: 1, y: 2, z: 3 }
    const next = { x: 1, y: 5, z: 3 }
    expect(computeDelta(prev, next)).toEqual({ y: 5 })
  })

  it('computeDelta returns full object when prev is undefined', () => {
    expect(computeDelta(undefined, { x: 1, y: 2 })).toEqual({ x: 1, y: 2 })
  })

  it('computeDelta detects removed keys', () => {
    const prev = { x: 1, y: 2, z: 3 }
    const next = { x: 1, y: 2 }
    const delta = computeDelta(prev, next)
    expect(delta).toEqual({ z: undefined })
  })

  it('applyDelta reconstructs full state', () => {
    const base = { x: 1, y: 2 }
    const delta = { y: 5, z: 3 }
    expect(applyDelta(base, delta)).toEqual({ x: 1, y: 5, z: 3 })
  })

  it('applyDelta removes keys set to undefined', () => {
    const base = { x: 1, y: 2, z: 3 }
    const delta = { z: undefined }
    const result = applyDelta(base, delta as any)
    expect(result).toEqual({ x: 1, y: 2 })
  })

  it('applyDelta works with undefined base', () => {
    expect(applyDelta(undefined, { x: 1 })).toEqual({ x: 1 })
  })
})

// ---------------------------------------------------------------------------
// Tests: useTickBatching
// ---------------------------------------------------------------------------

describe('useTickBatching', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('batches multiple setState calls into one publish per tick', () => {
    const transport = createMockTransport()
    const tick = useTickBatching(transport, { tickMs: 16 })

    tick.setState('game', 'player-1', { x: 10, y: 20 })
    tick.setState('game', 'player-2', { x: 30, y: 40 })

    // Before tick fires
    expect(transport.publishLog).toHaveLength(0)

    // After tick fires
    vi.advanceTimersByTime(16)

    expect(transport.publishLog).toHaveLength(1)
    expect(transport.publishLog[0].data).toHaveProperty('__tick', true)
    const frame = transport.publishLog[0].data as TickFrame
    expect(frame.entities['player-1']).toEqual({ x: 10, y: 20 })
    expect(frame.entities['player-2']).toEqual({ x: 30, y: 40 })
    expect(frame.tick).toBe(1)

    tick.stop()
  })

  it('advances tick counter monotonically', () => {
    const transport = createMockTransport()
    const tick = useTickBatching(transport, { tickMs: 10 })

    tick.setState('game', 'p1', { x: 1 })
    vi.advanceTimersByTime(10)

    tick.setState('game', 'p1', { x: 2 })
    vi.advanceTimersByTime(10)

    tick.setState('game', 'p1', { x: 3 })
    vi.advanceTimersByTime(10)

    expect(tick.tickStore.state.tick).toBe(3)
    expect(transport.publishLog).toHaveLength(3)
    expect((transport.publishLog[0].data as TickFrame).tick).toBe(1)
    expect((transport.publishLog[1].data as TickFrame).tick).toBe(2)
    expect((transport.publishLog[2].data as TickFrame).tick).toBe(3)

    tick.stop()
  })

  it('does not publish when nothing is dirty', () => {
    const transport = createMockTransport()
    const tick = useTickBatching(transport, { tickMs: 10 })

    tick.setState('game', 'p1', { x: 1 })
    vi.advanceTimersByTime(10)

    // No new setState calls
    vi.advanceTimersByTime(10)
    vi.advanceTimersByTime(10)

    expect(transport.publishLog).toHaveLength(1) // only the first tick

    tick.stop()
  })

  it('includes removed entities in the frame', () => {
    const transport = createMockTransport()
    const tick = useTickBatching(transport, { tickMs: 10 })

    tick.setState('game', 'p1', { x: 1 })
    tick.removeEntity('game', 'p2')
    vi.advanceTimersByTime(10)

    const frame = transport.publishLog[0].data as TickFrame
    expect(frame.removed).toEqual(['p2'])
    expect(frame.entities['p1']).toEqual({ x: 1 })

    tick.stop()
  })

  it('onTick delivers frames from inner transport', () => {
    const transport = createMockTransport()
    const tick = useTickBatching(transport, { tickMs: 10 })

    const received: Array<TickFrame> = []
    tick.onTick('game', (frame) => received.push(frame))

    // Simulate receiving a tick frame from the server
    transport.simulateMessage('game', {
      __tick: true,
      tick: 5,
      timestamp: Date.now(),
      entities: { 'player-3': { x: 50 } },
      removed: [],
    })

    expect(received).toHaveLength(1)
    expect(received[0].tick).toBe(5)
    expect(received[0].entities['player-3']).toEqual({ x: 50 })
    expect(tick.tickStore.state.serverTick).toBe(5)

    tick.stop()
  })

  it('unsubscribing from onTick cleans up inner subscription', () => {
    const transport = createMockTransport()
    const tick = useTickBatching(transport, { tickMs: 10 })

    const unsub = tick.onTick('game', () => {})
    unsub()

    // Inner should be unsubscribed — emitting should not crash
    transport.simulateMessage('game', {
      __tick: true,
      tick: 1,
      timestamp: Date.now(),
      entities: {},
      removed: [],
    })

    expect(tick.tickStore.state.serverTick).toBe(0)

    tick.stop()
  })

  it('delta compression sends only changed fields', () => {
    const transport = createMockTransport()
    const tick = useTickBatching(transport, {
      tickMs: 10,
      deltaCompression: true,
    })

    tick.setState('game', 'p1', { x: 10, y: 20 })
    vi.advanceTimersByTime(10)

    // First frame sends full state
    const frame1 = transport.publishLog[0].data as TickFrame
    expect(frame1.entities['p1']).toEqual({ x: 10, y: 20 })

    // Second frame: only y changed
    tick.setState('game', 'p1', { x: 10, y: 30 })
    vi.advanceTimersByTime(10)

    const frame2 = transport.publishLog[1].data as TickFrame
    expect(frame2.entities['p1']).toEqual({ y: 30 })

    tick.stop()
  })

  it('stop() clears the tick interval and listeners', () => {
    const transport = createMockTransport()
    const tick = useTickBatching(transport, { tickMs: 10 })

    tick.setState('game', 'p1', { x: 1 })
    tick.stop()

    vi.advanceTimersByTime(100)

    // Nothing should have been published after stop
    expect(transport.publishLog).toHaveLength(0)
  })

  it('publishes removal-only frames (no setState, only removeEntity)', () => {
    const transport = createMockTransport()
    const tick = useTickBatching(transport, { tickMs: 10 })

    // Only remove, no setState
    tick.removeEntity('game', 'player-x')
    vi.advanceTimersByTime(10)

    expect(transport.publishLog).toHaveLength(1)
    const frame = transport.publishLog[0].data as TickFrame
    expect(frame.removed).toEqual(['player-x'])
    expect(Object.keys(frame.entities)).toHaveLength(0)

    tick.stop()
  })

  it('subscribe() filters out __tick wire frames', () => {
    const transport = createMockTransport()
    useTickBatching(transport, { tickMs: 10 })

    const received: Array<unknown> = []
    transport.subscribe('game', (data) => received.push(data))

    // Normal message — should pass through
    transport.simulateMessage('game', { type: 'chat', text: 'hello' })

    // Tick wire frame — should be filtered out by beforeDeliver hook
    transport.simulateMessage('game', {
      __tick: true,
      tick: 1,
      timestamp: Date.now(),
      entities: { p1: { x: 10 } },
      removed: [],
    })

    // Another normal message
    transport.simulateMessage('game', { type: 'chat', text: 'world' })

    expect(received).toHaveLength(2)
    expect(received[0]).toEqual({ type: 'chat', text: 'hello' })
    expect(received[1]).toEqual({ type: 'chat', text: 'world' })
  })

  it('does not publish when disconnected', () => {
    const transport = createMockTransport({ initialStatus: 'disconnected' })
    const tick = useTickBatching(transport, { tickMs: 10 })

    tick.setState('game', 'p1', { x: 1 })
    vi.advanceTimersByTime(10)

    // Should NOT publish while disconnected
    expect(transport.publishLog).toHaveLength(0)

    // Reconnect — dirty state persists and is sent on next tick
    transport.simulateReconnect()
    vi.advanceTimersByTime(10)

    // Dirty state accumulated during disconnect is now flushed
    expect(transport.publishLog).toHaveLength(1)
    expect((transport.publishLog[0].data as TickFrame).entities['p1']).toEqual({
      x: 1,
    })

    tick.stop()
  })

  it('both subscribe() and onTick() work simultaneously', () => {
    const transport = createMockTransport()
    const tick = useTickBatching(transport, { tickMs: 10 })

    const subscribeReceived: Array<unknown> = []
    const tickReceived: Array<TickFrame> = []

    transport.subscribe('game', (data) => subscribeReceived.push(data))
    tick.onTick('game', (frame) => tickReceived.push(frame))

    // Normal message — goes to subscribe only
    transport.simulateMessage('game', { type: 'chat', text: 'hi' })

    // Tick frame — goes to onTick only
    transport.simulateMessage('game', {
      __tick: true,
      tick: 1,
      timestamp: Date.now(),
      entities: { p1: { x: 1 } },
      removed: [],
    })

    expect(subscribeReceived).toHaveLength(1)
    expect(subscribeReceived[0]).toEqual({ type: 'chat', text: 'hi' })
    expect(tickReceived).toHaveLength(1)
    expect(tickReceived[0].tick).toBe(1)

    tick.stop()
  })

  it('update and removal in same tick for different entities', () => {
    const transport = createMockTransport()
    const tick = useTickBatching(transport, { tickMs: 10 })

    tick.setState('game', 'p1', { x: 10 })
    tick.removeEntity('game', 'p2')
    vi.advanceTimersByTime(10)

    const frame = transport.publishLog[0].data as TickFrame
    expect(frame.entities['p1']).toEqual({ x: 10 })
    expect(frame.removed).toEqual(['p2'])

    tick.stop()
  })

  it('removeEntity clears entity from dirty state', () => {
    const transport = createMockTransport()
    const tick = useTickBatching(transport, { tickMs: 10 })

    // Set then remove same entity in same tick
    tick.setState('game', 'p1', { x: 10 })
    tick.removeEntity('game', 'p1')
    vi.advanceTimersByTime(10)

    const frame = transport.publishLog[0].data as TickFrame
    // Entity should be in removed, not in entities
    expect(frame.entities['p1']).toBeUndefined()
    expect(frame.removed).toContain('p1')

    tick.stop()
  })

  it('delta compression with key removal (prev has key, next does not)', () => {
    const transport = createMockTransport()
    const tick = useTickBatching(transport, {
      tickMs: 10,
      deltaCompression: true,
    })

    tick.setState('game', 'p1', { x: 10, y: 20, z: 30 })
    vi.advanceTimersByTime(10)

    // Remove z
    tick.setState('game', 'p1', { x: 10, y: 20 })
    vi.advanceTimersByTime(10)

    const frame2 = transport.publishLog[1].data as TickFrame
    expect(frame2.entities['p1']).toEqual({ z: undefined })

    tick.stop()
  })

  it('delta compression: no frame when state is identical', () => {
    const transport = createMockTransport()
    const tick = useTickBatching(transport, {
      tickMs: 10,
      deltaCompression: true,
    })

    tick.setState('game', 'p1', { x: 10, y: 20 })
    vi.advanceTimersByTime(10)

    // Set identical state
    tick.setState('game', 'p1', { x: 10, y: 20 })
    vi.advanceTimersByTime(10)

    // Second tick: delta is null, no entities in frame.
    expect(transport.publishLog).toHaveLength(1)

    tick.stop()
  })
})

// ---------------------------------------------------------------------------
// Tests: tickCollectionOptions
// ---------------------------------------------------------------------------

describe('tickCollectionOptions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  interface Player {
    id: string
    x: number
    y: number
  }

  it('creates a collection that syncs from tick frames', () => {
    const transport = createMockTransport()
    const tick = useTickBatching(transport, { tickMs: 10 })

    const config = tickCollectionOptions<Player, string>({
      transport: tick,
      channel: 'game',
      getKey: (p) => p.id,
      keyToEntityId: (key) => key,
      fromEntity: (entityId, state) => ({
        id: entityId,
        ...(state as { x: number; y: number }),
      }),
    })

    expect(config.id).toBe('tick:game')

    const ops: Array<{ type: string; value?: unknown; key?: unknown }> = []
    let ready = false
    const cleanup = config.sync.sync({
      begin: () => {},
      write: (op: any) => ops.push(op),
      commit: () => {},
      markReady: () => {
        ready = true
      },
      collection: null as any,
      truncate: () => {},
    } as any)

    expect(ready).toBe(true)

    // Simulate receiving a tick frame
    transport.simulateMessage('game', {
      __tick: true,
      tick: 1,
      timestamp: Date.now(),
      entities: {
        'player-1': { x: 10, y: 20 },
        'player-2': { x: 30, y: 40 },
      },
      removed: [],
    })

    expect(ops).toHaveLength(2)
    expect(ops[0].type).toBe('insert')
    expect((ops[0].value as Player).id).toBe('player-1')
    expect(ops[1].type).toBe('insert')
    expect((ops[1].value as Player).id).toBe('player-2')

    // Update an existing entity
    transport.simulateMessage('game', {
      __tick: true,
      tick: 2,
      timestamp: Date.now(),
      entities: { 'player-1': { x: 15, y: 25 } },
      removed: [],
    })

    expect(ops).toHaveLength(3)
    expect(ops[2].type).toBe('update')
    expect((ops[2].value as Player).x).toBe(15)

    // Remove an entity
    transport.simulateMessage('game', {
      __tick: true,
      tick: 3,
      timestamp: Date.now(),
      entities: {},
      removed: ['player-2'],
    })

    expect(ops).toHaveLength(4)
    expect(ops[3].type).toBe('delete')
    expect(ops[3].key).toBe('player-2')
    ;(cleanup as unknown as () => void)()
    tick.stop()
  })
})
