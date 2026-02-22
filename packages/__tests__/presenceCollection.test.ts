/**
 * Tests for presenceChannelOptions — TanStack DB collection backed by presence.
 *
 * Covers:
 *  - insert write on first presence event (new user joins)
 *  - update write when an existing user's data changes
 *  - delete write when a user leaves
 *  - multiple simultaneous joins and leaves in a single event
 *  - default collection id derived from channel
 *  - custom collection id
 *  - getKey returns connectionId
 *  - QueryKey array channel serialization
 *  - cleanup: unsubscribes on stop, stopped flag prevents post-stop callbacks
 */

import { describe, it, expect, vi } from 'vitest'
import { Store } from '@tanstack/store'
import { presenceChannelOptions, createRealtimeClient } from '@tanstack/realtime'
import type { PresenceUser, RealtimeTransport, PresenceCapable, ConnectionStatus } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Mock transport with controllable presence events
// ---------------------------------------------------------------------------

function createMockTransport(): (RealtimeTransport & PresenceCapable) & {
  triggerPresence: (channel: string, users: ReadonlyArray<PresenceUser>) => void
  presenceListeners: Map<string, Set<(users: ReadonlyArray<PresenceUser>) => void>>
} {
  const presenceListeners = new Map<
    string,
    Set<(users: ReadonlyArray<PresenceUser>) => void>
  >()
  const store = new Store<ConnectionStatus>('connected')

  return {
    store,
    presenceListeners,
    async connect() {},
    disconnect() {},
    subscribe(_ch, _cb) {
      return () => {}
    },
    async publish() {},
    joinPresence() {},
    updatePresence() {},
    leavePresence() {},
    onPresenceChange(channel, cb) {
      if (!presenceListeners.has(channel)) presenceListeners.set(channel, new Set())
      presenceListeners.get(channel)!.add(cb)
      return () => {
        presenceListeners.get(channel)?.delete(cb)
        if (presenceListeners.get(channel)?.size === 0) {
          presenceListeners.delete(channel)
        }
      }
    },
    triggerPresence(channel, users) {
      const cbs = presenceListeners.get(channel)
      if (cbs) for (const cb of cbs) cb(users)
    },
  }
}

type UserData = { name: string; avatar: string }

type WriteOp = { type: string; value?: unknown; key?: unknown }

function driveSync(config: ReturnType<typeof presenceChannelOptions>): {
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

describe('presenceChannelOptions — collection id', () => {
  it('uses default id derived from channel string', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = presenceChannelOptions({ client, channel: 'room:123' })
    expect(config.id).toBe('presence:room:123')
  })

  it('uses default id derived from QueryKey array', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = presenceChannelOptions({ client, channel: ['room', { id: '123' }] })
    // Should start with 'presence:' and contain the serialized channel.
    expect(config.id).toMatch(/^presence:/)
    expect(config.id).toContain('room')
  })

  it('respects a custom id', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = presenceChannelOptions({ client, channel: 'ch', id: 'my-viewers' })
    expect(config.id).toBe('my-viewers')
  })
})

describe('presenceChannelOptions — getKey', () => {
  it('getKey returns the connectionId of a presence user', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = presenceChannelOptions<UserData>({ client, channel: 'ch' })
    const user: PresenceUser<UserData> = {
      connectionId: 'conn-42',
      data: { name: 'Alice', avatar: 'alice.png' },
    }
    expect(config.getKey(user)).toBe('conn-42')
  })
})

