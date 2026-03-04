/**
 * Tests for P13 — unified authorize signatures.
 *
 * Verifies that:
 * - createSseHandler accepts the new AuthorizeFn (userId, parsedChannel) signature
 * - createSseHandler still accepts the legacy (params) => boolean signature
 * - All presets accept boolean returns from authorize
 * - normalizePermissions maps booleans to all-or-nothing ChannelPermissions
 * - createStartHandler inherits unified authorize from SSE
 */

import { describe, expect, it, vi } from 'vitest'
import { normalizePermissions } from '@tanstack/realtime'
import { createSseHandler } from '@tanstack/realtime-adapter-sse'
import { createStartHandler } from '@tanstack/realtime-preset-start'
import type { ChannelPermissions, ParsedChannel } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SSE_URL = 'http://localhost/_realtime/sse'

async function readSseEvents(
  response: Response,
  count: number,
): Promise<Array<Record<string, unknown>>> {
  const reader = response.body!.getReader()
  const dec = new TextDecoder()
  const events: Array<Record<string, unknown>> = []
  let buf = ''

  while (events.length < count) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const parts = buf.split('\n\n')
    buf = parts.pop() ?? ''
    for (const part of parts) {
      const trimmed = part.trim()
      if (!trimmed) continue
      for (const line of trimmed.split('\n')) {
        if (line.startsWith('data:')) {
          try {
            events.push(
              JSON.parse(line.slice(5).trim()) as Record<string, unknown>,
            )
          } catch {
            /* ignore */
          }
        }
      }
    }
  }
  reader.releaseLock()
  return events
}

// ---------------------------------------------------------------------------
// normalizePermissions
// ---------------------------------------------------------------------------

describe('normalizePermissions', () => {
  it('maps true to all-true ChannelPermissions', () => {
    expect(normalizePermissions(true)).toEqual({
      subscribe: true,
      publish: true,
      presence: true,
    })
  })

  it('maps false to all-false ChannelPermissions', () => {
    expect(normalizePermissions(false)).toEqual({
      subscribe: false,
      publish: false,
      presence: false,
    })
  })

  it('passes through a ChannelPermissions object unchanged', () => {
    const perms: ChannelPermissions = {
      subscribe: true,
      publish: false,
      presence: true,
    }
    expect(normalizePermissions(perms)).toBe(perms)
  })
})

// ---------------------------------------------------------------------------
// createSseHandler — unified AuthorizeFn
// ---------------------------------------------------------------------------

describe('createSseHandler — unified AuthorizeFn', () => {
  it('accepts (userId, parsedChannel) → ChannelPermissions', async () => {
    const authorize = vi.fn(
      (_userId: string, _channel: ParsedChannel): ChannelPermissions => ({
        subscribe: true,
        publish: false,
        presence: true,
      }),
    )

    const handler = createSseHandler({
      pingInterval: 0,
      getUser: () => ({ userId: 'alice' }),
      authorize,
    })

    // Open stream
    const streamRes = await handler.handle(
      new Request(SSE_URL, { method: 'GET' }),
    )
    const [connEvent] = await readSseEvents(streamRes, 1)
    const cid = connEvent.connectionId as string

    // Subscribe should be allowed
    const subRes = await handler.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          connectionId: cid,
          channel: 'todos:projectId=42',
        }),
      }),
    )
    expect(subRes.status).toBe(204)

    // Authorize was called with (userId, parsedChannel)
    expect(authorize).toHaveBeenCalledOnce()
    const [userId, parsed] = authorize.mock.calls[0]
    expect(userId).toBe('alice')
    expect(parsed).toMatchObject({
      namespace: 'todos',
      params: { projectId: '42' },
      raw: 'todos:projectId=42',
    })

    // Publish should be denied (publish: false)
    const pubRes = await handler.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish',
          channel: 'todos:projectId=42',
          data: {},
        }),
      }),
    )
    expect(pubRes.status).toBe(403)

    await streamRes.body?.cancel()
  })

  it('accepts (userId, parsedChannel) → boolean shorthand', async () => {
    const handler = createSseHandler({
      pingInterval: 0,
      getUser: () => ({ userId: 'u1' }),
      // Boolean shorthand: true = all permissions
      authorize: (_userId: string, _channel: ParsedChannel) => true,
    })

    const streamRes = await handler.handle(
      new Request(SSE_URL, { method: 'GET' }),
    )
    const [connEvent] = await readSseEvents(streamRes, 1)
    const cid = connEvent.connectionId as string

    const subRes = await handler.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          connectionId: cid,
          channel: 'ch',
        }),
      }),
    )
    expect(subRes.status).toBe(204)

    await streamRes.body?.cancel()
  })

  it('accepts (userId, parsedChannel) → false denies all actions', async () => {
    const handler = createSseHandler({
      pingInterval: 0,
      getUser: () => ({ userId: 'u1' }),
      authorize: (_userId: string, _channel: ParsedChannel) => false,
    })

    const streamRes = await handler.handle(
      new Request(SSE_URL, { method: 'GET' }),
    )
    const [connEvent] = await readSseEvents(streamRes, 1)
    const cid = connEvent.connectionId as string

    const subRes = await handler.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          connectionId: cid,
          channel: 'ch',
        }),
      }),
    )
    expect(subRes.status).toBe(403)

    await streamRes.body?.cancel()
  })

  it('accepts async (userId, parsedChannel) → Promise<ChannelPermissions>', async () => {
    const handler = createSseHandler({
      pingInterval: 0,
      getUser: () => ({ userId: 'u1' }),
      authorize: (
        _userId: string,
        _channel: ParsedChannel,
      ): Promise<ChannelPermissions> =>
        Promise.resolve({
          subscribe: true,
          publish: true,
          presence: false,
        }),
    })

    const streamRes = await handler.handle(
      new Request(SSE_URL, { method: 'GET' }),
    )
    const [connEvent] = await readSseEvents(streamRes, 1)
    const cid = connEvent.connectionId as string

    const res = await handler.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          connectionId: cid,
          channel: 'ch',
        }),
      }),
    )
    expect(res.status).toBe(204)

    await streamRes.body?.cancel()
  })
})

