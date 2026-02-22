/**
 * Tests for hasPresence type guard and RealtimeClient presence guard behavior.
 *
 * Covers:
 *  - hasPresence(transport) returns correct boolean based on presence methods
 *  - client.joinPresence / updatePresence / leavePresence / onPresenceChange
 *    throw descriptive errors when transport is RealtimeTransport-only (no presence)
 *  - client presence methods delegate correctly when transport is PresenceCapable
 *  - destroy() + connect() lifecycle is safe (React Strict Mode)
 */

import { describe, it, expect, vi } from 'vitest'
import { Store } from '@tanstack/store'
import { hasPresence, createRealtimeClient } from '@tanstack/realtime'
import type { RealtimeTransport, PresenceCapable, ConnectionStatus } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Mock transports
// ---------------------------------------------------------------------------

function createBaseTransport(): RealtimeTransport & {
  setStatus: (s: ConnectionStatus) => void
} {
  const store = new Store<ConnectionStatus>('disconnected')
  return {
    store,
    setStatus(s: ConnectionStatus) {
      store.setState(() => s)
    },
    async connect() {},
    disconnect() {},
    subscribe(_ch, _cb) {
      return () => {}
    },
    async publish() {},
  }
}

function createPresenceTransport(): (RealtimeTransport & PresenceCapable) & {
  setStatus: (s: ConnectionStatus) => void
  joinPresence: ReturnType<typeof vi.fn>
  updatePresence: ReturnType<typeof vi.fn>
  leavePresence: ReturnType<typeof vi.fn>
  onPresenceChange: ReturnType<typeof vi.fn>
} {
  const base = createBaseTransport()
  return {
    ...base,
    joinPresence: vi.fn(),
    updatePresence: vi.fn(),
    leavePresence: vi.fn(),
    onPresenceChange: vi.fn((_ch, _cb) => () => {}),
  }
}

// ---------------------------------------------------------------------------
// hasPresence type guard
// ---------------------------------------------------------------------------

describe('hasPresence', () => {
  it('returns false for a base-only transport (no joinPresence)', () => {
    const t = createBaseTransport()
    expect(hasPresence(t)).toBe(false)
  })

  it('returns true for a presence-capable transport', () => {
    const t = createPresenceTransport()
    expect(hasPresence(t)).toBe(true)
  })

  it('returns false when joinPresence is not a function', () => {
    const t = createBaseTransport() as unknown as Record<string, unknown>
    t['joinPresence'] = 'not-a-function'
    expect(hasPresence(t as RealtimeTransport)).toBe(false)
  })

  it('returns false when joinPresence is null', () => {
    const t = createBaseTransport() as unknown as Record<string, unknown>
    t['joinPresence'] = null
    expect(hasPresence(t as RealtimeTransport)).toBe(false)
  })

  it('returns false when joinPresence is undefined', () => {
    const t = createBaseTransport() as unknown as Record<string, unknown>
    t['joinPresence'] = undefined
    expect(hasPresence(t as RealtimeTransport)).toBe(false)
  })

  it('returns true with only joinPresence defined (single-method check)', () => {
    // hasPresence checks joinPresence only — documents the intentional minimal check
    const t = { ...createBaseTransport(), joinPresence: vi.fn() }
    expect(hasPresence(t)).toBe(true)
  })

  it('acts as a type narrowing guard — narrowed type has presence methods', () => {
    const t: RealtimeTransport = createPresenceTransport()
    if (hasPresence(t)) {
      // TypeScript narrowed to RealtimeTransport & PresenceCapable inside this block.
      // If this compiles without error the narrowing works.
      expect(typeof t.joinPresence).toBe('function')
      expect(typeof t.updatePresence).toBe('function')
      expect(typeof t.leavePresence).toBe('function')
      expect(typeof t.onPresenceChange).toBe('function')
    } else {
      throw new Error('Expected hasPresence to return true for a presence transport')
    }
  })
})

// ---------------------------------------------------------------------------
// RealtimeClient — presence guards on base transport
// ---------------------------------------------------------------------------

