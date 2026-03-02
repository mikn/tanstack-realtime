import { CodeBlock } from '../../components/CodeBlock'

export function Resilience() {
  return (
    <article className="doc-article">
      <h1>Resilience</h1>
      <p className="doc-lead">
        Transport wrappers that stack on top of any adapter &mdash; SSE,
        Centrifugo, or custom. Use one, two, or all three in any combination.
      </p>

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
  createRealtimeClient,
} from '@tanstack/realtime'
import { sseTransport } from '@tanstack/realtime-adapter-sse'
import { useStore } from '@tanstack/react-store'

const transport = createOfflineQueue(
  sseTransport({ url: '/api/realtime' }),
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
  ...withRest({ url: \`/api/tasks?projectId=\${projectId}\`, getKey: (t) => t.id }),
  channel: ['tasks', { projectId }],
  refetchOnReconnect: true,
})

// Option B — transport level
import { withGapRecovery } from '@tanstack/realtime'
import { sseTransport } from '@tanstack/realtime-adapter-sse'

const transport = withGapRecovery(
  sseTransport({ url: '/api/realtime' }),
  {
    onGap: async (channel) => {
      await refetchCollection(channel)
    },
  },
)`}
      />

      <h2 id="multi-tab">Multi-tab coordination</h2>
      <p>
        Six browser tabs means six open connections.{' '}
        <code>createCoordinatedTransport</code> shares a single connection
        across all tabs automatically.
      </p>

      <h3>BroadcastChannel (default)</h3>
      <p>
        One tab is elected leader and holds the connection. Others proxy through
        it. Zero config.
      </p>
      <CodeBlock
        code={`import { createCoordinatedTransport } from '@tanstack/realtime'
import { sseTransport } from '@tanstack/realtime-adapter-sse'

const transport = createCoordinatedTransport({
  transport: () => sseTransport({ url: '/api/realtime' }),
})`}
      />

      <h3>SharedWorker (opt-in)</h3>
      <p>
        A separate worker process survives tab close and crashes. Requires a
        small worker file.
      </p>
      <CodeBlock
        title="realtime.worker.ts"
        code={`import { createSharedWorkerCoordinator } from '@tanstack/realtime'
import { sseTransport } from '@tanstack/realtime-adapter-sse'

const coordinator = createSharedWorkerCoordinator(
  sseTransport({ url: '/api/realtime' }),
)
self.addEventListener('connect', (e) => {
  coordinator.connect(e.ports[0])
})`}
      />
      <CodeBlock
        title="app code"
        code={`import { createCoordinatedTransport } from '@tanstack/realtime'
import { sseTransport } from '@tanstack/realtime-adapter-sse'

const transport = createCoordinatedTransport({
  transport: () => sseTransport({ url: '/api/realtime' }),
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
