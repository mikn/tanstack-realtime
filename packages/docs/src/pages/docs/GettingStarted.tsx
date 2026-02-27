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
      <CodeBlock code={`npm i @tanstack/realtime @tanstack/react-realtime`} />
      <p>
        For the built-in WebSocket server, also install the Node.js preset:
      </p>
      <CodeBlock code={`npm i @tanstack/realtime-preset-node`} />

      <h2 id="server-setup">Server setup</h2>
      <p>
        Create a WebSocket server that authenticates connections and authorizes
        channel access. Attach it to any Node.js HTTP server.
      </p>
      <CodeBlock
        title="server/realtime.ts"
        code={`import { createServer } from 'node:http'
import { createNodeServer } from '@tanstack/realtime-preset-node'

export const nodeServer = createNodeServer({
  getUser: (req) => {
    const token = req.headers.authorization
    return token ? verifyJwt(token) : null
  },
  authorize: async (userId, channel) => ({
    subscribe: true,
    publish: true,
    presence: true,
  }),
})

const httpServer = createServer()
nodeServer.attach(httpServer)
httpServer.listen(3001)`}
      />

      <h2 id="client-setup">Client setup</h2>
      <p>
        Create a client with a transport and wrap your app with{' '}
        <code>RealtimeProvider</code>.
      </p>
      <CodeBlock
        title="app/client.ts"
        code={`import { createRealtimeClient, wsTransport } from '@tanstack/realtime'

export const realtimeClient = createRealtimeClient({
  transport: wsTransport({ url: 'ws://localhost:3001' }),
})`}
      />
      <CodeBlock
        title="app/main.tsx"
        code={`import { RealtimeProvider } from '@tanstack/react-realtime'
import { realtimeClient } from './client'

function App() {
  return (
    <RealtimeProvider client={realtimeClient}>
      <YourApp />
    </RealtimeProvider>
  )
}`}
      />

      <h2 id="first-collection">Your first live collection</h2>
      <p>
        Use <code>withRest</code> to wire a standard REST endpoint into a
        realtime collection. The server routes stay plain CRUD &mdash; no
        publish logic required.
      </p>
      <CodeBlock
        title="features/todos/collection.ts"
        code={`import { realtimeCollectionOptions, withRest } from '@tanstack/realtime'
import { realtimeClient } from '../../app/client'

export const todosOptions = realtimeCollectionOptions({
  ...withRest({ url: '/api/todos', getKey: (t: Todo) => t.id }),
  client: realtimeClient,
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
      {todos.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
// Every client updates the instant a todo changes.`}
      />

      <h2 id="next-steps">Next steps</h2>
      <ul>
        <li>
          <a href="#/docs/collections">Collections</a> &mdash; database
          integration, custom callbacks, server-initiated push
        </li>
        <li>
          <a href="#/docs/crdts">CRDTs</a> &mdash; conflict-free concurrent
          edits with LWW, PN-Counter, and OR-Set
        </li>
        <li>
          <a href="#/docs/channels">Channels &amp; Pub/Sub</a> &mdash; raw
          messaging, live event streams
        </li>
        <li>
          <a href="#/docs/transports">Transports</a> &mdash; swap WebSocket
          for SSE or Centrifugo
        </li>
      </ul>
    </article>
  )
}
