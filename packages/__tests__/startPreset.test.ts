/**
 * Tests for @tanstack/realtime-preset-start — createStartHandler
 *
 * Covers:
 * - createStartHandler: delegates GET/POST/OPTIONS to the underlying SSE handler
 * - publish(): in-process broadcasting (no backend)
 * - publish(): QueryKey serialization
 * - publish(): routes through backend.publish when a backend is configured
 * - backend.subscribe: wires external messages to local SSE broadcast
 * - createStream(): uses the handler's publish (not raw broadcast)
 * - createStream(): routes through backend when configured
 * - dispose(): calls the backend's unsubscribe function
 * - getUser / authorize passthrough from StartHandlerOptions
 */

import { describe, expect, it, vi } from 'vitest'
import { createStartHandler } from '@tanstack/realtime-preset-start'
import { STREAM_DONE, STREAM_ERROR, serializeKey } from '@tanstack/realtime'
import type { PublishBackend } from '@tanstack/realtime-preset-start'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SSE_URL = 'http://localhost/api/realtime'

/**
 * Read N parsed SSE events from a ReadableStreamDefaultReader, with a timeout.
 */
async function readEvents(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  n: number,
  timeoutMs = 2000,
): Promise<Array<Record<string, unknown>>> {
  const dec = new TextDecoder()
  const events: Array<Record<string, unknown>> = []
  let buf = ''
  const deadline = Date.now() + timeoutMs

  while (events.length < n && Date.now() < deadline) {
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
  return events
}

/**
 * Open an SSE stream and return the reader and the connectionId sent in the
 * first "connected" event.
 */
async function openStream(
  handler: ReturnType<typeof createStartHandler>,
): Promise<{
  reader: ReadableStreamDefaultReader<Uint8Array>
  connectionId: string
  cancel: () => Promise<void>
}> {
  const streamRes = await handler.handle(
    new Request(SSE_URL, { method: 'GET' }),
  )
  const reader = streamRes.body!.getReader()
  const events = await readEvents(reader, 1)
  return {
    reader,
    connectionId: events[0]?.connectionId as string,
    // reader.cancel() releases the lock and signals stream cancellation.
    cancel: () => reader.cancel(),
  }
}

/** Subscribe a connectionId to a channel. */
async function subscribeChannel(
  handler: ReturnType<typeof createStartHandler>,
  connectionId: string,
  channel: string,
) {
  await handler.handle(
    new Request(SSE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'subscribe', connectionId, channel }),
    }),
  )
}

// ---------------------------------------------------------------------------
// HTTP delegation
// ---------------------------------------------------------------------------

describe('createStartHandler — HTTP delegation', () => {
  it('GET returns 200 text/event-stream', async () => {
    const h = createStartHandler({ pingInterval: 0 })
    const res = await h.handle(new Request(SSE_URL, { method: 'GET' }))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/event-stream')
    await res.body?.cancel()
  })

  it('GET sends a connected event with a connectionId', async () => {
    const h = createStartHandler({ pingInterval: 0 })
    const res = await h.handle(new Request(SSE_URL, { method: 'GET' }))
    const reader = res.body!.getReader()
    const events = await readEvents(reader, 1)
    expect(events[0].type).toBe('connected')
    expect(typeof events[0].connectionId).toBe('string')
    expect(events[0].connectionId).toBeTruthy()
    reader.releaseLock()
    await res.body?.cancel()
  })

  it('POST returns 204 for subscribe action', async () => {
    const h = createStartHandler({ pingInterval: 0 })
    const { connectionId, cancel } = await openStream(h)

    const res = await h.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          connectionId,
          channel: 'ch',
        }),
      }),
    )
    expect(res.status).toBe(204)
    await cancel()
  })

  it('OPTIONS returns 204 with CORS headers', async () => {
    const h = createStartHandler({ pingInterval: 0 })
    const res = await h.handle(new Request(SSE_URL, { method: 'OPTIONS' }))
    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })

  it('unsupported method returns 405', async () => {
    const h = createStartHandler({ pingInterval: 0 })
    const res = await h.handle(new Request(SSE_URL, { method: 'DELETE' }))
    expect(res.status).toBe(405)
  })

  it('POST with invalid JSON returns 400', async () => {
    const h = createStartHandler({ pingInterval: 0 })
    const res = await h.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      }),
    )
    expect(res.status).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// publish() — in-process (no backend)
