/**
 * Tests for the `merge` conflict-resolution option in realtimeCollectionOptions.
 *
 * Optimistic mutations (optimistic apply + rollback) are owned entirely by
 * TanStack DB's transaction system.  This layer adds one focused capability:
 * when an incoming server value targets a key the collection already holds,
 * call merge(previous, incoming) instead of blindly overwriting.
 */

import { describe, it, expect, vi } from 'vitest'
import { Store } from '@tanstack/store'
import { realtimeCollectionOptions, createRealtimeClient } from '@tanstack/realtime'
import type { RealtimeTransport, ConnectionStatus, PresenceUser } from '@tanstack/realtime'

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
// Shared types + helpers
// ---------------------------------------------------------------------------

interface Doc {
  id: string
  title: string
  version: number
  localFlag?: boolean
}

type WriteOp = { type: string; value?: unknown; key?: unknown }

function driveSync(
  config: ReturnType<typeof realtimeCollectionOptions>,
): { ops: WriteOp[]; stop: () => void; isReady: () => boolean } {
  const ops: WriteOp[] = []
  let ready = false
  const stop =
    config.sync!.sync({
      begin: () => {},
      write: (op: WriteOp) => ops.push(op),
      commit: () => {},
      markReady: () => { ready = true },
    }) ?? (() => {})
  return { ops, stop, isReady: () => ready }
}

// ---------------------------------------------------------------------------
// Invariant tests — merge behaviour
// ---------------------------------------------------------------------------

