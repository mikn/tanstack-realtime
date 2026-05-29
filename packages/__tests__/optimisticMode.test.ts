/**
 * Tests for optimistic mode in realtimeCollectionOptions (Feature 1).
 *
 * Covers:
 * - Echo suppression: messages from self with matching nonce are not applied
 * - Messages from other clients are always applied
 * - onOptimisticError callback fires on mutation failure
 * - Nonce is cleaned up on failure
 * - Non-optimistic mode (default) does not include nonce
 */

import { describe, expect, it, vi } from 'vitest'
import { Store } from '@tanstack/store'
import {
  createRealtimeClient,
  realtimeCollectionOptions,
} from '@realtimejs/core'
import type {
  ConnectionStatus,
  RealtimeChannelMessage,
  RealtimeTransport,
} from '@realtimejs/core'
import type { CollectionConfig } from '@tanstack/db'

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
    publish(channel, data) {
      publishCalls.push({ channel, data })
      return Promise.resolve()
    },
    hook() {
      return { unhook: () => {} }
    },
    emit(channel: string, data: unknown) {
      const cbs = listeners.get(channel)
      if (cbs) for (const cb of cbs) cb(data)
    },
  }
}

// ---------------------------------------------------------------------------
// Types + helpers
// ---------------------------------------------------------------------------

interface Doc {
  id: string
  title: string
}

type WriteOp = { type: string; value?: unknown; key?: unknown }

function driveSync(config: CollectionConfig<any, any, any, any>): {
  ops: Array<WriteOp>
  stop: () => void
} {
  const ops: Array<WriteOp> = []
  const stop = config.sync.sync({
    collection: null as any,
    begin: () => {},
    write: (op: WriteOp) => ops.push(op),
    commit: () => {},
    markReady: () => {},
    truncate: () => {},
  })
  return { ops, stop: stop as unknown as () => void }
}

// ---------------------------------------------------------------------------
// Tests: Optimistic mode — echo suppression
// ---------------------------------------------------------------------------

