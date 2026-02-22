/**
 * Tests for the offline queue (createOfflineQueue).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Store } from '@tanstack/store'
import { createOfflineQueue } from '@tanstack/realtime'
import type { RealtimeTransport, PresenceCapable, ConnectionStatus } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Mock transport with controllable connection status
// ---------------------------------------------------------------------------

function createMockTransport(): RealtimeTransport & {
  setStatus: (s: ConnectionStatus) => void
  publishCalls: Array<{ channel: string; data: unknown }>
  publishImpl: (channel: string, data: unknown) => Promise<void>
} {
  const store = new Store<ConnectionStatus>('disconnected')
  const publishCalls: Array<{ channel: string; data: unknown }> = []
  let publishImpl: (channel: string, data: unknown) => Promise<void> =
    async () => {}

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
      publishCalls.push({ channel, data })
      return publishImpl(channel, data)
    },
  }
}

function createPresenceMockTransport(): (RealtimeTransport & PresenceCapable) & {
  setStatus: (s: ConnectionStatus) => void
  publishCalls: Array<{ channel: string; data: unknown }>
  publishImpl: (channel: string, data: unknown) => Promise<void>
} {
  return {
    ...createMockTransport(),
    joinPresence: vi.fn(),
    updatePresence: vi.fn(),
    leavePresence: vi.fn(),
    onPresenceChange: vi.fn(() => () => {}),
  }
}

describe('createOfflineQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('passes through publishes when connected', async () => {
    const inner = createMockTransport()
    inner.setStatus('connected')
    const queue = createOfflineQueue(inner)

    await queue.publish('ch', { msg: 1 })
    expect(inner.publishCalls).toHaveLength(1)
    expect(inner.publishCalls[0]).toEqual({ channel: 'ch', data: { msg: 1 } })
    expect(queue.queueStore.state.pending).toHaveLength(0)
  })

  it('enqueues messages when disconnected', async () => {
    const inner = createMockTransport()
    // status starts disconnected
    const queue = createOfflineQueue(inner)

    await queue.publish('ch', { msg: 1 })
    await queue.publish('ch', { msg: 2 })
    expect(inner.publishCalls).toHaveLength(0) // nothing sent
    expect(queue.queueStore.state.pending).toHaveLength(2)
  })

  it('flushes queue on reconnect', async () => {
    const inner = createMockTransport()
    const queue = createOfflineQueue(inner)

    // Enqueue while disconnected.
    await queue.publish('ch', { msg: 1 })
    await queue.publish('ch', { msg: 2 })
    expect(inner.publishCalls).toHaveLength(0)

    // Reconnect.
    inner.setStatus('connected')
    // Flush is async — allow microtasks to run.
    await vi.advanceTimersByTimeAsync(0)

    expect(inner.publishCalls).toHaveLength(2)
    expect(inner.publishCalls[0]!.data).toEqual({ msg: 1 })
    expect(inner.publishCalls[1]!.data).toEqual({ msg: 2 })
    expect(queue.queueStore.state.pending).toHaveLength(0)
    expect(queue.queueStore.state.flushed).toBe(2)
  })

  it('tracks isFlushing state', async () => {
    const inner = createMockTransport()
    let resolvePublish: (() => void) | undefined
    inner.publishImpl = () =>
      new Promise<void>((resolve) => {
        resolvePublish = resolve
      })

    const queue = createOfflineQueue(inner)
    await queue.publish('ch', { msg: 1 })

    // Trigger flush.
    inner.setStatus('connected')
    await vi.advanceTimersByTimeAsync(0)

    // Should be flushing (publish is pending).
    expect(queue.queueStore.state.isFlushing).toBe(true)

    // Complete the publish.
    resolvePublish!()
    await vi.advanceTimersByTimeAsync(0)

    expect(queue.queueStore.state.isFlushing).toBe(false)
    expect(queue.queueStore.state.flushed).toBe(1)
  })

  it('evicts oldest messages when maxSize is exceeded', async () => {
    const inner = createMockTransport()
    const queue = createOfflineQueue(inner, { maxSize: 2 })

    await queue.publish('ch', { msg: 1 })
    await queue.publish('ch', { msg: 2 })
    await queue.publish('ch', { msg: 3 }) // evicts msg 1

    expect(queue.queueStore.state.pending).toHaveLength(2)
    const pending = queue.queueStore.state.pending
    expect((pending[0] as { data: { msg: number } }).data.msg).toBe(2)
    expect((pending[1] as { data: { msg: number } }).data.msg).toBe(3)
  })

  it('clearQueue discards all pending messages', async () => {
    const inner = createMockTransport()
    const queue = createOfflineQueue(inner)

    await queue.publish('ch', { msg: 1 })
    await queue.publish('ch', { msg: 2 })
    expect(queue.queueStore.state.pending).toHaveLength(2)

    queue.clearQueue()
    expect(queue.queueStore.state.pending).toHaveLength(0)
  })

  it('retries on flush error when onFlushError returns true', async () => {
    const inner = createMockTransport()
    let callCount = 0
    inner.publishImpl = async () => {
      callCount++
      if (callCount === 1) throw new Error('network error')
    }

    const onFlushError = vi.fn(() => true) // retry
    const queue = createOfflineQueue(inner, { onFlushError })

    await queue.publish('ch', { msg: 1 })

    inner.setStatus('connected')
    await vi.advanceTimersByTimeAsync(0)

    expect(onFlushError).toHaveBeenCalledTimes(1)
    // Message should still be pending for retry.
    expect(queue.queueStore.state.pending).toHaveLength(1)
    expect(queue.queueStore.state.flushed).toBe(0)
  })

  it('discards on flush error when onFlushError returns false', async () => {
    const inner = createMockTransport()
    inner.publishImpl = async () => {
      throw new Error('fail')
    }

    const onFlushError = vi.fn(() => false) // discard
    const queue = createOfflineQueue(inner, { onFlushError })

    await queue.publish('ch', { msg: 1 })

    inner.setStatus('connected')
    await vi.advanceTimersByTimeAsync(0)

    expect(onFlushError).toHaveBeenCalledTimes(1)
    expect(queue.queueStore.state.pending).toHaveLength(0)
    expect(queue.queueStore.state.flushed).toBe(0)
  })

  it('delegates subscribe to inner transport', () => {
    const inner = createMockTransport()
    const subscribeSpy = vi.spyOn(inner, 'subscribe')
    const queue = createOfflineQueue(inner)

    const cb = vi.fn()
    queue.subscribe('test-ch', cb)
    expect(subscribeSpy).toHaveBeenCalledWith('test-ch', cb)
  })

  it('delegates connect and disconnect to inner transport', async () => {
    const inner = createMockTransport()
    const connectSpy = vi.spyOn(inner, 'connect')
    const disconnectSpy = vi.spyOn(inner, 'disconnect')
    const queue = createOfflineQueue(inner)

    await queue.connect()
    expect(connectSpy).toHaveBeenCalled()

    queue.disconnect()
    expect(disconnectSpy).toHaveBeenCalled()
  })

  it('assigns incrementing ids to queued messages', async () => {
    const inner = createMockTransport()
    const queue = createOfflineQueue(inner)

    await queue.publish('ch', 'a')
    await queue.publish('ch', 'b')
    await queue.publish('ch', 'c')

    const ids = queue.queueStore.state.pending.map((m) => m.id)
    expect(ids).toEqual([1, 2, 3])
  })

  it('enqueues messages during reconnecting state', async () => {
    const inner = createMockTransport()
    inner.setStatus('reconnecting')
    const queue = createOfflineQueue(inner)

    await queue.publish('ch', { msg: 1 })
    expect(inner.publishCalls).toHaveLength(0)
    expect(queue.queueStore.state.pending).toHaveLength(1)
  })

  it('flushes messages across channels in FIFO order', async () => {
    const inner = createMockTransport()
    const queue = createOfflineQueue(inner)

    await queue.publish('ch-a', 1)
    await queue.publish('ch-b', 2)
    await queue.publish('ch-a', 3)

    inner.setStatus('connected')
    await vi.advanceTimersByTimeAsync(0)

    expect(inner.publishCalls.map((c) => c.data)).toEqual([1, 2, 3])
  })

  it('shares the inner transport store reference', () => {
    const inner = createMockTransport()
    const queue = createOfflineQueue(inner)
    expect(queue.store).toBe(inner.store)
  })

  it('delegates joinPresence to inner transport', () => {
    const inner = createPresenceMockTransport()
    const joinSpy = vi.spyOn(inner, 'joinPresence')
    const queue = createOfflineQueue(inner)

    queue.joinPresence('ch', { userId: 'u1' })
    expect(joinSpy).toHaveBeenCalledWith('ch', { userId: 'u1' })
  })

  it('delegates updatePresence to inner transport', () => {
    const inner = createPresenceMockTransport()
    const updateSpy = vi.spyOn(inner, 'updatePresence')
    const queue = createOfflineQueue(inner)

    queue.updatePresence('ch', { status: 'away' })
    expect(updateSpy).toHaveBeenCalledWith('ch', { status: 'away' })
  })

  it('delegates leavePresence to inner transport', () => {
    const inner = createPresenceMockTransport()
    const leaveSpy = vi.spyOn(inner, 'leavePresence')
    const queue = createOfflineQueue(inner)

    queue.leavePresence('ch')
    expect(leaveSpy).toHaveBeenCalledWith('ch')
  })

  it('delegates onPresenceChange to inner transport', () => {
    const inner = createPresenceMockTransport()
    const onPresenceSpy = vi.spyOn(inner, 'onPresenceChange')
    const queue = createOfflineQueue(inner)

    const cb = vi.fn()
    queue.onPresenceChange('ch', cb)
    expect(onPresenceSpy).toHaveBeenCalledWith('ch', cb)
  })

  it('re-queues remaining messages when connection drops mid-flush', async () => {
    const inner = createMockTransport()
    let callCount = 0
    inner.publishImpl = async () => {
      callCount++
      // Drop connection after first publish so subsequent messages are re-queued.
      if (callCount === 1) inner.setStatus('disconnected')
    }

    const queue = createOfflineQueue(inner)

    await queue.publish('ch', 'first')
    await queue.publish('ch', 'second')
    await queue.publish('ch', 'third')

    inner.setStatus('connected')
    await vi.advanceTimersByTimeAsync(0)

    // 'first' was published before the drop; 'second' and 'third' are re-queued.
    expect(inner.publishCalls).toHaveLength(1)
    expect(queue.queueStore.state.pending).toHaveLength(2)
    expect((queue.queueStore.state.pending[0] as { data: string }).data).toBe('second')
  })
})
