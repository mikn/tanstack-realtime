import { CodeBlock } from '../../components/CodeBlock'

export function Collections() {
  return (
    <article className="doc-article">
      <h1>Collections</h1>
      <p className="doc-lead">
        <code>realtimeCollectionOptions</code> turns a TanStack DB collection
        into a live, synced data source. Seed from your database, broadcast
        mutations through a channel, and resolve conflicts with CRDTs.
      </p>

      <h2 id="with-server-fns">withServerFns &mdash; the primary pattern</h2>
      <p>
        Spread <code>withServerFns</code> into{' '}
        <code>realtimeCollectionOptions</code> to wire <code>getKey</code>,{' '}
        <code>queryFn</code>, <code>onInsert</code>, <code>onUpdate</code>, and{' '}
        <code>onDelete</code> to TanStack Start server functions in one call.
        The library unwraps mutation payloads internally; your server functions
        receive a plain <code>{'{ data: T }'}</code> argument.
      </p>
      <CodeBlock
        title="app/server/tasks.ts"
        code={`import { createServerFn } from '@tanstack/start'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { tasks } from '../../db/schema'

export const fetchTasks = createServerFn()
  .handler(({ data: { projectId } }) =>
    db.select().from(tasks).where(eq(tasks.projectId, projectId))
  )

export const createTask = createServerFn({ method: 'POST' })
  .handler(({ data }) =>
    db.insert(tasks).values(data).returning().then((r) => r[0])
  )

export const updateTask = createServerFn({ method: 'POST' })
  .handler(({ data }) =>
    db.update(tasks).set(data).where(eq(tasks.id, data.id)).returning().then((r) => r[0])
  )

export const deleteTask = createServerFn({ method: 'POST' })
  .handler(({ data }) => db.delete(tasks).where(eq(tasks.id, data.id)))`}
      />
      <CodeBlock
        title="app/features/tasks/collection.ts"
        code={`import { realtimeCollectionOptions, withServerFns } from '@tanstack/realtime'
import { realtimeClient } from '../../client/realtime'
import { fetchTasks, createTask, updateTask, deleteTask } from '../../server/tasks'

export const tasksOptions = (projectId: string) =>
  realtimeCollectionOptions({
    ...withServerFns({
      query:  () => fetchTasks({ data: { projectId } }),
      insert: createTask,
      update: updateTask,
      delete: deleteTask,
    }),
    client:  realtimeClient,
    channel: ['tasks', { projectId }],
    fields:  { title: 'lww', status: 'lww', assignees: 'or-set' },
  })`}
      />

      <h2 id="conflict-handling">Conflict handling</h2>
      <p>
        When multiple users edit the same row concurrently, use optimistic
        locking on the server and throw <code>ConflictError</code> when the
        version has moved on. The client's <code>onOptimisticError</code>{' '}
        handler receives the current server state so you can show a conflict UI
        and let the user decide.
      </p>
      <CodeBlock
        title="app/server/tasks.ts — version-checked update"
        code={`import { ConflictError } from '@tanstack/realtime'

export const updateTask = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: Task }) => {
    const existing = await db.select().from(tasks)
      .where(eq(tasks.id, data.id))
      .then((r) => r[0])

    if (existing.version !== data.version) {
      throw new ConflictError('Concurrent edit detected', { current: existing })
    }

    return db.update(tasks)
      .set({ ...data, version: data.version + 1 })
      .where(eq(tasks.id, data.id))
      .returning()
      .then((r) => r[0])
  })`}
      />
      <CodeBlock
        title="app/features/tasks/collection.ts — conflict handler"
        code={`import { realtimeCollectionOptions, withServerFns, isConflictError } from '@tanstack/realtime'

export const tasksOptions = (projectId: string) =>
  realtimeCollectionOptions({
    ...withServerFns({ query, insert, update: updateTask, delete: deleteTask }),
    client:  realtimeClient,
    channel: ['tasks', { projectId }],

    onOptimisticError: ({ error, action, key }) => {
      if (isConflictError<Task>(error)) {
        // error.current holds the authoritative server state
        showConflictDialog({
          attempted: action.modified,
          current:   error.current,
          onKeepServer: () => {/* user accepts server version */},
          onRetry:      () => tasksOptions(projectId).onUpdate?.({
            transaction: { mutations: [{ modified: { ...action.modified, version: error.current.version } }] },
          }),
        })
      }
    },
  })`}
      />
      <div className="doc-callout">
        <p>
          <strong>Why a class, not a status code?</strong> TanStack Start
          reconstructs thrown errors on the client as plain objects, which
          breaks <code>instanceof</code> checks. <code>ConflictError</code>{' '}
          carries a stable <code>type&nbsp;=&nbsp;"ConflictError"</code>{' '}
          discriminant, and <code>isConflictError()</code> checks that property
          first — so it works across the network boundary.
        </p>
      </div>

      <h2 id="custom-callbacks">Custom callbacks</h2>
      <p>
        Write <code>onInsert</code> / <code>onUpdate</code> manually when you
        need logic that <code>withServerFns</code> doesn&rsquo;t cover —
        multi-table writes, conditional branching, or returning a shaped
        response. Return the saved row and the library handles the broadcast.
      </p>
      <CodeBlock
        title="app/features/chat/collection.ts"
        code={`const messagesOptions = (roomId: string) =>
  realtimeCollectionOptions({
    client:  realtimeClient,
    channel: ['messages', { roomId }],
    getKey:  (m) => m.id,

    queryFn: () => fetchMessages({ data: { roomId, limit: 50 } }),

    onInsert: async ({ transaction }) => {
      const data = transaction.mutations[0].modified
      // custom logic: attach room membership, validate rate limits, etc.
      return createMessage({ data: { ...data, roomId } })
      // returning the saved row triggers auto-broadcast to all subscribers
    },
  })`}
      />

      <h2 id="server-push">Server-initiated push</h2>
      <p>
        For changes that originate outside a client mutation &mdash; background
        jobs, cron tasks, webhooks &mdash; call <code>realtimePublish</code>{' '}
        from your server handler directly.
      </p>
      <CodeBlock
        title="app/server/jobs/inventorySync.ts"
        code={`import { realtimePublish } from '../realtime'
import { serializeKey } from '@tanstack/realtime'

export async function syncInventory(productId: string) {
  const latestStock = await warehouseApi.getStock(productId)
  const product = await db.update(products)
    .set({ stock: latestStock })
    .where(eq(products.id, productId))
    .returning()
    .then((r) => r[0])

  await realtimePublish(
    serializeKey(['products', { id: productId }]),
    { action: 'update', data: product },
  )
}`}
      />

      <h2 id="auto-broadcast">How auto-broadcast works</h2>
      <div className="doc-callout">
        <p>
          After <code>onInsert</code> or <code>onUpdate</code> returns a value,
          the originating tab calls <code>client.publish()</code> automatically.
          This requires <code>authorize.publish: true</code> in your handler.
          Call <code>realtimePublish</code> on the server instead when you need
          server-authoritative broadcast (set{' '}
          <code>serverAuthoritative: true</code> in the collection to suppress
          the client publish).
        </p>
      </div>

      <h2 id="optimistic-updates">Optimistic updates</h2>
      <p>
        Enable <code>optimistic: true</code> to add a nonce to each mutation.
        The echo from the server is suppressed so there are no duplicate
        flashes. Use <code>onOptimisticError</code> to handle failures —
        including conflicts detected by the server.
      </p>
      <CodeBlock
        code={`realtimeCollectionOptions({
  // ...
  optimistic: true,
  onOptimisticError: ({ error, action, key }) => {
    if (isConflictError(error)) {
      // concurrent edit — surface conflict UI
    } else {
      console.error('Mutation failed for key', key, error)
    }
  },
})`}
      />

      <h2 id="refetch">Gap recovery with refetch</h2>
      <p>
        Add <code>refetchOnReconnect: true</code> to any collection with a{' '}
        <code>queryFn</code>. After a network gap, the query re-runs and diffs
        against local state.
      </p>
      <CodeBlock
        code={`realtimeCollectionOptions({
  // ...
  refetchOnReconnect: true,
})`}
      />
    </article>
  )
}
