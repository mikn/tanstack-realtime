/**
 * Tests for P16 — server lifecycle hooks.
 *
 * Covers:
 * - onClientConnect / onClientDisconnect for SSE and Node servers
 * - onFirstSubscriber / onChannelEmpty for SSE and Node servers
 * - Callbacks are fire-and-forget (errors are logged, not propagated)
 * - Multiple subscribers → onChannelEmpty only fires when last one leaves
 */

import { describe, expect, it, vi } from 'vitest'
import { createSseHandler } from '@realtimejs/adapter-sse'

// ---------------------------------------------------------------------------
// SSE Helpers
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
// SSE handler lifecycle hooks
// ---------------------------------------------------------------------------

describe('createSseHandler — lifecycle hooks', () => {
  it('fires onClientConnect when SSE stream opens', async () => {
    const onClientConnect = vi.fn()
    const handler = createSseHandler({
      pingInterval: 0,
      getUser: () => ({ userId: 'alice' }),
      onClientConnect,
    })

    const res = await handler.handle(new Request(SSE_URL, { method: 'GET' }))
    const events = await readSseEvents(res, 1)
    const connectionId = events[0].connectionId as string

    expect(onClientConnect).toHaveBeenCalledOnce()
    // eslint-disable-next-line vitest/prefer-called-exactly-once-with -- not available in vitest 2.x
    expect(onClientConnect).toHaveBeenCalledWith({
      connectionId,
      userId: 'alice',
    })

    await res.body?.cancel()
  })

  it('fires onClientDisconnect when SSE stream is cancelled', async () => {
    const onClientDisconnect = vi.fn()
    const handler = createSseHandler({
      pingInterval: 0,
      getUser: () => ({ userId: 'bob' }),
      onClientDisconnect,
    })

    const res = await handler.handle(new Request(SSE_URL, { method: 'GET' }))
    const events = await readSseEvents(res, 1)
    const connectionId = events[0].connectionId as string

    expect(onClientDisconnect).not.toHaveBeenCalled()

    await res.body?.cancel()
    // Cleanup is async — give it a tick
    await new Promise((r) => setTimeout(r, 10))

    expect(onClientDisconnect).toHaveBeenCalledOnce()
    // eslint-disable-next-line vitest/prefer-called-exactly-once-with -- not available in vitest 2.x
    expect(onClientDisconnect).toHaveBeenCalledWith({
      connectionId,
      userId: 'bob',
    })
  })

  it('fires onFirstSubscriber when a channel gets its first subscriber', async () => {
    const onFirstSubscriber = vi.fn()
    const handler = createSseHandler({
      pingInterval: 0,
      onFirstSubscriber,
    })

    const res = await handler.handle(new Request(SSE_URL, { method: 'GET' }))
    const [connEvent] = await readSseEvents(res, 1)
    const cid = connEvent.connectionId as string

    await handler.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          connectionId: cid,
          channel: 'orders',
        }),
      }),
    )

    expect(onFirstSubscriber).toHaveBeenCalledOnce()
    // eslint-disable-next-line vitest/prefer-called-exactly-once-with -- not available in vitest 2.x
    expect(onFirstSubscriber).toHaveBeenCalledWith('orders')

    await res.body?.cancel()
  })

  it('does NOT fire onFirstSubscriber for subsequent subscribers to the same channel', async () => {
    const onFirstSubscriber = vi.fn()
    const handler = createSseHandler({
      pingInterval: 0,
      onFirstSubscriber,
    })

    // Open two streams
    const res1 = await handler.handle(new Request(SSE_URL, { method: 'GET' }))
    const res2 = await handler.handle(new Request(SSE_URL, { method: 'GET' }))
    const [evt1] = await readSseEvents(res1, 1)
    const [evt2] = await readSseEvents(res2, 1)

    // First subscriber
    await handler.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          connectionId: evt1.connectionId,
          channel: 'ch',
        }),
      }),
    )
    expect(onFirstSubscriber).toHaveBeenCalledTimes(1)

    // Second subscriber — should NOT fire again
    await handler.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          connectionId: evt2.connectionId,
          channel: 'ch',
        }),
      }),
    )
    expect(onFirstSubscriber).toHaveBeenCalledTimes(1)

    await res1.body?.cancel()
    await res2.body?.cancel()
  })

  it('fires onChannelEmpty when the last subscriber unsubscribes', async () => {
    const onChannelEmpty = vi.fn()
    const handler = createSseHandler({
      pingInterval: 0,
      onChannelEmpty,
    })

    // Open two streams
    const res1 = await handler.handle(new Request(SSE_URL, { method: 'GET' }))
    const res2 = await handler.handle(new Request(SSE_URL, { method: 'GET' }))
    const [evt1] = await readSseEvents(res1, 1)
    const [evt2] = await readSseEvents(res2, 1)

    // Subscribe both
    for (const cid of [evt1.connectionId, evt2.connectionId]) {
      await handler.handle(
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
    }

    // First unsubscribe — channel still has one subscriber
    await handler.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unsubscribe',
          connectionId: evt1.connectionId,
          channel: 'ch',
        }),
      }),
    )
    expect(onChannelEmpty).not.toHaveBeenCalled()

    // Second unsubscribe — channel is now empty
    await handler.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unsubscribe',
          connectionId: evt2.connectionId,
          channel: 'ch',
        }),
      }),
    )
    expect(onChannelEmpty).toHaveBeenCalledOnce()
    // eslint-disable-next-line vitest/prefer-called-exactly-once-with -- not available in vitest 2.x
    expect(onChannelEmpty).toHaveBeenCalledWith('ch')

    await res1.body?.cancel()
    await res2.body?.cancel()
  })

  it('fires onChannelEmpty when connection with last subscriber disconnects', async () => {
    const onChannelEmpty = vi.fn()
    const handler = createSseHandler({
      pingInterval: 0,
      onChannelEmpty,
    })

    const res = await handler.handle(new Request(SSE_URL, { method: 'GET' }))
    const [connEvent] = await readSseEvents(res, 1)

    await handler.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          connectionId: connEvent.connectionId,
          channel: 'ephemeral',
        }),
      }),
    )

    // Cancel the stream (disconnect)
    await res.body?.cancel()
    await new Promise((r) => setTimeout(r, 10))

    expect(onChannelEmpty).toHaveBeenCalledOnce()
    // eslint-disable-next-line vitest/prefer-called-exactly-once-with -- not available in vitest 2.x
    expect(onChannelEmpty).toHaveBeenCalledWith('ephemeral')
  })

  it('callback errors are logged but do not propagate', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = createSseHandler({
      pingInterval: 0,
      getUser: () => ({ userId: 'u1' }),
      onClientConnect: () => {
        throw new Error('hook boom')
      },
    })

    const res = await handler.handle(new Request(SSE_URL, { method: 'GET' }))
    // Stream should still work despite hook error
    expect(res.status).toBe(200)
    const events = await readSseEvents(res, 1)
    expect(events[0].type).toBe('connected')

    expect(consoleError).toHaveBeenCalledWith(
      '[realtime:sse] onClientConnect error',
      expect.any(Error),
    )

    await res.body?.cancel()
    consoleError.mockRestore()
  })
})
