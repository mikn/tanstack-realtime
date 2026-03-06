import { CodeBlock } from '../../components/CodeBlock'

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Tick() {
  return (
    <article className="doc-article">
      <h1>Tick-Based Sync</h1>
      <p className="doc-lead">
        High-frequency state synchronization with delta compression at
        configurable intervals (up to 60 Hz). For multiplayer games, live
        dashboards, and real-time simulations.
      </p>

      <h2 id="how">How it works</h2>
      <p>
        <code>useTickBatching</code> registers tick-batching hooks on any
        transport, adding a fixed-interval tick loop. Instead of publishing
        individual events, you call <code>setState()</code> to set the local
        state for an entity. The hook batches all dirty entities into a single{' '}
        <strong>tick frame</strong> sent once per interval. On the receiving
        side, <code>onTick()</code> delivers the full batched frame rather than
        individual events.
      </p>
      <CodeBlock
        title="realtime/tickSetup.ts"
        code={`import { useTickBatching } from '@tanstack/realtime'
import { sseTransport } from '@tanstack/realtime-adapter-sse'

const transport = sseTransport({ url: '/api/realtime' })

// Register tick-batching hooks on the transport.
const tick = useTickBatching(transport, {
  // 60 Hz tick rate (16 ms interval, matching requestAnimationFrame)
  tickMs: 16,

  // Only send fields that changed since the last tick.
  deltaCompression: true,
})

// Normal subscribe/publish still work for non-tick channels.
// Tick frames are filtered out of regular subscribe() callbacks.`}
      />
      <div className="doc-callout">
        <p>
          The default <code>tickMs</code> is <strong>16 ms</strong> (roughly 60
          Hz). For lower-frequency use cases like dashboards, increase this to
          100&ndash;1000 ms to reduce bandwidth.
        </p>
      </div>

      <h2 id="collection">Define a tick collection</h2>
      <p>
        <code>tickCollectionOptions</code> creates a TanStack DB collection that
        syncs from tick frames. Each received frame batches all entity updates
        into a single begin/commit cycle for efficient rendering.
      </p>
      <CodeBlock
        title="features/game/players.ts"
        code={`import { createCollection } from '@tanstack/db'
import { tickCollectionOptions } from '@tanstack/realtime'
import { tick } from '../../realtime/tickSetup'

interface Player {
  id: string
  x: number
  y: number
  health: number
  name: string
}

export const playerCollection = createCollection(
  tickCollectionOptions<Player, string>({
    transport: tick,
    channel: 'game:room-1',
    id: 'players',

    getKey: (p) => p.id,
    keyToEntityId: (key) => key,

    fromEntity: (entityId, state, existing) => ({
      id: entityId,
      // Merge with existing state when using delta compression.
      ...(existing ?? { x: 0, y: 0, health: 100, name: '' }),
      ...(state as Partial<Player>),
    }),
  })
)`}
      />
      <p>
        The <code>fromEntity</code> callback converts raw entity state from a
        tick frame into a full row object. When delta compression is enabled,
        the <code>existing</code> parameter contains the current row so you can
        merge partial updates.
      </p>

      <h2 id="delta">Delta compression</h2>
      <p>
        When <code>deltaCompression: true</code> is set on the transport, only
        fields that changed since the last tick are sent over the wire. The
        receiver reconstructs full state from deltas automatically.
      </p>
      <CodeBlock
        code={`// Tick 1: full state sent (first time)
// Wire: { x: 100, y: 200, health: 100, name: 'Alice' }

// Tick 2: only position changed
// Wire: { x: 105, y: 210 }
// Reconstructed: { x: 105, y: 210, health: 100, name: 'Alice' }

// Tick 3: nothing changed — no frame sent at all`}
      />
      <div className="doc-callout">
        <p>
          Delta compression uses a shallow diff. Only top-level fields are
          compared. For nested objects, consider flattening your state or
          managing nested diffing in your <code>fromEntity</code> callback.
        </p>
      </div>

      <h2 id="example">Example: multiplayer game state</h2>
      <p>
        A complete example showing how to send player state each render frame
        and receive batched updates from all players.
      </p>
      <CodeBlock
        title="features/game/GameLoop.tsx"
        code={`import { useEffect, useRef } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { tick } from '../../realtime/tickSetup'
import { playerCollection } from './players'

function GameLoop({ myPlayerId }: { myPlayerId: string }) {
  const posRef = useRef({ x: 0, y: 0 })

  // Send local state every animation frame.
  useEffect(() => {
    let raf: number
    const loop = () => {
      tick.setState('game:room-1', myPlayerId, posRef.current)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      tick.removeEntity('game:room-1', myPlayerId)
    }
  }, [myPlayerId])

  // Read all player positions reactively.
  const { data: players } = useLiveQuery((q) =>
    q.from({ playerCollection })
  )

  return (
    <canvas>
      {/* Render players at their positions */}
    </canvas>
  )
}`}
      />
      <p>
        Use <code>tick.removeEntity()</code> when a player disconnects. The
        removal is included in the next tick frame&rsquo;s <code>removed</code>{' '}
        array.
      </p>

      <h2 id="example-dashboard">Example: live server metrics gauge</h2>
      <p>
        Tick-based sync is not just for games. Here is a live server metrics
        dashboard that batches updates at 10 Hz.
      </p>
      <CodeBlock
        title="features/metrics/metricsSetup.ts"
        code={`import { useTickBatching } from '@tanstack/realtime'
import { sseTransport } from '@tanstack/realtime-adapter-sse'

const transport = sseTransport({ url: '/api/realtime' })

// 10 Hz is plenty for dashboard gauges.
export const metricsTick = useTickBatching(transport, { tickMs: 100 })`}
      />
      <CodeBlock
        title="features/metrics/serverMetrics.ts"
        code={`import { createCollection } from '@tanstack/db'
import { tickCollectionOptions } from '@tanstack/realtime'
import { metricsTick } from './metricsSetup'

interface ServerMetric {
  id: string
  cpu: number
  memory: number
  connections: number
}

export const metricsCollection = createCollection(
  tickCollectionOptions<ServerMetric, string>({
    transport: metricsTick,
    channel: 'metrics:servers',
    id: 'server-metrics',

    getKey: (m) => m.id,
    keyToEntityId: (key) => key,

    fromEntity: (entityId, state) => ({
      id: entityId,
      cpu: 0,
      memory: 0,
      connections: 0,
      ...(state as Partial<ServerMetric>),
    }),
  })
)`}
      />
      <CodeBlock
        title="features/metrics/MetricsDashboard.tsx"
        code={`import { useLiveQuery } from '@tanstack/react-db'
import { metricsCollection } from './serverMetrics'

function MetricsDashboard() {
  const { data: servers } = useLiveQuery((q) =>
    q.from({ metricsCollection })
  )

  return (
    <div className="metrics-grid">
      {servers.map((s) => (
        <div key={s.id} className="metric-card">
          <h3>{s.id}</h3>
          <p>CPU: {s.cpu}%</p>
          <p>Memory: {s.memory}%</p>
          <p>Connections: {s.connections}</p>
        </div>
      ))}
    </div>
  )
}`}
      />
      <div className="doc-callout">
        <p>
          On the server side, call{' '}
          <code>
            tick.setState(&apos;metrics:servers&apos;, serverId, data)
          </code>{' '}
          from your metrics collector. The tick transport batches all server
          updates into a single frame per interval.
        </p>
      </div>
    </article>
  )
}
