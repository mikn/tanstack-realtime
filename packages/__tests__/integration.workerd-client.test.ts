/**
 * Workerd runtime compatibility tests for @tanstack/realtime-preset-workerd.
 *
 * These tests run inside the real workerd runtime via
 * @cloudflare/vitest-pool-workers. Their purpose is to verify that the
 * client-side transport code — which must work in Cloudflare Workers /
 * TanStack Start deployments as well as the browser — uses no Node.js-
 * specific APIs and behaves correctly in the workerd environment.
 *
 * Only pure-JS state machine behaviour is exercised here (status store,
 * subscribe/unsubscribe lifecycle, pending-message queue). Tests that
 * require a live WebSocket server are covered by the Node.js integration
 * suite (integration.workerd.test.ts), which runs the same transport
 * against a real Node.js WebSocket server.
 *
 * Note: we deliberately do NOT patch globalThis.WebSocket.
 * @cloudflare/vitest-pool-workers uses that global for its own internal
 * communication between the worker runtime and the miniflare host process;
 * overriding it in beforeEach/afterEach corrupts that channel.
 * The transport calls new WebSocket() only inside connectChannel(), which
 * is fired asynchronously via `void connectChannel(...)` — errors there
 * become unhandled rejections that the transport catches via the `close`
 * event, so the synchronous state machine under test is unaffected.
 */

import { describe, it, expect } from 'vitest'
import { workerdTransport } from '@tanstack/realtime-preset-workerd'

describe('workerdTransport — workerd runtime compatibility', () => {
  // ── Module-level import ────────────────────────────────────────────────────
  // If the module uses any Node.js-specific API (require('ws'), Buffer,
  // http, etc.) the workerd runtime will throw at import time, failing
  // these tests immediately.

  it('can be imported and instantiated in the workerd runtime', () => {
    const transport = workerdTransport({ url: 'ws://localhost:3000' })
    expect(transport).toBeDefined()
  })

  it('exposes the complete RealtimeTransport interface', () => {
    const transport = workerdTransport({ url: 'ws://localhost:3000' })
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

  // ── Status store — pure JS, no WebSocket I/O ───────────────────────────────

  it('starts in disconnected state', () => {
    const transport = workerdTransport({ url: 'ws://localhost:3000' })
    expect(transport.store.state).toBe('disconnected')
  })

  it('transitions to connecting on connect()', async () => {
    const transport = workerdTransport({ url: 'ws://localhost:3000' })
    await transport.connect()
    // Status is 'connecting' — channels open lazily, so no WebSocket is
    // created until subscribe() or onPresenceChange() is called.
    expect(transport.store.state).toBe('connecting')
    transport.disconnect()
  })

  it('returns to disconnected after disconnect()', async () => {
    const transport = workerdTransport({ url: 'ws://localhost:3000' })
    await transport.connect()
    transport.disconnect()
    expect(transport.store.state).toBe('disconnected')
  })

  it('calling connect() twice does not change status unexpectedly', async () => {
    const transport = workerdTransport({ url: 'ws://localhost:3000' })
    await transport.connect()
    await transport.connect() // idempotent — already connecting
    expect(transport.store.state).toBe('connecting')
    transport.disconnect()
  })

  // ── Subscribe lifecycle — synchronous parts only ───────────────────────────
  // subscribe() returns an unsubscribe function synchronously, before the
  // WebSocket handshake completes. The async WebSocket creation that follows
  // will fail (blocked by miniflare), but that error is handled internally
  // by the transport's reconnect logic and does not propagate here.

  it('subscribe() synchronously returns an unsubscribe function', () => {
    const transport = workerdTransport({ url: 'ws://localhost:3000' })
    const unsub = transport.subscribe('test-channel', () => {})
    expect(typeof unsub).toBe('function')
    // Unsubscribing while the WebSocket is still opening should not throw.
    expect(() => unsub()).not.toThrow()
  })

  it('multiple subscribers to the same channel all receive an unsubscribe fn', () => {
    const transport = workerdTransport({ url: 'ws://localhost:3000' })
    const unsub1 = transport.subscribe('ch', () => {})
    const unsub2 = transport.subscribe('ch', () => {})
    expect(typeof unsub1).toBe('function')
    expect(typeof unsub2).toBe('function')
    unsub1()
    unsub2()
  })

  it('onPresenceChange() synchronously returns an unsubscribe function', () => {
    const transport = workerdTransport({ url: 'ws://localhost:3000' })
    const unsub = transport.onPresenceChange('ch', () => {})
    expect(typeof unsub).toBe('function')
    expect(() => unsub()).not.toThrow()
  })
})
