/**
 * Tests for gap recovery (useGapRecovery).
 */

import { describe, expect, it, vi } from 'vitest'
import { createMockTransport, useGapRecovery } from '@realtimejs/core'

describe('useGapRecovery', () => {
  it('tracks active channels via hook', () => {
    const transport = createMockTransport()
    const onGap = vi.fn()
    const recovery = useGapRecovery(transport, { onGap })

    const unsub1 = transport.subscribe('ch-1', () => {})
    transport.subscribe('ch-2', () => {})

    expect(recovery.activeChannels).toEqual(new Set(['ch-1', 'ch-2']))

    unsub1()
    expect(recovery.activeChannels).toEqual(new Set(['ch-2']))
  })

  it('fires onGap for all active channels on reconnect', () => {
    const transport = createMockTransport()
    const onGap = vi.fn()
    useGapRecovery(transport, { onGap })

    transport.subscribe('ch-a', () => {})
    transport.subscribe('ch-b', () => {})

    // Simulate disconnection and reconnection.
    transport.simulateDisconnect()
    transport.simulateReconnect()

    expect(onGap).toHaveBeenCalledTimes(2)
    expect(onGap).toHaveBeenCalledWith('ch-a')
    expect(onGap).toHaveBeenCalledWith('ch-b')
  })

  it('does not fire onGap on initial connection', () => {
    const transport = createMockTransport({ initialStatus: 'disconnected' })
    const onGap = vi.fn()
    useGapRecovery(transport, { onGap })

    // First connection — no gap.
    transport.simulateReconnect()
    expect(onGap).not.toHaveBeenCalled()
  })

  it('fires onGap after disconnected → connected', () => {
    const transport = createMockTransport()
    const onGap = vi.fn()
    useGapRecovery(transport, { onGap })

    transport.subscribe('ch', () => {})

    // Initial state is connected. Go through disconnect cycle.
    transport.disconnect()
    transport.simulateReconnect()

    expect(onGap).toHaveBeenCalledTimes(1)
    expect(onGap).toHaveBeenCalledWith('ch')
  })

  it('does not fire onGap for unsubscribed channels', () => {
    const transport = createMockTransport()
    const onGap = vi.fn()
    useGapRecovery(transport, { onGap })

    const unsub = transport.subscribe('ch', () => {})
    unsub() // unsubscribe before reconnect

    transport.simulateDisconnect()
    transport.simulateReconnect()

    expect(onGap).not.toHaveBeenCalled()
  })

  it('swallows errors from onGap', () => {
    const transport = createMockTransport()
    const onGap = vi.fn(() => {
      throw new Error('gap handler error')
    })
    useGapRecovery(transport, { onGap })

    transport.subscribe('ch', () => {})

    // Should not throw.
    transport.simulateDisconnect()
    transport.simulateReconnect()

    expect(onGap).toHaveBeenCalledTimes(1)
  })

  it('swallows errors from async onGap', () => {
    const transport = createMockTransport()
    const onGap = vi.fn(() => {
      return Promise.reject(new Error('async gap handler error'))
    })
    useGapRecovery(transport, { onGap })

    transport.subscribe('ch', () => {})

    // Should not throw.
    transport.simulateDisconnect()
    transport.simulateReconnect()

    expect(onGap).toHaveBeenCalledTimes(1)
  })

  it('delivers messages through to subscriber', () => {
    const transport = createMockTransport()
    useGapRecovery(transport, { onGap: vi.fn() })

    const received: Array<unknown> = []
    transport.subscribe('ch', (msg) => received.push(msg))

    transport.simulateMessage('ch', { data: 42 })

    expect(received).toEqual([{ data: 42 }])
  })

  it('fires onGap on multiple reconnect cycles', () => {
    const transport = createMockTransport()
    const onGap = vi.fn()
    useGapRecovery(transport, { onGap })

    transport.subscribe('ch', () => {})

    // First reconnect.
    transport.simulateDisconnect()
    transport.simulateReconnect()
    expect(onGap).toHaveBeenCalledTimes(1)

    // Second reconnect.
    transport.disconnect()
    transport.simulateReconnect()
    expect(onGap).toHaveBeenCalledTimes(2)
  })

  // ── onGapError ────────────────────────────────────────────────────────────

  it('calls onGapError when onGap throws synchronously', async () => {
    const transport = createMockTransport()
    const err = new Error('sync failure')
    const onGap = vi.fn(() => {
      throw err
    })
    const onGapError = vi.fn()

    useGapRecovery(transport, { onGap, onGapError })
    transport.subscribe('ch', () => {})

    transport.simulateDisconnect()
    transport.simulateReconnect()

    // Error handler is called asynchronously (via promise chain).
    await new Promise((r) => setTimeout(r, 0))

    expect(onGapError).toHaveBeenCalledWith(err, 'ch')
  })

  it('calls onGapError when onGap returns a rejected promise', async () => {
    const transport = createMockTransport()
    const err = new Error('async failure')
    const onGap = vi.fn(() => Promise.reject(err))
    const onGapError = vi.fn()

    useGapRecovery(transport, { onGap, onGapError })
    transport.subscribe('ch', () => {})

    transport.disconnect()
    transport.simulateReconnect()

    await new Promise((r) => setTimeout(r, 0))

    expect(onGapError).toHaveBeenCalledWith(err, 'ch')
  })

  it('silently swallows onGap errors when onGapError is not provided', async () => {
    const transport = createMockTransport()
    const onGap = vi.fn(() => Promise.reject(new Error('silent')))

    useGapRecovery(transport, { onGap })
    transport.subscribe('ch', () => {})

    transport.simulateDisconnect()
    transport.simulateReconnect()

    // Should not throw.
    await new Promise((r) => setTimeout(r, 0))
    expect(onGap).toHaveBeenCalledWith('ch')
  })

  it('calls onGapError for each failing channel independently', async () => {
    const transport = createMockTransport()
    const errA = new Error('ch-a failed')
    const errB = new Error('ch-b failed')
    const onGap = vi.fn((ch: string) => {
      if (ch === 'ch-a') throw errA
      if (ch === 'ch-b') throw errB
    })
    const onGapError = vi.fn()

    useGapRecovery(transport, { onGap, onGapError })
    transport.subscribe('ch-a', () => {})
    transport.subscribe('ch-b', () => {})

    transport.simulateDisconnect()
    transport.simulateReconnect()

    await new Promise((r) => setTimeout(r, 0))

    expect(onGapError).toHaveBeenCalledTimes(2)
    expect(onGapError).toHaveBeenCalledWith(errA, 'ch-a')
    expect(onGapError).toHaveBeenCalledWith(errB, 'ch-b')
  })

  it('unhook removes gap recovery', () => {
    const transport = createMockTransport()
    const onGap = vi.fn()
    const recovery = useGapRecovery(transport, { onGap })

    transport.subscribe('ch', () => {})

    // Remove gap recovery.
    recovery.unhook()

    transport.simulateDisconnect()
    transport.simulateReconnect()

    expect(onGap).not.toHaveBeenCalled()
  })
})
