import { CodeBlock } from '../../components/CodeBlock'

export function Transports() {
  return (
    <article className="doc-article">
      <h1>Transports</h1>
      <p className="doc-lead">
        One API, any infrastructure. Swap transports without changing a line of
        application code.
      </p>

      <h2 id="which-transport">Which transport should I use?</h2>
      <p>
        Each transport makes different trade-offs around direction, feature set,
        and infrastructure requirements. Use the matrix below to compare them at
        a glance.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Criterion</th>
            <th scope="col">WebSocket</th>
            <th scope="col">SSE</th>
            <th scope="col">Centrifugo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Direction</td>
            <td>Bidirectional</td>
            <td>Server&rarr;Client (publish via HTTP&nbsp;POST)</td>
            <td>Bidirectional</td>
          </tr>
          <tr>
            <td>Presence support</td>
            <td>Yes</td>
            <td>No</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td>Corporate proxy&#8209;friendly</td>
            <td>Sometimes blocked</td>
            <td>Always works (standard HTTP)</td>
            <td>Sometimes blocked</td>
          </tr>
          <tr>
            <td>Multi&#8209;process scaling</td>
            <td>External pub/sub needed</td>
            <td>Need PublishBackend</td>
            <td>Built&#8209;in (Centrifugo cluster)</td>
          </tr>
          <tr>
            <td>Infrastructure required</td>
            <td>Node.js server</td>
            <td>Any HTTP server</td>
            <td>Centrifugo binary</td>
          </tr>
          <tr>
            <td>Best for</td>
            <td>
              Full&#8209;featured apps needing presence&nbsp;+&nbsp;pub/sub
            </td>
            <td>Simple live data, SSR, edge functions</td>
            <td>High&#8209;scale production, existing Centrifugo infra</td>
          </tr>
        </tbody>
      </table>

      <h2 id="when-to-use-each">When to use each</h2>
      <p>
        <strong>Start with SSE</strong> if you just need server&rarr;client live
        data. It has the simplest setup, works behind every corporate proxy and
        CDN, and runs on any HTTP server &mdash; including edge runtimes and
        serverless functions. The TanStack Start preset (
        <code>@tanstack/realtime-preset-start</code>) uses SSE under the hood.
      </p>
      <p>
        <strong>Use WebSocket</strong> when you need presence, typing
        indicators, or client&rarr;server pub/sub. WebSocket connections are
        natively bidirectional, so the client can publish directly over the open
        connection without a separate HTTP round-trip. The coordinated and
        shared-worker transports in <code>@tanstack/realtime</code> also build
        on WebSocket semantics.
      </p>
      <p>
        <strong>Use Centrifugo</strong> when you need production-scale
        clustering or already run Centrifugo infrastructure. Centrifugo handles
        multi-node fan-out, epoch/offset gap recovery, and token-based auth out
        of the box &mdash; no <code>PublishBackend</code> wiring required.
      </p>

      <h2 id="websocket">Built-in WebSocket</h2>
      <p>
        <code>wsTransport</code> lives in the base package. Connects to a{' '}
        <code>createNodeServer</code> instance. Works in browsers,
        SharedWorkers, and Node.js.
      </p>
      <CodeBlock
        code={`import { createRealtimeClient, wsTransport } from '@tanstack/realtime'

const client = createRealtimeClient({
  transport: wsTransport({ url: 'ws://localhost:3001' }),
})`}
      />


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
