import { CodeBlock } from '../../components/CodeBlock'

export function GettingStarted() {
  return (
    <article className="doc-article">
      <h1>Getting Started</h1>
      <p className="doc-lead">
        Install the packages, set up a server and client, and create your first
        live collection in under five minutes.
      </p>

      <h2 id="installation">Installation</h2>
      <CodeBlock
        code={`npm i @tanstack/realtime @tanstack/react-realtime @tanstack/realtime-preset-start @tanstack/realtime-adapter-sse`}
      />

      <h2 id="server-setup">Server setup</h2>
      <p>
        Create an SSE handler with <code>createStartHandler</code> and mount it
        on a TanStack Start API route.
      </p>
      <CodeBlock
        title="app/server/realtime.ts"
        code={`import { createStartHandler } from '@tanstack/realtime-preset-start'
import { getSession } from './auth'

export const realtime = createStartHandler({
  getUser: async (req) => {
    const session = await getSession(req)
    return session ? { userId: session.userId } : null
  },
  authorize: async (userId) => ({
    subscribe: !!userId,
    publish: !!userId,
    presence: true,
  }),
})

export const realtimePublish = realtime.publish`}
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
      <p>
        Create a client with <code>sseTransport</code> and wrap your app with{' '}
        <code>RealtimeProvider</code>.
      </p>
      <CodeBlock
        title="app/client/realtime.ts"
        code={`import { createRealtimeClient } from '@tanstack/realtime'
import { sseTransport } from '@tanstack/realtime-adapter-sse'

export const realtimeClient = createRealtimeClient({
  transport: sseTransport({ url: '/api/realtime' }),
})`}
      />
      <CodeBlock
        title="app/root.tsx"
        code={`import { RealtimeProvider } from '@tanstack/react-realtime'
import { realtimeClient } from './client/realtime'

function App() {
  return (
    <RealtimeProvider client={realtimeClient}>
      <RouterProvider router={router} />
    </RealtimeProvider>
  )
}`}
      />

      <h2 id="first-collection">Your first live collection</h2>
      <p>
        Use <code>withServerFns</code> to wire TanStack Start server functions
        into a realtime collection. The server functions handle persistence; the
        library handles broadcast.
      </p>
      <CodeBlock
        title="app/server/todos.ts"
        code={`import { createServerFn } from '@tanstack/start'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { todos } from '../../db/schema'

export const fetchTodos = createServerFn()
  .handler(() => db.select().from(todos))

export const createTodo = createServerFn({ method: 'POST' })
  .handler(({ data }) => db.insert(todos).values(data).returning().then((r) => r[0]))

export const updateTodo = createServerFn({ method: 'POST' })
  .handler(({ data }) =>
    db.update(todos).set(data).where(eq(todos.id, data.id)).returning().then((r) => r[0])
  )

export const deleteTodo = createServerFn({ method: 'POST' })
  .handler(({ data }) => db.delete(todos).where(eq(todos.id, data.id)))`}
      />
      <CodeBlock
        title="app/features/todos/collection.ts"
        code={`import { realtimeCollectionOptions, withServerFns } from '@tanstack/realtime'
import { realtimeClient } from '../../client/realtime'
import { fetchTodos, createTodo, updateTodo, deleteTodo } from '../../server/todos'

export const todosOptions = realtimeCollectionOptions({
  ...withServerFns({
    query:  () => fetchTodos(),
    insert: createTodo,
    update: updateTodo,
    delete: deleteTodo,
  }),
  client:  realtimeClient,
  channel: ['todos'],
})`}
      />

      <h2 id="next-steps">Next steps</h2>
      <ul>
        <li>
          <a href="#/docs/server-functions">TanStack Start + Drizzle</a> &mdash;
          full end-to-end walkthrough with auth, schema, and conflict handling
        </li>
        <li>
          <a href="#/docs/collections">Collections</a> &mdash; custom callbacks,
          server-authoritative mode, conflict detection
        </li>
        <li>
          <a href="#/docs/crdts">CRDTs</a> &mdash; conflict-free concurrent
          edits with LWW, PN-Counter, and OR-Set
        </li>
        <li>
          <a href="#/docs/transports">Transports</a> &mdash; swap SSE for
          WebSocket or Centrifugo
        </li>
      </ul>
    </article>
  )
}
