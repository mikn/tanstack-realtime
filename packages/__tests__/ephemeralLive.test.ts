/**
 * Tests for ephemeralLiveOptions — TanStack DB collection backed by an ephemeral map.
 *
 * Covers:
 *  - channel events are mapped through onEvent and added to the collection
 *  - onEvent returning null / undefined discards the event
 *  - TTL expiry produces a delete write op
 *  - TTL reset on repeated events (heartbeat pattern)
 *  - stop() cleans up channel subscription and ephemeral map
 *  - no writes after stop() (stopped flag)
 *  - default collection id derived from channel
 *  - custom id and getKey
 *  - QueryKey array channel serialization
 *  - multiple concurrent entries
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Store } from '@tanstack/store'
import { ephemeralLiveOptions, createRealtimeClient } from '@tanstack/realtime'
import type { RealtimeTransport, ConnectionStatus } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Mock transport with synchronous emit
// ---------------------------------------------------------------------------

function createMockTransport(): RealtimeTransport & {
  emit: (channel: string, data: unknown) => void
  channelListeners: Map<string, Set<(data: unknown) => void>>
} {
  const channelListeners = new Map<string, Set<(data: unknown) => void>>()
  const store = new Store<ConnectionStatus>('connected')

  return {
    store,
    channelListeners,
    async connect() {},
    disconnect() {},
    subscribe(channel, onMessage) {
      if (!channelListeners.has(channel)) channelListeners.set(channel, new Set())
      channelListeners.get(channel)!.add(onMessage)
      return () => {
        channelListeners.get(channel)?.delete(onMessage)
        if (channelListeners.get(channel)?.size === 0) {
          channelListeners.delete(channel)
        }
      }
    },
    async publish() {},
    emit(channel, data) {
      const cbs = channelListeners.get(channel)
      if (cbs) for (const cb of cbs) cb(data)
    },
  }
}

type TypingUser = { userId: string; name: string }
type WriteOp = { type: string; value?: unknown; key?: unknown }

function driveSync(config: ReturnType<typeof ephemeralLiveOptions>): {
  ops: WriteOp[]
  stop: () => void
} {
  const ops: WriteOp[] = []
  const stop =
    config.sync!.sync({
      begin: (_opts?: unknown) => {},
      write: (op: WriteOp) => ops.push(op),
      commit: () => {},
      markReady: () => {},
    }) ?? (() => {})
  return { ops, stop }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ephemeralLiveOptions — collection metadata', () => {
  it('uses default id derived from channel string', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: 'chat:typing',
      getKey: (u) => u.userId,
      onEvent: (raw) => raw as TypingUser,
    })
    expect(config.id).toBe('ephemeral:chat:typing')
  })

  it('uses default id derived from QueryKey array', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: ['chat', { room: 'general' }],
      getKey: (u) => u.userId,
      onEvent: (raw) => raw as TypingUser,
    })
    expect(config.id).toMatch(/^ephemeral:/)
    expect(config.id).toContain('chat')
  })

  it('respects a custom id', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: 'ch',
      id: 'typing-indicators',
      getKey: (u) => u.userId,
      onEvent: (raw) => raw as TypingUser,
    })
    expect(config.id).toBe('typing-indicators')
  })

  it('getKey resolves to the configured key extractor', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: 'ch',
      getKey: (u) => u.userId,
      onEvent: (raw) => raw as TypingUser,
    })
    const user: TypingUser = { userId: 'u42', name: 'Alice' }
    expect(config.getKey(user)).toBe('u42')
  })
})

describe('ephemeralLiveOptions — event handling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('emits an insert write when the first event for a key arrives', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: 'ch',
      getKey: (u) => u.userId,
      onEvent: (raw) => raw as TypingUser,
      ttl: 5000,
    })
    const { ops, stop } = driveSync(config)

    transport.emit('ch', { userId: 'u1', name: 'Alice' })

    expect(ops).toHaveLength(1)
    expect(ops[0]).toMatchObject({ type: 'insert', value: { userId: 'u1', name: 'Alice' } })
    stop()
  })

  it('emits an update write when the same key receives a second event', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: 'ch',
      getKey: (u) => u.userId,
      onEvent: (raw) => raw as TypingUser,
      ttl: 5000,
    })
    const { ops, stop } = driveSync(config)

    transport.emit('ch', { userId: 'u1', name: 'Alice' })
    ops.length = 0

    transport.emit('ch', { userId: 'u1', name: 'Alice (typing...)' })

    expect(ops).toHaveLength(1)
    expect(ops[0]).toMatchObject({ type: 'update', value: { userId: 'u1', name: 'Alice (typing...)' } })
    stop()
  })

  it('emits a delete write when the TTL expires', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: 'ch',
      getKey: (u) => u.userId,
      onEvent: (raw) => raw as TypingUser,
      ttl: 1000,
    })
    const { ops, stop } = driveSync(config)

    transport.emit('ch', { userId: 'u1', name: 'Alice' })
    ops.length = 0

    vi.advanceTimersByTime(1000) // expire TTL

    expect(ops).toHaveLength(1)
    expect(ops[0]).toMatchObject({ type: 'delete', key: 'u1' })
    stop()
  })

  it('resets TTL on repeated events (heartbeat pattern)', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: 'ch',
      getKey: (u) => u.userId,
      onEvent: (raw) => raw as TypingUser,
      ttl: 1000,
    })
    const { ops, stop } = driveSync(config)

    transport.emit('ch', { userId: 'u1', name: 'Alice' })

    // Re-emit before TTL to reset timer.
    vi.advanceTimersByTime(800)
    transport.emit('ch', { userId: 'u1', name: 'Alice' })

    // 800ms more (1600ms total, 800ms since last reset).
    vi.advanceTimersByTime(800)
    // Should NOT have expired yet.
    const hasDelete = ops.some((o) => o.type === 'delete')
    expect(hasDelete).toBe(false)

    // Expire.
    vi.advanceTimersByTime(200) // 1000ms since last event
    const hasDeleteNow = ops.some((o) => o.type === 'delete')
    expect(hasDeleteNow).toBe(true)

    stop()
  })

  it('handles multiple concurrent entries with independent TTLs', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: 'ch',
      getKey: (u) => u.userId,
      onEvent: (raw) => raw as TypingUser,
      ttl: 1000,
    })
    const { ops, stop } = driveSync(config)

    transport.emit('ch', { userId: 'u1', name: 'Alice' }) // t=0
    vi.advanceTimersByTime(500)
    transport.emit('ch', { userId: 'u2', name: 'Bob' }) // t=500

    ops.length = 0

    // u1 expires at t=1000 (500ms from now).
    vi.advanceTimersByTime(500)
    expect(ops.some((o) => o.type === 'delete' && o.key === 'u1')).toBe(true)
    expect(ops.some((o) => o.type === 'delete' && o.key === 'u2')).toBe(false)

    ops.length = 0

    // u2 expires at t=1500 (500ms from now).
    vi.advanceTimersByTime(500)
    expect(ops.some((o) => o.type === 'delete' && o.key === 'u2')).toBe(true)

    stop()
  })

  it('uses default TTL of 3000ms', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: 'ch',
      getKey: (u) => u.userId,
      onEvent: (raw) => raw as TypingUser,
      // no ttl — defaults to 3000
    })
    const { ops, stop } = driveSync(config)

    transport.emit('ch', { userId: 'u1', name: 'Alice' })
    ops.length = 0

    vi.advanceTimersByTime(2999)
    expect(ops.some((o) => o.type === 'delete')).toBe(false)

    vi.advanceTimersByTime(1)
    expect(ops.some((o) => o.type === 'delete')).toBe(true)

    stop()
  })
})

describe('ephemeralLiveOptions — onEvent filtering', () => {
  it('discards event when onEvent returns null', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: 'ch',
      getKey: (u) => u.userId,
      onEvent: (_raw) => null,
    })
    const { ops, stop } = driveSync(config)

    transport.emit('ch', { userId: 'u1', name: 'Alice' })

    expect(ops).toHaveLength(0)
    stop()
  })

  it('discards event when onEvent returns undefined', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: 'ch',
      getKey: (u) => u.userId,
      onEvent: (_raw) => undefined,
    })
    const { ops, stop } = driveSync(config)

    transport.emit('ch', { userId: 'u1', name: 'Alice' })

    expect(ops).toHaveLength(0)
    stop()
  })

  it('filters specific event types via onEvent', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    type RawEvent = { type: string; userId: string; name: string }

    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: 'ch',
      getKey: (u) => u.userId,
      onEvent: (raw) => {
        const e = raw as RawEvent
        if (e.type !== 'typing') return null
        return { userId: e.userId, name: e.name }
      },
      ttl: 5000,
    })
    const { ops, stop } = driveSync(config)

    transport.emit('ch', { type: 'typing', userId: 'u1', name: 'Alice' })
    // Clear after first insert so we can isolate the second event's ops.
    const opsAfterFirst = [...ops]
    ops.length = 0

    transport.emit('ch', { type: 'cursor', userId: 'u2', name: 'Bob' }) // filtered out
    expect(ops).toHaveLength(0) // cursor event produces no ops

    transport.emit('ch', { type: 'typing', userId: 'u3', name: 'Carol' })
    // Carol is inserted; Alice (still live) is emitted as an update in the same diff.
    const insertOp = ops.find((o) => o.type === 'insert')
    const cursorOp = ops.find((o) => (o.value as TypingUser | undefined)?.userId === 'u2')

    expect(opsAfterFirst).toHaveLength(1)
    expect(opsAfterFirst[0]).toMatchObject({ type: 'insert', value: { userId: 'u1' } })
    expect(insertOp).toMatchObject({ type: 'insert', value: { userId: 'u3' } })
    expect(cursorOp).toBeUndefined() // cursor event (u2) never entered the collection
    stop()
  })

  it('onEvent is called with the exact raw payload', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const onEvent = vi.fn((_raw: unknown) => null)

    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: 'ch',
      getKey: (u) => u.userId,
      onEvent,
    })
    const { stop } = driveSync(config)

    const payload = { deeply: { nested: 42 } }
    transport.emit('ch', payload)

    expect(onEvent).toHaveBeenCalledWith(payload)
    stop()
  })
})

describe('ephemeralLiveOptions — cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('stop() unsubscribes from the channel', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: 'ch',
      getKey: (u) => u.userId,
      onEvent: (raw) => raw as TypingUser,
    })
    const { ops, stop } = driveSync(config)

    stop()

    transport.emit('ch', { userId: 'u1', name: 'Alice' })
    expect(ops).toHaveLength(0)
  })

  it('stop() cancels ephemeral TTL timers (no writes after stop)', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: 'ch',
      getKey: (u) => u.userId,
      onEvent: (raw) => raw as TypingUser,
      ttl: 1000,
    })
    const { ops, stop } = driveSync(config)

    transport.emit('ch', { userId: 'u1', name: 'Alice' })
    stop()
    ops.length = 0

    // TTL would have fired, but stop() destroyed the ephemeral map.
    vi.advanceTimersByTime(2000)
    expect(ops).toHaveLength(0)
  })

  it('stop() removes the channel listener from the transport', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: 'ch',
      getKey: (u) => u.userId,
      onEvent: (raw) => raw as TypingUser,
    })
    const { stop } = driveSync(config)

    expect(transport.channelListeners.has('ch')).toBe(true)
    stop()
    expect(transport.channelListeners.has('ch')).toBe(false)
  })

  it('markReady is called during sync setup', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: 'ch',
      getKey: (u) => u.userId,
      onEvent: (raw) => raw as TypingUser,
    })

    const markReady = vi.fn()
    const stop =
      config.sync!.sync({
        begin: () => {},
        write: () => {},
        commit: () => {},
        markReady,
      }) ?? (() => {})

    expect(markReady).toHaveBeenCalledTimes(1)
    stop()
  })
})

describe('ephemeralLiveOptions — channel serialization', () => {
  it('subscribes to the serialized QueryKey channel string', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = ephemeralLiveOptions<TypingUser>({
      client,
      channel: ['chat', { roomId: 'xyz' }],
      getKey: (u) => u.userId,
      onEvent: (raw) => raw as TypingUser,
    })
    const { ops, stop } = driveSync(config)

    // Discover the actual subscribed channel key.
    const registeredChannels = Array.from(transport.channelListeners.keys())
    expect(registeredChannels).toHaveLength(1)
    const serializedChannel = registeredChannels[0]!

    transport.emit(serializedChannel, { userId: 'u1', name: 'Alice' })
    expect(ops).toHaveLength(1)
    stop()
  })
})
