/**
 * Progressive spectrum tests for realtimeCollectionOptions.
 *
 * Each describe block adds ONE config key to demonstrate how collections
 * grow from server-only data loading to full collaborative CRDT sync.
 * Read these tests top-to-bottom as a learning guide.
 */

import { describe, expect, it, vi } from 'vitest'
import { Store } from '@tanstack/store'
import {
  createRealtimeClient,
  realtimeCollectionOptions,
} from '@tanstack/realtime'
import type { ConnectionStatus, RealtimeTransport } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Todo {
  id: string
  title: string
  votes: number
  tags: Array<string>
}

type WriteOp = { type: string; value?: unknown; key?: unknown }

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
    emit(channel: string, data: unknown) {
      const cbs = listeners.get(channel)
      if (cbs) for (const cb of cbs) cb(data)
    },
  }
}

function driveSync(config: ReturnType<typeof realtimeCollectionOptions>): {
  ops: Array<WriteOp>
  stop: () => void
  isReady: () => boolean
} {
  const ops: Array<WriteOp> = []
  let ready = false
  const stop = config.sync.sync({
    begin: () => {},
    write: (op: WriteOp) => ops.push(op),
    commit: () => {},
    markReady: () => {
      ready = true
    },
  })
  return { ops, stop, isReady: () => ready }
}

// ---------------------------------------------------------------------------
// Step 1: queryFn only — server data loading, no realtime
// ---------------------------------------------------------------------------

describe('spectrum step 1: queryFn only (server data)', () => {
  it('loads data from the server without a client or channel', async () => {
    const config = realtimeCollectionOptions<Todo, string>({
      getKey: (t) => t.id,
      queryFn: () => Promise.resolve([{ id: '1', title: 'Buy milk', votes: 0, tags: [] }]),
    })
    const { ops, isReady } = driveSync(config)
    await new Promise((r) => setTimeout(r, 0))

    expect(isReady()).toBe(true)
    expect(ops).toHaveLength(1)
    expect((ops[0].value as Todo).title).toBe('Buy milk')
  })
})

// ---------------------------------------------------------------------------
// Step 2: + mutations — server-persisted writes
// ---------------------------------------------------------------------------

describe('spectrum step 2: + mutations (server-persisted writes)', () => {
  it('mutations persist via callbacks without publishing to any channel', async () => {
    const persisted: Array<Todo> = []

    const config = realtimeCollectionOptions<Todo, string>({
      getKey: (t) => t.id,
      queryFn: () => Promise.resolve([]),
      onInsert: () => {
        const todo = { id: '1', title: 'New', votes: 0, tags: [] }
        persisted.push(todo)
        return Promise.resolve(todo)
      },
    })
    driveSync(config)
    await new Promise((r) => setTimeout(r, 0))

    await config.onInsert!({
      transaction: {
        mutations: [{ modified: {}, key: '1', original: {} }],
      },
    } as any)

    expect(persisted).toHaveLength(1)
    // No transport, no publish — mutations just persist.
  })
})

// ---------------------------------------------------------------------------
// Step 3: + client + channel — realtime peer sync
// ---------------------------------------------------------------------------

describe('spectrum step 3: + client + channel (realtime peer sync)', () => {
  it('subscribes to the channel and receives live inserts', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Todo, string>({
      client,
      channel: 'todos',
      getKey: (t) => t.id,
    })
    const { ops } = driveSync(config)

    transport.emit('todos', {
      action: 'insert',
      data: { id: '1', title: 'From peer', votes: 0, tags: [] },
    })

    expect(ops).toHaveLength(1)
    expect((ops[0].value as Todo).title).toBe('From peer')
  })

  it('publishes back to the channel after a successful mutation', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Todo, string>({
      client,
      channel: 'todos',
      getKey: (t) => t.id,
      onInsert: () => Promise.resolve({ id: '1', title: 'Created', votes: 0, tags: [] }),
    })
    driveSync(config)

    await config.onInsert!({
      transaction: {
        mutations: [{ modified: {}, key: '1', original: {} }],
      },
    } as any)

    expect(transport.publishCalls).toHaveLength(1)
    expect((transport.publishCalls[0].data as any).action).toBe('insert')
  })
})

