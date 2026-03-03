import { CodeBlock } from '../../components/CodeBlock'

export function Transports() {
  return (
    <article className="doc-article">
      <h1>Transports</h1>
      <p className="doc-lead">
        One API, any infrastructure. Swap transports without changing a line of
        application code.
      </p>

      <h2 id="centrifugo">Centrifugo</h2>
      <p>
        Production WebSocket infrastructure with token auth and server-assisted
        gap recovery.
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

      <h2 id="sse">Server-Sent Events</h2>
      <p>
        For environments where WebSocket is unavailable. Works behind corporate
        proxies and CDNs.
      </p>
      <CodeBlock
        code={`import { sseTransport } from '@tanstack/realtime-adapter-sse'

const client = createRealtimeClient({
  transport: sseTransport({ url: '/api/realtime/events' }),
})`}
      />

      <h2 id="tick">Tick-based transport</h2>
      <p>
        High-frequency use cases &mdash; multiplayer games, collaborative
        drawing, live simulations. Wraps any transport and sends one frame per
        tick interval.
      </p>
      <CodeBlock
        title="game/transport.ts"
        code={`import { tickTransport } from '@tanstack/realtime'
import { sseTransport } from '@tanstack/realtime-adapter-sse'

const tick = tickTransport(
  sseTransport({ url: '/api/realtime/sse' }),
  { tickMs: 16, deltaCompression: true },  // ~60 Hz
)

// Set state each frame — batched into one publish per tick
tick.setState('game:room-1', myPlayerId, {
  x: player.x,
  y: player.y,
  health: player.health,
})

// Receive batched frames from all players
tick.onTick('game:room-1', (frame) => {
  for (const [entityId, state] of Object.entries(frame.entities)) {
    updateEntity(entityId, state)
  }
  for (const entityId of frame.removed) {
    removeEntity(entityId)
  }
})`}
      />

      <h2 id="message-adapters">Message adapters</h2>
      <p>
        If your server speaks a different wire format (Supabase, Debezium CDC),
        use the <code>onMessage</code> callback to transform incoming events.
      </p>
      <CodeBlock
        title="Supabase Realtime"
        code={`const tasksOptions = realtimeCollectionOptions({
  getKey: (t) => t.id,
  client: realtimeClient,
  channel: 'public:tasks',

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
        title="Postgres CDC (Debezium)"
        code={`const ordersOptions = realtimeCollectionOptions({
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
    </article>
  )
}