describe('createRealtimeClient — presence guards (base transport)', () => {
  it('throws for joinPresence with a descriptive message', () => {
    const client = createRealtimeClient({ transport: createBaseTransport() })
    expect(() => client.joinPresence('ch', {})).toThrow('PresenceCapable')
  })

  it('throws for updatePresence with a descriptive message', () => {
    const client = createRealtimeClient({ transport: createBaseTransport() })
    expect(() => client.updatePresence('ch', {})).toThrow('PresenceCapable')
  })

  it('throws for leavePresence with a descriptive message', () => {
    const client = createRealtimeClient({ transport: createBaseTransport() })
    expect(() => client.leavePresence('ch')).toThrow('PresenceCapable')
  })

  it('throws for onPresenceChange with a descriptive message', () => {
    const client = createRealtimeClient({ transport: createBaseTransport() })
    expect(() => client.onPresenceChange('ch', vi.fn())).toThrow('PresenceCapable')
  })

  it('error message names the failing method', () => {
    const client = createRealtimeClient({ transport: createBaseTransport() })
    expect(() => client.joinPresence('ch', {})).toThrow('joinPresence()')
  })
})

// ---------------------------------------------------------------------------
// RealtimeClient — presence delegation on presence transport
// ---------------------------------------------------------------------------

describe('createRealtimeClient — presence delegation (presence transport)', () => {
  it('delegates joinPresence to the transport', () => {
    const transport = createPresenceTransport()
    const client = createRealtimeClient({ transport })
    client.joinPresence('ch', { name: 'Alice' })
    expect(transport.joinPresence).toHaveBeenCalledWith('ch', { name: 'Alice' })
  })

  it('delegates updatePresence to the transport', () => {
    const transport = createPresenceTransport()
    const client = createRealtimeClient({ transport })
    client.updatePresence('ch', { status: 'busy' })
    expect(transport.updatePresence).toHaveBeenCalledWith('ch', { status: 'busy' })
  })

  it('delegates leavePresence to the transport', () => {
    const transport = createPresenceTransport()
    const client = createRealtimeClient({ transport })
    client.leavePresence('ch')
    expect(transport.leavePresence).toHaveBeenCalledWith('ch')
  })

  it('delegates onPresenceChange to the transport and forwards the callback', () => {
    const transport = createPresenceTransport()
    const client = createRealtimeClient({ transport })
    const cb = vi.fn()
    client.onPresenceChange('ch', cb)
    expect(transport.onPresenceChange).toHaveBeenCalledWith('ch', cb)
  })

  it('returns unsubscribe function from onPresenceChange', () => {
    const transport = createPresenceTransport()
    const unsub = vi.fn()
    transport.onPresenceChange.mockReturnValue(unsub)
    const client = createRealtimeClient({ transport })
    const returned = client.onPresenceChange('ch', vi.fn())
    expect(returned).toBe(unsub)
  })
})

// ---------------------------------------------------------------------------
// RealtimeClient — destroy() + reconnect lifecycle (React Strict Mode safety)
// ---------------------------------------------------------------------------

describe('createRealtimeClient — lifecycle', () => {
  it('destroy() does not throw', () => {
    const client = createRealtimeClient({ transport: createBaseTransport() })
    expect(() => client.destroy()).not.toThrow()
  })

  it('calling destroy() twice does not throw', () => {
    const client = createRealtimeClient({ transport: createBaseTransport() })
    expect(() => {
      client.destroy()
      client.destroy()
    }).not.toThrow()
  })

  it('status store mirrors transport changes after reconnect', async () => {
    const transport = createBaseTransport()
    const client = createRealtimeClient({ transport })

    // Destroy (as RealtimeProvider.useEffect cleanup does in Strict Mode).
    client.destroy()

    // Reconnect re-establishes the status subscription.
    await client.connect()

    // Now simulate transport becoming connected.
    transport.setStatus('connected')

    // After the subscription is restored, status should mirror the transport.
    expect(client.store.state.status).toBe('connected')
  })

  it('status store updates when transport status changes (normal path)', () => {
    const transport = createBaseTransport()
    const client = createRealtimeClient({ transport })

    transport.setStatus('connected')
    expect(client.store.state.status).toBe('connected')

    transport.setStatus('reconnecting')
    expect(client.store.state.status).toBe('reconnecting')

    transport.setStatus('disconnected')
    expect(client.store.state.status).toBe('disconnected')
  })

  it('presence guards still work after destroy + reconnect', async () => {
    const transport = createBaseTransport()
    const client = createRealtimeClient({ transport })

    client.destroy()
    await client.connect()

    // Presence guard must still throw (transport has no presence).
    expect(() => client.joinPresence('ch', {})).toThrow('PresenceCapable')
  })
})

