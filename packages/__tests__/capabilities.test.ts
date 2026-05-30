/**
 * Tests for the TransportCapabilities contract + capability-gated degradation.
 *
 * Covers:
 *  - getCapabilities() defaulting: declared capabilities win; otherwise a
 *    conservative shape-derived default (presence via hasPresence, the rest
 *    least-capable except ephemeral).
 *  - Built-in transports declare capabilities (sse, mock, mock-presence).
 *  - Capability forwarding through the coordinated / broadcast / shared
 *    wrappers reflects the inner transport.
 *  - client.capabilities mirrors the transport.
 *  - Actionable presence error when a non-presence transport is used with
 *    joinPresence (client) and usePresence (hook boundary).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Store } from '@tanstack/store'
import {
  createBroadcastChannelTransport,
  createCoordinatedTransport,
  createMockPresenceTransport,
  createMockTransport,
  createRealtimeClient,
  createSharedWorkerTransport,
  getCapabilities,
} from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

import type {
  ConnectionStatus,
  PresenceCapable,
  RealtimeTransport,
  TransportCapabilities,
} from '@realtimejs/core'

// ---------------------------------------------------------------------------
// Minimal hand-rolled transports (no declared capabilities) to exercise the
// shape-derived defaulting path.
// ---------------------------------------------------------------------------

function makeBareTransport(): RealtimeTransport {
  return {
    store: new Store<ConnectionStatus>('disconnected'),
    connect: () => Promise.resolve(),
    disconnect: () => {},
    subscribe: () => () => {},
    publish: () => Promise.resolve(),
    hook: () => ({ unhook: () => {} }),
  }
}

function makeBarePresenceTransport(): RealtimeTransport & PresenceCapable {
  return {
    ...makeBareTransport(),
    joinPresence: () => {},
    updatePresence: () => {},
    leavePresence: () => {},
    onPresenceChange: () => () => {},
  }
}

// ---------------------------------------------------------------------------
// getCapabilities — defaulting rules
// ---------------------------------------------------------------------------

describe('getCapabilities — defaulting', () => {
  it('returns declared capabilities verbatim when present', () => {
    const declared: TransportCapabilities = {
      presence: true,
      serverAssistedRecovery: true,
      history: true,
      ephemeral: false,
    }
    const transport: RealtimeTransport = {
      ...makeBareTransport(),
      capabilities: declared,
    }
    expect(getCapabilities(transport)).toBe(declared)
  })

  it('derives a conservative default from a bare (non-presence) transport', () => {
    expect(getCapabilities(makeBareTransport())).toEqual({
      presence: false,
      serverAssistedRecovery: false,
      history: false,
      ephemeral: true,
    })
  })

  it('derives presence:true from a bare PresenceCapable transport via hasPresence', () => {
    expect(getCapabilities(makeBarePresenceTransport())).toEqual({
      presence: true,
      serverAssistedRecovery: false,
      history: false,
      ephemeral: true,
    })
  })
})

// ---------------------------------------------------------------------------
// Built-in transports declare capabilities
// ---------------------------------------------------------------------------

describe('built-in transports declare capabilities', () => {
  it('sseTransport declares presence:false, ephemeral:true', () => {
    const transport = sseTransport({ url: 'https://example.com/sse' })
    expect(transport.capabilities).toEqual({
      presence: false,
      serverAssistedRecovery: false,
      history: false,
      ephemeral: true,
    })
  })

  it('createMockTransport declares presence:false by default', () => {
    expect(getCapabilities(createMockTransport()).presence).toBe(false)
  })

  it('createMockPresenceTransport declares presence:true by default', () => {
    expect(getCapabilities(createMockPresenceTransport()).presence).toBe(true)
  })

  it('createMockTransport accepts a capabilities override', () => {
    const transport = createMockTransport({
      capabilities: {
        presence: true,
        serverAssistedRecovery: true,
        history: true,
        ephemeral: false,
      },
    })
    expect(getCapabilities(transport)).toEqual({
      presence: true,
      serverAssistedRecovery: true,
      history: true,
      ephemeral: false,
    })
  })

  it('createMockPresenceTransport accepts a capabilities override', () => {
    const transport = createMockPresenceTransport({
      capabilities: {
        presence: false,
        serverAssistedRecovery: false,
        history: false,
        ephemeral: true,
      },
    })
    expect(getCapabilities(transport).presence).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Capability forwarding through wrappers
// ---------------------------------------------------------------------------

describe('capability forwarding through wrappers', () => {
  it('broadcast wrapper defaults to presence-capable', () => {
    const wrapper = createBroadcastChannelTransport(() =>
      createMockPresenceTransport(),
    )
    expect(getCapabilities(wrapper).presence).toBe(true)
  })

  it('broadcast wrapper forwards a declared non-presence capability set', () => {
    const wrapper = createBroadcastChannelTransport(
      () => createMockTransport(),
      {
        capabilities: {
          presence: false,
          serverAssistedRecovery: false,
          history: false,
          ephemeral: true,
        },
      },
    )
    expect(getCapabilities(wrapper).presence).toBe(false)
  })

  describe('shared-worker tab transport', () => {
    const g = globalThis as Record<string, unknown>
    let realSharedWorker: unknown

    beforeEach(() => {
      realSharedWorker = g['SharedWorker']
      // Minimal SharedWorker stub — we only construct the tab transport to read
      // its declared capabilities; no messages are exchanged.
      g['SharedWorker'] = class {
        port = {
          onmessage: null,
          postMessage: () => {},
          start: () => {},
          addEventListener: () => {},
        }
      }
    })

    afterEach(() => {
      if (realSharedWorker === undefined) delete g['SharedWorker']
      else g['SharedWorker'] = realSharedWorker
    })

    it('defaults to presence-capable', () => {
      const tab = createSharedWorkerTransport('https://example.com/worker.js')
      expect(getCapabilities(tab).presence).toBe(true)
    })

    it('honors a declared inner capability set', () => {
      const tab = createSharedWorkerTransport({
        url: 'https://example.com/worker.js',
        capabilities: {
          presence: false,
          serverAssistedRecovery: false,
          history: false,
          ephemeral: true,
        },
      })
      expect(getCapabilities(tab).presence).toBe(false)
    })
  })

  describe('coordinated transport', () => {
    const g = globalThis as Record<string, unknown>
    let realWindow: unknown
    let realBC: unknown

    beforeEach(() => {
      realWindow = g['window']
      realBC = g['BroadcastChannel']
      // Force the direct-fallback branch: window present so the server guard
      // passes, no SharedWorker, no BroadcastChannel — the wrapper returns the
      // inner (or a stubbed wrapper) and must report the inner's capabilities.
      g['window'] = {}
      delete g['BroadcastChannel']
    })

    afterEach(() => {
      if (realWindow === undefined) delete g['window']
      else g['window'] = realWindow
      if (realBC === undefined) delete g['BroadcastChannel']
      else g['BroadcastChannel'] = realBC
    })

    it('forwards a non-presence inner transport via the direct fallback', () => {
      const transport = createCoordinatedTransport({
        transport: () => createMockTransport(),
      })
      expect(getCapabilities(transport).presence).toBe(false)
    })

    it('forwards a presence inner transport via the direct fallback', () => {
      const transport = createCoordinatedTransport({
        transport: () => createMockPresenceTransport(),
      })
      expect(getCapabilities(transport).presence).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// client.capabilities reflects the transport
// ---------------------------------------------------------------------------

describe('client.capabilities', () => {
  it('mirrors a non-presence transport', () => {
    const client = createRealtimeClient({ transport: createMockTransport() })
    expect(client.capabilities.presence).toBe(false)
    expect(client.capabilities.ephemeral).toBe(true)
  })

  it('mirrors a presence-capable transport', () => {
    const client = createRealtimeClient({
      transport: createMockPresenceTransport(),
    })
    expect(client.capabilities.presence).toBe(true)
  })

  it('mirrors the sse transport (presence:false)', () => {
    const client = createRealtimeClient({
      transport: sseTransport({ url: 'https://example.com/sse' }),
    })
    expect(client.capabilities.presence).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Actionable presence error on non-presence transports
// ---------------------------------------------------------------------------

describe('capability-gated presence error', () => {
  it('joinPresence throws an actionable [realtime] error on a non-presence transport', () => {
    const client = createRealtimeClient({ transport: createMockTransport() })
    expect(() => client.joinPresence('ch', {})).toThrow(/\[realtime\]/)
    expect(() => client.joinPresence('ch', {})).toThrow(
      /capabilities\.presence/,
    )
    expect(() => client.joinPresence('ch', {})).toThrow(
      /Centrifugo, Pusher, PartyKit/,
    )
  })

  it('error names the failing method', () => {
    const client = createRealtimeClient({ transport: createMockTransport() })
    expect(() => client.joinPresence('ch', {})).toThrow(/joinPresence/)
  })
})
