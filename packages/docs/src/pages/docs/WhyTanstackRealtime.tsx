import { CodeBlock } from '../../components/CodeBlock'

export function WhyTanstackRealtime() {
  return (
    <article className="doc-article">
      <h1>Why TanStack Realtime</h1>
      <p className="doc-lead">
        Managed platforms proved that reactive queries, optimistic mutations, and
        automatic invalidation are the right developer experience. TanStack
        Realtime brings that experience to the tools you already know &mdash;
        without moving your data to someone else&rsquo;s database.
      </p>

      <h2 id="the-case">The case in 30 seconds</h2>
      <p>
        You shouldn&rsquo;t have to choose between &ldquo;great DX&rdquo; and
        &ldquo;own your stack.&rdquo; TanStack Realtime is a sync layer. It
        makes your existing server functions reactive and adds presence, CRDTs,
        and pub/sub &mdash; without replacing your database, your ORM, your
        auth, or your deploy target.
      </p>

      <div className="doc-callout">
        <p>
          <strong>One annotation, live data:</strong>
        </p>
        <CodeBlock
          code={`// This is a normal Drizzle query. Adding realtime.query() makes it live.
export const getTasks = realtime.query(async ({ projectId }) =>
  db.select().from(tasks).where(eq(tasks.projectId, projectId))
)

// Every component calling useQuery(getTasks, { projectId }) shares one
// connection, one cache, and updates automatically when any client mutates.`}
        />
      </div>

      <h2 id="vs-managed">Compared to managed platforms</h2>
      <p>
        Convex, Firebase, and Supabase Realtime are excellent products. They
        bundle a database, auth, storage, and realtime into one hosted platform.
        The question is whether that bundle is the right trade-off for your
        project.
      </p>

      <table className="api-table">
        <thead>
          <tr>
            <th></th>
            <th>Managed platform (e.g. Convex)</th>
            <th>TanStack Realtime</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Database</strong></td>
            <td>Proprietary, hosted by the vendor</td>
            <td>Your Postgres, MySQL, SQLite &mdash; any database</td>
          </tr>
          <tr>
            <td><strong>Query language</strong></td>
            <td>Vendor-specific API</td>
            <td>Your ORM (Drizzle, Prisma, Kysely, raw SQL)</td>
          </tr>
          <tr>
            <td><strong>Live queries</strong></td>
            <td>Built-in, automatic</td>
            <td>Built-in, automatic (one annotation on server functions)</td>
          </tr>
          <tr>
            <td><strong>Optimistic mutations</strong></td>
            <td>Built-in</td>
            <td>Built-in, with declarative rollback</td>
          </tr>
          <tr>
            <td><strong>Type safety</strong></td>
            <td>End-to-end with codegen</td>
            <td>End-to-end without codegen (phantom types)</td>
          </tr>
          <tr>
            <td><strong>Auth</strong></td>
            <td>Bundled (vendor-specific)</td>
            <td>Bring your own (any JWT, session, or API key system)</td>
          </tr>
          <tr>
            <td><strong>Presence</strong></td>
            <td>Varies (some platforms, not all)</td>
            <td>First-class: cursors, typing indicators, online lists</td>
          </tr>
          <tr>
            <td><strong>CRDTs</strong></td>
            <td>Not typically available</td>
            <td>
              Built-in: LWW registers, PN-counters, OR-sets at field
              granularity
            </td>
          </tr>
          <tr>
            <td><strong>AI streaming</strong></td>
            <td>Possible but not purpose-built</td>
            <td>
              Purpose-built: reduce-based streams with HMAC checkpoints
            </td>
          </tr>
          <tr>
            <td><strong>Deploy</strong></td>
            <td>Vendor cloud only (or self-host if open source)</td>
            <td>Anywhere: Vercel, Fly, Railway, Cloudflare, bare metal</td>
          </tr>
          <tr>
            <td><strong>Pricing</strong></td>
            <td>Per-function-call + storage + egress</td>
            <td>Free (MIT). Pay only for your own infra</td>
          </tr>
          <tr>
            <td><strong>Initial setup</strong></td>
            <td>Fastest &mdash; zero infrastructure decisions</td>
            <td>~5 minutes &mdash; you bring a database and a server</td>
          </tr>
        </tbody>
      </table>

      <h2 id="same-dx">Same developer experience, your infrastructure</h2>
      <p>
        The features that make managed platforms feel magical are not unique to
        managed platforms. Here&rsquo;s side-by-side code showing the same
        reactive pattern:
      </p>

      <h3>Managed platform</h3>
      <CodeBlock
        code={`// Convex-style: query defined in convex/ folder, proprietary DB
export const getTasks = query({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .filter(q => q.eq(q.field("projectId"), args.projectId))
      .collect()
  },
})

// Client
const tasks = useQuery(api.tasks.getTasks, { projectId })`}
      />

      <h3>TanStack Realtime</h3>
      <CodeBlock
        code={`// Your server function, your database, your ORM
export const getTasks = realtime.query(
  async ({ projectId }: { projectId: string }) =>
    db.select().from(tasks).where(eq(tasks.projectId, projectId))
)

// Client — same reactive pattern, same automatic updates
const { data } = useQuery(getTasks, { projectId }, { getKey: (t) => t.id })`}
      />
      <p>
        The developer experience is comparable. The difference is what&rsquo;s
        underneath: your Postgres, your Drizzle query, your server.
      </p>

      <h2 id="beyond">What TanStack Realtime adds beyond basic reactivity</h2>
      <p>
        Most managed platforms stop at live queries and mutations. TanStack
        Realtime includes primitives that are typically separate products:
      </p>

      <h3>Conflict-free concurrent editing</h3>
      <p>
        Built-in CRDTs at the field level. Two users editing the same row
        concurrently? Fields merge automatically &mdash; no conflict dialogs, no
        last-write-wins-and-loses-data.
      </p>
      <CodeBlock
        code={`realtimeCollectionOptions({
  // ...
  fields: {
    title: 'lww',         // last-writer-wins with Lamport clocks
    votes: 'pn-counter',  // concurrent votes add up correctly
    tags:  'or-set',      // add always wins over concurrent remove
  },
})`}
      />

      <h3>Client-side queries on live data</h3>
      <p>
        Every live query returns a TanStack DB Collection. Filter, sort, and
        join entirely on the client &mdash; zero extra server requests.
      </p>
      <CodeBlock
        code={`// One server query, three filtered views
const { collection } = useQuery(getTasks, { projectId }, { getKey: (t) => t.id })

const { data: todo } = useLiveQuery(
  (q) => q.from({ tasks: collection }).where('status', '=', 'todo'), [collection]
)
const { data: doing } = useLiveQuery(
  (q) => q.from({ tasks: collection }).where('status', '=', 'in-progress'), [collection]
)
const { data: done } = useLiveQuery(
  (q) => q.from({ tasks: collection }).where('status', '=', 'done'), [collection]
)`}
      />

      <h3>Transport flexibility</h3>
      <p>
        Start with SSE (zero infrastructure, works behind corporate proxies).
        Upgrade to Centrifugo (WebSocket, multi-node clustering) when you need
        it. Your application code doesn&rsquo;t change.
      </p>
      <CodeBlock
        code={`// Day one: SSE (zero infra)
transport: sseTransport({ url: '/api/realtime' })

// Later: Centrifugo (WebSocket, clustering, gap recovery)
transport: centrifugoTransport({ url: 'wss://rt.yourapp.com/connection/websocket' })`}
      />

      <h3>Resilience built in</h3>
      <p>
        Offline queue, gap recovery on reconnect, multi-tab coordination &mdash;
        these are not add-ons, they are part of the core.
      </p>

      <h2 id="greenfield">For greenfield projects specifically</h2>
      <p>
        If you&rsquo;re starting a new project and evaluating options, here is
        the honest framing:
      </p>
      <ul>
        <li>
          <strong>A managed platform gets you to &ldquo;hello world&rdquo;
          faster</strong> &mdash; there is no database to provision, no ORM to
          configure. That&rsquo;s a real advantage for prototyping.
        </li>
        <li>
          <strong>TanStack Realtime gets you to &ldquo;production&rdquo;
          without ceilings</strong> &mdash; you never hit a moment where your
          query is too complex for the vendor&rsquo;s API, your pricing tier
          doesn&rsquo;t support your usage pattern, or your compliance
          requirements conflict with hosted data.
        </li>
      </ul>
      <p>
        The initial ~5 minutes of setup (database + server handler + client
        provider) buys you:
      </p>
      <ul>
        <li>Full SQL access &mdash; window functions, CTEs, joins, subqueries</li>
        <li>Your choice of hosting &mdash; no vendor region restrictions</li>
        <li>Transparent pricing &mdash; pay for a database and a server, not per-function-call</li>
        <li>Portable skills &mdash; Postgres and Drizzle are reusable everywhere</li>
        <li>Composability &mdash; use any auth library, any file storage, any cron system</li>
      </ul>

      <h2 id="not-right-fit">When TanStack Realtime is not the right fit</h2>
      <p>
        We believe in being honest about trade-offs:
      </p>
      <ul>
        <li>
          <strong>You want zero server management</strong> &mdash; if you want
          a single product that handles database, auth, storage, cron, and
          realtime with no infrastructure decisions, a managed platform is
          simpler. That simplicity has a real cost (vendor coupling, pricing
          ceilings), but it&rsquo;s a valid trade-off.
        </li>
        <li>
          <strong>Postgres change stream replication</strong> &mdash; if you
          want WAL-level sync from Postgres to the client (not server
          functions), see ElectricSQL or PowerSync. Different architecture,
          complementary to TanStack Realtime.
        </li>
        <li>
          <strong>Rich text collaboration</strong> &mdash; Yjs and Hocuspocus
          are purpose-built for document editing. TanStack Realtime works as a{' '}
          <a href="#/docs/rich-text-crdts">transport layer for Y.js</a>, but
          doesn&rsquo;t replace it.
        </li>
      </ul>

      <h2 id="get-started">Ready to try it?</h2>
      <ul>
        <li>
          <a href="#/docs/tutorial">
            <strong>Tutorial</strong>
          </a>{' '}
          &mdash; build a collaborative task board in 15 minutes
        </li>
        <li>
          <a href="#/docs/getting-started">
            <strong>Getting Started</strong>
          </a>{' '}
          &mdash; the minimal 5-minute setup
        </li>
        <li>
          <a href="#/docs/choosing-a-pattern">
            <strong>Choosing a Pattern</strong>
          </a>{' '}
          &mdash; which hooks to use for your use case
        </li>
      </ul>
    </article>
  )
}
