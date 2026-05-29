import { describe, expect, it, vi } from 'vitest'
import {
  createMockPresenceTransport,
  createMockTransport,
  createRealtimeClient,
} from '@realtimejs/core'

describe('createMockTransport', () => {
  it('starts in connected state by default', () => {
    const transport = createMockTransport()
    expect(transport.store.get()).toBe('connected')
  })

  it('starts in custom state when specified', () => {
    const transport = createMockTransport({ initialStatus: 'disconnected' })
    expect(transport.store.get()).toBe('disconnected')
  })

  it('simulateMessage delivers to subscribers', () => {
    const transport = createMockTransport()
    const handler = vi.fn()
    transport.subscribe('test-channel', handler)

    transport.simulateMessage('test-channel', { hello: 'world' })

    expect(handler).toHaveBeenCalledWith({ hello: 'world' })
  })

  it('does not deliver to unsubscribed listeners', () => {
    const transport = createMockTransport()
    const handler = vi.fn()
    const unsub = transport.subscribe('test-channel', handler)
    unsub()

    transport.simulateMessage('test-channel', { hello: 'world' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('records publish calls in publishLog', async () => {
    const transport = createMockTransport()
    await transport.publish('ch1', { a: 1 })
    await transport.publish('ch2', { b: 2 })

    expect(transport.publishLog).toHaveLength(2)
    expect(transport.publishLog[0].channel).toBe('ch1')
    expect(transport.publishLog[0].data).toEqual({ a: 1 })
    expect(transport.publishLog[1].channel).toBe('ch2')
  })

  it('clearLog empties the publish log', async () => {
    const transport = createMockTransport()
    await transport.publish('ch1', { a: 1 })
    transport.clearLog()
    expect(transport.publishLog).toHaveLength(0)
  })

  it('activeChannels tracks current subscriptions', () => {
    const transport = createMockTransport()
    const unsub1 = transport.subscribe('ch1', () => {})
    transport.subscribe('ch2', () => {})

    expect(transport.activeChannels).toEqual(new Set(['ch1', 'ch2']))

    unsub1()
    expect(transport.activeChannels).toEqual(new Set(['ch2']))
  })

  it('simulateDisconnect sets status to reconnecting', () => {
    const transport = createMockTransport()
    transport.simulateDisconnect()
    expect(transport.store.get()).toBe('reconnecting')
  })

  it('simulateReconnect sets status to connected', () => {
    const transport = createMockTransport()
    transport.simulateDisconnect()
    transport.simulateReconnect()
    expect(transport.store.get()).toBe('connected')
  })

  it('simulateSubscribeError fires error callbacks', () => {
    const transport = createMockTransport()
    const handler = vi.fn()
    transport.onSubscribeError(handler)

    transport.simulateSubscribeError('secret-channel', 'unauthorized', 4403)

    expect(handler).toHaveBeenCalledWith('secret-channel', 'unauthorized', 4403)
  })

  it('onSubscribeError unsubscribe stops callbacks', () => {
    const transport = createMockTransport()
    const handler = vi.fn()
    const unsub = transport.onSubscribeError(handler)
    unsub()

    transport.simulateSubscribeError('secret-channel', 'unauthorized')
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('createMockPresenceTransport', () => {
  it('implements joinPresence and onPresenceChange', () => {
    const transport = createMockPresenceTransport()
    const handler = vi.fn()
    transport.onPresenceChange('room', handler)

    transport.joinPresence('room', { name: 'Alice' })

    expect(handler).toHaveBeenCalledTimes(1)
    const users = handler.mock.calls[0][0]
    expect(users).toHaveLength(1)
    expect(users[0].data).toEqual({ name: 'Alice' })
  })

  it('simulatePresenceJoin adds external users', () => {
    const transport = createMockPresenceTransport()
    const handler = vi.fn()
    transport.onPresenceChange('room', handler)

    transport.simulatePresenceJoin('room', {
      connectionId: 'peer-1',
      data: { name: 'Bob' },
    })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0]).toHaveLength(1)
    expect(handler.mock.calls[0][0][0].data).toEqual({ name: 'Bob' })
  })

  it('simulatePresenceLeave removes users by connectionId', () => {
    const transport = createMockPresenceTransport()
    const handler = vi.fn()
    transport.onPresenceChange('room', handler)

    transport.simulatePresenceJoin('room', {
      connectionId: 'peer-1',
      data: { name: 'Bob' },
    })
    transport.simulatePresenceLeave('room', 'peer-1')

    expect(handler).toHaveBeenCalledTimes(2)
    expect(handler.mock.calls[1][0]).toHaveLength(0)
  })

  it('updatePresence merges data', () => {
    const transport = createMockPresenceTransport()
    const handler = vi.fn()
    transport.onPresenceChange('room', handler)

    transport.joinPresence('room', { name: 'Alice', cursor: null })
    transport.updatePresence('room', { cursor: { x: 10, y: 20 } })

    expect(handler).toHaveBeenCalledTimes(2)
    const updated = handler.mock.calls[1][0][0].data
    expect(updated).toEqual({ name: 'Alice', cursor: { x: 10, y: 20 } })
  })

  it('leavePresence removes self from channel', () => {
    const transport = createMockPresenceTransport()
    const handler = vi.fn()
    transport.onPresenceChange('room', handler)

    transport.joinPresence('room', { name: 'Alice' })
    transport.leavePresence('room')

    expect(handler).toHaveBeenCalledTimes(2)
    expect(handler.mock.calls[1][0]).toHaveLength(0)
  })

  it('getPresenceState returns current state', () => {
    const transport = createMockPresenceTransport()
    transport.simulatePresenceJoin('room', {
      connectionId: 'p1',
      data: { name: 'Alice' },
    })

    const state = transport.getPresenceState('room')
    expect(state).toHaveLength(1)
    expect(state[0].data).toEqual({ name: 'Alice' })
  })

  it('inherits MockTransport methods (publish, subscribe, etc.)', async () => {
    const transport = createMockPresenceTransport()
    const handler = vi.fn()
    transport.subscribe('ch', handler)
    transport.simulateMessage('ch', { test: true })
    expect(handler).toHaveBeenCalledWith({ test: true })

    await transport.publish('ch', { out: true })
    expect(transport.publishLog).toHaveLength(1)
  })
})

describe('integration with createRealtimeClient', () => {
  it('mock transport works as a real client transport', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    expect(client.store.get().status).toBe('connected')

    const handler = vi.fn()
    client.subscribe('test', handler)
    transport.simulateMessage('test', { msg: 'hi' })

    expect(handler).toHaveBeenCalledWith({ msg: 'hi' })
  })

  it('mock presence transport works with client presence methods', () => {
    const transport = createMockPresenceTransport()
    const client = createRealtimeClient({ transport })

    const handler = vi.fn()
    client.onPresenceChange('room', handler)
    client.joinPresence('room', { name: 'Test' })

    expect(handler).toHaveBeenCalledTimes(1)
  })
})
