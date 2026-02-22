/**
 * Tests for gap recovery (withGapRecovery).
 */

import { describe, it, expect, vi } from 'vitest'
import { Store } from '@tanstack/store'
import { withGapRecovery } from '@tanstack/realtime'
import type { RealtimeTransport, ConnectionStatus } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Mock transport
// ---------------------------------------------------------------------------

function createMockTransport(): RealtimeTransport & {
  setStatus: (s: ConnectionStatus) => void
  subscriptions: Map<string, Set<(data: unknown) => void>>
} {
  const store = new Store<ConnectionStatus>('connected')
  const subscriptions = new Map<string, Set<(data: unknown) => void>>()

  return {
    store,
    subscriptions,
    setStatus(s: ConnectionStatus) {
      store.setState(() => s)
    },
    async connect() {},
    disconnect() {},
    subscribe(channel, onMessage) {
      if (!subscriptions.has(channel)) subscriptions.set(channel, new Set())
      subscriptions.get(channel)!.add(onMessage)
      return () => {
        subscriptions.get(channel)?.delete(onMessage)
        if (subscriptions.get(channel)?.size === 0) {
          subscriptions.delete(channel)
        }
      }
    },
    async publish() {},
    joinPresence() {},
    updatePresence() {},
    leavePresence() {},
    onPresenceChange(_ch, _cb) {
      return () => {}
    },
  }
}

