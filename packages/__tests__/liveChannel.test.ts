/**
 * Tests for liveChannelOptions — focusing on the ordering guarantee:
 * history rows (from initialData) must always appear before live channel
 * events in the collection, even when events arrive while initialData is
 * still loading.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Store } from '@tanstack/store'
import { liveChannelOptions, createRealtimeClient } from '@tanstack/realtime'
import type { RealtimeTransport } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockTransport(): RealtimeTransport & {
  emit: (channel: string, data: unknown) => void
} {
  const listeners = new Map<string, Set<(data: unknown) => void>>()
  const store = new Store<'disconnected' | 'connected' | 'connecting' | 'reconnecting'>('connected')

  return {
    store,
    async connect() {},
    disconnect() {},
    subscribe(channel, onMessage) {
      if (!listeners.has(channel)) listeners.set(channel, new Set())
      listeners.get(channel)!.add(onMessage)
      return () => { listeners.get(channel)?.delete(onMessage) }
    },
    async publish() {},
    joinPresence() {},
    updatePresence() {},
    leavePresence() {},
    onPresenceChange(_ch, _cb) { return () => {} },
    emit(channel, data) {
      const cbs = listeners.get(channel)
      if (cbs) for (const cb of cbs) cb(data)
    },
  }
}

type WriteOp = { type: string; value?: unknown; key?: unknown }

function driveSync(config: ReturnType<typeof liveChannelOptions>): {
  ops: WriteOp[]
  stop: () => void
} {
  const ops: WriteOp[] = []
  const stop =
    config.sync!.sync({
      begin: () => {},
      write: (op: WriteOp) => ops.push(op),
      commit: () => {},
      markReady: () => {},
    }) ?? (() => {})
  return { ops, stop }
}

/** A manually-resolved promise — lets tests control exactly when async work completes. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('liveChannelOptions — ordering guarantee', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('history rows appear before buffered live events', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const { promise: historyPromise, resolve: resolveHistory } =
      deferred<Array<{ id: string; text: string }>>()

    const config = liveChannelOptions({
      client,
      channel: 'chat',
      getKey: (m: { id: string; text: string }) => m.id,
      initialData: () => historyPromise,
      onEvent: (e) => e as { id: string; text: string },
    })
    const { ops } = driveSync(config)

    // Live event arrives BEFORE history resolves.
    transport.emit('chat', { id: 'live-1', text: 'new message' })
    expect(ops).toHaveLength(0) // buffered, not written yet

    // Now resolve history.
    resolveHistory([
      { id: 'h-1', text: 'old message 1' },
      { id: 'h-2', text: 'old message 2' },
    ])
    await vi.advanceTimersByTimeAsync(0)

    expect(ops).toHaveLength(3)
    // History must come first.
    expect((ops[0]!.value as { id: string }).id).toBe('h-1')
    expect((ops[1]!.value as { id: string }).id).toBe('h-2')
    // Live event is replayed after history, in arrival order.
    expect((ops[2]!.value as { id: string }).id).toBe('live-1')
  })

  it('multiple buffered events are replayed in arrival order after history', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const { promise, resolve } = deferred<Array<{ id: string }>>()

    const config = liveChannelOptions({
      client,
      channel: 'chat',
      getKey: (m: { id: string }) => m.id,
      initialData: () => promise,
      onEvent: (e) => e as { id: string },
    })
    const { ops } = driveSync(config)

    // Three live events arrive before history resolves.
    transport.emit('chat', { id: 'e1' })
    transport.emit('chat', { id: 'e2' })
    transport.emit('chat', { id: 'e3' })

    resolve([{ id: 'h1' }])
    await vi.advanceTimersByTimeAsync(0)

    expect(ops.map((o) => (o.value as { id: string }).id)).toEqual([
      'h1',   // history
      'e1',   // buffered, replayed in arrival order
      'e2',
      'e3',
    ])
  })

  it('events after initialData resolves are processed immediately (not buffered)', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const { promise, resolve } = deferred<Array<{ id: string }>>()

    const config = liveChannelOptions({
      client,
      channel: 'chat',
      getKey: (m: { id: string }) => m.id,
      initialData: () => promise,
      onEvent: (e) => e as { id: string },
    })
    const { ops } = driveSync(config)

    resolve([{ id: 'h1' }])
    await vi.advanceTimersByTimeAsync(0)
    // One history row written.
    expect(ops).toHaveLength(1)

    // Event arrives AFTER history resolved.
    transport.emit('chat', { id: 'post-init' })
    expect(ops).toHaveLength(2) // written immediately
  })

  it('without initialData, events are processed immediately', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = liveChannelOptions({
      client,
      channel: 'chat',
      getKey: (m: { id: string }) => m.id,
      // no initialData
      onEvent: (e) => e as { id: string },
    })
    const { ops } = driveSync(config)

    transport.emit('chat', { id: 'e1' })
    transport.emit('chat', { id: 'e2' })

    expect(ops.map((o) => (o.value as { id: string }).id)).toEqual(['e1', 'e2'])
  })

  it('buffered events are replayed after initialData failure', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { promise, reject } = deferred<Array<{ id: string }>>()

    const config = liveChannelOptions({
      client,
      channel: 'chat',
      getKey: (m: { id: string }) => m.id,
      initialData: () => promise,
      onEvent: (e) => e as { id: string },
    })
    const { ops } = driveSync(config)

    transport.emit('chat', { id: 'buffered-1' })
    transport.emit('chat', { id: 'buffered-2' })

    // History fails.
    reject(new Error('network error'))
    await vi.advanceTimersByTimeAsync(0)

    // Live events should still be replayed so data is not silently dropped.
    expect(ops.map((o) => (o.value as { id: string }).id)).toEqual([
      'buffered-1',
      'buffered-2',
    ])
    consoleError.mockRestore()
  })

  it('onEvent returning null suppresses the event during buffering and replay', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const { promise, resolve } = deferred<Array<{ id: string; type: string }>>()

    const config = liveChannelOptions({
      client,
      channel: 'chat',
      getKey: (m: { id: string }) => m.id,
      initialData: () => promise,
      onEvent: (e) => {
        const msg = e as { id: string; type: string }
        return msg.type === 'message' ? msg : null
      },
    })
    const { ops } = driveSync(config)

    // One real message and one ignored event arrive before history.
    transport.emit('chat', { id: 'e1', type: 'message' })
    transport.emit('chat', { id: 'e2', type: 'typing' }) // filtered out

    resolve([{ id: 'h1', type: 'message' }])
    await vi.advanceTimersByTimeAsync(0)

    expect(ops.map((o) => (o.value as { id: string }).id)).toEqual(['h1', 'e1'])
  })

  it('stop during initialData load prevents writes and clears the buffer', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const { promise, resolve } = deferred<Array<{ id: string }>>()

    const config = liveChannelOptions({
      client,
      channel: 'chat',
      getKey: (m: { id: string }) => m.id,
      initialData: () => promise,
      onEvent: (e) => e as { id: string },
    })
    const { ops, stop } = driveSync(config)

    transport.emit('chat', { id: 'buffered' })

    // Stop the sync before history resolves.
    stop()
    resolve([{ id: 'h1' }])
    await vi.advanceTimersByTimeAsync(0)

    expect(ops).toHaveLength(0) // stopped guards all writes
  })
})
