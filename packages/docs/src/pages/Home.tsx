import { CodeBlock } from '../components/CodeBlock'

function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="container">
        <span className="badge">v0.1 &middot; Alpha</span>
        <h1>
          Add realtime to{' '}
          <span className="gradient-text">your existing app</span>
        </h1>
        <p className="hero-sub">
          Keep your server, your database, your deploy target. Add a{' '}
          <code>channel</code> to any collection and it goes live &mdash; with
          type-safe CRDTs, presence, pub/sub, and offline support. Not a
          platform, just a library.
        </p>

        <div className="hero-code">
          <CodeBlock
            code={`const todosOptions = realtimeCollectionOptions({
  ...withRest({
    url: '/api/todos',
    getKey: (t) => t.id,
  }),
  client: realtimeClient,
  channel: ['todos'],
  fields: { title: 'lww', votes: 'pn-counter' },
})`}
          />
        </div>

        <div className="hero-actions">
          <a href="#/docs/getting-started" className="btn btn-primary">
            Get Started
          </a>
          <a href="#/docs/collections" className="btn btn-secondary">
            Read the Docs
          </a>
        </div>
        <div className="hero-install">
          <code>npm i @tanstack/realtime @tanstack/react-realtime</code>
        </div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    {
      title: 'Transport-agnostic',
      desc: 'SSE or Centrifugo (WebSocket). Swap transports without changing application code.',
    },
    {
      title: 'Type-safe channels',
      desc: 'Full TypeScript from channel keys to CRDT field definitions to presence data shapes.',
    },
    {
      title: 'Conflict-free data types',
      desc: 'LWW registers, PN-counters, and OR-sets. Concurrent edits merge automatically.',
    },
    {
      title: 'Presence & pub/sub',
      desc: "Track who's online, share cursor positions, and broadcast messages across subscribers.",
    },
    {
      title: 'Ephemeral channels',
      desc: 'Auto-expiring events like typing indicators, emoji reactions, and toasts that disappear after a configurable TTL.',
    },
    {
      title: 'AI streaming',
      desc: 'Ordered, resumable streams with reduce-based state and HMAC-signed checkpoints.',
    },
    {
      title: 'Tick-based sync',
      desc: 'Delta-compressed 60 Hz updates for game state, simulations, and high-frequency data.',
    },
    {
      title: 'Offline & multi-tab',
      desc: 'Offline queue buffers mutations. Coordinated transport shares one connection across tabs.',
    },
    {
      title: 'TanStack ecosystem',
      desc: 'Built on TanStack DB and Store. Works alongside TanStack Query for non-realtime data.',
    },
  ]

  return (
    <section id="features" className="section">
      <div className="container">
        <h2>What you get</h2>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
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
        <h2>One config key at a time</h2>
        <p className="section-sub">
          Start with a plain <code>queryFn</code>. Add <code>channel</code> when
          you&rsquo;re ready for live updates. Add <code>fields</code> when you
          need conflict resolution. Stop at any point.
        </p>

        <div className="spectrum-steps">
          <div className="spectrum-step">
            <div className="spectrum-step-header">
              <span className="step-number">1</span>
              <div>
                <h4>Server-only</h4>
                <p>Just a queryFn. No WebSocket, no client.</p>
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
            <h3>Add a channel to any collection</h3>
            <CodeBlock
              code={`import { createCollection } from '@tanstack/db'
import { realtimeCollectionOptions, withRest } from '@tanstack/realtime'
import { useCollection } from '@tanstack/react-db'

const todosCollection = createCollection(
  realtimeCollectionOptions({
    ...withRest({ url: '/api/todos', getKey: (t: Todo) => t.id }),
    client,
    channel: ['todos'],
  })
)

function TodoList() {
  const todos = useCollection(todosCollection)
  return <ul>{todos.map(t => <li key={t.id}>{t.title}</li>)}</ul>
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
              Collections with optimistic mutations, derived views, and reactive
              queries.
            </p>
          </div>
          <div className="eco-card">
            <h3>TanStack Query</h3>
            <p>
              Use alongside Realtime for data that doesn&rsquo;t need a live
              channel.
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

function Positioning() {
  return (
    <section id="when-to-use" className="section">
      <div className="container">
        <h2>When to use</h2>
        <p className="section-sub">
          For teams that already have a backend they like and want realtime
          without vendor lock-in. Not a database, CDC pipeline, or rich-text
          editing engine.
        </p>

        <div className="positioning-grid">
          <div className="positioning-card positioning-good">
            <h3>Good fit</h3>
            <ul>
              <li>Live updates without polling</li>
              <li>
                Reactive collections that update when any client mutates data
              </li>
              <li>Presence and lightweight pub/sub messaging</li>
              <li>
                Concurrent edits on simple fields &mdash; counters, tag sets,
                scalar values
              </li>
              <li>Swappable transports without code changes</li>
            </ul>
          </div>

          <div className="positioning-card positioning-bad">
            <h3>Look elsewhere</h3>
            <ul>
              <li>
                <strong>Postgres sync</strong> &mdash; ElectricSQL and PowerSync
                sync Postgres directly to client collections
              </li>
              <li>
                <strong>Rich text editing</strong> &mdash; Yjs/Hocuspocus or
                Automerge are purpose-built; see our{' '}
                <a href="#/docs/rich-text-crdts">Y.js integration guide</a> for
                pairing with TanStack Realtime as the transport
              </li>
              <li>
                <strong>Polling is enough</strong> &mdash; TanStack Query with a{' '}
                <code>refetchInterval</code> is simpler when sub-second latency
                is not required
              </li>
              <li>
                <strong>Managed services</strong> &mdash; Ably, Pusher, and
                Liveblocks handle infrastructure for you; TanStack Realtime is
                for teams that want to own the transport layer
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function Community() {
  return (
    <section className="section section-alt">
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
          <p>Realtime for the stack you already have.</p>
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
      <Features />
      <Spectrum />
      <QuickStart />
      <Ecosystem />
      <Positioning />
      <Community />
      <Footer />
    </>
  )
}
