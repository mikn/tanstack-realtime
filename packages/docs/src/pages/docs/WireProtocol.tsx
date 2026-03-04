import { CodeBlock } from '../../components/CodeBlock'

export function WireProtocol() {
  return (
    <article className="doc-article">
      <h1>Wire Protocol Reference</h1>
      <p className="doc-lead">
        Message formats for every TanStack Realtime transport. Useful for custom
        transport authors and debugging.
      </p>

      <h2 id="transport-interface">Transport interface</h2>
      <p>
        Every transport implements <code>RealtimeTransport</code>. This is the
        contract between the realtime client and the underlying connection
        mechanism &mdash; WebSocket, SSE, Centrifugo, or your own custom
        transport.
      </p>
      <CodeBlock
        code={`export interface RealtimeTransport {
  connect: () => Promise<void>
  disconnect: () => void
  subscribe: (channel: string, onMessage: (data: unknown) => void) => () => void
  publish: (channel: string, data: unknown) => Promise<void>
  readonly store: Store<ConnectionStatus>
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'`}
      />
      <p>
        Transports that support presence also implement the{' '}
        <code>PresenceCapable</code> extension. The realtime client checks for
        these methods at runtime and enables presence features when they exist.
      </p>
      <CodeBlock
        code={`export interface PresenceCapable {
  joinPresence: (channel: string, data: unknown) => void
  updatePresence: (channel: string, data: unknown) => void
  leavePresence: (channel: string) => void
  onPresenceChange: (channel: string, callback: (users: ReadonlyArray<PresenceUser>) => void) => () => void
}

export interface PresenceUser<T = unknown> {
  connectionId: string
  data: T
}`}
      />

      <h2 id="connection-status">Connection status lifecycle</h2>
      <p>
        The <code>ConnectionStatus</code> type forms a state machine. Every
        transport follows the same lifecycle:
      </p>
      <CodeBlock
        code={`disconnected ──► connecting ──► connected
                                       │
                                       ▼
                                  reconnecting
                                       │
                                       ▼
                                  connecting ──► connected
                                       │
                                       ▼
                                  disconnected  (if max retries exceeded)`}
      />
      <p>
        When a transport is first created, it starts in{' '}
        <code>disconnected</code>. Calling <code>connect()</code> transitions to{' '}
        <code>connecting</code>, then <code>connected</code> on success. If the
        underlying connection drops unexpectedly, the transport moves to{' '}
        <code>reconnecting</code> and attempts to re-establish the connection.
        During reconnection the transport cycles between{' '}
        <code>reconnecting</code> and <code>connecting</code> with exponential
        backoff. If reconnection succeeds, the status returns to{' '}
        <code>connected</code>. If the maximum number of retries is exhausted,
        the transport falls back to <code>disconnected</code>.
      </p>

      <h2 id="websocket-messages">WebSocket transport messages</h2>
      <p>
        The built-in WebSocket transport (<code>wsTransport</code>) communicates
        using JSON messages over a single WebSocket connection.
      </p>

      <h3>Client to server</h3>
      <CodeBlock
        code={`type ClientMsg =
  | { type: 'subscribe'; channel: string }
  | { type: 'unsubscribe'; channel: string }
  | { type: 'publish'; channel: string; data: unknown }
  | { type: 'presence:join'; channel: string; data: unknown }
  | { type: 'presence:update'; channel: string; data: unknown }
  | { type: 'presence:leave'; channel: string }`}
      />

      <h3>Server to client</h3>
      <CodeBlock
        code={`type ServerMsg =
  | { type: 'connected'; connectionId: string }
  | { type: 'subscribe:ok'; channel: string }
  | { type: 'subscribe:error'; channel: string; code: number; reason: string }
  | { type: 'message'; channel: string; data: unknown }
  | { type: 'presence:update'; channel: string; users: ReadonlyArray<PresenceUser> }`}
      />

      <h3>Message flow</h3>
      <p>
        The typical sequence is: the client opens a WebSocket connection and
        receives a <code>connected</code> message containing its unique{' '}
        <code>connectionId</code>. The client then sends <code>subscribe</code>{' '}
        messages for each channel it needs. The server responds with{' '}
        <code>subscribe:ok</code> on success or <code>subscribe:error</code> if
        authorization fails. Once subscribed, the client receives{' '}
        <code>message</code> events whenever data is published to the channel.
      </p>
      <p>
        For presence, the client sends <code>presence:join</code> when entering
        a channel, <code>presence:update</code> when local presence data
        changes, and <code>presence:leave</code> when exiting. The server
        responds with <code>presence:update</code> messages containing the list
        of all other users in the channel &mdash; the sender is excluded from
        the <code>users</code> array.
      </p>

      <h2 id="sse-messages">SSE transport messages</h2>
      <p>
        The SSE transport (<code>sseTransport</code>) uses Server-Sent Events
        for the server-to-client direction and HTTP POST requests for the
        client-to-server direction.
      </p>

      <h3>Server to client (SSE events)</h3>
      <p>
        Each SSE event has <code>data:</code> containing JSON:
      </p>
      <CodeBlock
        code={`type ServerEvent =
  | { type: 'connected'; connectionId: string }
  | { type: 'message'; channel: string; data: unknown }
  | { type: 'ping' }`}
      />

      <h3>Client to server (POST requests)</h3>
      <p>
        The client sends actions as JSON in the body of POST requests to the
        server endpoint:
      </p>
      <CodeBlock
        code={`type ClientAction =
  | { action: 'subscribe'; connectionId: string; channel: string }
  | { action: 'unsubscribe'; connectionId: string; channel: string }
  | { action: 'publish'; channel: string; data: unknown }`}
      />
      <div className="doc-callout">
        <p>
          The SSE transport does <strong>not</strong> support presence. Presence
          requires bidirectional messaging for real-time join/leave/update
          events, and SSE is inherently unidirectional. If you need presence,
          use the WebSocket or Centrifugo transport instead.
        </p>
      </div>
      <p>
        Note that <code>connectionId</code> is required on{' '}
        <code>subscribe</code> and <code>unsubscribe</code> actions. The client
        receives its <code>connectionId</code> from the initial{' '}
        <code>connected</code> SSE event and includes it in subsequent POST
        requests so the server can associate the action with the correct SSE
        connection.
      </p>

      <h2 id="centrifugo-messages">Centrifugo transport messages</h2>
      <p>
        The Centrifugo transport (<code>centrifugoTransport</code>) speaks the
        native Centrifugo protocol over WebSocket. Commands are JSON objects
        with an incrementing <code>id</code> field. The server replies with
        matching <code>id</code> values so the client can correlate requests
        with responses.
      </p>

      <h3>Client to server (commands)</h3>
      <CodeBlock
        code={`type CentrifugoCommand =
  | { id: number; connect: { token?: string; data?: Record<string, unknown> } }
  | { id: number; subscribe: { channel: string; recover?: boolean; epoch?: string; offset?: number } }
  | { id: number; unsubscribe: { channel: string } }
  | { id: number; publish: { channel: string; data: unknown } }`}
      />

      <h3>Server to client (replies)</h3>
      <p>
        Replies include the <code>id</code> from the original command so the
        client can match them:
      </p>
      <CodeBlock
        code={`interface CentrifugoReply {
  id: number
  result?: {
    // connect reply
    client?: string       // connection ID
    version?: string
    // subscribe reply
    recoverable?: boolean
    epoch?: string
    offset?: number
    publications?: Array<{ data: unknown; offset?: number }>
    // publish reply — empty result on success
  }
  error?: {
    code: number
    message: string
  }
}`}
      />

      <h3>Server to client (pushes)</h3>
      <p>
        Server-initiated messages have no <code>id</code> field. They are
        delivered as push events:
      </p>
      <CodeBlock
        code={`// Publication push — new data on a subscribed channel
{ result: { channel: string; data: { data: unknown; offset?: number } } }

// Join push — a user joined the channel
{ result: { channel: string; data: { info: { client: string; user: string } } }; type: 'join' }

// Leave push — a user left the channel
{ result: { channel: string; data: { info: { client: string; user: string } } }; type: 'leave' }

// Unsubscribe push — server forcibly unsubscribed the client
{ result: { channel: string }; type: 'unsub' }

// Disconnect push — server is closing the connection
{ result: { code: number; reason: string }; type: 'disconnect' }`}
      />

      <h3>Sidecar presence pattern</h3>
      <p>
        Centrifugo&rsquo;s native presence API is not used by the adapter.
        Instead, presence messages are published to a sidecar channel with the
        prefix <code>$prs:</code>. For a data channel named{' '}
        <code>app:chat-room-1</code>, presence flows through{' '}
        <code>$prs:app:chat-room-1</code>.
      </p>
      <CodeBlock
        code={`// Messages published to the sidecar presence channel
type PresenceSidecarMsg =
  | { type: 'prs:join'; connectionId: string; data: unknown }
  | { type: 'prs:update'; connectionId: string; data: unknown }
  | { type: 'prs:leave'; connectionId: string }`}
      />
      <p>
        The <code>$prs</code> namespace must have{' '}
        <code>allow_publish_for_subscriber: true</code> in your Centrifugo
        config so that clients can publish presence heartbeats directly.
      </p>

      <h2 id="multi-tab-messages">Multi-tab messages (BroadcastChannel)</h2>
      <p>
        The coordinated transport uses the browser&rsquo;s{' '}
        <code>BroadcastChannel</code> API for inter-tab communication. One tab
        is elected as the leader and holds the actual WebSocket or SSE
        connection. Other tabs proxy their subscribe/publish calls through
        BroadcastChannel messages to the leader tab, which forwards them to the
        server and relays responses back.
      </p>
      <p>
        The wire format for these inter-tab messages is an internal
        implementation detail and may change between versions. See the{' '}
        <a href="#/docs/resilience">Resilience</a> page for the public API and
        configuration options.
      </p>

      <h2 id="collection-messages">Collection channel messages</h2>
      <p>
        Collections use a standard message envelope for insert, update, and
        delete operations. This is the shape of every message published to a
        collection channel. See <a href="#/docs/collections">Collections</a> for
        the full API.
      </p>
      <CodeBlock
        code={`interface RealtimeChannelMessage<T = unknown> {
  action: 'insert' | 'update' | 'delete'
  data: T
  _crdt?: CrdtMessageHeader
  _nonce?: string
  _clientId?: string
}`}
      />
      <p>
        The <code>data</code> field carries the actual payload &mdash; the row
        being inserted, updated, or deleted. The underscore-prefixed fields are
        internal:
      </p>
      <ul>
        <li>
          <code>_crdt</code> &mdash; CRDT convergence metadata. Present only
          when the collection uses CRDT conflict resolution. Contains vector
          clocks, field-level timestamps, and merge information.
        </li>
        <li>
          <code>_nonce</code> &mdash; a unique identifier for optimistic update
          echo suppression. When a client publishes a mutation optimistically,
          it attaches a nonce. When the server echoes the mutation back, the
          client recognizes the nonce and skips the duplicate.
        </li>
        <li>
          <code>_clientId</code> &mdash; identifies the originating client. Used
          together with <code>_nonce</code> to determine whether an incoming
          message is an echo of the client&rsquo;s own mutation.
        </li>
      </ul>

      <h2 id="stream-messages">Stream channel messages</h2>
      <p>
        Stream channels use sentinel message types to signal lifecycle events.
        These are distinct from the user-defined event payloads that flow
        through <code>reduce</code>. See{' '}
        <a href="#/docs/streaming">Streaming</a> for the full API.
      </p>
      <CodeBlock
        code={`// Sentinel types — these are string constants, not user data
const STREAM_DONE      = '__stream:done' as const
const STREAM_ERROR     = '__stream:error' as const
const STREAM_HEARTBEAT = '__stream:heartbeat' as const

// Sent as channel messages:
// Done:      { type: '__stream:done' }
// Error:     { type: '__stream:error'; message: string }
// Heartbeat: { type: '__stream:heartbeat' }`}
      />
      <p>
        The <code>STREAM_DONE</code> sentinel transitions the stream status to{' '}
        <code>done</code>. <code>STREAM_ERROR</code> transitions to{' '}
        <code>error</code> and includes a human-readable error message.{' '}
        <code>STREAM_HEARTBEAT</code> resets the <code>staleAfter</code> timer
        without changing stream state &mdash; the server sends these
        periodically during long-running streams to prove the connection is
        alive.
      </p>
      <p>
        When checkpointing is enabled, the server periodically captures the
        reduced state:
      </p>
      <CodeBlock
        code={`interface StreamCheckpoint<TState> {
  channel: string   // Serialized channel string
  seq: number       // Sequence number of last checkpointed event
  state: TState     // Accumulated state snapshot
  elapsed: number   // Milliseconds since stream creation
}`}
      />
      <p>
        The <code>channel</code> field is the serialized channel string.{' '}
        <code>seq</code> is the sequence number of the last checkpointed event.{' '}
        <code>state</code> holds the fully reduced (accumulated) state snapshot
        at the time of the checkpoint, and <code>elapsed</code> is the number of
        milliseconds since the stream was created. Checkpoints are passed to
        your <code>checkpoint.handler</code> callback for persistence.
      </p>

      <div className="doc-callout">
        <p>
          You do not need to know the wire protocol to use TanStack Realtime.
          This reference is for transport authors, debuggers, and advanced
          integration scenarios.
        </p>
      </div>
    </article>
  )
}