describe('realtimeCollectionOptions — merge', () => {
  it('incoming insert for an unseen key is written as-is without calling merge', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const merge = vi.fn()

    const config = realtimeCollectionOptions<Doc, string>({
      client, channel: 'docs', getKey: (d) => d.id, merge,
    })
    const { ops } = driveSync(config)

    transport.emit('docs', { action: 'insert', data: { id: '1', title: 'Hello', version: 1 } })

    expect(merge).not.toHaveBeenCalled()
    expect(ops[0]).toEqual({ type: 'insert', value: { id: '1', title: 'Hello', version: 1 } })
  })

  it('merge is called with (previous, incoming) for a key already in syncedValues', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const merge = vi.fn((prev: Doc, next: Doc) => ({ ...next }))

    const config = realtimeCollectionOptions<Doc, string>({
      client, channel: 'docs', getKey: (d) => d.id, merge,
    })
    driveSync(config)

    const v1 = { id: '1', title: 'v1', version: 1, localFlag: true }
    transport.emit('docs', { action: 'insert', data: v1 })
    expect(merge).not.toHaveBeenCalled()

    const v2 = { id: '1', title: 'v2', version: 2 }
    transport.emit('docs', { action: 'update', data: v2 })

    expect(merge).toHaveBeenCalledTimes(1)
    expect(merge).toHaveBeenCalledWith(v1, v2)
  })

  it('the merged value — not the raw incoming — is written to the collection', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      merge: (prev, next) => ({ ...next, localFlag: prev.localFlag }),
    })
    const { ops } = driveSync(config)

    transport.emit('docs', { action: 'insert', data: { id: '1', title: 'v1', version: 1, localFlag: true } })
    transport.emit('docs', { action: 'update', data: { id: '1', title: 'v2', version: 2 } })

    const updateOp = ops.find((op) => op.type === 'update' && (op.value as Doc).title === 'v2')!
    expect((updateOp.value as Doc).localFlag).toBe(true)
    expect((updateOp.value as Doc).version).toBe(2)
  })

  it('merge is never called for delete actions', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const merge = vi.fn()

    const config = realtimeCollectionOptions<Doc, string>({
      client, channel: 'docs', getKey: (d) => d.id, merge,
    })
    const { ops } = driveSync(config)

    transport.emit('docs', { action: 'insert', data: { id: '1', title: 'x', version: 1 } })
    transport.emit('docs', { action: 'delete', data: { id: '1', title: '', version: 0 } })

    expect(merge).not.toHaveBeenCalled()
    expect(ops).toContainEqual(expect.objectContaining({ type: 'delete', key: '1' }))
  })

  it('delete clears syncedValues so the next insert is treated as unseen', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const merge = vi.fn((prev: Doc, next: Doc) => ({ ...next }))

    const config = realtimeCollectionOptions<Doc, string>({
      client, channel: 'docs', getKey: (d) => d.id, merge,
    })
    driveSync(config)

    transport.emit('docs', { action: 'insert', data: { id: '1', title: 'a', version: 1 } })
    transport.emit('docs', { action: 'delete', data: { id: '1', title: '', version: 0 } })
    transport.emit('docs', { action: 'insert', data: { id: '1', title: 'reborn', version: 2 } })

    expect(merge).not.toHaveBeenCalled()
  })

  it('each successive update uses the previous merge output as the new previous', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const calls: Array<{ prev: string; next: string }> = []
    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      merge: (prev, next) => {
        calls.push({ prev: prev.title, next: next.title })
        return { ...next, localFlag: prev.localFlag }
      },
    })
    driveSync(config)

    transport.emit('docs', { action: 'insert', data: { id: '1', title: 'v1', version: 1, localFlag: true } })
    transport.emit('docs', { action: 'update', data: { id: '1', title: 'v2', version: 2 } })
    transport.emit('docs', { action: 'update', data: { id: '1', title: 'v3', version: 3 } })

    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual({ prev: 'v1', next: 'v2' })
    // The second merge receives the OUTPUT of the first merge as its previous.
    expect(calls[1]).toEqual({ prev: 'v2', next: 'v3' })
  })

  it('independent keys have independent syncedValues entries', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const merge = vi.fn((prev: Doc, next: Doc) => ({ ...next }))

    const config = realtimeCollectionOptions<Doc, string>({
      client, channel: 'docs', getKey: (d) => d.id, merge,
    })
    driveSync(config)

    transport.emit('docs', { action: 'insert', data: { id: '1', title: 'a', version: 1 } })
    transport.emit('docs', { action: 'insert', data: { id: '2', title: 'b', version: 1 } })
    transport.emit('docs', { action: 'update', data: { id: '1', title: 'a2', version: 2 } })

    expect(merge).toHaveBeenCalledTimes(1)
    expect(merge.mock.calls[0]![0].id).toBe('1')
  })

  it('queryFn rows seed syncedValues so the first live update invokes merge', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const merge = vi.fn((prev: Doc, next: Doc) => ({ ...next }))

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      queryFn: async () => [{ id: '1', title: 'FromDB', version: 0 }],
      merge,
    })
    driveSync(config)
    await new Promise((r) => setTimeout(r, 0))

    transport.emit('docs', { action: 'update', data: { id: '1', title: 'Live', version: 1 } })

    expect(merge).toHaveBeenCalledTimes(1)
    expect(merge.mock.calls[0]![0].title).toBe('FromDB')
    expect(merge.mock.calls[0]![1].title).toBe('Live')
  })

  it('successful onUpdate handler updates syncedValues via publish path', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const merge = vi.fn((prev: Doc, next: Doc) => ({ ...next, localFlag: prev.localFlag }))

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      merge,
      onUpdate: async () => ({ id: '1', title: 'Persisted', version: 5, localFlag: true }),
    })
    driveSync(config)

    await config.onUpdate!({
      transaction: {
        mutations: [{ modified: { id: '1', title: 'Draft', version: 5, localFlag: true } as unknown, key: '1', original: {} }],
      },
    } as any)

    transport.emit('docs', { action: 'update', data: { id: '1', title: 'Concurrent', version: 6 } })

    expect(merge).toHaveBeenCalledTimes(1)
    expect(merge.mock.calls[0]![0].title).toBe('Persisted')
  })

  it('without merge option, remote value always wins (last-write-wins default)', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client, channel: 'docs', getKey: (d) => d.id,
    })
    const { ops } = driveSync(config)

    transport.emit('docs', { action: 'insert', data: { id: '1', title: 'v1', version: 1, localFlag: true } })
    transport.emit('docs', { action: 'update', data: { id: '1', title: 'v2', version: 2 } })

    const updateOp = ops.find((op) => op.type === 'update')!
    // localFlag not present — server value wins completely.
    expect((updateOp.value as Doc).localFlag).toBeUndefined()
    expect((updateOp.value as Doc).title).toBe('v2')
  })
})

// ---------------------------------------------------------------------------
// Invariant tests — merge baseline lifetime (retainMergeState)
// ---------------------------------------------------------------------------