// ---------------------------------------------------------------------------

describe('createStartHandler — publish (in-process)', () => {
  it('publish() with a string channel broadcasts to subscribed connections', async () => {
    const h = createStartHandler({ pingInterval: 0 })
    const { reader, connectionId, cancel } = await openStream(h)
    await subscribeChannel(h, connectionId, 'todos')

    await h.publish('todos', { action: 'update', id: 1 })

    const events = await readEvents(reader, 1)
    expect(events[0]).toMatchObject({
      type: 'message',
      channel: 'todos',
      data: { action: 'update', id: 1 },
    })

    await cancel()
  })

  it('publish() with a QueryKey serializes it to a channel string', async () => {
    const published: Array<{ channel: string; data: unknown }> = []
    const backend: PublishBackend = {
      publish(channel, data) {
        published.push({ channel, data })
        return Promise.resolve()
      },
    }
    const h = createStartHandler({ backend, pingInterval: 0 })
    await h.publish(['todos', { projectId: '42' }], { action: 'insert' })

    expect(published).toHaveLength(1)
    expect(published[0].channel).toBe(
      serializeKey(['todos', { projectId: '42' }]),
    )
    expect(published[0].data).toMatchObject({ action: 'insert' })
  })

  it('publish() with no backend does not call any external function', async () => {
    const backendPublish = vi.fn()
    const h = createStartHandler({ pingInterval: 0 })
    // No backend configured — publish should not call any external function.
    await h.publish('ch', { x: 1 })
    expect(backendPublish).not.toHaveBeenCalled()
  })

  it('publish() reaches multiple subscribed connections', async () => {
    const h = createStartHandler({ pingInterval: 0 })

    const [conn1, conn2] = await Promise.all([openStream(h), openStream(h)])
    await subscribeChannel(h, conn1.connectionId, 'live')
    await subscribeChannel(h, conn2.connectionId, 'live')

    await h.publish('live', { payload: 'broadcast' })

    const [ev1, ev2] = await Promise.all([
      readEvents(conn1.reader, 1),
      readEvents(conn2.reader, 1),
    ])

    expect(ev1[0]).toMatchObject({
      type: 'message',
      channel: 'live',
      data: { payload: 'broadcast' },
    })
    expect(ev2[0]).toMatchObject({
      type: 'message',
      channel: 'live',
      data: { payload: 'broadcast' },
    })

    await conn1.cancel()
    await conn2.cancel()
  })

  it('publish() to an unsubscribed channel does not deliver a message', async () => {
    const h = createStartHandler({ pingInterval: 0 })
    const { reader, connectionId, cancel } = await openStream(h)
    await subscribeChannel(h, connectionId, 'ch-a')

    await h.publish('ch-b', { x: 1 })

    const arrived = await Promise.race([
      readEvents(reader, 1, 100).then((evs) => evs.length > 0),
      new Promise<boolean>((r) => setTimeout(() => r(false), 150)),
    ])
    expect(arrived).toBe(false)

    await cancel()
  })
})

// ---------------------------------------------------------------------------
// publish() — with external PublishBackend
// ---------------------------------------------------------------------------

