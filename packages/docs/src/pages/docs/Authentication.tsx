import { CodeBlock } from '../../components/CodeBlock'

export function Authentication() {
  return (
    <article className="doc-article">
      <h1>Authentication</h1>
      <p className="doc-lead">
        Authentication is the first thing you configure when moving to
        production. TanStack Realtime validates every connection and every
        action &mdash; subscribe, publish, presence &mdash; so only authorized
        users reach your channels.
      </p>

      <div className="doc-callout">
        <p>Auth in TanStack Realtime is split into two layers:</p>
        <ul>
          <li>
            <strong>Server-side</strong> &mdash; <code>getUser</code> identifies
            who is connecting; <code>authorize</code> decides what they can do
            per channel.
          </li>
          <li>
            <strong>Client-side</strong> &mdash; <code>getToken</code> supplies
            credentials with every request so the server can verify identity.
          </li>
        </ul>
      </div>

      <h2 id="server-getuser">
        Server-side: <code>getUser</code>
      </h2>
      <p>
        The <code>getUser</code> callback receives the raw <code>Request</code>{' '}
        object and returns either <code>{`{ userId: string }`}</code> or{' '}
        <code>null</code>. It is called on <strong>every</strong> HTTP request
        &mdash; both the initial GET that opens the SSE stream and every
        subsequent POST action (subscribe, publish, unsubscribe).
      </p>
      <p>
        When <code>getUser</code> returns <code>null</code> or{' '}
        <code>undefined</code>, the handler immediately responds with{' '}
        <strong>401 Unauthorized</strong>. No connection is opened, no action is
        processed.
      </p>
      <p>
        When <code>getUser</code> is omitted entirely, every request is treated
        as authenticated with <code>userId: 'anonymous'</code>. This is
        convenient for development but should never be used in production.
      </p>
      <CodeBlock
        title="app/server/realtime.ts"
        code={`import { createStartHandler } from '@tanstack/realtime-preset-start'
import { verifyJwt } from './auth'

export const realtime = createStartHandler({
  // Extract the user from a Bearer JWT
  getUser: async (req) => {
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return null
    try {
      const { sub } = await verifyJwt(auth.slice(7), process.env.JWT_SECRET!)
      return { userId: sub }
    } catch {
      return null   // invalid or expired token → 401
    }
  },
})`}
      />

      <h2 id="server-authorize">
        Server-side: <code>authorize</code>
      </h2>
      <p>
        Once the user is authenticated, the <code>authorize</code> callback
        decides whether the action is allowed on the requested channel. It
        receives <code>{`{ userId, action, channel }`}</code> and returns a
        boolean. When it returns <code>false</code>, the handler responds with{' '}
        <strong>403 Forbidden</strong>.
      </p>
      <p>
        The <code>action</code> is either <code>'subscribe'</code> or{' '}
        <code>'publish'</code>. Unsubscribe actions are always permitted because
        they are cleanup operations that cannot be used to exfiltrate data.
      </p>
      <p>
        When <code>authorize</code> is omitted, all authenticated users are
        permitted on all channels.
      </p>
      <CodeBlock
        title="app/server/realtime.ts"
        code={`import { createStartHandler } from '@tanstack/realtime-preset-start'
import { getSession } from './auth'
import { db } from './db'

export const realtime = createStartHandler({
  getUser: async (req) => {
    const session = await getSession(req)
    return session ? { userId: session.userId } : null
  },

  authorize: async ({ userId, action, channel }) => {
    // Parse the channel to extract the namespace and params.
    // Channel format: "todos:projectId=abc123"
    const [namespace] = channel.split(':')

    if (namespace === 'todos') {
      // Check project membership before granting access
      const projectId = channel.split('projectId=')[1]
      const member = await db.query.projectMembers.findFirst({
        where: (m, { and, eq }) =>
          and(eq(m.userId, userId), eq(m.projectId, projectId)),
      })
      if (!member) return false

      // Only project admins can publish
      if (action === 'publish') return member.role === 'admin'

      // All members can subscribe
      return true
    }

    // Deny access to unknown channels
    return false
  },
})`}
      />

      <h3>
        Using <code>AuthorizeFn</code> with <code>ChannelPermissions</code>
      </h3>
      <div className="doc-callout">
        <p>
          <strong>Important:</strong> <code>AuthorizeFn</code> (from{' '}
          <code>@tanstack/realtime</code>) and the <code>authorize</code>{' '}
          callback on <code>createSseHandler</code> /{' '}
          <code>createStartHandler</code> are{' '}
          <strong>two different interfaces</strong>:
        </p>
        <ul>
          <li>
            <strong>
              <code>authorize</code> on <code>createSseHandler</code> /{' '}
              <code>createStartHandler</code>
            </strong>{' '}
            &mdash; takes <code>{`{ userId, action, channel: string }`}</code>{' '}
            and returns a <code>boolean</code>. Use this for SSE-based
            deployments (the common case with TanStack Start).
          </li>
          <li>
            <strong>
              <code>AuthorizeFn</code> from <code>@tanstack/realtime</code>
            </strong>{' '}
            &mdash; takes <code>(userId: string, channel: ParsedChannel)</code>{' '}
            and returns <code>{`Promise<ChannelPermissions>`}</code> with
            granular <code>subscribe</code> / <code>publish</code> /{' '}
            <code>presence</code> booleans. Use this for custom server
            implementations (e.g. a standalone WebSocket server built with{' '}
            <code>createNodeServer</code>).
          </li>
        </ul>
        <p>
          They are <strong>not</strong> interchangeable. The examples below show{' '}
          <code>AuthorizeFn</code> for reference &mdash; if you are using{' '}
          <code>createStartHandler</code>, use the simpler{' '}
          <code>authorize</code> callback shown in the section above.
        </p>
      </div>
      <p>
        The core package also exports an <code>AuthorizeFn</code> type and a{' '}
        <code>ChannelPermissions</code> interface for structured per-channel
        authorization. This is useful when you need to return granular
        permissions including presence access in custom server implementations.
      </p>
      <CodeBlock
        title="app/server/authorize.ts"
        code={`import type { AuthorizeFn, ChannelPermissions } from '@tanstack/realtime'
import { db } from './db'

export const authorize: AuthorizeFn = async (
  userId,
  channel,   // ParsedChannel: { namespace, params, raw }
): Promise<ChannelPermissions> => {
  switch (channel.namespace) {
    case 'todos': {
      const member = await db.query.projectMembers.findFirst({
        where: (m, { and, eq }) =>
          and(
            eq(m.userId, userId),
            eq(m.projectId, channel.params.projectId),
          ),
      })
      return member
        ? { subscribe: true, publish: true, presence: true }
        : { subscribe: false, publish: false, presence: false }
    }
    case 'announcements':
      // Public read-only channel — everyone can subscribe, only admins publish
      return {
        subscribe: true,
        publish: userId === 'admin',
        presence: false,
      }
    default:
      return { subscribe: false, publish: false, presence: false }
  }
}`}
      />

      <h2 id="client-token">Client-side: token auth</h2>
      <p>
        On the client, pass a <code>getToken</code> function to your transport.
        For SSE, the token is sent as an <code>Authorization: Bearer</code>{' '}
        header on every request (both GET stream and POST actions).
      </p>
      <CodeBlock
        title="app/client/realtime.ts"
        code={`import { createRealtimeClient } from '@tanstack/realtime'
import { sseTransport } from '@tanstack/realtime-adapter-sse'

export const realtimeClient = createRealtimeClient({
  transport: sseTransport({
    url: '/api/realtime',
    // Called lazily: once when opening the SSE stream, then before each POST action
    getToken: async () => {
      const session = await fetch('/api/auth/session')
      const { accessToken } = await session.json()
      return accessToken
    },
  }),
})`}
      />
      <p>
        The <code>getToken</code> function is called lazily &mdash; once when
        opening the SSE stream and then before each POST action. This means
        short-lived tokens are re-validated on every action without any extra
        configuration.
      </p>

      <h2 id="token-refresh">Token refresh</h2>
      <p>How token refresh works depends on the transport:</p>
      <ul>
        <li>
          <strong>SSE</strong> &mdash; <code>getToken</code> is called on every
          request (GET to open the stream, POST for subscribe/publish actions).
          If a token expires mid-session, the next POST action will call{' '}
          <code>getToken</code> again and receive a fresh token automatically.
          When the stream itself disconnects and reconnects, a fresh token is
          fetched for the new GET request.
        </li>
        <li>
          <strong>WebSocket (Centrifugo)</strong> &mdash; the token is sent once
          during the <code>connect</code> command. The Centrifugo adapter does
          not currently implement mid-session token refresh; if the token
          expires, the connection must be closed and re-opened. The transport
          handles this automatically on reconnect by calling the{' '}
          <code>token</code> function again.
        </li>
      </ul>

      <div className="doc-callout">
        <p>
          <strong>Practical advice:</strong> If your JWT has a short TTL (e.g. 5
          minutes), SSE is simpler because every request re-authenticates. With
          Centrifugo, set a generous connection token TTL or use subscription
          tokens (which are validated per-channel).
        </p>
      </div>

      <h2 id="centrifugo-tokens">Centrifugo tokens</h2>
      <p>Centrifugo uses JWT-based auth with two types of tokens:</p>
      <ul>
        <li>
          <strong>Connection token</strong> &mdash; authenticates the WebSocket
          connection itself. Passed via the <code>token</code> option. It
          contains the user's <code>sub</code> (subject) claim and an
          expiration.
        </li>
        <li>
          <strong>Subscription token</strong> &mdash; authorizes access to a
          specific channel. Issued by your server for each channel the client
          wants to subscribe to. Centrifugo validates this token before allowing
          the subscription.
        </li>
      </ul>
      <CodeBlock
        title="app/client/realtime.ts — Centrifugo"
        code={`import { createRealtimeClient } from '@tanstack/realtime'
import { centrifugoTransport } from '@tanstack/realtime-adapter-centrifugo'

export const realtimeClient = createRealtimeClient({
  transport: centrifugoTransport({
    url: 'wss://realtime.example.com/connection/websocket',
    // Connection token — fetched once per (re)connect
    token: async () => {
      const res = await fetch('/api/realtime/connection-token')
      const { token } = await res.json()
      return token
    },
  }),
})`}
      />
      <CodeBlock
        title="app/routes/api/realtime/connection-token.ts — server"
        code={`import jwt from 'jsonwebtoken'
import { getSession } from '../../../server/auth'

// Endpoint that issues Centrifugo connection JWTs
export async function GET({ request }: { request: Request }) {
  const session = await getSession(request)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const token = jwt.sign(
    { sub: session.userId },
    process.env.CENTRIFUGO_TOKEN_SECRET!,
    { expiresIn: '1h' },
  )

  return Response.json({ token })
}`}
      />
      <p>
        For channels that require per-channel authorization, configure
        Centrifugo to require subscription tokens and create a server endpoint
        that issues them after checking the user's permissions.
      </p>

      <h2 id="validate-publish">
        Server-side validation: <code>ValidatePublishFn</code>
      </h2>
      <p>
        Authorization controls <em>who</em> can publish. Validation controls{' '}
        <em>what</em> they can publish. The <code>ValidatePublishFn</code> hook
        runs server-side before a message is broadcast and can accept, reject,
        or transform the payload.
      </p>
      <p>
        Return <code>{`{ accepted: true }`}</code> to allow,{' '}
        <code>{`{ accepted: true, data: transformed }`}</code> to allow with a
        modified payload, or <code>{`{ accepted: false, reason: '...' }`}</code>{' '}
        to reject. Rejected publishes throw a{' '}
        <code>PublishValidationError</code>.
      </p>
      <CodeBlock
        title="app/server/realtime.ts — Zod validation"
        code={`import { createValidatedPublish } from '@tanstack/realtime'
import { z } from 'zod'

const todoSchema = z.object({
  action: z.enum(['insert', 'update', 'delete']),
  data: z.object({
    id: z.string().uuid(),
    title: z.string().max(200),
    completed: z.boolean(),
  }),
})

const cursorSchema = z.object({
  x: z.number(),
  y: z.number(),
  userId: z.string(),
})

// realtime is from createStartHandler() — see the Start + Drizzle guide
const validatedPublish = createValidatedPublish({
  publish: realtime.publish,
  validate: async ({ channel, data }) => {
    switch (channel.namespace) {
      case 'todos': {
        const result = todoSchema.safeParse(data)
        if (!result.success) {
          return { accepted: false, reason: result.error.message }
        }
        // Return the parsed data to strip unknown fields
        return { accepted: true, data: result.data }
      }
      case 'cursors': {
        const result = cursorSchema.safeParse(data)
        if (!result.success) {
          return { accepted: false, reason: 'Invalid cursor data' }
        }
        return { accepted: true }
      }
      default:
        return { accepted: false, reason: 'Unknown channel' }
    }
  },
})`}
      />

      <h2 id="auth-failures">What happens when auth fails</h2>
      <p>Auth failures surface differently depending on where they occur:</p>
      <ul>
        <li>
          <strong>
            <code>getUser</code> returns null
          </strong>{' '}
          &mdash; the server responds with <strong>401 Unauthorized</strong>.
          For the initial GET request, no SSE stream is opened. For POST
          actions, the action is rejected.
        </li>
        <li>
          <strong>
            <code>authorize</code> returns false
          </strong>{' '}
          &mdash; the server responds with <strong>403 Forbidden</strong>. The
          subscribe or publish action is rejected, but the SSE connection stays
          open for other channels.
        </li>
        <li>
          <strong>Connection failure</strong> &mdash; the SSE transport
          transitions to <code>'reconnecting'</code> and retries with
          exponential back-off. Subscribe to the client's <code>store</code> to
          observe connection state.
        </li>
      </ul>
      <CodeBlock
        title="Observing connection state"
        code={`import { useStore } from '@tanstack/react-store'
import { realtimeClient } from './realtime'

function ConnectionStatus() {
  const { status } = useStore(realtimeClient.store)

  if (status === 'connected') return <span>Connected</span>
  if (status === 'reconnecting') return <span>Reconnecting...</span>
  if (status === 'connecting') return <span>Connecting...</span>
  return <span>Disconnected</span>
}`}
      />
      <div className="doc-callout">
        <p>
          <strong>Tip:</strong> When a POST action fails with 401, the SSE
          transport logs a warning but does not automatically close the stream.
          If your token has expired, the next <code>getToken</code> call (on the
          next action or reconnect) will fetch a fresh one.
        </p>
      </div>
      <div className="doc-callout">
        <p>
          <strong>CORS note:</strong> The SSE handler defaults to{' '}
          <code>Access-Control-Allow-Origin: '*'</code> for both the GET stream
          and POST actions. This is convenient for development but should be
          restricted to your application's origin in production deployments.
        </p>
      </div>

      <h2 id="common-patterns">Common patterns</h2>

      <h3>JWT with middleware</h3>
      <p>
        The most common pattern: your auth middleware (e.g. Lucia, Auth.js,
        Clerk) sets a JWT or session cookie, and <code>getUser</code> validates
        it.
      </p>
      <CodeBlock
        title="JWT from Authorization header"
        code={`getUser: async (req) => {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try {
    const payload = await verifyJwt(auth.slice(7), JWT_SECRET)
    return { userId: payload.sub }
  } catch {
    return null
  }
}`}
      />

      <h3>Session-based auth</h3>
      <p>
        If your app uses HTTP-only session cookies, read the session directly in{' '}
        <code>getUser</code>. No client-side <code>getToken</code> is needed
        because the browser sends cookies automatically.
      </p>
      <div className="doc-callout">
        <p>
          <strong>Same-origin only:</strong> Session/cookie-based auth only
          works when the SSE endpoint is on the same origin as the client. The
          SSE transport uses <code>fetch()</code> without setting{' '}
          <code>{`credentials: 'include'`}</code>, so cookies are not sent on
          cross-origin requests. If your realtime server is on a different
          origin, use token-based auth with <code>getToken</code> instead.
        </p>
      </div>
      <CodeBlock
        title="Session cookie"
        code={`import { getSession } from './auth'   // Lucia, Auth.js, etc.

// Server
const realtime = createStartHandler({
  getUser: async (req) => {
    const session = await getSession(req)
    return session ? { userId: session.userId } : null
  },
})

// Client — no getToken needed, cookies are sent automatically
const realtimeClient = createRealtimeClient({
  transport: sseTransport({ url: '/api/realtime' }),
})`}
      />

      <h3>API key auth</h3>
      <p>
        For server-to-server connections or internal services, an API key in a
        query parameter or header works well.
      </p>
      <CodeBlock
        title="API key from query param"
        code={`getUser: (req) => {
  const key = new URL(req.url).searchParams.get('apiKey')
  return key === process.env.INTERNAL_API_KEY
    ? { userId: 'service' }
    : null
}`}
      />

      <h2 id="next-steps">Next steps</h2>
      <ul>
        <li>
          <a href="#/docs/getting-started">Getting Started</a> &mdash;
          end-to-end setup including auth configuration
        </li>
        <li>
          <a href="#/docs/server-functions">TanStack Start + Drizzle</a> &mdash;
          full-stack guide with server authority and conflict handling
        </li>
        <li>
          <a href="#/docs/transports">Transports</a> &mdash; SSE vs. Centrifugo
          transport details and configuration
        </li>
        <li>
          <a href="#/docs/channels">Channels &amp; Pub/Sub</a> &mdash; channel
          namespacing and publish patterns
        </li>
      </ul>
    </article>
  )
}
