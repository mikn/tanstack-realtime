import { CodeBlock } from '../../components/CodeBlock'

export function WhyTanstackRealtime() {
  return (
    <article className="doc-article">
      <h1>Why TanStack Realtime</h1>
      <p className="doc-lead">
        A sync layer that makes server functions reactive. You keep your
        database, your ORM, and your deploy target.
      </p>

      <h2 id="problem">The problem</h2>
      <p>
        Making server data update in real time usually means either adopting a
        managed platform (and its database, its query language, its pricing) or
        wiring up WebSockets, channels, cache invalidation, and reconnection
        logic yourself.
      </p>
      <p>
        TanStack Realtime is an alternative: annotate a server function, get
        live queries. Everything else stays the same.
      </p>

      <CodeBlock
        code={`// Before: a normal server function
export async function getTodos({ teamId }: { teamId: string }) {
  return db.select().from(todos).where(eq(todos.teamId, teamId))
}

// After: one wrapper, it's live
export const getTodos = realtime.query(async ({ teamId }: { teamId: string }) =>
  db.select().from(todos).where(eq(todos.teamId, teamId))
)`}
      />

      <h2 id="what-it-does">What it does</h2>
      <ul>
        <li>
          <strong>Reactive queries</strong> &mdash; channels derive from
          function arguments. Components sharing the same args share one
          connection and one cache.
        </li>
        <li>
          <strong>Optimistic mutations</strong> &mdash; declare cache updates
          alongside the mutation. Automatic rollback on error.
        </li>
        <li>
          <strong>Client-side queries</strong> &mdash; the returned collection
          works with <code>useLiveQuery</code> for filtering, sorting, and
          joining without extra server requests.
        </li>
        <li>
          <strong>Presence</strong> &mdash; cursors, typing indicators, online
          user lists.
        </li>
        <li>
          <strong>CRDTs</strong> &mdash; LWW registers, PN-counters, OR-sets
          at field granularity for conflict-free concurrent editing.
        </li>
        <li>
          <strong>Pub/sub</strong> &mdash; raw channel events, append-only
          live channels, ephemeral channels with TTL.
        </li>
        <li>
          <strong>Streaming</strong> &mdash; reduce-based state from ordered
          event streams with resumable HMAC checkpoints.
        </li>
        <li>
          <strong>Resilience</strong> &mdash; offline queue, gap recovery,
          multi-tab coordination via BroadcastChannel or SharedWorker.
        </li>
      </ul>

      <h2 id="what-it-doesnt">What it doesn&rsquo;t do</h2>
      <p>
        TanStack Realtime is a sync layer. It does not provide:
      </p>
      <ul>
        <li>A database &mdash; bring Postgres, MySQL, SQLite, or anything else</li>
        <li>Authentication &mdash; bring your own JWT, session, or API key system</li>
        <li>File storage, cron jobs, or search &mdash; use purpose-built tools</li>
        <li>Rich text CRDT &mdash; use{' '}
          <a href="#/docs/rich-text-crdts">Y.js with TanStack Realtime as the transport</a>
        </li>
      </ul>
      <p>
        If you want all of those bundled together, a managed platform like
        Convex is designed for that. The trade-off is coupling to its database,
        query language, and pricing model. Both are reasonable choices depending
        on what you value.
      </p>

      <h2 id="progressive">Progressive adoption</h2>
      <p>
        Features are additive. Start with a plain <code>queryFn</code>, add a{' '}
        <code>channel</code> for live updates, add <code>fields</code> for
        conflict resolution. Each step is one config key. Stop at any point.
      </p>
      <CodeBlock
        code={`// Step 1: just a query
realtimeCollectionOptions({
  queryFn: () => fetch('/api/todos').then(r => r.json()),
  getKey: (t) => t.id,
})

// Step 2: add a channel — it's live
realtimeCollectionOptions({
  queryFn: () => fetch('/api/todos').then(r => r.json()),
  getKey: (t) => t.id,
  client: realtimeClient,
  channel: ['todos', { projectId }],
})

// Step 3: add CRDTs — concurrent edits merge
realtimeCollectionOptions({
  // ...everything above
  fields: { title: 'lww', votes: 'pn-counter', tags: 'or-set' },
})`}
      />

      <h2 id="transport">Transport-agnostic</h2>
      <p>
        Application code doesn&rsquo;t reference the transport. Swap SSE for
        Centrifugo (or a custom WebSocket) by changing one import.
      </p>
      <CodeBlock
        code={`// SSE — zero infra, works behind corporate proxies
transport: sseTransport({ url: '/api/realtime' })

// Centrifugo — WebSocket, multi-node clustering, gap recovery
transport: centrifugoTransport({ url: 'wss://rt.example.com/connection/websocket' })`}
      />

      <h2 id="get-started">Get started</h2>
      <ul>
        <li>
          <a href="#/docs/getting-started">Getting Started</a> &mdash; five
          minute setup
        </li>
        <li>
          <a href="#/docs/tutorial">Tutorial</a> &mdash; build a task board
          end-to-end
        </li>
        <li>
          <a href="#/docs/choosing-a-pattern">Choosing a Pattern</a> &mdash;
          which hooks to use
        </li>
      </ul>
    </article>
  )
}
