import { CodeBlock } from '../../components/CodeBlock'

export function ErrorReference() {
  return (
    <article className="doc-article">
      <h1>Error Reference</h1>
      <p className="doc-lead">
        This page documents every error type in TanStack Realtime, what triggers
        it, and how to handle it.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* ConflictError                                                       */}
      {/* ------------------------------------------------------------------ */}

      <h2 id="conflict-error">ConflictError&lt;T&gt;</h2>
      <p>
        Thrown from a server function (<code>onInsert</code>,{' '}
        <code>onUpdate</code>, or <code>onDelete</code>) when a concurrent edit
        is detected &mdash; for example, when an optimistic-lock check finds
        that a row&rsquo;s <code>version</code> column no longer matches the
        client&rsquo;s copy.
      </p>

      <h3>When it triggers</h3>
      <p>
        The server response differs from the optimistic prediction. Typically
        this means another user modified the same row between the time the
        client read it and the time the mutation arrived.
      </p>

      <h3>Properties</h3>
      <ul>
        <li>
          <code>type</code> &mdash; always <code>'ConflictError'</code> (stable
          discriminant that survives network serialization)
        </li>
        <li>
          <code>current: T</code> &mdash; the authoritative server state at the
          time of the conflict
        </li>
        <li>
          <code>message: string</code> &mdash; human-readable description of the
          conflict
        </li>
      </ul>

      <h3>How to handle</h3>
      <p>
        Use <code>isConflictError()</code> inside <code>onOptimisticError</code>{' '}
        instead of <code>instanceof</code> &mdash; TanStack Start reconstructs
        thrown errors on the client as plain objects, which breaks prototype
        chain checks.
      </p>
      <p>
        If <code>onOptimisticError</code> is omitted, the optimistic state is
        rolled back silently with no UI feedback.
      </p>
      <CodeBlock
        title="server function"
        code={`import { ConflictError } from '@tanstack/realtime'

export const updateTodo = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: Todo }) => {
    const existing = await db.select().from(todos)
      .where(eq(todos.id, data.id))
      .then((r) => r[0])

    if (existing.version !== data.version) {
      throw new ConflictError('Concurrent edit', { current: existing })
    }

    return db.update(todos)
      .set({ ...data, version: data.version + 1 })
      .where(eq(todos.id, data.id))
      .returning()
      .then((r) => r[0])
  })`}
      />
      <CodeBlock
        title="collection config"
        code={`import { isConflictError } from '@tanstack/realtime'

realtimeCollectionOptions({
  // ...
  optimistic: true,
  onOptimisticError: ({ error, action, key }) => {
    if (isConflictError<Todo>(error)) {
      // error.current holds the authoritative server state
      showConflictDialog({
        current: error.current,
        key,
      })
    } else {
      toast.error(\`Failed to \${action} item \${key}\`)
    }
  },
})`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Subscribe Errors                                                    */}
      {/* ------------------------------------------------------------------ */}

      <h2 id="subscribe-errors">Subscribe Errors</h2>
      <p>
        Returned when a client attempts to subscribe to a channel but is denied
        by the server&rsquo;s authorization layer.
      </p>

      <h3>When it triggers</h3>
      <ul>
        <li>
          The <code>authorize</code> callback in the server handler returns{' '}
          <code>false</code> for the <code>'subscribe'</code> action
        </li>
        <li>
          The <code>getUser</code> callback returns <code>null</code> (user not
          authenticated)
        </li>
        <li>The channel name does not match any expected pattern</li>
      </ul>

      <h3>How it surfaces</h3>
      <p>
        The SSE handler returns an HTTP <code>403 Forbidden</code> (or{' '}
        <code>401 Unauthorized</code> if authentication fails). On the client
        side, the transport currently logs a <code>console.warn</code> for
        failed subscribe POST actions. The wire protocol defines a{' '}
        <code>subscribe:error</code> message type with <code>channel</code>,{' '}
        <code>code</code>, and <code>reason</code> fields.
      </p>
      <p>
        If unhandled, the collection receives no data for that channel &mdash;
        it stays empty with no error indicator.
      </p>

      <h3>How to handle</h3>
      <p>
        Verify your <code>authorize</code> function logic and ensure the client
        is sending a valid authentication token via{' '}
        <code>sseTransport({'{ getToken }'})</code>.
      </p>
      <CodeBlock
        title="server handler"
        code={`const sse = createSseHandler({
  getUser: async (req) => {
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return null
    try {
      const { sub } = await verifyJwt(auth.slice(7), JWT_SECRET)
      return { userId: sub }
    } catch {
      return null
    }
  },
  authorize: async ({ userId, action, channel }) => {
    if (action === 'subscribe') {
      return db.canAccess(userId, channel)
    }
    return true
  },
})`}
      />
      <CodeBlock
        title="client transport"
        code={`import { sseTransport } from '@tanstack/realtime-adapter-sse'

const transport = sseTransport({
  url: '/api/realtime',
  getToken: () => auth.getSession().then((s) => s.accessToken),
})`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Publish Errors                                                      */}
      {/* ------------------------------------------------------------------ */}

      <h2 id="publish-errors">Publish Errors</h2>
      <p>
        Returned when a client attempts to publish a message but the server
        rejects it.
      </p>

      <h3>When it triggers</h3>
      <ul>
        <li>
          The <code>authorize</code> callback returns <code>false</code> for the{' '}
          <code>'publish'</code> action
        </li>
        <li>
          The user is not authenticated (<code>getUser</code> returns{' '}
          <code>null</code>)
        </li>
      </ul>

      <h3>How it surfaces</h3>
      <p>
        The SSE handler returns an HTTP <code>403 Forbidden</code> response. In
        coordinated transports (SharedWorker, BroadcastChannel), the leader
        proxies the error back via a <code>publish:ack</code> message with an{' '}
        <code>error</code> field, and the follower&rsquo;s <code>publish</code>{' '}
        promise rejects.
      </p>
      <p>
        If the returned promise rejection is not caught, it becomes an unhandled
        promise rejection.
      </p>

      <h3>How to handle</h3>
      <p>
        Check your authorization rules to ensure the publishing user has write
        access to the target channel.
      </p>
      <CodeBlock
        code={`const sse = createSseHandler({
  authorize: async ({ userId, action, channel }) => {
    if (action === 'publish') {
      // Only channel owners may publish
      return db.isChannelOwner(userId, channel)
    }
    // All authenticated users may subscribe
    return true
  },
})`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Offline Queue Flush Errors                                          */}
      {/* ------------------------------------------------------------------ */}

      <h2 id="flush-errors">Offline Queue Flush Errors</h2>
      <p>
        Fires when a queued message fails to publish during the replay that
        happens after the connection is restored.
      </p>

      <h3>When it triggers</h3>
      <ul>
        <li>
          The network becomes available and the offline queue begins flushing,
          but a specific message fails to send
        </li>
        <li>
          The server rejects a queued publish (authorization expired, etc.)
        </li>
      </ul>

      <h3>Callback</h3>
      <p>
        <code>onFlushError(message, error)</code> receives the{' '}
        <code>QueuedMessage</code> that failed and the thrown error. Return{' '}
        <code>true</code> to retry the message on the next flush, or{' '}
        <code>false</code> to discard it. Defaults to{' '}
        <code>() =&gt; false</code> (discard on failure).
      </p>
      <p>
        If <code>onFlushError</code> is omitted, failed messages are silently
        discarded with no notification.
      </p>

      <h3>How to handle</h3>
      <CodeBlock
        code={`import { createOfflineQueue } from '@tanstack/realtime'
import { sseTransport } from '@tanstack/realtime-adapter-sse'

const transport = createOfflineQueue(
  sseTransport({ url: '/api/realtime' }),
  {
    maxSize: 500,
    onFlushError: (message, error) => {
      console.error(
        \`Failed to flush message \${message.id} on \${message.channel}:\`,
        error,
      )
      // Return true to keep in queue and retry next flush,
      // false to discard permanently.
      if (isRetryable(error)) return true
      toast.error('A queued change could not be sent and was discarded.')
      return false
    },
  },
)`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Gap Recovery Errors                                                 */}
      {/* ------------------------------------------------------------------ */}

      <h2 id="gap-errors">Gap Recovery Errors</h2>
      <p>
        Fires when the <code>onGap</code> callback throws or returns a rejected
        promise during reconnection recovery.
      </p>

      <h3>When it triggers</h3>
      <ul>
        <li>
          The connection transitions through <code>'reconnecting'</code> or{' '}
          <code>'disconnected'</code> and then back to <code>'connected'</code>
        </li>
        <li>
          The <code>onGap</code> handler attempts to re-fetch missed data but
          the fetch fails (server down, timeout, etc.)
        </li>
      </ul>

      <h3>Callback</h3>
      <p>
        <code>onGapError(error, channel)</code> receives the thrown error and
        the channel whose recovery failed. By default, errors are silently
        swallowed so a failing recovery never crashes the transport.
      </p>

      <h3>How to handle</h3>
      <CodeBlock
        code={`import { withGapRecovery } from '@tanstack/realtime'
import { sseTransport } from '@tanstack/realtime-adapter-sse'

const transport = withGapRecovery(
  sseTransport({ url: '/api/realtime' }),
  {
    onGap: async (channel) => {
      await refetchCollection(channel)
    },
    onGapError: (error, channel) => {
      console.error(\`Gap recovery failed for \${channel}:\`, error)
      Sentry.captureException(error)
      // Fallback: force a full refetch or page reload
      window.location.reload()
    },
  },
)`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Stream Errors                                                       */}
      {/* ------------------------------------------------------------------ */}

      <h2 id="stream-errors">Stream Errors</h2>
      <p>Fires when the server-side stream producer signals a failure.</p>

      <h3>When it triggers</h3>
      <ul>
        <li>
          <code>stream.error(message)</code> is called server-side, which
          publishes a <code>{'{ type: STREAM_ERROR, message }'}</code> sentinel
          event
        </li>
        <li>
          The stream goes stale (no events or heartbeats received within the{' '}
          <code>staleAfter</code> threshold)
        </li>
        <li>HMAC signature validation fails on a received event</li>
      </ul>

      <h3>How it surfaces</h3>
      <p>
        The <code>useStream</code> hook returns <code>status === 'error'</code>{' '}
        and an <code>error</code> string with the message from the sentinel
        event. The stream&rsquo;s <code>isError</code> callback detects the
        sentinel:
      </p>
      <CodeBlock
        title="stream channel definition"
        code={`import {
  STREAM_DONE,
  STREAM_ERROR,
  createStreamChannel,
} from '@tanstack/realtime'

const aiResponseStream = createStreamChannel({
  id: 'ai-response',
  channel: (params: { requestId: string }) => ['ai', params],
  initial: { content: '' },
  reduce: (state, event) => ({
    content: state.content + (event.delta ?? ''),
  }),
  isDone: (_state, event) => event.type === STREAM_DONE,
  isError: (_state, event) =>
    event.type === STREAM_ERROR ? (event.message ?? 'Stream error') : false,
  staleAfter: 15_000,
})`}
      />

      <h3>How to handle</h3>
      <CodeBlock
        code={`import { useStream } from '@tanstack/react-realtime'

function AIResponse({ requestId }: { requestId: string }) {
  const { state, status, error } = useStream(aiResponseStream, {
    params: { requestId },
  })

  if (status === 'pending')  return <span>Thinking...</span>
  if (status === 'error') {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={() => retryRequest(requestId)}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <p>
      {state.content}
      {status === 'streaming' && <span className="cursor">|</span>}
    </p>
  )
}`}
      />

      <h3>Server-side error signaling</h3>
      <CodeBlock
        title="server function"
        code={`const stream = sseHandler.createStream({
  channel: ['ai', { requestId }],
})

try {
  for await (const chunk of llmResponse) {
    await stream.push({ delta: chunk.text })
  }
  await stream.done()
} catch (err) {
  await stream.error(String(err))
}`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Connection Errors                                                   */}
      {/* ------------------------------------------------------------------ */}

      <h2 id="connection-errors">Connection Errors</h2>
      <p>
        Transport-level failures that occur when the underlying SSE stream or
        WebSocket connection is interrupted.
      </p>

      <h3>When it triggers</h3>
      <ul>
        <li>The SSE fetch request fails (network offline, DNS failure)</li>
        <li>The server closes the SSE stream unexpectedly</li>
        <li>
          The authentication token refresh (<code>getToken</code>) throws
        </li>
        <li>WebSocket close or SSE timeout</li>
      </ul>

      <h3>Status values</h3>
      <p>
        The transport&rsquo;s <code>store</code> (a TanStack Store of{' '}
        <code>ConnectionStatus</code>) transitions through these states:
      </p>
      <ul>
        <li>
          <code>'disconnected'</code> &mdash; no connection;{' '}
          <code>connect()</code> has not been called or{' '}
          <code>disconnect()</code> was called explicitly
        </li>
        <li>
          <code>'connecting'</code> &mdash; a connection handshake is in
          progress
        </li>
        <li>
          <code>'connected'</code> &mdash; connection is open and ready
        </li>
        <li>
          <code>'reconnecting'</code> &mdash; connection was lost unexpectedly;
          the transport is retrying with exponential back-off
        </li>
      </ul>

      <h3>Auto-recovery</h3>
      <p>
        All built-in transports reconnect automatically with exponential
        back-off. Configure the retry timing via the transport options:
      </p>
      <ul>
        <li>
          <code>initialDelay</code> &mdash; initial back-off delay in ms
          (default: <code>1000</code>)
        </li>
        <li>
          <code>maxDelay</code> &mdash; maximum back-off delay in ms (default:{' '}
          <code>30000</code>)
        </li>
        <li>
          <code>jitter</code> &mdash; jitter factor 0&ndash;1 (default:{' '}
          <code>0.25</code>)
        </li>
      </ul>

      <h3>How to handle</h3>
      <CodeBlock
        code={`import { useRealtime } from '@tanstack/react-realtime'

function ConnectionBanner() {
  const { status, client } = useRealtime()

  if (status === 'connected') return null

  return (
    <div className="connection-banner">
      {status === 'reconnecting' && 'Reconnecting...'}
      {status === 'connecting' && 'Connecting...'}
      {status === 'disconnected' && (
        <>
          Offline.{' '}
          <button onClick={() => client.connect()}>
            Reconnect
          </button>
        </>
      )}
    </div>
  )
}`}
      />
    </article>
  )
}
