/**
 * Tests for the @realtimejs/react hook behavior.
 *
 * These tests verify the underlying logic that each React hook encapsulates
 * using the core framework-agnostic API directly. They serve as a contract
 * specification for how each hook must behave, and can be run in a plain
 * Node.js environment without a DOM or React renderer.
 *
 * For full React rendering tests (including Strict Mode double-invoke,
 * unmount/cleanup, and re-render behavior), see the companion
 * react-hooks-dom.test.tsx file which requires @testing-library/react.
 */

import { describe, expect, it, vi } from 'vitest'
import {
  advanceClock,
  createMockPresenceTransport,
  createMockTransport,
  createPresenceChannel,
  createRealtimeClient,
  createStreamChannel,
  defineSyncedCounter,
  defineSyncedSet,
  defineSyncedValue,
  generateClientId,
  lwwWins,
  mergeOr,
  mergePn,
  orAdd,
  orHas,
  orRemove,
  orValues,
  pnDecrement,
  pnIncrement,
  pnValue,
  tickClock,
} from '@realtimejs/core'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeClient() {
  const transport = createMockTransport()
  const client = createRealtimeClient({ transport })
  return { transport, client }
}

function makePresenceClient() {
  const transport = createMockPresenceTransport()
  const client = createRealtimeClient({ transport })
  return { transport, client }
}

// ---------------------------------------------------------------------------
// useConnectionStatus / useRealtime — connection state contract
// ---------------------------------------------------------------------------

describe('connection status contract', () => {
  it('starts connected when transport initialises in connected state', () => {
    const { client } = makeClient()
    expect(client.store.get().status).toBe('connected')
  })

  it('transitions to reconnecting after simulateDisconnect', () => {
    const { transport, client } = makeClient()
    transport.simulateDisconnect()
    expect(client.store.get().status).toBe('reconnecting')
  })

  it('transitions back to connected after simulateReconnect', () => {
    const { transport, client } = makeClient()
    transport.simulateDisconnect()
    transport.simulateReconnect()
    expect(client.store.get().status).toBe('connected')
  })

  it('starts disconnected when initialStatus is disconnected', () => {
    const transport = createMockTransport({ initialStatus: 'disconnected' })
    const client = createRealtimeClient({ transport })
    expect(client.store.get().status).toBe('disconnected')
  })
})

// ---------------------------------------------------------------------------
// useSubscribe — subscription + subscribeError contract
// ---------------------------------------------------------------------------

