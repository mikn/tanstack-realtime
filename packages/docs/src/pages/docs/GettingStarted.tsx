import { CodeBlock } from '../../components/CodeBlock'
import { FrameworkTabs } from '../../components/FrameworkTabs'

export function GettingStarted() {
  return (
    <article className="doc-article">
      <h1>Getting Started</h1>
      <p className="doc-lead">
        In five minutes: a server function that keeps every subscribed component
        in sync, with optimistic mutations and automatic rollback.
      </p>

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
        Add a <code>createStartHandler</code> API route. It manages SSE
        connections, authenticates users, and enforces your{' '}
        <code>authorize</code> function before accepting any subscriptions or
        publishes.
      </p>
      <CodeBlock
        title="app/server/realtime.ts"
        code={`import { createStartHandler } from '@tanstack/realtime-preset-start'
import { getSession } from '../auth'

export const realtime = createStartHandler({
  getUser: async (req) => {
    const session = await getSession(req)
    return session ? { userId: session.userId } : null
  },
  authorize: async (userId) => ({
    subscribe: !!userId,
    publish:   !!userId,
    presence:  true,
  }),
})

// For multi-instance fan-out, add a PublishBackend:
// import { createUpstashBackend } from '@tanstack/realtime-backend-upstash'
// backend: createUpstashBackend({ url: env.UPSTASH_URL, token: env.UPSTASH_TOKEN }),`}
      />
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

      <h2 id="next-steps">Next steps</h2>
      <ul>
        <li>
          <a href="#/docs/reactive-queries">Reactive Queries</a> &mdash; full
          guide to <code>useQuery</code>, <code>useMutation</code>, optimistic
          updates, batched consistency, and client-side filtering
        </li>
        <li>
          <a href="#/docs/server-functions">Server Functions</a> &mdash;{' '}
          <code>realtime.query()</code> and <code>realtime.mutation()</code>{' '}
          with TanStack Start + Drizzle
        </li>
        <li>
          <a href="#/docs/collections">Collections</a> &mdash; custom callbacks,
          server push, conflict detection
        </li>
        <li>
          <a href="#/docs/crdts">CRDTs</a> &mdash; conflict-free concurrent
          edits with LWW, PN-Counter, and OR-Set
        </li>
        <li>
          <a href="#/docs/channels">Channels &amp; Pub/Sub</a> &mdash; live
          feeds, validated publishing, append-only channels
        </li>
        <li>
          <a href="#/docs/presence">Presence</a> &mdash; live cursors, online
          user lists, typing indicators
        </li>
        <li>
          <a href="#/docs/transports">Transports</a> &mdash; SSE, Centrifugo,
          offline queue, multi-tab coordination
        </li>
      </ul>
    </article>
  )
}
