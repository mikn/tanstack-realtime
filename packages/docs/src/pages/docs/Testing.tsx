import { CodeBlock } from '../../components/CodeBlock'

export function Testing() {
  return (
    <article className="doc-article">
      <h1>Testing</h1>
      <p className="doc-lead">
        realtime.js ships its testing utilities in the box. Use{' '}
        <code>createMockTransport</code> and{' '}
        <code>createMockPresenceTransport</code> from{' '}
        <code>@realtimejs/core</code> to drive subscriptions, publishes, and
        connection state synchronously &mdash; no server, socket, or fake timers
        required.
      </p>

      <div className="doc-callout">
        <p>These are the same mocks the library uses internally:</p>
        <ul>
          <li>
            <code>createMockTransport()</code> &mdash; a full{' '}
            <code>RealtimeTransport</code> with <code>simulateMessage</code>,{' '}
            <code>simulateDisconnect</code>/<code>simulateReconnect</code>,{' '}
            <code>simulateSubscribeError</code>, and a <code>publishLog</code>.
          </li>
          <li>
            <code>createMockPresenceTransport()</code> &mdash; everything above,
            plus <code>simulatePresenceJoin</code>,{' '}
            <code>simulatePresenceLeave</code>, and{' '}
            <code>getPresenceState</code>.
          </li>
          <li>
            <code>createTestRealtimeProvider()</code> /{' '}
            <code>createTestRealtimeProviderWithPresence()</code> from{' '}
            <code>@realtimejs/react</code> &mdash; a pre-wired{' '}
            <code>wrapper</code> for Testing Library&rsquo;s{' '}
            <code>renderHook</code>/<code>render</code>. (Solid and Vue ship the
            same factories.)
          </li>
        </ul>
      </div>

      <h2 id="mock-transport">The mock transport</h2>
      <p>
        <code>createMockTransport()</code> returns a transport that satisfies
        the full <code>RealtimeTransport</code> contract. It starts in{' '}
        <code>'connected'</code> state and models a real provider: a message
        only reaches a subscriber when the channel is currently subscribed{' '}
        <em>at the provider</em>, so a message emitted while disconnected is not
        delivered until the transport re-subscribes on reconnect.
      </p>
      <CodeBlock
        title="test/transport.test.ts"
        code={`import { describe, it, expect } from 'vitest'
import { createMockTransport } from '@realtimejs/core'

describe('mock transport', () => {
  it('delivers subscribed messages and records publishes', async () => {
    const transport = createMockTransport()
    await transport.connect()

    const received: unknown[] = []
    const unsub = transport.subscribe('tasks', (d) => received.push(d))

    // Push a server event synchronously
    transport.simulateMessage('tasks', { action: 'insert', data: { id: '1' } })
    expect(received).toHaveLength(1)

    // Outgoing publishes are recorded for assertions
    await transport.publish('tasks', { action: 'update', data: { id: '1' } })
    expect(transport.publishLog).toHaveLength(1)
    expect(transport.publishLog[0]).toMatchObject({ channel: 'tasks' })

    unsub()
    transport.disconnect()
  })
})`}
      />
      <p>
        Pass <code>initialStatus</code> to start disconnected, and{' '}
        <code>capabilities</code> to exercise capability-gated code paths (for
        example, declaring <code>{`{ serverAssistedRecovery: true }`}</code> to
        test a branch that only runs on recovery-capable transports):
      </p>
      <CodeBlock
        code={`const transport = createMockTransport({
  initialStatus: 'disconnected',
  capabilities: {
    presence: false,
    serverAssistedRecovery: true,
    history: false,
    ephemeral: true,
  },
})`}
      />

      <h2 id="testing-collection">Testing a collection hook</h2>
      <p>
        Collections are the core data primitive. To test one, build a mock
        transport, wire a client, and pass{' '}
        <code>realtimeCollectionOptions</code> to TanStack DB&rsquo;s{' '}
        <code>createCollection</code>. Then push a server event with{' '}
        <code>simulateMessage</code> and assert on the collection state.
      </p>
      <CodeBlock
        title="test/task-collection.test.ts"
        code={`import { describe, it, expect } from 'vitest'
import { createCollection } from '@tanstack/db'
import {
  createMockTransport,
  createRealtimeClient,
  realtimeCollectionOptions,
} from '@realtimejs/core'

interface Task {
  id: string
  title: string
}

describe('task collection', () => {
  it('applies a server insert', async () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    await client.connect()

    const tasks = createCollection(
      realtimeCollectionOptions<Task, string>({
        client,
        channel: 'tasks',
        getKey: (t) => t.id,
      }),
    )

    // Simulate the server broadcasting an insert
    transport.simulateMessage('tasks', {
      action: 'insert',
      data: { id: '1', title: 'Buy milk' },
    })

    expect(tasks.get('1')).toMatchObject({ title: 'Buy milk' })
  })
})`}
      />
      <p>
        The same pattern covers <code>update</code> and <code>delete</code>{' '}
        actions &mdash; emit the corresponding event and assert the collection
        reflects it.
      </p>

      <h2 id="testing-react">Testing a React hook</h2>
      <p>
        Hooks that read realtime data need a <code>RealtimeProvider</code> in
        the tree. <code>createTestRealtimeProvider()</code> from{' '}
        <code>@realtimejs/react</code> returns a <code>wrapper</code>, the{' '}
        <code>transport</code>, and the <code>client</code> in one call. The
        provider mounts with <code>autoConnect=false</code> and the transport
        starts <code>'connected'</code>, so your test controls the connection
        lifecycle explicitly.
      </p>
      <CodeBlock
        title="test/use-subscribe.test.tsx"
        code={`import { it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  createTestRealtimeProvider,
  useSubscribe,
  usePublish,
} from '@realtimejs/react'

it('receives messages', () => {
  const { wrapper, transport } = createTestRealtimeProvider()
  const messages: unknown[] = []

  renderHook(() => useSubscribe('chat', (d) => messages.push(d)), { wrapper })

  act(() => transport.simulateMessage('chat', { hello: 'world' }))
  expect(messages).toHaveLength(1)
})

it('records optimistic publishes', async () => {
  const { wrapper, transport } = createTestRealtimeProvider()
  const { result } = renderHook(() => usePublish('votes'), { wrapper })

  await act(() => result.current({ delta: 1 }))
  expect(transport.publishLog).toContainEqual(
    expect.objectContaining({ channel: 'votes' }),
  )
})`}
      />
      <p>
        Pass your own <code>transport</code> or <code>client</code> to override
        the defaults &mdash; useful for sharing one mock across several{' '}
        <code>renderHook</code> calls or for injecting custom capabilities.
      </p>

      <h2 id="testing-presence">Testing presence</h2>
      <p>
        For presence hooks (<code>usePresence</code>), use{' '}
        <code>createMockPresenceTransport()</code> or, in React,{' '}
        <code>createTestRealtimeProviderWithPresence()</code>. The presence mock
        adds <code>simulatePresenceJoin</code>,{' '}
        <code>simulatePresenceLeave</code>, and <code>getPresenceState</code>,
        and declares <code>presence: true</code> in its capabilities so{' '}
        <code>usePresence</code> does not throw.
      </p>
      <CodeBlock
        title="test/use-presence.test.tsx"
        code={`import { it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  createTestRealtimeProviderWithPresence,
  usePresence,
} from '@realtimejs/react'
import { roomPresence } from '../app/presence'

it('reports remote members and your own state', () => {
  const { wrapper, transport } = createTestRealtimeProviderWithPresence()

  const { result } = renderHook(
    () =>
      usePresence(roomPresence, {
        params: { roomId: 'r1' },
        initial: { name: 'Alice' },
      }),
    { wrapper },
  )

  act(() => {
    transport.simulatePresenceJoin('room:roomId=r1', {
      connectionId: 'peer-1',
      data: { name: 'Bob' },
    })
  })

  expect(result.current.others).toHaveLength(1)
  expect((result.current.others[0].data as { name: string }).name).toBe('Bob')
  expect(result.current.self.name).toBe('Alice')

  act(() => transport.simulatePresenceLeave('room:roomId=r1', 'peer-1'))
  expect(result.current.others).toHaveLength(0)
})`}
      />

      <h2 id="connection-states">Simulating connection states</h2>
      <p>
        Drive disconnect/reconnect with the dedicated helpers rather than poking
        the store directly &mdash; they faithfully model the provider dropping
        and re-establishing subscriptions, so your retry logic and offline
        banners are tested against real transport semantics.
      </p>
      <CodeBlock
        title="test/connection.test.ts"
        code={`import { it, expect } from 'vitest'
import { createMockTransport } from '@realtimejs/core'

it('suspends and resumes delivery across a reconnect', async () => {
  const transport = createMockTransport()
  await transport.connect()

  const received: unknown[] = []
  transport.subscribe('chat', (d) => received.push(d))

  transport.simulateMessage('chat', 'before')
  expect(received).toEqual(['before'])

  // While disconnected the provider drops the subscription — nothing delivered
  transport.simulateDisconnect() // store → 'reconnecting'
  transport.simulateMessage('chat', 'while-down')
  expect(received).toEqual(['before'])

  // On reconnect the transport re-subscribes and delivery resumes
  transport.simulateReconnect() // store → 'connected'
  transport.simulateMessage('chat', 'after')
  expect(received).toEqual(['before', 'after'])
})`}
      />
      <p>
        The transport&rsquo;s <code>store</code> (a <code>@tanstack/store</code>{' '}
        <code>Store&lt;ConnectionStatus&gt;</code>) is observable too &mdash;
        subscribe to it to assert your UI reflects <code>'connecting'</code>,{' '}
        <code>'reconnecting'</code>, and <code>'disconnected'</code> states.
      </p>

      <h2 id="optimistic-updates">Testing optimistic rollback</h2>
      <p>
        An optimistic mutation applies locally and is published immediately; the
        collection keeps the optimistic value until the server confirms (echo)
        or the mutation rejects (rollback). In a test you control both sides:{' '}
        <code>publishLog</code> proves what was sent, and{' '}
        <code>simulateMessage</code> lets you confirm the echo &mdash; or you
        let the mutation reject and assert the collection reverts.
      </p>
      <CodeBlock
        title="test/optimistic.test.ts"
        code={`import { it, expect } from 'vitest'
import { createCollection } from '@tanstack/db'
import {
  createMockTransport,
  createRealtimeClient,
  realtimeCollectionOptions,
} from '@realtimejs/core'

interface Task { id: string; title: string }

it('rolls back when the mutation fails', async () => {
  const transport = createMockTransport()
  const client = createRealtimeClient({ transport })
  await client.connect()

  const tasks = createCollection(
    realtimeCollectionOptions<Task, string>({
      client,
      channel: 'tasks',
      getKey: (t) => t.id,
      onUpdate: async () => {
        throw new Error('server rejected') // forces rollback
      },
    }),
  )

  transport.simulateMessage('tasks', {
    action: 'insert',
    data: { id: '1', title: 'original' },
  })

  // Optimistic update applies immediately…
  const tx = tasks.update('1', (draft) => {
    draft.title = 'edited'
  })
  expect(tasks.get('1')?.title).toBe('edited')

  // …then rolls back to the confirmed value when onUpdate throws
  await tx.isPersisted.promise.catch(() => {})
  expect(tasks.get('1')?.title).toBe('original')
})`}
      />

      <h2 id="conformance">Testing a custom transport adapter</h2>
      <p>
        Writing your own transport? Don&rsquo;t hand-roll its tests. The{' '}
        <code>@realtimejs/adapter-conformance</code> package exports{' '}
        <code>runAdapterConformance(harness)</code> &mdash; the exact battery
        every first-party adapter (and the in-repo mocks) passes. It proves your
        transport honors the <code>RealtimeTransport</code> contract (lifecycle,
        subscribe/deliver, channel isolation, unsubscribe, publish, and the{' '}
        <strong>reconnect re-subscribe</strong> guarantee) and that its declared{' '}
        <code>capabilities</code> match observable behavior.
      </p>
      <CodeBlock
        title="my-transport.conformance.test.ts"
        code={`import { runAdapterConformance } from '@realtimejs/adapter-conformance'
import { myTransport } from './my-transport'
import { createFakeProvider } from './fake-provider'

// Call it at the top level — it registers its own describe/it blocks.
runAdapterConformance({
  name: 'my-transport',
  createTransport: () => myTransport({ provider: createFakeProvider() }),
  capabilities: {
    presence: true,
    serverAssistedRecovery: false,
    history: false,
    ephemeral: true,
  },
  // Deliver ONLY to channels currently subscribed at the provider:
  emitMessage: (channel, data) => fakeProvider.deliver(channel, data),
  // Drop the provider-side subscription set:
  simulateDisconnect: () => fakeProvider.drop(),
  // Reconnect — the transport must re-subscribe its active channels:
  simulateReconnect: () => fakeProvider.reconnect(),
  // Optional, provider-specific:
  simulateSubscribeError: (ch, reason, code) => fakeProvider.reject(ch, reason, code),
  emitPresence: (ch, members) => fakeProvider.presence(ch, members),
})`}
      />
      <div className="doc-callout">
        <p>
          The presence sub-battery only runs when you declare{' '}
          <code>presence: true</code>, and the kit asserts that{' '}
          <code>hasPresence(transport)</code> agrees with the declared flag
          &mdash; no half-implemented presence. The{' '}
          <code>serverAssistedRecovery</code>, <code>history</code>, and{' '}
          <code>ephemeral</code> flags are verified for honesty/consistency but
          are declaration-only (the kit has no provider-side view to exercise
          them behaviorally). See the <a href="#/docs/transports">Transports</a>{' '}
          page&rsquo;s capability contract section for the full picture.
        </p>
      </div>

      <h2 id="see-also">See also</h2>
      <ul>
        <li>
          <a href="#/docs/transports">Transports</a> &mdash; the capability
          contract and how adapters declare what they support
        </li>
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
