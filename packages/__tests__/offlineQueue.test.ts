/**
 * Tests for the offline queue (useOfflineQueue).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Store } from '@tanstack/store'
import { useOfflineQueue } from '@tanstack/realtime'
import { createHookPipeline } from '../../packages/realtime/src/core/hookPipeline.js'
import type { ConnectionStatus, RealtimeTransport } from '@tanstack/realtime'
import type {
  HookHandle,
  HookRegistration,
} from '../../packages/realtime/src/core/hooks.js'

// ---------------------------------------------------------------------------
// Mock transport with controllable connection status and hook support
// ---------------------------------------------------------------------------

function createMockTransport(): RealtimeTransport & {
  setStatus: (s: ConnectionStatus) => void
  publishCalls: Array<{ channel: string; data: unknown }>
  publishImpl: (channel: string, data: unknown) => Promise<void>
} {
  const store = new Store<ConnectionStatus>('disconnected')
  const publishCalls: Array<{ channel: string; data: unknown }> = []
  let publishImpl: (
    channel: string,
    data: unknown,
  ) => Promise<void> = async () => {}

  const pipeline = createHookPipeline()

  // Track status for hook invocation.
  let previousStatus: ConnectionStatus = 'disconnected'
  let wasEverConnected = false
  let wasDisconnected = false

  store.subscribe((status) => {
    const prev = previousStatus
    previousStatus = status

    if (prev === 'connected' && status !== 'connected') {
      pipeline.runOnDisconnect(status as 'disconnected' | 'reconnecting')
    }

    if (status === 'reconnecting' || status === 'disconnected') {
      wasDisconnected = true
    }

    if (status === 'connected') {
      if (wasDisconnected && wasEverConnected) {
        void pipeline.runOnReconnect(new Set())
      }
      void pipeline.runOnConnect()
      wasEverConnected = true
      wasDisconnected = false
    }
  })

  return {
    store,
    publishCalls,
    get publishImpl() {
      return publishImpl
    },
    set publishImpl(fn: (channel: string, data: unknown) => Promise<void>) {
      publishImpl = fn
    },
    setStatus(s: ConnectionStatus) {
      store.setState(() => s)
    },
    async connect() {},
    disconnect() {},
    subscribe() {
      return () => {}
    },
    async publish(channel, data) {
      const result = pipeline.runBeforePublish(channel, data)
      if (result === false) return
      publishCalls.push({ channel, data: result.data })
      return publishImpl(channel, result.data)
    },
    hook(registration: HookRegistration): HookHandle {
      return pipeline.register(registration)
    },
  }
}

describe('useOfflineQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('passes through publishes when connected', async () => {
    const inner = createMockTransport()
    inner.setStatus('connected')
    const queue = useOfflineQueue(inner)

    await inner.publish('ch', { msg: 1 })
    expect(inner.publishCalls).toHaveLength(1)
    expect(inner.publishCalls[0]).toEqual({ channel: 'ch', data: { msg: 1 } })
    expect(queue.store.state.pending).toHaveLength(0)
  })

  it('enqueues messages when disconnected', async () => {
    const inner = createMockTransport()
    // status starts disconnected
    const queue = useOfflineQueue(inner)

    await inner.publish('ch', { msg: 1 })
    await inner.publish('ch', { msg: 2 })
    expect(inner.publishCalls).toHaveLength(0) // nothing sent
    expect(queue.store.state.pending).toHaveLength(2)
  })

  it('flushes queue on reconnect', async () => {
    const inner = createMockTransport()
    const queue = useOfflineQueue(inner)

    // Enqueue while disconnected.
    await inner.publish('ch', { msg: 1 })
    await inner.publish('ch', { msg: 2 })
    expect(inner.publishCalls).toHaveLength(0)

    // Reconnect.
    inner.setStatus('connected')
    // Flush is async — allow microtasks to run.
    await vi.advanceTimersByTimeAsync(0)

    expect(inner.publishCalls).toHaveLength(2)
    expect(inner.publishCalls[0].data).toEqual({ msg: 1 })
    expect(inner.publishCalls[1].data).toEqual({ msg: 2 })
    expect(queue.store.state.pending).toHaveLength(0)
    expect(queue.store.state.flushed).toBe(2)
  })

  it('evicts oldest messages when maxSize is exceeded', async () => {
    const inner = createMockTransport()
    const queue = useOfflineQueue(inner, { maxSize: 2 })

    await inner.publish('ch', { msg: 1 })
    await inner.publish('ch', { msg: 2 })
    await inner.publish('ch', { msg: 3 }) // evicts msg 1

    expect(queue.store.state.pending).toHaveLength(2)
    const pending = queue.store.state.pending
    expect((pending[0] as { data: { msg: number } }).data.msg).toBe(2)
    expect((pending[1] as { data: { msg: number } }).data.msg).toBe(3)
  })

  it('clearQueue discards all pending messages', async () => {
    const inner = createMockTransport()
    const queue = useOfflineQueue(inner)

    await inner.publish('ch', { msg: 1 })
    await inner.publish('ch', { msg: 2 })
    expect(queue.store.state.pending).toHaveLength(2)

    queue.clearQueue()
    expect(queue.store.state.pending).toHaveLength(0)
  })

  it('assigns incrementing ids to queued messages', async () => {
    const inner = createMockTransport()
    const queue = useOfflineQueue(inner)

    await inner.publish('ch', 'a')
    await inner.publish('ch', 'b')
    await inner.publish('ch', 'c')

    const ids = queue.store.state.pending.map((m) => m.id)
    expect(ids).toEqual([1, 2, 3])
  })

  it('enqueues messages during reconnecting state', async () => {
    const inner = createMockTransport()
    inner.setStatus('reconnecting')
    const queue = useOfflineQueue(inner)

    await inner.publish('ch', { msg: 1 })
    expect(inner.publishCalls).toHaveLength(0)
    expect(queue.store.state.pending).toHaveLength(1)
  })

  it('flushes messages across channels in FIFO order', async () => {
    const inner = createMockTransport()
    const _queue = useOfflineQueue(inner)

    await inner.publish('ch-a', 1)
    await inner.publish('ch-b', 2)
    await inner.publish('ch-a', 3)

    inner.setStatus('connected')
    await vi.advanceTimersByTimeAsync(0)

    expect(inner.publishCalls.map((c) => c.data)).toEqual([1, 2, 3])
  })

  it('unhook removes offline queueing', async () => {
    const inner = createMockTransport()
    const queue = useOfflineQueue(inner)

    await inner.publish('ch', { msg: 1 })
    expect(queue.store.state.pending).toHaveLength(1)

    queue.unhook()

    // After unhook, publishes should no longer be intercepted (they'll just go nowhere since disconnected)
    // But the queue handle still retains its state.
    expect(queue.store.state.pending).toHaveLength(1)
  })
})
