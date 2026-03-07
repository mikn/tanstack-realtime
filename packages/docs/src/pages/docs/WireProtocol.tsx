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
  /** Register lifecycle hooks (offline queue, gap recovery, dedup, etc.). */
  hook: (registration: HookRegistration) => HookHandle
  /** Optional: called when the server rejects a subscription attempt. */
  onSubscribeError?: (callback: (channel: string, reason: string, code?: number) => void) => () => void
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

      <h2 id="custom-websocket">Custom WebSocket transport</h2>
      <p>
        TanStack Realtime does not ship a generic WebSocket transport. If you
        want to connect over a plain WebSocket (without Centrifugo), implement
        the <code>RealtimeTransport</code> interface yourself. The interface is
        intentionally small — you only need to wire up the five core methods
        plus, optionally, presence and hook support.
      </p>
      <p>
        You are free to choose any wire format for your custom transport. The
        example below shows a simple JSON message protocol that you can use as a
        starting point. Your server must speak the same format on the other end.
      </p>

      <h3>Example client-to-server messages</h3>
      <CodeBlock
        code={`// Subscribe to a channel
{ type: 'subscribe'; channel: string }
// Unsubscribe from a channel
{ type: 'unsubscribe'; channel: string }
// Publish data to a channel
{ type: 'publish'; channel: string; data: unknown }
// Presence — join, update, or leave (requires PresenceCapable implementation)
{ type: 'presence:join'; channel: string; data: unknown }
{ type: 'presence:update'; channel: string; data: unknown }
{ type: 'presence:leave'; channel: string }`}
      />

      <h3>Example server-to-client messages</h3>
      <CodeBlock
        code={`// Sent once after the WebSocket opens
{ type: 'connected'; connectionId: string }
// Sent when a subscription is accepted
{ type: 'subscribe:ok'; channel: string }
// Sent when a subscription is rejected (e.g. auth failure)
{ type: 'subscribe:error'; channel: string; code: number; reason: string }
// Sent when data is published to a subscribed channel
{ type: 'message'; channel: string; data: unknown }
// Sent when presence changes (requires PresenceCapable implementation)
{ type: 'presence:update'; channel: string; users: ReadonlyArray<PresenceUser> }`}
      />

      <p>
        For presence support your transport must also implement the{' '}
        <code>PresenceCapable</code> interface shown above. The built-in
        Centrifugo adapter implements both and can serve as a reference
        implementation.
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
  | { type: 'subscribe:error'; channel: string; reason: string; code?: number }
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
          use the Centrifugo transport or build a custom WebSocket transport
          instead.
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
        client can match them. Each reply has at most one of{' '}
        <code>connect</code>, <code>subscribe</code>, <code>publish</code>, or{' '}
        <code>unsubscribe</code> set (corresponding to the command type), plus
        an optional <code>error</code> field on failure:
      </p>
      <CodeBlock
        code={`interface CentrifugoReply {
  id: number
  connect?: {
    client: string      // assigned connection ID
    version: string
    data?: unknown
    subs?: unknown
  }
  subscribe?: {
    recoverable?: boolean
    epoch?: string
    offset?: number
    publications?: Array<{ data: unknown; offset?: number }>
    data?: unknown
  }
  publish?: Record<string, never>    // empty on success
  unsubscribe?: Record<string, never>
  error?: {
    code: number
    message: string
  }
}`}
      />

      <h3>Server to client (pushes)</h3>
      <p>
        Server-initiated messages have no <code>id</code> field. They arrive
        with a top-level <code>push</code> key containing the channel and one of
        several event fields:
      </p>
      <CodeBlock
        code={`interface CentrifugoPush {
  push: {
    channel: string
    // Publication — new data on a subscribed channel
    pub?: { data: unknown; offset?: number; tags?: Record<string, string> }
    // Join — a client joined the channel (requires joinLeave on the namespace)
    join?: { info: { user: string; client: string; conn_info?: unknown; chan_info?: unknown } }
    // Leave — a client left the channel
    leave?: { info: { user: string; client: string; conn_info?: unknown; chan_info?: unknown } }
    // Unsubscribe — server forcibly unsubscribed this client
    unsubscribe?: { resubscribe?: boolean }
    // Disconnect — server is closing the connection
    disconnect?: { code: number; reason: string; reconnect?: boolean }
  }
}`}
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
  | { type: 'prs:join'; clientId: string; data: unknown }
  | { type: 'prs:update'; clientId: string; data: unknown }
  | { type: 'prs:leave'; clientId: string }`}
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
