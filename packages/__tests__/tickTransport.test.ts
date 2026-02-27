/**
 * Tests for tick-based transport (Feature 5).
 *
 * Covers:
 * - Tick transport batches multiple setState() calls into one frame per tick
 * - Delta compression sends only changed fields
 * - Tick counter advances monotonically
 * - Tick collection writes batch into one begin/commit cycle
 * - Entity removal
 * - onTick listener management
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Store } from '@tanstack/store'
import {
  applyDelta,
  computeDelta,
  tickCollectionOptions,
  tickTransport,
} from '@tanstack/realtime'
import type {
  ConnectionStatus,
  RealtimeTransport,
  TickFrame,
} from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Mock transport
// ---------------------------------------------------------------------------

function createMockTransport(): RealtimeTransport & {
  emit: (channel: string, data: unknown) => void
  publishCalls: Array<{ channel: string; data: unknown }>
} {
  const listeners = new Map<string, Set<(data: unknown) => void>>()
  const store = new Store<ConnectionStatus>('connected')
  const publishCalls: Array<{ channel: string; data: unknown }> = []

  return {
    store,
    publishCalls,
    async connect() {},
    disconnect() {},
    subscribe(channel, onMessage) {
      if (!listeners.has(channel)) listeners.set(channel, new Set())
      listeners.get(channel)!.add(onMessage)
      return () => listeners.get(channel)?.delete(onMessage)
    },
    async publish(channel, data) {
      publishCalls.push({ channel, data })
    },
    emit(channel, data) {
      const cbs = listeners.get(channel)
      if (cbs) for (const cb of cbs) cb(data)
    },
  }
}

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
// Tests: tickTransport
// ---------------------------------------------------------------------------

describe('tickTransport', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('batches multiple setState calls into one publish per tick', async () => {
    const inner = createMockTransport()
    const tick = tickTransport(inner, { tickMs: 16 })

    tick.setState('game', 'player-1', { x: 10, y: 20 })
    tick.setState('game', 'player-2', { x: 30, y: 40 })

    // Before tick fires
    expect(inner.publishCalls).toHaveLength(0)

    // After tick fires
    vi.advanceTimersByTime(16)

    expect(inner.publishCalls).toHaveLength(1)
    expect(inner.publishCalls[0].data).toHaveProperty('__tick', true)
    const frame = inner.publishCalls[0].data as TickFrame
    expect(frame.entities['player-1']).toEqual({ x: 10, y: 20 })
    expect(frame.entities['player-2']).toEqual({ x: 30, y: 40 })
    expect(frame.tick).toBe(1)

    tick.stop()
  })

  it('advances tick counter monotonically', () => {
    const inner = createMockTransport()
    const tick = tickTransport(inner, { tickMs: 10 })

    tick.setState('game', 'p1', { x: 1 })
    vi.advanceTimersByTime(10)

    tick.setState('game', 'p1', { x: 2 })
    vi.advanceTimersByTime(10)

    tick.setState('game', 'p1', { x: 3 })
    vi.advanceTimersByTime(10)

    expect(tick.tickStore.state.tick).toBe(3)
    expect(inner.publishCalls).toHaveLength(3)
    expect((inner.publishCalls[0].data as TickFrame).tick).toBe(1)
    expect((inner.publishCalls[1].data as TickFrame).tick).toBe(2)
    expect((inner.publishCalls[2].data as TickFrame).tick).toBe(3)

    tick.stop()
  })

  it('does not publish when nothing is dirty', () => {
    const inner = createMockTransport()
    const tick = tickTransport(inner, { tickMs: 10 })

    tick.setState('game', 'p1', { x: 1 })
    vi.advanceTimersByTime(10)

    // No new setState calls
    vi.advanceTimersByTime(10)
    vi.advanceTimersByTime(10)

    expect(inner.publishCalls).toHaveLength(1) // only the first tick

    tick.stop()
  })

  it('includes removed entities in the frame', () => {
    const inner = createMockTransport()
    const tick = tickTransport(inner, { tickMs: 10 })

    tick.setState('game', 'p1', { x: 1 })
    tick.removeEntity('game', 'p2')
    vi.advanceTimersByTime(10)

    const frame = inner.publishCalls[0].data as TickFrame
    expect(frame.removed).toEqual(['p2'])
    expect(frame.entities['p1']).toEqual({ x: 1 })

    tick.stop()
  })

  it('onTick delivers frames from inner transport', () => {
    const inner = createMockTransport()
    const tick = tickTransport(inner, { tickMs: 10 })

    const received: Array<TickFrame> = []
    tick.onTick('game', (frame) => received.push(frame))

    // Simulate receiving a tick frame from the server
    inner.emit('game', {
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
    const inner = createMockTransport()
    const tick = tickTransport(inner, { tickMs: 10 })

    const unsub = tick.onTick('game', () => {})
    unsub()

    // Inner should be unsubscribed — emitting should not crash
    inner.emit('game', {
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
    const inner = createMockTransport()
    const tick = tickTransport(inner, {
      tickMs: 10,
      deltaCompression: true,
    })

    tick.setState('game', 'p1', { x: 10, y: 20 })
    vi.advanceTimersByTime(10)

    // First frame sends full state
    const frame1 = inner.publishCalls[0].data as TickFrame
    expect(frame1.entities['p1']).toEqual({ x: 10, y: 20 })

    // Second frame: only y changed
    tick.setState('game', 'p1', { x: 10, y: 30 })
    vi.advanceTimersByTime(10)

    const frame2 = inner.publishCalls[1].data as TickFrame
    expect(frame2.entities['p1']).toEqual({ y: 30 })

    tick.stop()
  })

  it('stop() clears the tick interval and listeners', () => {
    const inner = createMockTransport()
    const tick = tickTransport(inner, { tickMs: 10 })

    tick.setState('game', 'p1', { x: 1 })
    tick.stop()

    vi.advanceTimersByTime(100)

    // Nothing should have been published after stop
    expect(inner.publishCalls).toHaveLength(0)
  })

  it('delegates connect/disconnect to inner transport', async () => {
    const inner = createMockTransport()
    const connectSpy = vi.spyOn(inner, 'connect')
    const disconnectSpy = vi.spyOn(inner, 'disconnect')
    const tick = tickTransport(inner)

    await tick.connect()
    expect(connectSpy).toHaveBeenCalled()

    tick.disconnect()
    expect(disconnectSpy).toHaveBeenCalled()

    tick.stop()
  })

  it('publishes removal-only frames (no setState, only removeEntity)', () => {
    const inner = createMockTransport()
    const tick = tickTransport(inner, { tickMs: 10 })

    // Only remove, no setState
    tick.removeEntity('game', 'player-x')
    vi.advanceTimersByTime(10)

    expect(inner.publishCalls).toHaveLength(1)
    const frame = inner.publishCalls[0].data as TickFrame
    expect(frame.removed).toEqual(['player-x'])
    expect(Object.keys(frame.entities)).toHaveLength(0)

    tick.stop()
  })

  it('subscribe() filters out __tick wire frames', () => {
    const inner = createMockTransport()
    const tick = tickTransport(inner, { tickMs: 10 })

    const received: Array<unknown> = []
    tick.subscribe('game', (data) => received.push(data))

    // Normal message — should pass through
    inner.emit('game', { type: 'chat', text: 'hello' })

    // Tick wire frame — should be filtered out
    inner.emit('game', {
      __tick: true,
      tick: 1,
      timestamp: Date.now(),
      entities: { p1: { x: 10 } },
      removed: [],
    })

    // Another normal message
    inner.emit('game', { type: 'chat', text: 'world' })

    expect(received).toHaveLength(2)
    expect(received[0]).toEqual({ type: 'chat', text: 'hello' })
    expect(received[1]).toEqual({ type: 'chat', text: 'world' })

    tick.stop()
  })

  it('does not publish when disconnected', () => {
    const inner = createMockTransport()
    inner.store.setState(() => 'disconnected')
    const tick = tickTransport(inner, { tickMs: 10 })

    tick.setState('game', 'p1', { x: 1 })
    vi.advanceTimersByTime(10)

    // Should NOT publish while disconnected
    expect(inner.publishCalls).toHaveLength(0)

    // Reconnect — dirty state persists and is sent on next tick
    inner.store.setState(() => 'connected')
    vi.advanceTimersByTime(10)

    // Dirty state accumulated during disconnect is now flushed
    expect(inner.publishCalls).toHaveLength(1)
    expect((inner.publishCalls[0].data as TickFrame).entities['p1']).toEqual({
      x: 1,
    })

    tick.stop()
  })

  it('publishes on next tick after reconnection with new dirty state', () => {
    const inner = createMockTransport()
    inner.store.setState(() => 'disconnected')
    const tick = tickTransport(inner, { tickMs: 10 })

    tick.setState('game', 'p1', { x: 1 })
    vi.advanceTimersByTime(10)
    expect(inner.publishCalls).toHaveLength(0)

    // Reconnect and set new state
    inner.store.setState(() => 'connected')
    tick.setState('game', 'p1', { x: 2 })
    vi.advanceTimersByTime(10)

    expect(inner.publishCalls).toHaveLength(1)
    expect((inner.publishCalls[0].data as TickFrame).entities['p1']).toEqual({
      x: 2,
    })

    tick.stop()
  })

  it('both subscribe() and onTick() work simultaneously', () => {
    const inner = createMockTransport()
    const tick = tickTransport(inner, { tickMs: 10 })

    const subscribeReceived: Array<unknown> = []
    const tickReceived: Array<TickFrame> = []

    tick.subscribe('game', (data) => subscribeReceived.push(data))
    tick.onTick('game', (frame) => tickReceived.push(frame))

    // Normal message — goes to subscribe only
    inner.emit('game', { type: 'chat', text: 'hi' })

    // Tick frame — goes to onTick only
    inner.emit('game', {
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
    const inner = createMockTransport()
    const tick = tickTransport(inner, { tickMs: 10 })

    tick.setState('game', 'p1', { x: 10 })
    tick.removeEntity('game', 'p2')
    vi.advanceTimersByTime(10)

    const frame = inner.publishCalls[0].data as TickFrame
    expect(frame.entities['p1']).toEqual({ x: 10 })
    expect(frame.removed).toEqual(['p2'])

    tick.stop()
  })

  it('removeEntity clears entity from dirty state', () => {
    const inner = createMockTransport()
    const tick = tickTransport(inner, { tickMs: 10 })

    // Set then remove same entity in same tick
    tick.setState('game', 'p1', { x: 10 })
    tick.removeEntity('game', 'p1')
    vi.advanceTimersByTime(10)

    const frame = inner.publishCalls[0].data as TickFrame
    // Entity should be in removed, not in entities
    expect(frame.entities['p1']).toBeUndefined()
    expect(frame.removed).toContain('p1')

    tick.stop()
  })

  it('delta compression with key removal (prev has key, next does not)', () => {
    const inner = createMockTransport()
    const tick = tickTransport(inner, {
      tickMs: 10,
      deltaCompression: true,
    })

    tick.setState('game', 'p1', { x: 10, y: 20, z: 30 })
    vi.advanceTimersByTime(10)

    // Remove z
    tick.setState('game', 'p1', { x: 10, y: 20 })
    vi.advanceTimersByTime(10)

    const frame2 = inner.publishCalls[1].data as TickFrame
    expect(frame2.entities['p1']).toEqual({ z: undefined })

    tick.stop()
  })

  it('delta compression: no frame when state is identical', () => {
    const inner = createMockTransport()
    const tick = tickTransport(inner, {
      tickMs: 10,
      deltaCompression: true,
    })

    tick.setState('game', 'p1', { x: 10, y: 20 })
    vi.advanceTimersByTime(10)

    // Set identical state
    tick.setState('game', 'p1', { x: 10, y: 20 })
    vi.advanceTimersByTime(10)

    // Second tick: delta is null, no entities in frame.
    // Frame should not be published since both entities and removed are empty.
    expect(inner.publishCalls).toHaveLength(1)

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
    const inner = createMockTransport()
    const tick = tickTransport(inner, { tickMs: 10 })

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
    inner.emit('game', {
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
    inner.emit('game', {
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
    inner.emit('game', {
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
