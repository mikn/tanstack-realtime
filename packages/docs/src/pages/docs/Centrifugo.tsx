import { CodeBlock } from '../../components/CodeBlock'

export function Centrifugo() {
  return (
    <article className="doc-article">
      <h1>Centrifugo Guide</h1>
      <p className="doc-lead">
        End-to-end walkthrough: run Centrifugo, wire up tokens, enable presence,
        publish from your server, and scale to multi-node with Redis.
      </p>

      <h2 id="what-is-centrifugo">What is Centrifugo</h2>
      <p>
        <a href="https://centrifugal.dev" target="_blank" rel="noopener">
          Centrifugo
        </a>{' '}
        is a standalone, open-source real-time messaging server. Clients connect
        to it over WebSocket or SSE, and your application backend publishes
        messages through its HTTP or GRPC API. Because it handles both the
        persistent connections <em>and</em> the fan-out across nodes, you do not
        need a separate <code>PublishBackend</code> the way you would with the
        SSE transport.
      </p>
      <div className="doc-callout">
        <p>
          <strong>Key capabilities:</strong>
        </p>
        <ul>
          <li>WebSocket and SSE transports with automatic fallback</li>
          <li>
            Built-in horizontal scaling via Redis, KeyDB, Tarantool, or NATS
            broker engines
          </li>
          <li>Channel history with epoch/offset-based gap recovery</li>
          <li>
            JWT-based authentication for connections and per-channel
            subscriptions
          </li>
          <li>Namespace-level access control and configuration</li>
        </ul>
      </div>

      <h2 id="installation">Installation</h2>
      <p>
        The fastest way to start is Docker. For production, a static binary or
        RPM/DEB package is also available.
      </p>
      <CodeBlock
        title="terminal"
        code={`# Pull and run Centrifugo
docker run -d --name centrifugo -p 8000:8000 \\
  -v $(pwd)/config.json:/centrifugo/config.json \\
  centrifugo/centrifugo:v6 centrifugo -c config.json`}
      />
      <p>
        Create a minimal <code>config.json</code> alongside the container. The
        two namespaces below cover data channels and the sidecar presence
        channels the adapter uses.
      </p>
      <CodeBlock
        title="config.json"
        code={`{
  "token_hmac_secret_key": "my-secret-key",
  "api_key": "my-api-key",
  "allowed_origins": ["http://localhost:3000"],
  "namespaces": [
    {
      "name": "app",
      "history_size": 100,
      "history_ttl": "300s",
      "force_recovery": true
    },
    {
      "name": "$prs",
      "allow_publish_for_subscriber": true
    }
  ]
}`}
      />
      <div className="doc-callout">
        <p>
          The <code>app</code> namespace enables history and recovery so clients
          that briefly disconnect receive missed messages automatically. The{' '}
          <code>$prs</code> namespace matches the adapter's default{' '}
          <code>presencePrefix</code> (<code>$prs:</code>) and allows
          subscribers to publish presence heartbeats.
        </p>
      </div>

      <h2 id="install-adapter">Install the adapter</h2>
      <CodeBlock
        code={`npm i @tanstack/realtime @tanstack/react-realtime \\
      @tanstack/realtime-adapter-centrifugo`}
      />

      <h2 id="client-setup">Client setup</h2>
      <p>
        Create a <code>centrifugoTransport</code> and pass it to{' '}
        <code>createRealtimeClient</code>. The only required option is{' '}
        <code>url</code>. Pass <code>token</code> when Centrifugo requires
        authentication (production).
      </p>
      <CodeBlock
        title="app/client/realtime.ts"
        code={`import { createRealtimeClient } from '@tanstack/realtime'
import { centrifugoTransport } from '@tanstack/realtime-adapter-centrifugo'

export const realtimeClient = createRealtimeClient({
  transport: centrifugoTransport({
    url: 'ws://localhost:8000/connection/websocket',
    token: () => fetchConnectionToken(),   // see next section
  }),
})`}
      />

      <h3>All options</h3>
      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>url</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>&mdash;</td>
            <td>Centrifugo WebSocket endpoint URL</td>
          </tr>
          <tr>
            <td>
              <code>token</code>
            </td>
            <td>
              <code>string | () =&gt; string | Promise&lt;string&gt;</code>
            </td>
            <td>&mdash;</td>
            <td>
              JWT for connection auth, or an async function that returns one
            </td>
          </tr>
          <tr>
            <td>
              <code>data</code>
            </td>
            <td>
              <code>Record&lt;string, unknown&gt;</code>
            </td>
            <td>&mdash;</td>
            <td>
              Arbitrary data forwarded to the server in the connect command
            </td>
          </tr>
          <tr>
            <td>
              <code>presencePrefix</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>$prs:</code>
            </td>
            <td>Prefix for sidecar presence channels</td>
          </tr>
          <tr>
            <td>
              <code>initialDelay</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>
              <code>1000</code>
            </td>
            <td>Initial reconnect back-off delay in ms</td>
          </tr>
          <tr>
            <td>
              <code>maxDelay</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>
              <code>30000</code>
            </td>
            <td>Maximum reconnect back-off delay in ms</td>
          </tr>
          <tr>
            <td>
              <code>jitter</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>
              <code>0.25</code>
            </td>
            <td>Jitter factor (0&ndash;1) applied to reconnect delay</td>
          </tr>
          <tr>
            <td>
              <code>WebSocket</code>
            </td>
            <td>
              <code>typeof WebSocket</code>
            </td>
            <td>
              <code>globalThis.WebSocket</code>
            </td>
            <td>
              Custom WebSocket constructor (useful for Node &lt; 21 with the{' '}
              <code>ws</code> package)
            </td>
          </tr>
        </tbody>
      </table>

      <h2 id="connection-tokens">Connection tokens</h2>
      <p>
        Centrifugo authenticates every connection with a JWT. Your backend
        generates the token and the client passes it via the <code>token</code>{' '}
        option. The token must contain at least a <code>sub</code> (subject /
        user ID) claim. Add <code>exp</code> to make tokens expire.
      </p>
      <CodeBlock
        title="server/auth/centrifugo-token.ts"
        code={`import jwt from 'jsonwebtoken'

const CENTRIFUGO_SECRET = process.env.CENTRIFUGO_TOKEN_SECRET!

export function createConnectionToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    CENTRIFUGO_SECRET,
    { expiresIn: '15m' },
  )
}`}
      />
      <CodeBlock
        title="server/routes/api/realtime-token.ts"
        code={`import { createConnectionToken } from '../../auth/centrifugo-token'
import { getSession } from '../../auth/session'

// Expose an endpoint that the client calls to fetch a fresh token
export async function GET(req: Request) {
  const session = await getSession(req)
  if (!session) return new Response('Unauthorized', { status: 401 })
  const token = createConnectionToken(session.userId)
  return Response.json({ token })
}`}
      />
      <p>
        On the client side, the <code>token</code> option can be an async
        function. The adapter calls it on every connect (including reconnects),
        so expired tokens are refreshed automatically.
      </p>
      <CodeBlock
        title="app/client/realtime.ts"
        code={`centrifugoTransport({
  url: 'wss://rt.example.com/connection/websocket',
  token: async () => {
    const res = await fetch('/api/realtime-token')
    const { token } = await res.json()
    return token
  },
})`}
      />
      <div className="doc-callout">
        <p>
          <strong>Required JWT claims:</strong>
        </p>
        <ul>
          <li>
            <code>sub</code> &mdash; user identifier (required by Centrifugo)
          </li>
          <li>
            <code>exp</code> &mdash; expiration timestamp (recommended)
          </li>
          <li>
            <code>info</code> &mdash; optional JSON object attached to the
            connection, visible in join/leave events
          </li>
          <li>
            <code>channels</code> &mdash; optional list of channels to subscribe
            to on connect
          </li>
        </ul>
      </div>

      <h2 id="subscription-tokens">Subscription tokens</h2>
      <p>
        For private or restricted channels, Centrifugo can require a separate
        per-channel JWT. This allows fine-grained authorization: the connection
        token proves <em>who</em> the user is, and subscription tokens prove
        they are <em>allowed</em> to read a specific channel.
      </p>
      <CodeBlock
        title="server/auth/centrifugo-token.ts"
        code={`export function createSubscriptionToken(
  userId: string,
  channel: string,
): string {
  return jwt.sign(
    { sub: userId, channel },
    CENTRIFUGO_SECRET,
    { expiresIn: '15m' },
  )
}`}
      />
      <p>
        Enable subscription tokens in your Centrifugo namespace config by
        setting <code>"allow_subscribe_for_client": false</code> (the default)
        and configuring a proxy or using the <code>token_hmac_secret_key</code>{' '}
        for validation. The client obtains its subscription token by calling
        your backend before subscribing.
      </p>

      <h2 id="presence">Presence via Centrifugo</h2>
      <p>
        The adapter implements presence using a <strong>sidecar channel</strong>{' '}
        pattern. For every data channel <code>ch</code>, presence messages flow
        through a parallel channel named <code>{'${presencePrefix}ch'}</code>{' '}
        (default <code>$prs:ch</code>). This keeps presence traffic separate
        from your data stream.
      </p>
      <CodeBlock
        title="app/features/chat/presence.ts"
        code={`import { createPresenceChannel } from '@tanstack/realtime'

export const chatPresence = createPresenceChannel({
  id: 'chat-presence',
  channel: (params: { roomId: string }) => \`app:chat-\${params.roomId}\`,
})`}
      />
      <CodeBlock
        title="app/features/chat/ChatRoom.tsx"
        code={`import { usePresence } from '@tanstack/react-realtime'
import { chatPresence } from './presence'

// Must be rendered inside <RealtimeProvider>
function ChatRoom({ roomId }: { roomId: string }) {
  const { others, updatePresence } = usePresence(chatPresence, {
    params: { roomId },
    initial: { name: currentUser.name, status: 'active' },
  })

  return (
    <div>
      <h3>Online ({others.length})</h3>
      <ul>
        {others.map((u) => (
          <li key={u.connectionId}>{(u.data as any).name}</li>
        ))}
      </ul>
    </div>
  )
}`}
      />
      <div className="doc-callout">
        <p>
          <strong>Server requirement:</strong> The Centrifugo namespace matching
          your <code>presencePrefix</code> must allow client publishing. In the
          config above, the <code>$prs</code> namespace has{' '}
          <code>"allow_publish_for_subscriber": true</code>.
        </p>
      </div>
      <p>
        Under the hood, the adapter sends three message types on the sidecar
        channel. These are transport-level methods called automatically by the{' '}
        <code>usePresence</code> hook &mdash; you do not call them directly:
      </p>
      <ul>
        <li>
          <code>prs:join</code> &mdash; sent automatically when the hook mounts
        </li>
        <li>
          <code>prs:update</code> &mdash; sent when you call{' '}
          <code>updatePresence()</code> (merges with existing data)
        </li>
        <li>
          <code>prs:leave</code> &mdash; sent automatically when the hook
          unmounts, then the sidecar subscription is removed
        </li>
      </ul>

      <h2 id="server-publishing">Server-side publishing</h2>
      <p>
        Your backend publishes events to Centrifugo via its HTTP API. This is
        how database changes, webhook events, or background jobs push updates to
        connected clients.
      </p>
      <CodeBlock
        title="server/realtime/publish.ts"
        code={`const CENTRIFUGO_API = process.env.CENTRIFUGO_API_URL ?? 'http://localhost:8000/api'
const CENTRIFUGO_API_KEY = process.env.CENTRIFUGO_API_KEY!

export async function publishToChannel(
  channel: string,
  data: unknown,
): Promise<void> {
  const res = await fetch(\`\${CENTRIFUGO_API}/publish\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`apikey \${CENTRIFUGO_API_KEY}\`,
    },
    body: JSON.stringify({ channel, data }),
  })
  if (!res.ok) {
    throw new Error(\`Centrifugo publish failed: \${res.status}\`)
  }
}`}
      />
      <CodeBlock
        title="server/routes/api/todos.ts"
        code={`import { publishToChannel } from '../../realtime/publish'

export async function POST(req: Request) {
  const todo = await createTodo(await req.json())

  // Fan out to all subscribers on the channel
  await publishToChannel('app:todos', {
    action: 'insert',
    data: todo,
  })

  return Response.json(todo, { status: 201 })
}`}
      />
      <div className="doc-callout">
        <p>
          The <code>api_key</code> in <code>config.json</code> must match the{' '}
          <code>Authorization: apikey ...</code> header. For production, use
          GRPC or a Centrifugo proxy instead of the HTTP API for lower latency.
        </p>
      </div>

      <h2 id="gap-recovery">Gap recovery</h2>
      <p>
        When a client briefly disconnects (network blip, laptop sleep), it
        should not need to re-fetch the entire collection. Centrifugo's
        epoch/offset recovery replays only the missed publications.
      </p>
      <p>
        <strong>How it works:</strong> When a channel namespace has{' '}
        <code>history_size</code> and <code>history_ttl</code> configured, the
        server stores recent publications. Each publication gets a monotonic{' '}
        <code>offset</code> within an <code>epoch</code> (a string that changes
        when the server restarts or the stream resets). The adapter tracks the
        last seen epoch and offset per channel. On reconnect, it sends{' '}
        <code>{'recover: true, epoch, offset'}</code> in the subscribe command,
        and Centrifugo replays only what was missed.
      </p>
      <CodeBlock
        title="config.json (namespace excerpt)"
        code={`{
  "name": "app",
  "history_size": 100,
  "history_ttl": "300s",
  "force_recovery": true
}`}
      />
      <p>
        The adapter handles all of this automatically. No client-side
        configuration is needed beyond using a namespace with recovery enabled.
        If the recovery window is exceeded (the client was offline longer than{' '}
        <code>history_ttl</code>), the subscribe reply will not include missed
        publications, and the adapter clears its stored position. Pair this with{' '}
        <code>refetchOnReconnect: true</code> on your collection as a fallback.
      </p>
      <CodeBlock
        code={`// Belt-and-suspenders: recovery for short gaps, refetch for long ones
const todosOptions = realtimeCollectionOptions({
  ...withRest<Todo, string>({
    url: '/api/todos',
    getKey: (t) => t.id,
  }),
  client: realtimeClient,
  channel: 'app:todos',
  refetchOnReconnect: true,   // fallback if epoch/offset recovery fails
})`}
      />

      <h2 id="production-topology">Production topology</h2>
      <p>
        A single Centrifugo node handles tens of thousands of connections. For
        high availability or higher throughput, run multiple Centrifugo nodes
        behind a load balancer and connect them with a Redis engine for
        cross-node fan-out.
      </p>
      <pre className="ascii-diagram">{`
  +-----------+      +-----------+
  |  Client A |      |  Client B |
  +-----+-----+      +-----+-----+
        |                   |
        v                   v
  +-----+-----+      +-----+-----+
  | Centrifugo |      | Centrifugo |
  |   Node 1   |      |   Node 2   |
  +-----+-----+      +-----+-----+
        |                   |
        +--------+----------+
                 |
           +-----+-----+
           |   Redis    |
           |  (engine)  |
           +-----+-----+
                 |
           +-----+-----+
           |  Your App  |
           |  (publish   |
           |   via API)  |
           +-----------+
`}</pre>
      <CodeBlock
        title="config.json (Redis engine)"
        code={`{
  "engine": "redis",
  "redis_address": "redis:6379",
  "token_hmac_secret_key": "my-secret-key",
  "api_key": "my-api-key",
  "namespaces": [
    {
      "name": "app",
      "history_size": 100,
      "history_ttl": "300s",
      "force_recovery": true
    },
    {
      "name": "$prs",
      "allow_publish_for_subscriber": true
    }
  ]
}`}
      />
      <div className="doc-callout">
        <p>
          <strong>Engine options:</strong> Redis is the most common choice.
          Centrifugo also supports KeyDB (Redis-compatible), Tarantool, and NATS
          as broker engines. Choose based on your existing infrastructure.
        </p>
      </div>

      <h2 id="when-to-choose">When to choose Centrifugo</h2>
      <p>
        Centrifugo is the right fit when you need an external, dedicated
        real-time layer that scales independently of your application servers.
        Here is a quick decision guide:
      </p>
      <table>
        <thead>
          <tr>
            <th>Criterion</th>
            <th>SSE transport</th>
            <th>Centrifugo transport</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Deployment</td>
            <td>Your app process holds connections</td>
            <td>Separate Centrifugo process holds connections</td>
          </tr>
          <tr>
            <td>Multi-node fan-out</td>
            <td>
              Needs a <code>PublishBackend</code> (e.g. Upstash Redis)
            </td>
            <td>Built in (Redis engine)</td>
          </tr>
          <tr>
            <td>Protocol</td>
            <td>Server-Sent Events (HTTP/1.1+)</td>
            <td>WebSocket (with SSE fallback)</td>
          </tr>
          <tr>
            <td>Gap recovery</td>
            <td>
              <code>refetchOnReconnect</code> or <code>withGapRecovery</code>
            </td>
            <td>Built-in epoch/offset replay, no extra code</td>
          </tr>
          <tr>
            <td>Auth model</td>
            <td>Your middleware (cookie/session)</td>
            <td>JWT tokens (connection + subscription)</td>
          </tr>
          <tr>
            <td>Serverless friendly</td>
            <td>Yes (SSE works on Workers, Lambda)</td>
            <td>No (Centrifugo is a long-running process)</td>
          </tr>
          <tr>
            <td>Best for</td>
            <td>Simple setups, serverless, single-node</td>
            <td>High scale, multi-region, dedicated infra</td>
          </tr>
        </tbody>
      </table>
      <p>
        If you are running serverless (Cloudflare Workers, Vercel Edge
        Functions), start with the SSE transport plus a{' '}
        <code>PublishBackend</code>. If you have a long-running server
        environment and want built-in clustering, history replay, and
        connection-level auth out of the box, Centrifugo is the stronger choice.
      </p>

      <h2 id="next-steps">Next steps</h2>
      <ul>
        <li>
          <a href="#/docs/transports">Transports</a> &mdash; overview of all
          available transports and message adapters
        </li>
        <li>
          <a href="#/docs/presence">Presence</a> &mdash; the full presence API
          (works with any transport)
        </li>
        <li>
          <a href="#/docs/resilience">Resilience</a> &mdash; offline queue,
          multi-tab coordination, and gap recovery wrappers
        </li>
        <li>
          <a
            href="https://centrifugal.dev/docs/getting-started/introduction"
            target="_blank"
            rel="noopener"
          >
            Centrifugo documentation
          </a>{' '}
          &mdash; official docs for server configuration, proxies, and GRPC API
        </li>
      </ul>
    </article>
  )
}
