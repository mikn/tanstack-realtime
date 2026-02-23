import './styles.css'

// ---------------------------------------------------------------------------
// Reusable tiny components
// ---------------------------------------------------------------------------

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="badge">{children}</span>
}

function CodeBlock({ code, title }: { code: string; title?: string }) {
  return (
    <div className="code-block">
      {title && <div className="code-title">{title}</div>}
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

function SpectrumStep({
  step,
  title,
  description,
  code,
  active,
}: {
  step: number
  title: string
  description: string
  code: string
  active?: boolean
}) {
  return (
    <div className={`spectrum-step ${active ? 'active' : ''}`}>
      <div className="spectrum-step-header">
        <span className="step-number">{step}</span>
        <div>
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
      </div>
      <CodeBlock code={code} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function DisclaimerBar() {
  return (
    <div className="disclaimer-bar">
      <span>
        ⚠️ <strong>Unofficial project</strong> — This is a vibe-coded library
        exploring an architecture and structure for TanStack Realtime. Not
        affiliated with or endorsed by TanStack.{' '}
        <a
          href="https://github.com/mikn/tanstack-realtime"
          target="_blank"
          rel="noopener"
        >
          View on GitHub →
        </a>
      </span>
    </div>
  )
}

function Nav() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="#" className="nav-logo">
          <span className="logo-tan">TanStack</span>{' '}
          <span className="logo-realtime">Realtime</span>
        </a>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#spectrum">Progressive</a>
          <a href="#database">Database</a>
          <a href="#crdts">CRDTs</a>
          <a href="#quickstart">Quick Start</a>
          <a
            href="https://github.com/mikn/tanstack-realtime"
            className="nav-github"
            target="_blank"
            rel="noopener"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="container">
        <Badge>v0.1 &middot; Alpha</Badge>
        <h1>
          Real-time for
          <br />
          <span className="gradient-text">the rest of us</span>
        </h1>
        <p className="hero-sub">
          Type-safe, transport-agnostic realtime for React.
          <br />
          Start with a <code>queryFn</code>. End with multiplayer.
          <br />
          Progressive adoption, zero lock-in.
        </p>
        <div className="hero-actions">
          <a href="#quickstart" className="btn btn-primary">
            Get Started
          </a>
          <a href="#spectrum" className="btn btn-secondary">
            See the Spectrum
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
  return (
    <section id="features" className="section">
      <div className="container">
        <Badge>Why TanStack Realtime</Badge>
        <h2>
          Everything you need.
          <br />
          Nothing you don&rsquo;t.
        </h2>
        <div className="features-grid">
          <FeatureCard
            icon="~"
            title="Progressive Adoption"
            description="Start with server data via queryFn. Add channels when ready. Upgrade to CRDTs when you need conflict resolution. Each step is one line of config."
          />
          <FeatureCard
            icon="{"
            title="Type-Safe End to End"
            description="Full TypeScript from channel keys to CRDT field definitions. Autocomplete everywhere. Catch mistakes at build time, not at 2am."
          />
          <FeatureCard
            icon=">"
            title="Transport Agnostic"
            description="Ship with the built-in Node.js transport. Scale to Centrifugo, SSE, or your own protocol. Swap transports without touching application code."
          />
          <FeatureCard
            icon="#"
            title="Built-in CRDTs"
            description="LWW-Registers, PN-Counters, and OR-Sets ship in core. Collaborative editing without a PhD in distributed systems."
          />
          <FeatureCard
            icon="@"
            title="Offline-First"
            description="Publish while disconnected. Messages queue locally and replay in order on reconnect. Show pending count with a reactive store."
          />
          <FeatureCard
            icon="*"
            title="TanStack Ecosystem"
            description="Plugs directly into TanStack DB collections via SyncConfig. Use TanStack Query alongside it for non-realtime data — they work in parallel, each owning its own concerns."
          />
          <FeatureCard
            icon="&"
            title="Presence & Cursors"
            description="Who's online? Where's their cursor? joinPresence / onPresenceChange give you the primitives. Build any awareness UX."
          />
          <FeatureCard
            icon="+"
            title="Gap Recovery"
            description="Reconnected after a network blip? withGapRecovery fires a callback for every channel so you can replay missed messages or re-fetch."
          />
          <FeatureCard
            icon="%"
            title="Multi-Tab via SharedWorker"
            description="One WebSocket connection shared across browser tabs. Falls back to BroadcastChannel automatically. Zero config."
          />
        </div>
      </div>
    </section>
  )
}

function Spectrum() {
  return (
    <section id="spectrum" className="section section-dark">
      <div className="container">
        <Badge>The Progressive Spectrum</Badge>
        <h2>
          Start simple.
          <br />
          Grow without rewriting.
        </h2>
        <p className="section-sub">
          Every TanStack Realtime app lives on a spectrum. You choose how far to
          go. Each step adds one line of config &mdash; and you can stop at any
          point.
        </p>

        <div className="spectrum-steps">
          <SpectrumStep
            step={1}
            title="Server-Only (no realtime channel)"
            description="Just a queryFn for initial data. No WebSocket, no client needed. TanStack DB owns the collection."
            code={`const todosOptions = realtimeCollectionOptions({
  key: ['todos'],
  queryFn: () => fetch('/api/todos').then(r => r.json()),
  getKey: (t) => t.id,
})`}
          />
          <SpectrumStep
            step={2}
            title="Add Mutations"
            description="Optimistic inserts, updates, deletes. Still no realtime channel."
            code={`const todosOptions = realtimeCollectionOptions({
  // ...queryFn, getKey
  onInsert: async ({ data }) => {
    const res = await fetch('/api/todos', { method: 'POST', body: JSON.stringify(data) })
    return res.json()
  },
})`}
          />
          <SpectrumStep
            step={3}
            title="Go Live"
            description="Add a client and channel. All connected tabs see updates instantly."
            code={`const todosOptions = realtimeCollectionOptions({
  // ...queryFn, getKey, onInsert
  client: realtimeClient,
  channel: ['todos', { projectId }],
})`}
            active
          />
          <SpectrumStep
            step={4}
            title="Enable CRDTs"
            description="Per-field conflict resolution. Concurrent edits merge automatically."
            code={`const todosOptions = realtimeCollectionOptions({
  // ...everything above
  fields: {
    title: 'lww',       // last-writer-wins
    votes: 'pn-counter', // increment/decrement from any client
    tags:  'or-set',     // add/remove survives concurrent edits
  },
})`}
          />
          <SpectrumStep
            step={5}
            title="Resilience"
            description="Survive network blips. One boolean re-fetches on reconnect."
            code={`const todosOptions = realtimeCollectionOptions({
  // ...everything above
  refetchOnReconnect: true,
})`}
          />
        </div>
      </div>
    </section>
  )
}

function DatabaseIntegration() {
  return (
    <section id="database" className="section section-dark">
      <div className="container">
        <Badge>Database Integration</Badge>
        <h2>
          Postgres in.
          <br />
          Live UI out.
        </h2>
        <p className="section-sub">
          Wire TanStack Realtime to Postgres in minutes. Your API routes just
          write to the database and return the saved row &mdash;{' '}
          <code>realtimeCollectionOptions</code> broadcasts it to every
          subscriber automatically.
        </p>

        <div className="callout">
          <span className="callout-label">How auto-broadcast works</span>
          <p>
            After <code>onInsert</code> or <code>onUpdate</code> returns a
            value, <code>realtimeCollectionOptions</code> automatically
            publishes it to the channel &mdash; no{' '}
            <code>nodeServer.publish()</code> in your API routes, no CDC
            pipeline. You only call <code>nodeServer.publish()</code> directly
            for changes that originate <em>outside</em> a client mutation:
            background jobs, cron tasks, or external services.
          </p>
        </div>

        <div className="use-cases">
          {/* ── Use Case 1: withRest ─────────────────────────────── */}
          <div className="use-case">
            <div className="use-case-header">
              <span className="use-case-number">01</span>
              <div>
                <h3>
                  <code>withRest</code> &mdash; the 80% case
                </h3>
                <p>
                  Spread <code>withRest</code> into{' '}
                  <code>realtimeCollectionOptions</code> to get{' '}
                  <code>getKey</code>, <code>queryFn</code>,{' '}
                  <code>onInsert</code>, <code>onUpdate</code>, and{' '}
                  <code>onDelete</code> wired to standard REST/JSON endpoints in
                  one call. Your server routes are plain CRUD &mdash; no publish
                  logic anywhere.
                </p>
              </div>
            </div>
            <div className="use-case-codes">
              <CodeBlock
                title="features/tasks/collection.ts"
                code={`import { withRest, realtimeCollectionOptions } from '@tanstack/realtime'

const tasksOptions = (projectId: string) =>
  realtimeCollectionOptions({
    // withRest provides: getKey, queryFn, onInsert, onUpdate, onDelete
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
// withRest calls these; the returned rows are broadcast automatically.

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
            </div>
          </div>

          {/* ── Use Case 2: Custom callbacks ──────────────────────── */}
          <div className="use-case">
            <div className="use-case-header">
              <span className="use-case-number">02</span>
              <div>
                <h3>Custom callbacks &mdash; full control</h3>
                <p>
                  Write <code>onInsert</code> / <code>onUpdate</code> manually
                  when you need custom logic: non-standard endpoints, seeding
                  from a different URL, or composing multiple API calls.{' '}
                  <strong>Return the saved row</strong> and the library handles
                  the broadcast.
                </p>
              </div>
            </div>
            <div className="use-case-codes">
              <CodeBlock
                title="features/chat/collection.ts"
                code={`const messagesOptions = (roomId: string) =>
  realtimeCollectionOptions({
    client: realtimeClient,
    channel: ['messages', { roomId }],
    getKey: (m) => m.id,

    // Seed from Postgres on mount — last 50 messages
    queryFn: () =>
      fetch(\`/api/rooms/\${roomId}/messages?limit=50&order=desc\`)
        .then((r) => r.json()),

    // Persist and return — the library auto-broadcasts the returned message
    onInsert: async ({ transaction }) => {
      const data = transaction.mutations[0].modified
      const res = await fetch(\`/api/rooms/\${roomId}/messages\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json() // ← broadcast happens here, automatically
    },
  })`}
              />
              <CodeBlock
                title="server/routes/messages.ts"
                code={`// GET  — load message history
router.get('/api/rooms/:roomId/messages', (req) =>
  db.messages.findMany({
    where: { roomId: req.params.roomId },
    orderBy: { sentAt: 'desc' },
    take: Number(req.query.limit ?? 50),
  })
)

// POST — save new message and return it
// No publish() here — the client broadcasts the returned row
router.post('/api/rooms/:roomId/messages', (req) =>
  db.messages.create({
    data: { ...req.body, roomId: req.params.roomId },
  })
)`}
              />
            </div>
          </div>

          {/* ── Use Case 3: Server-initiated push ─────────────────── */}
          <div className="use-case">
            <div className="use-case-header">
              <span className="use-case-number">03</span>
              <div>
                <h3>Server-initiated push</h3>
                <p>
                  The one case where you do call{' '}
                  <code>nodeServer.publish()</code> directly: changes that
                  originate outside a client mutation &mdash; background jobs,
                  cron tasks, webhooks from external services. The collection is
                  read-only; the server pushes all updates.
                </p>
              </div>
            </div>
            <div className="use-case-codes">
              <CodeBlock
                title="server/jobs/inventorySync.ts"
                code={`import { nodeServer } from '../realtime'
import { serializeKey } from '@tanstack/realtime'

// Cron job / webhook — change originates outside any client mutation
export async function syncInventoryFromWarehouse(productId: string) {
  const latestStock = await warehouseApi.getStock(productId)
  const product = await db.products.update({
    where: { id: productId },
    data: { stock: latestStock },
  })
  // No client initiated this — publish directly to notify all subscribers
  nodeServer.publish(serializeKey(['products', { id: productId }]), {
    action: 'update',
    data: product,
  })
}`}
              />
              <CodeBlock
                title="features/inventory/collection.ts"
                code={`// Read-only — subscribes to server-pushed stock updates
const productOptions = (productId: string) =>
  realtimeCollectionOptions({
    client: realtimeClient,
    channel: ['products', { id: productId }],
    getKey: (p) => p.id,

    queryFn: () =>
      fetch(\`/api/products/\${productId}\`).then((r) => r.json()),

    // No onInsert/onUpdate — all changes come from the server
    fields: { stock: 'pn-counter' },
  })

function StockBadge({ productId }: { productId: string }) {
  const [product] = useCollection(productOptions(productId))
  return <span>{product?.stock ?? 0} in stock</span>
}`}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CRDTs() {
  return (
    <section id="crdts" className="section">
      <div className="container">
        <Badge>Conflict-Free Data Types</Badge>
        <h2>
          Multiplayer without
          <br />
          the merge conflicts.
        </h2>
        <p className="section-sub">
          Three CRDT primitives ship in core. They compose into the{' '}
          <code>fields</code> config for automatic per-field conflict resolution
          &mdash; or use them standalone for custom data structures.
        </p>

        <div className="crdt-grid">
          <div className="crdt-card">
            <h3>
              LWW-Register <span className="crdt-tag">Last Writer Wins</span>
            </h3>
            <p>
              A Lamport clock + client ID tie-break. The most recent write
              always wins, with deterministic resolution for simultaneous edits.
              Perfect for text fields, status enums, and settings.
            </p>
            <CodeBlock
              title="fields config"
              code={`fields: {
  title: 'lww',
  status: 'lww',
}`}
            />
          </div>

          <div className="crdt-card">
            <h3>
              PN-Counter{' '}
              <span className="crdt-tag">Positive-Negative Counter</span>
            </h3>
            <p>
              Distributed increment and decrement that never loses updates.
              Every client maintains its own vector &mdash; merging takes the
              max per client. Perfect for votes, scores, and stock counts.
            </p>
            <CodeBlock
              title="fields config"
              code={`fields: {
  votes: 'pn-counter',
  stock: 'pn-counter',
}`}
            />
          </div>

          <div className="crdt-card">
            <h3>
              OR-Set <span className="crdt-tag">Observed-Remove Set</span>
            </h3>
            <p>
              Add and remove elements concurrently without conflicts. Each add
              gets a unique tag &mdash; removes only affect tags the remover has
              seen. Add always wins over a concurrent remove.
            </p>
            <CodeBlock
              title="fields config"
              code={`fields: {
  tags: 'or-set',
  assignees: 'or-set',
}`}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Transports() {
  return (
    <section className="section section-dark">
      <div className="container">
        <Badge>Transport Adapters</Badge>
        <h2>
          One API.
          <br />
          Any infrastructure.
        </h2>
        <p className="section-sub">
          Swap transports without changing a line of application code. Start
          local, scale to production.
        </p>

        <div className="transport-grid">
          <div className="transport-card">
            <h3>Node.js Preset</h3>
            <p>
              Built-in WebSocket server + client. Zero config. Perfect for local
              development and single-server deployments.
            </p>
            <CodeBlock
              code={`import { nodeTransport } from '@tanstack/realtime-preset-node'

const client = createRealtimeClient({
  transport: nodeTransport({ url: 'ws://localhost:3001' }),
})`}
            />
          </div>

          <div className="transport-card">
            <h3>Centrifugo Adapter</h3>
            <p>
              Production-grade WebSocket infrastructure. Millions of concurrent
              connections. Drop in one import.
            </p>
            <CodeBlock
              code={`import { centrifugoTransport } from '@tanstack/realtime-adapter-centrifugo'

const client = createRealtimeClient({
  transport: centrifugoTransport({
    url: 'wss://rt.example.com/connection/websocket',
    token: getUserToken(),
  }),
})`}
            />
          </div>

          <div className="transport-card">
            <h3>SSE Adapter</h3>
            <p>
              Server-Sent Events for environments where WebSocket is
              unavailable. Works behind corporate proxies and CDNs.
            </p>
            <CodeBlock
              code={`import { sseTransport } from '@tanstack/realtime-adapter-sse'

const client = createRealtimeClient({
  transport: sseTransport({ url: '/api/realtime/events' }),
})`}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function ReactHooks() {
  return (
    <section className="section">
      <div className="container">
        <Badge>React Integration</Badge>
        <h2>
          Hooks that feel like
          <br />
          <code>useState</code>.
        </h2>

        <div className="hooks-grid">
          <div className="hook-example">
            <h3>useRealtime</h3>
            <p>Connection status and control.</p>
            <CodeBlock
              code={`function ConnectionBadge() {
  const { status, connect, disconnect } = useRealtime()

  return (
    <span className={status}>
      {status === 'connected' ? 'Live' : 'Offline'}
    </span>
  )
}`}
            />
          </div>

          <div className="hook-example">
            <h3>useSubscribe</h3>
            <p>Raw channel events for the component lifetime.</p>
            <CodeBlock
              code={`function TypingIndicator({ roomId }) {
  const [typing, setTyping] = useState([])

  useSubscribe(['chat:typing', { roomId }], (event) => {
    setTyping(event.users)
  })

  return <span>{typing.join(', ')} typing...</span>
}`}
            />
          </div>

          <div className="hook-example">
            <h3>usePublish</h3>
            <p>Stable publish function bound to a channel.</p>
            <CodeBlock
              code={`function SendButton({ roomId }) {
  const publish = usePublish(['chat:messages', { roomId }])

  return (
    <button onClick={() => publish({ text: 'Hello!' })}>
      Send
    </button>
  )
}`}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function QuickStart() {
  return (
    <section id="quickstart" className="section section-dark">
      <div className="container">
        <Badge>Quick Start</Badge>
        <h2>
          Five minutes to
          <br />
          <span className="gradient-text">real-time.</span>
        </h2>

        <div className="quickstart-steps">
          <div className="qs-step">
            <div className="qs-number">1</div>
            <h3>Install</h3>
            <CodeBlock
              code={`npm i @tanstack/realtime \\
      @tanstack/react-realtime \\
      @tanstack/realtime-preset-node`}
            />
          </div>

          <div className="qs-step">
            <div className="qs-number">2</div>
            <h3>Create a client</h3>
            <CodeBlock
              code={`import { createRealtimeClient } from '@tanstack/realtime'
import { nodeTransport } from '@tanstack/realtime-preset-node'

export const realtimeClient = createRealtimeClient({
  transport: nodeTransport({ url: 'ws://localhost:3001' }),
})`}
            />
          </div>

          <div className="qs-step">
            <div className="qs-number">3</div>
            <h3>Provide to your app</h3>
            <CodeBlock
              code={`import { RealtimeProvider } from '@tanstack/react-realtime'

function App() {
  return (
    <RealtimeProvider client={realtimeClient}>
      <TodoList />
    </RealtimeProvider>
  )
}`}
            />
          </div>

          <div className="qs-step">
            <div className="qs-number">4</div>
            <h3>Define a live collection</h3>
            <CodeBlock
              code={`import { realtimeCollectionOptions } from '@tanstack/realtime'

const todosOptions = realtimeCollectionOptions({
  key: ['todos'],
  queryFn: () => fetch('/api/todos').then(r => r.json()),
  getKey: (todo) => todo.id,
  client: realtimeClient,
  channel: ['todos'],
})`}
            />
          </div>

          <div className="qs-step">
            <div className="qs-number">5</div>
            <h3>Use it</h3>
            <CodeBlock
              code={`import { useCollection } from '@tanstack/react-db'

function TodoList() {
  const todos = useCollection(todosOptions)

  return (
    <ul>
      {todos.map(todo => <li key={todo.id}>{todo.title}</li>)}
    </ul>
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
    <section className="section">
      <div className="container ecosystem-section">
        <Badge>TanStack Ecosystem</Badge>
        <h2>Fits right in.</h2>
        <p className="section-sub">
          TanStack Realtime is designed to compose with the tools you already
          use.
        </p>
        <div className="ecosystem-grid">
          <div className="eco-card">
            <h3>TanStack DB</h3>
            <p>
              Collections with optimistic mutations, derived views, and reactive
              queries. Realtime plugs in via <code>SyncConfig</code>.
            </p>
          </div>
          <div className="eco-card">
            <h3>TanStack Query</h3>
            <p>
              Use alongside Realtime for server-fetched data that doesn&rsquo;t
              need a live channel. They are parallel systems — Query owns its
              cache, Realtime owns its collections.
            </p>
          </div>
          <div className="eco-card">
            <h3>TanStack Store</h3>
            <p>
              Connection status, offline queue state, and collection data all
              expose reactive stores. <code>useStore</code> works everywhere.
            </p>
          </div>
          <div className="eco-card">
            <h3>TanStack Start</h3>
            <p>
              Full-stack React framework. Server functions provide the{' '}
              <code>queryFn</code>. WebSocket transport handles the rest.
            </p>
          </div>
        </div>
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
          <p>Real-time for the rest of us.</p>
        </div>
        <div className="footer-links">
          <div>
            <h4>Library</h4>
            <a href="#features">Features</a>
            <a href="#spectrum">Progressive Spectrum</a>
            <a href="#database">Database Integration</a>
            <a href="#crdts">CRDTs</a>
            <a href="#quickstart">Quick Start</a>
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
            <a
              href="https://twitter.com/tanaboraso"
              target="_blank"
              rel="noopener"
            >
              Twitter
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

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function App() {
  return (
    <>
      <DisclaimerBar />
      <Nav />
      <Hero />
      <Features />
      <Spectrum />
      <DatabaseIntegration />
      <CRDTs />
      <Transports />
      <ReactHooks />
      <QuickStart />
      <Ecosystem />
      <Footer />
    </>
  )
}
