/**
 * Tests for derived channel options (derivedChannelOptions).
 *
 * Tests the sync config by calling sync() directly with mock hooks.
 */

import { describe, it, expect, vi } from 'vitest'
import { Store } from '@tanstack/store'
import { derivedChannelOptions, createRealtimeClient } from '@tanstack/realtime'
import type {
  RealtimeTransport,
  ConnectionStatus,
  PresenceUser,
} from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Mock transport
// ---------------------------------------------------------------------------

function createMockTransport(): RealtimeTransport & {
  emit: (channel: string, data: unknown) => void
} {
  const listeners = new Map<string, Set<(data: unknown) => void>>()
  const store = new Store<ConnectionStatus>('connected')

  return {
    store,
    async connect() {},
    disconnect() {},
    subscribe(channel, onMessage) {
      if (!listeners.has(channel)) listeners.set(channel, new Set())
      listeners.get(channel)!.add(onMessage)
      return () => {
        listeners.get(channel)?.delete(onMessage)
      }
    },
    async publish() {},
    joinPresence() {},
    updatePresence() {},
    leavePresence() {},
    onPresenceChange(
      _ch: string,
      _cb: (users: ReadonlyArray<PresenceUser>) => void,
    ) {
      return () => {}
    },
    emit(channel: string, data: unknown) {
      const cbs = listeners.get(channel)
      if (cbs) for (const cb of cbs) cb(data)
    },
  }
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

interface Item {
  id: string
  source: string
  value: number
}

function setup(
  selectFn?: (sources: { a: Array<unknown>; b: Array<unknown> }) => Item[],
  sourceOverrides?: {
    a?: { initialData?: () => Promise<Array<unknown>> }
    b?: { initialData?: () => Promise<Array<unknown>> }
  },
) {
  const transport = createMockTransport()
  const client = createRealtimeClient({ transport })

  const config = derivedChannelOptions<Item, string>({
    client,
    id: 'derived',
    getKey: (item) => item.id,
    sources: {
      a: { channel: 'source-a', ...sourceOverrides?.a },
      b: { channel: 'source-b', ...sourceOverrides?.b },
    },
    select:
      selectFn ??
      ((sources) => {
        const aItems = sources.a as Item[]
        const bItems = sources.b as Item[]
        return [...aItems, ...bItems]
      }),
  })

  const ops: Array<{ type: string; value?: unknown; key?: unknown }> = []
  let readyCalled = false
  let beginCount = 0

  const stopSync = config.sync!.sync({
    begin: () => {
      beginCount++
    },
    write: (op: { type: string; value?: unknown; key?: unknown }) => {
      ops.push(op)
    },
    commit: () => {},
    markReady: () => {
      readyCalled = true
    },
  })

  return {
    transport,
    client,
    config,
    ops,
    stopSync,
    isReady: () => readyCalled,
    getBeginCount: () => beginCount,
  }
}

describe('derivedChannelOptions', () => {
  it('returns a valid CollectionConfig', () => {
    const { config } = setup()
    expect(config.sync).toBeDefined()
    expect(config.id).toBe('derived')
  })

  it('marks ready immediately when no sources have initialData', () => {
    const { isReady } = setup()
    expect(isReady()).toBe(true)
  })

  it('marks ready after all initialData resolves', async () => {
    const { isReady } = setup(undefined, {
      a: {
        initialData: async () => [
          { id: '1', source: 'a', value: 10 },
        ],
      },
      b: {
        initialData: async () => [
          { id: '2', source: 'b', value: 20 },
        ],
      },
    })

    // Before microtask, not ready.
    expect(isReady()).toBe(false)

    await new Promise((r) => setTimeout(r, 0))
    expect(isReady()).toBe(true)
  })

  it('recomputes when a source channel receives a message', () => {
    const { transport, ops } = setup()

    transport.emit('source-a', { id: '1', source: 'a', value: 42 })

    // The select function should have been called, producing inserts.
    expect(ops.length).toBeGreaterThan(0)
    expect(ops).toContainEqual(
      expect.objectContaining({
        type: 'insert',
        value: expect.objectContaining({ id: '1', source: 'a' }),
      }),
    )
  })

  it('accumulates messages from multiple sources', () => {
    const { transport, ops } = setup()

    transport.emit('source-a', { id: '1', source: 'a', value: 1 })
    transport.emit('source-b', { id: '2', source: 'b', value: 2 })

    // After both messages, select gets both accumulated arrays.
    const lastInserts = ops.filter((op) => op.type === 'insert')
    expect(lastInserts.length).toBeGreaterThanOrEqual(2)
  })

  it('uses the select function to derive rows', () => {
    const select = vi.fn(
      (sources: { a: Array<unknown>; b: Array<unknown> }) => {
        return (sources.a as Item[]).map((item) => ({
          ...item,
          value: item.value * 2,
        }))
      },
    )
    const { transport } = setup(select)

    transport.emit('source-a', { id: '1', source: 'a', value: 5 })

    expect(select).toHaveBeenCalled()
    const lastCall = select.mock.results[select.mock.results.length - 1]!
    expect(lastCall.value).toEqual([{ id: '1', source: 'a', value: 10 }])
  })

  it('stops processing after cleanup', () => {
    const { transport, ops, stopSync } = setup()
    stopSync()

    const opsBefore = ops.length
    transport.emit('source-a', { id: 'after', source: 'a', value: 99 })
    expect(ops.length).toBe(opsBefore)
  })

  it('handles initialData loading before channel messages', async () => {
    const ops: Array<{ type: string; value?: unknown }> = []
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = derivedChannelOptions<Item, string>({
      client,
      id: 'derived-init',
      getKey: (item) => item.id,
      sources: {
        a: {
          channel: 'src-a',
          initialData: async () => [{ id: '1', source: 'a', value: 100 }],
        },
      },
      select: (sources) => sources.a as Item[],
    })

    let readyCalled = false
    config.sync!.sync({
      begin: () => {},
      write: (op: any) => ops.push(op),
      commit: () => {},
      markReady: () => {
        readyCalled = true
      },
    })

    await new Promise((r) => setTimeout(r, 0))
    expect(readyCalled).toBe(true)
    expect(ops).toContainEqual(
      expect.objectContaining({
        type: 'insert',
        value: expect.objectContaining({ id: '1', value: 100 }),
      }),
    )
  })

  it('marks ready even if initialData rejects', async () => {
    const { isReady } = setup(undefined, {
      a: {
        initialData: async () => {
          throw new Error('load failed')
        },
      },
    })

    await new Promise((r) => setTimeout(r, 0))
    expect(isReady()).toBe(true)
  })

  it('supports QueryKey arrays as channel names', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    // Should not throw — serializeKey is called internally.
    const config = derivedChannelOptions({
      client,
      id: 'qk',
      getKey: (item: any) => item.id,
      sources: {
        x: { channel: ['orders', { status: 'active' }] },
      },
      select: (sources) => sources.x as any[],
    })

    expect(config.sync).toBeDefined()
  })
})
