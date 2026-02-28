import { CodeBlock } from '../../components/CodeBlock'

export function Security() {
  return (
    <article className="doc-article">
      <h1>Security &amp; Authorization</h1>
      <p className="doc-lead">
        How to configure authentication, channel authorization, server authority
        over writes, and what the security boundaries actually are.
      </p>

      <h2 id="threat-model">Threat model</h2>
      <p>
        TanStack Realtime is a pub/sub transport layer. Its security story has
        three distinct layers:
      </p>
      <ol>
        <li>
          <strong>Authentication</strong> — is the connecting client who they
          claim to be?
        </li>
        <li>
          <strong>Channel authorization</strong> — is this client allowed to
          subscribe, publish, or use presence on this channel?
        </li>
        <li>
          <strong>Data authority</strong> — should the server validate and
          control what data reaches a channel, or can clients publish freely?
        </li>
      </ol>
      <p>
        Each layer is independently configurable. Most applications need all
        three.
      </p>

      <h2 id="authentication">Authentication</h2>
      <p>
        The <code>getUser</code> callback on the server is called once per
        WebSocket connection (or per SSE request). Return a user object or{' '}
        <code>null</code>. If you return <code>null</code>, the connection is
        rejected before any channel operations are allowed.
      </p>
      <CodeBlock
        title="server/realtime.ts"
        code={`import { createNodeServer } from '@tanstack/realtime-preset-node'

export const nodeServer = createNodeServer({
  signingSecret: process.env.REALTIME_SIGNING_SECRET,

  getUser: async (req) => {
    // Works with any auth strategy — JWT, session cookie, API key, etc.
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return null
    try {
      return await verifyJwt(token) // { id, role, tenantId, … }
    } catch {
      return null // invalid token → rejected
    }
  },

  authorize: async (user, channel) => {
    // user is the object returned by getUser (never null here)
    // channel is the deserialized channel key
    return {
      subscribe: true,
      publish: user.role === 'editor',
      presence: true,
    }
  },
})`}
      />

      <h2 id="channel-authorization">Channel authorization</h2>
      <p>
        The <code>authorize</code> callback receives the authenticated user and
        the fully deserialized channel key on every subscribe / publish /
        presence request. Return an object with boolean flags. Returning{' '}
        <code>false</code> for any flag silently drops the operation.
      </p>
      <CodeBlock
        title="Per-resource authorization example"
        code={`authorize: async (user, channel) => {
  // channel looks like: ['tasks', { projectId: 'proj_1' }]
  const [name, params] = channel

  if (name === 'tasks') {
    // Check that the user is a member of this project
    const member = await db.members.findOne({
      projectId: params.projectId,
      userId: user.id,
    })
    return {
      subscribe: member !== null,
      publish: member?.role === 'editor',
      presence: member !== null,
    }
  }

  if (name === 'admin') {
    return {
      subscribe: user.role === 'admin',
      publish: user.role === 'admin',
      presence: false,
    }
  }

  // Deny unknown channels by default
  return { subscribe: false, publish: false, presence: false }
}`}
      />
      <div className="doc-callout">
        <p>
          <strong>Important:</strong> Channel authorization controls access to
          the transport layer. If a user has <code>publish: true</code> on a
          channel, they can send any payload to that channel. To enforce what{' '}
          <em>data</em> reaches the channel, use server authority (below).
        </p>
      </div>

      <h2 id="server-authority">Server authority over data</h2>
      <p>
        A client with publish access can broadcast arbitrary data to a channel.
        If that data is persisted or drives UI decisions for other users, you
        need server authority: the server validates and rewrites the payload
        before it is broadcast.
      </p>
      <p>
        The recommended approach is <code>withServerFn</code> + TanStack Start
        server functions. This makes server authority the default — no manual
        publish wiring required. Setting <code>serverPublish: true</code>{' '}
        (included automatically by <code>withServerFn</code>) suppresses the
        client&rsquo;s auto-publish so only the server can broadcast.
      </p>
      <CodeBlock
        title="Recommended — withServerFn (server authority by default)"
        code={`import { withServerFn, realtimeCollectionOptions, serializeKey } from '@tanstack/realtime'
import { insertTask, updateTask, deleteTask } from './functions/tasks'
import { nodeServer } from './server/realtime'

const tasksOptions = (projectId: string) =>
  realtimeCollectionOptions({
    ...withServerFn<Task, string>({
      getKey: (t) => t.id,
      queryFn: () => fetch(\`/api/tasks?projectId=\${projectId}\`).then(r => r.json()),
      channel: ['tasks', { projectId }],
      publish: (ch, data) => {
        nodeServer.publish(typeof ch === 'string' ? ch : serializeKey(ch), data)
        return Promise.resolve()
      },
      onInsert: insertTask,  // TanStack Start server function
      onUpdate: updateTask,
      onDelete: deleteTask,
    }),
    client: realtimeClient,
    channel: ['tasks', { projectId }],
    // serverPublish: true is included by withServerFn — client never publishes
  })`}
      />
      <p>
        If you cannot use <code>withServerFn</code>, you can still achieve
        server authority manually by setting <code>serverPublish: true</code>{' '}
        and publishing from your API handler:
      </p>
      <CodeBlock
        title="Manual — REST API with serverPublish: true"
        code={`// server/routes/tasks.ts
router.post('/api/tasks', async (req, res) => {
  const user = await authenticate(req)
  const parsed = taskSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(parsed.error)

  const task = await db.tasks.create({ data: { ...parsed.data, createdBy: user.id } })

  // Only trusted server code publishes to the channel
  nodeServer.publish(
    serializeKey(['tasks', { projectId: task.projectId }]),
    { action: 'insert', data: task },
  )
  res.json(task)
})

// collection config
realtimeCollectionOptions({
  // ...
  serverPublish: true, // suppress client-side auto-publish
})`}
      />

      <h2 id="client-publish-caveats">When client-side publish is acceptable</h2>
      <p>
        Routing every write through the server adds a round-trip. For
        ephemeral, non-persisted signals where low latency matters more than
        authority, client-side publish is fine:
      </p>
      <ul>
        <li>
          <strong>Typing indicators</strong> — transient, never stored, visible
          only during the session.
        </li>
        <li>
          <strong>Cursor positions</strong> — high-frequency, non-authoritative,
          easily replaced by the next update.
        </li>
        <li>
          <strong>Ephemeral reactions</strong> (emoji bursts, live polls) —
          where the worst-case outcome of a spoofed payload is cosmetic.
        </li>
      </ul>
      <p>
        For these cases, keep <code>publish: true</code> in your{' '}
        <code>authorize</code> callback and use client-side{' '}
        <code>usePublish</code>. Set <code>publish: false</code> for channels
        where data authority matters.
      </p>
      <CodeBlock
        code={`authorize: async (user, channel) => {
  const [name] = channel

  // Ephemeral signals — client can publish directly
  if (name === 'cursors' || name === 'typing') {
    return { subscribe: true, publish: true, presence: true }
  }

  // Persisted data — only the server publishes; clients subscribe
  if (name === 'tasks' || name === 'messages') {
    return { subscribe: true, publish: false, presence: true }
  }

  return { subscribe: false, publish: false, presence: false }
}`}
      />

      <h2 id="database-access">A note on database access patterns</h2>
      <p>
        If your session already has direct database write access (e.g. through
        a Drizzle or Prisma client in a TanStack Start server function), a
        user with that access could theoretically write arbitrary data to the
        database and trigger a publish. The realtime layer does not change this
        — authorization must be enforced at the database / server function
        level, not only at the channel level.
      </p>
      <p>
        TanStack Realtime&rsquo;s server authority pattern adds a clear choke
        point: all writes go through a validated server function before
        reaching either the database or the channel. This makes authorization
        logic easier to audit and test.
      </p>
      <div className="doc-callout">
        <p>
          <strong>Rule of thumb:</strong> treat the realtime channel the same
          way you treat a REST endpoint &mdash; never trust client-supplied data
          for operations with side effects. Validate on the server, write on
          the server, publish on the server.
        </p>
      </div>

      <h2 id="hmac-integrity">Message integrity with HMAC</h2>
      <p>
        Every message the server sends is signed with an HMAC-SHA256 over the
        channel key, sequence number, timestamp, and payload. Clients can
        verify the signature to confirm the message came from a trusted server
        and hasn&rsquo;t been tampered with. See{' '}
        <a href="#/docs/under-the-hood">Under the Hood</a> for the full
        envelope format and verification details.
      </p>
      <CodeBlock
        code={`// Enable signature verification on the client
const client = createRealtimeClient({
  transport: wsTransport({
    url: 'wss://rt.example.com',
    verifyHmac: true, // messages with invalid HMAC are silently dropped
  }),
})`}
      />

      <h2 id="checklist">Security checklist</h2>
      <ul>
        <li>
          Always implement <code>getUser</code> — unauthenticated connections
          should return <code>null</code>.
        </li>
        <li>
          Implement <code>authorize</code> with per-channel, per-operation
          rules. Deny unknown channels by default.
        </li>
        <li>
          Set <code>publish: false</code> for channels whose data is persisted
          or shown to other users. Publish from the server instead.
        </li>
        <li>
          Validate all write payloads in your server function or API handler
          before touching the database.
        </li>
        <li>
          Set <code>signingSecret</code> from an environment variable and
          enable <code>verifyHmac: true</code> on the client.
        </li>
        <li>
          Use TLS (<code>wss://</code>, <code>https://</code>) in production.
          HMAC protects integrity but not confidentiality.
        </li>
        <li>
          Rotate <code>signingSecret</code> if it is ever exposed. Clients
          will see signature verification failures until they reconnect with a
          fresh token.
        </li>
      </ul>
    </article>
  )
}