describe('realtimeCollectionOptions — optimistic mode', () => {
  it('publishes with _nonce and _clientId when optimistic: true', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      optimistic: true,
      onInsert: () => Promise.resolve({ id: '1', title: 'new' }),
    })
    driveSync(config)

    await config.onInsert!({
      transaction: {
        mutations: [
          { modified: { id: '1', title: 'new' }, key: '1', original: {} },
        ],
      },
    } as any)

    expect(transport.publishCalls).toHaveLength(1)
    const published = transport.publishCalls[0].data as RealtimeChannelMessage
    expect(published._nonce).toBeDefined()
    expect(published._clientId).toBe(client.clientId)
  })

  it('does NOT publish _nonce when optimistic: false (default)', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      onInsert: () => Promise.resolve({ id: '1', title: 'new' }),
    })
    driveSync(config)

    await config.onInsert!({
      transaction: {
        mutations: [
          { modified: { id: '1', title: 'new' }, key: '1', original: {} },
        ],
      },
    } as any)

    const published = transport.publishCalls[0].data as RealtimeChannelMessage
    expect(published._nonce).toBeUndefined()
    expect(published._clientId).toBeUndefined()
  })

  it('suppresses echo: message from self with matching nonce is not applied', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      optimistic: true,
      onInsert: () => Promise.resolve({ id: '1', title: 'new' }),
    })
    const { ops } = driveSync(config)

    // Perform the mutation
    await config.onInsert!({
      transaction: {
        mutations: [
          { modified: { id: '1', title: 'new' }, key: '1', original: {} },
        ],
      },
    } as any)

    const published = transport.publishCalls[0].data as RealtimeChannelMessage
    const opsBeforeEcho = ops.length

    // Simulate the echo coming back from the server
    transport.emit('docs', published)

    // The echo should be suppressed — no new ops
    expect(ops.length).toBe(opsBeforeEcho)
  })

  it('applies messages from other clients (different _clientId)', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      optimistic: true,
    })
    const { ops } = driveSync(config)

    // Message from another client
    transport.emit('docs', {
      action: 'insert',
      data: { id: '2', title: 'from-peer' },
      _nonce: 'other-nonce',
      _clientId: 'other-client-id',
    })

    expect(ops).toHaveLength(1)
    expect((ops[0].value as Doc).id).toBe('2')
  })

  it('applies messages without _nonce (non-optimistic peers)', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      optimistic: true,
    })
    const { ops } = driveSync(config)

    // Standard message without nonce (from a non-optimistic client)
    transport.emit('docs', {
      action: 'insert',
      data: { id: '3', title: 'standard' },
    })

    expect(ops).toHaveLength(1)
  })

  it('calls onOptimisticError when mutation fails', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const onOptimisticError = vi.fn()

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      optimistic: true,
      onOptimisticError,
      onInsert: () => Promise.reject(new Error('Server error')),
    })
    driveSync(config)

    await expect(
      config.onInsert!({
        transaction: {
          mutations: [
            { modified: { id: '1', title: 'new' }, key: '1', original: {} },
          ],
        },
      } as any),
    ).rejects.toThrow('Server error')

    expect(onOptimisticError).toHaveBeenCalledTimes(1)
    expect(onOptimisticError).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'insert',
        key: '1',
      }),
    )
  })

  it('cleans up nonce on mutation failure (no leak)', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      optimistic: true,
      onInsert: () => Promise.reject(new Error('fail')),
    })
    const { ops } = driveSync(config)

    await config.onInsert!({
      transaction: {
        mutations: [
          { modified: { id: '1', title: 'new' }, key: '1', original: {} },
        ],
      },
    } as any).catch(() => {})

    // Nothing was published (mutation failed before publish)
    expect(transport.publishCalls).toHaveLength(0)

    // A message that looks like it has the same client ID should still
    // be applied since the nonce was cleaned up
    transport.emit('docs', {
      action: 'insert',
      data: { id: '1', title: 'from-server' },
      _nonce: 'some-nonce',
      _clientId: client.clientId,
    })

    // Should be applied since no matching nonce in pending set
    expect(ops).toHaveLength(1)
  })

  it('update mutation includes nonce in optimistic mode', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      optimistic: true,
      onUpdate: () => Promise.resolve({ id: '1', title: 'updated' }),
    })
    driveSync(config)

    await config.onUpdate!({
      transaction: {
        mutations: [
          { modified: { id: '1', title: 'updated' }, key: '1', original: {} },
        ],
      },
    } as any)

    const published = transport.publishCalls[0].data as RealtimeChannelMessage
    expect(published._nonce).toBeDefined()
    expect(published._clientId).toBe(client.clientId)
    expect(published.action).toBe('update')
  })

  it('delete mutation includes nonce in optimistic mode', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      optimistic: true,
      onDelete: () => Promise.resolve({ id: '1', title: 'gone' }),
    })
    const { ops: _ops } = driveSync(config)

    // Seed the entry
    transport.emit('docs', {
      action: 'insert',
      data: { id: '1', title: 'existing' },
    })

    await config.onDelete!({
      transaction: {
        mutations: [{ modified: { id: '1' }, key: '1', original: {} }],
      },
    } as any)

    const published = transport.publishCalls[0].data as RealtimeChannelMessage
    expect(published._nonce).toBeDefined()
    expect(published._clientId).toBe(client.clientId)
    expect(published.action).toBe('delete')
  })

  it('cleans up nonce when publish fails after successful mutation (insert)', async () => {
    const transport = createMockTransport()
    // Override publish to fail after mutation succeeds
    const originalPublish = transport.publish.bind(transport)
    let publishCallCount = 0
    transport.publish = (_channel, _data) => {
      publishCallCount++
      return Promise.reject(new Error('Network error on publish'))
    }

    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      optimistic: true,
      onInsert: () => Promise.resolve({ id: '1', title: 'new' }),
    })
    const { ops } = driveSync(config)

    // Mutation succeeds, publish fails — nonce should be cleaned up
    await config.onInsert!({
      transaction: {
        mutations: [
          { modified: { id: '1', title: 'new' }, key: '1', original: {} },
        ],
      },
    } as any)

    expect(publishCallCount).toBe(1) // publish was attempted

    // The nonce should be cleaned up — a subsequent message with the same
    // clientId should NOT be suppressed
    transport.publish = originalPublish
    transport.emit('docs', {
      action: 'insert',
      data: { id: '1', title: 'from-server' },
      _nonce: 'different-nonce',
      _clientId: client.clientId,
    })

    // Should be applied (nonce was cleaned up, 'different-nonce' won't match)
    expect(ops).toHaveLength(1)
  })

  it('cleans up nonce when publish fails after successful mutation (update)', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      optimistic: true,
      onUpdate: () => Promise.resolve({ id: '1', title: 'updated' }),
    })
    const { ops } = driveSync(config)

    // Seed the entry
    transport.emit('docs', {
      action: 'insert',
      data: { id: '1', title: 'existing' },
    })

    // Make publish fail
    transport.publish = () => {
      return Promise.reject(new Error('Publish failed'))
    }

    await config.onUpdate!({
      transaction: {
        mutations: [
          { modified: { id: '1', title: 'updated' }, key: '1', original: {} },
        ],
      },
    } as any)

    // Nonce should be cleaned up — server echo should not be suppressed
    transport.publish = async () => {} // restore
    transport.emit('docs', {
      action: 'update',
      data: { id: '1', title: 'server-update' },
      _nonce: 'server-nonce',
      _clientId: client.clientId,
    })

    // 1 insert from seed + 1 update from server echo
    expect(ops.filter((o) => o.type === 'update')).toHaveLength(1)
  })

  it('concurrent mutations on same key have independent nonces', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    let insertCall = 0

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      optimistic: true,
      onInsert: async () => {
        insertCall++
        if (insertCall === 1) {
          return { id: '1', title: 'first' }
        }
        return { id: '2', title: 'second' }
      },
    })
    const { ops } = driveSync(config)

    // Two concurrent mutations
    await config.onInsert!({
      transaction: {
        mutations: [
          { modified: { id: '1', title: 'first' }, key: '1', original: {} },
        ],
      },
    } as any)

    await config.onInsert!({
      transaction: {
        mutations: [
          { modified: { id: '2', title: 'second' }, key: '2', original: {} },
        ],
      },
    } as any)

    // Both should have different nonces
    const nonce1 = (transport.publishCalls[0].data as RealtimeChannelMessage)
      ._nonce
    const nonce2 = (transport.publishCalls[1].data as RealtimeChannelMessage)
      ._nonce
    expect(nonce1).toBeDefined()
    expect(nonce2).toBeDefined()
    expect(nonce1).not.toBe(nonce2)

    // Echo from first mutation: should be suppressed
    transport.emit('docs', transport.publishCalls[0].data)
    // Echo from second mutation: should be suppressed
    transport.emit('docs', transport.publishCalls[1].data)

    // No ops from echoes
    expect(ops).toHaveLength(0)
  })

  it('onInsert returning null cleans up nonce', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Doc, string>({
      client,
      channel: 'docs',
      getKey: (d) => d.id,
      optimistic: true,
      onInsert: () => Promise.resolve(null),
    })
    const { ops } = driveSync(config)

    await config.onInsert!({
      transaction: {
        mutations: [
          { modified: { id: '1', title: 'new' }, key: '1', original: {} },
        ],
      },
    } as any)

    // No publish since result was null
    expect(transport.publishCalls).toHaveLength(0)

    // A subsequent message from the same clientId should be applied
    transport.emit('docs', {
      action: 'insert',
      data: { id: '1', title: 'from-server' },
      _nonce: 'whatever',
      _clientId: client.clientId,
    })

    expect(ops).toHaveLength(1)
  })
})