describe('realtimeCollectionOptions — retainMergeState', () => {
  it('syncedValues is cleared on stop by default — remount starts without a previous baseline', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const merge = vi.fn((prev: Doc, next: Doc) => ({ ...next }))

    const config = realtimeCollectionOptions<Doc, string>({
      client, channel: 'docs', getKey: (d) => d.id, merge,
    })

    // First mount: insert a doc then stop.
    const { stop } = driveSync(config)
    transport.emit('docs', { action: 'insert', data: { id: '1', title: 'v1', version: 1 } })
    stop() // clears baseline (default behaviour)

    // Second mount: the same key arrives — merge should NOT be called because
    // the baseline was cleared; the key is unseen from this mount's perspective.
    driveSync(config)
    merge.mockClear()
    transport.emit('docs', { action: 'update', data: { id: '1', title: 'v2', version: 2 } })

    expect(merge).not.toHaveBeenCalled()
  })

  it('retainMergeState: true preserves syncedValues so merge fires after a restart', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const merge = vi.fn((prev: Doc, next: Doc) => ({ ...next }))

    const config = realtimeCollectionOptions<Doc, string>({
      client, channel: 'docs', getKey: (d) => d.id, merge, retainMergeState: true,
    })

    const { stop } = driveSync(config)
    transport.emit('docs', { action: 'insert', data: { id: '1', title: 'v1', version: 1 } })
    stop() // retainMergeState: true → baseline is NOT cleared

    driveSync(config)
    merge.mockClear()
    transport.emit('docs', { action: 'update', data: { id: '1', title: 'v2', version: 2 } })

    expect(merge).toHaveBeenCalledTimes(1)
    expect(merge.mock.calls[0]![0].title).toBe('v1') // previous from first mount
  })

  it('retainMergeState: false (explicit) matches the default behaviour', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const merge = vi.fn((prev: Doc, next: Doc) => ({ ...next }))

    const config = realtimeCollectionOptions<Doc, string>({
      client, channel: 'docs', getKey: (d) => d.id, merge, retainMergeState: false,
    })

    const { stop } = driveSync(config)
    transport.emit('docs', { action: 'insert', data: { id: '1', title: 'v1', version: 1 } })
    stop()

    driveSync(config)
    merge.mockClear()
    transport.emit('docs', { action: 'update', data: { id: '1', title: 'v2', version: 2 } })

    expect(merge).not.toHaveBeenCalled()
  })

  it('queryFn re-seeds the baseline after a restart even with the default (cleared) state', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const merge = vi.fn((prev: Doc, next: Doc) => ({ ...next }))

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      queryFn: async () => [{ id: '1', title: 'FromDB', version: 0 }],
      merge,
    })

    const { stop } = driveSync(config)
    await new Promise((r) => setTimeout(r, 0)) // let queryFn settle
    stop()

    // Second mount — queryFn re-seeds the cleared baseline.
    driveSync(config)
    await new Promise((r) => setTimeout(r, 0))
    merge.mockClear()
    transport.emit('docs', { action: 'update', data: { id: '1', title: 'Live', version: 1 } })

    expect(merge).toHaveBeenCalledTimes(1)
    expect(merge.mock.calls[0]![0].title).toBe('FromDB')
  })
})

// ---------------------------------------------------------------------------
// Invariant tests — lifecycle and robustness
// ---------------------------------------------------------------------------

describe('realtimeCollectionOptions — lifecycle', () => {
  it('messages arriving after stop() are not processed (stopped flag)', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client, channel: 'docs', getKey: (d) => d.id,
    })
    const { ops, stop } = driveSync(config)

    stop()
    transport.emit('docs', { action: 'insert', data: { id: '1', title: 'late', version: 1 } })

    expect(ops).toHaveLength(0)
  })

  it('markReady is called even when queryFn rejects', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      queryFn: async () => { throw new Error('network error') },
    })
    const { isReady } = driveSync(config)

    expect(isReady()).toBe(false)
    await new Promise((r) => setTimeout(r, 0))
    expect(isReady()).toBe(true)
  })

  it('markReady is called synchronously when there is no queryFn', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client, channel: 'docs', getKey: (d) => d.id,
    })
    const { isReady } = driveSync(config)

    expect(isReady()).toBe(true)
  })

  it('malformed messages (null, wrong shape, non-string action) are silently ignored', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client, channel: 'docs', getKey: (d) => d.id,
    })
    const { ops } = driveSync(config)

    transport.emit('docs', null)
    transport.emit('docs', undefined)
    transport.emit('docs', { wrong: 'shape' })
    transport.emit('docs', { action: 42, data: {} })
    transport.emit('docs', '')

    expect(ops).toHaveLength(0)
  })

  it('live message that arrives while queryFn is in flight is processed independently', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    let resolveQueryFn!: (rows: Doc[]) => void
    const queryFnPromise = new Promise<Doc[]>((r) => { resolveQueryFn = r })

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      queryFn: () => queryFnPromise,
    })
    const { ops } = driveSync(config)

    // Live message arrives before queryFn resolves.
    transport.emit('docs', { action: 'insert', data: { id: '99', title: 'live', version: 1 } })
    expect(ops).toHaveLength(1)
    expect((ops[0]!.value as Doc).id).toBe('99')

    // queryFn resolves after.
    resolveQueryFn([{ id: '1', title: 'db', version: 0 }])
    await new Promise((r) => setTimeout(r, 0))
    expect(ops).toHaveLength(2)
    expect((ops[1]!.value as Doc).id).toBe('1')
  })
})

