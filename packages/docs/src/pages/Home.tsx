import { CodeBlock } from '../components/CodeBlock'

function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="container">
        <span className="badge">v0.1 &middot; Alpha</span>
        <h1>
          Ship real-time apps.{' '}
          <span className="gradient-text">Keep your entire stack.</span>
        </h1>
        <p className="hero-sub">
          The fully managed DX &mdash; live queries, optimistic mutations,
          presence &mdash; without giving up Postgres, your ORM, or where you
          deploy. Add one annotation to a server function and every subscriber
          updates automatically.
        </p>

        <div className="hero-code">
          <CodeBlock
            code={`// 1. Write a normal server function — any database, any ORM
export const getTodos = realtime.query(async ({ teamId }: { teamId: string }) =>
  db.select().from(todos).where(eq(todos.teamId, teamId))
)

// 2. Use it on the client — that's it, it's live
const { data } = useQuery(getTodos, { teamId }, { getKey: (t) => t.id })

// 3. Mutate with instant optimistic UI
const { mutate } = useMutation(createTodo, {
  optimistic: (cache, args) => {
    cache.update(getTodos, { teamId: args.teamId }, prev => [
      ...(prev ?? []), { id: crypto.randomUUID(), ...args },
    ])
  },
})`}
          />
        </div>

        <div className="hero-actions">
          <a href="#/docs/tutorial" className="btn btn-primary">
            Build a Task Board
          </a>
          <a href="#/docs/getting-started" className="btn btn-secondary">
            Quick Start
          </a>
          <a href="#/docs/why" className="btn btn-secondary">
            Why TanStack Realtime?
          </a>
        </div>
        <div className="hero-install">
          <code>npm i @tanstack/realtime @tanstack/react-realtime</code>
          <p className="hero-install-alt">
            Also available for <a href="#/docs/solid-primitives">Solid</a> and{' '}
            <a href="#/docs/vue-composables">Vue</a>
          </p>
        </div>
      </div>
    </section>
  )
}

