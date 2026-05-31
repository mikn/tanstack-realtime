import { CodeBlock } from '../components/CodeBlock'

function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="container">
        <span className="badge">
          v0.1 &middot; Experimental &middot; pre-1.0
        </span>
        <h1>
          <span className="logo-tan">realtime</span>
          <span className="gradient-text">.js</span>
        </h1>
        <p className="hero-tagline">Bring your own backend.</p>
        <p className="hero-sub">
          The kitchen sink you actually need for proper realtime &mdash; sync,
          presence, CRDTs, and offline &mdash; with no platform and no per-seat
          bill. Keep your server, your database, your deploy target.
        </p>

        <div className="hero-code">
          <CodeBlock
            code={`// Server — wrap any query. Channels derive from args automatically.
export const getTodos = realtime.query(async ({ teamId }: { teamId: string }) =>
  db.select().from(todos).where(eq(todos.teamId, teamId))
)

// Client — live. Components sharing the same args share one connection.
const { data, collection } = useQuery(getTodos, { teamId }, {
  getKey: (t) => t.id,
})`}
          />
        </div>

        <div className="hero-actions">
          <a href="#/docs/getting-started" className="btn btn-primary">
            Get Started
          </a>
          <a href="#/docs/tutorial" className="btn btn-secondary">
            Tutorial
          </a>
        </div>
        <div className="hero-install">
          <code>npm i @realtimejs/core @realtimejs/react</code>
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
      title: 'Reactive queries',
      desc: 'One annotation makes a server function live. Components sharing the same args share one connection.',
      code: `const { data, collection } = useQuery(getTodos, { teamId }, {
  getKey: (t) => t.id,
})

// Client-side filter — no extra fetch
const { data: active } = useLiveQuery(
  (q) => q.from({ todos: collection }).where('done', '=', false),
  [collection],
)`,
    },
    {
      title: 'Optimistic mutations',
      desc: 'Cache updates instantly, rolls back on error.',
      code: `const { mutate } = useMutation(createTodo, {
  optimistic: (cache, args) => {
    cache.update(getTodos, { teamId: args.teamId }, prev => [
      ...(prev ?? []), { id: crypto.randomUUID(), ...args },
    ])
  },
})`,
    },
    {
      title: 'Presence',
      desc: 'Who is online, cursor positions, typing indicators. Needs a presence-capable transport (Centrifugo, Pusher, PartyKit).',
      code: `const { others } = usePresence(roomPresence, {
  params: { roomId },
  initial: { cursor: { x: 0, y: 0 }, name },
})`,
    },
    {
      title: 'Streaming',
      desc: 'Reduce-based state from ordered event streams. Resumable with HMAC checkpoints.',
      code: `const aiStream = createStreamChannel({
  id: 'ai',
  channel: (p: { requestId: string }) => ['ai', p],
  initial: { content: '' },
  reduce: (s, e: { token?: string }) => ({ content: s.content + (e.token ?? '') }),
})

const { state, status } = useStream(aiStream, { params: { requestId } })`,
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
        <h2>What this is (and isn&rsquo;t)</h2>
        <p className="section-sub">
          <code>realtime.js</code> is a sync layer. It makes server functions
          reactive and adds presence, CRDTs, and pub/sub. It is not a database,
          not a hosting platform, and not a full backend &mdash; bring your own.
        </p>

        <div className="positioning-grid">
          <div className="positioning-card positioning-good">
            <h3>Good fit</h3>
            <ul>
              <li>
                You have a database and want to make queries reactive without
                changing your stack
              </li>
              <li>
                You want live updates, optimistic mutations, and automatic cache
                invalidation
              </li>
              <li>You need presence, pub/sub, or collaborative editing</li>
              <li>
                You want to choose your own database, ORM, auth, and deploy
                target
              </li>
            </ul>
          </div>

          <div className="positioning-card positioning-neutral">
            <h3>Look elsewhere</h3>
            <ul>
              <li>
                <strong>Want a managed backend?</strong> Convex bundles a
                database, auth, and realtime in one product. Less to configure,
                more to give up. Both are valid.
              </li>
              <li>
                <strong>Postgres change streams?</strong> ElectricSQL and
                PowerSync replicate at the WAL level. Different architecture.
              </li>
              <li>
                <strong>Rich text?</strong> Yjs is purpose-built.{' '}
                <code>realtime.js</code> works as a{' '}
                <a href="#/docs/rich-text-crdts">transport for Y.js</a>, not a
                replacement.
              </li>
              <li>
                <strong>Polling is fine?</strong> TanStack Query with{' '}
                <code>refetchInterval</code> is simpler when sub-second latency
                isn&rsquo;t needed.
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
          desc: 'SSE, Centrifugo, Pusher/Soketi, or PartyKit. Swap transports without changing application code.',
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

function Transports() {
  const transports = [
    {
      title: 'SSE',
      tag: 'Serverless-friendly',
      desc: 'Receive-only HTTP. Works behind every proxy and CDN, runs on edge and serverless. The TanStack Start preset uses it under the hood. No presence — pair it with a provider for that.',
    },
    {
      title: 'Centrifugo',
      tag: 'Self-hosted scale',
      desc: 'WebSocket server you run. Bidirectional, with presence and gap replay built in. Scales across nodes natively.',
    },
    {
      title: 'Pusher / Soketi',
      tag: 'Managed or self-hosted',
      desc: 'Hosted Pusher with zero servers, or self-host Soketi (Pusher-protocol compatible). Presence via presence channels.',
    },
    {
      title: 'PartyKit',
      tag: 'Edge / Durable Objects',
      desc: 'Cloudflare Durable Objects at the edge. Bidirectional with presence; you deploy a small PartyKit server.',
    },
  ]
  return (
    <section id="transports" className="section">
      <div className="container">
        <h2>Bring your own transport</h2>
        <p className="section-sub">
          Four adapters ship today. Application code never references the
          transport &mdash; swap one import and your collections, hooks, and
          channels keep working. SSE handles the connection; for presence and
          multi-instance fan-out, reach for a provider or add a{' '}
          <code>PublishBackend</code>. See the{' '}
          <a href="#/docs/transports">capability matrix</a> for the honest
          per-provider breakdown.
        </p>
        <div className="features-grid">
          {transports.map((t) => (
            <div key={t.title} className="feature-card">
              <h3>{t.title}</h3>
              <p>
                <strong>{t.tag}.</strong> {t.desc}
              </p>
            </div>
          ))}
        </div>
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
            <CodeBlock code={`npm i @realtimejs/core @realtimejs/react`} />
          </div>

          <div className="qs-step">
            <div className="qs-number">2</div>
            <h3>Create a client</h3>
            <CodeBlock
              code={`import { createRealtimeClient } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'
import { RealtimeProvider } from '@realtimejs/react'

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
        <h2>Ecosystem</h2>
        <p className="section-sub">
          Composes with the TanStack tools you already use.
        </p>
        <div className="ecosystem-grid">
          <div className="eco-card">
            <h3>TanStack DB</h3>
            <p>
              <code>useQuery</code> returns a live Collection. Compose with{' '}
              <code>useLiveQuery</code> for client-side filtering, sorting, and
              joins.
            </p>
          </div>
          <div className="eco-card">
            <h3>TanStack Query</h3>
            <p>
              Coexists in the same app. Use Realtime for live data, Query for
              everything else.
            </p>
          </div>
          <div className="eco-card">
            <h3>TanStack Start</h3>
            <p>
              Types flow from Drizzle schema through server functions to hooks.
              No codegen.
            </p>
          </div>
          <div className="eco-card">
            <h3>Any backend</h3>
            <p>
              Not using Start? Works with Express, Hono, Fastify, or any fetch
              handler.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function RunnableExamples() {
  const examples = [
    {
      title: 'Collaborative todos',
      desc: 'Live collections plus field-level CRDTs — concurrent edits merge with no conflicts.',
      href: 'https://github.com/mikn/tanstack-realtime/tree/main/examples/collaborative-todos',
    },
    {
      title: 'Chat',
      desc: 'Channels and pub/sub — append-only live channels with history and typing indicators.',
      href: 'https://github.com/mikn/tanstack-realtime/tree/main/examples/chat',
    },
    {
      title: 'AI streaming',
      desc: 'Reduce-based streaming state — ordered, resumable token streams to the client.',
      href: 'https://github.com/mikn/tanstack-realtime/tree/main/examples/ai-streaming',
    },
  ]
  return (
    <section id="examples" className="section">
      <div className="container">
        <h2>Runnable examples</h2>
        <p className="section-sub">
          Full apps you can clone and run. Each one shows a different slice of
          the library.
        </p>
        <div className="ecosystem-grid">
          {examples.map((ex) => (
            <a
              key={ex.title}
              className="eco-card"
              href={ex.href}
              target="_blank"
              rel="noopener"
            >
              <h3>{ex.title}</h3>
              <p>{ex.desc}</p>
            </a>
          ))}
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
          <code>realtime.js</code> is MIT-licensed and community-driven. Join
          the conversation on{' '}
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
          <span className="logo-tan">realtime</span>
          <span className="logo-realtime">.js</span>
          <p>Bring your own backend. No platform, no per-seat bill.</p>
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
            &copy; {new Date().getFullYear()} mikn. MIT License. An independent,
            vendor-neutral project &mdash; not affiliated with or endorsed by
            TanStack.
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
      <Transports />
      <QuickStart />
      <Ecosystem />
      <RunnableExamples />
      <Community />
      <Footer />
    </>
  )
}
