/**
 * Tests for P16 — server lifecycle hooks.
 *
 * Covers:
 * - onClientConnect / onClientDisconnect for SSE and Node servers
 * - onFirstSubscriber / onChannelEmpty for SSE and Node servers
 * - Callbacks are fire-and-forget (errors are logged, not propagated)
 * - Multiple subscribers → onChannelEmpty only fires when last one leaves
 */

import { createServer } from 'node:http'
import { describe, expect, it, vi } from 'vitest'
import { createRealtimeClient, wsTransport } from '@tanstack/realtime'
import { createSseHandler } from '@tanstack/realtime-adapter-sse'
import { createNodeServer } from '@tanstack/realtime-preset-node'
import type { Server } from 'node:http'
import type { NodeServer } from '@tanstack/realtime-preset-node'

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

// ---------------------------------------------------------------------------
// Node server lifecycle hooks
// ---------------------------------------------------------------------------

describe('createNodeServer — lifecycle hooks', () => {
  async function createTestHarness(hooks: {
    onClientConnect?: (info: { connectionId: string; userId: string }) => void
    onClientDisconnect?: (info: {
      connectionId: string
      userId: string
    }) => void
    onFirstSubscriber?: (channel: string) => void
    onChannelEmpty?: (channel: string) => void
  }): Promise<{
    port: number
    nodeServer: NodeServer
    httpServer: Server
    teardown: () => Promise<void>
  }> {
    const httpServer = createServer()
    const nodeServer = createNodeServer({
      getUser: () => Promise.resolve({ userId: 'test-user' }),
      authorize: () =>
        Promise.resolve({ subscribe: true, publish: true, presence: true }),
      ...hooks,
    })
    nodeServer.attach(httpServer)

    await new Promise<void>((resolve) => httpServer.listen(0, resolve))
    const port = (httpServer.address() as { port: number }).port

    return {
      port,
      nodeServer,
      httpServer,
      teardown: async () => {
        await nodeServer.close()
        await new Promise<void>((resolve, reject) =>
          httpServer.close((err) => (err ? reject(err) : resolve())),
        )
      },
    }
  }

  it('fires onClientConnect when a WebSocket client connects', async () => {
    const onClientConnect = vi.fn()
    const { port, teardown } = await createTestHarness({ onClientConnect })

    const client = createRealtimeClient({
      transport: wsTransport({
        url: `ws://localhost:${port}`,
      }),
    })
    await client.connect()

    // Wait for connection setup
    await new Promise((r) => setTimeout(r, 50))

    expect(onClientConnect).toHaveBeenCalledOnce()
    expect(onClientConnect.mock.calls[0][0]).toMatchObject({
      userId: 'test-user',
    })
    expect(typeof onClientConnect.mock.calls[0][0].connectionId).toBe('string')

    client.disconnect()
    await teardown()
  })

  it('fires onClientDisconnect when a WebSocket client disconnects', async () => {
    const onClientDisconnect = vi.fn()
    const { port, teardown } = await createTestHarness({ onClientDisconnect })

    const client = createRealtimeClient({
      transport: wsTransport({
        url: `ws://localhost:${port}`,
      }),
    })
    await client.connect()
    await new Promise((r) => setTimeout(r, 50))

    client.disconnect()
    await new Promise((r) => setTimeout(r, 100))

    expect(onClientDisconnect).toHaveBeenCalledOnce()
    expect(onClientDisconnect.mock.calls[0][0]).toMatchObject({
      userId: 'test-user',
    })

    await teardown()
  })

  it('fires onFirstSubscriber when a channel gets its first subscriber', async () => {
    const onFirstSubscriber = vi.fn()
    const { port, teardown } = await createTestHarness({ onFirstSubscriber })

    const client = createRealtimeClient({
      transport: wsTransport({
        url: `ws://localhost:${port}`,
      }),
    })
    await client.connect()
    await new Promise((r) => setTimeout(r, 50))

    client.subscribe('live-data', () => {})
    await new Promise((r) => setTimeout(r, 100))

    expect(onFirstSubscriber).toHaveBeenCalledOnce()
    // eslint-disable-next-line vitest/prefer-called-exactly-once-with -- not available in vitest 2.x
    expect(onFirstSubscriber).toHaveBeenCalledWith('live-data')

    client.disconnect()
    await teardown()
  })

  it('does NOT fire onFirstSubscriber for second subscriber to same channel', async () => {
    const onFirstSubscriber = vi.fn()
    const { port, teardown } = await createTestHarness({ onFirstSubscriber })

    const client1 = createRealtimeClient({
      transport: wsTransport({
        url: `ws://localhost:${port}`,
      }),
    })
    const client2 = createRealtimeClient({
      transport: wsTransport({
        url: `ws://localhost:${port}`,
      }),
    })

    await Promise.all([client1.connect(), client2.connect()])
    await new Promise((r) => setTimeout(r, 50))

    client1.subscribe('shared', () => {})
    await new Promise((r) => setTimeout(r, 100))
    expect(onFirstSubscriber).toHaveBeenCalledTimes(1)

    client2.subscribe('shared', () => {})
    await new Promise((r) => setTimeout(r, 100))
    // Still only called once
    expect(onFirstSubscriber).toHaveBeenCalledTimes(1)

    client1.disconnect()
    client2.disconnect()
    await teardown()
  })

  it('fires onChannelEmpty when last subscriber disconnects', async () => {
    const onChannelEmpty = vi.fn()
    const { port, teardown } = await createTestHarness({ onChannelEmpty })

    const client = createRealtimeClient({
      transport: wsTransport({
        url: `ws://localhost:${port}`,
      }),
    })
    await client.connect()
    await new Promise((r) => setTimeout(r, 50))

    client.subscribe('temp', () => {})
    await new Promise((r) => setTimeout(r, 100))

    client.disconnect()
    await new Promise((r) => setTimeout(r, 100))

    expect(onChannelEmpty).toHaveBeenCalledOnce()
    // eslint-disable-next-line vitest/prefer-called-exactly-once-with -- not available in vitest 2.x
    expect(onChannelEmpty).toHaveBeenCalledWith('temp')

    await teardown()
  })

  it('fires onChannelEmpty only when the LAST subscriber leaves', async () => {
    const onChannelEmpty = vi.fn()
    const { port, teardown } = await createTestHarness({ onChannelEmpty })

    const client1 = createRealtimeClient({
      transport: wsTransport({
        url: `ws://localhost:${port}`,
      }),
    })
    const client2 = createRealtimeClient({
      transport: wsTransport({
        url: `ws://localhost:${port}`,
      }),
    })

    await Promise.all([client1.connect(), client2.connect()])
    await new Promise((r) => setTimeout(r, 50))

    client1.subscribe('multi', () => {})
    client2.subscribe('multi', () => {})
    await new Promise((r) => setTimeout(r, 100))

    // Disconnect first client — channel still has one subscriber
    client1.disconnect()
    await new Promise((r) => setTimeout(r, 100))
    expect(onChannelEmpty).not.toHaveBeenCalled()

    // Disconnect second client — channel is now empty
    client2.disconnect()
    await new Promise((r) => setTimeout(r, 100))
    expect(onChannelEmpty).toHaveBeenCalledOnce()
    // eslint-disable-next-line vitest/prefer-called-exactly-once-with -- not available in vitest 2.x
    expect(onChannelEmpty).toHaveBeenCalledWith('multi')

    await teardown()
  })

  it('createNodeServer accepts boolean authorize return', async () => {
    const onFirstSubscriber = vi.fn()
    const httpServer = createServer()
    const nodeServer = createNodeServer({
      getUser: () => Promise.resolve({ userId: 'u1' }),
      // Boolean return — should work with unified AuthorizeFn
      authorize: () => Promise.resolve(true),
      onFirstSubscriber,
    })
    nodeServer.attach(httpServer)

    await new Promise<void>((resolve) => httpServer.listen(0, resolve))
    const port = (httpServer.address() as { port: number }).port

    const client = createRealtimeClient({
      transport: wsTransport({
        url: `ws://localhost:${port}`,
      }),
    })
    await client.connect()
    await new Promise((r) => setTimeout(r, 50))

    client.subscribe('ch', () => {})
    await new Promise((r) => setTimeout(r, 100))

    // Subscribe should have succeeded (boolean true → all perms)
    expect(onFirstSubscriber).toHaveBeenCalledWith('ch')

    client.disconnect()
    await nodeServer.close()
    await new Promise<void>((resolve, reject) =>
      httpServer.close((err) => (err ? reject(err) : resolve())),
    )
  })

  it('createNodeServer denies subscribe when boolean authorize returns false', async () => {
    const onFirstSubscriber = vi.fn()
    const httpServer = createServer()
    const nodeServer = createNodeServer({
      getUser: () => Promise.resolve({ userId: 'u1' }),
      authorize: () => Promise.resolve(false),
      onFirstSubscriber,
    })
    nodeServer.attach(httpServer)

    await new Promise<void>((resolve) => httpServer.listen(0, resolve))
    const port = (httpServer.address() as { port: number }).port

    const client = createRealtimeClient({
      transport: wsTransport({
        url: `ws://localhost:${port}`,
      }),
    })
    await client.connect()
    await new Promise((r) => setTimeout(r, 50))

    // Subscribe error callback
    const errors: Array<{ channel: string; reason: string }> = []
    client.onSubscribeError((channel, reason) => {
      errors.push({ channel, reason })
    })

    client.subscribe('denied', () => {})
    await new Promise((r) => setTimeout(r, 200))

    // onFirstSubscriber should NOT have been called (denied)
    expect(onFirstSubscriber).not.toHaveBeenCalled()

    // Client should have received a subscribe error
    expect(errors).toHaveLength(1)
    expect(errors[0].channel).toBe('denied')

    client.disconnect()
    await nodeServer.close()
    await new Promise<void>((resolve, reject) =>
      httpServer.close((err) => (err ? reject(err) : resolve())),
    )
  })
})
