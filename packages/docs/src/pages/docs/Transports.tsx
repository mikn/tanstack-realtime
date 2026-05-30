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
        Four transport adapters ship today. They make different trade-offs
        around direction, presence, gap recovery, and the infrastructure you run
        to fan messages out. The matrix below is filled directly from each
        adapter&rsquo;s declared <code>capabilities</code> &mdash; no
        aspirational cells.
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th scope="col">Capability / trait</th>
            <th scope="col">SSE</th>
            <th scope="col">Centrifugo</th>
            <th scope="col">Pusher / Soketi</th>
            <th scope="col">PartyKit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Presence</td>
            <td>No</td>
            <td>Yes</td>
            <td>Yes (presence channels)</td>
            <td>Yes (DO-held membership)</td>
          </tr>
          <tr>
            <td>
              Server&#8209;assisted recovery
              <br />
              (gap replay)
            </td>
            <td>No</td>
            <td>Yes (epoch / offset)</td>
            <td>No (at&#8209;most&#8209;once)</td>
            <td>No (at&#8209;most&#8209;once)</td>
          </tr>
          <tr>
            <td>History</td>
            <td>No</td>
            <td>No</td>
            <td>No</td>
            <td>No</td>
          </tr>
          <tr>
            <td>Ephemeral pub/sub</td>
            <td>Yes</td>
            <td>Yes</td>
            <td>Yes</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td>Publish from client</td>
            <td>
              Via HTTP&nbsp;POST
              <br />
              (server endpoint)
            </td>
            <td>Yes (bidirectional)</td>
            <td>
              Private / presence
              <br />
              channels only
            </td>
            <td>Yes (bidirectional)</td>
          </tr>
          <tr>
            <td>Infra model</td>
            <td>
              Serverless&#8209;friendly HTTP
              <br />
              (any HTTP server)
            </td>
            <td>Self&#8209;host WS server</td>
            <td>
              Managed SaaS
              <br />
              or self&#8209;host Soketi
            </td>
            <td>Edge / Durable Objects</td>
          </tr>
          <tr>
            <td>Notable caveat</td>
            <td>
              In&#8209;process fan&#8209;out is dev / single&#8209;node only;
              needs a <code>PublishBackend</code> to scale
            </td>
            <td>Separate Centrifugo server to run</td>
            <td>
              No replay; public&#8209;channel fan&#8209;out is
              server&#8209;published
            </td>
            <td>You deploy a PartyKit server</td>
          </tr>
        </tbody>
      </table>
      <p>
        Every cell above is asserted against the same declared capabilities the{' '}
        <a href="#capability-contract">conformance kit</a> checks, so the matrix
        cannot drift from what the adapters actually do.
      </p>

      <h2 id="architecture">How realtime.js fits your architecture</h2>
      <p>
        Realtime delivery has two jobs, and they live in different tiers. Being
        explicit about this is what makes the &ldquo;no presence on SSE&rdquo;
        fact an architecture consequence rather than a bug.
      </p>
      <ul>
        <li>
          <strong>The publish endpoint.</strong> In a serverless / edge
          deployment your functions are short&#8209;lived &mdash; they cannot
          hold open sockets, so they act purely as the <em>publish</em> point. A
          mutation handler writes to your database and emits a message; it does
          not keep a connection to every viewer.
        </li>
        <li>
          <strong>The fan&#8209;out tier.</strong> Something durable has to hold
          the live connections and broadcast to them. That is either a provider
          (<strong>Centrifugo</strong>, <strong>Pusher/Soketi</strong>,{' '}
          <strong>PartyKit</strong>) or your own <code>PublishBackend</code>{' '}
          (Redis pub/sub, Postgres <code>LISTEN/NOTIFY</code>, or Cloudflare
          Durable Objects) sitting behind the SSE handler. The in&#8209;process
          SSE handler that ships with the Start preset is a fan&#8209;out tier
          too &mdash; an in&#8209;memory one, which is why it is{' '}
          <strong>dev / single&#8209;node only</strong>.
        </li>
      </ul>
      <p>
        <strong>Why presence isn&rsquo;t a property of the wire.</strong>{' '}
        Presence and typing indicators need{' '}
        <em>server&#8209;held membership state</em> &mdash; some component has
        to know who is currently joined to a channel and notify everyone when
        that set changes. A bare receive&#8209;only SSE stream has nowhere to
        keep that state in a serverless model, so <code>sseTransport</code>{' '}
        honestly reports <code>presence: false</code>. Presence becomes
        available when a presence&#8209;capable provider (Centrifugo, Pusher,
        PartyKit) or an external store holds the membership set &mdash; not by
        changing the wire protocol. See <a href="#/docs/presence">Presence</a>{' '}
        and <a href="#/docs/scaling">Scaling to Production</a> for the{' '}
        <code>PublishBackend</code> interface.
      </p>

      <h2 id="when-to-use-each">When to use each</h2>
      <p>
        <strong>Serverless&#8209;friendly &rarr; SSE</strong> (plus a provider
        for presence). If you just need server&rarr;client live data, start with
        SSE: simplest setup, works behind every corporate proxy and CDN, runs on
        any HTTP server including edge runtimes and serverless functions. The
        TanStack Start preset (<code>@realtimejs/preset-start</code>) uses SSE
        under the hood. SSE is receive&#8209;only and has no presence &mdash; if
        you need presence/typing, pair it with a presence&#8209;capable provider
        below.
      </p>
      <p>
        <strong>Want managed &rarr; Pusher.</strong> Use{' '}
        <code>pusherTransport</code> when you want a hosted fan&#8209;out tier
        with zero servers to operate. You get presence (via Pusher presence
        channels) and ephemeral pub/sub. There is no offset/epoch gap replay
        (delivery is at&#8209;most&#8209;once across disconnects), and client
        publish works only on private/presence channels &mdash;
        public&#8209;channel fan&#8209;out is server&#8209;published via
        Pusher&rsquo;s HTTP API.
      </p>
      <p>
        <strong>
          Want self&#8209;hosted WebSocket &rarr; Soketi or Centrifugo.
        </strong>{' '}
        <code>pusherTransport</code> also points at a self&#8209;hosted{' '}
        <a href="https://soketi.app" target="_blank" rel="noopener">
          Soketi
        </a>{' '}
        server (Pusher&#8209;protocol&#8209;compatible). Choose{' '}
        <strong>Centrifugo</strong> when you additionally need{' '}
        <em>server&#8209;assisted gap recovery</em>: it is the only
        built&#8209;in transport with epoch/offset replay, plus presence,
        multi&#8209;node fan&#8209;out, and token auth out of the box &mdash; no{' '}
        <code>PublishBackend</code> wiring required.
      </p>
      <p>
        <strong>Edge / Cloudflare &rarr; PartyKit.</strong> Use{' '}
        <code>partykitTransport</code> when you deploy to the edge on PartyKit /
        Cloudflare Durable Objects. Presence works because the Durable Object
        holds connection membership server&#8209;side. Like Pusher there is no
        gap replay (at&#8209;most&#8209;once); the adapter re&#8209;asserts
        subscriptions and presence on every reconnect.
      </p>
      <p>
        <strong>Already run your own WebSocket server?</strong> Implement the{' '}
        <code>RealtimeTransport</code> interface (and optionally{' '}
        <code>PresenceCapable</code>) to plug it in. See the{' '}
        <a href="#capability-contract">capability contract</a> below and the{' '}
        <a href="#/docs/wire-protocol">Wire Protocol</a> page.
      </p>

      <h2 id="centrifugo">Centrifugo</h2>
      <p>
        Production WebSocket infrastructure with token auth and server-assisted
        gap recovery.
      </p>
      <CodeBlock
        code={`import { centrifugoTransport } from '@realtimejs/adapter-centrifugo'

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
        code={`import { sseTransport } from '@realtimejs/adapter-sse'

const client = createRealtimeClient({
  transport: sseTransport({ url: '/api/realtime/events' }),
})`}
      />

      <h2 id="pusher">Pusher / Soketi</h2>
      <p>
        Managed fan-out via Pusher Channels, or self-hosted with the
        protocol-compatible Soketi server. Presence maps onto Pusher presence
        channels; client publish works on private/presence channels.
      </p>
      <CodeBlock
        code={`import { pusherTransport } from '@realtimejs/adapter-pusher'

const client = createRealtimeClient({
  transport: pusherTransport({
    key: 'app-key',
    cluster: 'eu',
    // Presence/private channels require auth:
    authEndpoint: '/api/pusher/auth',
  }),
})`}
      />

      <h2 id="partykit">PartyKit / Durable Objects</h2>
      <p>
        Edge fan-out on PartyKit / Cloudflare Durable Objects. Presence works
        because the Durable Object holds connection membership server-side. No
        gap replay &mdash; subscriptions are re-asserted on reconnect.
      </p>
      <CodeBlock
        code={`import { partykitTransport } from '@realtimejs/adapter-partykit'

const client = createRealtimeClient({
  transport: partykitTransport({
    host: 'my-app.username.partykit.dev',
    room: 'hub',
  }),
})`}
      />

      <h2 id="tick">Tick-based batching</h2>
      <p>
        High-frequency use cases &mdash; multiplayer games, collaborative
        drawing, live simulations. Registers hooks on any transport to batch
        state into one frame per tick interval.
      </p>
      <CodeBlock
        title="game/transport.ts"
        code={`import { useTickBatching } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

const transport = sseTransport({ url: '/api/realtime/sse' })
const tick = useTickBatching(transport, {
  tickMs: 16, deltaCompression: true,  // ~60 Hz
})

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

      <h2 id="capability-contract">
        The capability contract &amp; writing your own adapter
      </h2>
      <p>
        Every adapter declares what it can actually do through a small,
        machine-readable contract. This is the public extension point that makes
        &ldquo;use most WebSocket providers&rdquo; real: wrap any provider as a
        transport, declare its capabilities honestly, and validate it against
        the same battery the first-party adapters pass.
      </p>
      <CodeBlock
        title="The contract (exported from @realtimejs/core)"
        code={`interface TransportCapabilities {
  presence: boolean               // server-held membership + member lists
  serverAssistedRecovery: boolean // offset/epoch gap replay after a gap
  history: boolean                // on-demand server-side history retrieval
  ephemeral: boolean              // fire-and-forget pub/sub (the baseline)
}`}
      />
      <p>
        Adapters set <code>transport.capabilities</code>. Consumers read them
        without caring which provider is underneath:
      </p>
      <CodeBlock
        code={`import { getCapabilities } from '@realtimejs/core'

// Per-transport, before wrapping:
const caps = getCapabilities(transport)

// Or on a built client (reflects the active transport):
if (client.capabilities.presence) {
  // safe to use presence/typing hooks
}`}
      />
      <p>
        <strong>Graceful degradation.</strong> On a transport that reports{' '}
        <code>presence: false</code> (e.g. SSE), the presence methods are
        replaced with stubs that throw an actionable error &mdash;{' '}
        <code>
          &ldquo;[realtime] Transport does not support presence. Use a transport
          that implements PresenceCapable.&rdquo;
        </code>{' '}
        &mdash; instead of silently doing nothing. Capability-gated code can
        check <code>client.capabilities.presence</code> first and degrade the UI
        accordingly.
      </p>
      <p>
        <strong>Validate any adapter with the conformance kit.</strong>{' '}
        <code>@realtimejs/adapter-conformance</code> exports{' '}
        <code>runAdapterConformance(harness)</code>, the exact battery every
        built-in adapter passes &mdash; including a real reconnect /
        re-subscribe check and an assertion that declared{' '}
        <code>capabilities</code> match observable behavior (the presence
        sub-battery runs only when <code>presence</code> is declared{' '}
        <code>true</code>, and must agree with{' '}
        <code>hasPresence(transport)</code>).
      </p>
      <CodeBlock
        title="adapter conformance test"
        code={`import { runAdapterConformance } from '@realtimejs/adapter-conformance'
import { myTransport } from './my-transport'

runAdapterConformance({
  name: 'my-transport',
  createTransport: () => myTransport({ socket: fakeProvider }),
  capabilities: {
    presence: true,
    serverAssistedRecovery: false,
    history: false,
    ephemeral: true,
  },
  emitMessage: (channel, data) => fakeProvider.deliver(channel, data),
  simulateDisconnect: () => fakeProvider.drop(),
  simulateReconnect: () => fakeProvider.reconnect(),
})`}
      />

      <h2 id="see-also">See also</h2>
      <ul>
        <li>
          <a href="#/docs/centrifugo">Centrifugo Guide</a> &mdash; end-to-end
          walkthrough: installation, tokens, presence, gap recovery, and
          production topology
        </li>
        <li>
          <a href="#/docs/scaling">Scaling to Production</a> &mdash; the
          PublishBackend interface for multi-process SSE / WebSocket fan-out
        </li>
        <li>
          <a href="#/docs/resilience">Resilience</a> &mdash; offline queue, gap
          recovery, and multi-tab coordination
        </li>
      </ul>
    </article>
  )
}
