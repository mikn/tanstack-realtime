/**
 * Tests for server-initiated streams (Feature 4).
 *
 * Covers:
 * - `createServerStream` push/done/error
 * - Sentinel events (`__stream:done`, `__stream:error`)
 * - Integration with `streamChannelOptions`
 * - Integration with `streamChannelOptions`
 */

import { describe, expect, it } from 'vitest'
import {
  STREAM_DONE,
  STREAM_ERROR,
  createServerStream,
  serverStreamCallbacks,
  streamChannelOptions,
  verifyEventSignature,
} from '@tanstack/realtime'
import type { PublishFn } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Tests: createServerStream (standalone)
// ---------------------------------------------------------------------------

describe('createServerStream', () => {
  it('push() calls publish with the event data', async () => {
    const calls: Array<{
      channel: string | ReadonlyArray<unknown>
      data: unknown
    }> = []
    const publish: PublishFn = async (channel, data) => {
      calls.push({ channel: channel as string, data })
    }

    const stream = createServerStream({
      publish,
      channel: 'ai-stream',
    })

    expect(stream.channel).toBe('ai-stream')

    await stream.push({ type: 'token', content: 'Hello' })
    await stream.push({ type: 'token', content: ' World' })

    expect(calls).toHaveLength(2)
    expect(calls[0].data).toMatchObject({ type: 'token', content: 'Hello' })
    expect(calls[1].data).toMatchObject({ type: 'token', content: ' World' })
    // Every event should carry framework metadata
    expect((calls[0].data as any)._seq).toBe(1)
    expect((calls[1].data as any)._seq).toBe(2)
    expect(typeof (calls[0].data as any)._ts).toBe('number')
  })

  it('done() sends STREAM_DONE sentinel', async () => {
    const calls: Array<{ data: unknown }> = []
    const publish: PublishFn = async (_ch, data) => {
      calls.push({ data })
    }

    const stream = createServerStream({ publish, channel: 'ch' })
    await stream.done()

    expect(calls).toHaveLength(1)
    expect(calls[0].data).toMatchObject({ type: STREAM_DONE })
  })

  it('error() sends STREAM_ERROR sentinel with message', async () => {
    const calls: Array<{ data: unknown }> = []
    const publish: PublishFn = async (_ch, data) => {
      calls.push({ data })
    }

    const stream = createServerStream({ publish, channel: 'ch' })
    await stream.error('Something went wrong')

    expect(calls).toHaveLength(1)
    expect(calls[0].data).toMatchObject({
      type: STREAM_ERROR,
      message: 'Something went wrong',
    })
  })

  it('serializes QueryKey channels', async () => {
    const calls: Array<{ channel: string | ReadonlyArray<unknown> }> = []
    const publish: PublishFn = async (channel, _data) => {
      calls.push({ channel: channel as string })
    }

    const stream = createServerStream({
      publish,
      channel: ['ai', { sessionId: 'abc' }],
    })

    expect(stream.channel).toContain('ai')
    expect(stream.channel).toContain('abc')

    await stream.push({ token: 'hi' })
    expect(calls[0].channel).toBe(stream.channel)
  })
})

// ---------------------------------------------------------------------------
// Tests: Sentinel constants
// ---------------------------------------------------------------------------

describe('STREAM_DONE / STREAM_ERROR constants', () => {
  it('STREAM_DONE is the exact sentinel string', () => {
    expect(STREAM_DONE).toBe('__stream:done')
  })

  it('STREAM_ERROR is the exact sentinel string', () => {
    expect(STREAM_ERROR).toBe('__stream:error')
  })
})

// ---------------------------------------------------------------------------
// Tests: serverStreamCallbacks helper
// ---------------------------------------------------------------------------

