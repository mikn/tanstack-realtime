import { CodeBlock } from '../../components/CodeBlock'

export function GettingStarted() {
  return (
    <article className="doc-article">
      <h1>Getting Started</h1>
      <p className="doc-lead">
        Install the packages, connect to a realtime server, and turn any
        collection live in under five minutes.
      </p>

      <h2 id="installation">Installation</h2>
      <CodeBlock code={`npm i @tanstack/realtime @tanstack/react-realtime`} />
      <p>
        For the server-side handler, install the Node.js preset (Express,
        Fastify, Hono, or any Node.js framework):
      </p>
      <CodeBlock code={`npm i @tanstack/realtime-preset-node`} />

      <h2 id="server-setup">Server setup</h2>
      <p>
        Create a realtime server with <code>createNodeServer</code> and mount it
        alongside your existing app. It handles WebSocket upgrade, auth, and
        broadcasting — your REST routes stay unchanged.
      </p>
      <CodeBlock
        title="server/realtime.ts"
        code={`import { createNodeServer } from '@tanstack/realtime-preset-node'
import { getSession } from './auth'

export const nodeServer = createNodeServer({
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

// Mount on your HTTP server (Express example)
// app.use('/ws', nodeServer.upgrade)`}
      />

      <h2 id="client-setup">Client setup</h2>
      <p>
        Create a client with <code>wsTransport</code> and wrap your app with{' '}
        <code>RealtimeProvider</code>.
      </p>
      <CodeBlock
        title="client/realtime.ts"
        code={`import { createRealtimeClient, wsTransport } from '@tanstack/realtime'

export const realtimeClient = createRealtimeClient({
  transport: wsTransport({ url: 'wss://your-server.com/ws' }),
})`}
      />
      <CodeBlock
        title="App.tsx"
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
        Use <code>withRest</code> to connect your existing REST endpoints to a
        realtime collection. The library broadcasts each mutation to the channel
        automatically — no changes to your server routes required.
      </p>
      <CodeBlock
        title="features/todos/collection.ts"
        code={`import { realtimeCollectionOptions, withRest } from '@tanstack/realtime'
import { realtimeClient } from '../../client/realtime'

export const todosOptions = realtimeCollectionOptions({
  ...withRest<Todo, string>({
    url: '/api/todos',
    getKey: (t) => t.id,
  }),
  client:  realtimeClient,
  channel: ['todos'],
})`}
      />
      <CodeBlock
        title="features/todos/TodoList.tsx"
        code={`import { useCollection } from '@tanstack/react-db'
import { todosOptions } from './collection'

function TodoList() {
  const todos = useCollection(todosOptions)
  return (
    <ul>
      {todos.map((t) => (
        <li key={t.id}>{t.title}</li>
      ))}
    </ul>
  )
}`}
      />

      <h2 id="next-steps">Next steps</h2>
      <ul>
        <li>
          <a href="#/docs/collections">Collections</a> &mdash; custom callbacks,
          server push, conflict detection, optimistic updates
        </li>
        <li>
          <a href="#/docs/crdts">CRDTs</a> &mdash; conflict-free concurrent
          edits with LWW, PN-Counter, and OR-Set
        </li>
        <li>
          <a href="#/docs/transports">Transports</a> &mdash; SSE, Centrifugo,
          offline queue, multi-tab coordination
        </li>
        <li>
          <a href="#/docs/server-functions">TanStack Start + Drizzle</a> &mdash;
          full-stack guide: server functions as collection callbacks, server
          authority, and conflict handling end-to-end
        </li>
      </ul>
    </article>
  )
}