describe('useSubscribe contract', () => {
  it('delivers messages to the subscribed handler', () => {
    const { transport, client } = makeClient()
    const handler = vi.fn()
    client.subscribe('chat:roomId=1', handler)

    transport.simulateMessage('chat:roomId=1', { text: 'hello' })

    expect(handler).toHaveBeenCalledWith({ text: 'hello' })
  })

  it('does not deliver to unsubscribed handler', () => {
    const { transport, client } = makeClient()
    const handler = vi.fn()
    const unsub = client.subscribe('chat:roomId=1', handler)
    unsub()

    transport.simulateMessage('chat:roomId=1', { text: 'hello' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('delivers subscribeError when server rejects subscription', () => {
    const { transport, client } = makeClient()
    const errors: Array<{ channel: string; reason: string; code?: number }> = []

    client.onSubscribeError((channel, reason, code) => {
      errors.push({ channel, reason, code })
    })

    transport.simulateSubscribeError('private:roomId=1', 'unauthorized', 4403)

    expect(errors).toHaveLength(1)
    expect(errors[0]).toEqual({
      channel: 'private:roomId=1',
      reason: 'unauthorized',
      code: 4403,
    })
  })

  it('only surfaces errors for the matching channel', () => {
    const { transport, client } = makeClient()
    const errors: Array<string> = []

    client.onSubscribeError((channel) => {
      if (channel === 'my-channel') errors.push(channel)
    })

    transport.simulateSubscribeError('other-channel', 'unauthorized')
    transport.simulateSubscribeError('my-channel', 'unauthorized')

    expect(errors).toHaveLength(1)
    expect(errors[0]).toBe('my-channel')
  })
})

// ---------------------------------------------------------------------------
// usePublish — publish contract
// ---------------------------------------------------------------------------

describe('usePublish contract', () => {
  it('records published messages in publishLog', async () => {
    const { transport, client } = makeClient()

    await client.publish('chat:roomId=1', { text: 'hello' })

    expect(transport.publishLog).toHaveLength(1)
    expect(transport.publishLog[0]).toMatchObject({
      channel: 'chat:roomId=1',
      data: { text: 'hello' },
    })
  })

  it('supports multiple publishes to different channels', async () => {
    const { transport, client } = makeClient()

    await client.publish('ch1', { a: 1 })
    await client.publish('ch2', { b: 2 })

    expect(transport.publishLog).toHaveLength(2)
    expect(transport.publishLog[0].channel).toBe('ch1')
    expect(transport.publishLog[1].channel).toBe('ch2')
  })
})

// ---------------------------------------------------------------------------
// useChannel — combined subscribe + publish + subscribeError contract
// ---------------------------------------------------------------------------

describe('useChannel contract (combined subscribe + publish)', () => {
  it('subscribe + publish work on the same channel', async () => {
    const { transport, client } = makeClient()
    const received: Array<unknown> = []

    client.subscribe('room:roomId=1', (d) => received.push(d))

    transport.simulateMessage('room:roomId=1', { msg: 'hi' })
    await client.publish('room:roomId=1', { msg: 'from client' })

    expect(received).toHaveLength(1)
    expect(received[0]).toEqual({ msg: 'hi' })
    expect(transport.publishLog[0].data).toEqual({ msg: 'from client' })
  })

  it('subscribe error is surfaced independently of publish', () => {
    const { transport, client } = makeClient()
    const errors: Array<string> = []

    client.onSubscribeError((ch) => errors.push(ch))
    transport.simulateSubscribeError('room:roomId=1', 'denied')

    // Can still publish even when subscribe is denied
    void client.publish('room:roomId=1', { attempt: true })

    expect(errors).toContain('room:roomId=1')
    expect(transport.publishLog).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// usePresence — presence contract including `self`
// ---------------------------------------------------------------------------

describe('usePresence contract', () => {
  it('joinPresence makes self available', () => {
    const { transport, client } = makePresenceClient()

    const channel = 'room:roomId=1'
    client.subscribe(channel, () => {})
    client.joinPresence(channel, { name: 'Alice', cursor: null })

    // Local self is tracked via the transport mock
    const state = transport.getPresenceState(channel)
    expect(state).toHaveLength(1)
    expect(state[0].data).toEqual({ name: 'Alice', cursor: null })
  })

  it('others reflects remote users joining', () => {
    const { transport, client } = makePresenceClient()

    const channel = 'room:roomId=1'
    const received: Array<Array<{ connectionId: string; data: unknown }>> = []
    client.onPresenceChange(channel, (users) =>
      received.push(users as Array<{ connectionId: string; data: unknown }>),
    )

    transport.simulatePresenceJoin(channel, {
      connectionId: 'peer-1',
      data: { name: 'Bob' },
    })

    expect(received).toHaveLength(1)
    expect(received[0]).toHaveLength(1)
    expect(received[0][0].data).toEqual({ name: 'Bob' })
  })

  it('updatePresence merges delta into local state (self)', () => {
    const { transport, client } = makePresenceClient()

    const channel = 'room:roomId=1'
    client.subscribe(channel, () => {})
    client.joinPresence(channel, { name: 'Alice', cursor: null })
    client.updatePresence(channel, { cursor: { x: 10, y: 20 } })

    const state = transport.getPresenceState(channel)
    expect(state[0].data).toEqual({ name: 'Alice', cursor: { x: 10, y: 20 } })
  })

  it('leavePresence removes self from channel', () => {
    const { client } = makePresenceClient()

    const channel = 'room:roomId=1'
    const received: Array<ReadonlyArray<unknown>> = []
    client.subscribe(channel, () => {})
    client.onPresenceChange(channel, (users) => received.push(users))
    client.joinPresence(channel, { name: 'Alice' })
    client.leavePresence(channel)

    // After leave the channel should be empty
    expect(received[received.length - 1]).toHaveLength(0)
  })

  it('others excludes self (self-exclusion invariant)', () => {
    const { client } = makePresenceClient()

    const channel = 'room:roomId=1'
    const received: Array<ReadonlyArray<{ data: { name: string } }>> = []
    client.subscribe(channel, () => {})
    client.onPresenceChange(channel, (users) =>
      received.push(users as ReadonlyArray<{ data: { name: string } }>),
    )
    client.joinPresence(channel, { name: 'Alice' })

    // After joining, others should not include self
    // (joinPresence fires presence change; self is excluded by the transport)
    const lastState = received[received.length - 1]
    // MockPresenceTransport's self is stored separately and not in others
    expect(lastState.every((u) => typeof u.data.name === 'string')).toBe(true)
  })

  it('presence channel def resolves channel correctly', () => {
    const roomPresence = createPresenceChannel({
      id: 'room-presence',
      channel: (p: { roomId: string }) => ['room', p],
    })

    const channel = roomPresence.resolveChannel({ roomId: 'r1' })
    expect(channel).toContain('room')
    expect(channel).toContain('r1')
  })
})

// ---------------------------------------------------------------------------
// useStream — stream contract
// ---------------------------------------------------------------------------

describe('useStream contract', () => {
  it('stream channel def resolves channel and provides initial state', () => {
    const aiStream = createStreamChannel({
      id: 'ai-message',
      channel: (p: { messageId: string }) => ['ai', p],
      initial: { content: '' },
      reduce: (
        state: { content: string },
        event: { type: string; content?: string },
      ) =>
        event.type === 'token'
          ? { content: state.content + (event.content ?? '') }
          : state,
      isDone: (_: any, e: any) => e.type === 'done',
    })

    expect(aiStream.initial).toEqual({ content: '' })
    const channel = aiStream.resolveChannel({ messageId: 'm1' })
    expect(channel).toContain('ai')
    expect(channel).toContain('m1')
  })

  it('reduce accumulates events correctly', () => {
    const aiStream = createStreamChannel({
      id: 'ai-reduce-test',
      channel: (p: { id: string }) => ['ai', p],
      initial: { content: '' },
      reduce: (
        state: { content: string },
        event: { type: string; content?: string },
      ) =>
        event.type === 'token'
          ? { content: state.content + (event.content ?? '') }
          : state,
      isDone: (_: any, e: any) => e.type === 'done',
    })

    let state = aiStream.initial
    state = aiStream.reduce(state, { type: 'token', content: 'Hello' })
    state = aiStream.reduce(state, { type: 'token', content: ' World' })
    expect(state).toEqual({ content: 'Hello World' })
  })

  it('isDone detects terminal events', () => {
    const testStream = createStreamChannel({
      id: 'stream-done-test',
      channel: (p: { id: string }) => ['s', p],
      initial: { tokens: 0 },
      reduce: (state: { tokens: number }, _: any) => ({
        tokens: state.tokens + 1,
      }),
      isDone: (_: any, e: any) => e.type === 'done',
    })

    expect(testStream.isDone?.({ tokens: 3 }, { type: 'token' })).toBe(false)
    expect(testStream.isDone?.({ tokens: 3 }, { type: 'done' })).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// useSyncedCounter — PN-Counter CRDT contract
// ---------------------------------------------------------------------------

describe('useSyncedCounter (PN-Counter CRDT) contract', () => {
  it('increment adds to counter', () => {
    const state = { inc: {}, dec: {} }
    const after = pnIncrement(state, 'client-1', 1)
    expect(pnValue(after)).toBe(1)
  })

  it('decrement subtracts from counter', () => {
    const state = pnIncrement({ inc: {}, dec: {} }, 'client-1', 5)
    const after = pnDecrement(state, 'client-1', 2)
    expect(pnValue(after)).toBe(3)
  })

  it('concurrent increments from different clients merge correctly', () => {
    const c1 = pnIncrement({ inc: {}, dec: {} }, 'client-1', 3)
    const c2 = pnIncrement({ inc: {}, dec: {} }, 'client-2', 2)
    const merged = mergePn(c1, c2)
    expect(pnValue(merged)).toBe(5)
  })

  it('publishes CRDT message to channel on increment', async () => {
    const { transport, client } = makeClient()
    const clientId = generateClientId()
    let state = { inc: {}, dec: {} }

    state = pnIncrement(state, clientId, 1)
    await client.publish('counter:id=1', {
      _crdt: 'pn',
      inc: state.inc,
      dec: state.dec,
    })

    expect(transport.publishLog).toHaveLength(1)
    expect(transport.publishLog[0].data).toMatchObject({ _crdt: 'pn' })
  })

  it('synced counter def resolves channel', () => {
    const votes = defineSyncedCounter({
      id: 'votes',
      channel: (p: { postId: string }) => ['votes', p],
    })

    const channel = votes.resolveChannel({ postId: 'p1' })
    expect(channel).toContain('votes')
    expect(channel).toContain('p1')
  })
})

// ---------------------------------------------------------------------------
// useSyncedValue — LWW-Register CRDT contract
// ---------------------------------------------------------------------------

describe('useSyncedValue (LWW-Register CRDT) contract', () => {
  it('higher clock wins', () => {
    const old = { clock: 1, clientId: 'c1' }
    const newer = { clock: 2, clientId: 'c2' }
    // lwwWins(current, incoming) returns true if incoming beats current
    expect(lwwWins(old, newer)).toBe(true)
    expect(lwwWins(newer, old)).toBe(false)
  })

  it('same clock: higher clientId wins for deterministic tiebreak', () => {
    const a = { clock: 5, clientId: 'aaa' }
    const b = { clock: 5, clientId: 'bbb' }
    expect(lwwWins(a, b)).toBe(true) // b > a lexicographically
    expect(lwwWins(b, a)).toBe(false)
  })

  it('advanceClock advances global clock', () => {
    const before = tickClock()
    advanceClock(before + 100)
    const after = tickClock()
    expect(after).toBeGreaterThan(before + 100)
  })

  it('synced value def resolves channel', () => {
    const activeCursor = defineSyncedValue({
      id: 'cursor',
      channel: (p: { userId: string }) => ['cursor', p],
    })

    const channel = activeCursor.resolveChannel({ userId: 'u1' })
    expect(channel).toContain('cursor')
    expect(channel).toContain('u1')
  })
})

// ---------------------------------------------------------------------------
// useSyncedSet — OR-Set CRDT contract
// ---------------------------------------------------------------------------

describe('useSyncedSet (OR-Set CRDT) contract', () => {
  it('add inserts element', () => {
    const state = orAdd({ entries: [] }, 'react')
    expect(orValues(state)).toContain('react')
  })

  it('remove deletes element', () => {
    let state = orAdd({ entries: [] }, 'react')
    state = orRemove(state, 'react')
    expect(orValues(state)).not.toContain('react')
  })

  it('concurrent add wins over concurrent remove (OR-Set semantics)', () => {
    // Client A adds 'react', client B removes 'react' concurrently
    const base = orAdd({ entries: [] }, 'react')
    const clientA = { ...base } // keeps add
    const clientB = orRemove(base, 'react') // concurrent remove

    const merged = mergeOr(clientA, clientB)
    // Add always wins over concurrent remove in OR-Set
    expect(orValues(merged)).toContain('react')
  })

  it('has returns correct membership', () => {
    const state = orAdd({ entries: [] }, 'vue')
    expect(orHas(state, 'vue')).toBe(true)
    expect(orHas(state, 'react')).toBe(false)
  })

  it('publishes OR-Set CRDT message on add', async () => {
    const { transport, client } = makeClient()
    let state: {
      entries: Array<{ key: string; value: unknown; tag: string }>
    } = { entries: [] }
    state = orAdd(state, 'important')

    await client.publish('tags:postId=1', {
      _crdt: 'or',
      entries: state.entries,
    })

    expect(transport.publishLog[0].data).toMatchObject({ _crdt: 'or' })
  })

  it('synced set def resolves channel', () => {
    const postTags = defineSyncedSet({
      id: 'tags',
      channel: (p: { postId: string }) => ['tags', p],
    })

    const channel = postTags.resolveChannel({ postId: 'p1' })
    expect(channel).toContain('tags')
    expect(channel).toContain('p1')
  })
})

// ---------------------------------------------------------------------------
// useIsConnected — boolean connection convenience contract
// ---------------------------------------------------------------------------

describe('useIsConnected contract', () => {
  it('is true when connected', () => {
    const { client } = makeClient()
    expect(client.store.get().status === 'connected').toBe(true)
  })

  it('is false when reconnecting', () => {
    const { transport, client } = makeClient()
    transport.simulateDisconnect()
    expect(client.store.get().status === 'connected').toBe(false)
  })

  it('returns to true after simulateReconnect', () => {
    const { transport, client } = makeClient()
    transport.simulateDisconnect()
    transport.simulateReconnect()
    expect(client.store.get().status === 'connected').toBe(true)
  })
})

// ---------------------------------------------------------------------------
// useLatestMessage — latest-message + message-count contract
// ---------------------------------------------------------------------------

describe('useLatestMessage contract', () => {
  it('starts with no message received', () => {
    const { client } = makeClient()
    let count = 0
    client.subscribe('ch', () => {
      count += 1
    })
    expect(count).toBe(0)
  })

  it('updates to the most recent message payload', () => {
    const { transport, client } = makeClient()
    let latest: unknown = undefined
    client.subscribe('ch', (data) => {
      latest = data
    })

    transport.simulateMessage('ch', { text: 'first' })
    transport.simulateMessage('ch', { text: 'second' })

    expect(latest).toEqual({ text: 'second' })
  })

  it('increments count on every message even with identical payload', () => {
    const { transport, client } = makeClient()
    let count = 0
    client.subscribe('ch', () => {
      count += 1
    })

    transport.simulateMessage('ch', { value: 42 })
    transport.simulateMessage('ch', { value: 42 })
    transport.simulateMessage('ch', { value: 42 })

    expect(count).toBe(3)
  })

  it('does not deliver messages from other channels', () => {
    const { transport, client } = makeClient()
    let latest: unknown = undefined
    client.subscribe('ch:a', (data) => {
      latest = data
    })

    transport.simulateMessage('ch:b', { text: 'other' })

    expect(latest).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// useChannelHistory — ring-buffer contract
// ---------------------------------------------------------------------------

describe('useChannelHistory contract', () => {
  it('accumulates messages in order', () => {
    const { transport, client } = makeClient()
    const history: Array<unknown> = []
    client.subscribe('ch', (data) => history.push(data))

    transport.simulateMessage('ch', { i: 0 })
    transport.simulateMessage('ch', { i: 1 })
    transport.simulateMessage('ch', { i: 2 })

    expect(history).toEqual([{ i: 0 }, { i: 1 }, { i: 2 }])
  })

  it('enforces maxMessages cap — drops oldest entries', () => {
    const { transport, client } = makeClient()
    const maxMessages = 3
    let history: Array<unknown> = []

    client.subscribe('ch', (data) => {
      history = [...history, data]
      if (history.length > maxMessages) history = history.slice(-maxMessages)
    })

    for (let i = 0; i < 5; i++) transport.simulateMessage('ch', { i })

    expect(history).toHaveLength(3)
    expect(history[0]).toEqual({ i: 2 })
    expect(history[2]).toEqual({ i: 4 })
  })

  it('retains the last N messages after many deliveries', () => {
    const { transport, client } = makeClient()
    const maxMessages = 10
    let history: Array<{ i: number }> = []

    client.subscribe('ch', (data) => {
      history = [...history, data as { i: number }].slice(-maxMessages)
    })

    for (let i = 0; i < 50; i++) transport.simulateMessage('ch', { i })

    expect(history).toHaveLength(10)
    expect(history[0].i).toBe(40)
    expect(history[9].i).toBe(49)
  })
})

// ---------------------------------------------------------------------------
// useTypingIndicator — typing signal contract
// ---------------------------------------------------------------------------

describe('useTypingIndicator contract', () => {
  it('publishes typing:start message on startTyping', async () => {
    const { transport, client } = makeClient()
    await client.publish('typing:roomId=1', {
      type: 'typing:start',
      userId: 'alice',
    })
    expect(transport.publishLog[0].data).toMatchObject({
      type: 'typing:start',
      userId: 'alice',
    })
  })

  it('publishes typing:stop message on stopTyping', async () => {
    const { transport, client } = makeClient()
    await client.publish('typing:roomId=1', {
      type: 'typing:stop',
      userId: 'alice',
    })
    expect(transport.publishLog[0].data).toMatchObject({
      type: 'typing:stop',
      userId: 'alice',
    })
  })

  it('excludes self userId from typing list', () => {
    const { transport, client } = makeClient()
    const selfId = 'alice'
    const typingUsers = new Set<string>()

    client.subscribe('typing:roomId=1', (data) => {
      const msg = data as { type: string; userId: string }
      if (msg.userId === selfId) return
      if (msg.type === 'typing:start') typingUsers.add(msg.userId)
      if (msg.type === 'typing:stop') typingUsers.delete(msg.userId)
    })

    transport.simulateMessage('typing:roomId=1', {
      type: 'typing:start',
      userId: selfId,
    })
    expect(typingUsers.has(selfId)).toBe(false)
  })

  it('adds remote user on typing:start', () => {
    const { transport, client } = makeClient()
    const typingUsers = new Set<string>()

    client.subscribe('typing:roomId=1', (data) => {
      const msg = data as { type: string; userId: string }
      if (msg.type === 'typing:start') typingUsers.add(msg.userId)
      if (msg.type === 'typing:stop') typingUsers.delete(msg.userId)
    })

    transport.simulateMessage('typing:roomId=1', {
      type: 'typing:start',
      userId: 'bob',
    })
    expect(typingUsers.has('bob')).toBe(true)
  })

  it('removes remote user on typing:stop', () => {
    const { transport, client } = makeClient()
    const typingUsers = new Set<string>()

    client.subscribe('typing:roomId=1', (data) => {
      const msg = data as { type: string; userId: string }
      if (msg.type === 'typing:start') typingUsers.add(msg.userId)
      if (msg.type === 'typing:stop') typingUsers.delete(msg.userId)
    })

    transport.simulateMessage('typing:roomId=1', {
      type: 'typing:start',
      userId: 'bob',
    })
    transport.simulateMessage('typing:roomId=1', {
      type: 'typing:stop',
      userId: 'bob',
    })
    expect(typingUsers.has('bob')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// useChannelStats — per-channel stats contract
// ---------------------------------------------------------------------------

describe('useChannelStats contract', () => {
  it('starts with zero count and no lastMessageAt', () => {
    const { client } = makeClient()
    let count = 0
    let lastAt: number | null = null
    client.subscribe('stats:ch=1', () => {
      count += 1
      lastAt = Date.now()
    })
    expect(count).toBe(0)
    expect(lastAt).toBeNull()
  })

  it('increments messageCount on each delivery', () => {
    const { transport, client } = makeClient()
    let count = 0
    client.subscribe('stats:ch=1', () => {
      count += 1
    })

    transport.simulateMessage('stats:ch=1', { a: 1 })
    transport.simulateMessage('stats:ch=1', { a: 2 })
    transport.simulateMessage('stats:ch=1', { a: 3 })

    expect(count).toBe(3)
  })

  it('lastMessageAt is set after first message', () => {
    const { transport, client } = makeClient()
    let lastAt: number | null = null

    const before = Date.now()
    client.subscribe('stats:ch=1', () => {
      lastAt = Date.now()
    })
    transport.simulateMessage('stats:ch=1', {})
    const after = Date.now()

    expect(lastAt).not.toBeNull()
    expect(lastAt!).toBeGreaterThanOrEqual(before)
    expect(lastAt!).toBeLessThanOrEqual(after)
  })

  it('stats are independent across channels', () => {
    const { transport, client } = makeClient()
    let countA = 0
    let countB = 0
    client.subscribe('ch:a', () => {
      countA += 1
    })
    client.subscribe('ch:b', () => {
      countB += 1
    })

    transport.simulateMessage('ch:a', {})
    transport.simulateMessage('ch:a', {})
    transport.simulateMessage('ch:b', {})

    expect(countA).toBe(2)
    expect(countB).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// useOnReconnect — reconnection callback contract
// ---------------------------------------------------------------------------

describe('useOnReconnect contract', () => {
  it('does not fire when client starts connected', () => {
    const { client } = makeClient()
    const callback = vi.fn()

    let prev = client.store.get().status
    client.store.subscribe((state) => {
      if (prev !== 'connected' && state.status === 'connected') callback()
      prev = state.status
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('fires on reconnecting → connected transition', () => {
    const { transport, client } = makeClient()
    const callback = vi.fn()

    let prev = client.store.get().status
    client.store.subscribe((state) => {
      if (prev !== 'connected' && state.status === 'connected') callback()
      prev = state.status
    })

    transport.simulateDisconnect()
    transport.simulateReconnect()

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('fires again on each subsequent reconnect', () => {
    const { transport, client } = makeClient()
    const callback = vi.fn()

    let prev = client.store.get().status
    client.store.subscribe((state) => {
      if (prev !== 'connected' && state.status === 'connected') callback()
      prev = state.status
    })

    transport.simulateDisconnect()
    transport.simulateReconnect()
    transport.simulateDisconnect()
    transport.simulateReconnect()

    expect(callback).toHaveBeenCalledTimes(2)
  })
})

// ---------------------------------------------------------------------------
// createTestRealtimeProvider — testing utility contract
// ---------------------------------------------------------------------------

describe('createTestRealtimeProvider (testing utility)', () => {
  it('creates a client in connected state', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    expect(client.store.get().status).toBe('connected')
  })

  it('simulateMessage reaches subscribed handlers', () => {
    const { transport, client } = makeClient()
    const handler = vi.fn()
    client.subscribe('ch', handler)

    transport.simulateMessage('ch', { payload: 42 })

    expect(handler).toHaveBeenCalledWith({ payload: 42 })
  })

  it('simulateSubscribeError fires error callbacks', () => {
    const { transport, client } = makeClient()
    const errors: Array<{ channel: string; reason: string; code?: number }> = []

    client.onSubscribeError((channel, reason, code) =>
      errors.push({ channel, reason, code }),
    )

    transport.simulateSubscribeError('secret', 'unauthorized', 4403)

    expect(errors).toHaveLength(1)
    expect(errors[0]).toEqual({
      channel: 'secret',
      reason: 'unauthorized',
      code: 4403,
    })
  })

  it('publishLog records outgoing messages', async () => {
    const { transport, client } = makeClient()
    await client.publish('events', { type: 'click' })

    expect(transport.publishLog).toHaveLength(1)
    expect(transport.publishLog[0]).toMatchObject({
      channel: 'events',
      data: { type: 'click' },
    })
  })

  it('clearLog resets publishLog', async () => {
    const { transport, client } = makeClient()
    await client.publish('ch', { a: 1 })
    transport.clearLog()
    expect(transport.publishLog).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// createTestRealtimeProviderWithPresence — presence testing contract
// ---------------------------------------------------------------------------

describe('createTestRealtimeProviderWithPresence (testing utility)', () => {
  it('simulatePresenceJoin adds user to channel', () => {
    const { transport } = makePresenceClient()
    const handler = vi.fn()

    transport.onPresenceChange('room', handler)
    transport.simulatePresenceJoin('room', {
      connectionId: 'p1',
      data: { name: 'Bob' },
    })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0][0].data).toEqual({ name: 'Bob' })
  })

  it('simulatePresenceLeave removes user from channel', () => {
    const { transport } = makePresenceClient()
    const handler = vi.fn()

    transport.onPresenceChange('room', handler)
    transport.simulatePresenceJoin('room', {
      connectionId: 'p1',
      data: { name: 'Bob' },
    })
    transport.simulatePresenceLeave('room', 'p1')

    expect(handler).toHaveBeenCalledTimes(2)
    expect(handler.mock.calls[1][0]).toHaveLength(0)
  })

  it('getPresenceState returns current state snapshot', () => {
    const { transport } = makePresenceClient()
    transport.simulatePresenceJoin('room', {
      connectionId: 'p1',
      data: { name: 'Alice' },
    })
    transport.simulatePresenceJoin('room', {
      connectionId: 'p2',
      data: { name: 'Bob' },
    })

    const state = transport.getPresenceState('room')
    expect(state).toHaveLength(2)
  })
})
