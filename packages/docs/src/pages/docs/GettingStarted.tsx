import { CodeBlock } from '../../components/CodeBlock'
import { FrameworkTabs } from '../../components/FrameworkTabs'

export function GettingStarted() {
  return (
    <article className="doc-article">
      <h1>Getting Started</h1>
      <p className="doc-lead">
        Build a live todo list with optimistic mutations in five minutes.
        You&rsquo;ll write a server function, wrap it with one annotation, and
        see every subscriber update automatically.
      </p>

      <div className="doc-callout">
        <p>
          <strong>What you&rsquo;ll have at the end:</strong> a server function
          that queries your database, a client that stays in sync in real time,
          and instant optimistic mutations &mdash; the same reactive experience
          as fully managed platforms, on your own stack.
        </p>
      </div>

      <h2 id="installation">Installation</h2>
      <FrameworkTabs
        react={{
          code: `npm i @tanstack/realtime @tanstack/react-realtime \\
      @tanstack/realtime-preset-start @tanstack/realtime-adapter-sse`,
        }}
        solid={{
          code: `npm i @tanstack/realtime @tanstack/solid-realtime \\
      @tanstack/realtime-preset-start @tanstack/realtime-adapter-sse`,
        }}
        vue={{
          code: `npm i @tanstack/realtime @tanstack/vue-realtime \\
      @tanstack/realtime-preset-start @tanstack/realtime-adapter-sse`,
        }}
      />

      <h2 id="server-setup">Server setup</h2>
      <p>
        Create a realtime handler. This is the server-side entry point that
        manages SSE connections and coordinates live updates.
      </p>
      <CodeBlock
        title="app/server/realtime.ts"
        code={`import { createStartHandler } from '@tanstack/realtime-preset-start'

// Minimal setup — no auth required to get started
export const realtime = createStartHandler({})`}
      />
      <div className="doc-callout">
        <p>
          <strong>Adding auth later:</strong> pass <code>getUser</code> and{' '}
          <code>authorize</code> callbacks to lock down subscriptions and
          publishes. See the{' '}
          <a href="#/docs/authentication">Authentication guide</a> for the full
          pattern. For now, let&rsquo;s get data on screen first.
        </p>
      </div>
      <CodeBlock
        title="app/routes/api/realtime.ts"
        code={`import { createAPIFileRoute } from '@tanstack/start/api'
import { realtime } from '../../server/realtime'

export const Route = createAPIFileRoute('/api/realtime')({
  GET:     ({ request }) => realtime.handle(request),
  POST:    ({ request }) => realtime.handle(request),
  OPTIONS: ({ request }) => realtime.handle(request),
})`}
      />

      <h2 id="client-setup">Client setup</h2>
      <CodeBlock
        title="app/client/realtime.ts"
        code={`import { createRealtimeClient } from '@tanstack/realtime'
import { sseTransport } from '@tanstack/realtime-adapter-sse'

export const realtimeClient = createRealtimeClient({
  transport: sseTransport({ url: '/api/realtime' }),
})`}
      />
      <FrameworkTabs
        react={{
          title: 'app/root.tsx',
          code: `import { RealtimeProvider } from '@tanstack/react-realtime'
import { realtimeClient } from './client/realtime'

function App() {
  return (
    <RealtimeProvider client={realtimeClient}>
      <RouterProvider router={router} />
    </RealtimeProvider>
  )
}`,
        }}
        solid={{
          title: 'app/root.tsx',
          code: `import { RealtimeProvider } from '@tanstack/solid-realtime'
import { realtimeClient } from './client/realtime'

function App() {
  return (
    <RealtimeProvider client={realtimeClient}>
      <RouterProvider router={router} />
    </RealtimeProvider>
  )
}`,
        }}
        vue={{
          title: 'app/App.vue',
          code: `<script setup>
import { provideRealtimeClient } from '@tanstack/vue-realtime'
import { realtimeClient } from './client/realtime'

provideRealtimeClient(realtimeClient)
</script>

<template>
  <RouterView />
</template>`,
        }}
      />

      <div className="doc-callout">
        <p>
          <strong>Auto-connect:</strong> <code>RealtimeProvider</code> calls{' '}
          <code>client.connect()</code> automatically on mount and tears down on
          unmount. Pass{' '}
          <code>
            autoConnect={'{'}false{'}'}
          </code>{' '}
          to manage the connection lifecycle yourself.
        </p>
      </div>

      <h2 id="reactive-queries">Your first reactive query</h2>
      <p>
        Wrap your server function with <code>realtime.query()</code> and call{' '}
        <code>useQuery()</code> on the client. The channel is derived
        automatically from the query arguments &mdash; no manual wiring. Every
        component sharing the same <code>(serverFn, args)</code> pair shares one
        fetch, one connection, and one cache.
      </p>
      <CodeBlock
        title="app/server/todos.ts"
        code={`import { realtime } from './realtime'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { todos } from '../../db/schema'

// realtime.query() wraps your existing function — one annotation, data is now live
export const getTodos = realtime.query(
  async ({ teamId }: { teamId: string }) =>
    db.select().from(todos).where(eq(todos.teamId, teamId))
)

export const createTodo = realtime.mutation(
  async ({ teamId, title }: { teamId: string; title: string }) => {
    const [todo] = await db.insert(todos).values({ teamId, title, done: false }).returning()
    return todo
  }
)`}
      />
      <FrameworkTabs
        react={{
          title: 'app/features/todos/TodoList.tsx',
          code: `import { useQuery, useMutation } from '@tanstack/react-realtime'
import { getTodos, createTodo } from '../../server/todos'

function TodoList({ teamId }: { teamId: string }) {
  const { data, isPending } = useQuery(getTodos, { teamId }, {
    getKey: (t) => t.id,
  })
  const { mutate } = useMutation(createTodo, {
    optimistic: (cache, args) => {
      cache.update(getTodos, { teamId: args.teamId }, prev => [
        ...(prev ?? []),
        { id: crypto.randomUUID(), title: args.title, done: false },
      ])
    },
  })

  if (isPending) return <p>Loading…</p>
  return (
    <>
      <ul>{data.map(t => <li key={t.id}>{t.title}</li>)}</ul>
      <button onClick={() => mutate({ teamId, title: 'New' })}>Add</button>
    </>
  )
}`,
        }}
        solid={{
          title: 'app/features/todos/TodoList.tsx',
          code: `import { createQuery, createMutation } from '@tanstack/solid-realtime'
import { getTodos, createTodo } from '../../server/todos'

function TodoList(props: { teamId: string }) {
  const { data, isPending } = createQuery(getTodos, () => ({ teamId: props.teamId }), {
    getKey: (t) => t.id,
  })
  const { mutate } = createMutation(createTodo, {
    optimistic: (cache, args) => {
      cache.update(getTodos, { teamId: args.teamId }, prev => [
        ...(prev ?? []),
        { id: crypto.randomUUID(), title: args.title, done: false },
      ])
    },
  })

  return (
    <Show when={!isPending()} fallback={<p>Loading…</p>}>
      <ul><For each={data()}>{t => <li>{t.title}</li>}</For></ul>
      <button onClick={() => mutate({ teamId: props.teamId, title: 'New' })}>Add</button>
    </Show>
  )
}`,
        }}
        vue={{
          title: 'app/features/todos/TodoList.vue',
          code: `<script setup lang="ts">
import { useQuery, useMutation } from '@tanstack/vue-realtime'
import { getTodos, createTodo } from '../../server/todos'

const props = defineProps<{ teamId: string }>()
const { data, isPending } = useQuery(getTodos, { teamId: props.teamId }, {
  getKey: (t) => t.id,
})
const { mutate } = useMutation(createTodo, {
  optimistic: (cache, args) => {
    cache.update(getTodos, { teamId: args.teamId }, prev => [
      ...(prev ?? []),
      { id: crypto.randomUUID(), title: args.title, done: false },
    ])
  },
})
</script>

<template>
  <p v-if="isPending">Loading…</p>
  <template v-else>
    <ul><li v-for="t in data" :key="t.id">{{ t.title }}</li></ul>
    <button @click="mutate({ teamId: props.teamId, title: 'New' })">Add</button>
  </template>
</template>`,
        }}
      />
      <p>
        The returned <code>collection</code> is a live{' '}
        <a href="https://tanstack.com/db" target="_blank" rel="noopener">
          TanStack DB Collection
        </a>
        . Pass it to <code>useLiveQuery</code> for client-side filtering and
        sorting without additional server requests:
      </p>
      <CodeBlock
        code={`import { useLiveQuery } from '@tanstack/react-db'

const { data, collection } = useQuery(getTodos, { teamId }, { getKey: (t) => t.id })

// Filter entirely on the client — no extra fetch
const { data: active } = useLiveQuery(
  (q) => q.from({ todos: collection }).where('done', '=', false),
  [collection],
)`}
      />

      <h2 id="first-collection">Alternative: REST-based live collections</h2>
      <p>
        Not using TanStack Start or Drizzle? Connect any existing REST API with{' '}
        <code>useRealtimeCollection</code>:
      </p>
      <CodeBlock
        code={`import { useRealtimeCollection } from '@tanstack/react-realtime'
import { useLiveQuery } from '@tanstack/react-db'

function TodoList() {
  const todos = useRealtimeCollection<Todo>({
    url: '/api/todos',
    getKey: (t) => t.id,
  })
  const { data } = useLiveQuery((q) => q.from({ todos }))
  return <ul>{data.map(t => <li key={t.id}>{t.title}</li>)}</ul>
}`}
      />

      <div className="doc-callout" id="how-it-works">
        <p>
          <strong>How it works &mdash; connection vs. fan-out.</strong> Every
          realtime system solves two problems: <em>connection</em> (how clients
          stay open and receive pushes) and <em>fan-out</em> (how a publish on
          one server instance reaches clients on other instances). SSE handles
          connection. For multi-instance deployments add a{' '}
          <code>PublishBackend</code> like Upstash Redis. A single-instance
          deployment works without one. Centrifugo solves both: clients connect
          directly to it and it handles all fan-out natively. See the{' '}
          <a href="#/docs/transports">Transports guide</a> for a full
          comparison.
        </p>
      </div>

      <h2 id="what-just-happened">What just happened</h2>
      <p>In roughly 30 lines of code across server and client, you now have:</p>
      <ul>
        <li>
          <strong>Live queries</strong> &mdash; every component calling{' '}
          <code>
            useQuery(getTodos, {'{'} teamId {'}'})
          </code>{' '}
          with the same args shares one connection and one cache. When any
          client mutates, all subscribers see the update instantly.
        </li>
        <li>
          <strong>Optimistic mutations</strong> &mdash; the UI updates before
          the server responds and rolls back automatically on error.
        </li>
        <li>
          <strong>Automatic channels</strong> &mdash; channels are derived from
          query arguments. No manual wiring, no channel strings to keep in sync.
        </li>
        <li>
          <strong>Client-side queries</strong> &mdash; the returned{' '}
          <code>collection</code> works with <code>useLiveQuery</code> for
          filtering and sorting without extra server requests.
        </li>
      </ul>
      <p>
        This is the same reactive developer experience you get from fully
        managed platforms &mdash; live queries, optimistic mutations, automatic
        cache invalidation &mdash; running on your database, your ORM, your
        server.
      </p>

      <h2 id="next-steps">Next steps</h2>
      <p>
        You have a working reactive app. Here&rsquo;s where to go depending on
        what you&rsquo;re building:
      </p>
      <table className="api-table">
        <thead>
          <tr>
            <th>I want to&hellip;</th>
            <th>Read this</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Understand reactive queries deeply (batching, consistency,
              pagination)
            </td>
            <td>
              <a href="#/docs/reactive-queries">Reactive Queries</a>
            </td>
          </tr>
          <tr>
            <td>Show who&rsquo;s online, share cursors</td>
            <td>
              <a href="#/docs/presence">Presence</a>
            </td>
          </tr>
          <tr>
            <td>Build a chat or activity feed</td>
            <td>
              <a href="#/docs/channels">Channels &amp; Pub/Sub</a>
            </td>
          </tr>
          <tr>
            <td>Handle concurrent edits without conflicts</td>
            <td>
              <a href="#/docs/crdts">CRDTs</a>
            </td>
          </tr>
          <tr>
            <td>Stream AI tokens to the client</td>
            <td>
              <a href="#/docs/streaming">Streaming</a>
            </td>
          </tr>
          <tr>
            <td>Add authentication and per-channel authorization</td>
            <td>
              <a href="#/docs/authentication">Authentication</a>
            </td>
          </tr>
          <tr>
            <td>Choose the right pattern for my use case</td>
            <td>
              <a href="#/docs/choosing-a-pattern">Choosing a Pattern</a>
            </td>
          </tr>
          <tr>
            <td>Prepare for multi-instance production deployment</td>
            <td>
              <a href="#/docs/scaling">Scaling to Production</a>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  )
}
