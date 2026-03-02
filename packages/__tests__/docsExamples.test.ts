/**
 * High-fidelity tests for every documented pattern on the TanStack Realtime
 * marketing site (packages/docs/src/App.tsx).
 *
 * Each describe block maps to a section of the documentation and verifies the
 * exact code shown there actually behaves as described.  Tests are intentionally
 * self-contained so they read like a companion to the docs.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Store } from '@tanstack/store'
import {
  createOfflineQueue,
  createRealtimeClient,
  createStreamChannel,
  liveChannelOptions,
  realtimeCollectionOptions,
  streamChannelOptions,
  withGapRecovery,
  withRest,
} from '@tanstack/realtime'
import type { ConnectionStatus, RealtimeTransport } from '@tanstack/realtime'
import type { CollectionConfig } from '@tanstack/db'

// ---------------------------------------------------------------------------
// Shared mock helpers (mirrors the patterns in spectrum.test.ts)
// ---------------------------------------------------------------------------

function createMockTransport(): RealtimeTransport & {
  emit: (channel: string, data: unknown) => void
  publishCalls: Array<{ channel: string; data: unknown }>
  setStatus: (s: ConnectionStatus) => void
} {
  const listeners = new Map<string, Set<(data: unknown) => void>>()
  const store = new Store<ConnectionStatus>('connected')
  const publishCalls: Array<{ channel: string; data: unknown }> = []

  return {
    store,
    publishCalls,
    setStatus(s: ConnectionStatus) {
      store.setState(() => s)
    },
    async connect() {},
    disconnect() {},
    subscribe(channel, onMessage) {
      if (!listeners.has(channel)) listeners.set(channel, new Set())
      listeners.get(channel)!.add(onMessage)
      return () => listeners.get(channel)?.delete(onMessage)
    },
    publish(channel, data) {
      publishCalls.push({ channel, data })
      return Promise.resolve()
    },
    emit(channel, data) {
      const cbs = listeners.get(channel)
      if (cbs) for (const cb of cbs) cb(data)
    },
  }
}

type WriteOp = { type: string; value?: unknown; key?: unknown }

function driveSync(config: CollectionConfig<any, any, any, any>): {
  ops: Array<WriteOp>
  stop: () => void
} {
  const ops: Array<WriteOp> = []
  const stop = config.sync.sync({
    collection: null as any,
    begin: () => {},
    write: (op: WriteOp) => ops.push(op),
    commit: () => {},
    markReady: () => {},
    truncate: () => {},
  })
  return { ops, stop: stop as unknown as () => void }
}

// ---------------------------------------------------------------------------
// 1. withRest — bring your own backend (docs: Collections "withRest" section)
// ---------------------------------------------------------------------------

describe('docs: withRest helper', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('queryFn GETs the full URL including query string', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: '1', title: 'Task A' }]),
    } as Response)

    const opts = withRest<{ id: string; title: string }, string>({
      url: '/api/tasks?projectId=abc',
      getKey: (t) => t.id,
    })

    const rows = await opts.queryFn()
    expect(rows).toEqual([{ id: '1', title: 'Task A' }])
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks?projectId=abc',
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })

  it('onInsert POSTs to the base URL (query string stripped)', async () => {
    const created = { id: '2', title: 'New task' }
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(created),
    } as Response)

    const opts = withRest<{ id: string; title: string }, string>({
      url: '/api/tasks?projectId=abc',
      getKey: (t) => t.id,
    })

    const result = await opts.onInsert({
      transaction: {
        mutations: [
          { modified: { title: 'New task' }, key: '2', original: {} },
        ],
      },
    } as any)

    expect(result).toEqual(created)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/tasks') // query string stripped
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ title: 'New task' })
  })

  it('onUpdate PATCHes to itemUrl (base + "/" + key by default)', async () => {
    const updated = { id: '3', title: 'Updated' }
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(updated),
    } as Response)

    const opts = withRest<{ id: string; title: string }, string>({
      url: '/api/tasks',
      getKey: (t) => t.id,
    })

    await opts.onUpdate({
      transaction: {
        mutations: [
          { modified: { id: '3', title: 'Updated' }, key: '3', original: {} },
        ],
      },
    } as any)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/tasks/3')
    expect(init.method).toBe('PATCH')
  })

  it('onDelete DELETEs to itemUrl', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true } as Response)

    const opts = withRest<{ id: string; title: string }, string>({
      url: '/api/tasks',
      getKey: (t) => t.id,
    })

    await opts.onDelete({
      transaction: {
        mutations: [
          { modified: { id: '4', title: 'Bye' }, key: '4', original: {} },
        ],
      },
    } as any)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/tasks/4')
    expect(init.method).toBe('DELETE')
  })

  it('respects a custom itemUrl function', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '5', title: 'x' }),
    } as Response)

    const opts = withRest<{ id: string; title: string }, string>({
      url: '/api/tasks',
      getKey: (t) => t.id,
      itemUrl: (id) => `/api/v2/tasks/${id}`,
    })

    await opts.onUpdate({
      transaction: {
        mutations: [
          { modified: { id: '5', title: 'x' }, key: '5', original: {} },
        ],
      },
    } as any)

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v2/tasks/5')
  })

  it('resolves async header factory before each request', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response)

    const opts = withRest<{ id: string }, string>({
      url: '/api/tasks',
      getKey: (t) => t.id,
      headers: async () => ({ Authorization: 'Bearer token123' }),
    })

    await opts.queryFn()
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer token123',
    )
  })

  it('spreads into realtimeCollectionOptions cleanly', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response)

    // The documented pattern — just verify it constructs without error
    expect(() =>
      realtimeCollectionOptions({
        ...withRest<{ id: string; title: string }, string>({
          url: '/api/tasks?projectId=abc',
          getKey: (t) => t.id,
        }),
        client,
        channel: ['tasks', { projectId: 'abc' }],
        fields: { title: 'lww' },
      }),
    ).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// 2. Auto-broadcast — onInsert returns value → library publishes to channel
//    (docs: "How auto-broadcast works" callout)
// ---------------------------------------------------------------------------

describe('docs: auto-broadcast after onInsert / onUpdate', () => {
  it('publishes to channel after onInsert returns a value — no manual publish needed', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<
      { id: string; title: string },
      string
    >({
      client,
      channel: 'tasks',
      getKey: (t) => t.id,
      onInsert: () => Promise.resolve({ id: '1', title: 'Created by server' }),
    })
    driveSync(config)

    await config.onInsert!({
      transaction: { mutations: [{ modified: {}, key: '1', original: {} }] },
    } as any)

    // The library should have published exactly once — the returned row
    expect(transport.publishCalls).toHaveLength(1)
    expect((transport.publishCalls[0].data as any).action).toBe('insert')
    expect((transport.publishCalls[0].data as any).data).toMatchObject({
      id: '1',
      title: 'Created by server',
    })
  })

  it('publishes to channel after onUpdate returns a value', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<
      { id: string; title: string },
      string
    >({
      client,
      channel: 'tasks',
      getKey: (t) => t.id,
      onUpdate: () => Promise.resolve({ id: '1', title: 'Edited by server' }),
    })
    driveSync(config)

    await config.onUpdate!({
      transaction: {
        mutations: [{ modified: { id: '1' }, key: '1', original: {} }],
      },
    } as any)

    expect(transport.publishCalls).toHaveLength(1)
    expect((transport.publishCalls[0].data as any).action).toBe('update')
  })

  it('does NOT publish when onInsert is absent (no channel noise)', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<{ id: string }, string>({
      client,
      channel: 'tasks',
      getKey: (t) => t.id,
      // No onInsert — read-only subscription
    })
    driveSync(config)

    // Simulate an incoming insert from a peer — should not cause a re-publish
    transport.emit('tasks', { action: 'insert', data: { id: '1' } })

    expect(transport.publishCalls).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// 3. liveChannelOptions — initialData seeds + onEvent filtering
//    (docs: LiveEvents section)
// ---------------------------------------------------------------------------

describe('docs: liveChannelOptions', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('seeds from initialData before live events', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    interface Message {
      id: string
      text: string
      type: string
    }
    const ops: Array<{ value?: unknown }> = []

    const config = liveChannelOptions<Message, string>({
      client,
      channel: 'chat:room-1',
      getKey: (m) => m.id,
      initialData: () =>
        Promise.resolve([{ id: 'h1', text: 'Hello history', type: 'message' }]),
      onEvent: (raw) => {
        const e = raw as { type: string; message: Message }
        return e.type === 'message' ? e.message : null
      },
    })
    config.sync.sync({
      collection: null as any,
      begin: () => {},
      write: (op: any) => ops.push(op),
      commit: () => {},
      markReady: () => {},
      truncate: () => {},
    })

    // Live event arrives before history resolves
    transport.emit('chat:room-1', {
      type: 'message',
      message: { id: 'live-1', text: 'Live!', type: 'message' },
    })
    expect(ops).toHaveLength(0) // buffered

    await vi.advanceTimersByTimeAsync(0)

    expect(ops).toHaveLength(2)
    // History first
    expect((ops[0].value as Message).id).toBe('h1')
    // Live event replayed after
    expect((ops[1].value as Message).id).toBe('live-1')
  })

  it('onEvent returning null suppresses events (e.g. typing indicators)', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    interface Message {
      id: string
      text: string
      type: string
    }
    const ops: Array<{ value?: unknown }> = []

    const config = liveChannelOptions<Message, string>({
      client,
      channel: 'chat:room-1',
      getKey: (m) => m.id,
      initialData: () => Promise.resolve([]),
      onEvent: (raw) => {
        const e = raw as { type: string; message?: Message }
        return e.type === 'message' ? e.message! : null
      },
    })
    config.sync.sync({
      collection: null as any,
      begin: () => {},
      write: (op: any) => ops.push(op),
      commit: () => {},
      markReady: () => {},
      truncate: () => {},
    })
    await vi.advanceTimersByTimeAsync(0)

    // A real message — should appear
    transport.emit('chat:room-1', {
      type: 'message',
      message: { id: 'm1', text: 'Hi', type: 'message' },
    })
    // A typing indicator — should be filtered out
    transport.emit('chat:room-1', { type: 'typing' })
    // Another real message
    transport.emit('chat:room-1', {
      type: 'message',
      message: { id: 'm2', text: 'Hey', type: 'message' },
    })

    expect(ops).toHaveLength(2)
    expect((ops[0].value as Message).id).toBe('m1')
    expect((ops[1].value as Message).id).toBe('m2')
  })
})

// ---------------------------------------------------------------------------
// 4. streamChannelOptions / createStreamChannel — AI tokens + metrics
//    (docs: Streaming section)
// ---------------------------------------------------------------------------

describe('docs: createStreamChannel + streamChannelOptions', () => {
  it('tokens accumulate via reduce until isDone transitions to "done"', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    // Mirrors the documented aiResponseStream pattern.
    // streamChannelOptions takes { client, channel, initial, reduce, isDone, isError }
    // directly.  createStreamChannel is a def object for React hooks (useStream).
    const updates: Array<{ state: { content: string }; status: string }> = []

    const config = streamChannelOptions({
      client,
      channel: ['ai', { requestId: 'req-1' }],
      initial: { content: '' },
      reduce: (
        state: { content: string },
        event: { type: string; token?: string },
      ) =>
        event.type === 'token'
          ? { content: state.content + (event.token ?? '') }
          : state,
      isDone: (_: any, e: unknown) => (e as { type: string }).type === 'done',
      isError: (_: any, e: unknown) =>
        (e as { type: string }).type === 'error'
          ? ((e as { message?: string }).message ?? 'Unknown error')
          : false,
    })

    config.sync.sync({
      begin: () => {},
      write: (op: any) => {
        if (op.value?.state !== undefined) updates.push(op.value)
      },
      commit: () => {},
      markReady: () => {},
      truncate: () => {},
      collection: null as any,
    } as any)

    // The channel is the serialized QueryKey
    const def = createStreamChannel({
      id: 'ai-test',
      channel: (params: { requestId: string }) => ['ai', params],
      initial: { content: '' },
      reduce: (
        state: { content: string },
        event: { type: string; token?: string },
      ) =>
        event.type === 'token'
          ? { content: state.content + (event.token ?? '') }
          : state,
    })
    const channel = def.resolveChannel({ requestId: 'req-1' })

    // Emit token events — each should accumulate
    transport.emit(channel, { type: 'token', token: 'Hello' })
    transport.emit(channel, { type: 'token', token: ' world' })
    transport.emit(channel, { type: 'done' })

    // After 'done', the final state should have the full content
    const last = updates[updates.length - 1]
    expect(last.state.content).toBe('Hello world')
    expect(last.status).toBe('done')
  })

  it('isError transitions status to "error" with the error message', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const updates: Array<{
      state: { content: string }
      status: string
      error?: string
    }> = []

    const config = streamChannelOptions({
      client,
      channel: ['ai', { requestId: 'err-1' }],
      initial: { content: '' },
      reduce: (
        state: { content: string },
        event: { type: string; token?: string },
      ) =>
        event.type === 'token'
          ? { content: state.content + (event.token ?? '') }
          : state,
      isDone: (_: any, e: unknown) => (e as { type: string }).type === 'done',
      isError: (_: any, e: unknown) =>
        (e as { type: string }).type === 'error'
          ? ((e as { message?: string }).message ?? 'Unknown error')
          : false,
    })

    config.sync.sync({
      begin: () => {},
      write: (op: any) => {
        if (op.value?.state !== undefined) updates.push(op.value)
      },
      commit: () => {},
      markReady: () => {},
      truncate: () => {},
      collection: null as any,
    } as any)

    const def = createStreamChannel({
      id: 'ai-err',
      channel: (params: { requestId: string }) => ['ai', params],
      initial: { content: '' },
      reduce: (
        state: { content: string },
        event: { type: string; token?: string },
      ) =>
        event.type === 'token'
          ? { content: state.content + (event.token ?? '') }
          : state,
    })
    const channel = def.resolveChannel({ requestId: 'err-1' })

    transport.emit(channel, { type: 'token', token: 'Partial' })
    transport.emit(channel, { type: 'error', message: 'Rate limit exceeded' })

    const last = updates[updates.length - 1]
    expect(last.status).toBe('error')
    expect(last.error).toBe('Rate limit exceeded')
    // Partial content is preserved from before the error (isError runs pre-reduce)
    expect(last.state.content).toBe('Partial')
  })

  it('open-ended stream (no isDone) runs until stop() is called', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    // Mirrors the documented cpuStream pattern
    const updates: Array<{ pct: number; samples: Array<number> }> = []

    const config = streamChannelOptions({
      client,
      channel: ['metrics:cpu', { serverId: 'srv-1' }],
      initial: { pct: 0, samples: [] as Array<number> },
      reduce: (
        state: { pct: number; samples: Array<number> },
        event: { pct: number },
      ) => ({
        pct: event.pct,
        samples: [...state.samples.slice(-60), event.pct],
      }),
      // No isDone — open-ended stream
    })

    const stopFn = config.sync.sync({
      begin: () => {},
      write: (op: any) => {
        if (op.value?.state) updates.push(op.value.state)
      },
      commit: () => {},
      markReady: () => {},
      truncate: () => {},
      collection: null as any,
    } as any)
    const stop = stopFn as unknown as () => void

    const def = createStreamChannel({
      id: 'cpu',
      channel: (params: { serverId: string }) => ['metrics:cpu', params],
      initial: { pct: 0, samples: [] as Array<number> },
      reduce: (
        state: { pct: number; samples: Array<number> },
        event: { pct: number },
      ) => ({ pct: event.pct, samples: [...state.samples, event.pct] }),
    })
    const channel = def.resolveChannel({ serverId: 'srv-1' })

    transport.emit(channel, { pct: 42 })
    transport.emit(channel, { pct: 55 })

    expect(updates[updates.length - 1].pct).toBe(55)
    expect(updates[updates.length - 1].samples).toEqual([42, 55])

    stop() // component unmounts
    transport.emit(channel, { pct: 99 })
    // After stop, the last state should still be 55
    expect(updates[updates.length - 1].pct).toBe(55)
  })
})

// ---------------------------------------------------------------------------
// 5. onMessage adapter — Supabase Realtime wire format
//    (docs: MessageAdapters section)
// ---------------------------------------------------------------------------

describe('docs: onMessage adapter — Supabase format', () => {
  it('maps INSERT / UPDATE / DELETE eventType to action', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    interface Task {
      id: string
      title: string
    }
    const ops: Array<WriteOp> = []

    const config = realtimeCollectionOptions<Task, string>({
      getKey: (t) => t.id,
      client,
      channel: 'public:tasks',
      onMessage: (raw) => {
        const e = raw as { eventType: string; new: Task; old: Task }
        if (e.eventType === 'INSERT') return { action: 'insert', data: e.new }
        if (e.eventType === 'UPDATE') return { action: 'update', data: e.new }
        if (e.eventType === 'DELETE') return { action: 'delete', data: e.old }
        return null
      },
    })
    config.sync.sync({
      collection: null as any,
      begin: () => {},
      write: (op: any) => ops.push(op),
      commit: () => {},
      markReady: () => {},
      truncate: () => {},
    })

    const task = { id: '1', title: 'Ship it' }

    // Supabase-style INSERT
    transport.emit('public:tasks', {
      eventType: 'INSERT',
      new: task,
      old: null,
    })
    expect(ops[0].type).toBe('insert')
    expect((ops[0].value as Task).title).toBe('Ship it')

    // Supabase-style UPDATE
    const updated = { id: '1', title: 'Ship it now' }
    transport.emit('public:tasks', {
      eventType: 'UPDATE',
      new: updated,
      old: task,
    })
    expect(ops[1].type).toBe('update')
    expect((ops[1].value as Task).title).toBe('Ship it now')

    // Supabase-style DELETE
    transport.emit('public:tasks', {
      eventType: 'DELETE',
      new: null,
      old: updated,
    })
    expect(ops[2].type).toBe('delete')

    // Unknown event type — discarded (no op added)
    transport.emit('public:tasks', { eventType: 'SYSTEM' })
    expect(ops).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// 6. onMessage adapter — CDC / Debezium wire format
//    (docs: MessageAdapters section)
// ---------------------------------------------------------------------------

describe('docs: onMessage adapter — CDC (Debezium) format', () => {
  it('maps op c/u/d to insert/update/delete actions', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    interface Order {
      id: string
      total: number
    }
    const ops: Array<WriteOp> = []

    const config = realtimeCollectionOptions<Order, string>({
      getKey: (o) => o.id,
      client,
      channel: 'orders',
      onMessage: (raw) => {
        const e = raw as { op: string; after?: Order; before?: Order }
        if (e.op === 'c') return { action: 'insert', data: e.after! }
        if (e.op === 'u') return { action: 'update', data: e.after! }
        if (e.op === 'd') return { action: 'delete', data: e.before! }
        return null
      },
    })
    config.sync.sync({
      collection: null as any,
      begin: () => {},
      write: (op: any) => ops.push(op),
      commit: () => {},
      markReady: () => {},
      truncate: () => {},
    })

    const order = { id: 'o1', total: 100 }
    const updated = { id: 'o1', total: 150 }

    transport.emit('orders', { op: 'c', after: order })
    expect(ops[0].type).toBe('insert')
    expect((ops[0].value as Order).total).toBe(100)

    transport.emit('orders', { op: 'u', after: updated, before: order })
    expect(ops[1].type).toBe('update')
    expect((ops[1].value as Order).total).toBe(150)

    transport.emit('orders', { op: 'd', before: updated })
    expect(ops[2].type).toBe('delete')

    // Unknown op — discarded
    transport.emit('orders', { op: 'r', after: order }) // snapshot read
    expect(ops).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// 7. createOfflineQueue — queues when disconnected, flushes on reconnect
//    (docs: Resilience section)
// ---------------------------------------------------------------------------

describe('docs: createOfflineQueue', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('buffers publishes while disconnected and flushes FIFO on reconnect', async () => {
    const innerPublishCalls: Array<{ channel: string; data: unknown }> = []

    // Create an inner transport that starts disconnected
    const innerStore = new Store<ConnectionStatus>('disconnected')
    const innerTransport: RealtimeTransport = {
      store: innerStore,
      async connect() {},
      disconnect() {},
      subscribe() {
        return () => {}
      },
      async publish(channel, data) {
        innerPublishCalls.push({ channel, data })
      },
    }

    const transport = createOfflineQueue(innerTransport, { maxSize: 500 })
    const _client = createRealtimeClient({ transport })

    // Publish while disconnected — should be queued
    void transport.publish('ch', { msg: 1 })
    void transport.publish('ch', { msg: 2 })
    void transport.publish('ch', { msg: 3 })

    // Nothing forwarded yet
    expect(innerPublishCalls).toHaveLength(0)

    // Verify queue store shows pending messages
    expect(transport.queueStore.state.pending.length).toBe(3)

    // Reconnect — queue should flush
    innerStore.setState(() => 'connected')
    await vi.advanceTimersByTimeAsync(0)

    expect(innerPublishCalls).toHaveLength(3)
    // FIFO order
    expect((innerPublishCalls[0].data as any).msg).toBe(1)
    expect((innerPublishCalls[1].data as any).msg).toBe(2)
    expect((innerPublishCalls[2].data as any).msg).toBe(3)

    // Queue store should be empty after flush
    expect(transport.queueStore.state.pending.length).toBe(0)
  })

  it('forwards publishes immediately when already connected', async () => {
    const innerPublishCalls: Array<{ channel: string; data: unknown }> = []
    const innerStore = new Store<ConnectionStatus>('connected')
    const innerTransport: RealtimeTransport = {
      store: innerStore,
      async connect() {},
      disconnect() {},
      subscribe() {
        return () => {}
      },
      async publish(channel, data) {
        innerPublishCalls.push({ channel, data })
      },
    }

    const transport = createOfflineQueue(innerTransport)

    await transport.publish('ch', { msg: 'direct' })
    expect(innerPublishCalls).toHaveLength(1)
    expect(transport.queueStore.state.pending.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 8. withGapRecovery — onGap fired for active channels after reconnect
//    (docs: Resilience section — Option B)
// ---------------------------------------------------------------------------

describe('docs: withGapRecovery', () => {
  it('calls onGap for each active channel when transport reconnects', async () => {
    const innerStore = new Store<ConnectionStatus>('connected')
    const innerTransport: RealtimeTransport & {
      setStatus: (s: ConnectionStatus) => void
    } = {
      store: innerStore,
      setStatus: (s: ConnectionStatus) => innerStore.setState(() => s),
      async connect() {},
      disconnect() {},
      subscribe() {
        return () => {}
      },
      async publish() {},
    }

    const gapCalls: Array<string> = []
    const transport = withGapRecovery(innerTransport, {
      onGap: async (channel) => {
        gapCalls.push(channel)
      },
    })

    // Subscribe to two channels — they become "active"
    const unsub1 = transport.subscribe('tasks', () => {})
    const unsub2 = transport.subscribe('messages', () => {})

    // Simulate disconnect → reconnect (the gap)
    innerTransport.setStatus('disconnected')
    innerTransport.setStatus('connected')

    await Promise.resolve() // flush microtasks

    // onGap should be called for every active channel
    expect(gapCalls).toContain('tasks')
    expect(gapCalls).toContain('messages')
    expect(gapCalls).toHaveLength(2)

    unsub1()
    unsub2()
  })

  it('does NOT call onGap for channels that were unsubscribed before reconnect', async () => {
    const innerStore = new Store<ConnectionStatus>('connected')
    const innerTransport: RealtimeTransport & {
      setStatus: (s: ConnectionStatus) => void
    } = {
      store: innerStore,
      setStatus: (s: ConnectionStatus) => innerStore.setState(() => s),
      async connect() {},
      disconnect() {},
      subscribe() {
        return () => {}
      },
      async publish() {},
    }

    const gapCalls: Array<string> = []
    const transport = withGapRecovery(innerTransport, {
      onGap: async (channel) => {
        gapCalls.push(channel)
      },
    })

    const unsub = transport.subscribe('tasks', () => {})
    transport.subscribe('messages', () => {})

    // Unsubscribe from 'tasks' before the gap
    unsub()

    innerTransport.setStatus('disconnected')
    innerTransport.setStatus('connected')
    await Promise.resolve()

    // Only 'messages' should get a gap call
    expect(gapCalls).not.toContain('tasks')
    expect(gapCalls).toContain('messages')
  })
})

// ---------------------------------------------------------------------------
// 9. refetchOnReconnect — simplest gap recovery (docs: Spectrum step 5)
// ---------------------------------------------------------------------------

describe('docs: refetchOnReconnect in realtimeCollectionOptions', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('re-runs queryFn after transport reconnects', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    let fetchCount = 0
    const config = realtimeCollectionOptions<{ id: string }, string>({
      client,
      channel: 'tasks',
      getKey: (t) => t.id,
      queryFn: () => {
        fetchCount++
        return Promise.resolve([{ id: '1' }])
      },
      refetchOnReconnect: true,
    })
    driveSync(config)
    await vi.advanceTimersByTimeAsync(0)
    expect(fetchCount).toBe(1)

    // Simulate a connection gap
    transport.setStatus('disconnected')
    transport.setStatus('connected')
    await vi.advanceTimersByTimeAsync(0)

    expect(fetchCount).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// 10. CRDTs — local fields are never published to peers
//     (docs: CRDTs section — "Local field" card)
// ---------------------------------------------------------------------------

describe('docs: CRDT local fields stripped before publishing', () => {
  it('local fields are not included in the published message', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    interface Task {
      id: string
      title: string
      draft?: boolean
    }

    const config = realtimeCollectionOptions<Task, string>({
      client,
      channel: 'tasks',
      getKey: (t) => t.id,
      fields: { title: 'lww', draft: 'local' },
      onUpdate: () =>
        Promise.resolve({ id: '1', title: 'Updated', draft: true }),
    })
    driveSync(config)

    // Seed a row with a local draft field
    transport.emit('tasks', {
      action: 'insert',
      data: { id: '1', title: 'Original', draft: true },
    })

    await config.onUpdate!({
      transaction: {
        mutations: [{ modified: { id: '1' }, key: '1', original: {} }],
      },
    } as any)

    const published = transport.publishCalls[0].data as any
    // The 'draft' local field must NOT appear in the published message
    expect(published.data.draft).toBeUndefined()
    // The synced title field should still be there
    expect(published.data.title).toBe('Updated')
  })
})