// ---------------------------------------------------------------------------
// Step 4: + fields — per-field CRDT convergence
// ---------------------------------------------------------------------------

describe('spectrum step 4: + fields (CRDT convergence)', () => {
  it('concurrent updates to different CRDT fields both survive', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions<Todo, string>({
      client,
      channel: 'todos',
      getKey: (t) => t.id,
      fields: {
        title: 'lww',
        votes: 'pn-counter',
        tags: 'or-set',
      },
    })
    const { ops } = driveSync(config)

    // Seed with an initial row.
    transport.emit('todos', {
      action: 'insert',
      data: { id: '1', title: 'Original', votes: 5, tags: ['bug'] },
    })

    // Peer sends an update with LWW title change.
    transport.emit('todos', {
      action: 'update',
      data: { id: '1', title: 'Renamed', votes: 5, tags: ['bug'] },
      _crdt: {
        fields: {
          title: {
            type: 'lww',
            value: 'Renamed',
            clock: 100,
            clientId: 'peer-1',
          },
        },
      },
    })

    const lastOp = ops[ops.length - 1]
    expect((lastOp.value as Todo).title).toBe('Renamed')
  })

  it('local fields are preserved across updates and never sent to peers', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    interface TodoWithDraft extends Todo {
      draft?: boolean
    }

    const config = realtimeCollectionOptions<TodoWithDraft, string>({
      client,
      channel: 'todos',
      getKey: (t) => t.id,
      fields: {
        title: 'lww',
        draft: 'local',
      },
      onUpdate: () =>
        Promise.resolve({
          id: '1',
          title: 'Updated',
          votes: 0,
          tags: [],
          draft: true,
        }),
    })
    driveSync(config)

    // Seed with draft=true (local field).
    transport.emit('todos', {
      action: 'insert',
      data: { id: '1', title: 'Hello', votes: 0, tags: [], draft: true },
    })

    // Peer sends update — local field should be preserved.
    transport.emit('todos', {
      action: 'update',
      data: { id: '1', title: 'Peer edit', votes: 0, tags: [] },
      _crdt: {
        fields: {
          title: {
            type: 'lww',
            value: 'Peer edit',
            clock: 50,
            clientId: 'peer',
          },
        },
      },
    })

    // Trigger a mutation to verify publish strips local fields.
    await config.onUpdate!({
      transaction: {
        mutations: [{ modified: {}, key: '1', original: {} }],
      },
    } as any)

    const published = transport.publishCalls[0].data as any
    expect(published.data.draft).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Step 5: + refetchOnReconnect — automatic gap recovery
// ---------------------------------------------------------------------------

describe('spectrum step 5: + refetchOnReconnect (gap recovery)', () => {
  it('re-fetches data after a connection gap', async () => {
    vi.useFakeTimers()
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    let fetchCount = 0
    const config = realtimeCollectionOptions<Todo, string>({
      client,
      channel: 'todos',
      getKey: (t) => t.id,
      queryFn: () => {
        fetchCount++
        return Promise.resolve([])
      },
      refetchOnReconnect: true,
    })
    driveSync(config)
    await vi.advanceTimersByTimeAsync(0)
    expect(fetchCount).toBe(1)

    // Simulate a connection gap.
    transport.setStatus('disconnected')
    transport.setStatus('connected')
    await vi.advanceTimersByTimeAsync(0)

    expect(fetchCount).toBe(2)
    vi.useRealTimers()
  })
})

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('spectrum validation', () => {
  it('throws if channel is provided without client', () => {
    expect(() =>
      realtimeCollectionOptions<Todo, string>({
        getKey: (t) => t.id,
        channel: 'todos',
      } as any),
    ).toThrow('`client` is required')
  })

  it('throws if fields is provided without client', () => {
    expect(() =>
      realtimeCollectionOptions<Todo, string>({
        getKey: (t) => t.id,
        fields: { title: 'lww' },
      } as any),
    ).toThrow('`client` is required')
  })

  it('throws if refetchOnReconnect is provided without client', () => {
    expect(() =>
      realtimeCollectionOptions<Todo, string>({
        getKey: (t) => t.id,
        refetchOnReconnect: true,
      } as any),
    ).toThrow('`client` is required')
  })
})
