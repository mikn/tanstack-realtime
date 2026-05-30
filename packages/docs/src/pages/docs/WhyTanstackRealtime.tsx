import { CodeBlock } from '../../components/CodeBlock'

export function WhyTanstackRealtime() {
  return (
    <article className="doc-article">
      <h1>Why realtime.js</h1>
      <p className="doc-lead">
        Sync without a platform. Keep your backend, your database, and your
        deploy target &mdash; and skip the per-seat bill.
      </p>

      <h2 id="problem">The problem</h2>
      <p>
        Making server data update in real time usually means one of two things:
        adopting a managed platform &mdash; and with it a proprietary database,
        a query language, a hosting target, and a per-seat or per-connection
        pricing meter &mdash; or wiring up WebSockets, channels, cache
        invalidation, presence, and reconnection logic yourself.
      </p>
      <p>
        <code>realtime.js</code> is a third option: a freestanding,
        vendor-neutral library. There is no platform to adopt and no lock-in.
        Your Express/Hono routes, your Postgres, and your deploy target stay
        exactly where they are. You pay your own infra, not a usage meter.
        Annotate a server function, get live queries &mdash; everything else
        stays the same.
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
          <strong>CRDTs</strong> &mdash; LWW registers, PN-counters, OR-sets at
          field granularity for conflict-free concurrent editing.
        </li>
        <li>
          <strong>Pub/sub</strong> &mdash; raw channel events, append-only live
          channels, ephemeral channels with TTL.
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
        <code>realtime.js</code> is a sync layer, not a platform. It does not
        provide:
      </p>
      <ul>
        <li>
          A database &mdash; bring Postgres, MySQL, SQLite, or anything else
        </li>
        <li>
          Authentication &mdash; bring your own JWT, session, or API key system
        </li>
        <li>
          File storage, cron jobs, or search &mdash; use purpose-built tools
        </li>
        <li>
          Rich text CRDT &mdash; use{' '}
          <a href="#/docs/rich-text-crdts">
            Y.js with realtime.js as the transport
          </a>
        </li>
      </ul>
      <p>
        If you want all of those bundled together, a managed platform like
        Convex is designed for that. The trade-off is coupling to its database,
        query language, and pricing model &mdash; plus a per-seat or
        per-connection bill that grows with usage. With <code>realtime.js</code>{' '}
        you pay your own infra and nothing else. Both are reasonable choices
        depending on what you value.
      </p>

      <h2 id="what-needs-what">What needs what (honest capability matrix)</h2>
      <p>
        The whole point of the rebrand is credibility, so here is the honest
        breakdown. Most of <code>realtime.js</code> is fully vendor-neutral and
        works with any backend. One layer &mdash; auto-invalidating reactive
        server queries &mdash; currently ships a single engine adapter.
      </p>

      <h3 id="vendor-neutral">Vendor-neutral &mdash; works with any backend</h3>
      <p>
        These features make no assumptions about your server, database, ORM, or
        deploy target. Bring whatever you already run:
      </p>
      <ul>
        <li>
          <strong>Transports</strong> &mdash; four adapters ship today: SSE
          (receive-only HTTP), Centrifugo (WebSocket, presence + gap replay),
          Pusher/Soketi (managed or self-hosted, presence), and PartyKit (edge /
          Durable Objects, presence), plus a small{' '}
          <code>RealtimeTransport</code> interface for custom transports
          validated by <code>@realtimejs/adapter-conformance</code>. Swap one
          import; your collections and hooks don&rsquo;t change. See the{' '}
          <a href="#/docs/transports">per-provider capability matrix</a>.
        </li>
        <li>
          <strong>Live collections</strong> &mdash;{' '}
          <code>realtimeCollectionOptions</code> backed by any transport.
        </li>
        <li>
          <strong>Pub/sub channels</strong> &mdash; raw publish/subscribe,
          append-only live channels, ephemeral channels with TTL.
        </li>
        <li>
          <strong>Presence and typing indicators</strong> &mdash; online user
          lists, cursors, typing state. Presence needs server-held membership
          state, so it requires a presence-capable transport (Centrifugo,
          Pusher/Soketi, PartyKit, or a custom WebSocket); the receive-only SSE
          transport reports <code>presence: false</code>.
        </li>
        <li>
          <strong>Field-level CRDTs</strong> &mdash; LWW registers, PN-counters,
          and OR-sets. Merging happens on the client; your server just stores
          and relays.
        </li>
        <li>
          <strong>AI / stream channels</strong> &mdash; reduce-based streaming
          state from ordered event streams.
        </li>
        <li>
          <strong>Offline queue</strong>,{' '}
          <strong>multi-tab coordination</strong> (SharedWorker &rarr;
          BroadcastChannel &rarr; direct), and <strong>devtools</strong>.
        </li>
      </ul>

      <h3 id="reactive-queries-requirement">
        Reactive server queries &mdash; one built-in engine today
      </h3>
      <p>
        Auto-invalidating reactive queries (<code>createReactiveQueries</code>{' '}
        &mdash; the layer behind <code>realtime.query()</code>/
        <code>realtime.mutation()</code> that derives channels and invalidates
        affected queries automatically) currently ships{' '}
        <strong>one engine adapter</strong>:{' '}
        <code>@realtimejs/reactive-drizzle</code> (Drizzle ORM + Postgres).
      </p>
      <p>
        The reactive layer is <strong>pluggable</strong> via the{' '}
        <code>ReactiveQueryEngine</code> interface exported from core, so other
        ORMs and dialects can be supported by implementing that interface.
        Today, Drizzle/Postgres is the only built-in. If you use a different
        stack, the vendor-neutral primitives above (live collections, pub/sub,
        explicit channels) still work everywhere &mdash; you just wire
        invalidation yourself instead of getting it automatically.
      </p>

      <h3 id="known-limitations">Known limitations (stated honestly)</h3>
      <ul>
        <li>
          <strong>JOINs only track the primary table.</strong> Automatic
          multi-table reactivity covers separate <code>select().from()</code>{' '}
          reads. A SQL <code>JOIN</code> only captures the primary table &mdash;
          changes to joined tables won&rsquo;t auto-invalidate. Use the explicit
          channel/predicate escape hatch for queries that join.
        </li>
        <li>
          <strong>
            Distinct queries that derive the same channel can collide.
          </strong>{' '}
          Two different reactive queries that happen to derive the same channel
          key may interfere &mdash; a query sharing a channel key with another
          can miss updates. This is a known limitation tracked for a future fix;
          give colliding queries distinct args/channels for now.
        </li>
      </ul>

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
