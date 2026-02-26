/**
 * Workerd runtime compatibility tests for @tanstack/realtime wsTransport.
 *
 * These tests run inside the real workerd runtime via
 * @cloudflare/vitest-pool-workers. Their job is to verify that wsTransport
 * works in Cloudflare Workers / TanStack Start workerd deployments without
 * any Node.js-specific APIs leaking through.
 *
 * What is tested:
 *   - The module imports cleanly in workerd (no Node.js API at import time)
 *   - The transport object has the correct shape
 *   - The @tanstack/store-backed status store works in workerd
 *   - subscribe() / onPresenceChange() lifecycle (synchronous parts only)
 *
 * What is NOT tested here:
 *   - Actual WebSocket connections (miniflare blocks outbound by default)
 *   - Full message/presence flows — covered by integration.workerd.test.ts,
 *     which runs wsTransport against a real Node.js server
 *
 * NOTE: do NOT override globalThis.WebSocket in beforeEach/afterEach.
 * @cloudflare/vitest-pool-workers uses that global for its own host<->worker
 * communication; overriding it corrupts that channel (causes "Stack underflow").
 */

import { describe, expect, it } from 'vitest'
import { wsTransport } from '@tanstack/realtime'

describe('wsTransport — workerd runtime compatibility', () => {
  // ── Module import ─────────────────────────────────────────────────────────
  // wsTransport uses globalThis.WebSocket which exists in workerd.

  it('can be imported and instantiated in the workerd runtime', () => {
    const transport = wsTransport({ url: 'ws://localhost:3000' })
    expect(transport).toBeDefined()
  })

  it('exposes the complete RealtimeTransport interface', () => {
    const transport = wsTransport({ url: 'ws://localhost:3000' })
    expect(typeof transport.connect).toBe('function')
    expect(typeof transport.disconnect).toBe('function')
    expect(typeof transport.subscribe).toBe('function')
    expect(typeof transport.publish).toBe('function')
    expect(typeof transport.joinPresence).toBe('function')
    expect(typeof transport.updatePresence).toBe('function')
    expect(typeof transport.leavePresence).toBe('function')
    expect(typeof transport.onPresenceChange).toBe('function')
    expect(transport.store).toBeDefined()
  })

  // ── Status store ──────────────────────────────────────────────────────────

  it('starts in disconnected state', () => {
    const transport = wsTransport({ url: 'ws://localhost:3000' })
    expect(transport.store.state).toBe('disconnected')
  })

  it('transitions to connecting synchronously when connect() is called', () => {
    const transport = wsTransport({ url: 'ws://localhost:3000' })
    void transport.connect()
    expect(transport.store.state).toBe('connecting')
    transport.disconnect()
  })

  it('returns to disconnected after disconnect()', () => {
    const transport = wsTransport({ url: 'ws://localhost:3000' })
    void transport.connect()
    transport.disconnect()
    expect(transport.store.state).toBe('disconnected')
  })

  // ── Subscribe / onPresenceChange — synchronous parts ─────────────────────

  it('subscribe() returns an unsubscribe function before connect()', () => {
    const transport = wsTransport({ url: 'ws://localhost:3000' })
    const unsub = transport.subscribe('test-channel', () => {})
    expect(typeof unsub).toBe('function')
    expect(() => unsub()).not.toThrow()
  })

  it('multiple subscribe() calls to the same channel each return an unsubscribe fn', () => {
    const transport = wsTransport({ url: 'ws://localhost:3000' })
    const unsub1 = transport.subscribe('ch', () => {})
    const unsub2 = transport.subscribe('ch', () => {})
    expect(typeof unsub1).toBe('function')
    expect(typeof unsub2).toBe('function')
    unsub1()
    unsub2()
  })

  it('onPresenceChange() returns an unsubscribe function before connect()', () => {
    const transport = wsTransport({ url: 'ws://localhost:3000' })
    const unsub = transport.onPresenceChange('ch', () => {})
    expect(typeof unsub).toBe('function')
    expect(() => unsub()).not.toThrow()
  })

  it('publish() while not connected does not throw', async () => {
    const transport = wsTransport({ url: 'ws://localhost:3000' })
    await expect(transport.publish('ch', { x: 1 })).resolves.toBeUndefined()
  })
})