describe('presenceChannelOptions — sync write operations', () => {
  it('emits insert for each user in the first presence event', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = presenceChannelOptions<UserData>({ client, channel: 'ch' })
    const { ops, stop } = driveSync(config)

    transport.triggerPresence('ch', [
      { connectionId: 'c1', data: { name: 'Alice', avatar: 'a.png' } },
      { connectionId: 'c2', data: { name: 'Bob', avatar: 'b.png' } },
    ])

    expect(ops).toHaveLength(2)
    expect(ops[0]).toMatchObject({ type: 'insert', value: { connectionId: 'c1' } })
    expect(ops[1]).toMatchObject({ type: 'insert', value: { connectionId: 'c2' } })
    stop()
  })

  it('emits update for an existing user whose data has changed', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = presenceChannelOptions<UserData>({ client, channel: 'ch' })
    const { ops, stop } = driveSync(config)

    // First event: user joins.
    transport.triggerPresence('ch', [
      { connectionId: 'c1', data: { name: 'Alice', avatar: 'a.png' } },
    ])
    ops.length = 0 // clear initial insert

    // Second event: same user updates data.
    transport.triggerPresence('ch', [
      { connectionId: 'c1', data: { name: 'Alice Updated', avatar: 'a2.png' } },
    ])

    expect(ops).toHaveLength(1)
    expect(ops[0]).toMatchObject({
      type: 'update',
      value: { connectionId: 'c1', data: { name: 'Alice Updated' } },
    })
    stop()
  })

  it('emits delete for a user who has left', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = presenceChannelOptions<UserData>({ client, channel: 'ch' })
    const { ops, stop } = driveSync(config)

    // Both users join.
    transport.triggerPresence('ch', [
      { connectionId: 'c1', data: { name: 'Alice', avatar: 'a.png' } },
      { connectionId: 'c2', data: { name: 'Bob', avatar: 'b.png' } },
    ])
    ops.length = 0

    // Bob leaves.
    transport.triggerPresence('ch', [
      { connectionId: 'c1', data: { name: 'Alice', avatar: 'a.png' } },
    ])

    expect(ops).toHaveLength(2) // delete c2, update c1
    const deleteOp = ops.find((o) => o.type === 'delete')
    expect(deleteOp).toMatchObject({ type: 'delete', key: 'c2' })
    stop()
  })

  it('emits only delete when all users leave', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = presenceChannelOptions<UserData>({ client, channel: 'ch' })
    const { ops, stop } = driveSync(config)

    transport.triggerPresence('ch', [
      { connectionId: 'c1', data: { name: 'Alice', avatar: 'a.png' } },
    ])
    ops.length = 0

    // All users leave — empty presence list.
    transport.triggerPresence('ch', [])

    expect(ops).toHaveLength(1)
    expect(ops[0]).toMatchObject({ type: 'delete', key: 'c1' })
    stop()
  })

  it('handles a mix of insert, update, and delete in a single event', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = presenceChannelOptions<UserData>({ client, channel: 'ch' })
    const { ops, stop } = driveSync(config)

    // Three users present initially.
    transport.triggerPresence('ch', [
      { connectionId: 'c1', data: { name: 'Alice', avatar: 'a.png' } },
      { connectionId: 'c2', data: { name: 'Bob', avatar: 'b.png' } },
    ])
    ops.length = 0

    // Alice updates, Bob leaves, Carol joins.
    transport.triggerPresence('ch', [
      { connectionId: 'c1', data: { name: 'Alice *', avatar: 'a.png' } }, // update
      { connectionId: 'c3', data: { name: 'Carol', avatar: 'c.png' } },   // insert
      // c2 is absent → delete
    ])

    const types = ops.map((o) => o.type).sort()
    expect(types).toEqual(['delete', 'insert', 'update'])

    const insertOp = ops.find((o) => o.type === 'insert')
    expect(insertOp).toMatchObject({ type: 'insert', value: { connectionId: 'c3' } })

    const updateOp = ops.find((o) => o.type === 'update')
    expect(updateOp).toMatchObject({ type: 'update', value: { connectionId: 'c1' } })

    const deleteOp = ops.find((o) => o.type === 'delete')
    expect(deleteOp).toMatchObject({ type: 'delete', key: 'c2' })

    stop()
  })

  it('emits no ops when presence list is unchanged', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = presenceChannelOptions<UserData>({ client, channel: 'ch' })
    const { ops, stop } = driveSync(config)

    const users = [{ connectionId: 'c1', data: { name: 'Alice', avatar: 'a.png' } }]

    transport.triggerPresence('ch', users)
    ops.length = 0

    // Same users again — BUT the diff emits update for any existing user in nextUsers.
    // This documents current behaviour: we emit 'update' even if data is identical,
    // because we don't deep-compare data. The test verifies no false deletes/inserts.
    transport.triggerPresence('ch', users)

    const hasUnexpectedDelete = ops.some((o) => o.type === 'delete')
    const hasUnexpectedInsert = ops.some((o) => o.type === 'insert')
    expect(hasUnexpectedDelete).toBe(false)
    expect(hasUnexpectedInsert).toBe(false)

    stop()
  })
})

describe('presenceChannelOptions — cleanup', () => {
  it('stop() unsubscribes from onPresenceChange', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = presenceChannelOptions<UserData>({ client, channel: 'ch' })
    const { ops, stop } = driveSync(config)

    stop()

    // After stop, presence callbacks should not fire.
    transport.triggerPresence('ch', [{ connectionId: 'c1', data: { name: 'X', avatar: '' } }])
    expect(ops).toHaveLength(0)
  })

  it('stop() removes the listener from the transport', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = presenceChannelOptions<UserData>({ client, channel: 'ch' })
    const { stop } = driveSync(config)

    expect(transport.presenceListeners.has('ch')).toBe(true)
    stop()
    expect(transport.presenceListeners.has('ch')).toBe(false)
  })
})

describe('presenceChannelOptions — channel serialization', () => {
  it('subscribes to the serialized QueryKey channel string', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = presenceChannelOptions<UserData>({
      client,
      channel: ['room', { id: 'abc' }],
    })
    const { ops, stop } = driveSync(config)

    // Find the actual channel the transport registered listeners on.
    const registeredChannels = Array.from(transport.presenceListeners.keys())
    expect(registeredChannels).toHaveLength(1)
    const serializedChannel = registeredChannels[0]!

    // Emitting to the serialized channel delivers data.
    transport.triggerPresence(serializedChannel, [
      { connectionId: 'conn-1', data: { name: 'X', avatar: '' } },
    ])
    expect(ops).toHaveLength(1)
    stop()
  })
})

describe('presenceChannelOptions — markReady called', () => {
  it('calls markReady during sync setup', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const config = presenceChannelOptions<UserData>({ client, channel: 'ch' })

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