function WhatYouCanBuild() {
  const useCases = [
    {
      title: 'Dashboards that stay current',
      desc: 'Turn any server function into a live query with one annotation. Every component sharing the same arguments shares one connection. Filter and sort client-side without extra server requests.',
      code: `// Server: one annotation → live
export const getIssues = realtime.query(async ({ projectId }) =>
  db.select().from(issues).where(eq(issues.projectId, projectId))
)

// Client: always up to date
const { data } = useQuery(getIssues, { projectId }, { getKey: (i) => i.id })`,
    },
    {
      title: 'Forms with instant feedback',
      desc: 'Mutations update the UI before the server responds. On error, the optimistic update rolls back automatically. No manual state management.',
      code: `const { mutate } = useMutation(createIssue, {
  optimistic: (cache, args) => {
    cache.update(getIssues, { projectId: args.projectId }, prev => [
      ...(prev ?? []), { id: crypto.randomUUID(), ...args },
    ])
  },
})
// Click → instant UI update → server confirms → done`,
    },
    {
      title: 'Collaborative features',
      desc: "Show who's viewing a document, share cursor positions, display typing indicators — all over the same connection, no extra infrastructure.",
      code: `// Who is here right now?
const { others } = usePresence(roomPresence, {
  initialData: { cursor: { x: 0, y: 0 }, name: userName },
})

// Render live cursors
{others.map(u => <Cursor key={u.id} position={u.data.cursor} name={u.data.name} />)}`,
    },
    {
      title: 'AI streaming & real-time feeds',
      desc: 'Stream AI tokens, activity feeds, or progress updates with reduce-based state and resumable checkpoints.',
      code: `// AI token stream — builds up the response incrementally
const { state, status } = useStream(aiStream, {
  initial: '',
  reduce: (text, token) => text + token,
})

// state = "The answer is..." (growing in real time)`,
    },
  ]

  return (
    <section id="use-cases" className="section">
      <div className="container">
        <h2>What you can build</h2>
        <p className="section-sub">
          Concrete patterns, each a few lines of config.
        </p>
        <div className="use-cases-grid">
          {useCases.map((uc) => (
            <div key={uc.title} className="use-case-card">
              <h3>{uc.title}</h3>
              <p>{uc.desc}</p>
              <CodeBlock code={uc.code} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Spectrum() {
  return (
    <section id="spectrum" className="section section-alt">
      <div className="container">
        <h2>Adopt one config key at a time</h2>
        <p className="section-sub">
          Start with a plain <code>queryFn</code>. Add <code>channel</code> when
          you&rsquo;re ready for live updates. Add <code>fields</code> when you
          need conflict resolution. Stop at any point &mdash; no rewrites.
        </p>

        <div className="spectrum-steps">
          <div className="spectrum-step">
            <div className="spectrum-step-header">
              <span className="step-number">1</span>
              <div>
                <h4>Server-only</h4>
                <p>Just a queryFn. No live connection, no client.</p>
              </div>
            </div>
            <CodeBlock
              code={`realtimeCollectionOptions({
  queryFn: () => fetch('/api/todos').then(r => r.json()),
  getKey: (t) => t.id,
})`}
            />
          </div>

          <div className="spectrum-step active">
            <div className="spectrum-step-header">
              <span className="step-number">2</span>
              <div>
                <h4>+ Channel &mdash; go live</h4>
                <p>Every mutation is broadcast to all subscribers.</p>
              </div>
            </div>
            <CodeBlock
              code={`realtimeCollectionOptions({
  // ...queryFn, getKey
  client: realtimeClient,
  channel: ['todos', { projectId }],
})`}
            />
          </div>

          <div className="spectrum-step">
            <div className="spectrum-step-header">
              <span className="step-number">3</span>
              <div>
                <h4>+ Fields &mdash; conflict-free</h4>
                <p>Concurrent edits merge automatically with CRDTs.</p>
              </div>
            </div>
            <CodeBlock
              code={`realtimeCollectionOptions({
  // ...everything above
  fields: {
    title: 'lww',        // last-writer-wins
    votes: 'pn-counter', // concurrent increments add up
    tags:  'or-set',     // add always wins over remove
  },
})`}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Positioning() {
  return (
    <section id="when-to-use" className="section">
      <div className="container">
        <h2>The managed DX, without the managed platform</h2>
        <p className="section-sub">
          Platforms like Convex proved that reactive queries, optimistic
          mutations, and automatic invalidation are the right developer
          experience. TanStack Realtime brings that same experience to any
          backend you already know.
        </p>

        <div className="positioning-grid">
          <div className="positioning-card positioning-good">
            <h3>What you get</h3>
            <ul>
              <li>
                <strong>Same reactive DX</strong> &mdash; live queries,
                optimistic mutations, and automatic cache invalidation
                &mdash; the features that make managed platforms feel magical
              </li>
              <li>
                <strong>Use what you know</strong> &mdash; Postgres, MySQL,
                Drizzle, Prisma, any ORM, any auth. No new query language, no
                proprietary database, no dashboard to learn
              </li>
              <li>
                <strong>Deploy anywhere</strong> &mdash; Vercel, Fly, Railway,
                your own VPS, edge runtimes. Your infra choices stay yours
              </li>
              <li>
                <strong>Grow without ceilings</strong> &mdash; no per-function
                pricing, no opaque rate limits. Scale with the tools you already
                understand
              </li>
              <li>
                <strong>Collaborate live</strong> &mdash; presence, CRDTs,
                pub/sub, AI streaming, and tick-based sync are all built in
              </li>
            </ul>
          </div>

          <div className="positioning-card positioning-neutral">
            <h3>Honest trade-offs</h3>
            <ul>
              <li>
                <strong>More setup than a managed platform</strong> &mdash; you
                bring a database and a server. This takes ~5 minutes with
                TanStack Start + Drizzle, but it is not zero-config. The payoff
                is that nothing is hidden from you.
              </li>
              <li>
                <strong>Managed platforms bundle more</strong> &mdash; Convex
                includes a database, file storage, cron jobs, and auth in one
                product. TanStack Realtime is the sync layer &mdash; you compose
                it with the tools you choose for everything else.
              </li>
              <li>
                <strong>Postgres-to-client sync</strong> &mdash; if you want
                change-stream replication (not server functions), see ElectricSQL
                or PowerSync &mdash; different architecture, different
                trade-offs.
              </li>
              <li>
                <strong>Rich text collaboration</strong> &mdash; Yjs is
                purpose-built; see our{' '}
                <a href="#/docs/rich-text-crdts">Y.js integration guide</a> for
                pairing it with TanStack Realtime as the transport.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  const groups = [
    {
      label: 'Core',
      features: [
        {
          title: 'Reactive queries & mutations',
          desc: 'Wrap server functions with realtime.query(). Channels derived automatically. Optimistic mutations with declarative rollback.',
        },
        {
          title: 'Composable collections',
          desc: 'useQuery returns a live TanStack DB Collection. Pass it to useLiveQuery for client-side filtering, sorting, and joining — no extra server requests.',
        },
        {
          title: 'Presence & pub/sub',
          desc: "Track who's online, share cursor positions, and broadcast messages across subscribers.",
        },
        {
          title: 'Conflict-free data types',
          desc: 'LWW registers, PN-counters, and OR-sets. Concurrent edits merge automatically.',
        },
      ],
    },
    {
      label: 'Advanced',
      features: [
        {
          title: 'AI streaming',
          desc: 'Ordered, resumable streams with reduce-based state and HMAC-signed checkpoints.',
        },
        {
          title: 'Tick-based sync',
          desc: 'Delta-compressed 60 Hz updates for game state, simulations, and high-frequency data.',
        },
        {
          title: 'Ephemeral channels',
          desc: 'Auto-expiring events like typing indicators, emoji reactions, and toasts with configurable TTL.',
        },
      ],
    },
    {
      label: 'Developer experience',
      features: [
        {
          title: 'Transport-agnostic',
          desc: 'SSE or Centrifugo (WebSocket). Swap transports without changing application code.',
        },
        {
          title: 'Type-safe end to end',
          desc: 'TypeScript flows from server function signature through channel keys to CRDT field definitions — no codegen needed.',
        },
        {
          title: 'Offline & multi-tab',
          desc: 'Offline queue buffers mutations. Coordinated transport shares one connection across tabs.',
        },
        {
          title: 'DevTools',
          desc: 'Inspect active channels, message logs, connection state, presence, and offline queue in a floating panel.',
        },
        {
          title: 'React, Solid & Vue',
          desc: 'First-class adapters with framework-native internals. Same hooks/composables, same signatures.',
        },
      ],
    },
  ]

  return (
    <section id="features" className="section section-alt">
      <div className="container">
        <h2>Features</h2>
        {groups.map((group) => (
          <div key={group.label} className="feature-group">
            <h3 className="feature-group-label">{group.label}</h3>
            <div className="features-grid">
              {group.features.map((f) => (
                <div key={f.title} className="feature-card">
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function QuickStart() {
  return (
    <section id="quickstart" className="section">
      <div className="container">
        <h2>Quick start</h2>

        <div className="quickstart-steps">
          <div className="qs-step">
            <div className="qs-number">1</div>
            <h3>Install</h3>
            <CodeBlock
              code={`npm i @tanstack/realtime @tanstack/react-realtime`}
            />
          </div>

          <div className="qs-step">
            <div className="qs-number">2</div>
            <h3>Create a client</h3>
            <CodeBlock
              code={`import { createRealtimeClient } from '@tanstack/realtime'
import { sseTransport } from '@tanstack/realtime-adapter-sse'
import { RealtimeProvider } from '@tanstack/react-realtime'

const client = createRealtimeClient({
  transport: sseTransport({ url: '/api/realtime' }),
})

function App() {
  return (
    <RealtimeProvider client={client}>
      <YourApp />
    </RealtimeProvider>
  )
}`}
            />
          </div>

          <div className="qs-step">
            <div className="qs-number">3</div>
            <h3>Query and mutate &mdash; it&rsquo;s live</h3>
            <CodeBlock
              code={`// Server — one annotation makes your function reactive
export const getTodos = realtime.query(async ({ teamId }: { teamId: string }) =>
  db.select().from(todos).where(eq(todos.teamId, teamId))
)
export const addTodo = realtime.mutation(
  async ({ teamId, title }: { teamId: string; title: string }) => {
    const [todo] = await db.insert(todos).values({ teamId, title, done: false }).returning()
    return todo
  }
)

// Client — live data + optimistic mutations
function TodoList({ teamId }: { teamId: string }) {
  const { data } = useQuery(getTodos, { teamId }, { getKey: (t) => t.id })
  const { mutate } = useMutation(addTodo, {
    optimistic: (cache, args) => {
      cache.update(getTodos, { teamId: args.teamId }, prev => [
        ...(prev ?? []), { id: crypto.randomUUID(), title: args.title, done: false },
      ])
    },
  })
  // Click Add in one tab → it appears instantly in every tab
  return (
    <>
      <ul>{data?.map(t => <li key={t.id}>{t.title}</li>)}</ul>
      <button onClick={() => mutate({ teamId, title: 'New todo' })}>Add</button>
    </>
  )
}`}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Ecosystem() {
  return (
    <section className="section section-alt">
      <div className="container ecosystem-section">
        <h2>Composable by design</h2>
        <p className="section-sub">
          TanStack Realtime is a sync layer, not a platform. It composes with
          tools you already know &mdash; and with the TanStack ecosystem for
          deeper integration.
        </p>
        <div className="ecosystem-grid">
          <div className="eco-card">
            <h3>Client-side queries</h3>
            <p>
              Every live query returns a{' '}
              <a href="https://tanstack.com/db" target="_blank" rel="noopener">
                TanStack DB
              </a>{' '}
              Collection. Filter, sort, and join data on the client without extra
              server requests &mdash; like a reactive in-memory database.
            </p>
          </div>
          <div className="eco-card">
            <h3>Incremental adoption</h3>
            <p>
              Already using{' '}
              <a href="https://tanstack.com/query" target="_blank" rel="noopener">
                TanStack Query
              </a>
              ? Keep it for data that doesn&rsquo;t need live updates. Both
              coexist in the same app &mdash; adopt Realtime for the queries
              that matter.
            </p>
          </div>
          <div className="eco-card">
            <h3>Full-stack type safety</h3>
            <p>
              With{' '}
              <a href="https://tanstack.com/start" target="_blank" rel="noopener">
                TanStack Start
              </a>
              , types flow from your database schema through server functions to
              client hooks &mdash; no codegen, no manual interfaces.
            </p>
          </div>
          <div className="eco-card">
            <h3>Any backend</h3>
            <p>
              Not using TanStack Start? Connect any REST API, any framework.
              Realtime is transport-level &mdash; it works with Express, Hono,
              Fastify, or plain fetch handlers.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Community() {
  return (
    <section className="section">
      <div className="container">
        <h2>Built for the community</h2>
        <p className="section-sub">
          TanStack Realtime is MIT-licensed and community-driven. Join the
          conversation on{' '}
          <a
            href="https://github.com/mikn/tanstack-realtime"
            target="_blank"
            rel="noopener"
          >
            GitHub
          </a>{' '}
          or{' '}
          <a
            href="https://discord.com/invite/WrRKjPJ"
            target="_blank"
            rel="noopener"
          >
            Discord
          </a>
          .
        </p>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="logo-tan">TanStack</span>{' '}
          <span className="logo-realtime">Realtime</span>
          <p>Reactive queries. Any backend. Full control.</p>
        </div>
        <div className="footer-links">
          <div>
            <h4>Library</h4>
            <a href="#features">Features</a>
            <a href="#spectrum">Progressive Adoption</a>
            <a href="#quickstart">Quick Start</a>
            <a href="#/docs/getting-started">Docs</a>
          </div>
          <div>
            <h4>Community</h4>
            <a
              href="https://github.com/mikn/tanstack-realtime"
              target="_blank"
              rel="noopener"
            >
              GitHub
            </a>
            <a
              href="https://discord.com/invite/WrRKjPJ"
              target="_blank"
              rel="noopener"
            >
              Discord
            </a>
          </div>
          <div>
            <h4>Ecosystem</h4>
            <a href="https://tanstack.com/query" target="_blank" rel="noopener">
              TanStack Query
            </a>
            <a href="https://tanstack.com/db" target="_blank" rel="noopener">
              TanStack DB
            </a>
            <a href="https://tanstack.com/store" target="_blank" rel="noopener">
              TanStack Store
            </a>
            <a href="https://tanstack.com/start" target="_blank" rel="noopener">
              TanStack Start
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} mikn. MIT License. Not an official
            TanStack project.
          </p>
        </div>
      </div>
    </footer>
  )
}

export function Home() {
  return (
    <>
      <Hero />
      <WhatYouCanBuild />
      <Spectrum />
      <Positioning />
      <Features />
      <QuickStart />
      <Ecosystem />
      <Community />
      <Footer />
    </>
  )
}
