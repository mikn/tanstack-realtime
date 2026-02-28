import { CodeBlock } from '../../components/CodeBlock'

export function Resilience() {
  return (
    <article className="doc-article">
      <h1>Resilience</h1>
      <p className="doc-lead">
        Transport wrappers, channel recovery, and FPS sync that stack on top of
        any adapter. Use one, two, or all in any combination.
      </p>

      <h2 id="channel-recovery">Channel recovery</h2>
      <p>
        Serverless and edge functions are short-lived by design — a Lambda
        invocation typically lasts at most 15 minutes. WebSocket connections
        can outlive function instances, causing the server-side channel state
        to be lost. Channel recovery lets a long-lived client session survive
        across multiple short-lived function invocations.
      </p>
      <p>
        The strategy is <strong>compaction to the database</strong>: before a
        function instance shuts down, it writes a snapshot of each channel&rsquo;s
        current sequence number and any buffered messages to the database.
        When a new instance starts or a client reconnects, it reads the snapshot,
        fast-forwards to the last known sequence, and resumes from there.
      </p>
      <CodeBlock
        title="server/realtime.ts — channel recovery with compaction"
        code={`import { createNodeServer } from '@tanstack/realtime-preset-node'

export const nodeServer = createNodeServer({
  signingSecret: process.env.REALTIME_SIGNING_SECRET,
  getUser: (req) => verifyJwt(req.headers.authorization),
  authorize: async (userId, channel) => ({ subscribe: true, publish: true }),

  // Called periodically and on graceful shutdown.
  // Persist per-channel state so the next function instance can resume.
  onCompact: async (snapshots) => {
    await db.channelSnapshots.upsertMany(
      snapshots.map(({ channel, seq, ts }) => ({
        channel,
        seq,
        ts,
        updatedAt: new Date(),
      })),
    )
  },

  // Called when a client sends { type: 'recover', channel, lastSeq }.
  // Return the snapshot so the client can fast-forward.
  onRecover: async (channel, clientLastSeq) => {
    const snapshot = await db.channelSnapshots.findOne({ channel })
    if (!snapshot || snapshot.seq <= clientLastSeq) return null
    return { seq: snapshot.seq, ts: snapshot.ts }
  },
})`}
      />
      <p>
        On the client side, enable recovery by passing{' '}
        <code>recoverOnReconnect: true</code>. The client automatically sends
        its last known sequence on reconnect and applies the snapshot diff
        before resuming normal operation.
      </p>
      <CodeBlock
        code={`const todosOptions = realtimeCollectionOptions({
  ...withRest({ url: '/api/todos', getKey: (t: Todo) => t.id }),
  client: realtimeClient,
  channel: ['todos', { projectId }],
  // Trigger recovery on reconnect instead of a full refetch
  recoverOnReconnect: true,
})`}
      />
      <div className="doc-callout">
        <p>
          <strong>Default pattern recommendation:</strong> Use{' '}
          <code>recoverOnReconnect: true</code> together with{' '}
          <code>onCompact</code> for all collections in serverless environments.
          This avoids a full <code>queryFn</code> refetch (which can be
          expensive) while still recovering missed messages. Fall back to{' '}
          <code>refetchOnReconnect: true</code> only when you cannot persist
          channel snapshots.
        </p>
      </div>

      <h2 id="fps-sync">FPS sync (tick-based updates)</h2>
      <p>
        High-frequency use cases like multiplayer games, live dashboards, and
        collaborative cursors can produce hundreds of updates per second. Sending
        every event individually saturates the connection and causes jank on the
        receiving end. FPS sync batches updates into fixed-interval ticks and
        delivers the <em>latest</em> value for each key in a single frame.
      </p>
      <CodeBlock
        title="Configuring a tick-based collection"
        code={`import { tickCollectionOptions } from '@tanstack/realtime'

// Snapshots are sent at most 30 times per second.
// Intermediate updates between ticks are dropped — only the latest wins.
const cursorOptions = tickCollectionOptions({
  client: realtimeClient,
  channel: ['cursors', { roomId }],
  fps: 30,           // target frame rate
  getKey: (c) => c.userId,
})`}
      />
      <p>
        For data where you want <em>all</em> intermediate values (e.g. chat
        messages, audit events), use <code>liveChannelOptions</code> instead
        — it has no tick batching and delivers every event in order.
      </p>
      <CodeBlock
        title="Adaptive FPS — throttle on the client"
        code={`import { throttle } from '@tanstack/realtime'

// Publish at most every 33 ms (~30 fps), regardless of mouse move frequency.
const publishCursor = throttle(
  (pos: { x: number; y: number }) => client.publish(['cursors', { roomId }], pos),
  { interval: 33 },
)`}
      />
      <div className="doc-callout">
        <p>
          <strong>Client throttle vs server tick:</strong> <code>throttle</code>{' '}
          reduces how often the client <em>sends</em>; the tick collection
          controls how often the server <em>broadcasts</em>. For the best
          results, combine both: throttle on the client to reduce network load,
          and use <code>fps</code> on the collection to smooth delivery to
          subscribers.
        </p>
      </div>

      <h2 id="offline-queue">Offline queue</h2>
      <p>
        Wrap any transport with <code>createOfflineQueue</code>. Publishes
        buffer and replay in FIFO order when the connection comes back. Plug in{' '}
        <code>localStorage</code> or IndexedDB so messages survive page refresh.
      </p>
      <CodeBlock
        code={`import {
  createOfflineQueue,
  createLocalStorageAdapter,
  wsTransport,
} from '@tanstack/realtime'
import { useStore } from '@tanstack/react-store'

const transport = createOfflineQueue(
  wsTransport({ url: 'wss://rt.example.com' }),
  {
    maxSize: 500,
    storage: createLocalStorageAdapter(),
  },
)

const client = createRealtimeClient({ transport })

// Reactive pending-count badge
function SyncStatus() {
  const pending = useStore(transport.queueStore, (s) => s.pending.length)
  return pending > 0
    ? <span>{pending} changes pending sync</span>
    : null
}`}
      />

      <h2 id="gap-recovery">Gap recovery</h2>
      <p>
        Two paths: add <code>refetchOnReconnect: true</code> to any collection
        that has a <code>queryFn</code>, or use <code>withGapRecovery</code> at
        the transport level.
      </p>
      <CodeBlock
        code={`// Option A — collection level (queryFn required)
const tasksOptions = realtimeCollectionOptions({
  ...withRest({ url: '/api/tasks', getKey: (t) => t.id }),
  channel: ['tasks', { projectId }],
  refetchOnReconnect: true,
})

// Option B — transport level
import { withGapRecovery, wsTransport } from '@tanstack/realtime'

const transport = withGapRecovery(
  wsTransport({ url: 'wss://rt.example.com' }),
  {
    onGap: async (channel) => {
      await refetchCollection(channel)
    },
  },
)`}
      />

      <h2 id="multi-tab">Multi-tab coordination</h2>
      <p>
        Six browser tabs, six WebSocket connections, six times the server cost.{' '}
        <code>createCoordinatedTransport</code> shares a single connection
        across all tabs automatically.
      </p>

      <h3>BroadcastChannel (default)</h3>
      <p>
        One tab is elected leader and holds the connection. Others proxy through
        it. Zero config.
      </p>
      <CodeBlock
        code={`import { createCoordinatedTransport, wsTransport } from '@tanstack/realtime'

const transport = createCoordinatedTransport({
  transport: () => wsTransport({ url: 'wss://rt.example.com' }),
})`}
      />

      <h3>SharedWorker (opt-in)</h3>
      <p>
        A separate worker process survives tab close and crashes. Requires a
        small worker file.
      </p>
      <CodeBlock
        title="realtime.worker.ts"
        code={`import { createSharedWorkerCoordinator, wsTransport } from '@tanstack/realtime'

const coordinator = createSharedWorkerCoordinator(
  wsTransport({ url: 'wss://rt.example.com' }),
)
self.addEventListener('connect', (e) => {
  coordinator.connect(e.ports[0])
})`}
      />
      <CodeBlock
        title="app code"
        code={`const transport = createCoordinatedTransport({
  transport: () => wsTransport({ url: 'wss://rt.example.com' }),
  workerUrl: new URL('./realtime.worker.ts', import.meta.url),
})`}
      />

      <h2 id="utilities">Utilities</h2>

      <h3>createDedup</h3>
      <p>Bounded deduplication filter using FIFO eviction.</p>
      <CodeBlock
        code={`import { createDedup } from '@tanstack/realtime'

const dedup = createDedup({ maxSize: 500 })

transport.subscribe('chat', (msg) => {
  if (dedup.seen('chat', msg.id)) return
  handleMessage(msg)
})`}
      />

      <h3>throttle</h3>
      <p>Trailing-edge throttle for high-frequency publishes.</p>
      <CodeBlock
        code={`import { throttle } from '@tanstack/realtime'

const throttledPublish = throttle(
  (pos: { x: number; y: number }) => client.publish('cursors', pos),
  { interval: 50 },
)

onMouseMove = (e) =>
  throttledPublish({ x: e.clientX, y: e.clientY })`}
      />

      <h3>createEphemeralMap</h3>
      <p>
        Key-value store where entries auto-expire after a TTL. Perfect for
        typing indicators.
      </p>
      <CodeBlock
        code={`import { createEphemeralMap } from '@tanstack/realtime'

const typingUsers = createEphemeralMap<{ name: string }>({
  ttl: 3000,
})

typingUsers.set(userId, { name: 'Alice' })

typingUsers.subscribe((entries) => {
  setTyping(entries.map((e) => e.value.name))
})`}
      />
    </article>
  )
}
