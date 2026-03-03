import { CodeBlock } from '../../components/CodeBlock'

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
      <CodeBlock
        code={`npm i @tanstack/realtime @tanstack/react-realtime \\
      @tanstack/realtime-preset-start @tanstack/realtime-adapter-sse`}
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
        title="app/routes/api/realtime.ts"
        code={`import { createStartHandler } from '@tanstack/realtime-preset-start'
import { getSession } from '../auth'

const realtime = createStartHandler({
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
// backend: createUpstashBackend({ url: env.UPSTASH_URL, token: env.UPSTASH_TOKEN }),

export const { GET } = realtime`}
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

      <div className="doc-callout">
        <p>
          <strong>Auto-connect:</strong> <code>RealtimeProvider</code> does not
          call <code>client.connect()</code> automatically. Call it once during
          app initialization (e.g. in your root layout or entry file):
        </p>
      </div>
      <CodeBlock
        title="app/entry-client.tsx"
        code={`// app/entry-client.tsx
import { realtimeClient } from './client/realtime'

realtimeClient.connect()`}
      />
      <p>
        If hooks detect a <code>disconnected</code> status for more than two
        seconds, a dev-mode console warning will suggest calling{' '}
        <code>client.connect()</code>.
      </p>

      <h2 id="first-collection">Your first live collection</h2>
      <p>
        Use <code>withRest</code> to connect your existing REST endpoints to a
        realtime collection. Each mutation is broadcast to the channel
        automatically &mdash; no changes to your server routes required.
      </p>
      <CodeBlock
        title="app/features/todos/collection.ts"
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
        title="app/features/todos/TodoList.tsx"
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
      <p>
        You now have a live collection. From here you can add capabilities one
        config key at a time &mdash; the{' '}
        <a href="#/docs/collections">progressive spectrum</a>:
      </p>
      <ol>
        <li>
          <strong>Basic query</strong> &mdash; <code>queryFn</code> alone
          fetches data on mount (what you built above).
        </li>
        <li>
          <strong>Add realtime</strong> &mdash; add <code>channel</code> and
          mutations broadcast to all subscribers instantly.
        </li>
        <li>
          <strong>Add CRDTs</strong> &mdash; add <code>fields</code> and
          concurrent edits merge automatically (LWW, PN-Counter, OR-Set).
        </li>
      </ol>
      <h3>Explore further</h3>
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
          <a href="#/docs/channels">Channels &amp; Pub/Sub</a> &mdash; live
          feeds, validated publishing, append-only channels
        </li>
        <li>
          <a href="#/docs/presence">Presence</a> &mdash; live cursors, online
          user lists, typing indicators
        </li>
        <li>
          <a href="#/docs/ephemeral">Ephemeral Channels</a> &mdash; reactions,
          toasts, confetti, and short-lived events
        </li>
        <li>
          <a href="#/docs/transports">Transports</a> &mdash; Centrifugo (fan-out
          included), PublishBackend for multi-instance SSE, offline queue,
          multi-tab coordination
        </li>
        <li>
          <a href="#/docs/server-functions">TanStack Start + Drizzle</a> &mdash;
          full-stack guide with server functions as collection callbacks
        </li>
      </ul>
    </article>
  )
}