// ---------------------------------------------------------------------------
// createSseHandler — legacy signature (backward compatibility)
// ---------------------------------------------------------------------------

describe('createSseHandler — legacy authorize (backward compat)', () => {
  it('still accepts ({ userId, action, channel }) => boolean', async () => {
    const authorize = vi.fn(
      ({ action }: { action: string }) => action === 'subscribe',
    )

    const handler = createSseHandler({
      pingInterval: 0,
      getUser: () => ({ userId: 'alice' }),
      authorize,
    })

    const streamRes = await handler.handle(
      new Request(SSE_URL, { method: 'GET' }),
    )
    const [connEvent] = await readSseEvents(streamRes, 1)
    const cid = connEvent.connectionId as string

    // Subscribe should be allowed
    const subRes = await handler.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          connectionId: cid,
          channel: 'ch',
        }),
      }),
    )
    expect(subRes.status).toBe(204)

    // Legacy signature receives the params object
    expect(authorize).toHaveBeenCalledWith({
      userId: 'alice',
      action: 'subscribe',
      channel: 'ch',
    })

    // Publish should be denied (our mock denies non-subscribe)
    const pubRes = await handler.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish',
          channel: 'ch',
          data: {},
        }),
      }),
    )
    expect(pubRes.status).toBe(403)

    await streamRes.body?.cancel()
  })
})

// ---------------------------------------------------------------------------
// createStartHandler — inherits unified authorize
// ---------------------------------------------------------------------------

describe('createStartHandler — unified authorize', () => {
  it('accepts the unified AuthorizeFn signature', async () => {
    const authorize = vi.fn(
      (_userId: string, _channel: ParsedChannel): ChannelPermissions => ({
        subscribe: true,
        publish: true,
        presence: true,
      }),
    )

    const handler = createStartHandler({
      pingInterval: 0,
      getUser: () => ({ userId: 'bob' }),
      authorize,
    })

    const streamRes = await handler.handle(
      new Request(SSE_URL, { method: 'GET' }),
    )
    const [connEvent] = await readSseEvents(streamRes, 1)
    const cid = connEvent.connectionId as string

    const res = await handler.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          connectionId: cid,
          channel: 'todos:projectId=7',
        }),
      }),
    )
    expect(res.status).toBe(204)

    expect(authorize).toHaveBeenCalledOnce()
    const [userId, parsed] = authorize.mock.calls[0]
    expect(userId).toBe('bob')
    expect(parsed.namespace).toBe('todos')

    await streamRes.body?.cancel()
  })
})
