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

import { describe, expect, it, vi } from 'vitest'
import {
  createMockPresenceTransport,
  createMockTransport,
  createRealtimeClient,
  hasPresence,
} from '@realtimejs/core'

import type { RealtimeTransport } from '@realtimejs/core'

// ---------------------------------------------------------------------------
// hasPresence type guard
// ---------------------------------------------------------------------------

describe('hasPresence', () => {
  it('returns false for a base-only transport (no joinPresence)', () => {
    const t = createMockTransport()
    expect(hasPresence(t)).toBe(false)
  })

  it('returns true for a presence-capable transport', () => {
    const t = createMockPresenceTransport()
    expect(hasPresence(t)).toBe(true)
  })

  it('returns false when joinPresence is not a function', () => {
    const t = createMockTransport() as unknown as Record<string, unknown>
    t['joinPresence'] = 'not-a-function'
    expect(hasPresence(t as unknown as RealtimeTransport)).toBe(false)
  })

  it('returns false when joinPresence is null', () => {
    const t = createMockTransport() as unknown as Record<string, unknown>
    t['joinPresence'] = null
    expect(hasPresence(t as unknown as RealtimeTransport)).toBe(false)
  })

  it('returns false when joinPresence is undefined', () => {
    const t = createMockTransport() as unknown as Record<string, unknown>
    t['joinPresence'] = undefined
    expect(hasPresence(t as unknown as RealtimeTransport)).toBe(false)
  })

  it('returns true with only joinPresence defined (single-method check)', () => {
    const t = { ...createMockTransport(), joinPresence: vi.fn() }
    expect(hasPresence(t)).toBe(true)
  })

  it('acts as a type narrowing guard — narrowed type has presence methods', () => {
    const t: RealtimeTransport = createMockPresenceTransport()
    if (hasPresence(t)) {
      // eslint-disable-next-line vitest/no-conditional-expect
      expect(typeof t.joinPresence).toBe('function')
      // eslint-disable-next-line vitest/no-conditional-expect
      expect(typeof t.updatePresence).toBe('function')
      // eslint-disable-next-line vitest/no-conditional-expect
      expect(typeof t.leavePresence).toBe('function')
      // eslint-disable-next-line vitest/no-conditional-expect
      expect(typeof t.onPresenceChange).toBe('function')
    } else {
      throw new Error(
        'Expected hasPresence to return true for a presence transport',
      )
    }
  })
})

// ---------------------------------------------------------------------------
// RealtimeClient — presence guards on base transport
// ---------------------------------------------------------------------------

describe('createRealtimeClient — presence guards (base transport)', () => {
  it('throws for joinPresence with a descriptive message', () => {
    const client = createRealtimeClient({ transport: createMockTransport() })
    expect(() => client.joinPresence('ch', {})).toThrow('PresenceCapable')
  })

  it('throws for updatePresence with a descriptive message', () => {
    const client = createRealtimeClient({ transport: createMockTransport() })
    expect(() => client.updatePresence('ch', {})).toThrow('PresenceCapable')
  })

  it('throws for leavePresence with a descriptive message', () => {
    const client = createRealtimeClient({ transport: createMockTransport() })
    expect(() => client.leavePresence('ch')).toThrow('PresenceCapable')
  })

  it('throws for onPresenceChange with a descriptive message', () => {
    const client = createRealtimeClient({ transport: createMockTransport() })
    expect(() => client.onPresenceChange('ch', vi.fn())).toThrow(
      'PresenceCapable',
    )
  })

  it('error message names the failing method', () => {
    const client = createRealtimeClient({ transport: createMockTransport() })
    expect(() => client.joinPresence('ch', {})).toThrow('joinPresence()')
  })
})

// ---------------------------------------------------------------------------
// RealtimeClient — presence delegation on presence transport
// ---------------------------------------------------------------------------

describe('createRealtimeClient — presence delegation (presence transport)', () => {
  it('delegates joinPresence to the transport', () => {
    const transport = createMockPresenceTransport()
    const client = createRealtimeClient({ transport })
    client.joinPresence('ch', { name: 'Alice' })
    expect(transport.getPresenceState('ch').length).toBeGreaterThan(0)
  })

  it('delegates leavePresence to the transport', () => {
    const transport = createMockPresenceTransport()
    const client = createRealtimeClient({ transport })
    client.joinPresence('ch', { name: 'Alice' })
    client.leavePresence('ch')
    expect(transport.getPresenceState('ch').length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// RealtimeClient — destroy() + reconnect lifecycle (React Strict Mode safety)
// ---------------------------------------------------------------------------

describe('createRealtimeClient — lifecycle', () => {
  it('destroy() does not throw', () => {
    const client = createRealtimeClient({ transport: createMockTransport() })
    expect(() => client.destroy()).not.toThrow()
  })

  it('calling destroy() twice does not throw', () => {
    const client = createRealtimeClient({ transport: createMockTransport() })
    expect(() => {
      client.destroy()
      client.destroy()
    }).not.toThrow()
  })

  it('status store mirrors transport changes after reconnect', async () => {
    const transport = createMockTransport({ initialStatus: 'disconnected' })
    const client = createRealtimeClient({ transport })

    client.destroy()

    await client.connect()

    expect(client.store.get().status).toBe('connected')
  })

  it('status store updates when transport status changes (normal path)', () => {
    const transport = createMockTransport({ initialStatus: 'disconnected' })
    const client = createRealtimeClient({ transport })

    transport.simulateReconnect()
    expect(client.store.get().status).toBe('connected')

    transport.simulateDisconnect()
    expect(client.store.get().status).toBe('reconnecting')
  })

  it('presence guards still work after destroy + reconnect', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    client.destroy()
    await client.connect()

    expect(() => client.joinPresence('ch', {})).toThrow('PresenceCapable')
  })
})