// ---------------------------------------------------------------------------
// withGapRecovery — throws on presence when inner is base-only
// ---------------------------------------------------------------------------

import { withGapRecovery } from '@tanstack/realtime'

describe('withGapRecovery — presence guards', () => {
  it('throws joinPresence when inner transport is base-only', () => {
    const inner = createBaseTransport()
    const transport = withGapRecovery(inner, { onGap: vi.fn() })
    expect(() => transport.joinPresence('ch', {})).toThrow('withGapRecovery')
  })

  it('throws updatePresence when inner transport is base-only', () => {
    const inner = createBaseTransport()
    const transport = withGapRecovery(inner, { onGap: vi.fn() })
    expect(() => transport.updatePresence('ch', {})).toThrow('withGapRecovery')
  })

  it('throws leavePresence when inner transport is base-only', () => {
    const inner = createBaseTransport()
    const transport = withGapRecovery(inner, { onGap: vi.fn() })
    expect(() => transport.leavePresence('ch')).toThrow('withGapRecovery')
  })

  it('throws onPresenceChange when inner transport is base-only', () => {
    const inner = createBaseTransport()
    const transport = withGapRecovery(inner, { onGap: vi.fn() })
    expect(() => transport.onPresenceChange('ch', vi.fn())).toThrow('withGapRecovery')
  })

  it('delegates presence methods when inner is presence-capable', () => {
    const inner = createPresenceTransport()
    const transport = withGapRecovery(inner, { onGap: vi.fn() })
    transport.joinPresence('ch', { id: 1 })
    expect(inner.joinPresence).toHaveBeenCalledWith('ch', { id: 1 })
  })
})

// ---------------------------------------------------------------------------
// createOfflineQueue — throws on presence when inner is base-only
// ---------------------------------------------------------------------------

import { createOfflineQueue } from '@tanstack/realtime'

describe('createOfflineQueue — presence guards', () => {
  it('throws joinPresence when inner transport is base-only', () => {
    const inner = createBaseTransport()
    const queue = createOfflineQueue(inner)
    expect(() => queue.joinPresence('ch', {})).toThrow('createOfflineQueue')
  })

  it('throws updatePresence when inner transport is base-only', () => {
    const inner = createBaseTransport()
    const queue = createOfflineQueue(inner)
    expect(() => queue.updatePresence('ch', {})).toThrow('createOfflineQueue')
  })

  it('throws leavePresence when inner transport is base-only', () => {
    const inner = createBaseTransport()
    const queue = createOfflineQueue(inner)
    expect(() => queue.leavePresence('ch')).toThrow('createOfflineQueue')
  })

  it('throws onPresenceChange when inner transport is base-only', () => {
    const inner = createBaseTransport()
    const queue = createOfflineQueue(inner)
    expect(() => queue.onPresenceChange('ch', vi.fn())).toThrow('createOfflineQueue')
  })

  it('delegates presence methods when inner is presence-capable', () => {
    const inner = createPresenceTransport()
    const queue = createOfflineQueue(inner)
    queue.joinPresence('ch', { user: 'bob' })
    expect(inner.joinPresence).toHaveBeenCalledWith('ch', { user: 'bob' })
  })
})