describe('serverStreamCallbacks', () => {
  it('isDone returns true for STREAM_DONE events', () => {
    expect(serverStreamCallbacks.isDone(null, { type: STREAM_DONE })).toBe(true)
    expect(serverStreamCallbacks.isDone(null, { type: 'token' })).toBe(false)
    expect(serverStreamCallbacks.isDone(null, {})).toBe(false)
  })

  it('isError returns error message for STREAM_ERROR events', () => {
    expect(
      serverStreamCallbacks.isError(null, {
        type: STREAM_ERROR,
        message: 'Oops',
      }),
    ).toBe('Oops')
    expect(serverStreamCallbacks.isError(null, { type: STREAM_ERROR })).toBe(
      'Stream error',
    ) // fallback message
    expect(serverStreamCallbacks.isError(null, { type: 'token' })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Tests: HMAC signing & verification
// ---------------------------------------------------------------------------

describe('createServerStream — HMAC signing', () => {
  it('adds _signature field when hmacKey is provided', async () => {
    const calls: Array<{ data: unknown }> = []
    const publish: PublishFn = async (_ch, data) => {
      calls.push({ data })
    }

    const stream = createServerStream({
      publish,
      channel: 'signed-ch',
      hmacKey: 'test-secret-key',
    })

    await stream.push({ type: 'token', content: 'Hello' })

    expect(calls).toHaveLength(1)
    const payload = calls[0].data as Record<string, unknown>
    expect(payload._signature).toBeDefined()
    expect(typeof payload._signature).toBe('string')
    expect(payload.type).toBe('token')
    expect(payload.content).toBe('Hello')
  })

  it('strips existing _signature before signing to prevent pollution', async () => {
    const calls: Array<{ data: unknown }> = []
    const publish: PublishFn = async (_ch, data) => {
      calls.push({ data })
    }

    const stream = createServerStream({
      publish,
      channel: 'ch',
      hmacKey: 'secret',
    })

    // Push an event that already has a _signature (attacker-injected)
    await stream.push({ type: 'token', _signature: 'fake-sig' } as any)

    const payload = calls[0].data as Record<string, unknown>
    // The _signature should be the real one, not 'fake-sig'
    expect(payload._signature).not.toBe('fake-sig')
    expect(typeof payload._signature).toBe('string')
  })

  it('sentinel events are also signed when hmacKey is provided', async () => {
    const calls: Array<{ data: unknown }> = []
    const publish: PublishFn = async (_ch, data) => {
      calls.push({ data })
    }

    const stream = createServerStream({
      publish,
      channel: 'ch',
      hmacKey: 'secret',
    })

    await stream.done()
    await stream.error('fail')

    const donePayload = calls[0].data as Record<string, unknown>
    const errorPayload = calls[1].data as Record<string, unknown>
    expect(donePayload._signature).toBeDefined()
    expect(errorPayload._signature).toBeDefined()
  })

  it('does NOT add _signature when hmacKey is omitted', async () => {
    const calls: Array<{ data: unknown }> = []
    const publish: PublishFn = async (_ch, data) => {
      calls.push({ data })
    }

    const stream = createServerStream({ publish, channel: 'ch' })
    await stream.push({ type: 'token' })

    const payload = calls[0].data as Record<string, unknown>
    expect(payload._signature).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Tests: verifyEventSignature
// ---------------------------------------------------------------------------

describe('verifyEventSignature', () => {
  it('returns true for a valid signature', async () => {
    const calls: Array<{ data: unknown }> = []
    const hmacKey = 'my-verification-key'
    const publish: PublishFn = async (_ch, data) => {
      calls.push({ data })
    }

    const stream = createServerStream({
      publish,
      channel: 'ch',
      hmacKey,
    })

    await stream.push({ type: 'token', value: 42 })

    const payload = calls[0].data as Record<string, unknown>
    const { _signature, ...eventWithoutSig } = payload

    const isValid = await verifyEventSignature(
      eventWithoutSig,
      _signature as string,
      hmacKey,
    )
    expect(isValid).toBe(true)
  })

  it('returns false for a tampered event', async () => {
    const calls: Array<{ data: unknown }> = []
    const hmacKey = 'my-verification-key'
    const publish: PublishFn = async (_ch, data) => {
      calls.push({ data })
    }

    const stream = createServerStream({
      publish,
      channel: 'ch',
      hmacKey,
    })

    await stream.push({ type: 'token', value: 42 })

    const payload = calls[0].data as Record<string, unknown>
    const { _signature } = payload

    // Tamper with the event
    const tampered = { type: 'token', value: 999 }
    const isValid = await verifyEventSignature(
      tampered,
      _signature as string,
      hmacKey,
    )
    expect(isValid).toBe(false)
  })

  it('returns false for missing signature', async () => {
    const isValid = await verifyEventSignature(
      { type: 'token' },
      undefined,
      'key',
    )
    expect(isValid).toBe(false)
  })

  it('returns false for wrong key', async () => {
    const calls: Array<{ data: unknown }> = []
    const publish: PublishFn = async (_ch, data) => {
      calls.push({ data })
    }

    const stream = createServerStream({
      publish,
      channel: 'ch',
      hmacKey: 'correct-key',
    })

    await stream.push({ type: 'token' })

    const payload = calls[0].data as Record<string, unknown>
    const { _signature, ...eventWithoutSig } = payload

    const isValid = await verifyEventSignature(
      eventWithoutSig,
      _signature as string,
      'wrong-key',
    )
    expect(isValid).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Tests: Integration with streamChannelOptions
// ---------------------------------------------------------------------------

describe('createServerStream + streamChannelOptions integration', () => {
  it('server stream tokens are accumulated by streamChannelOptions', async () => {
    // Simulate: server pushes tokens, client accumulates via streamChannelOptions

    // 1. Set up a mock publish that delivers to client subscribers
    const subscribers = new Map<string, Set<(data: unknown) => void>>()

    const publish: PublishFn = async (channel, data) => {
      const ch = typeof channel === 'string' ? channel : String(channel)
      const subs = subscribers.get(ch)
      if (subs) {
        for (const cb of subs) cb(data)
      }
    }

    // 2. Create a mock client that routes to our subscribers map
    const { Store } = await import('@tanstack/store')
    const _store = new Store<
      'connected' | 'disconnected' | 'connecting' | 'reconnecting'
    >('connected')

    const mockClient = {
      clientId: 'test',
      store: new Store({ status: 'connected' as const }),
      connect: async () => {},
      disconnect: () => {},
      destroy: () => {},
      subscribe: (channel: string, onMessage: (data: unknown) => void) => {
        if (!subscribers.has(channel)) subscribers.set(channel, new Set())
        subscribers.get(channel)!.add(onMessage)
        return () => subscribers.get(channel)?.delete(onMessage)
      },
      publish: async () => {},
      joinPresence: () => {},
      updatePresence: () => {},
      leavePresence: () => {},
      onPresenceChange: () => () => {},
    }

    // 3. Create stream config
    type TokenEvent = { type: string; content?: string; message?: string }
    const config = streamChannelOptions<string, TokenEvent>({
      client: mockClient as any,
      channel: 'ai:session=123',
      initial: '',
      reduce: (state, event) =>
        event.type === 'token' ? state + (event.content ?? '') : state,
      ...serverStreamCallbacks,
    })

    // 4. Drive sync
    const updates: Array<{ status: string; state: string }> = []
    config.sync.sync({
      begin: () => {},
      write: (op: any) => {
        const o = op as {
          type: string
          value: { status: string; state: string }
        }
        if (o.type === 'update') {
          updates.push({ status: o.value.status, state: o.value.state })
        }
      },
      commit: () => {},
      markReady: () => {},
      collection: null as any,
      truncate: () => {},
    } as any)

    // 5. Server creates stream and pushes tokens
    const stream = createServerStream<TokenEvent>({
      publish,
      channel: 'ai:session=123',
    })

    await stream.push({ type: 'token', content: 'Hello' })
    await stream.push({ type: 'token', content: ', World' })
    await stream.done()

    // 6. Verify the client accumulated the tokens
    expect(updates).toHaveLength(3)
    expect(updates[0]).toEqual({ status: 'streaming', state: 'Hello' })
    expect(updates[1]).toEqual({ status: 'streaming', state: 'Hello, World' })
    expect(updates[2]).toEqual({ status: 'done', state: 'Hello, World' })
  })
})
