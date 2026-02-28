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

      <h2 id="with-server-fn">
        withServerFn &mdash; server authority (recommended)
      </h2>
      <p>
        <code>withServerFn</code> is a thin adapter that maps plain async
        functions to TanStack DB&rsquo;s mutation callback signature and sets{' '}
        <code>serverPublish: true</code> automatically. The server function
        itself is responsible for calling <code>nodeServer.publish()</code>{' '}
        &mdash; <code>withServerFn</code> does not call publish and has no
        opinion about your server framework.
      </p>
      <p>
        This works with TanStack Start <code>createServerFn</code>, tRPC
        mutations, Hono route handlers called via fetch, or any plain async
        function. The library does not import <code>@tanstack/start</code>.
      </p>
      <CodeBlock
        title="app/functions/tasks.ts — server-only, can import nodeServer"
        code={`import { createServerFn } from '@tanstack/start'
import { nodeServer } from '../server/realtime'
import { serializeKey } from '@tanstack/realtime'

export const insertTask = createServerFn({ method: 'POST' })
  .validator(taskSchema)
  .handler(async ({ data }) => {
    const task = await db.tasks.create({ data: { ...data, createdBy: ctx.userId } })
    // publish happens here, server-side — nodeServer is a server-only module
    nodeServer.publish(
      serializeKey(['tasks', { projectId: task.projectId }]),
      { action: 'insert', data: task },
    )
    return task // returned so TanStack DB can reconcile optimistic state
  })

export const updateTask = createServerFn({ method: 'POST' })
  .validator(taskSchema.partial())
  .handler(async ({ data }) => {
    const task = await db.tasks.update({ where: { id: data.id }, data })
    nodeServer.publish(
      serializeKey(['tasks', { projectId: task.projectId }]),
      { action: 'update', data: task },
    )
    return task
  })

export const deleteTask = createServerFn({ method: 'POST' })
  .handler(async ({ data }) => {
    const task = await db.tasks.delete({ where: { id: (data as Task).id } })
    nodeServer.publish(
      serializeKey(['tasks', { projectId: task.projectId }]),
      { action: 'delete', data: task },
    )
    return task
  })`}
      />
      <CodeBlock
        title="app/collections/tasks.ts — client or isomorphic"
        code={`import { withServerFn, realtimeCollectionOptions } from '@tanstack/realtime'
import { insertTask, updateTask, deleteTask } from '../functions/tasks'

// withServerFn adapts (data) => Promise<T> to TanStack DB's callback shape
// and sets serverPublish: true so the library does not also call client.publish()
const tasksOptions = (projectId: string) =>
  realtimeCollectionOptions({
    ...withServerFn<Task, string>({
      getKey: (t) => t.id,
      queryFn: () => fetch(\`/api/tasks?projectId=\${projectId}\`).then((r) => r.json()),
      onInsert: (data) => insertTask({ data }),
      onUpdate: (data) => updateTask({ data }),
      onDelete: (data) => deleteTask({ data }),
    }),
    client: realtimeClient,
    channel: ['tasks', { projectId }],
    fields: { title: 'lww', status: 'lww', assignees: 'or-set' },
  })`}
      />
      <div className="doc-callout">
        <p>
          <strong>Why this is secure:</strong> The real security boundary is
          the server&rsquo;s{' '}
          <code>{'authorize: { publish: false }'}</code> setting &mdash; if a
          channel denies client publishes at the transport level, no tampered
          client can broadcast to it regardless of collection config.{' '}
          <code>serverPublish: true</code> (set automatically by{' '}
          <code>withServerFn</code>) is an optimization that avoids the
          unnecessary rejected round-trip. See{' '}
          <a href="#/docs/security">Security</a> for the full picture.
        </p>
      </div>

      <h2 id="with-rest">withRest &mdash; quick prototyping</h2>
      <p>
        Spread <code>withRest</code> into <code>realtimeCollectionOptions</code>{' '}
        to wire <code>getKey</code>, <code>queryFn</code>, <code>onInsert</code>
        , <code>onUpdate</code>, and <code>onDelete</code> to standard REST/JSON
        endpoints in one call. Your server routes are plain CRUD.
      </p>
      <p>
        Note: <code>withRest</code> publishes from the <em>client</em> after the
        REST call succeeds. This is convenient for prototyping but gives clients
        control over the broadcast payload. For production use,{' '}
        <code>withServerFn</code> is recommended.
      </p>
      <CodeBlock
        title="features/tasks/collection.ts"
        code={`import { withRest, realtimeCollectionOptions } from '@tanstack/realtime'

const tasksOptions = (projectId: string) =>
  realtimeCollectionOptions({
    ...withRest<Task, string>({
      url: \`/api/tasks?projectId=\${projectId}\`,
      getKey: (t) => t.id,
    }),
    client: realtimeClient,
    channel: ['tasks', { projectId }],
    fields: { title: 'lww', status: 'lww', assignees: 'or-set' },
  })`}
      />
      <CodeBlock
        title="server/routes/tasks.ts"
        code={`// Standard REST routes — no publish() needed anywhere.
router.get('/api/tasks', (req) =>
  db.tasks.findMany({ where: { projectId: req.query.projectId } })
)
router.post('/api/tasks', (req) =>
  db.tasks.create({ data: req.body })
)
router.patch('/api/tasks/:id', (req) =>
  db.tasks.update({ where: { id: req.params.id }, data: req.body })
)
router.delete('/api/tasks/:id', async (req) => {
  await db.tasks.delete({ where: { id: req.params.id } })
})`}
      />

      <h2 id="custom-callbacks">Custom callbacks</h2>
      <p>
        Write <code>onInsert</code> / <code>onUpdate</code> manually when you
        need custom logic. Return the saved row and the library handles the
        broadcast.
      </p>
      <CodeBlock
        title="features/chat/collection.ts"
        code={`const messagesOptions = (roomId: string) =>
  realtimeCollectionOptions({
    client: realtimeClient,
    channel: ['messages', { roomId }],
    getKey: (m) => m.id,

    queryFn: () =>
      fetch(\`/api/rooms/\${roomId}/messages?limit=50\`)
        .then((r) => r.json()),

    onInsert: async ({ transaction }) => {
      const data = transaction.mutations[0].modified
      const res = await fetch(\`/api/rooms/\${roomId}/messages\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json() // broadcast happens automatically
    },
  })`}
      />

      <h2 id="server-push">Server-initiated push</h2>
      <p>
        The one case where you call <code>nodeServer.publish()</code> directly:
        changes that originate outside a client mutation &mdash; background
        jobs, cron tasks, webhooks.
      </p>
      <CodeBlock
        title="server/jobs/inventorySync.ts"
        code={`import { nodeServer } from '../realtime'
import { serializeKey } from '@tanstack/realtime'

export async function syncInventory(productId: string) {
  const latestStock = await warehouseApi.getStock(productId)
  const product = await db.products.update({
    where: { id: productId },
    data: { stock: latestStock },
  })
  nodeServer.publish(
    serializeKey(['products', { id: productId }]),
    { action: 'update', data: product },
  )
}`}
      />

      <h2 id="auto-broadcast">How auto-broadcast works</h2>
      <div className="doc-callout">
        <p>
          After <code>onInsert</code> or <code>onUpdate</code> returns a value,
          the library automatically publishes it to the channel from the client.
          This is the default behaviour. When{' '}
          <code>serverPublish: true</code> is set (automatically included by{' '}
          <code>withServerFn</code>), this client-side publish is suppressed and
          the server is expected to publish instead. You only call{' '}
          <code>nodeServer.publish()</code> manually for changes that originate
          outside a client mutation (background jobs, webhooks, etc.).
        </p>
      </div>

      <h2 id="optimistic-updates">Optimistic updates</h2>
      <p>
        Enable <code>optimistic: true</code> to add a nonce to each mutation.
        The echo from the server is suppressed so there are no duplicate
        flashes.
      </p>
      <CodeBlock
        code={`realtimeCollectionOptions({
  // ...
  optimistic: true,
  onOptimisticError: (error, nonce) => {
    console.error('Mutation failed, nonce cleaned up:', nonce)
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
