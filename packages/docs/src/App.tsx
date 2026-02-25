import './styles.css'
import { Highlight, themes } from 'prism-react-renderer'

// ---------------------------------------------------------------------------
// Reusable tiny components
// ---------------------------------------------------------------------------

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="badge">{children}</span>
}

function inferLanguage(code: string, title?: string): string {
  if (title) {
    const ext = title.split('.').pop()?.toLowerCase()
    if (ext === 'ts' || ext === 'tsx') return 'tsx'
    if (ext === 'js' || ext === 'jsx') return 'jsx'
  }
  if (/\bimport\b.*\bfrom\b/.test(code) || /:\s*(string|number|boolean)\b/.test(code) || /<\w+/.test(code)) return 'tsx'
  return 'tsx'
}

function CodeBlock({ code, title }: { code: string; title?: string }) {
  const language = inferLanguage(code, title)
  return (
    <div className="code-block">
      {title && <div className="code-title">{title}</div>}
      <Highlight theme={themes.nightOwl} code={code.trim()} language={language}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre>
            <code>
              {tokens.map((line, i) => (
                <span key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                  {'\n'}
                </span>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  problem,
  solution,
}: {
  icon: string
  title: string
  problem: string
  solution: string
}) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p className="feature-problem">{problem}</p>
      <p className="feature-solution">{solution}</p>
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
          <a href="#example">Example</a>
          <a href="#features">Features</a>
          <a href="#database">Database</a>
          <a href="#crdts">CRDTs</a>
          <a href="#presence">Presence</a>
          <a href="#resilience">Resilience</a>
          <a href="#when-to-use">When to use</a>
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

// ---------------------------------------------------------------------------
// Hero — problem-first with before / after
// ---------------------------------------------------------------------------

function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="container">
        <Badge>v0.1 &middot; Alpha</Badge>
        <h1>
          Realtime,{' '}
          <span className="gradient-text">without the ceremony.</span>
        </h1>
        <p className="hero-sub">
          Add a <code>channel</code> to your existing <code>queryFn</code>.
          Connected clients update when data changes — no polling, no
          subscriptions managed by hand. Built on TanStack DB.
        </p>

        <div className="before-after">
          <div className="ba-col">
            <div className="ba-label ba-before">Before &mdash; polling</div>
            <CodeBlock
              code={`// Every tab polls every 30 s. Data drifts.
function TaskList({ projectId }) {
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () =>
      fetch(\`/api/tasks?projectId=\${projectId}\`)
        .then(r => r.json()),
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
  return (
    <ul>
      {tasks.map(t => <li key={t.id}>{t.title}</li>)}
    </ul>
  )
}`}
            />
          </div>
          <div className="ba-col">
            <div className="ba-label ba-after">After &mdash; live</div>
            <CodeBlock
              code={`// Every client updates instantly. Zero polling.
const tasksOptions = (projectId: string) =>
  realtimeCollectionOptions({
    ...withRest({
      url: \`/api/tasks?projectId=\${projectId}\`,
      getKey: (t) => t.id,
    }),
    client: realtimeClient,
    channel: ['tasks', { projectId }],
  })

function TaskList({ projectId }) {
  const tasks = useCollection(tasksOptions(projectId))
  return (
    <ul>
      {tasks.map(t => <li key={t.id}>{t.title}</li>)}
    </ul>
  )
}`}
            />
          </div>
        </div>

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

// ---------------------------------------------------------------------------
// Features — every card anchored in a real problem
// ---------------------------------------------------------------------------

function Features() {
  return (
    <section id="features" className="section">
      <div className="container">
        <Badge>Why TanStack Realtime</Badge>
        <h2>
          Every feature solves
          <br />
          a real problem.
        </h2>
        <div className="features-grid">
          <FeatureCard
            icon="~"
            title="Progressive Adoption"
            problem="You can't rewrite your whole app on day one."
            solution="Start with queryFn. Add channel when ready. Add CRDTs when you need conflict resolution. Each step is exactly one config key — stop at any point."
          />
          <FeatureCard
            icon="{"
            title="Type-Safe End to End"
            problem="Runtime errors in channel keys and message shapes cost you at 2am."
            solution="Full TypeScript from channel keys to CRDT field definitions. Autocomplete everywhere. Catch mistakes at build time."
          />
          <FeatureCard
            icon=">"
            title="Transport Agnostic"
            problem="You'll outgrow your local WebSocket server, but your app code shouldn't care."
            solution="Start with the Node.js preset. Scale to Centrifugo or SSE. One import swap — zero application code changes."
          />
          <FeatureCard
            icon="#"
            title="Built-in CRDTs"
            problem="Two users edit the same field at the same time. One change is silently lost."
            solution="Declare fields: { title: 'lww', votes: 'pn-counter', tags: 'or-set' }. Concurrent edits merge automatically. No manual conflict resolution."
          />
          <FeatureCard
            icon="@"
            title="Offline-First"
            problem="The user submits a form on a train. The network call fails. The change is gone."
            solution="Wrap any transport with createOfflineQueue. Mutations buffer and replay in FIFO order on reconnect. Show pending count in your UI."
          />
          <FeatureCard
            icon="*"
            title="TanStack Ecosystem"
            problem="Yet another state layer fighting with your existing cache."
            solution="Collections plug into TanStack DB via SyncConfig. TanStack Query runs alongside for non-realtime data. They are parallel systems — no conflict."
          />
          <FeatureCard
            icon="&"
            title="Presence & Cursors"
            problem="Users have no idea who else is looking at the same document."
            solution="createPresenceChannel + usePresence. Join with any data — name, cursor, status. Others update reactively. The current user is always excluded from the list."
          />
          <FeatureCard
            icon="+"
            title="Gap Recovery"
            problem="The user reconnects after 30 seconds offline and sees stale data."
            solution="Add refetchOnReconnect: true to re-run queryFn and diff on reconnect. Or use withGapRecovery for custom replay — server-assisted offset recovery, raw subscriptions, or collections without a queryFn."
          />
          <FeatureCard
            icon="%"
            title="Multi-Tab via SharedWorker"
            problem="Six browser tabs. Six WebSocket connections. Six times the server cost."
            solution="createSharedWorkerTransport shares one connection across all tabs. Falls back to BroadcastChannel automatically. Zero application code changes."
          />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Progressive Spectrum
// ---------------------------------------------------------------------------

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
          Every TanStack Realtime app lives on a spectrum. Each step adds one
          config key &mdash; and you can stop at any point.
        </p>

        <div className="spectrum-steps">
          <SpectrumStep
            step={1}
            title="Server-only — seed from your database"
            description="Just a queryFn. No WebSocket, no client. TanStack DB owns the collection. This is a valid end state for read-heavy, low-update data."
            code={`const todosOptions = realtimeCollectionOptions({
  key: ['todos'],
  queryFn: () => fetch('/api/todos').then(r => r.json()),
  getKey: (t) => t.id,
})`}
          />
          <SpectrumStep
            step={2}
            title="+ Mutations — persist to your database"
            description="Add onInsert / onUpdate / onDelete. Return the saved row — the library will broadcast it to peers in the next step. Still no WebSocket."
            code={`const todosOptions = realtimeCollectionOptions({
  // ...queryFn, getKey
  onInsert: async ({ transaction }) => {
    const data = transaction.mutations[0].modified
    const res = await fetch('/api/todos', { method: 'POST', body: JSON.stringify(data) })
    return res.json() // ← returned value is broadcast automatically once you add a channel
  },
})`}
          />
          <SpectrumStep
            step={3}
            title="+ Channel — go live"
            description="Add client and channel. Every mutation you make is now broadcast to all subscribers. Every peer update lands in your collection."
            code={`const todosOptions = realtimeCollectionOptions({
  // ...queryFn, getKey, onInsert
  client: realtimeClient,
  channel: ['todos', { projectId }],
})`}
            active
          />
          <SpectrumStep
            step={4}
            title="+ Fields — concurrent edits without conflicts"
            description="Two users edit the same row simultaneously. Without CRDTs, one change is lost. Declare fields and every concurrent edit is merged correctly."
            code={`const todosOptions = realtimeCollectionOptions({
  // ...everything above
  fields: {
    title: 'lww',        // last-writer-wins via Lamport clock
    votes: 'pn-counter', // concurrent increments always add up
    tags:  'or-set',     // concurrent add/remove never conflicts
  },
})`}
          />
          <SpectrumStep
            step={5}
            title="+ Resilience — survive network gaps"
            description="The user loses connectivity for 30 seconds. refetchOnReconnect re-runs queryFn after every gap and diffs against the local state — no duplicate rows."
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

// ---------------------------------------------------------------------------
// Database Integration
// ---------------------------------------------------------------------------

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
// withRest calls these; returned rows are broadcast automatically.

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
                  when you need custom logic: non-standard endpoints, composing
                  multiple API calls, or seeding from a different URL.{' '}
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

    // Persist and return — library auto-broadcasts the returned row
    onInsert: async ({ transaction }) => {
      const data = transaction.mutations[0].modified
      const res = await fetch(\`/api/rooms/\${roomId}/messages\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json() // ← broadcast happens automatically
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
// No publish() — the client broadcasts the returned row
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
                  The one case where you call{' '}
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

// ---------------------------------------------------------------------------
// CRDTs — real conflict example
// ---------------------------------------------------------------------------

function CRDTs() {
  return (
    <section id="crdts" className="section">
      <div className="container">
        <Badge>Conflict-Free Data Types</Badge>
        <h2>
          Two users. One row.
          <br />
          Zero conflicts.
        </h2>
        <p className="section-sub">
          Without CRDTs, concurrent edits race to the server and one change is
          silently overwritten. Declare <code>fields</code> and every conflict
          is resolved automatically — the right data always wins.
        </p>

        <div className="before-after" style={{ marginBottom: '3rem' }}>
          <div className="ba-col">
            <div className="ba-label ba-before">Without CRDTs — data loss</div>
            <CodeBlock
              code={`// User A renames task to "Implement auth" at t=100
// User B (offline) renames it to "Implement OAuth" at t=99
// Both come online — t=100 wins, "Implement auth" survives
// User B's more specific name is silently dropped

// result: { title: "Implement auth" }  ← B's work gone`}
            />
          </div>
          <div className="ba-col">
            <div className="ba-label ba-after">With LWW — deterministic winner</div>
            <CodeBlock
              code={`// Same scenario — but now using fields: { title: 'lww' }
// LWW uses a Lamport clock + clientId tiebreak
// t=100 still wins, but it's now a deliberate, documented rule
// Both clients converge to the same value automatically

fields: {
  title: 'lww', // last write wins — deterministic, no surprises
}`}
            />
          </div>
        </div>

        <div className="crdt-grid">
          <div className="crdt-card">
            <h3>
              LWW-Register <span className="crdt-tag">Last Writer Wins</span>
            </h3>
            <p>
              A Lamport clock + clientId tiebreak. The most recent write always
              wins, with deterministic resolution for simultaneous edits. Use
              for text fields, status enums, and any scalar value.
            </p>
            <CodeBlock
              title="real example — document editor"
              code={`fields: {
  title:  'lww', // rename races → latest clock wins
  status: 'lww', // status change races → latest wins
}

// When User A sets title="Spec" at clock=5
// and User B sets title="Spec v2" at clock=6
// every client converges to "Spec v2" — no server round-trip needed`}
            />
          </div>

          <div className="crdt-card">
            <h3>
              PN-Counter{' '}
              <span className="crdt-tag">Positive-Negative Counter</span>
            </h3>
            <p>
              Distributed increment and decrement that never loses updates.
              Every client maintains its own vector — merging takes the max per
              client. Use for votes, scores, view counts, and stock.
            </p>
            <CodeBlock
              title="real example — voting"
              code={`fields: {
  votes: 'pn-counter', // 3 users upvote simultaneously → count = 3
  stock: 'pn-counter', // 2 reservations simultaneously → stock -= 2
}

// Without pn-counter: last-write clobbers → 2 upvotes reported as 1
// With pn-counter:    each client's delta is tracked → never lost`}
            />
          </div>

          <div className="crdt-card">
            <h3>
              OR-Set <span className="crdt-tag">Observed-Remove Set</span>
            </h3>
            <p>
              Add and remove elements concurrently without conflicts. Each add
              gets a unique tag — removes only affect tags the remover has seen.
              Add always wins over a concurrent remove.
            </p>
            <CodeBlock
              title="real example — tag system"
              code={`fields: {
  tags:      'or-set', // A adds "urgent", B removes "bug" → both survive
  assignees: 'or-set', // A assigns Alice, B assigns Bob → both are assigned
}

// Without or-set: both sets race → one overwrites the other
// With or-set:    each operation is tracked by tag → no lost adds`}
            />
          </div>

          <div className="crdt-card">
            <h3>
              Local field <span className="crdt-tag">Client-Only</span>
            </h3>
            <p>
              Declare a field as <code>'local'</code> to keep it entirely
              client-side. It is never sent to peers and never overwritten by
              incoming messages. Use for UI state that lives alongside server
              data.
            </p>
            <CodeBlock
              title="real example — draft / expand state"
              code={`fields: {
  title:    'lww',   // synced — peers see your renames
  draft:    'local', // not synced — your in-progress edit stays private
  expanded: 'local', // not synced — your accordion state is yours
}

// Incoming peer updates leave 'draft' and 'expanded' untouched
// onInsert / onUpdate strip local fields before publishing`}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Presence & Cursors
// ---------------------------------------------------------------------------

function PresenceSection() {
  return (
    <section id="presence" className="section section-dark">
      <div className="container">
        <Badge>Presence &amp; Cursors</Badge>
        <h2>
          Know who&rsquo;s online.
          <br />
          Show where they are.
        </h2>
        <p className="section-sub">
          Define a presence channel once. <code>usePresence</code> joins on
          mount, leaves on unmount, and returns a reactive list of every other
          connected user. Attach any data &mdash; name, avatar, cursor
          position, active selection.
        </p>

        <div className="use-case-codes" style={{ marginBottom: '1.5rem' }}>
          <CodeBlock
            title="presence/channel.ts — define once, use anywhere"
            code={`import { createPresenceChannel } from '@tanstack/realtime'

// Define the channel shape once at module level.
// TParams drives the channel key — docId scopes presence per document.
export const docPresence = createPresenceChannel({
  channel: (params: { docId: string }) => ['doc:presence', params],
})`}
          />
          <CodeBlock
            title="presence/DocumentPage.tsx — join and observe"
            code={`import { usePresence } from '@tanstack/react-realtime'
import { docPresence } from './channel'

function DocumentPage({ docId }: { docId: string }) {
  const { others, updatePresence } = usePresence(docPresence, {
    params:  { docId },
    initial: { name: user.name, color: user.color, cursor: null },
  })

  return (
    <div
      onMouseMove={(e) =>
        updatePresence({ cursor: { x: e.clientX, y: e.clientY } })
      }
    >
      {/* Who's here */}
      <div className="avatar-row">
        {others.map((u) => (
          <Avatar key={u.connectionId} name={u.data.name} color={u.data.color} />
        ))}
      </div>

      {/* Where they are */}
      {others
        .filter((u) => u.data.cursor)
        .map((u) => (
          <RemoteCursor
            key={u.connectionId}
            x={u.data.cursor.x}
            y={u.data.cursor.y}
            name={u.data.name}
            color={u.data.color}
          />
        ))}
    </div>
  )
}`}
          />
        </div>

        <div className="callout">
          <span className="callout-label">How it works</span>
          <p>
            <code>usePresence</code> subscribes to the channel, calls{' '}
            <code>client.joinPresence(channel, initial)</code> on mount, and
            calls <code>client.leavePresence(channel)</code> on unmount. The{' '}
            <code>others</code> array is reactive &mdash; it updates immediately
            when any peer joins, updates their data, or disconnects. The current
            user is always excluded. <code>updatePresence(delta)</code> merges
            partial data, so broadcasting a cursor position doesn&rsquo;t
            overwrite the user&rsquo;s name.
          </p>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Live Events — liveChannelOptions
// ---------------------------------------------------------------------------

function LiveEvents() {
  return (
    <section id="events" className="section">
      <div className="container">
        <Badge>Live Event Channels</Badge>
        <h2>
          Not every stream
          <br />
          is a database table.
        </h2>
        <p className="section-sub">
          Chat messages, typing indicators, game events, and auction bids are
          append-only event streams &mdash; they don&rsquo;t have an
          update/delete lifecycle. <code>liveChannelOptions</code> seeds from
          history and feeds live events through a single filter callback.
        </p>

        <div className="use-case-codes" style={{ marginBottom: '1.5rem' }}>
          <CodeBlock
            title="features/chat/collection.ts"
            code={`import { liveChannelOptions } from '@tanstack/realtime'
import { useCollection, createCollection } from '@tanstack/react-db'

// Define the collection — seed history, then receive live events
const chatOptions = (roomId: string) =>
  liveChannelOptions<Message, string>({
    client: realtimeClient,
    channel: ['chat', { roomId }],
    getKey: (m) => m.id,

    // Seed from Postgres on mount — history arrives before live events
    initialData: () =>
      fetch(\`/api/rooms/\${roomId}/messages?limit=50\`).then((r) => r.json()),

    // Filter incoming channel events — ignore typing indicators, reactions, etc.
    onEvent: (raw) => {
      const e = raw as { type: string; message: Message }
      return e.type === 'message' ? e.message : null
    },
  })

function ChatFeed({ roomId }: { roomId: string }) {
  const messages = useCollection(chatOptions(roomId))
  const publish   = usePublish(['chat', { roomId }])

  return (
    <div className="chat-feed">
      {messages.map((m) => (
        <div key={m.id} className="message">{m.text}</div>
      ))}
      <button
        onClick={() =>
          publish({
            type: 'message',
            message: { id: crypto.randomUUID(), text: 'Hello!', sentAt: new Date().toISOString() },
          })
        }
      >
        Send
      </button>
    </div>
  )
}`}
          />
          <CodeBlock
            title="server/routes/chat.ts — validate and fan out"
            code={`// Server validates each message before broadcasting.
// This is the one place we call nodeServer.publish() for chat —
// because we want server-side validation before the message is visible.

router.post('/api/rooms/:roomId/messages', async (req, res) => {
  const msg = await db.messages.create({
    data: { ...req.body, roomId: req.params.roomId },
  })
  // Fan out the validated + persisted message to all room subscribers
  nodeServer.publish(serializeKey(['chat', { roomId: req.params.roomId }]), {
    type: 'message',
    message: msg,
  })
  res.json(msg)
})

// GET history — liveChannelOptions.initialData calls this
router.get('/api/rooms/:roomId/messages', (req) =>
  db.messages.findMany({
    where: { roomId: req.params.roomId },
    orderBy: { sentAt: 'desc' },
    take: Number(req.query.limit ?? 50),
  })
)`}
          />
        </div>

        <div className="callout">
          <span className="callout-label">
            liveChannelOptions vs realtimeCollectionOptions
          </span>
          <p>
            Use <code>realtimeCollectionOptions</code> when your data lives in a
            database and has full CRUD semantics (insert, update, delete). Use{' '}
            <code>liveChannelOptions</code> when events only ever append &mdash;
            chat, audit logs, game events, bid history. The key difference:{' '}
            <code>liveChannelOptions</code> has no <code>onUpdate</code> or{' '}
            <code>onDelete</code>, and its <code>onEvent</code> callback decides
            which events to keep rather than transforming a wire format.
          </p>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Streaming — streamChannelOptions
// ---------------------------------------------------------------------------

function Streaming() {
  return (
    <section id="streaming" className="section section-dark">
      <div className="container">
        <Badge>Accumulated Streams</Badge>
        <h2>
          AI tokens. Live metrics.
          <br />
          Progress bars.
        </h2>
        <p className="section-sub">
          Some channels emit a sequence of events that accumulate into a single
          piece of state &mdash; not a list of rows. A <code>reduce</code>{' '}
          function folds each event into state.{' '}
          <code>status</code> tracks{' '}
          <code>'pending'</code> &rarr; <code>'streaming'</code> &rarr;{' '}
          <code>'done'</code> (or <code>'error'</code>).
        </p>

        <div className="use-case-codes" style={{ marginBottom: '1.5rem' }}>
          <CodeBlock
            title="features/ai/stream.ts — define the channel shape"
            code={`import { createStreamChannel } from '@tanstack/realtime'

// Define once — reuse in any component
export const aiResponseStream = createStreamChannel({
  id: 'ai-response',
  channel: (params: { requestId: string }) => ['ai', params],

  initial: { content: '' },

  // Fold each event into state
  reduce: (state, event: { type: string; token?: string }) =>
    event.type === 'token'
      ? { content: state.content + (event.token ?? '') }
      : state,

  // Stream closes and status → 'done'
  isDone: (_, e) => (e as { type: string }).type === 'done',

  // Stream closes and status → 'error'  (checked before reduce)
  isError: (_, e) =>
    (e as { type: string }).type === 'error'
      ? ((e as { message?: string }).message ?? 'Unknown error')
      : false,
})`}
          />
          <CodeBlock
            title="features/ai/AIResponse.tsx — consume in React"
            code={`import { useStream } from '@tanstack/react-realtime'
import { aiResponseStream } from './stream'

function AIResponse({ requestId }: { requestId: string }) {
  // useStream returns { state, status, error? } for the active channel
  const { state, status, error } = useStream(aiResponseStream, { requestId })

  if (status === 'pending')  return <span className="thinking">Thinking…</span>
  if (status === 'error')    return <span className="error">Error: {error}</span>

  return (
    <p className="ai-content">
      {state.content}
      {status === 'streaming' && <span className="cursor blink">▋</span>}
    </p>
  )
}

// Trigger a new stream — bump requestId to restart
function ChatInput() {
  const [requestId, setRequestId] = useState(() => crypto.randomUUID())

  const submit = async (prompt: string) => {
    const newId = crypto.randomUUID()
    setRequestId(newId)
    await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ requestId: newId, prompt }),
    })
  }

  return <AIResponse requestId={requestId} />
}`}
          />
        </div>

        <div className="use-case-codes">
          <CodeBlock
            title="server/routes/chat.ts — stream tokens from your AI"
            code={`import { serializeKey } from '@tanstack/realtime'
import { nodeServer } from '../realtime'

app.post('/api/chat', async (req) => {
  const { requestId, prompt } = req.body
  const channel = serializeKey(['ai', { requestId }])

  try {
    for await (const chunk of openai.stream(prompt)) {
      nodeServer.publish(channel, { type: 'token', token: chunk.text })
    }
    nodeServer.publish(channel, { type: 'done' })
  } catch (err) {
    nodeServer.publish(channel, { type: 'error', message: String(err) })
  }
})`}
          />
          <CodeBlock
            title="features/metrics/dashboard.ts — live dashboard"
            code={`// streamChannelOptions works for any accumulated stream —
// not just AI. Here: a live server metrics gauge.

const cpuStream = createStreamChannel({
  id: 'cpu-metrics',
  channel: (params: { serverId: string }) => ['metrics:cpu', params],

  initial: { pct: 0, samples: [] as number[] },

  reduce: (state, event: { pct: number }) => ({
    pct: event.pct,
    samples: [...state.samples.slice(-60), event.pct], // rolling 60s window
  }),

  // Open-ended — no isDone, stream runs until the component unmounts
})`}
          />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Resilience — offline queue, gap recovery, multi-tab
// ---------------------------------------------------------------------------

function Resilience() {
  return (
    <section id="resilience" className="section">
      <div className="container">
        <Badge>Resilience</Badge>
        <h2>
          Works on trains.
          <br />
          Works in six tabs.
        </h2>
        <p className="section-sub">
          Three transport wrappers that stack on top of any adapter. Use one,
          two, or all three &mdash; in any combination.
        </p>

        <div className="resilience-grid">
          {/* Offline queue */}
          <div className="resilience-card">
            <div className="resilience-card-icon">@</div>
            <h3>Offline Queue</h3>
            <p>
              The user submits a form on a train. Wrap any transport with{' '}
              <code>createOfflineQueue</code> &mdash; publishes buffer and
              replay in FIFO order when the connection comes back. Show pending
              count reactively via the exposed store.
            </p>
            <CodeBlock
              code={`import { createOfflineQueue } from '@tanstack/realtime'
import { nodeTransport } from '@tanstack/realtime-preset-node'
import { useStore } from '@tanstack/react-store'

const transport = createOfflineQueue(
  nodeTransport({ url: 'wss://rt.example.com' }),
  { maxSize: 500 },
)

const client = createRealtimeClient({ transport })

// Reactive pending-count badge
function SyncStatus() {
  const pending = useStore(
    transport.queueStore,
    (s) => s.pending.length,
  )
  return pending > 0 ? (
    <span>{pending} changes pending sync</span>
  ) : null
}`}
            />
          </div>

          {/* Gap recovery */}
          <div className="resilience-card">
            <div className="resilience-card-icon">+</div>
            <h3>Gap Recovery</h3>
            <p>
              The user reconnects after 30 seconds offline. Two paths: add{' '}
              <code>refetchOnReconnect: true</code> to any collection that has a{' '}
              <code>queryFn</code> (simplest), or use{' '}
              <code>withGapRecovery</code> at the transport level for custom
              replay, server-assisted offsets, or raw subscriptions.
            </p>
            <CodeBlock
              code={`// Option A — collection level (queryFn required)
const tasksOptions = realtimeCollectionOptions({
  ...withRest({ url: '/api/tasks', getKey: (t) => t.id }),
  channel: ['tasks', { projectId }],
  refetchOnReconnect: true, // re-runs queryFn, diffs against local state
})

// Option B — transport level (any subscription)
import { withGapRecovery } from '@tanstack/realtime'

const transport = withGapRecovery(
  nodeTransport({ url: 'wss://rt.example.com' }),
  {
    onGap: async (channel) => {
      // Called for every active channel after reconnect
      await refetchCollection(channel)
    },
    onGapError: (err, channel) => {
      console.error(\`Gap recovery failed for \${channel}:\`, err)
    },
  },
)`}
            />
          </div>

          {/* Multi-tab SharedWorker */}
          <div className="resilience-card">
            <div className="resilience-card-icon">%</div>
            <h3>Multi-Tab SharedWorker</h3>
            <p>
              Six browser tabs. Six WebSocket connections. Six times the server
              cost. <code>createSharedWorkerTransport</code> shares one
              connection across all tabs. Falls back to{' '}
              <code>BroadcastChannel</code> automatically in environments
              without SharedWorker support.
            </p>
            <CodeBlock
              code={`// worker.ts — the SharedWorker script (one per origin)
import { createSharedWorkerServer } from '@tanstack/realtime'
import { nodeTransport } from '@tanstack/realtime-preset-node'

createSharedWorkerServer(
  nodeTransport({ url: 'wss://rt.example.com' }),
)

// app.ts — every tab uses this client, sharing one WebSocket
import {
  createSharedWorkerTransport,
  isSharedWorkerSupported,
} from '@tanstack/realtime'

const transport = isSharedWorkerSupported()
  ? createSharedWorkerTransport(new URL('./worker.ts', import.meta.url))
  : nodeTransport({ url: 'wss://rt.example.com' }) // automatic fallback

const client = createRealtimeClient({ transport })`}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Message Adapters — onMessage
// ---------------------------------------------------------------------------

function MessageAdapters() {
  return (
    <section id="adapters" className="section section-dark">
      <div className="container">
        <Badge>Message Adapters</Badge>
        <h2>
          Your server speaks
          <br />a different dialect.
        </h2>
        <p className="section-sub">
          Supabase Realtime, Hasura, Postgres logical replication, and custom
          protocols all use their own wire formats. The <code>onMessage</code>{' '}
          callback transforms any incoming event into the standard{' '}
          <code>&#123; action, data &#125;</code> shape &mdash; or returns{' '}
          <code>null</code> to discard it.
        </p>

        <div className="use-case-codes">
          <CodeBlock
            title="adapters/supabase.ts — Supabase Realtime"
            code={`// Supabase emits { eventType: 'INSERT' | 'UPDATE' | 'DELETE', new, old }
const tasksOptions = realtimeCollectionOptions<Task, string>({
  getKey: (t) => t.id,
  client: realtimeClient,
  channel: 'public:tasks',   // Supabase channel string

  onMessage: (raw) => {
    const e = raw as { eventType: string; new: Task; old: Task }
    if (e.eventType === 'INSERT') return { action: 'insert', data: e.new }
    if (e.eventType === 'UPDATE') return { action: 'update', data: e.new }
    if (e.eventType === 'DELETE') return { action: 'delete', data: e.old }
    return null
  },
})`}
          />
          <CodeBlock
            title="adapters/cdc.ts — Postgres CDC (Debezium / pglogical)"
            code={`// Debezium logical replication emits { op: 'c' | 'u' | 'd', after, before }
const ordersOptions = realtimeCollectionOptions<Order, string>({
  getKey: (o) => o.id,
  client: realtimeClient,
  channel: 'orders',

  onMessage: (raw) => {
    const e = raw as { op: 'c' | 'u' | 'd'; after?: Order; before?: Order }
    if (e.op === 'c') return { action: 'insert', data: e.after! }
    if (e.op === 'u') return { action: 'update', data: e.after! }
    if (e.op === 'd') return { action: 'delete', data: e.before! }
    return null
  },
})`}
          />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Transports
// ---------------------------------------------------------------------------

function Transports() {
  return (
    <section id="transports" className="section">
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
              Built-in WebSocket server and client. Minimal setup. Suitable for
              local development and single-server deployments.
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
              Production WebSocket infrastructure with token auth and
              server-assisted gap recovery. Drop in one import.
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

// ---------------------------------------------------------------------------
// React Hooks
// ---------------------------------------------------------------------------

function ReactHooks() {
  return (
    <section className="section section-dark">
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
    setTyping((event as { users: string[] }).users)
  })

  return <span>{typing.join(', ')} typing…</span>
}`}
            />
          </div>

          <div className="hook-example">
            <h3>usePublish</h3>
            <p>Stable publish function bound to a channel.</p>
            <CodeBlock
              code={`function TypingBroadcast({ roomId }) {
  const publish = usePublish(['chat:typing', { roomId }])

  return (
    <input
      onFocus={() => publish({ users: [currentUser.id] })}
      onBlur={()  => publish({ users: [] })}
    />
  )
}`}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Quick Start
// ---------------------------------------------------------------------------

function QuickStart() {
  return (
    <section id="quickstart" className="section section-dark">
      <div className="container">
        <Badge>Quick Start</Badge>
        <h2>Getting started</h2>

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
            <h3>Create the server</h3>
            <CodeBlock
              code={`// server/realtime.ts
import { createServer } from 'node:http'
import { createNodeServer } from '@tanstack/realtime-preset-node'

export const nodeServer = createNodeServer({
  getUser: (req) => verifyJwt(req.headers.authorization),
  authorize: async (userId, channel) => ({
    subscribe: true,
    publish:   true,
    presence:  true,
  }),
})

const httpServer = createServer()
nodeServer.attach(httpServer)
httpServer.listen(3001)`}
            />
          </div>

          <div className="qs-step">
            <div className="qs-number">3</div>
            <h3>Create the client and wrap your app</h3>
            <CodeBlock
              code={`// app/client.ts
import { createRealtimeClient } from '@tanstack/realtime'
import { nodeTransport } from '@tanstack/realtime-preset-node'

export const realtimeClient = createRealtimeClient({
  transport: nodeTransport({ url: 'ws://localhost:3001' }),
})

// app/main.tsx
import { RealtimeProvider } from '@tanstack/react-realtime'

function App() {
  return (
    <RealtimeProvider client={realtimeClient}>
      <YourApp />
    </RealtimeProvider>
  )
}`}
            />
          </div>

          <div className="qs-step">
            <div className="qs-number">4</div>
            <h3>Define a live collection with withRest</h3>
            <CodeBlock
              code={`// features/todos/collection.ts
import { withRest, realtimeCollectionOptions } from '@tanstack/realtime'

export const todosOptions = realtimeCollectionOptions({
  ...withRest({ url: '/api/todos', getKey: (t: Todo) => t.id }),
  client: realtimeClient,
  channel: ['todos'],
})`}
            />
          </div>

          <div className="qs-step">
            <div className="qs-number">5</div>
            <h3>Use it in a component</h3>
            <CodeBlock
              code={`import { useCollection } from '@tanstack/react-db'
import { todosOptions } from './collection'

function TodoList() {
  const todos = useCollection(todosOptions)

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
// That's it. Every client updates the instant a todo changes.`}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Ecosystem
// ---------------------------------------------------------------------------

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
              need a live channel. They are parallel systems &mdash; Query owns
              its cache, Realtime owns its collections.
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

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

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
            <a href="#example">End-to-End Example</a>
            <a href="#features">Features</a>
            <a href="#spectrum">Progressive Spectrum</a>
            <a href="#database">Database Integration</a>
            <a href="#crdts">CRDTs</a>
            <a href="#presence">Presence</a>
            <a href="#events">Live Events</a>
            <a href="#streaming">Streaming</a>
            <a href="#resilience">Resilience</a>
            <a href="#adapters">Message Adapters</a>
            <a href="#quickstart">Quick Start</a>
            <a href="#when-to-use">When to use</a>
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
            &copy; {new Date().getFullYear()} mikn. MIT License. Not an
            official TanStack project.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ---------------------------------------------------------------------------
// End-to-End Example — vote counter, all five files
// ---------------------------------------------------------------------------

function EndToEndExample() {
  return (
    <section id="example" className="section section-dark">
      <div className="container">
        <Badge>End-to-End Example</Badge>
        <h2>
          A shared counter,
          <br />
          all the way through.
        </h2>
        <p className="section-sub">
          Five files. A vote counter where multiple users can click
          simultaneously and every click is counted — even when two people hit
          the button at the same time. Shows how server, client, provider,
          collection, and component connect.
        </p>

        <div className="e2e-steps">
          <div className="e2e-step">
            <div className="e2e-step-label">1 — server</div>
            <CodeBlock
              title="server/realtime.ts"
              code={`import { createServer } from 'node:http'
import { createNodeServer } from '@tanstack/realtime-preset-node'

export const nodeServer = createNodeServer({
  // Identify the connecting user — return null to reject the connection
  getUser: (req) => {
    const userId = req.headers['x-user-id']
    return typeof userId === 'string' ? { userId } : null
  },
  authorize: async (_userId, _channel) => ({
    subscribe: true,
    publish: true,
    presence: false,
  }),
})

const http = createServer(myExpressApp)
nodeServer.attach(http)
http.listen(3001)`}
            />
          </div>

          <div className="e2e-step">
            <div className="e2e-step-label">2 — client</div>
            <CodeBlock
              title="app/client.ts"
              code={`import { createRealtimeClient } from '@tanstack/realtime'
import { nodeTransport } from '@tanstack/realtime-preset-node'

export const realtimeClient = createRealtimeClient({
  transport: nodeTransport({ url: 'ws://localhost:3001' }),
})`}
            />
          </div>

          <div className="e2e-step">
            <div className="e2e-step-label">3 — provider</div>
            <CodeBlock
              title="app/main.tsx"
              code={`import { RealtimeProvider } from '@tanstack/react-realtime'
import { realtimeClient } from './client'

// RealtimeProvider makes the client available via context to all hooks below it.
// One provider at the root is enough for the whole app.
export function App() {
  return (
    <RealtimeProvider client={realtimeClient}>
      <VoteCounter postId="post-1" />
    </RealtimeProvider>
  )
}`}
            />
          </div>

          <div className="e2e-step">
            <div className="e2e-step-label">4 — collection</div>
            <CodeBlock
              title="features/votes/collection.ts"
              code={`import { realtimeCollectionOptions } from '@tanstack/realtime'
import { realtimeClient } from '../../app/client'

interface Post { id: string; title: string; votes: number }

export const postsOptions = (postId: string) =>
  realtimeCollectionOptions<Post, string>({
    client: realtimeClient,
    channel: ['posts', { postId }],
    getKey: (p) => p.id,

    // Load current state from the server on mount
    queryFn: () => fetch(\`/api/posts/\${postId}\`).then((r) => r.json()),

    // votes is a PN-counter: concurrent increments from different clients
    // always add up correctly, regardless of message arrival order
    fields: { votes: 'pn-counter' },

    onUpdate: async ({ transaction }) => {
      const patch = transaction.mutations[0].modified
      const res = await fetch(\`/api/posts/\${postId}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      return res.json() // returned row is broadcast to all subscribers
    },
  })`}
            />
          </div>

          <div className="e2e-step">
            <div className="e2e-step-label">5 — component</div>
            <CodeBlock
              title="features/votes/VoteCounter.tsx"
              code={`import { useCollection } from '@tanstack/react-db'
import { postsOptions } from './collection'

// useCollection returns a reactive array. It re-renders whenever any client
// publishes a change to this channel — no useEffect, no manual subscription.
export function VoteCounter({ postId }: { postId: string }) {
  const [post] = useCollection(postsOptions(postId))

  if (!post) return null

  return (
    <div>
      <h2>{post.title}</h2>
      <div className="vote-row">
        <button onClick={() => post.update({ votes: post.votes - 1 })}>−</button>
        <span className="vote-count">{post.votes}</span>
        <button onClick={() => post.update({ votes: post.votes + 1 })}>+</button>
      </div>
    </div>
  )
}`}
            />
          </div>
        </div>

        <div className="callout" style={{ marginTop: '2.5rem' }}>
          <span className="callout-label">How the pieces connect</span>
          <p>
            <code>RealtimeProvider</code> makes the client available via
            context.{' '}
            <code>realtimeCollectionOptions</code> creates a TanStack DB
            collection backed by a live channel — so <code>useCollection</code>{' '}
            returns a reactive array that updates automatically when any client
            publishes a change. The <code>pn-counter</code> on{' '}
            <code>votes</code> means two users clicking{' '}
            <code>+1</code> simultaneously will both have their click counted,
            even if the messages arrive out of order or overlap in transit.
          </p>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Counter-example — when something else is a better fit
// ---------------------------------------------------------------------------

function Positioning() {
  return (
    <section id="when-to-use" className="section">
      <div className="container">
        <Badge>Honest assessment</Badge>
        <h2>
          When it fits.
          <br />
          When it does not.
        </h2>
        <p className="section-sub">
          This is a pub/sub layer between your server and your React
          components. It is not a database, a CDC pipeline, or a collaborative
          editing engine. Here is a straightforward description of where it
          helps and where something else is likely a better fit.
        </p>

        <div className="positioning-grid">
          <div className="positioning-card positioning-good">
            <h3>Reasonable fit</h3>
            <ul>
              <li>
                You have a Node.js server and want live updates without
                polling
              </li>
              <li>
                You want React collections that update reactively when any
                client mutates data
              </li>
              <li>
                You need presence (who is connected) or lightweight pub/sub
                messaging
              </li>
              <li>
                You want concurrent edits on simple fields — counters, tag
                sets, scalar values
              </li>
              <li>
                You want to choose your own transport (WebSocket, SSE,
                Centrifugo) without changing application code
              </li>
            </ul>
          </div>

          <div className="positioning-card positioning-bad">
            <h3>Probably not the right fit</h3>
            <ul>
              <li>
                <strong>You are already using ElectricSQL with TanStack DB.</strong>{' '}
                ElectricSQL syncs Postgres change streams directly to
                client collections. If Postgres is your source of truth,
                that is a better fit than this library — adding a pub/sub
                layer on top would mostly add complexity without benefit.
              </li>
              <li>
                <strong>Postgres is your only source of truth.</strong>{' '}
                ElectricSQL's CDC integration is purpose-built for this. This
                library assumes a server that receives client mutations and
                broadcasts them — it does not read from Postgres directly.
              </li>
              <li>
                <strong>You need rich collaborative text editing.</strong>{' '}
                Yjs and its ecosystem (Hocuspocus, PartyKit) are designed for
                this. The CRDT primitives here cover counters, sets, and
                scalar values — not document trees or character-level
                editing.
              </li>
              <li>
                <strong>Polling is good enough.</strong>{' '}
                TanStack Query with a reasonable{' '}
                <code>refetchInterval</code> is simpler and more predictable
                if your data does not need to update in under a few seconds.
              </li>
            </ul>
          </div>
        </div>

        <div className="callout">
          <span className="callout-label">On TanStack DB</span>
          <p>
            TanStack DB is where collections, optimistic mutations, and
            derived views live. This library adds a realtime transport layer
            on top — it tells TanStack DB what changed, not the other way
            around. If you are already using TanStack DB with ElectricSQL,
            the ElectricSQL adapter is doing the same job as this library for
            your Postgres-backed data. You would only add this library if you
            want to handle a transport that ElectricSQL does not cover (a
            custom WebSocket server, Centrifugo, SSE) or if you want
            presence and pub/sub messaging alongside your collections.
          </p>
        </div>
      </div>
    </section>
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
      <EndToEndExample />
      <DatabaseIntegration />
      <CRDTs />
      <PresenceSection />
      <LiveEvents />
      <Streaming />
      <Resilience />
      <MessageAdapters />
      <Transports />
      <ReactHooks />
      <QuickStart />
      <Ecosystem />
      <Positioning />
      <Footer />
    </>
  )
}
