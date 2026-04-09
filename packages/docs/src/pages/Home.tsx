import { CodeBlock } from '../components/CodeBlock'

function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="container">
        <span className="badge">v0.1 &middot; Alpha</span>
        <h1>
          Reactive queries.{' '}
          <span className="gradient-text">Any backend. Full control.</span>
        </h1>
        <p className="hero-sub">
          Wrap any server function with <code>realtime.query()</code> and every
          subscriber updates automatically. Pick your database, your ORM, your
          deployment. No lock-in, no new infrastructure.
        </p>

        <div className="hero-code">
          <CodeBlock
            code={`// Server — any database, any ORM
export const getTodos = realtime.query(async ({ teamId }: { teamId: string }) =>
  db.select().from(todos).where(eq(todos.teamId, teamId))
)

// Client — live across all components, zero channel config
const { data, collection } = useQuery(getTodos, { teamId }, { getKey: (t) => t.id })

// Filter client-side — no extra request needed
const { data: active } = useLiveQuery(
  (q) => q.from({ todos: collection }).where('done', '=', false),
  [collection],
)`}
          />
        </div>

        <div className="hero-actions">
          <a href="#/docs/getting-started" className="btn btn-primary">
            Get Started
          </a>
          <a href="#/docs/reactive-queries" className="btn btn-secondary">
            See the API
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
      title: 'Reactive server queries',
      desc: 'One annotation makes any server function live. Every component sharing the same query shares one fetch, one connection, and one cache. The returned collection composes with useLiveQuery for client-side filtering and sorting.',
      code: `const { data, collection } = useQuery(getTodos, { teamId }, {
  getKey: (t) => t.id,
})

// Filter client-side — no new server request needed
const { data: active } = useLiveQuery(
  (q) => q.from({ todos: collection }).where('done', '=', false),
  [collection],
)`,
    },
    {
      title: 'Optimistic mutations',
      desc: 'Declare optimistic updates alongside your mutation. The cache updates instantly and rolls back automatically on error — no manual state management.',
      code: `const { mutate } = useMutation(createTodo, {
  optimistic: (cache, args) => {
    cache.update(getTodos, { teamId: args.teamId }, prev => [
      ...(prev ?? []), { id: crypto.randomUUID(), ...args },
    ])
  },
})`,
    },
    {
      title: 'Presence & cursors',
      desc: "Show who's online, share cursor positions, and display live user activity — all over the same transport connection.",
      code: `const presenceOptions = presenceChannelOptions({
  client,
  channel: ['room', { roomId }],
  initialData: { cursor: { x: 0, y: 0 }, name: userName },
})`,
    },
    {
      title: 'AI token streaming',
      desc: 'Stream AI-generated content token-by-token with reduce-based state and resumable checkpoints.',
      code: `const streamOptions = streamChannelOptions({
  client,
  channel: ['ai', { promptId }],
  reduce: (state, token) => state + token,
  initial: '',
})`,
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
        <h2>Own your stack, keep the magic</h2>
        <p className="section-sub">
          The reactive-query developer experience &mdash; live updates,
          optimistic mutations, automatic invalidation &mdash; on a stack
          that&rsquo;s entirely yours.
        </p>

        <div className="positioning-grid">
          <div className="positioning-card positioning-good">
            <h3>Good fit</h3>
            <ul>
              <li>
                <strong>Full ownership</strong> &mdash; your database, auth, and
                deploy stay under your control
              </li>
              <li>
                Reactive queries and optimistic mutations with the same
                developer experience as fully managed solutions
              </li>
              <li>
                Live updates without polling, manual channel wiring, or
                infrastructure changes
              </li>
              <li>Presence, pub/sub, and collaborative features</li>
              <li>
                Swappable transports &mdash; SSE today, Centrifugo tomorrow
              </li>
            </ul>
          </div>

          <div className="positioning-card positioning-bad">
            <h3>Look elsewhere</h3>
            <ul>
              <li>
                <strong>Fully managed reactive backend</strong> &mdash; Convex
                bundles reactive queries, mutations, and a hosted database in
                one product. The trade-off is vendor lock-in and giving up your
                own Postgres. If that trade-off works for you, Convex is
                excellent. TanStack Realtime delivers the same reactive-query
                model on your own infrastructure.
              </li>
              <li>
                <strong>Postgres-to-client sync</strong> &mdash; ElectricSQL and
                PowerSync sync Postgres change streams directly to client
                collections (different architectural model)
              </li>
              <li>
                <strong>Rich text collaboration</strong> &mdash; Yjs/Hocuspocus
                are purpose-built; see our{' '}
                <a href="#/docs/rich-text-crdts">Y.js integration guide</a> for
                pairing with TanStack Realtime as the transport
              </li>
              <li>
                <strong>Polling is fine</strong> &mdash; TanStack Query with a{' '}
                <code>refetchInterval</code> is simpler when sub-second latency
                is not required
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
            <h3>Make a query reactive</h3>
            <CodeBlock
              code={`// Server — wrap your existing query with realtime.query()
export const getTodos = realtime.query(async ({ teamId }: { teamId: string }) =>
  db.select().from(todos).where(eq(todos.teamId, teamId))
)

// Client — useQuery keeps data live automatically
import { useQuery } from '@tanstack/react-realtime'
import { getTodos } from '../server/todos'

function TodoList({ teamId }: { teamId: string }) {
  const { data, isPending } = useQuery(getTodos, { teamId }, {
    getKey: (t) => t.id,
  })
  if (isPending) return <p>Loading…</p>
  return <ul>{data.map(t => <li key={t.id}>{t.title}</li>)}</ul>
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
        <h2>Fits right in</h2>
        <p className="section-sub">
          Designed to compose with the TanStack tools you already use.
        </p>
        <div className="ecosystem-grid">
          <div className="eco-card">
            <h3>TanStack DB</h3>
            <p>
              Each <code>useQuery</code> collection is a live TanStack DB
              Collection &mdash; composable with <code>useLiveQuery</code> for
              client-side filtering, sorting, and multi-collection joins.
            </p>
          </div>
          <div className="eco-card">
            <h3>TanStack Query</h3>
            <p>
              Use alongside Realtime for data that doesn&rsquo;t need a live
              channel. Both can coexist in the same app.
            </p>
          </div>
          <div className="eco-card">
            <h3>TanStack Store</h3>
            <p>
              Connection status, queue state, and collection data all expose
              reactive stores.
            </p>
          </div>
          <div className="eco-card">
            <h3>TanStack Start</h3>
            <p>
              Deep integration via <code>withServerFns</code>: server functions
              become collection callbacks with full type safety end-to-end.
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
