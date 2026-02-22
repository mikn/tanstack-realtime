/**
 * Unit tests for streamChannelOptions and createStreamChannel.
 *
 * Uses a synchronous mock client to drive events without needing a real server.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Store } from '@tanstack/store'
import {
  streamChannelOptions,
  createStreamChannel,
  createRealtimeClient,
} from '@tanstack/realtime'
import type { RealtimeTransport } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Mock transport — synchronous event dispatch, no network
// ---------------------------------------------------------------------------

function createMockTransport(): RealtimeTransport & {
  emit: (channel: string, data: unknown) => void
} {
  const listeners = new Map<string, Set<(data: unknown) => void>>()
  const store = new Store<'disconnected' | 'connected' | 'connecting' | 'reconnecting'>('connected')

  const transport: RealtimeTransport & { emit: (ch: string, d: unknown) => void } = {
    store,
    async connect() {},
    disconnect() {},
    subscribe(channel, onMessage) {
      if (!listeners.has(channel)) listeners.set(channel, new Set())
      listeners.get(channel)!.add(onMessage)
      return () => {
        listeners.get(channel)?.delete(onMessage)
      }
    },
    async publish() {},
    joinPresence() {},
    updatePresence() {},
    leavePresence() {},
    onPresenceChange(_ch, _cb) {
      return () => {}
    },
    emit(channel, data) {
      const cbs = listeners.get(channel)
      if (cbs) for (const cb of cbs) cb(data)
    },
  }
  return transport
}

// ---------------------------------------------------------------------------
// createStreamChannel
// ---------------------------------------------------------------------------

describe('createStreamChannel', () => {
  it('resolves channel from QueryKey params', () => {
    const def = createStreamChannel({
      id: 'ai',
      channel: (p: { id: string }) => ['ai', p],
      initial: '',
      reduce: (s: string, e: string) => s + e,
    })
    expect(def.id).toBe('ai')
    const ch = def.resolveChannel({ id: 'msg-1' })
    expect(typeof ch).toBe('string')
    expect(ch).toContain('msg-1')
  })

  it('resolves channel from string-returning function', () => {
    const def = createStreamChannel({
      id: 'plain',
      channel: (p: { room: string }) => `room:${p.room}`,
      initial: 0,
      reduce: (s: number) => s + 1,
    })
    expect(def.resolveChannel({ room: 'lobby' })).toBe('room:lobby')
  })

  it('passes through reduce, isDone, isError', () => {
    const reduce = vi.fn((s: number, e: number) => s + e)
    const isDone = vi.fn(() => false)
    const isError = vi.fn(() => false as const)
    const def = createStreamChannel({ id: 'x', channel: () => 'ch', initial: 0, reduce, isDone, isError })
    expect(def.reduce).toBe(reduce)
    expect(def.isDone).toBe(isDone)
    expect(def.isError).toBe(isError)
  })
})

// ---------------------------------------------------------------------------
// streamChannelOptions — sync API (begin/write/commit/markReady)
// ---------------------------------------------------------------------------

describe('streamChannelOptions', () => {
  let mockTransport: ReturnType<typeof createMockTransport>
  let client: ReturnType<typeof createRealtimeClient>

  beforeEach(() => {
    mockTransport = createMockTransport()
    client = createRealtimeClient({ transport: mockTransport })
  })

  it('produces a CollectionConfig with the correct id', () => {
    const opts = streamChannelOptions({
      client,
      channel: 'my-stream',
      initial: '',
      reduce: (s: string, e: string) => s + e,
    })
    expect(opts.id).toBe('stream:my-stream')
  })

  it('respects an explicit id override', () => {
    const opts = streamChannelOptions({
      client,
      id: 'custom-id',
      channel: 'ch',
      initial: 0,
      reduce: (s: number) => s,
    })
    expect(opts.id).toBe('custom-id')
  })

  it('getKey returns item.id', () => {
    const opts = streamChannelOptions({
      client,
      channel: 'ch',
      initial: '',
      reduce: (s: string, e: string) => s + e,
    })
    expect(opts.getKey!({ id: 'ch', state: '', status: 'pending' })).toBe('ch')
  })

  it('writes initial pending item synchronously via sync()', () => {
    const opts = streamChannelOptions({
      client,
      channel: 'test-ch',
      initial: { content: '' },
      reduce: (s, e: { content: string }) => ({ content: s.content + e.content }),
    })

    const written: Array<unknown> = []
    let markedReady = false

    opts.sync!.sync({
      begin: () => {},
      write: (op) => written.push(op),
      commit: () => {},
      markReady: () => { markedReady = true },
      onError: () => {},
      collection: null as never,
    })

    expect(markedReady).toBe(true)
    expect(written).toHaveLength(1)
    const insert = written[0] as { type: string; value: { id: string; state: { content: string }; status: string } }
    expect(insert.type).toBe('insert')
    expect(insert.value.id).toBe('test-ch')
    expect(insert.value.state).toEqual({ content: '' })
    expect(insert.value.status).toBe('pending')
  })

  it('accumulates events via reduce and writes updates', () => {
    const opts = streamChannelOptions({
      client,
      channel: 'token-stream',
      initial: '',
      reduce: (s: string, e: string) => s + e,
    })

    const updates: Array<unknown> = []
    opts.sync!.sync({
      begin: () => {},
      write: (op) => { if ((op as { type: string }).type === 'update') updates.push(op) },
      commit: () => {},
      markReady: () => {},
      onError: () => {},
      collection: null as never,
    })

    mockTransport.emit('token-stream', 'Hello')
    mockTransport.emit('token-stream', ', World')

    expect(updates).toHaveLength(2)
    const first = (updates[0] as { value: { state: string; status: string } }).value
    expect(first.state).toBe('Hello')
    expect(first.status).toBe('streaming')

    const second = (updates[1] as { value: { state: string; status: string } }).value
    expect(second.state).toBe('Hello, World')
    expect(second.status).toBe('streaming')
  })

  it('transitions to done when isDone returns true', () => {
    type Ev = { type: string; token?: string }
    const opts = streamChannelOptions({
      client,
      channel: 'ai',
      initial: '',
      reduce: (s: string, e: Ev) => (e.token ? s + e.token : s),
      isDone: (_s, e: Ev) => e.type === 'done',
    })

    const statuses: Array<string> = []
    opts.sync!.sync({
      begin: () => {},
      write: (op) => {
        const o = op as { type: string; value: { status: string } }
        if (o.type === 'update') statuses.push(o.value.status)
      },
      commit: () => {},
      markReady: () => {},
      onError: () => {},
      collection: null as never,
    })

    mockTransport.emit('ai', { type: 'token', token: 'Hi' })
    mockTransport.emit('ai', { type: 'done' })
    // Events after done should be ignored
    mockTransport.emit('ai', { type: 'token', token: 'ignored' })

    expect(statuses).toEqual(['streaming', 'done'])
  })

  it('transitions to error when isError returns a string', () => {
    type Ev = { type: string; message?: string }
    const opts = streamChannelOptions({
      client,
      channel: 'err-stream',
      initial: '',
      reduce: (s: string, e: Ev) => s,
      isError: (_s, e: Ev) => (e.type === 'error' ? (e.message ?? 'Unknown') : false),
    })

    const updates: Array<{ status: string; error?: string }> = []
    opts.sync!.sync({
      begin: () => {},
      write: (op) => {
        const o = op as { type: string; value: { status: string; error?: string } }
        if (o.type === 'update') updates.push({ status: o.value.status, error: o.value.error })
      },
      commit: () => {},
      markReady: () => {},
      onError: () => {},
      collection: null as never,
    })

    mockTransport.emit('err-stream', { type: 'error', message: 'Something went wrong' })
    // Further events should be ignored
    mockTransport.emit('err-stream', { type: 'token' })

    expect(updates).toHaveLength(1)
    expect(updates[0]!.status).toBe('error')
    expect(updates[0]!.error).toBe('Something went wrong')
  })

  it('cleanup function stops further event processing', () => {
    const opts = streamChannelOptions({
      client,
      channel: 'cleanup-ch',
      initial: 0,
      reduce: (s: number) => s + 1,
    })

    const updates: Array<unknown> = []
    const cleanup = opts.sync!.sync({
      begin: () => {},
      write: (op) => { if ((op as { type: string }).type === 'update') updates.push(op) },
      commit: () => {},
      markReady: () => {},
      onError: () => {},
      collection: null as never,
    })

    mockTransport.emit('cleanup-ch', null) // one event
    cleanup!()
    mockTransport.emit('cleanup-ch', null) // should be ignored

    expect(updates).toHaveLength(1)
  })

  it('serializes a QueryKey channel', () => {
    const opts = streamChannelOptions({
      client,
      channel: ['llm', { sessionId: 'abc' }],
      initial: '',
      reduce: (s: string, e: string) => s + e,
    })
    expect(opts.id).toContain('llm')
    expect(opts.id).toContain('abc')
  })

  it('treats falsy isError return values as not-error', () => {
    type Ev = { kind: string }
    let callCount = 0
    const opts = streamChannelOptions({
      client,
      channel: 'falsy-err',
      initial: '',
      reduce: (s: string, _e: Ev) => s + 'x',
      // Cycle through all falsy return types to ensure none trigger the error path.
      isError: (_s, _e): string | false | undefined | null => {
        const falsy = [false as const, null, undefined, ''][callCount++ % 4]
        return falsy
      },
    })

    const updates: Array<{ status: string }> = []
    opts.sync!.sync({
      begin: () => {},
      write: (op) => {
        const o = op as { type: string; value: { status: string } }
        if (o.type === 'update') updates.push({ status: o.value.status })
      },
      commit: () => {},
      markReady: () => {},
      onError: () => {},
      collection: null as never,
    })

    // Each event should reduce normally (not trigger error).
    mockTransport.emit('falsy-err', { kind: 'token' })
    mockTransport.emit('falsy-err', { kind: 'token' })
    mockTransport.emit('falsy-err', { kind: 'token' })
    mockTransport.emit('falsy-err', { kind: 'token' })

    expect(updates.every((u) => u.status === 'streaming')).toBe(true)
    expect(updates).toHaveLength(4)
  })

  it('isError is checked before reduce — error does not corrupt state', () => {
    type Ev = { type: string; token?: string }
    const opts = streamChannelOptions({
      client,
      channel: 'pre-reduce-err',
      initial: 'initial',
      reduce: (s: string, e: Ev) => s + (e.token ?? ''),
      isError: (_s, e: Ev) => (e.type === 'error' ? 'boom' : false),
    })

    const written: Array<{ status: string; state: string }> = []
    opts.sync!.sync({
      begin: () => {},
      write: (op) => {
        const o = op as { type: string; value: { status: string; state: string } }
        if (o.type === 'update') written.push({ status: o.value.status, state: o.value.state })
      },
      commit: () => {},
      markReady: () => {},
      onError: () => {},
      collection: null as never,
    })

    mockTransport.emit('pre-reduce-err', { type: 'token', token: 'hello' })
    // Now trigger an error — state must be the post-'hello' state, not mutated further.
    mockTransport.emit('pre-reduce-err', { type: 'error' })

    expect(written).toHaveLength(2)
    expect(written[1]!.status).toBe('error')
    // isError is checked *before* reduce, so the error write reflects
    // the state *before* the error event was reduced into it.
    expect(written[1]!.state).toBe('initialhello')
  })

  it('isError takes priority over isDone when both match the same event', () => {
    // If isError fires, the stream enters error state and reduce/isDone are never called.
    type Ev = { type: string }
    const isDone = vi.fn((_s: string, _e: Ev) => true)
    const opts = streamChannelOptions({
      client,
      channel: 'both-err-done',
      initial: '',
      reduce: (s: string) => s,
      isError: (_s, e: Ev) => (e.type === 'terminal' ? 'error wins' : false),
      isDone,
    })

    const statuses: Array<string> = []
    opts.sync!.sync({
      begin: () => {},
      write: (op) => {
        const o = op as { type: string; value: { status: string } }
        if (o.type === 'update') statuses.push(o.value.status)
      },
      commit: () => {},
      markReady: () => {},
      onError: () => {},
      collection: null as never,
    })

    mockTransport.emit('both-err-done', { type: 'terminal' })

    expect(statuses).toEqual(['error'])
    // isDone was never called because isError short-circuited first.
    expect(isDone).not.toHaveBeenCalled()
  })
})
