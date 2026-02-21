/**
 * Tests for gap recovery (withGapRecovery).
 */

import { describe, it, expect, vi } from 'vitest'
import { Store } from '@tanstack/store'
import { withGapRecovery } from '@tanstack/realtime'
import type {
  RealtimeTransport,
  ConnectionStatus,
  PresenceUser,
} from '@tanstack/realtime'

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
    onPresenceChange(
      _ch: string,
      _cb: (users: ReadonlyArray<PresenceUser>) => void,
    ) {
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
})
