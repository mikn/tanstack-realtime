/**
 * Tests for the `channels[]` fan-in option in realtimeCollectionOptions.
 *
 * Fan-in lets multiple pub/sub channels feed a single collection — the classic
 * use case being geographic shards (`us-east:orders`, `eu:orders`, …) that
 * belong to the same logical dataset.
 *
 * Cross-collection joins (orders + inventory) belong at the query layer;
 * those are intentionally NOT covered here.
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
  subscribedChannels: () => string[]
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
      return () => {
        listeners.get(channel)?.delete(onMessage)
        if (listeners.get(channel)?.size === 0) listeners.delete(channel)
      }
    },
    async publish(channel, data) {
      publishCalls.push({ channel, data })
    },
    joinPresence() {},
    updatePresence() {},
    leavePresence() {},
    onPresenceChange(_ch, _cb) { return () => {} },
    emit(channel: string, data: unknown) {
      const cbs = listeners.get(channel)
      if (cbs) for (const cb of cbs) cb(data)
    },
    subscribedChannels() {
      return [...listeners.keys()]
    },
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Order {
  id: string
  region: string
  amount: number
}

type WriteOp = { type: string; value?: unknown; key?: unknown }

function driveSync(
  config: ReturnType<typeof realtimeCollectionOptions>,
): { ops: WriteOp[]; stop: () => void } {
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

// ---------------------------------------------------------------------------
// Invariant tests
// ---------------------------------------------------------------------------

describe('realtimeCollectionOptions — channels fan-in', () => {
  it('subscribes to the primary channel', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const subscribeSpy = vi.spyOn(transport, 'subscribe')

    const config = realtimeCollectionOptions<Order, string>({
      client,
      channel: 'us-east:orders',
      getKey: (o) => o.id,
    })
    driveSync(config)

    expect(subscribeSpy).toHaveBeenCalledWith('us-east:orders', expect.any(Function))
  })

  it('subscribes to every channel in the channels[] array', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const subscribeSpy = vi.spyOn(transport, 'subscribe')

    const config = realtimeCollectionOptions<Order, string>({
      client,
      channel: 'us-east:orders',
      channels: ['eu:orders', 'ap:orders'],
      getKey: (o) => o.id,
    })
    driveSync(config)

    expect(subscribeSpy).toHaveBeenCalledWith('us-east:orders', expect.any(Function))
    expect(subscribeSpy).toHaveBeenCalledWith('eu:orders', expect.any(Function))
    expect(subscribeSpy).toHaveBeenCalledWith('ap:orders', expect.any(Function))
    expect(subscribeSpy).toHaveBeenCalledTimes(3)
  })

  it('messages from all channels land in the same collection', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Order, string>({
      client,
      channel: 'us-east:orders',
      channels: ['eu:orders', 'ap:orders'],
      getKey: (o) => o.id,
    })
    const { ops } = driveSync(config)

    transport.emit('us-east:orders', { action: 'insert', data: { id: '1', region: 'us', amount: 100 } })
    transport.emit('eu:orders', { action: 'insert', data: { id: '2', region: 'eu', amount: 200 } })
    transport.emit('ap:orders', { action: 'insert', data: { id: '3', region: 'ap', amount: 300 } })

    expect(ops).toHaveLength(3)
    expect((ops[0]!.value as Order).region).toBe('us')
    expect((ops[1]!.value as Order).region).toBe('eu')
    expect((ops[2]!.value as Order).region).toBe('ap')
  })

  it('fan-in channels each support insert, update, and delete', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Order, string>({
      client,
      channel: 'primary',
      channels: ['secondary'],
      getKey: (o) => o.id,
    })
    const { ops } = driveSync(config)

    transport.emit('secondary', { action: 'insert', data: { id: 'A', region: 'x', amount: 1 } })
    transport.emit('secondary', { action: 'update', data: { id: 'A', region: 'x', amount: 2 } })
    transport.emit('secondary', { action: 'delete', data: { id: 'A', region: 'x', amount: 0 } })

    expect(ops[0]!.type).toBe('insert')
    expect(ops[1]!.type).toBe('update')
    expect(ops[2]!.type).toBe('delete')
    expect(ops[2]!.key).toBe('A')
  })

  it('publish-back after a mutation goes ONLY to the primary channel', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Order, string>({
      client,
      channel: 'primary',
      channels: ['secondary', 'tertiary'],
      getKey: (o) => o.id,
      onInsert: async () => ({ id: '1', region: 'us', amount: 50 }),
    })
    driveSync(config)

    await config.onInsert!({
      transaction: {
        mutations: [{ modified: { id: '1', region: 'us', amount: 50 } as unknown, key: '1', original: {} }],
      },
    } as any)

    expect(transport.publishCalls).toHaveLength(1)
    expect(transport.publishCalls[0]!.channel).toBe('primary')
  })

  it('channels-only (no primary channel) works and disables publish-back', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Order, string>({
      client,
      channels: ['shard-a', 'shard-b'],
      getKey: (o) => o.id,
      onInsert: async () => ({ id: '1', region: 'us', amount: 50 }),
    })
    const { ops } = driveSync(config)

    transport.emit('shard-a', { action: 'insert', data: { id: '1', region: 'a', amount: 10 } })
    transport.emit('shard-b', { action: 'insert', data: { id: '2', region: 'b', amount: 20 } })

    expect(ops).toHaveLength(2)

    // No publish-back because there's no primary channel.
    await config.onInsert!({
      transaction: {
        mutations: [{ modified: { id: '3', region: 'us', amount: 50 } as unknown, key: '3', original: {} }],
      },
    } as any)
    expect(transport.publishCalls).toHaveLength(0)
  })

  it('throws if neither channel nor channels[] is provided', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    expect(() =>
      realtimeCollectionOptions<Order, string>({
        client,
        getKey: (o) => o.id,
      } as any),
    ).toThrow('[realtimeCollectionOptions]')
  })

  it('throws if channels[] is an empty array and no channel provided', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    expect(() =>
      realtimeCollectionOptions<Order, string>({
        client,
        channels: [],
        getKey: (o) => o.id,
      }),
    ).toThrow('[realtimeCollectionOptions]')
  })

  it('serializes QueryKey arrays for additional channels', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const subscribeSpy = vi.spyOn(transport, 'subscribe')

    const config = realtimeCollectionOptions<Order, string>({
      client,
      channel: 'primary',
      channels: [['region', { id: 'eu' }]],
      getKey: (o) => o.id,
    })
    driveSync(config)

    expect(subscribeSpy).toHaveBeenCalledWith('region:id=eu', expect.any(Function))
  })

  it('serializes the primary channel QueryKey array', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const subscribeSpy = vi.spyOn(transport, 'subscribe')

    const config = realtimeCollectionOptions<Order, string>({
      client,
      channel: ['orders', { region: 'us' }],
      getKey: (o) => o.id,
    })
    driveSync(config)

    expect(subscribeSpy).toHaveBeenCalledWith('orders:region=us', expect.any(Function))
  })

  it('cleanup unsubscribes from ALL channels', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Order, string>({
      client,
      channel: 'ch-a',
      channels: ['ch-b', 'ch-c'],
      getKey: (o) => o.id,
    })
    const { ops, stop } = driveSync(config)

    stop()

    const countBefore = ops.length
    transport.emit('ch-a', { action: 'insert', data: { id: '1', region: 'a', amount: 1 } })
    transport.emit('ch-b', { action: 'insert', data: { id: '2', region: 'b', amount: 2 } })
    transport.emit('ch-c', { action: 'insert', data: { id: '3', region: 'c', amount: 3 } })

    expect(ops.length).toBe(countBefore)
  })

  it('merge is applied consistently across all fan-in channels', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const merge = vi.fn((prev: Order, next: Order) => ({ ...next, amount: prev.amount }))

    const config = realtimeCollectionOptions<Order, string>({
      client,
      channel: 'ch-a',
      channels: ['ch-b'],
      getKey: (o) => o.id,
      merge,
    })
    const { ops } = driveSync(config)

    // Insert from ch-a establishes the key.
    transport.emit('ch-a', { action: 'insert', data: { id: '1', region: 'a', amount: 100 } })
    // Update from ch-b triggers merge.
    transport.emit('ch-b', { action: 'update', data: { id: '1', region: 'b', amount: 200 } })

    expect(merge).toHaveBeenCalledTimes(1)
    const updateOp = ops.find((op) => op.type === 'update')!
    // merge preserved amount from ch-a insert.
    expect((updateOp.value as Order).amount).toBe(100)
    expect((updateOp.value as Order).region).toBe('b')
  })

  it('ordering: messages are processed in arrival order across channels', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Order, string>({
      client,
      channel: 'ch-1',
      channels: ['ch-2', 'ch-3'],
      getKey: (o) => o.id,
    })
    const { ops } = driveSync(config)

    // Interleave messages across three channels.
    transport.emit('ch-3', { action: 'insert', data: { id: 'C', region: 'c', amount: 3 } })
    transport.emit('ch-1', { action: 'insert', data: { id: 'A', region: 'a', amount: 1 } })
    transport.emit('ch-2', { action: 'insert', data: { id: 'B', region: 'b', amount: 2 } })

    expect(ops.map((op) => (op.value as Order).id)).toEqual(['C', 'A', 'B'])
  })
})
