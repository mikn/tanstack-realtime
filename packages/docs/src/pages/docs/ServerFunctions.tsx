import { CodeBlock } from '../../components/CodeBlock'

export function ServerFunctions() {
  return (
    <article className="doc-article">
      <h1>TanStack Start + Drizzle</h1>
      <p className="doc-lead">
        Wire Drizzle CRUD server functions into a realtime collection in one
        spread. Every mutation is persisted by the server, confirmed by Drizzle,
        and broadcast to all subscribers automatically — no manual{' '}
        <code>publish()</code> call anywhere.
      </p>

      <h2 id="overview">How it works</h2>
      <p>
        The <code>withServerFns</code> helper maps four async functions
        (typically TanStack Start <code>createServerFn</code> callables) to the{' '}
        <code>queryFn</code>, <code>onInsert</code>, <code>onUpdate</code>, and{' '}
        <code>onDelete</code> callbacks expected by{' '}
        <code>realtimeCollectionOptions</code>. It unwraps{' '}
        <code>transaction.mutations[0].modified</code> internally so your server
        functions receive a plain <code>{'{ data: T }'}</code> argument.
      </p>
      <p>
        The broadcast path is automatic: when <code>onInsert</code> or{' '}
        <code>onUpdate</code> returns a value, the library publishes it to the
        channel. Every connected client — on every tab, every device — receives
        the Drizzle-confirmed row.
      </p>
      <div className="doc-callout">
        <p>
          <strong>Server authority without extra plumbing.</strong> The Drizzle
          query result is the ground truth. You never call{' '}
          <code>realtimePublish</code> by hand; returning the saved row from
          your server function is enough.
        </p>
      </div>

      <h2 id="server-setup">1. Server setup</h2>
      <p>
        Create the realtime handler with <code>createStartHandler</code> from
        the TanStack Start preset and mount it on an API route.
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
  authorize: async (userId, channel) => ({
    subscribe: !!userId,
    publish: false,   // clients never publish directly
    presence: true,
  }),
})`}
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

      <h2 id="client-setup">2. Client setup</h2>
      <p>
        Pair the SSE handler with <code>sseTransport</code> on the client. Wrap
        your app with <code>RealtimeProvider</code>.
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

export function App() {
  return (
    <RealtimeProvider client={realtimeClient}>
      <RouterProvider router={router} />
    </RealtimeProvider>
  )
}`}
      />

      <h2 id="schema">3. Drizzle schema</h2>
      <p>
        Define your table and export the inferred types. The server functions
        and the collection both use these types — no manual interface needed.
      </p>
      <CodeBlock
        title="db/schema.ts"
        code={`import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core'

export const todos = pgTable('todos', {
  id:        text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  title:     text('title').notNull(),
  done:      boolean('done').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type Todo    = typeof todos.$inferSelect
export type NewTodo = typeof todos.$inferInsert`}
      />

      <h2 id="server-functions">4. Server functions</h2>
      <p>
        TanStack Start's bundler plugin requires <code>createServerFn</code>{' '}
        calls to appear at module level — they cannot be created dynamically
        inside a factory. Define all four here; per-request filtering (e.g.{' '}
        <code>projectId</code>) is passed through <code>data</code>.
      </p>
      <CodeBlock
        title="app/server/todos.ts"
        code={`import { createServerFn } from '@tanstack/start'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { todos, type Todo, type NewTodo } from '../../db/schema'

export const fetchTodos = createServerFn()
  .handler(({ data }: { data: { projectId: string } }) =>
    db.select().from(todos).where(eq(todos.projectId, data.projectId))
  )

export const createTodo = createServerFn({ method: 'POST' })
  .handler(({ data }: { data: NewTodo }) =>
    db.insert(todos).values(data).returning().then((r) => r[0])
  )

export const updateTodo = createServerFn({ method: 'POST' })
  .handler(({ data }: { data: Todo }) =>
    db.update(todos)
      .set(data)
      .where(eq(todos.id, data.id))
      .returning()
      .then((r) => r[0])
  )

export const deleteTodo = createServerFn({ method: 'POST' })
  .handler(({ data }: { data: Todo }) =>
    db.delete(todos).where(eq(todos.id, data.id))
  )`}
      />
      <p>
        Each write function returns the saved row directly from Drizzle's{' '}
        <code>.returning()</code>. That row becomes the broadcast payload — no
        extra shaping required.
      </p>

      <h2 id="collection">5. Collection</h2>
      <p>
        Spread <code>withServerFns</code> into{' '}
        <code>realtimeCollectionOptions</code>. The <code>query</code> option is
        a thunk that captures filter parameters via closure; <code>insert</code>
        , <code>update</code>, and <code>delete</code> are passed through
        directly because they already accept <code>{'{ data: T }'}</code>.
      </p>
      <CodeBlock
        title="app/features/todos/collection.ts"
        code={`import { withServerFns, realtimeCollectionOptions } from '@tanstack/realtime'
import { realtimeClient } from '../../client/realtime'
import {
  fetchTodos, createTodo, updateTodo, deleteTodo,
} from '../../server/todos'

export const todosOptions = (projectId: string) =>
  realtimeCollectionOptions({
    ...withServerFns({
      query:  () => fetchTodos({ data: { projectId } }),
      insert: createTodo,
      update: updateTodo,
      delete: deleteTodo,
    }),
    client:  realtimeClient,
    channel: ['todos', { projectId }],
  })`}
      />
      <p>
        <code>getKey</code> defaults to <code>(item) =&gt; item.id</code>. Pass
        it explicitly if your primary key field has a different name or is a
        number:
      </p>
      <CodeBlock
        code={`...withServerFns({
  // ...
  getKey: (t) => t.todoId,   // override when field isn't 'id'
})`}
      />

      <h2 id="component">6. Component</h2>
      <p>
        Read the collection with <code>useCollection</code>. Mutations go
        through the standard TanStack DB mutation API — the server function
        handles persistence and the broadcast propagates the result to every
        subscriber.
      </p>
      <CodeBlock
        title="app/features/todos/TodoList.tsx"
        code={`import { useCollection, useMutation } from '@tanstack/react-db'
import { todosOptions } from './collection'
import { createTodo } from '../../server/todos'

export function TodoList({ projectId }: { projectId: string }) {
  const options = todosOptions(projectId)
  const todos   = useCollection(options)

  const { mutate: addTodo } = useMutation({
    collection:  options,
    mutationFn: ({ transaction }) =>
      createTodo({ data: transaction.mutations[0].modified }),
  })

  return (
    <>
      <button
        onClick={() =>
          addTodo({
            id:        crypto.randomUUID(),
            projectId,
            title:     'New todo',
            done:      false,
            createdAt: new Date(),
          })
        }
      >
        Add todo
      </button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </>
  )
}
// Every client updates the instant a todo is added, changed, or removed.`}
      />

      <h2 id="broadcast">How broadcast works</h2>
      <div className="doc-callout">
        <p>
          When <code>onInsert</code> or <code>onUpdate</code> returns a value,{' '}
          <code>realtimeCollectionOptions</code> automatically publishes{' '}
          <code>{'{ action: "insert" | "update", data: <row> }'}</code> to the
          channel. All subscribers — including other browser tabs and other
          users — receive the Drizzle-confirmed row.
        </p>
        <p>
          <code>onDelete</code> is fire-and-forget; the library publishes a{' '}
          <code>delete</code> action with the optimistic row so subscribers can
          remove it from their local state.
        </p>
      </div>

      <h2 id="server-authoritative">Server-authoritative mode</h2>
      <p>
        The pattern above uses <em>auto-broadcast</em>: the returned Drizzle row
        is the broadcast payload. This is the recommended approach.
      </p>
      <p>
        If you need to call <code>realtime.publish()</code> yourself inside a
        server function (for example, to fan out to a different channel or to
        attach extra metadata), add <code>serverAuthoritative: true</code> to
        prevent a duplicate broadcast:
      </p>
      <CodeBlock
        code={`realtimeCollectionOptions({
  ...withServerFns({ query, insert, update, delete: deleteTodo }),
  serverAuthoritative: true,   // suppress auto-broadcast; server publishes manually
  client: realtimeClient,
  channel: ['todos', { projectId }],
})`}
      />
      <CodeBlock
        title="app/server/todos.ts (manual publish variant)"
        code={`import { realtime } from '../realtime'

export const updateTodo = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: Todo }) => {
    const updated = await db.update(todos)
      .set(data)
      .where(eq(todos.id, data.id))
      .returning()
      .then((r) => r[0])

    // Publish to a second channel that aggregates all project activity
    await realtime.publish(['activity', { projectId: data.projectId }], {
      action: 'update',
      data:   updated,
    })

    // Also publish the primary channel explicitly (required with serverAuthoritative)
    await realtime.publish(['todos', { projectId: data.projectId }], {
      action: 'update',
      data:   updated,
    })
    return updated
  })`}
      />

      <h2 id="scaling">Scaling to multiple processes</h2>
      <p>
        For horizontally-scaled deployments (multiple Node.js processes or
        serverless functions), add a <code>PublishBackend</code> so every
        instance fans out messages to its own SSE connections.
      </p>
      <CodeBlock
        title="app/server/realtime.ts (Redis backend)"
        code={`import { createStartHandler, type PublishBackend } from '@tanstack/realtime-preset-start'
import Redis from 'ioredis'

const pub = new Redis(process.env.REDIS_URL!)
const sub = new Redis(process.env.REDIS_URL!)

const backend: PublishBackend = {
  async publish(channel, data) {
    await pub.publish('rt', JSON.stringify({ channel, data }))
  },
  subscribe(onMessage) {
    void sub.subscribe('rt')
    sub.on('message', (_ch, msg) => {
      const { channel, data } = JSON.parse(msg) as { channel: string; data: unknown }
      onMessage(channel, data)
    })
    return () => { void sub.unsubscribe('rt') }
  },
}

export const realtime = createStartHandler({ backend, getUser, authorize })
export const realtimePublish = realtime.publish`}
      />
      <p>
        No changes needed in the server functions or the collection — the
        backend is transparent to the rest of the stack.
      </p>
    </article>
  )
}
