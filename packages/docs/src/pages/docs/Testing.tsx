import { CodeBlock } from '../../components/CodeBlock'

export function Testing() {
  return (
    <article className="doc-article">
      <h1>Testing</h1>
      <p className="doc-lead">
        Test your realtime features with a mock transport. No server or
        WebSocket connection required.
      </p>

      <h2 id="mock-transport">Create a mock transport</h2>
      <p>
        The simplest way to test realtime code is to build a mock that satisfies
        the <code>RealtimeTransport</code> interface. The mock stores listeners
        in memory and lets you fire events synchronously from your test code.
      </p>
      <CodeBlock
        title="test/mock-transport.ts"
        code={`import { Store } from '@tanstack/store'
import type { RealtimeTransport, ConnectionStatus } from '@realtimejs/core'

function createMockTransport(): RealtimeTransport & {
  simulateMessage: (channel: string, data: unknown) => void
  publishLog: Array<{ channel: string; data: unknown }>
} {
  const listeners = new Map<string, Set<(data: unknown) => void>>()
  const store = new Store<ConnectionStatus>('connected')
  const publishLog: Array<{ channel: string; data: unknown }> = []

  return {
    store,
    publishLog,
    async connect() {},
    disconnect() {},
    subscribe(channel, onMessage) {
      if (!listeners.has(channel)) listeners.set(channel, new Set())
      listeners.get(channel)!.add(onMessage)
      return () => { listeners.get(channel)?.delete(onMessage) }
    },
    async publish(channel, data) {
      publishLog.push({ channel, data })
    },
    simulateMessage(channel, data) {
      const cbs = listeners.get(channel)
      if (cbs) for (const cb of cbs) cb(data)
    },
  }
}`}
      />
      <p>
        Two helpers make assertions easy: <code>simulateMessage()</code>{' '}
        triggers events synchronously so your test can assert on the result
        immediately, and <code>publishLog</code> records every outgoing publish
        so you can verify what the client sent without a real server.
      </p>

      <h2 id="presence-mock">Add presence support</h2>
      <p>
        If your feature uses presence (who is online, cursor positions, typing
        indicators), extend the base mock with the <code>PresenceCapable</code>{' '}
        interface. The <code>triggerPresence()</code> helper lets you simulate
        presence updates from other users.
      </p>
      <CodeBlock
        title="test/mock-transport-presence.ts"
        code={`import type { PresenceCapable, PresenceUser } from '@realtimejs/core'

function createMockTransportWithPresence(): RealtimeTransport & PresenceCapable & {
  simulateMessage: (channel: string, data: unknown) => void
  triggerPresence: (channel: string, users: ReadonlyArray<PresenceUser>) => void
  publishLog: Array<{ channel: string; data: unknown }>
} {
  const base = createMockTransport()
  const presenceListeners = new Map<string, Set<(users: ReadonlyArray<PresenceUser>) => void>>()

  return {
    ...base,
    joinPresence: () => {},
    updatePresence: () => {},
    leavePresence: () => {},
    onPresenceChange(channel, cb) {
      if (!presenceListeners.has(channel)) presenceListeners.set(channel, new Set())
      presenceListeners.get(channel)!.add(cb)
      return () => { presenceListeners.get(channel)?.delete(cb) }
    },
    triggerPresence(channel, users) {
      const cbs = presenceListeners.get(channel)
      if (cbs) for (const cb of cbs) cb(users)
    },
  }
}`}
      />

      <h2 id="testing-collection">Testing a collection</h2>
      <p>
        Collections are the core data primitive in TanStack Realtime. To test
        one, create a mock transport, wire up a client, and drive the sync
        handler manually. This example uses Vitest to verify that a server-side
        insert event is received correctly.
      </p>
      <CodeBlock
        title="test/task-collection.test.ts"
        code={`import { describe, it, expect } from 'vitest'
import { createRealtimeClient, realtimeCollectionOptions } from '@realtimejs/core'

describe('task collection', () => {
  it('receives server inserts', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions({
      client,
      channel: 'tasks',
      getKey: (t: { id: string }) => t.id,
    })

    // Drive the sync manually
    const ops: Array<{ type: string; value?: unknown }> = []
    config.sync.sync({
      collection: null as any,
      begin: () => {},
      write: (op) => ops.push(op),
      commit: () => {},
      markReady: () => {},
      truncate: () => {},
    })

    // Simulate a server event
    transport.simulateMessage('tasks', {
      action: 'insert',
      data: { id: '1', title: 'Buy milk' },
    })

    expect(ops).toContainEqual(
      expect.objectContaining({ type: 'insert' })
    )
  })
})`}
      />
      <p>
        The same pattern works for <code>update</code> and <code>delete</code>{' '}
        actions. Emit the corresponding event and assert that the sync handler
        received the expected operation type.
      </p>

      <h2 id="testing-react">Testing React hooks</h2>
      <p>
        React hooks that consume realtime data need a{' '}
        <code>RealtimeProvider</code> in the component tree. Use{' '}
        <code>createTestRealtimeProvider</code> from{' '}
        <code>@realtimejs/react</code> to get a pre-wired wrapper, transport,
        and client in one call:
      </p>
      <CodeBlock
        title="test/my-hook.test.tsx"
        code={`import { renderHook } from '@testing-library/react'
import { createTestRealtimeProvider, useSubscribe } from '@realtimejs/react'

it('receives messages', () => {
  const { wrapper, transport } = createTestRealtimeProvider()
  const messages: unknown[] = []
  renderHook(() => useSubscribe('ch', (d) => messages.push(d)), { wrapper })

  transport.simulateMessage('ch', { hello: 'world' })
  expect(messages).toHaveLength(1)
})`}
      />
      <p>
        The returned <code>transport</code> is a full <code>MockTransport</code>{' '}
        &mdash; call <code>transport.simulateMessage()</code> to push server
        events and inspect <code>transport.publishLog</code> for outgoing
        messages. Pass your own <code>transport</code> or <code>client</code> to
        customize.
      </p>

      <h2 id="testing-presence">Testing presence</h2>
      <p>
        With the presence-capable mock from earlier, you can simulate other
        users joining and leaving a channel. Call <code>triggerPresence()</code>{' '}
        with the list of currently present users and assert that your component
        or callback updates accordingly.
      </p>
      <CodeBlock
        title="test/presence.test.ts"
        code={`it('updates when a user joins', () => {
  const transport = createMockTransportWithPresence()
  const client = createRealtimeClient({ transport })

  const users: Array<ReadonlyArray<PresenceUser>> = []
  transport.onPresenceChange('room:1', (list) => {
    users.push(list)
  })

  // Simulate two users joining
  transport.triggerPresence('room:1', [
    { connectionId: 'alice', data: { cursor: { x: 10, y: 20 } } },
    { connectionId: 'bob', data: { cursor: { x: 50, y: 60 } } },
  ])

  expect(users[0]).toHaveLength(2)
  expect(users[0]![0]!.connectionId).toBe('alice')
})

it('updates when a user leaves', () => {
  const transport = createMockTransportWithPresence()
  const client = createRealtimeClient({ transport })

  const users: Array<ReadonlyArray<PresenceUser>> = []
  transport.onPresenceChange('room:1', (list) => {
    users.push(list)
  })

  // First: two users present
  transport.triggerPresence('room:1', [
    { connectionId: 'alice', data: {} },
    { connectionId: 'bob', data: {} },
  ])

  // Then: bob leaves
  transport.triggerPresence('room:1', [
    { connectionId: 'alice', data: {} },
  ])

  expect(users[1]).toHaveLength(1)
})`}
      />

      <h2 id="connection-states">Simulating connection states</h2>
      <p>
        The mock transport exposes a <code>store</code> powered by{' '}
        <code>@tanstack/store</code>. Change its value to simulate
        disconnect/reconnect scenarios and verify that your UI responds
        correctly.
      </p>
      <CodeBlock
        title="test/connection.test.ts"
        code={`it('shows reconnecting state', () => {
  const transport = createMockTransport()
  const client = createRealtimeClient({ transport })

  // Simulate a connection drop
  transport.store.setState(() => 'reconnecting')
  // ... assert UI shows reconnecting indicator ...

  // Simulate recovery
  transport.store.setState(() => 'connected')
  // ... assert UI returns to normal ...
})

it('shows disconnected state', () => {
  const transport = createMockTransport()

  transport.store.setState(() => 'disconnected')
  // ... assert UI shows offline banner ...
})`}
      />
      <p>
        This is especially useful for testing retry logic, offline banners, and
        optimistic-update rollback behavior without actually dropping a network
        connection.
      </p>

      <h2 id="optimistic-updates">Testing optimistic updates</h2>
      <p>
        When a client publishes an optimistic update, the collection applies it
        immediately and waits for the server echo to confirm it. In tests, you
        control both sides: call the mutation to apply the optimistic update,
        then call <code>transport.simulateMessage()</code> to simulate the
        server echo. Because <code>publishLog</code> records every outgoing
        publish, you can assert that the client sent the correct payload and
        that the echo was properly deduplicated (the collection should not apply
        the same change twice).
      </p>
      <CodeBlock
        title="test/optimistic.test.ts"
        code={`// 1. Apply optimistic update via client
// 2. Check publishLog for the outgoing message
expect(transport.publishLog).toHaveLength(1)
expect(transport.publishLog[0]).toMatchObject({
  channel: 'tasks',
  data: expect.objectContaining({ action: 'update' }),
})

// 3. Echo the same event back from the "server"
transport.simulateMessage('tasks', transport.publishLog[0]!.data)

// 4. Assert the collection did not duplicate the update`}
      />

      <div className="doc-callout">
        <p>
          These patterns are the same ones used internally by TanStack
          Realtime's own test suite (30+ test files). If it works for the
          library itself, it will work for your application.
        </p>
      </div>

      <h2 id="see-also">See also</h2>
      <ul>
        <li>
          <a href="#/docs/error-reference">Error Reference</a> &mdash; every
          error code the library can throw, with causes and fixes
        </li>
        <li>
          <a href="#/docs/api-reference">API Reference</a> &mdash; full API
          surface for transports, clients, collections, and hooks
        </li>
      </ul>
    </article>
  )
}
