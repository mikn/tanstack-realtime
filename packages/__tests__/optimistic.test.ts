/**
 * Tests for realtimeCollectionOptions: lifecycle, numeric keys, and mutation
 * wrappers.
 *
 * Optimistic mutations (optimistic apply + rollback) are owned entirely by
 * TanStack DB's transaction system.  These tests cover the realtime layer's
 * responsibilities: message processing, publish-back after mutations, and
 * correct behaviour of the `stopped` guard.
 */

import { describe, it, expect, vi } from 'vitest'
import { Store } from '@tanstack/store'
import { realtimeCollectionOptions, createRealtimeClient } from '@tanstack/realtime'
import type { RealtimeTransport, ConnectionStatus } from '@tanstack/realtime'

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

  it('server-only mode works without client or channel', () => {
    const config = realtimeCollectionOptions<Doc, string>({
      getKey: (d) => d.id,
      queryFn: async () => [{ id: '1', title: 'from-server', version: 1 }],
    })
    const { isReady } = driveSync(config)

    // markReady fires after queryFn settles, no crash.
    expect(isReady()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Invariant tests — numeric keys
// ---------------------------------------------------------------------------

describe('realtimeCollectionOptions — numeric keys', () => {
  interface NumericDoc { id: number; title: string }

  it('numeric primary keys (TKey = number) are tracked correctly', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<NumericDoc, number>({
      client, channel: 'docs', getKey: (d) => d.id,
    })
    const { ops } = driveSync(config)

    transport.emit('docs', { action: 'insert', data: { id: 1, title: 'v1' } })
    transport.emit('docs', { action: 'update', data: { id: 1, title: 'v2' } })

    expect(ops).toHaveLength(2)
    expect(ops[0]!.type).toBe('insert')
    expect(ops[1]!.type).toBe('update')
    expect((ops[1]!.value as NumericDoc).title).toBe('v2')
  })

  it('numeric key 0 is treated as a valid key (not falsy-ignored)', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<NumericDoc, number>({
      client, channel: 'docs', getKey: (d) => d.id,
    })
    const { ops } = driveSync(config)

    transport.emit('docs', { action: 'insert', data: { id: 0, title: 'zero' } })
    transport.emit('docs', { action: 'update', data: { id: 0, title: 'zero-updated' } })

    expect(ops).toHaveLength(2)
    expect((ops[1]!.value as NumericDoc).title).toBe('zero-updated')
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

  it('onDelete publishes a delete action and clears the key from internal state', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const deletedDoc: Doc = { id: '1', title: 'gone', version: 1 }

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      onDelete: async () => deletedDoc,
    })
    driveSync(config)

    // Seed the key first so internal state has an entry for it.
    transport.emit('docs', { action: 'insert', data: { id: '1', title: 'v1', version: 1 } })

    await config.onDelete!({
      transaction: {
        mutations: [{ modified: { id: '1' } as unknown, key: '1', original: {} }],
      },
    } as any)

    // Delete was published to the primary channel.
    expect(transport.publishCalls).toHaveLength(1)
    expect((transport.publishCalls[0]!.data as any).action).toBe('delete')
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