describe('withGapRecovery', () => {
  it('tracks active channels', () => {
    const inner = createMockTransport()
    const onGap = vi.fn()
    const transport = withGapRecovery(inner, { onGap })

    const unsub1 = transport.subscribe('ch-1', () => {})
    transport.subscribe('ch-2', () => {})

    expect(transport.activeChannels).toEqual(new Set(['ch-1', 'ch-2']))

    unsub1()
    expect(transport.activeChannels).toEqual(new Set(['ch-2']))
  })

  it('fires onGap for all active channels on reconnect', () => {
    const inner = createMockTransport()
    const onGap = vi.fn()
    const transport = withGapRecovery(inner, { onGap })

    transport.subscribe('ch-a', () => {})
    transport.subscribe('ch-b', () => {})

    // Simulate disconnection and reconnection.
    inner.setStatus('reconnecting')
    inner.setStatus('connected')

    expect(onGap).toHaveBeenCalledTimes(2)
    expect(onGap).toHaveBeenCalledWith('ch-a')
    expect(onGap).toHaveBeenCalledWith('ch-b')
  })

  it('does not fire onGap on initial connection', () => {
    const inner = createMockTransport()
    inner.setStatus('disconnected')
    const onGap = vi.fn()
    withGapRecovery(inner, { onGap })

    // First connection — no gap.
    inner.setStatus('connected')
    expect(onGap).not.toHaveBeenCalled()
  })

  it('fires onGap after disconnected → connected', () => {
    const inner = createMockTransport()
    const onGap = vi.fn()
    const transport = withGapRecovery(inner, { onGap })

    transport.subscribe('ch', () => {})

    // Initial state is connected. Go through disconnect cycle.
    inner.setStatus('disconnected')
    inner.setStatus('connected')

    expect(onGap).toHaveBeenCalledTimes(1)
    expect(onGap).toHaveBeenCalledWith('ch')
  })

  it('does not fire onGap for unsubscribed channels', () => {
    const inner = createMockTransport()
    const onGap = vi.fn()
    const transport = withGapRecovery(inner, { onGap })

    const unsub = transport.subscribe('ch', () => {})
    unsub() // unsubscribe before reconnect

    inner.setStatus('reconnecting')
    inner.setStatus('connected')

    expect(onGap).not.toHaveBeenCalled()
  })

  it('swallows errors from onGap', () => {
    const inner = createMockTransport()
    const onGap = vi.fn(() => {
      throw new Error('gap handler error')
    })
    const transport = withGapRecovery(inner, { onGap })

    transport.subscribe('ch', () => {})

    // Should not throw.
    inner.setStatus('reconnecting')
    inner.setStatus('connected')

    expect(onGap).toHaveBeenCalledTimes(1)
  })

  it('swallows errors from async onGap', () => {
    const inner = createMockTransport()
    const onGap = vi.fn(async () => {
      throw new Error('async gap handler error')
    })
    const transport = withGapRecovery(inner, { onGap })

    transport.subscribe('ch', () => {})

    // Should not throw.
    inner.setStatus('reconnecting')
    inner.setStatus('connected')

    expect(onGap).toHaveBeenCalledTimes(1)
  })

  it('delegates subscribe messages to inner transport', () => {
    const inner = createMockTransport()
    const onGap = vi.fn()
    const transport = withGapRecovery(inner, { onGap })

    const cb = vi.fn()
    transport.subscribe('ch', cb)

    expect(inner.subscriptions.has('ch')).toBe(true)
  })

  it('delegates publish to inner transport', async () => {
    const inner = createMockTransport()
    const publishSpy = vi.spyOn(inner, 'publish')
    const transport = withGapRecovery(inner, { onGap: vi.fn() })

    await transport.publish('ch', { data: 1 })
    expect(publishSpy).toHaveBeenCalledWith('ch', { data: 1 })
  })

  it('fires onGap on multiple reconnect cycles', () => {
    const inner = createMockTransport()
    const onGap = vi.fn()
    const transport = withGapRecovery(inner, { onGap })

    transport.subscribe('ch', () => {})

    // First reconnect.
    inner.setStatus('reconnecting')
    inner.setStatus('connected')
    expect(onGap).toHaveBeenCalledTimes(1)

    // Second reconnect.
    inner.setStatus('disconnected')
    inner.setStatus('connected')
    expect(onGap).toHaveBeenCalledTimes(2)
  })

  it('shares the inner transport store reference', () => {
    const inner = createMockTransport()
    const transport = withGapRecovery(inner, { onGap: vi.fn() })
    expect(transport.store).toBe(inner.store)
  })

  it('delegates connect to inner transport', async () => {
    const inner = createMockTransport()
    const connectSpy = vi.spyOn(inner, 'connect')
    const transport = withGapRecovery(inner, { onGap: vi.fn() })

    await transport.connect()
    expect(connectSpy).toHaveBeenCalled()
  })

  it('delegates disconnect to inner transport', () => {
    const inner = createMockTransport()
    const disconnectSpy = vi.spyOn(inner, 'disconnect')
    const transport = withGapRecovery(inner, { onGap: vi.fn() })

    transport.disconnect()
    expect(disconnectSpy).toHaveBeenCalled()
  })

  it('delivers messages from inner transport through to subscriber', () => {
    const inner = createMockTransport()
    const transport = withGapRecovery(inner, { onGap: vi.fn() })

    const received: unknown[] = []
    transport.subscribe('ch', (msg) => received.push(msg))

    // Emit directly through the inner transport's subscription set.
    for (const cb of inner.subscriptions.get('ch') ?? []) cb({ data: 42 })

    expect(received).toEqual([{ data: 42 }])
  })

  it('delegates joinPresence to inner transport', () => {
    const inner = createMockTransport()
    const joinSpy = vi.spyOn(inner, 'joinPresence')
    const transport = withGapRecovery(inner, { onGap: vi.fn() })

    transport.joinPresence('ch', { userId: 'u1' })
    expect(joinSpy).toHaveBeenCalledWith('ch', { userId: 'u1' })
  })

  it('delegates updatePresence to inner transport', () => {
    const inner = createMockTransport()
    const updateSpy = vi.spyOn(inner, 'updatePresence')
    const transport = withGapRecovery(inner, { onGap: vi.fn() })

    transport.updatePresence('ch', { status: 'busy' })
    expect(updateSpy).toHaveBeenCalledWith('ch', { status: 'busy' })
  })

  it('delegates leavePresence to inner transport', () => {
    const inner = createMockTransport()
    const leaveSpy = vi.spyOn(inner, 'leavePresence')
    const transport = withGapRecovery(inner, { onGap: vi.fn() })

    transport.leavePresence('ch')
    expect(leaveSpy).toHaveBeenCalledWith('ch')
  })

  it('delegates onPresenceChange to inner transport', () => {
    const inner = createMockTransport()
    const onPresenceSpy = vi.spyOn(inner, 'onPresenceChange')
    const transport = withGapRecovery(inner, { onGap: vi.fn() })

    const cb = vi.fn()
    transport.onPresenceChange('ch', cb)
    expect(onPresenceSpy).toHaveBeenCalledWith('ch', cb)
  })
})
