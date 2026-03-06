/**
 * Tests for pluggable offline queue storage (Feature 2).
 *
 * Verifies that:
 * - `createLocalStorageAdapter` persists and loads messages correctly
 * - `useOfflineQueue` integrates with a storage adapter
 * - Messages survive "simulated page refresh" (new queue, same storage)
 * - Queue IDs continue from persisted state
 * - `clearQueue()` also clears storage
 * - Memory-only behavior is preserved when `storage` is omitted
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createLocalStorageAdapter,
  createMockTransport,
  useOfflineQueue,
} from '@tanstack/realtime'
import type { OfflineQueueStorage, QueuedMessage } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// In-memory storage adapter (simulates persistence without real IndexedDB)
// ---------------------------------------------------------------------------

function createMemoryStorage(): OfflineQueueStorage & {
  data: Array<QueuedMessage>
  saveCalls: number
  clearCalls: number
} {
  const adapter: OfflineQueueStorage & {
    data: Array<QueuedMessage>
    saveCalls: number
    clearCalls: number
  } = {
    data: [],
    saveCalls: 0,
    clearCalls: 0,

    load() {
      return Promise.resolve([...adapter.data])
    },

    save(messages) {
      adapter.saveCalls++
      adapter.data = [...messages]
      return Promise.resolve()
    },

    clear() {
      adapter.clearCalls++
      adapter.data = []
      return Promise.resolve()
    },
  }

  return adapter
}

// ---------------------------------------------------------------------------
// Tests: OfflineQueueStorage interface compliance (in-memory adapter)
// ---------------------------------------------------------------------------

describe('OfflineQueueStorage — in-memory adapter', () => {
  it('load returns empty array initially', async () => {
    const storage = createMemoryStorage()
    const result = await storage.load()
    expect(result).toEqual([])
  })

  it('save + load round-trip preserves messages', async () => {
    const storage = createMemoryStorage()
    const messages: Array<QueuedMessage> = [
      { id: 1, channel: 'ch', data: 'a', enqueuedAt: '2024-01-01T00:00:00Z' },
      { id: 2, channel: 'ch', data: 'b', enqueuedAt: '2024-01-01T00:00:01Z' },
    ]

    await storage.save(messages)
    const loaded = await storage.load()

    expect(loaded).toEqual(messages)
  })

  it('save replaces the entire persisted set', async () => {
    const storage = createMemoryStorage()

    await storage.save([
      { id: 1, channel: 'ch', data: 'a', enqueuedAt: '2024-01-01T00:00:00Z' },
    ])
    await storage.save([
      { id: 2, channel: 'ch', data: 'b', enqueuedAt: '2024-01-01T00:00:01Z' },
    ])

    const loaded = await storage.load()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe(2)
  })

  it('clear removes all persisted messages', async () => {
    const storage = createMemoryStorage()
    await storage.save([
      { id: 1, channel: 'ch', data: 'a', enqueuedAt: '2024-01-01T00:00:00Z' },
    ])

    await storage.clear()
    const loaded = await storage.load()

    expect(loaded).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Tests: createLocalStorageAdapter (with polyfilled localStorage for Node)
// ---------------------------------------------------------------------------

describe('createLocalStorageAdapter', () => {
  let mockStore: Record<string, string>

  beforeEach(() => {
    mockStore = {}
    ;(globalThis as any).localStorage = {
      getItem: (key: string) => mockStore[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStore[key] = value
      },
      removeItem: (key: string) => {
        delete mockStore[key]
      },
      clear: () => {
        mockStore = {}
      },
    }
  })

  afterEach(() => {
    delete (globalThis as any).localStorage
  })

  it('load returns empty array when nothing is stored', async () => {
    const storage = createLocalStorageAdapter()
    const result = await storage.load()
    expect(result).toEqual([])
  })

  it('save + load round-trip', async () => {
    const storage = createLocalStorageAdapter({ key: 'test-queue' })
    const messages: Array<QueuedMessage> = [
      {
        id: 3,
        channel: 'ch',
        data: { x: 1 },
        enqueuedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 1,
        channel: 'ch',
        data: { x: 2 },
        enqueuedAt: '2024-01-01T00:00:01Z',
      },
    ]

    await storage.save(messages)
    const loaded = await storage.load()

    // Should sort by id
    expect(loaded[0].id).toBe(1)
    expect(loaded[1].id).toBe(3)
  })

  it('clear removes the localStorage key', async () => {
    const storage = createLocalStorageAdapter({ key: 'test-q' })
    await storage.save([
      { id: 1, channel: 'ch', data: 'x', enqueuedAt: '2024-01-01T00:00:00Z' },
    ])

    expect(localStorage.getItem('test-q')).not.toBeNull()
    await storage.clear()
    expect(localStorage.getItem('test-q')).toBeNull()
  })

  it('gracefully handles corrupted localStorage data', async () => {
    localStorage.setItem('tanstack-realtime-queue', 'not-json')
    const storage = createLocalStorageAdapter()
    const result = await storage.load()
    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Tests: useOfflineQueue with storage adapter
// ---------------------------------------------------------------------------

describe('useOfflineQueue with storage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls storage.save after each enqueue', async () => {
    const transport = createMockTransport({ initialStatus: 'disconnected' })
    const storage = createMemoryStorage()
    const _queue = useOfflineQueue(transport, { storage })

    // Wait for storage init
    await vi.advanceTimersByTimeAsync(0)

    await transport.publish('ch', { msg: 1 })
    await transport.publish('ch', { msg: 2 })

    expect(storage.saveCalls).toBe(2)
    expect(storage.data).toHaveLength(2)
  })

  it('calls storage.save after flush', async () => {
    const transport = createMockTransport({ initialStatus: 'disconnected' })
    const storage = createMemoryStorage()
    useOfflineQueue(transport, { storage })

    await vi.advanceTimersByTimeAsync(0)

    await transport.publish('ch', { msg: 1 })
    const saveBefore = storage.saveCalls

    transport.simulateReconnect()
    await vi.advanceTimersByTimeAsync(0)

    // Should have called save after flush (pending is now empty)
    expect(storage.saveCalls).toBeGreaterThan(saveBefore)
    expect(storage.data).toHaveLength(0)
  })

  it('calls storage.clear on clearQueue()', async () => {
    const transport = createMockTransport({ initialStatus: 'disconnected' })
    const storage = createMemoryStorage()
    const queue = useOfflineQueue(transport, { storage })

    await vi.advanceTimersByTimeAsync(0)

    await transport.publish('ch', { msg: 1 })
    queue.clearQueue()

    expect(storage.clearCalls).toBe(1)
    expect(queue.store.state.pending).toHaveLength(0)
  })

  it('restores messages from storage on creation (simulated page refresh)', async () => {
    const storage = createMemoryStorage()

    // Simulate a previous session: messages are in storage
    storage.data = [
      {
        id: 5,
        channel: 'ch',
        data: 'old-1',
        enqueuedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 6,
        channel: 'ch',
        data: 'old-2',
        enqueuedAt: '2024-01-01T00:00:01Z',
      },
    ]

    const transport = createMockTransport({ initialStatus: 'disconnected' })
    const queue = useOfflineQueue(transport, { storage })

    // Before storage.load() resolves
    expect(queue.store.state.pending).toHaveLength(0)

    // After storage.load() resolves
    await vi.advanceTimersByTimeAsync(0)

    expect(queue.store.state.pending).toHaveLength(2)
    expect(queue.store.state.pending[0].data).toBe('old-1')
    expect(queue.store.state.pending[1].data).toBe('old-2')
  })

  it('continues IDs from persisted state (no ID collisions)', async () => {
    const storage = createMemoryStorage()
    storage.data = [
      {
        id: 10,
        channel: 'ch',
        data: 'old',
        enqueuedAt: '2024-01-01T00:00:00Z',
      },
    ]

    const transport = createMockTransport({ initialStatus: 'disconnected' })
    const queue = useOfflineQueue(transport, { storage })

    await vi.advanceTimersByTimeAsync(0)

    // New enqueue should start from id > 10
    await transport.publish('ch', 'new')
    const ids = queue.store.state.pending.map((m) => m.id)
    expect(ids[0]).toBe(10) // persisted
    expect(ids[1]).toBeGreaterThan(10)
  })

  it('merges messages enqueued during init with persisted messages', async () => {
    let resolveLoad!: (msgs: Array<QueuedMessage>) => void
    const slowStorage: OfflineQueueStorage = {
      load: () =>
        new Promise((resolve) => {
          resolveLoad = resolve
        }),
      save: async () => {},
      clear: async () => {},
    }

    const transport = createMockTransport({ initialStatus: 'disconnected' })
    const queue = useOfflineQueue(transport, { storage: slowStorage })

    // Enqueue before storage loads
    await transport.publish('ch', 'fast')
    expect(queue.store.state.pending).toHaveLength(1)

    // Storage loads with pre-existing messages
    resolveLoad([
      {
        id: 5,
        channel: 'ch',
        data: 'persisted',
        enqueuedAt: '2024-01-01T00:00:00Z',
      },
    ])
    await vi.advanceTimersByTimeAsync(0)

    // Should have both: persisted first, then the enqueued-during-init message
    expect(queue.store.state.pending).toHaveLength(2)
    expect(queue.store.state.pending[0].data).toBe('persisted')
    expect(queue.store.state.pending[1].data).toBe('fast')
  })

  it('memory-only behavior is preserved when storage is omitted', async () => {
    const transport = createMockTransport({ initialStatus: 'disconnected' })
    const queue = useOfflineQueue(transport) // no storage

    await transport.publish('ch', { msg: 1 })
    expect(queue.store.state.pending).toHaveLength(1)

    transport.simulateReconnect()
    await vi.advanceTimersByTimeAsync(0)

    expect(queue.store.state.pending).toHaveLength(0)
    expect(queue.store.state.flushed).toBe(1)
  })

  it('re-IDs messages enqueued during init to avoid ID collisions', async () => {
    let resolveLoad!: (msgs: Array<QueuedMessage>) => void
    const slowStorage: OfflineQueueStorage = {
      load: () =>
        new Promise((resolve) => {
          resolveLoad = resolve
        }),
      save: async () => {},
      clear: async () => {},
    }

    const transport = createMockTransport({ initialStatus: 'disconnected' })
    const queue = useOfflineQueue(transport, { storage: slowStorage })

    // Enqueue 3 messages while storage.load() is pending (IDs will be 1, 2, 3)
    await transport.publish('ch', 'fast-1')
    await transport.publish('ch', 'fast-2')
    await transport.publish('ch', 'fast-3')

    // Storage resolves with messages that have IDs 100-102
    resolveLoad([
      {
        id: 100,
        channel: 'ch',
        data: 'persisted-1',
        enqueuedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 101,
        channel: 'ch',
        data: 'persisted-2',
        enqueuedAt: '2024-01-01T00:00:01Z',
      },
      {
        id: 102,
        channel: 'ch',
        data: 'persisted-3',
        enqueuedAt: '2024-01-01T00:00:02Z',
      },
    ])
    await vi.advanceTimersByTimeAsync(0)

    const pending = queue.store.state.pending
    // Should have all 6 messages: 3 persisted + 3 re-IDed
    expect(pending).toHaveLength(6)

    // Persisted messages keep their IDs
    expect(pending[0].id).toBe(100)
    expect(pending[1].id).toBe(101)
    expect(pending[2].id).toBe(102)

    // Re-IDed messages get IDs > 102 (no collisions)
    expect(pending[3].id).toBeGreaterThan(102)
    expect(pending[4].id).toBeGreaterThan(pending[3].id)
    expect(pending[5].id).toBeGreaterThan(pending[4].id)

    // Data is preserved
    expect(pending[3].data).toBe('fast-1')
    expect(pending[4].data).toBe('fast-2')
    expect(pending[5].data).toBe('fast-3')

    // All IDs are unique
    const ids = pending.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('maxSize eviction during merge keeps newest messages', async () => {
    const storage = createMemoryStorage()

    // Pre-fill storage with 8 messages
    storage.data = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      channel: 'ch',
      data: `persisted-${i}`,
      enqueuedAt: '2024-01-01T00:00:00Z',
    }))

    const transport = createMockTransport({ initialStatus: 'disconnected' })
    // maxSize = 5: only 5 total messages should survive
    const queue = useOfflineQueue(transport, { storage, maxSize: 5 })

    await vi.advanceTimersByTimeAsync(0)

    const pending = queue.store.state.pending
    // Should keep last 5 from the merged 8
    expect(pending).toHaveLength(5)
    // Slice keeps the tail, so IDs 4-8
    expect(pending[0].id).toBe(4)
    expect(pending[4].id).toBe(8)
  })

  it('storage.load() failure falls back to memory-only', async () => {
    const failStorage: OfflineQueueStorage = {
      load: () => Promise.reject(new Error('IndexedDB unavailable')),
      save: () => Promise.resolve(),
      clear: () => Promise.resolve(),
    }

    const transport = createMockTransport({ initialStatus: 'disconnected' })
    const queue = useOfflineQueue(transport, { storage: failStorage })

    await vi.advanceTimersByTimeAsync(0)

    // Queue should still work (memory-only)
    await transport.publish('ch', 'data')
    expect(queue.store.state.pending).toHaveLength(1)
  })

  it('new enqueues after init get IDs that continue from merged state', async () => {
    const storage = createMemoryStorage()
    storage.data = [
      {
        id: 50,
        channel: 'ch',
        data: 'old',
        enqueuedAt: '2024-01-01T00:00:00Z',
      },
    ]

    const transport = createMockTransport({ initialStatus: 'disconnected' })
    const queue = useOfflineQueue(transport, { storage })

    await vi.advanceTimersByTimeAsync(0)

    // Enqueue after init — ID should be > 50
    await transport.publish('ch', 'new-1')
    await transport.publish('ch', 'new-2')

    const ids = queue.store.state.pending.map((m) => m.id)
    expect(ids[0]).toBe(50)
    expect(ids[1]).toBeGreaterThan(50)
    expect(ids[2]).toBeGreaterThan(ids[1])
  })
})