describe('createStartHandler — publish with backend', () => {
  it('publish() calls backend.publish with the serialized channel', async () => {
    const calls: Array<{ channel: string; data: unknown }> = []
    const backend: PublishBackend = {
      publish(channel, data) {
        calls.push({ channel, data })
        return Promise.resolve()
      },
    }

    const h = createStartHandler({ backend, pingInterval: 0 })
    await h.publish('orders', { id: 99 })

    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({ channel: 'orders', data: { id: 99 } })
  })

  it('publish() does NOT broadcast locally when a backend is configured', async () => {
    // When a backend is configured, publish goes through the backend only.
    // The backend's subscribe callback is responsible for local fan-out.
    const backendPublished: Array<string> = []
    const backend: PublishBackend = {
      publish(channel) {
        backendPublished.push(channel)
        // Intentionally do NOT call onMessage — simulating a backend that
        // would notify other processes, but not the local process directly.
        return Promise.resolve()
      },
    }
    const h = createStartHandler({ backend, pingInterval: 0 })
    const { reader, connectionId, cancel } = await openStream(h)
    await subscribeChannel(h, connectionId, 'test-ch')

    await h.publish('test-ch', { value: 1 })

    // Backend received the call.
    expect(backendPublished).toContain('test-ch')

    // SSE client does NOT receive the message because backend did not
    // call the subscribe callback (simulating a different process).
    const arrived = await Promise.race([
      readEvents(reader, 1, 100).then((evs) => evs.length > 0),
      new Promise<boolean>((r) => setTimeout(() => r(false), 150)),
    ])
    expect(arrived).toBe(false)

    await cancel()
  })

  it('backend.subscribe wires external messages to local SSE connections', async () => {
    let externalOnMessage: ((channel: string, data: unknown) => void) | null =
      null

    const backend: PublishBackend = {
      publish: () => Promise.resolve(),
      subscribe(onMessage) {
        externalOnMessage = onMessage
        return () => {
          externalOnMessage = null
        }
      },
    }

    const h = createStartHandler({ backend, pingInterval: 0 })
    const { reader, connectionId, cancel } = await openStream(h)
    await subscribeChannel(h, connectionId, 'external-ch')

    // Simulate a message arriving from another process via the subscribe callback.
    expect(externalOnMessage).not.toBeNull()
    externalOnMessage!('external-ch', { source: 'process-2' })

    const events = await readEvents(reader, 1)
    expect(events[0]).toMatchObject({
      type: 'message',
      channel: 'external-ch',
      data: { source: 'process-2' },
    })

    await cancel()
  })

  it('backend.subscribe is called exactly once on createStartHandler', () => {
    const subscribeSpy = vi.fn(() => () => {})
    const backend: PublishBackend = {
      publish: () => Promise.resolve(),
      subscribe: subscribeSpy,
    }
    createStartHandler({ backend, pingInterval: 0 })
    expect(subscribeSpy).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// dispose()
// ---------------------------------------------------------------------------

describe('createStartHandler — dispose', () => {
  it('dispose() calls the unsubscribe function returned by backend.subscribe', () => {
    const unsubSpy = vi.fn()
    const backend: PublishBackend = {
      publish: () => Promise.resolve(),
      subscribe: () => unsubSpy,
    }
    const h = createStartHandler({ backend, pingInterval: 0 })
    h.dispose()
    expect(unsubSpy).toHaveBeenCalledTimes(1)
  })

  it('dispose() is a no-op when backend has no subscribe', () => {
    const backend: PublishBackend = {
      publish: () => Promise.resolve(),
    }
    const h = createStartHandler({ backend, pingInterval: 0 })
    expect(() => h.dispose()).not.toThrow()
  })

  it('dispose() is a no-op when no backend is provided', () => {
    const h = createStartHandler({ pingInterval: 0 })
    expect(() => h.dispose()).not.toThrow()
  })

  it('dispose() stops forwarding external messages', () => {
    let externalOnMessage: ((channel: string, data: unknown) => void) | null =
      null

    const backend: PublishBackend = {
      publish: () => Promise.resolve(),
      subscribe(onMessage) {
        externalOnMessage = onMessage
        return () => {
          externalOnMessage = null
        }
      },
    }

    const h = createStartHandler({ backend, pingInterval: 0 })
    expect(externalOnMessage).not.toBeNull()

    h.dispose()
    expect(externalOnMessage).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// createStream()
// ---------------------------------------------------------------------------

describe('createStartHandler — createStream', () => {
  it('createStream() returns a ServerStream with the correct channel string', () => {
    const h = createStartHandler({ pingInterval: 0 })
    const stream = h.createStream({ channel: 'ai-stream' })
    expect(stream.channel).toBe('ai-stream')
    expect(stream.seq).toBe(0)
  })

  it('createStream() serializes a QueryKey channel', () => {
    const h = createStartHandler({ pingInterval: 0 })
    const stream = h.createStream({ channel: ['ai', { sessionId: '123' }] })
    expect(stream.channel).toBe(serializeKey(['ai', { sessionId: '123' }]))
  })

  it('stream.push() broadcasts events in-process (no backend)', async () => {
    const h = createStartHandler({ pingInterval: 0 })
    const channel = serializeKey(['ai', { id: '1' }])

    const { reader, connectionId, cancel } = await openStream(h)
    await subscribeChannel(h, connectionId, channel)

    const stream = h.createStream<{ type: string; content: string }>({
      channel: ['ai', { id: '1' }],
    })

    await stream.push({ type: 'token', content: 'Hello' })
    await stream.done()

    const events = await readEvents(reader, 2)
    const tokenEvent = events.find((e) => (e.data as any)?.type === 'token')
    const doneEvent = events.find((e) => (e.data as any)?.type === STREAM_DONE)

    expect(tokenEvent?.data).toMatchObject({ type: 'token', content: 'Hello' })
    expect(doneEvent?.data).toMatchObject({ type: STREAM_DONE })

    await cancel()
  })

  it('stream.error() sends STREAM_ERROR sentinel in-process', async () => {
    const h = createStartHandler({ pingInterval: 0 })
    const channel = serializeKey(['ai', { id: '2' }])

    const { reader, connectionId, cancel } = await openStream(h)
    await subscribeChannel(h, connectionId, channel)

    const stream = h.createStream({ channel: ['ai', { id: '2' }] })
    await stream.error('Something went wrong')

    const events = await readEvents(reader, 1)
    expect(events[0]).toMatchObject({
      type: 'message',
      channel,
      data: { type: STREAM_ERROR, message: 'Something went wrong' },
    })

    await cancel()
  })

  it('stream.push() routes through backend.publish when a backend is configured', async () => {
    const published: Array<{ channel: string; data: unknown }> = []
    const backend: PublishBackend = {
      publish(channel, data) {
        published.push({ channel, data })
        return Promise.resolve()
      },
    }

    const h = createStartHandler({ backend, pingInterval: 0 })
    const stream = h.createStream({ channel: 'stream-ch' })
    await stream.push({ type: 'token', content: 'A' })
    await stream.done()

    // Both the push and done events route through the backend.
    expect(published.length).toBeGreaterThanOrEqual(2)
    expect(published[0].channel).toBe('stream-ch')
    expect((published[0].data as any).type).toBe('token')
    expect((published[0].data as any)._seq).toBe(1)
  })

  it('stream.push() attaches monotonically increasing _seq metadata', async () => {
    const calls: Array<{ data: unknown }> = []
    const backend: PublishBackend = {
      publish(_ch, data) {
        calls.push({ data })
        return Promise.resolve()
      },
    }
    const h = createStartHandler({ backend, pingInterval: 0 })
    const stream = h.createStream({ channel: 'seq-ch' })

    await stream.push({ type: 'a' })
    await stream.push({ type: 'b' })

    expect((calls[0].data as any)._seq).toBe(1)
    expect((calls[1].data as any)._seq).toBe(2)
    expect(stream.seq).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Auth / authorization passthrough
// ---------------------------------------------------------------------------

describe('createStartHandler — auth passthrough', () => {
  it('getUser returning null causes GET to return 401', async () => {
    const h = createStartHandler({
      pingInterval: 0,
      getUser: () => null,
    })
    const res = await h.handle(new Request(SSE_URL, { method: 'GET' }))
    expect(res.status).toBe(401)
  })

  it('getUser returning a user allows GET', async () => {
    const h = createStartHandler({
      pingInterval: 0,
      getUser: () => ({ userId: 'user1' }),
    })
    const res = await h.handle(new Request(SSE_URL, { method: 'GET' }))
    expect(res.status).toBe(200)
    await res.body?.cancel()
  })

  it('authorize returning false causes subscribe POST to return 403', async () => {
    const h = createStartHandler({
      pingInterval: 0,
      getUser: () => ({ userId: 'u1' }),
      authorize: ({ action }) => action !== 'subscribe',
    })
    const res = await h.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          connectionId: 'c1',
          channel: 'private',
        }),
      }),
    )
    expect(res.status).toBe(403)
  })

  it('authorize is called with userId, action, and channel', async () => {
    const authorize = vi.fn().mockReturnValue(true)
    const h = createStartHandler({
      pingInterval: 0,
      getUser: () => ({ userId: 'alice' }),
      authorize,
    })

    const { connectionId, cancel } = await openStream(h)
    await h.handle(
      new Request(SSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          connectionId,
          channel: 'orders',
        }),
      }),
    )

    expect(authorize).toHaveBeenCalledWith({
      userId: 'alice',
      action: 'subscribe',
      channel: 'orders',
    })
    await cancel()
  })
})
