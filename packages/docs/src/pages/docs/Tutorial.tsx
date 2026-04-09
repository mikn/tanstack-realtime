import { CodeBlock } from '../../components/CodeBlock'

export function Tutorial() {
  return (
    <article className="doc-article">
      <h1>Tutorial: Build a Collaborative Task Board</h1>
      <p className="doc-lead">
        Build a real-time task board from scratch in 15 minutes. Multiple users
        can add, edit, and complete tasks simultaneously &mdash; every change
        appears instantly across all connected browsers.
      </p>

      <div className="doc-callout">
        <p>
          <strong>What you&rsquo;ll build:</strong> a project task board with
          live queries, optimistic mutations, online presence, and typing
          indicators. The same reactive experience you&rsquo;d get from a fully
          managed platform &mdash; on your own Postgres database.
        </p>
      </div>

      <h2 id="prerequisites">Prerequisites</h2>
      <ul>
        <li>Node.js 18+</li>
        <li>A Postgres database (local or hosted &mdash; Neon, Supabase, Railway all work)</li>
        <li>Basic familiarity with React and TypeScript</li>
      </ul>

      <h2 id="step-1">Step 1: Create the project</h2>
      <p>
        Scaffold a TanStack Start app and install the realtime packages:
      </p>
      <CodeBlock
        code={`npx create-start-app@latest task-board
cd task-board

npm i @tanstack/realtime @tanstack/react-realtime \\
      @tanstack/realtime-preset-start @tanstack/realtime-adapter-sse \\
      @tanstack/db @tanstack/react-db \\
      drizzle-orm postgres
npm i -D drizzle-kit`}
      />

      <h2 id="step-2">Step 2: Define your database schema</h2>
      <p>
        Create a Drizzle schema for tasks. This is the only data model in the
        entire app &mdash; types flow from here to every hook automatically.
      </p>
      <CodeBlock
        title="db/schema.ts"
        code={`import { pgTable, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core'

export const tasks = pgTable('tasks', {
  id:        text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  title:     text('title').notNull(),
  status:    text('status', { enum: ['todo', 'in-progress', 'done'] }).notNull().default('todo'),
  priority:  integer('priority').notNull().default(0),
  assignee:  text('assignee'),
  done:      boolean('done').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type Task    = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert`}
      />
      <CodeBlock
        title="db/index.ts"
        code={`import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client)`}
      />
      <p>
        Run the migration:
      </p>
      <CodeBlock
        code={`npx drizzle-kit push`}
      />

      <h2 id="step-3">Step 3: Set up the realtime server</h2>
      <p>
        Two files: a handler and a route. This is all the server infrastructure
        you need.
      </p>
      <CodeBlock
        title="app/server/realtime.ts"
        code={`import { createStartHandler } from '@tanstack/realtime-preset-start'

export const realtime = createStartHandler({})

// That's it. Add getUser/authorize later for auth.
// See: https://tanstack.com/realtime/docs/authentication`}
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

      <h2 id="step-4">Step 4: Write your server functions</h2>
      <p>
        Wrap your query and mutations with <code>realtime.query()</code> and{' '}
        <code>realtime.mutation()</code>. This is the only annotation needed
        &mdash; channels, caching, and invalidation are all automatic.
      </p>
      <CodeBlock
        title="app/server/tasks.ts"
        code={`import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { tasks, type NewTask } from '../../db/schema'
import { realtime } from './realtime'

// Queries — one annotation makes them live
export const getTasks = realtime.query(
  async ({ projectId }: { projectId: string }) =>
    db.select().from(tasks).where(eq(tasks.projectId, projectId))
)

// Mutations — invalidate all subscribers automatically
export const createTask = realtime.mutation(
  async (input: NewTask) => {
    const [task] = await db.insert(tasks).values(input).returning()
    return task
  }
)

export const updateTask = realtime.mutation(
  async ({ id, ...fields }: { id: string } & Partial<NewTask>) => {
    const [task] = await db
      .update(tasks)
      .set(fields)
      .where(eq(tasks.id, id))
      .returning()
    return task
  }
)

export const deleteTask = realtime.mutation(
  async ({ id }: { id: string }) => {
    await db.delete(tasks).where(eq(tasks.id, id))
  }
)`}
      />

      <h2 id="step-5">Step 5: Connect the client</h2>
      <p>
        Create a realtime client and wrap your app with the provider.
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

      <h2 id="step-6">Step 6: Build the task board UI</h2>
      <p>
        This is where the payoff arrives. <code>useQuery</code> returns live
        data. <code>useMutation</code> gives you optimistic updates. Open the
        app in two browser tabs and watch them stay in sync.
      </p>
      <CodeBlock
        title="app/features/board/TaskBoard.tsx"
        code={`import { useQuery, useMutation } from '@tanstack/react-realtime'
import { useLiveQuery } from '@tanstack/react-db'
import { getTasks, createTask, updateTask, deleteTask } from '../../server/tasks'
import type { Task } from '../../../db/schema'

export function TaskBoard({ projectId }: { projectId: string }) {
  // Live query — all subscribers share one connection
  const { data, collection } = useQuery(getTasks, { projectId }, {
    getKey: (t) => t.id,
  })

  // Client-side filtering — no extra server request
  const { data: todoTasks } = useLiveQuery(
    (q) => q.from({ tasks: collection }).where('status', '=', 'todo'),
    [collection],
  )
  const { data: inProgress } = useLiveQuery(
    (q) => q.from({ tasks: collection }).where('status', '=', 'in-progress'),
    [collection],
  )
  const { data: doneTasks } = useLiveQuery(
    (q) => q.from({ tasks: collection }).where('status', '=', 'done'),
    [collection],
  )

  // Mutations with optimistic updates
  const { mutate: addTask } = useMutation(createTask, {
    optimistic: (cache, args) => {
      cache.update(getTasks, { projectId }, prev => [
        ...(prev ?? []),
        { ...args, createdAt: new Date() } as Task,
      ])
    },
  })

  const { mutate: editTask } = useMutation(updateTask, {
    optimistic: (cache, args) => {
      cache.update(getTasks, { projectId }, prev =>
        (prev ?? []).map(t => t.id === args.id ? { ...t, ...args } : t)
      )
    },
  })

  const { mutate: removeTask } = useMutation(deleteTask, {
    optimistic: (cache, args) => {
      cache.update(getTasks, { projectId }, prev =>
        (prev ?? []).filter(t => t.id !== args.id)
      )
    },
  })

  const handleAdd = () => {
    addTask({
      id: crypto.randomUUID(),
      projectId,
      title: 'New task',
      status: 'todo',
      priority: 0,
      assignee: null,
      done: false,
    })
  }

  return (
    <div className="board">
      <button onClick={handleAdd}>+ Add Task</button>
      <div className="columns">
        <Column
          title="To Do"
          tasks={todoTasks ?? []}
          onStatusChange={(id, status) => editTask({ id, status })}
          onDelete={(id) => removeTask({ id })}
        />
        <Column
          title="In Progress"
          tasks={inProgress ?? []}
          onStatusChange={(id, status) => editTask({ id, status })}
          onDelete={(id) => removeTask({ id })}
        />
        <Column
          title="Done"
          tasks={doneTasks ?? []}
          onStatusChange={(id, status) => editTask({ id, status })}
          onDelete={(id) => removeTask({ id })}
        />
      </div>
    </div>
  )
}

function Column({ title, tasks, onStatusChange, onDelete }: {
  title: string
  tasks: Task[]
  onStatusChange: (id: string, status: Task['status']) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="column">
      <h3>{title} ({tasks.length})</h3>
      {tasks.map(task => (
        <div key={task.id} className="task-card">
          <span>{task.title}</span>
          <div className="task-actions">
            {task.status !== 'in-progress' && (
              <button onClick={() => onStatusChange(task.id, 'in-progress')}>
                Start
              </button>
            )}
            {task.status !== 'done' && (
              <button onClick={() => onStatusChange(task.id, 'done')}>
                Done
              </button>
            )}
            <button onClick={() => onDelete(task.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}`}
      />

      <h2 id="step-7">Step 7: Add presence</h2>
      <p>
        Show who&rsquo;s viewing the board right now. This uses the same SSE
        connection &mdash; no additional infrastructure.
      </p>
      <CodeBlock
        title="app/features/board/OnlineUsers.tsx"
        code={`import { usePresence } from '@tanstack/react-realtime'
import { presenceChannelOptions } from '@tanstack/realtime'
import { realtimeClient } from '../../client/realtime'

const boardPresence = (projectId: string) =>
  presenceChannelOptions({
    client: realtimeClient,
    channel: ['board-presence', { projectId }],
  })

export function OnlineUsers({ projectId, userName }: {
  projectId: string
  userName: string
}) {
  const { others } = usePresence(boardPresence(projectId), {
    initialData: { name: userName },
  })

  return (
    <div className="online-users">
      <span className="you">You</span>
      {others.map(user => (
        <span key={user.clientId} className="user-badge">
          {user.data.name}
        </span>
      ))}
    </div>
  )
}`}
      />

      <h2 id="step-8">Step 8: Run it</h2>
      <CodeBlock
        code={`npm run dev`}
      />
      <p>
        Open <code>http://localhost:3000</code> in two browser tabs. Add a task
        in one &mdash; it appears instantly in the other. Move a task to
        &ldquo;Done&rdquo; &mdash; both tabs update. The presence indicator
        shows both tabs as online users.
      </p>

      <h2 id="recap">What you built</h2>
      <p>
        In about 15 minutes and ~120 lines of application code, you have:
      </p>
      <table className="api-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th>How it works</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Live queries</td>
            <td>
              <code>realtime.query()</code> on the server +{' '}
              <code>useQuery()</code> on the client. Channels derived
              automatically from args.
            </td>
          </tr>
          <tr>
            <td>Optimistic mutations</td>
            <td>
              <code>useMutation()</code> with an <code>optimistic</code>{' '}
              callback. UI updates before the server responds; rolls back on
              error.
            </td>
          </tr>
          <tr>
            <td>Client-side filtering</td>
            <td>
              <code>useLiveQuery()</code> filters the collection locally. Three
              columns, one server query, zero extra fetches.
            </td>
          </tr>
          <tr>
            <td>Online presence</td>
            <td>
              <code>usePresence()</code> over the same SSE connection. No
              WebSocket server, no Redis, no extra infrastructure.
            </td>
          </tr>
          <tr>
            <td>Full type safety</td>
            <td>
              Types flow from the Drizzle schema to server functions to React
              hooks. No codegen, no manual interfaces.
            </td>
          </tr>
        </tbody>
      </table>

      <h2 id="your-stack">Your stack, your rules</h2>
      <p>
        Everything in this tutorial runs on infrastructure you control:
      </p>
      <ul>
        <li>
          <strong>Database:</strong> Your own Postgres. Switch to MySQL,
          SQLite, or any database Drizzle supports.
        </li>
        <li>
          <strong>Server:</strong> TanStack Start (Vite-based). Deploy to
          Vercel, Fly, Railway, Cloudflare, or your own VPS.
        </li>
        <li>
          <strong>Transport:</strong> SSE by default. Swap to Centrifugo for
          WebSocket support with zero application code changes.
        </li>
        <li>
          <strong>Auth:</strong> Bring whatever you use &mdash; add{' '}
          <code>getUser</code> and <code>authorize</code> callbacks when
          you&rsquo;re ready. See the{' '}
          <a href="#/docs/authentication">Authentication guide</a>.
        </li>
      </ul>

      <h2 id="next-level">Take it further</h2>
      <table className="api-table">
        <thead>
          <tr>
            <th>I want to&hellip;</th>
            <th>Add this</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Handle concurrent title edits</td>
            <td>
              Add <code>fields: {'{ title: \'lww\' }'}</code> for last-writer-wins merge.
              See <a href="#/docs/crdts">CRDTs</a>.
            </td>
          </tr>
          <tr>
            <td>Show typing indicators</td>
            <td>
              Use <code>useTypingIndicator()</code>. See{' '}
              <a href="#/docs/ephemeral">Ephemeral Channels</a>.
            </td>
          </tr>
          <tr>
            <td>Stream AI task descriptions</td>
            <td>
              Use <code>createServerStream()</code> + <code>useStream()</code>.
              See <a href="#/docs/streaming">Streaming</a>.
            </td>
          </tr>
          <tr>
            <td>Scale to multiple server instances</td>
            <td>
              Add a <code>PublishBackend</code> (Redis or Upstash).
              See <a href="#/docs/scaling">Scaling to Production</a>.
            </td>
          </tr>
          <tr>
            <td>Work offline</td>
            <td>
              Add <code>useOfflineQueue()</code>. Mutations queue locally and
              flush on reconnect. See <a href="#/docs/resilience">Resilience</a>.
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  )
}
