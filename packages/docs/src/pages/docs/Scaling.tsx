import { CodeBlock } from '../../components/CodeBlock'

export function Scaling() {
  return (
    <article className="doc-article">
      <h1>Scaling to Production</h1>
      <p className="doc-lead">
        A single server process works for development, but production needs
        fan-out across every instance behind your load balancer.
      </p>

      <h2 id="why">Why you need this</h2>
      <p>
        During development your app runs as a single Node.js process. Every
        WebSocket / SSE connection lives in the same memory space, so when you
        call <code>publish()</code> the message reaches every subscriber
        instantly.
      </p>
      <p>
        In production you typically run multiple server instances behind a load
        balancer. Each instance only sees its own connections. A message
        published on <strong>Server A</strong> never reaches subscribers
        connected to <strong>Server B</strong> or <strong>Server C</strong>{' '}
        &mdash; unless you wire up a shared pub/sub backbone.
      </p>
      <p>
        That backbone is what the <code>PublishBackend</code> interface
        provides. Plug in Redis, Postgres, or any message bus, and every server
        instance fans out to its local clients automatically.
      </p>

      <h2 id="architecture">Architecture overview</h2>
      <div className="callout">
        <CodeBlock
          code={`                         ┌─────────────────┐
                         │  Load Balancer   │
                         └────┬───┬───┬─────┘
                              │   │   │
               ┌──────────────┤   │   ├──────────────┐
               │              │   │   │              │
          ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
          │Server 1 │   │Server 2 │   │Server 3 │
          │ (SSE)   │   │ (SSE)   │   │ (SSE)   │
          └────┬────┘   └────┬────┘   └────┬────┘
               │              │              │
               └──────┬───────┴───────┬──────┘
                      │               │
                 publish()      subscribe()
                      │               │
               ┌──────▼───────────────▼──────┐
               │    PublishBackend (Redis)    │
               │    PUBLISH  ←→  SUBSCRIBE   │
               └─────────────────────────────┘

  Server 2 publishes → Redis → Servers 1, 2, 3 broadcast
  to their own local SSE connections.`}
        />
      </div>

      <h2 id="publish-backend-interface">The PublishBackend interface</h2>
      <p>
        The interface lives in <code>@tanstack/realtime-preset-start</code> and
        has exactly two methods. <code>publish</code> is required;{' '}
        <code>subscribe</code> is optional but needed for multi-process fan-out.
      </p>
      <CodeBlock
        code={`export interface PublishBackend {
  /**
   * Send a message to the shared store so every server
   * instance can forward it to local clients.
   */
  publish: (channel: string, data: unknown) => Promise<void>

  /**
   * Listen for messages arriving from the shared store.
   * Called once at startup. Return an unsubscribe function.
   *
   * When a message arrives, call onMessage(channel, data)
   * and the handler broadcasts it to local SSE connections.
   */
  subscribe?: (
    onMessage: (channel: string, data: unknown) => void,
  ) => () => void
}`}
      />

      <h2 id="redis">Redis PUBLISH/SUBSCRIBE</h2>
      <p>
        Redis pub/sub is the most common choice. You need two connections: one
        for publishing and one dedicated to subscribing (a Redis client in
        subscribe mode cannot issue other commands).
      </p>
      <CodeBlock
        title="server/redis-backend.ts"
        code={`import Redis from 'ioredis'
import type { PublishBackend } from '@tanstack/realtime-preset-start'

const pub = new Redis(process.env.REDIS_URL!)
const sub = new Redis(process.env.REDIS_URL!)

export const redisBackend: PublishBackend = {
  async publish(channel, data) {
    await pub.publish('realtime', JSON.stringify({ channel, data }))
  },

  subscribe(onMessage) {
    void sub.subscribe('realtime')
    sub.on('message', (_redisChannel, msg) => {
      const { channel, data } = JSON.parse(msg) as {
        channel: string
        data: unknown
      }
      onMessage(channel, data)
    })
    return () => {
      void sub.unsubscribe('realtime')
    }
  },
}`}
      />
      <p>
        Every server instance runs this same code. When Server 2 calls{' '}
        <code>publish()</code>, the message goes to Redis. Redis pushes it to
        the <code>subscribe</code> callback on Servers 1, 2, and 3. Each server
        then broadcasts to its own local SSE connections.
      </p>

      <h2 id="postgres">Postgres LISTEN/NOTIFY</h2>
      <p>
        If you already run Postgres and want to avoid adding Redis, Postgres
        LISTEN/NOTIFY works as a lightweight pub/sub channel. The payload limit
        is 8 KB per notification, which is plenty for most realtime events.
      </p>
      <CodeBlock
        title="server/pg-backend.ts"
        code={`import { Client } from 'pg'
import type { PublishBackend } from '@tanstack/realtime-preset-start'

const pgPub = new Client(process.env.DATABASE_URL!)
const pgSub = new Client(process.env.DATABASE_URL!)

// Initialize connections. Call once at server startup.
async function initPgBackend() {
  await pgPub.connect()
  await pgSub.connect()
}
initPgBackend().catch((err) => {
  console.error('Failed to connect pg backend', err)
  process.exit(1)
})

export const pgBackend: PublishBackend = {
  async publish(channel, data) {
    const payload = JSON.stringify({ channel, data })
    await pgPub.query(\`SELECT pg_notify('realtime', $1)\`, [payload])
  },

  subscribe(onMessage) {
    pgSub.on('notification', (msg) => {
      if (msg.channel !== 'realtime' || !msg.payload) return
      const { channel, data } = JSON.parse(msg.payload) as {
        channel: string
        data: unknown
      }
      onMessage(channel, data)
    })
    void pgSub.query('LISTEN realtime')
    return () => {
      void pgSub.query('UNLISTEN realtime')
    }
  },
}`}
      />

      <h2 id="pairing-start">Pairing with createStartHandler</h2>
      <p>
        Pass the backend as the <code>backend</code> option. No other code
        changes are needed &mdash; server functions, collections, and streams
        all work identically.
      </p>
      <CodeBlock
        title="app/server/realtime.ts"
        code={`import { createStartHandler } from '@tanstack/realtime-preset-start'
import { redisBackend } from './redis-backend'

export const realtime = createStartHandler({
  backend: redisBackend,
  getUser: async (req) => {
    const session = await getSession(req)
    return session ? { userId: session.userId } : null
  },
})

export const realtimePublish = realtime.publish`}
      />

      <h2 id="pairing-node">Pairing with createNodeServer</h2>
      <p>
        The <code>createNodeServer</code> from{' '}
        <code>@tanstack/realtime-preset-node</code> is an in-process WebSocket
        server designed for local development and single-process deployments.
        Its <code>NodeServerOptions</code> interface accepts{' '}
        <code>getUser</code>, <code>authorize</code>, <code>path</code>, and{' '}
        <code>onPublish</code> &mdash; there is no <code>backend</code> option.
        Instead, you wire the backend manually by connecting its{' '}
        <code>subscribe</code> callback to <code>nodeServer.publish</code> and
        routing server-side publishes through the backend.
      </p>
      <CodeBlock
        title="server/realtime.ts"
        code={`import { createNodeServer } from '@tanstack/realtime-preset-node'
import { redisBackend } from './redis-backend'

const nodeServer = createNodeServer({
  getUser: async (req) => {
    const session = await getSession(req)
    return session ? { userId: session.userId } : null
  },
  authorize,
})

// Wire backend subscribe → nodeServer.publish for fan-out
// When any server instance publishes via the backend, Redis
// pushes the message here so we can fan out to local WebSocket
// connections.
redisBackend.subscribe?.((channel, data) => {
  nodeServer.publish(channel, data)
})

// Route server-side publishes through the backend so every
// instance receives the message via the subscribe callback above.
export async function publish(channel: string, data: unknown) {
  await redisBackend.publish(channel, data)
}

// Attach to your HTTP server during startup
nodeServer.attach(httpServer)`}
      />

      <h2 id="pairing-sse">Pairing with createSseHandler</h2>
      <p>
        If you use the lower-level <code>createSseHandler</code> directly
        (without the Start preset), you wire up the backend yourself. The
        pattern is the same &mdash; subscribe at startup, broadcast on incoming
        messages.
      </p>
      <CodeBlock
        title="server/sse-with-backend.ts"
        code={`import { createSseHandler } from '@tanstack/realtime-adapter-sse'
import { redisBackend } from './redis-backend'

const sse = createSseHandler({ getUser: validateToken })

// Wire up the backend: subscribe once at startup
const unsubscribe = redisBackend.subscribe?.((channel, data) => {
  sse.broadcast(channel, data)
})

// Publish through the backend instead of sse.broadcast()
export async function publish(channel: string, data: unknown) {
  await redisBackend.publish(channel, data)
}

// Clean up on shutdown
process.on('SIGTERM', () => {
  unsubscribe?.()
})`}
      />

      <h2 id="centrifugo">Centrifugo as an alternative</h2>
      <p>
        <a
          href="https://centrifugal.dev"
          target="_blank"
          rel="noopener noreferrer"
        >
          Centrifugo
        </a>{' '}
        is a standalone WebSocket server that handles fan-out, presence, and gap
        recovery natively. When you use <code>centrifugoTransport</code> on the
        client side and publish via the Centrifugo server API, there is{' '}
        <strong>no need</strong> for a <code>PublishBackend</code> at all
        &mdash; Centrifugo itself is the shared backbone.
      </p>
      <CodeBlock
        code={`// Client — uses centrifugoTransport, no PublishBackend needed
import { centrifugoTransport } from '@tanstack/realtime-adapter-centrifugo'

const client = createRealtimeClient({
  transport: centrifugoTransport({
    url: 'wss://rt.example.com/connection/websocket',
    token: getUserToken(),
  }),
})

// Server — publish via Centrifugo HTTP API
await fetch('http://centrifugo:8000/api/publish', {
  method: 'POST',
  headers: {
    Authorization: 'apikey ' + process.env.CENTRIFUGO_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    channel: 'todos:project-1',
    data: { action: 'update', data: updatedTodo },
  }),
})`}
      />
      <p>
        This is the recommended path if you want built-in WebSocket scaling,
        presence tracking, and history recovery without managing any of it
        yourself.
      </p>

      <h2 id="durable-objects">Cloudflare Durable Objects</h2>
      <p>
        Cloudflare Durable Objects sidestep the multi-process fan-out problem
        entirely. Each Durable Object is a single-threaded actor that handles
        all WebSocket connections for a given channel. Because there is only one
        instance responsible for each channel, there is no need to synchronize
        state across processes &mdash; every subscriber is connected to the same
        actor.
      </p>
      <p>
        This means you do <strong>not</strong> need a{' '}
        <code>PublishBackend</code> when using Durable Objects. Publishing is
        just a method call on the actor that already holds every connection.
      </p>
      <CodeBlock
        title="src/realtime-do.ts (Cloudflare Worker)"
        code={`import { DurableObject } from 'cloudflare:workers'

export class RealtimeChannel extends DurableObject {
  private connections = new Set<WebSocket>()

  async fetch(request: Request) {
    const pair = new WebSocketPair()
    this.ctx.acceptWebSocket(pair[1])
    this.connections.add(pair[1])
    return new Response(null, { status: 101, webSocket: pair[0] })
  }

  webSocketClose(ws: WebSocket) {
    this.connections.delete(ws)
  }

  // Called from other Workers or via RPC — no backend needed
  async publish(data: unknown) {
    const msg = JSON.stringify(data)
    for (const ws of this.connections) {
      ws.send(msg)
    }
  }
}`}
      />
      <p>
        Each channel maps to its own Durable Object ID. Incoming requests are
        routed to the correct object via{' '}
        <code>env.REALTIME.idFromName(channel)</code>. Because the DO is the
        single source of truth, fan-out is inherently consistent without any
        external pub/sub infrastructure.
      </p>

      <h2 id="when">When you need a PublishBackend</h2>
      <p>Not every deployment needs one. Here is the decision criteria:</p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Scenario</th>
            <th>PublishBackend needed?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Single Node.js process (dev, small app)</td>
            <td>No &mdash; in-process broadcast is sufficient</td>
          </tr>
          <tr>
            <td>Multiple server instances behind a load balancer</td>
            <td>
              <strong>Yes</strong> &mdash; messages must cross process
              boundaries
            </td>
          </tr>
          <tr>
            <td>Auto-scaling (Kubernetes, ECS, Fly.io)</td>
            <td>
              <strong>Yes</strong> &mdash; instances come and go dynamically
            </td>
          </tr>
          <tr>
            <td>Serverless functions (Vercel, Lambda)</td>
            <td>
              <strong>Yes</strong> &mdash; each invocation is isolated
            </td>
          </tr>
          <tr>
            <td>Centrifugo as the transport layer</td>
            <td>No &mdash; Centrifugo handles fan-out natively</td>
          </tr>
          <tr>
            <td>Cloudflare Durable Objects (single actor per channel)</td>
            <td>No &mdash; state lives in the Durable Object</td>
          </tr>
        </tbody>
      </table>

      <h2 id="summary">Summary</h2>
      <p>
        The <code>PublishBackend</code> interface is deliberately minimal:
        implement <code>publish</code> and <code>subscribe</code>, pass it as{' '}
        <code>backend</code>, and the rest of your application code stays
        exactly the same. Redis and Postgres are the two most common choices,
        but any message bus that supports pub/sub semantics will work. If you
        prefer a fully managed solution, Centrifugo removes the need for a
        backend entirely.
      </p>
    </article>
  )
}