// ---------------------------------------------------------------------------
// Invariant tests — numeric keys
// ---------------------------------------------------------------------------

describe('realtimeCollectionOptions — numeric keys', () => {
  interface NumericDoc { id: number; title: string }

  it('numeric primary keys (TKey = number) are tracked and merged correctly', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const merge = vi.fn((prev: NumericDoc, next: NumericDoc) => ({ ...next, title: prev.title + '→' + next.title }))

    const config = realtimeCollectionOptions<NumericDoc, number>({
      client, channel: 'docs', getKey: (d) => d.id, merge,
    })
    driveSync(config)

    transport.emit('docs', { action: 'insert', data: { id: 1, title: 'v1' } })
    transport.emit('docs', { action: 'update', data: { id: 1, title: 'v2' } })

    expect(merge).toHaveBeenCalledTimes(1)
    expect(merge.mock.calls[0]![0].id).toBe(1)
  })

  it('numeric key 0 is treated as a valid key (not falsy-ignored)', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const merge = vi.fn((prev: NumericDoc, next: NumericDoc) => ({ ...next }))

    const config = realtimeCollectionOptions<NumericDoc, number>({
      client, channel: 'docs', getKey: (d) => d.id, merge,
    })
    driveSync(config)

    transport.emit('docs', { action: 'insert', data: { id: 0, title: 'zero' } })
    transport.emit('docs', { action: 'update', data: { id: 0, title: 'zero-updated' } })

    expect(merge).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// Invariant tests — mutation wrappers
// ---------------------------------------------------------------------------

describe('realtimeCollectionOptions — mutation wrappers', () => {
  it('onInsert returning null does not publish to the primary channel', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      onInsert: async () => null,
    })
    driveSync(config)

    await config.onInsert!({
      transaction: {
        mutations: [{ modified: { id: '1', title: 'draft', version: 1 } as unknown, key: '1', original: {} }],
      },
    } as any)

    expect(transport.publishCalls).toHaveLength(0)
  })

  it('onUpdate returning null does not publish', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      onUpdate: async () => null,
    })
    driveSync(config)

    await config.onUpdate!({
      transaction: {
        mutations: [{ modified: { id: '1', title: 'draft', version: 1 } as unknown, key: '1', original: {} }],
      },
    } as any)

    expect(transport.publishCalls).toHaveLength(0)
  })

  it('onDelete publishes a delete action and removes the key from the merge baseline', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const merge = vi.fn((prev: Doc, next: Doc) => ({ ...next }))
    const deletedDoc: Doc = { id: '1', title: 'gone', version: 1 }

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      merge,
      onDelete: async () => deletedDoc,
    })
    driveSync(config)

    // Seed the key first so the baseline has an entry for it.
    transport.emit('docs', { action: 'insert', data: { id: '1', title: 'v1', version: 1 } })

    await config.onDelete!({
      transaction: {
        mutations: [{ modified: { id: '1' } as unknown, key: '1', original: {} }],
      },
    } as any)

    // Delete was published to the primary channel.
    expect(transport.publishCalls).toHaveLength(1)
    expect((transport.publishCalls[0]!.data as any).action).toBe('delete')

    // Baseline cleared — next insert for the same key does not trigger merge.
    merge.mockClear()
    transport.emit('docs', { action: 'insert', data: { id: '1', title: 'reborn', version: 2 } })
    expect(merge).not.toHaveBeenCalled()
  })

  it('onInsert publishes with action: insert and onUpdate with action: update', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const insertResult: Doc = { id: '1', title: 'new', version: 1 }
    const updateResult: Doc = { id: '1', title: 'updated', version: 2 }

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      onInsert: async () => insertResult,
      onUpdate: async () => updateResult,
    })
    driveSync(config)

    await config.onInsert!({ transaction: { mutations: [{ modified: {}, key: '1', original: {} }] } } as any)
    await config.onUpdate!({ transaction: { mutations: [{ modified: {}, key: '1', original: {} }] } } as any)

    expect(transport.publishCalls).toHaveLength(2)
    expect((transport.publishCalls[0]!.data as any).action).toBe('insert')
    expect((transport.publishCalls[1]!.data as any).action).toBe('update')
  })

  it('onInsert without a primary channel (channels-only mode) does not publish', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channels: ['shard-a', 'shard-b'],
      getKey: (d) => d.id,
      onInsert: async () => ({ id: '1', title: 'new', version: 1 }),
    })
    driveSync(config)

    await config.onInsert!({ transaction: { mutations: [{ modified: {}, key: '1', original: {} }] } } as any)

    expect(transport.publishCalls).toHaveLength(0)
  })
})
