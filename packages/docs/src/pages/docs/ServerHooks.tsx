import { CodeBlock } from '../../components/CodeBlock'

export function ServerHooks() {
  return (
    <article className="doc-article">
      <h1>Server Lifecycle Hooks</h1>
      <p className="doc-lead">
        The server-side callback surface for authentication, authorization,
        publish validation, and connection lifecycle events. Every hook is
        synchronous or async and integrates with any auth system you already
        use.
      </p>

      <div className="doc-callout">
        <p>
          <strong>Two kinds of hooks.</strong> The server callback surface
          includes <strong>request hooks</strong> (<code>getUser</code>,{' '}
          <code>authorize</code>, <code>createValidatedPublish</code>) that run
          on every HTTP request, and <strong>lifecycle hooks</strong> (
          <code>onClientConnect</code>, <code>onClientDisconnect</code>,{' '}
          <code>onFirstSubscriber</code>, <code>onChannelEmpty</code>) that fire
          on connection and channel state changes.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      <h2 id="overview">Handler packages</h2>
      <p>
        Two packages expose the server callback surface. Both accept the same{' '}
        <code>getUser</code>, <code>authorize</code>, and lifecycle hook options
        because <code>createStartHandler</code> delegates to{' '}
        <code>createSseHandler</code> internally.
      </p>
      <ul>
        <li>
          <strong>
            <code>@realtimejs/adapter-sse</code>
          </strong>{' '}
          — <code>createSseHandler</code>. Fetch-API compatible. Mount on any
          edge runtime, Hono, or bare Node.js.
        </li>
        <li>
          <strong>
            <code>@realtimejs/preset-start</code>
          </strong>{' '}
          — <code>createStartHandler</code>. Wraps <code>createSseHandler</code>{' '}
          and adds a first-class <code>publish</code> function plus optional{' '}
          <code>PublishBackend</code> for multi-process fan-out. Returns{' '}
          <code>{'{ handle, publish, createStream, dispose }'}</code>.
        </li>
      </ul>
      <div className="doc-callout">
        <p>
          The examples below assign the handler directly to a{' '}
          <code>realtime</code> binding to focus on the auth/lifecycle surface.
          When you also use the auto-reactive <code>realtime.query()</code>/
          <code>realtime.mutation()</code> layer, the handler is one half of a
          composition with <code>createReactiveQueries()</code> &mdash; see{' '}
          <a href="#/docs/server-functions">TanStack Start + Drizzle</a> for the
          full <code>realtime</code> object. The hook options documented here
          are identical either way.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      <h2 id="getUser">
        <code>getUser</code> — authentication
      </h2>
      <p>
        Called on <strong>every</strong> incoming HTTP request — both the GET
        that opens an SSE stream and every POST that dispatches a client action
        (subscribe / unsubscribe / publish). Return{' '}
        <code>{'{ userId: string }'}</code> to allow the request, or{' '}
        <code>null</code> / <code>undefined</code> to reject with{' '}
        <strong>401 Unauthorized</strong>.
      </p>
      <p>
        When <code>getUser</code> is omitted, every request is treated as an
        anonymous user and allowed through. This is intentional for development
        and internal APIs that do not require auth.
      </p>

      <h3>Signature</h3>
      <CodeBlock
        code={`getUser?: (req: Request) =>
  | { userId: string }
  | null
  | undefined
  | Promise<{ userId: string } | null | undefined>`}
      />

      <h3>JWT Bearer token</h3>
      <p>
        The most common pattern. The client sets an{' '}
        <code>Authorization: Bearer &lt;token&gt;</code> header via{' '}
        <code>sseTransport({'{ getToken }'})</code>; the server verifies it
        here.
      </p>
      <CodeBlock
        title="app/server/realtime.ts"
        code={`import { createStartHandler } from '@realtimejs/preset-start'
import { verifyJwt } from './auth'

export const realtime = createStartHandler({
  getUser: async (req) => {
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return null
    try {
      const { sub } = await verifyJwt(auth.slice(7), process.env.JWT_SECRET!)
      return { userId: sub }
    } catch {
      return null   // expired / invalid token → 401
    }
  },
})

export const realtimePublish = realtime.publish`}
      />

      <h3>Session cookie</h3>
      <CodeBlock
        title="app/server/realtime.ts"
        code={`import { createStartHandler } from '@realtimejs/preset-start'
import { getSession } from './auth'

export const realtime = createStartHandler({
  getUser: async (req) => {
    const session = await getSession(req)
    return session ? { userId: session.userId } : null
  },
})`}
      />

      <h3>API key from query param</h3>
      <p>
        Useful for server-to-server connections where setting headers is
        inconvenient.
      </p>
      <CodeBlock
        code={`getUser: (req) => {
  const key = new URL(req.url).searchParams.get('apiKey')
  return key === process.env.API_KEY ? { userId: 'server' } : null
}`}
      />

      {/* ------------------------------------------------------------------ */}
      <h2 id="authorize">
        <code>authorize</code> — per-channel access control
      </h2>
      <p>
        Called after <code>getUser</code> succeeds. Controls whether an
        authenticated user may <strong>subscribe</strong>,{' '}
        <strong>publish</strong>, or use <strong>presence</strong> on a specific
        channel. Return a <code>ChannelPermissions</code> object for
        fine-grained control, or a plain <code>boolean</code> as shorthand (
        <code>true</code> = all permissions, <code>false</code> = deny all →{' '}
        <strong>403 Forbidden</strong>).
      </p>
      <p>
        <code>unsubscribe</code> actions are always allowed and bypass this hook
        — they are cleanup operations and cannot be used to exfiltrate data.
      </p>
      <p>
        When <code>authorize</code> is omitted, all authenticated users are
        permitted on all channels.
      </p>

      <h3>Signature</h3>
      <CodeBlock
        code={`import type { AuthorizeFn, ChannelPermissions, ParsedChannel } from '@realtimejs/core'

type AuthorizeFn = (
  userId: string,
  channel: ParsedChannel,   // { namespace, params, raw }
) => ChannelPermissions | boolean | Promise<ChannelPermissions | boolean>

interface ChannelPermissions {
  subscribe: boolean
  publish: boolean
  presence: boolean
}

interface ParsedChannel {
  namespace: string              // e.g. "todos"
  params: Record<string, string> // e.g. { projectId: "abc" }
  raw: string                    // e.g. "todos:projectId=abc"
}`}
      />
      <p>
        When you return a boolean, it is expanded via{' '}
        <code>normalizePermissions</code>: <code>true</code> becomes{' '}
        <code>{`{ subscribe: true, publish: true, presence: true }`}</code> and{' '}
        <code>false</code> denies everything.
      </p>

      <h3>Basic role check</h3>
      <CodeBlock
        title="app/server/realtime.ts"
        code={`import { createStartHandler } from '@realtimejs/preset-start'
import type { AuthorizeFn } from '@realtimejs/core'

const authorize: AuthorizeFn = async (userId, channel) => {
  if (channel.namespace === 'admin') {
    const user = await db.users.findById(userId)
    return user?.role === 'admin'   // boolean shorthand
  }
  // All authenticated users get full access to other channels
  return true
}

export const realtime = createStartHandler({
  getUser: async (req) => resolveUser(req),
  authorize,
})`}
      />

      <h3>Namespace-based access control</h3>
      <p>
        Use <code>channel.namespace</code> and <code>channel.params</code>{' '}
        instead of manually parsing the raw channel string.
      </p>
      <CodeBlock
        code={`authorize: async (userId, channel) => {
  switch (channel.namespace) {
    case 'todos': {
      const member = await db.projectMembers.findFirst({
        where: { userId, projectId: channel.params.projectId },
      })
      if (!member) return false
      return {
        subscribe: true,
        publish: member.role === 'admin',
        presence: true,
      }
    }
    case 'announcements':
      return { subscribe: true, publish: false, presence: false }
    default:
      return false
  }
}`}
      />

      <h3>Rate limiting publishes</h3>
      <p>
        Reject client-initiated publishes when they exceed a per-user rate
        limit.
      </p>
      <CodeBlock
        code={`import { RateLimiter } from './rateLimiter'

const limiter = new RateLimiter({ max: 60, window: 60_000 }) // 60 publishes/minute

authorize: (userId, channel) => {
  if (!limiter.check(userId)) {
    return { subscribe: true, publish: false, presence: true }
  }
  return true
}`}
      />

      {/* ------------------------------------------------------------------ */}
      <h2 id="lifecycle-hooks">Lifecycle hooks</h2>
      <p>
        In addition to the request hooks above, both{' '}
        <code>createSseHandler</code> and <code>createStartHandler</code> accept
        optional lifecycle callbacks that fire on connection and channel state
        changes. All lifecycle hooks are <strong>fire-and-forget</strong> —
        errors are logged to <code>console.error</code> but never propagate to
        the client.
      </p>

      <h3>Signature</h3>
      <CodeBlock
        code={`import type { LifecycleHooks } from '@realtimejs/core'

interface LifecycleHooks {
  /** Fires after getUser succeeds and the SSE stream is established. */
  onClientConnect?: (info: { connectionId: string; userId: string }) => void

  /** Fires when the SSE stream closes (client disconnect or network drop). */
  onClientDisconnect?: (info: { connectionId: string; userId: string }) => void

  /** Fires when the first subscriber joins a previously-empty channel. */
  onFirstSubscriber?: (channel: string) => void

  /** Fires when the last subscriber leaves a channel (count → 0). */
  onChannelEmpty?: (channel: string) => void
}`}
      />

      <h3>Metrics and resource management</h3>
      <CodeBlock
        title="app/server/realtime.ts"
        code={`import { createStartHandler } from '@realtimejs/preset-start'

export const realtime = createStartHandler({
  getUser: async (req) => resolveUser(req),
  authorize,

  onClientConnect: ({ connectionId, userId }) => {
    metrics.increment('realtime.connections', { userId })
    console.log('[realtime] connected', connectionId, userId)
  },

  onClientDisconnect: ({ connectionId, userId }) => {
    metrics.decrement('realtime.connections', { userId })
    console.log('[realtime] disconnected', connectionId, userId)
  },

  onFirstSubscriber: (channel) => {
    // Spin up a live query or background task for this channel
    startLiveQuery(channel)
  },

  onChannelEmpty: (channel) => {
    // Tear down resources when no one is listening
    stopLiveQuery(channel)
  },
})`}
      />

      <div className="doc-callout">
        <p>
          <strong>Error isolation.</strong> If a lifecycle callback throws, the
          error is caught and logged. The SSE connection and client actions are
          never affected by lifecycle hook failures.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      <h2 id="createValidatedPublish">
        <code>createValidatedPublish</code> — outbound payload validation
      </h2>
      <p>
        A factory that wraps any <code>PublishFn</code> with a validation step.
        Call it in server functions to validate (and optionally transform)
        payloads before they are broadcast. Returns{' '}
        <code>{'{ accepted: false, reason }'}</code> to throw a{' '}
        <code>PublishValidationError</code>, or{' '}
        <code>{'{ accepted: true, data: transformed }'}</code> to replace the
        payload.
      </p>
      <p>
        Imported from <code>@realtimejs/core</code>.
      </p>

      <h3>Signature</h3>
      <CodeBlock
        code={`import {
  createValidatedPublish,
  PublishValidationError,
} from '@realtimejs/core'

// ValidatePublishFn signature
type ValidatePublishFn = (params: {
  channel: ParsedChannel   // { namespace, params, raw }
  rawChannel: string
  data: unknown
  userId?: string
}) => PublishValidationResult | Promise<PublishValidationResult>

// PublishValidationResult discriminated union
type PublishValidationResult =
  | { accepted: true; data?: unknown }   // data replaces original payload
  | { accepted: false; reason?: string } // throws PublishValidationError`}
      />

      <h3>Schema validation with Zod</h3>
      <CodeBlock
        title="app/server/realtime.ts"
        code={`import { createStartHandler } from '@realtimejs/preset-start'
import { createValidatedPublish } from '@realtimejs/core'
import { z } from 'zod'

const TodoEvent = z.object({
  action: z.enum(['insert', 'update', 'delete']),
  data: z.object({ id: z.string(), title: z.string(), done: z.boolean() }),
})

export const realtime = createStartHandler({ getUser: resolveUser })

export const realtimePublish = createValidatedPublish({
  publish: realtime.publish,
  validate: async ({ channel, data }) => {
    if (channel.namespace === 'todos') {
      const result = TodoEvent.safeParse(data)
      if (!result.success) {
        return { accepted: false, reason: result.error.message }
      }
      return { accepted: true, data: result.data }  // use parsed/coerced data
    }
    return { accepted: true }
  },
})`}
      />

      <h3>Payload transformation</h3>
      <p>
        Return <code>{'{ accepted: true, data: transformed }'}</code> to strip
        sensitive fields or attach server-side metadata before broadcasting.
      </p>
      <CodeBlock
        code={`validate: async ({ channel, data }) => {
  if (channel.namespace === 'chat') {
    const msg = data as { text: string; clientSecret: string }
    // Strip the client-only field before broadcasting
    return {
      accepted: true,
      data: { text: msg.text, timestamp: Date.now() },
    }
  }
  return { accepted: true }
}`}
      />

      {/* ------------------------------------------------------------------ */}
      <h2 id="publish">
        <code>handler.publish</code> — server-initiated broadcast
      </h2>
      <p>
        Available on <code>StartRealtimeHandler</code> (from{' '}
        <code>createStartHandler</code>). Delivers a message to all clients
        subscribed to the channel. Call this from TanStack Start server
        functions after a database mutation.
      </p>
      <p>
        <code>createSseHandler</code> exposes the equivalent as{' '}
        <code>handler.broadcast(channel, data)</code> — a synchronous, string-
        only variant.
      </p>

      <CodeBlock
        title="app/server/functions/todos.ts"
        code={`import { createServerFn } from '@tanstack/start'
import { realtimePublish } from '../realtime'
import { db } from '../db'

export const updateTodo = createServerFn({ method: 'POST' })
  .handler(async ({ data }) => {
    const updated = await db.todos.update(data.id, data)

    // Broadcast to all subscribed clients — accepts QueryKey or string
    await realtimePublish(['todos', { projectId: data.projectId }], {
      action: 'update',
      data:   updated,
    })

    return updated
  })`}
      />

      {/* ------------------------------------------------------------------ */}
      <h2 id="pingInterval">
        <code>pingInterval</code> — keep-alive pings
      </h2>
      <p>
        Controls how often the server sends a <code>ping</code> event over the
        SSE stream to prevent the connection from being closed by proxies and
        load balancers. Set to <code>0</code> to disable.
      </p>

      <CodeBlock
        code={`import { createSseHandler } from '@realtimejs/adapter-sse'

const sse = createSseHandler({
  pingInterval: 15_000,  // ping every 15 s (default: 30 000 ms)
})`}
      />

      {/* ------------------------------------------------------------------ */}
      <h2 id="dispose">
        <code>handler.dispose</code> — cleanup on shutdown
      </h2>
      <p>
        Available on <code>StartRealtimeHandler</code>. When a{' '}
        <code>PublishBackend</code> with a <code>subscribe</code> callback is
        provided, <code>dispose()</code> calls the backend's unsubscribe
        function. Call it on server shutdown or during hot-module replacement to
        release the backend connection.
      </p>

      <CodeBlock
        title="app/server/realtime.ts"
        code={`import { createStartHandler } from '@realtimejs/preset-start'
import { redisBackend } from './redisBackend'

export const realtime = createStartHandler({
  backend: redisBackend,
  getUser:  resolveUser,
})

// Vite HMR — release the Redis subscription when the module hot-reloads
if (import.meta.hot) {
  import.meta.hot.dispose(() => realtime.dispose())
}`}
      />

      {/* ------------------------------------------------------------------ */}
      <h2 id="patterns">Common patterns</h2>

      <h3 id="pattern-logging">Logging</h3>
      <p>
        Use lifecycle hooks for connection tracking and <code>authorize</code>{' '}
        for access decisions.
      </p>
      <CodeBlock
        code={`export const realtime = createStartHandler({
  getUser: async (req) => resolveUser(req),

  authorize: async (userId, channel) => {
    const allowed = await canAccess(userId, channel)
    console.log(
      \`[realtime] authorize userId=\${userId} channel=\${channel.raw} allowed=\${JSON.stringify(allowed)}\`
    )
    return allowed
  },

  onClientConnect: ({ connectionId, userId }) => {
    console.log(\`[realtime] connect userId=\${userId} conn=\${connectionId}\`)
  },
  onClientDisconnect: ({ connectionId, userId }) => {
    console.log(\`[realtime] disconnect userId=\${userId} conn=\${connectionId}\`)
  },
})`}
      />

      <h3 id="pattern-metrics">Metrics</h3>
      <p>
        Track active connection count with{' '}
        <code>handler.connectionCount()</code> (available on{' '}
        <code>SseHandler</code> from <code>createSseHandler</code>). Expose it
        from a health-check endpoint or push it to your metrics store
        periodically.
      </p>
      <CodeBlock
        title="app/routes/api/health.ts"
        code={`import { createAPIFileRoute } from '@tanstack/start/api'
import { sseHandler } from '../../server/realtime'

export const Route = createAPIFileRoute('/api/health')({
  GET: () =>
    Response.json({
      status:      'ok',
      connections: sseHandler.connectionCount(),
    }),
})`}
      />
      <div className="doc-callout">
        <strong>Note.</strong> <code>connectionCount()</code> is available
        directly on the <code>SseHandler</code> returned by{' '}
        <code>createSseHandler</code>. If you use{' '}
        <code>createStartHandler</code>, it creates an internal SSE handler that
        is not directly exposed &mdash; use <code>createSseHandler</code>{' '}
        directly when you need metrics access.
      </div>

      <h3 id="pattern-auth">Full authentication + authorization setup</h3>
      <CodeBlock
        title="app/server/realtime.ts"
        code={`import { createStartHandler } from '@realtimejs/preset-start'
import { createValidatedPublish } from '@realtimejs/core'
import type { AuthorizeFn } from '@realtimejs/core'
import { verifyJwt } from './auth'
import { db } from './db'
import { z } from 'zod'

const TodoSchema = z.object({
  action: z.enum(['insert', 'update', 'delete']),
  data:   z.object({ id: z.string(), title: z.string(), done: z.boolean() }),
})

const authorize: AuthorizeFn = async (userId, channel) => {
  switch (channel.namespace) {
    case 'todos': {
      const member = await db.query.projectMembers.findFirst({
        where: (m, { and, eq }) =>
          and(eq(m.userId, userId), eq(m.projectId, channel.params.projectId)),
      })
      if (!member) return false
      return {
        subscribe: true,
        publish: member.role === 'admin',
        presence: true,
      }
    }
    default:
      return false
  }
}

export const realtime = createStartHandler({
  // 1. Authenticate every request
  getUser: async (req) => {
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return null
    try {
      const { sub } = await verifyJwt(auth.slice(7), process.env.JWT_SECRET!)
      return { userId: sub }
    } catch {
      return null
    }
  },

  // 2. Per-channel access control (unified AuthorizeFn)
  authorize,

  // 3. Lifecycle hooks
  onClientConnect: ({ userId }) => {
    console.log('[realtime] connected', userId)
  },
  onClientDisconnect: ({ userId }) => {
    console.log('[realtime] disconnected', userId)
  },
})

// 4. Wrap the publish function with payload validation
export const realtimePublish = createValidatedPublish({
  publish: realtime.publish,
  validate: ({ channel, data }) => {
    if (channel.namespace === 'todos') {
      const result = TodoSchema.safeParse(data)
      return result.success
        ? { accepted: true, data: result.data }
        : { accepted: false, reason: result.error.message }
    }
    return { accepted: true }
  },
})`}
      />

      {/* ------------------------------------------------------------------ */}
      <h2 id="api-summary">API summary</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Hook / method</th>
            <th>Package</th>
            <th>When it fires</th>
            <th>Return value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>getUser(req)</code>
            </td>
            <td>
              <code>@realtimejs/adapter-sse</code>
            </td>
            <td>Every GET + POST request</td>
            <td>
              <code>{'{ userId }'}</code> or <code>null</code> → 401
            </td>
          </tr>
          <tr>
            <td>
              <code>authorize(userId, channel)</code>
            </td>
            <td>
              <code>@realtimejs/adapter-sse</code>
            </td>
            <td>subscribe and publish actions (not unsubscribe)</td>
            <td>
              <code>ChannelPermissions | boolean</code> — <code>false</code> →
              403
            </td>
          </tr>
          <tr>
            <td>
              <code>createValidatedPublish{'({ publish, validate })'}</code>
            </td>
            <td>
              <code>@realtimejs/core</code>
            </td>
            <td>Wraps a publish fn; validate called before every broadcast</td>
            <td>Accepted / rejected / transformed payload</td>
          </tr>
          <tr>
            <td>
              <code>onClientConnect</code>
            </td>
            <td>
              <code>@realtimejs/adapter-sse</code>
            </td>
            <td>SSE stream opened and authenticated</td>
            <td>
              <code>void</code> (fire-and-forget)
            </td>
          </tr>
          <tr>
            <td>
              <code>onClientDisconnect</code>
            </td>
            <td>
              <code>@realtimejs/adapter-sse</code>
            </td>
            <td>SSE stream closed</td>
            <td>
              <code>void</code> (fire-and-forget)
            </td>
          </tr>
          <tr>
            <td>
              <code>onFirstSubscriber</code>
            </td>
            <td>
              <code>@realtimejs/adapter-sse</code>
            </td>
            <td>First client subscribes to a channel</td>
            <td>
              <code>void</code> (fire-and-forget)
            </td>
          </tr>
          <tr>
            <td>
              <code>onChannelEmpty</code>
            </td>
            <td>
              <code>@realtimejs/adapter-sse</code>
            </td>
            <td>Last subscriber leaves a channel</td>
            <td>
              <code>void</code> (fire-and-forget)
            </td>
          </tr>
          <tr>
            <td>
              <code>handler.publish(channel, data)</code>
            </td>
            <td>
              <code>@realtimejs/preset-start</code>
            </td>
            <td>Called explicitly in server functions</td>
            <td>
              <code>Promise{'<void>'}</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>handler.broadcast(channel, data)</code>
            </td>
            <td>
              <code>@realtimejs/adapter-sse</code>
            </td>
            <td>Called explicitly; synchronous, string channel only</td>
            <td>
              <code>void</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>handler.connectionCount()</code>
            </td>
            <td>
              <code>@realtimejs/adapter-sse</code>
            </td>
            <td>On demand (health checks, metrics)</td>
            <td>
              <code>number</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>handler.dispose()</code>
            </td>
            <td>
              <code>@realtimejs/preset-start</code>
            </td>
            <td>Server shutdown / HMR</td>
            <td>
              <code>void</code>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  )
}
