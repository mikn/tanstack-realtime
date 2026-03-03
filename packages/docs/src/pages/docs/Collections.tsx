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

      <h2 id="with-rest">withRest &mdash; bring your own backend</h2>
      <p>
        Spread <code>withRest</code> into <code>realtimeCollectionOptions</code>{' '}
        to wire <code>getKey</code>, <code>queryFn</code>, <code>onInsert</code>
        , <code>onUpdate</code>, and <code>onDelete</code> to standard REST/JSON
        endpoints in one call. Your server routes stay as plain CRUD — no
        changes required.
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
    client:  realtimeClient,
    channel: ['tasks', { projectId }],
    fields:  { title: 'lww', status: 'lww', assignees: 'or-set' },
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
        need custom logic — multi-table writes, conditional branching, or
        returning a shaped response. Return the saved row and the library
        handles the broadcast.
      </p>
      <CodeBlock
        title="features/chat/collection.ts"
        code={`const messagesOptions = (roomId: string) =>
  realtimeCollectionOptions({
    client:  realtimeClient,
    channel: ['messages', { roomId }],
    getKey:  (m) => m.id,

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
      return res.json() // returning the saved row triggers auto-broadcast
    },
  })`}
      />

      <h2 id="server-push">Server-initiated push</h2>
      <p>
        The one case where you call <code>sseHandler.broadcast()</code>{' '}
        directly: changes that originate outside a client mutation &mdash;
        background jobs, cron tasks, webhooks.
      </p>
      <CodeBlock
        title="server/jobs/inventorySync.ts"
        code={`import { sseHandler } from '../realtime'
import { serializeKey } from '@tanstack/realtime'

export async function syncInventory(productId: string) {
  const latestStock = await warehouseApi.getStock(productId)
  const product = await db.products.update({
    where: { id: productId },
    data: { stock: latestStock },
  })
  sseHandler.broadcast(
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
          You only call <code>sseHandler.broadcast()</code> directly for changes
          that originate outside a client mutation.
        </p>
      </div>

      <h2 id="full-stack">Full-stack with TanStack Start</h2>
      <div className="doc-callout">
        <p>
          Using TanStack Start? <code>withServerFns</code> wires{' '}
          <code>createServerFn</code> callables directly into collection
          callbacks — no REST layer, full type safety from DB schema to UI, and
          built-in support for optimistic locking with{' '}
          <code>ConflictError</code>. See the{' '}
          <a href="#/docs/server-functions">TanStack Start + Drizzle</a> guide.
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
        code={`import { isConflictError } from '@tanstack/realtime'

realtimeCollectionOptions({
  // ...
  optimistic: true,
  onOptimisticError: ({ error, action, key }) => {
    if (isConflictError(error)) {
      // error.current holds the authoritative server state
      showConflictDialog({ current: error.current, attempted: action.modified })
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

      <h2 id="subscribe-errors">Subscribe error handling</h2>
      <p>
        When a subscription is rejected &mdash; authorization denied, channel
        not found, or a transport error &mdash; the transport emits a warning to
        the console. To surface these errors in your UI, check the
        client&rsquo;s connection status and handle transport-level events.
      </p>
      <CodeBlock
        code={`// The transport logs subscribe rejections as console.warn messages.
// To react programmatically, wrap the transport and intercept errors:

import { createRealtimeClient, wsTransport } from '@tanstack/realtime'

const baseTransport = wsTransport({ url: 'ws://localhost:3001' })

// Listen for connection status changes
const client = createRealtimeClient({ transport: baseTransport })

// In your component, check status to show a banner
function SyncBanner() {
  const { status } = useRealtime()
  if (status === 'disconnected') {
    return <div>Live updates unavailable. Check your connection.</div>
  }
  return null
}`}
      />
      <div className="doc-callout">
        <p>
          See the <a href="#/docs/error-reference">Error Reference</a> for
          details on subscribe errors, authorization failures, and how to debug
          them.
        </p>
      </div>

      <h2 id="offline-queue">Offline queue integration</h2>
      <p>
        Wrap your transport with <code>createOfflineQueue</code> to buffer
        publishes while the client is offline. Queued messages replay
        automatically in FIFO order when the connection is restored. Pair with{' '}
        <code>optimistic: true</code> on your collections so local writes appear
        instantly while the queue waits to flush.
      </p>
      <CodeBlock
        code={`import { createOfflineQueue, createLocalStorageAdapter } from '@tanstack/realtime'

const transport = createOfflineQueue(baseTransport, {
  maxSize: 500,
  storage: createLocalStorageAdapter(),
})

// Collections using this transport automatically buffer offline mutations.
const client = createRealtimeClient({ transport })`}
      />
      <p>
        See <a href="#/docs/resilience">Resilience</a> for full offline queue
        options including IndexedDB storage and pending-count badges.
      </p>

      <h2 id="see-also">See also</h2>
      <ul>
        <li>
          <a href="#/docs/crdts">CRDTs</a> &mdash; field-level conflict
          resolution with LWW registers, PN-Counters, and OR-Sets
        </li>
        <li>
          <a href="#/docs/resilience">Resilience</a> &mdash; offline queue, gap
          recovery, and multi-tab coordination
        </li>
        <li>
          <a href="#/docs/scaling">Scaling to Production</a> &mdash; the
          PublishBackend interface for multi-process fan-out
        </li>
        <li>
          <a href="#/docs/error-reference">Error Reference</a> &mdash; handling
          ConflictError, subscribe errors, and flush errors
        </li>
      </ul>
    </article>
  )
}
