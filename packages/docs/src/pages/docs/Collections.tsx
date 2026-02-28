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

      <h2 id="with-rest">withRest &mdash; the 80% case</h2>
      <p>
        Spread <code>withRest</code> into <code>realtimeCollectionOptions</code>{' '}
        to wire <code>getKey</code>, <code>queryFn</code>, <code>onInsert</code>
        , <code>onUpdate</code>, and <code>onDelete</code> to standard REST/JSON
        endpoints in one call. Your server routes are plain CRUD.
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
          the library automatically publishes it to the channel. You only call{' '}
          <code>nodeServer.publish()</code> directly for changes that originate
          outside a client mutation.
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
