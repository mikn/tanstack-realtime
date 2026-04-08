import { CodeBlock } from '../../components/CodeBlock'
import { FrameworkTabs } from '../../components/FrameworkTabs'

export function GettingStarted() {
  return (
    <article className="doc-article">
      <h1>Getting Started</h1>
      <p className="doc-lead">
        Install the packages, wire up a TanStack Start handler, and turn any
        collection live in minutes.
      </p>

      <h2 id="how-it-works">Connection vs. fan-out</h2>
      <div className="doc-callout">
        <p>Every realtime system must solve two separate problems:</p>
        <ul>
          <li>
            <strong>Connection</strong> &mdash; how clients stay open and
            receive pushes
          </li>
          <li>
            <strong>Fan-out</strong> &mdash; how a publish on one server
            instance reaches clients connected to <em>other</em> instances
          </li>
        </ul>
        <p>
          <strong>SSE</strong> handles connection. For multi-instance
          deployments (Cloudflare Workers, serverless, multiple Nitro nodes),
          add a <code>PublishBackend</code> (e.g. Upstash Redis) so publishes
          route across instances. A single-instance deployment works without
          one.
        </p>
        <p>
          <strong>Centrifugo</strong> solves both in one service: clients
          connect directly to it, and it handles all fan-out natively. Your app
          just issues channel tokens and publishes via its HTTP API. See the{' '}
          <a href="#/docs/transports">Transports</a> guide.
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

      <div className="doc-callout">
        <p>
          <strong>Which transport?</strong> SSE is the default for most apps.
          Use Centrifugo when you need built-in fan-out across multiple server
          instances. See the{' '}
          <a href="#/docs/transports">Transport decision matrix</a> for a full
          comparison.
        </p>
      </div>

      <h2 id="server-setup">Server setup</h2>
      <p>
        Add a <code>createStartHandler</code> API route to your TanStack Start
        app. It manages SSE connections, authenticates users, and calls your{' '}
        <code>authorize</code> function before accepting subscriptions or
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

// For multi-instance fan-out, pass a PublishBackend in the config above:
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
        The fastest path to live data: wrap your server function with{' '}
        <code>realtime.query()</code> and call <code>useQuery()</code> on the
        client. Channels are derived automatically from the SQL WHERE clause
        &mdash; no manual wiring required.
      </p>
      <CodeBlock
        title="app/server/todos.ts"
        code={`import { realtime } from './realtime'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { todos } from '../../db/schema'

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
  const { data, isPending } = useQuery(getTodos, { teamId })
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
      <ul>{data?.map(t => <li key={t.id}>{t.title}</li>)}</ul>
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
  const { data, isPending } = createQuery(getTodos, () => ({ teamId: props.teamId }))
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
const { data, isPending } = useQuery(getTodos, { teamId: props.teamId })
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
        Multiple components using the same{' '}
        <code>(getTodos, {'{ teamId }'})</code> share one fetch, one SSE
        subscription, and one cache. Optimistic updates propagate instantly; the
        server confirms via a batched SSE message.
      </p>

      <h2 id="first-collection">Alternative: REST-based live collections</h2>
      <p>
        If you don&rsquo;t use server functions or Drizzle, connect your
        existing REST endpoints with <code>useRealtimeCollection</code>:
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

      <h2 id="next-steps">Next steps</h2>
      <ul>
        <li>
          <a href="#/docs/reactive-queries">Reactive Queries</a> &mdash; full
          guide to <code>useQuery</code>, <code>useMutation</code>,{' '}
          <code>usePaginatedQuery</code>, optimistic updates, and batched
          consistency
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
