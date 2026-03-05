export function ApiReference() {
  return (
    <article className="doc-article">
      <h1>API Reference</h1>
      <p className="doc-lead">
        Complete reference for all exported functions, hooks, types, and
        utilities across the TanStack Realtime packages.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* @tanstack/realtime                                                   */}
      {/* ------------------------------------------------------------------ */}
      <h2 id="realtime-core">@tanstack/realtime</h2>
      <p>
        Framework-agnostic core. Includes the client factory, collection
        helpers, CRDT primitives, transport utilities, and server-side
        streaming.
      </p>

      {/* Client */}
      <h3 id="client">Client</h3>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>createRealtimeClient</code>
            </td>
            <td>
              <code>(options: RealtimeClientOptions) =&gt; RealtimeClient</code>
            </td>
            <td>
              Creates a framework-agnostic realtime client that wraps a
              transport, exposing connect, disconnect, subscribe, publish, and
              presence methods.
            </td>
          </tr>
          <tr>
            <td>
              <code>serializeKey</code>
            </td>
            <td>
              <code>(key: QueryKey) =&gt; string</code>
            </td>
            <td>
              Deterministically serializes a <code>QueryKey</code> array into a
              stable channel string. Used internally by all collection helpers.
            </td>
          </tr>
          <tr>
            <td>
              <code>parseChannel</code>
            </td>
            <td>
              <code>(channel: string) =&gt; ParsedChannel</code>
            </td>
            <td>
              Parses a serialized channel string back into its base name and
              params object.
            </td>
          </tr>
          <tr>
            <td>
              <code>hasPresence</code>
            </td>
            <td>
              <code>
                (transport: RealtimeTransport) =&gt; transport is
                PresenceCapable
              </code>
            </td>
            <td>
              Type guard that checks whether a transport implements the optional{' '}
              <code>PresenceCapable</code> interface.
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        Import:{' '}
        <code>
          import {'{'} createRealtimeClient {'}'} from '@tanstack/realtime'
        </code>
      </p>

      {/* Collection Sources */}
      <h3 id="collections">Collection Sources</h3>
      <p>
        These functions create TanStack DB <code>CollectionConfig</code>{' '}
        objects. Pass the result to <code>createCollection()</code> from{' '}
        <code>@tanstack/db</code>.
      </p>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>realtimeCollectionOptions</code>
            </td>
            <td>
              <code>
                (config: RealtimeCollectionConfig) =&gt; CollectionConfig
              </code>
            </td>
            <td>
              Full-featured realtime collection with insert / update / delete
              semantics, optional per-field CRDT convergence, and optimistic
              mutations.
            </td>
          </tr>
          <tr>
            <td>
              <code>liveChannelOptions</code>
            </td>
            <td>
              <code>(config: LiveChannelConfig) =&gt; CollectionConfig</code>
            </td>
            <td>
              Append-only live channel. Every event that passes{' '}
              <code>onEvent</code> is inserted as a new row — designed for chat
              messages, game events, and activity feeds.
            </td>
          </tr>
          <tr>
            <td>
              <code>streamChannelOptions</code>
            </td>
            <td>
              <code>(config: StreamChannelConfig) =&gt; CollectionConfig</code>
            </td>
            <td>
              Reduce-based streaming collection. Folds incoming events into a
              single reactive item with <code>status</code> tracking (pending /
              streaming / done / error / stale).
            </td>
          </tr>
          <tr>
            <td>
              <code>presenceChannelOptions</code>
            </td>
            <td>
              <code>
                (config: PresenceCollectionConfig) =&gt; CollectionConfig
              </code>
            </td>
            <td>
              Presence as a TanStack DB collection. Each connected peer is a
              row; the collection updates reactively as members join and leave.
            </td>
          </tr>
          <tr>
            <td>
              <code>ephemeralLiveOptions</code>
            </td>
            <td>
              <code>(config: EphemeralLiveConfig) =&gt; CollectionConfig</code>
            </td>
            <td>
              Ephemeral live channel where rows expire automatically after a
              configurable TTL — useful for typing indicators and transient
              state.
            </td>
          </tr>
          <tr>
            <td>
              <code>tickCollectionOptions</code>
            </td>
            <td>
              <code>(config: TickCollectionConfig) =&gt; CollectionConfig</code>
            </td>
            <td>
              Game-tick collection for high-frequency state updates. Works with{' '}
              <code>tickTransport</code> to batch mutations per tick.
            </td>
          </tr>
        </tbody>
      </table>

      {/* Channel Definitions */}
      <h3 id="channel-definitions">Channel Definitions</h3>
      <p>
        Typed channel descriptors created at module level and reused across
        components.
      </p>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>createPresenceChannel</code>
            </td>
            <td>
              <code>
                (config: PresenceChannelConfig) =&gt; PresenceChannelDef
              </code>
            </td>
            <td>
              Define a typed presence channel. Pass the result to{' '}
              <code>usePresence</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>createStreamChannel</code>
            </td>
            <td>
              <code>
                (config: StreamChannelDefConfig) =&gt; StreamChannelDef
              </code>
            </td>
            <td>
              Define a typed stream channel (with initial state, reduce, isDone,
              isError). Pass the result to <code>useStream</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>defineSyncedCounter</code>
            </td>
            <td>
              <code>(config: SyncedCounterConfig) =&gt; SyncedCounterDef</code>
            </td>
            <td>
              Define a PN-Counter CRDT channel. Pass the result to{' '}
              <code>useSyncedCounter</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>defineSyncedValue</code>
            </td>
            <td>
              <code>(config: SyncedValueConfig) =&gt; SyncedValueDef</code>
            </td>
            <td>
              Define a LWW-Register CRDT channel. Pass the result to{' '}
              <code>useSyncedValue</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>defineSyncedSet</code>
            </td>
            <td>
              <code>(config: SyncedSetConfig) =&gt; SyncedSetDef</code>
            </td>
            <td>
              Define an OR-Set CRDT channel. Pass the result to{' '}
              <code>useSyncedSet</code>.
            </td>
          </tr>
        </tbody>
      </table>

      {/* DB Composition Helpers */}
      <h3 id="db-helpers">DB Composition Helpers</h3>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>withRest</code>
            </td>
            <td>
              <code>
                (options: WithRestOptions) =&gt; {'{'} getKey, queryFn,
                onInsert, onUpdate, onDelete {'}'}
              </code>
            </td>
            <td>
              Generates <code>queryFn</code> and mutation callbacks for a
              standard REST/JSON API. Spread into{' '}
              <code>realtimeCollectionOptions</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>withServerFns</code>
            </td>
            <td>
              <code>
                (options: WithServerFnsOptions) =&gt; {'{'} getKey, queryFn,
                onInsert, onUpdate, onDelete {'}'}
              </code>
            </td>
            <td>
              Generates <code>queryFn</code> and mutation callbacks from
              TanStack Start server functions. Spread into{' '}
              <code>realtimeCollectionOptions</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>serverStreamCallbacks</code>
            </td>
            <td>
              <code>
                {'{'} isDone, isError {'}'}: Partial&lt;StreamChannelConfig&gt;
              </code>
            </td>
            <td>
              Pre-built <code>isDone</code> / <code>isError</code> callbacks
              that detect the sentinel events emitted by{' '}
              <code>createServerStream</code>. Spread into{' '}
              <code>streamChannelOptions</code>.
            </td>
          </tr>
        </tbody>
      </table>

      {/* CRDT Primitives */}
      <h3 id="crdt-primitives">CRDT Primitives</h3>

      <h4>Lamport Clock</h4>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>generateClientId</code>
            </td>
            <td>
              <code>() =&gt; string</code>
            </td>
            <td>Generate a random unique client identifier.</td>
          </tr>
          <tr>
            <td>
              <code>tickClock</code>
            </td>
            <td>
              <code>() =&gt; number</code>
            </td>
            <td>
              Increment and return the module-level Lamport clock. Call before
              publishing a LWW write.
            </td>
          </tr>
          <tr>
            <td>
              <code>advanceClock</code>
            </td>
            <td>
              <code>(remote: number) =&gt; void</code>
            </td>
            <td>
              Advance the local clock past a received remote timestamp — ensures
              monotonicity.
            </td>
          </tr>
          <tr>
            <td>
              <code>resetClock</code>
            </td>
            <td>
              <code>() =&gt; void</code>
            </td>
            <td>Reset the clock to zero (for testing).</td>
          </tr>
          <tr>
            <td>
              <code>createClock</code>
            </td>
            <td>
              <code>() =&gt; LamportClock</code>
            </td>
            <td>
              Create an isolated Lamport clock instance (tick, advance, reset,
              get).
            </td>
          </tr>
        </tbody>
      </table>

      <h4>LWW-Register (Last-Write-Wins)</h4>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>lwwWins</code>
            </td>
            <td>
              <code>(current: LwwState, incoming: LwwState) =&gt; boolean</code>
            </td>
            <td>
              Returns <code>true</code> if <code>incoming</code> should replace{' '}
              <code>current</code>, using Lamport clock + client ID
              tie-breaking.
            </td>
          </tr>
        </tbody>
      </table>

      <h4>PN-Counter (Positive-Negative)</h4>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>pnValue</code>
            </td>
            <td>
              <code>(state: PnState) =&gt; number</code>
            </td>
            <td>Compute the current counter value from PN-Counter state.</td>
          </tr>
          <tr>
            <td>
              <code>mergePn</code>
            </td>
            <td>
              <code>(a: PnState, b: PnState) =&gt; PnState</code>
            </td>
            <td>
              Merge two PN-Counter states by taking the max per client entry.
            </td>
          </tr>
          <tr>
            <td>
              <code>pnIncrement</code>
            </td>
            <td>
              <code>
                (state: PnState, clientId: string, by?: number) =&gt; PnState
              </code>
            </td>
            <td>
              Return a new state with the increment vector for{' '}
              <code>clientId</code> raised by <code>by</code> (default 1).
            </td>
          </tr>
          <tr>
            <td>
              <code>pnDecrement</code>
            </td>
            <td>
              <code>
                (state: PnState, clientId: string, by?: number) =&gt; PnState
              </code>
            </td>
            <td>
              Return a new state with the decrement vector for{' '}
              <code>clientId</code> raised by <code>by</code> (default 1).
            </td>
          </tr>
        </tbody>
      </table>

      <h4>OR-Set (Observed-Remove Set)</h4>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>orValues</code>
            </td>
            <td>
              <code>&lt;T&gt;(state: OrState) =&gt; Array&lt;T&gt;</code>
            </td>
            <td>Extract the current element values from OR-Set state.</td>
          </tr>
          <tr>
            <td>
              <code>mergeOr</code>
            </td>
            <td>
              <code>(a: OrState, b: OrState) =&gt; OrState</code>
            </td>
            <td>
              Merge two OR-Set states (union of entries, preserving unique
              tags).
            </td>
          </tr>
          <tr>
            <td>
              <code>compactOr</code>
            </td>
            <td>
              <code>(state: OrState) =&gt; OrState</code>
            </td>
            <td>
              Remove duplicate logical entries, keeping only the latest unique
              tag per value.
            </td>
          </tr>
          <tr>
            <td>
              <code>orAdd</code>
            </td>
            <td>
              <code>&lt;T&gt;(state: OrState, item: T) =&gt; OrState</code>
            </td>
            <td>
              Return a new state with <code>item</code> added using a fresh
              unique tag.
            </td>
          </tr>
          <tr>
            <td>
              <code>orRemove</code>
            </td>
            <td>
              <code>&lt;T&gt;(state: OrState, item: T) =&gt; OrState</code>
            </td>
            <td>
              Return a new state with all entries matching <code>item</code>{' '}
              removed.
            </td>
          </tr>
          <tr>
            <td>
              <code>orHas</code>
            </td>
            <td>
              <code>&lt;T&gt;(state: OrState, item: T) =&gt; boolean</code>
            </td>
            <td>
              Return <code>true</code> if <code>item</code> is present in the
              OR-Set (structural equality via JSON).
            </td>
          </tr>
          <tr>
            <td>
              <code>initOrFromArray</code>
            </td>
            <td>
              <code>&lt;T&gt;(items: Array&lt;T&gt;) =&gt; OrState</code>
            </td>
            <td>
              Seed an OR-Set from an array — each element gets a fresh unique
              tag.
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        Import:{' '}
        <code>
          import {'{'} pnValue, mergePn {'}'} from '@tanstack/realtime'
        </code>
      </p>

      {/* Stream Processing */}
      <h3 id="stream-processing">Stream Processing</h3>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>createStreamProcessor</code>
            </td>
            <td>
              <code>
                &lt;TState, TEvent&gt;(config: StreamProcessorConfig, initial:
                TState, onTransition: StreamTransitionCallback) =&gt;
                StreamProcessor
              </code>
            </td>
            <td>
              Pure state-machine that folds events via <code>reduce</code> /{' '}
              <code>isDone</code> / <code>isError</code> and fires a callback on
              every transition.
            </td>
          </tr>
          <tr>
            <td>
              <code>processEvent</code>
            </td>
            <td>
              <code>
                &lt;TState, TEvent&gt;(config, snapshot, event) =&gt;
                ProcessEventResult
              </code>
            </td>
            <td>
              Single-step version of the stream processor — process one event
              against an existing snapshot and return the new snapshot.
            </td>
          </tr>
          <tr>
            <td>
              <code>stripEnvelope</code>
            </td>
            <td>
              <code>(event: unknown) =&gt; EnvelopeResult</code>
            </td>
            <td>
              Strip framework metadata (<code>_seq</code>, <code>_ts</code>,{' '}
              <code>_signature</code>) from a received event, returning the
              clean user payload.
            </td>
          </tr>
          <tr>
            <td>
              <code>withEnvelopeStripping</code>
            </td>
            <td>
              <code>
                (handler: (event: unknown) =&gt; void) =&gt; (raw: unknown)
                =&gt; void
              </code>
            </td>
            <td>
              Middleware that strips the framework envelope before forwarding to
              a handler.
            </td>
          </tr>
          <tr>
            <td>
              <code>withHeartbeatFilter</code>
            </td>
            <td>
              <code>
                (handler, options?: HeartbeatFilterOptions) =&gt; (raw: unknown)
                =&gt; void
              </code>
            </td>
            <td>
              Middleware that intercepts <code>__stream:heartbeat</code> events,
              calls <code>onHeartbeat</code>, and prevents them from reaching
              the downstream handler.
            </td>
          </tr>
        </tbody>
      </table>

      {/* Server Utilities */}
      <h3 id="server-utilities">Server Utilities</h3>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>createServerStream</code>
            </td>
            <td>
              <code>
                &lt;TEvent&gt;(options: CreateServerStreamOptions) =&gt;
                ServerStream&lt;TEvent&gt;
              </code>
            </td>
            <td>
              Create a server-side stream handle with <code>push()</code>,{' '}
              <code>done()</code>, and <code>error()</code>. Adds sequence
              numbers, optional HMAC signing, heartbeats, and checkpointing.
            </td>
          </tr>
          <tr>
            <td>
              <code>verifyEventSignature</code>
            </td>
            <td>
              <code>
                (event: unknown, signature: string | undefined, hmacKey: string)
                =&gt; Promise&lt;boolean&gt;
              </code>
            </td>
            <td>
              Verify an HMAC-SHA256 signature on a received event using
              constant-time comparison.
            </td>
          </tr>
          <tr>
            <td>
              <code>createValidatedPublish</code>
            </td>
            <td>
              <code>(options: ValidatedPublishOptions) =&gt; PublishFn</code>
            </td>
            <td>
              Wrap a <code>PublishFn</code> with per-channel permission checks
              and an optional payload validation function.
            </td>
          </tr>
          <tr>
            <td>
              <code>STREAM_DONE</code>
            </td>
            <td>
              <code>'__stream:done'</code>
            </td>
            <td>
              Sentinel <code>type</code> value pushed by{' '}
              <code>ServerStream.done()</code>. Use in <code>isDone</code>{' '}
              callbacks.
            </td>
          </tr>
          <tr>
            <td>
              <code>STREAM_ERROR</code>
            </td>
            <td>
              <code>'__stream:error'</code>
            </td>
            <td>
              Sentinel <code>type</code> value pushed by{' '}
              <code>ServerStream.error()</code>. Use in <code>isError</code>{' '}
              callbacks.
            </td>
          </tr>
          <tr>
            <td>
              <code>STREAM_HEARTBEAT</code>
            </td>
            <td>
              <code>'__stream:heartbeat'</code>
            </td>
            <td>
              Sentinel <code>type</code> value pushed by the heartbeat timer.
              Consumed by <code>withHeartbeatFilter</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>ConflictError</code>
            </td>
            <td>
              <code>class ConflictError extends Error</code>
            </td>
            <td>
              Error class thrown when an optimistic mutation is rejected due to
              a server-side conflict (HTTP 409).
            </td>
          </tr>
          <tr>
            <td>
              <code>isConflictError</code>
            </td>
            <td>
              <code>(e: unknown) =&gt; e is ConflictError</code>
            </td>
            <td>Type guard for ConflictError.</td>
          </tr>
        </tbody>
      </table>

      {/* Transport Wrappers */}
      <h3 id="transport-wrappers">Transport Wrappers & Utilities</h3>

      <h4>Tick Transport</h4>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>tickTransport</code>
            </td>
            <td>
              <code>(options: TickTransportOptions) =&gt; TickTransport</code>
            </td>
            <td>
              Wraps a transport to batch outgoing publish calls at a fixed tick
              interval — ideal for game state with high-frequency updates.
            </td>
          </tr>
          <tr>
            <td>
              <code>computeDelta</code>
            </td>
            <td>
              <code>(prev: TickFrame, next: TickFrame) =&gt; TickFrame</code>
            </td>
            <td>
              Compute only the fields that changed between two tick frames (for
              bandwidth reduction).
            </td>
          </tr>
          <tr>
            <td>
              <code>applyDelta</code>
            </td>
            <td>
              <code>(state: TickFrame, delta: TickFrame) =&gt; TickFrame</code>
            </td>
            <td>
              Apply a delta frame onto an existing state to reconstruct the full
              state.
            </td>
          </tr>
        </tbody>
      </table>

      <h4>Offline Queue</h4>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>createOfflineQueue</code>
            </td>
            <td>
              <code>
                (options: OfflineQueueOptions) =&gt; OfflineQueueTransport
              </code>
            </td>
            <td>
              Transport wrapper that buffers outgoing publish calls while
              disconnected and drains them in order on reconnect.
            </td>
          </tr>
          <tr>
            <td>
              <code>createIndexedDBStorage</code>
            </td>
            <td>
              <code>
                (options?: IndexedDBStorageOptions) =&gt; OfflineQueueStorage
              </code>
            </td>
            <td>
              Durable storage backend for the offline queue backed by IndexedDB.
              Survives page reloads.
            </td>
          </tr>
          <tr>
            <td>
              <code>createLocalStorageAdapter</code>
            </td>
            <td>
              <code>
                (options?: LocalStorageOptions) =&gt; OfflineQueueStorage
              </code>
            </td>
            <td>
              Lightweight storage backend for the offline queue backed by
              localStorage.
            </td>
          </tr>
        </tbody>
      </table>

      <h4>Deduplication</h4>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>createDedup</code>
            </td>
            <td>
              <code>(options?: DedupOptions) =&gt; DeduplicationFilter</code>
            </td>
            <td>
              Create a deduplication filter that suppresses replayed messages
              with the same sequence number.
            </td>
          </tr>
        </tbody>
      </table>

      <h4>Gap Recovery</h4>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>withGapRecovery</code>
            </td>
            <td>
              <code>
                (transport: RealtimeTransport, options: GapRecoveryOptions)
                =&gt; GapRecoveryTransport
              </code>
            </td>
            <td>
              Transport wrapper that detects sequence gaps and triggers a
              recovery fetch when messages are missed during a reconnect.
            </td>
          </tr>
        </tbody>
      </table>

      <h4>Throttle</h4>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>throttle</code>
            </td>
            <td>
              <code>
                &lt;T extends (...args: any[]) =&gt; any&gt;(fn: T, options:
                ThrottleOptions) =&gt; ThrottledFn&lt;T&gt;
              </code>
            </td>
            <td>
              Rate-limit any function. Used internally for presence updates and
              cursor broadcasts.
            </td>
          </tr>
        </tbody>
      </table>

      <h4>Ephemeral Map</h4>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>createEphemeralMap</code>
            </td>
            <td>
              <code>
                &lt;T&gt;(options?: EphemeralMapOptions) =&gt;
                EphemeralMap&lt;T&gt;
              </code>
            </td>
            <td>
              A TTL-expiring key-value map. Entries are evicted after their TTL
              elapses — powers <code>ephemeralLiveOptions</code>.
            </td>
          </tr>
        </tbody>
      </table>

      <h4>Multi-Tab Coordination</h4>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>createCoordinatedTransport</code>
            </td>
            <td>
              <code>
                (options: CoordinatedTransportOptions) =&gt; RealtimeTransport
              </code>
            </td>
            <td>
              Recommended entry point for multi-tab transport coordination.
              Automatically selects SharedWorker, BroadcastChannel, or direct
              transport based on browser support.
            </td>
          </tr>
          <tr>
            <td>
              <code>createBroadcastChannelTransport</code>
            </td>
            <td>
              <code>
                (options: BroadcastChannelTransportOptions) =&gt;
                RealtimeTransport
              </code>
            </td>
            <td>
              Multi-tab transport using BroadcastChannel with leader election.
              No worker file required.
            </td>
          </tr>
          <tr>
            <td>
              <code>isBroadcastChannelSupported</code>
            </td>
            <td>
              <code>() =&gt; boolean</code>
            </td>
            <td>
              Returns <code>true</code> if the browser supports
              BroadcastChannel.
            </td>
          </tr>
          <tr>
            <td>
              <code>createSharedWorkerTransport</code>
            </td>
            <td>
              <code>
                (workerUrl: string, options?: SharedWorkerTransportOptions)
                =&gt; RealtimeTransport
              </code>
            </td>
            <td>
              Multi-tab transport (tab side) that delegates to a SharedWorker.
              Best performance; requires a worker file.
            </td>
          </tr>
          <tr>
            <td>
              <code>createSharedWorkerCoordinator</code>
            </td>
            <td>
              <code>
                (innerTransport: RealtimeTransport, options?:
                SharedWorkerCoordinatorOptions) =&gt; SharedWorkerCoordinator
              </code>
            </td>
            <td>
              Worker side of the SharedWorker transport. Call inside the
              SharedWorker file to coordinate all connected tabs through a
              single real connection.
            </td>
          </tr>
          <tr>
            <td>
              <code>isSharedWorkerSupported</code>
            </td>
            <td>
              <code>() =&gt; boolean</code>
            </td>
            <td>
              Returns <code>true</code> if the browser supports SharedWorker.
            </td>
          </tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      {/* @tanstack/react-realtime                                            */}
      {/* ------------------------------------------------------------------ */}
      <h2 id="react-realtime">@tanstack/react-realtime</h2>
      <p>
        React provider and hooks. Re-exports everything from{' '}
        <code>@tanstack/realtime</code> so you only need one import.
      </p>
      <p>
        Import:{' '}
        <code>
          import {'{'} useRealtime {'}'} from '@tanstack/react-realtime'
        </code>
      </p>

      <h3 id="provider">Provider</h3>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>RealtimeProvider</code>
            </td>
            <td>
              <code>(props: RealtimeProviderProps) =&gt; JSX.Element</code>
            </td>
            <td>
              Context provider that makes a <code>RealtimeClient</code>{' '}
              available to all hooks. Wrap your application (or subtree) with
              this component. By default (
              <code>
                autoConnect={'{'}true{'}'}
              </code>
              ), calls <code>client.connect()</code> on mount and{' '}
              <code>client.destroy()</code> on unmount. Set{' '}
              <code>
                autoConnect={'{'}false{'}'}
              </code>{' '}
              to manage the connection lifecycle yourself.
            </td>
          </tr>
        </tbody>
      </table>

      <h3 id="hooks-connection">Connection Hooks</h3>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>useRealtime</code>
            </td>
            <td>
              <code>() =&gt; UseRealtimeResult</code>
            </td>
            <td>
              Returns reactive connection status (<code>status</code>) and
              control functions (<code>connect</code>, <code>disconnect</code>,{' '}
              <code>client</code>). Causes a re-render only when status changes.
            </td>
          </tr>
        </tbody>
      </table>

      <h3 id="hooks-pubsub">Pub/Sub Hooks</h3>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>useSubscribe</code>
            </td>
            <td>
              <code>
                (channel: QueryKey | string, onMessage: (data: unknown) =&gt;
                void) =&gt; void
              </code>
            </td>
            <td>
              Subscribe to raw channel events for the lifetime of the component.
              The callback is stabilized via a ref so a new function reference
              never causes a re-subscription.
            </td>
          </tr>
          <tr>
            <td>
              <code>usePublish</code>
            </td>
            <td>
              <code>
                (channel: QueryKey | string) =&gt; (data: unknown) =&gt;
                Promise&lt;void&gt;
              </code>
            </td>
            <td>
              Returns a stable publish function bound to the channel. The
              returned Promise resolves when the transport dispatches the
              message.
            </td>
          </tr>
          <tr>
            <td>
              <code>useChannel</code>
            </td>
            <td>
              <code>
                (channel: QueryKey | string, onMessage?: (data: unknown) =&gt;
                void) =&gt; UseChannelResult
              </code>
            </td>
            <td>
              Convenience hook combining <code>useSubscribe</code> and{' '}
              <code>usePublish</code> for a single channel. The{' '}
              <code>onMessage</code> callback is optional (publish-only
              scenario).
            </td>
          </tr>
        </tbody>
      </table>

      <h3 id="hooks-presence">Presence Hooks</h3>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>usePresence</code>
            </td>
            <td>
              <code>
                (channelDef: PresenceChannelDef, options: UsePresenceOptions)
                =&gt; UsePresenceResult
              </code>
            </td>
            <td>
              Joins a presence channel on mount and returns <code>others</code>{' '}
              (other connected users) and <code>updatePresence</code>. Leaves on
              unmount.
            </td>
          </tr>
        </tbody>
      </table>

      <h3 id="hooks-streaming">Streaming Hooks</h3>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>useStream</code>
            </td>
            <td>
              <code>
                (channelDef: StreamChannelDef, options: UseStreamOptions) =&gt;
                UseStreamResult
              </code>
            </td>
            <td>
              Subscribes to a streaming channel and accumulates events into
              reactive state via the channel definition's <code>reduce</code>{' '}
              function. Returns <code>state</code>, <code>status</code>, and{' '}
              <code>error</code>.
            </td>
          </tr>
        </tbody>
      </table>

      <h3 id="hooks-collections">Collection Hooks</h3>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>useRealtimeCollection</code>
            </td>
            <td>
              <code>
                (config: UseRealtimeCollectionConfig) =&gt; Collection&lt;T,
                TKey&gt;
              </code>
            </td>
            <td>
              Creates and manages a realtime-backed TanStack DB collection. The{' '}
              <code>Collection</code> reference is stable across renders. Pass
              to <code>useLiveQuery</code> from <code>@tanstack/react-db</code>.
              Accepts a <code>url</code> for REST shorthand (generates{' '}
              <code>queryFn</code> + CRUD callbacks automatically) or manual{' '}
              <code>queryFn</code> + callbacks.
            </td>
          </tr>
          <tr>
            <td>
              <code>useLiveChannel</code>
            </td>
            <td>
              <code>
                (config: UseLiveChannelConfig) =&gt; Collection&lt;T, TKey&gt;
              </code>
            </td>
            <td>
              Creates and manages an append-only live-channel collection. Every
              event from <code>onEvent</code> is inserted as a new row. The{' '}
              <code>Collection</code> reference is stable.
            </td>
          </tr>
        </tbody>
      </table>

      <h3 id="hooks-crdt">CRDT Hooks</h3>
      <p>
        Self-contained hooks for shared counters, values, and sets. No TanStack
        DB collection required.
      </p>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>useSyncedCounter</code>
            </td>
            <td>
              <code>
                (def: SyncedCounterDef, options: UseSyncedCounterOptions) =&gt;
                UseSyncedCounterResult
              </code>
            </td>
            <td>
              Subscribe to a shared counter backed by a PN-Counter CRDT. Returns{' '}
              <code>value</code>, <code>increment(by?)</code>, and{' '}
              <code>decrement(by?)</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>useSyncedValue</code>
            </td>
            <td>
              <code>
                (def: SyncedValueDef, options: UseSyncedValueOptions) =&gt;
                UseSyncedValueResult
              </code>
            </td>
            <td>
              Subscribe to a shared value backed by a LWW-Register CRDT. Returns{' '}
              <code>value</code> and <code>set(value)</code>. Last write wins
              with Lamport clock tie-breaking.
            </td>
          </tr>
          <tr>
            <td>
              <code>useSyncedSet</code>
            </td>
            <td>
              <code>
                (def: SyncedSetDef, options: UseSyncedSetOptions) =&gt;
                UseSyncedSetResult
              </code>
            </td>
            <td>
              Subscribe to a shared set backed by an OR-Set CRDT. Returns{' '}
              <code>values</code>, <code>add(item)</code>,{' '}
              <code>remove(item)</code>, and <code>has(item)</code>.
            </td>
          </tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      {/* @tanstack/realtime-adapter-sse                                      */}
      {/* ------------------------------------------------------------------ */}
      <h2 id="adapter-sse">@tanstack/realtime-adapter-sse</h2>
      <p>
        Server-Sent Events (SSE) transport adapter. Provides both the client
        transport and the server handler.
      </p>

      <h3 id="sse-client">Client Transport</h3>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>sseTransport</code>
            </td>
            <td>
              <code>
                (options: SseTransportOptions) =&gt; RealtimeTransport
              </code>
            </td>
            <td>
              Creates a <code>RealtimeTransport</code> backed by SSE (GET
              stream) and HTTP POST (actions). Uses <code>fetch()</code> instead
              of native <code>EventSource</code> so it can set{' '}
              <code>Authorization</code> headers and run in Node.js. Reconnects
              with exponential back-off.
            </td>
          </tr>
        </tbody>
      </table>

      <h4>SseTransportOptions</h4>
      <table className="api-table">
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
              <code>string | URL</code>
            </td>
            <td>required</td>
            <td>SSE endpoint URL.</td>
          </tr>
          <tr>
            <td>
              <code>getToken</code>
            </td>
            <td>
              <code>() =&gt; string | Promise&lt;string&gt;</code>
            </td>
            <td>—</td>
            <td>
              Called once per connection attempt to obtain a Bearer token.
            </td>
          </tr>
          <tr>
            <td>
              <code>initialDelay</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>1000</td>
            <td>Reconnect back-off initial delay (ms).</td>
          </tr>
          <tr>
            <td>
              <code>maxDelay</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>30000</td>
            <td>Reconnect back-off maximum delay (ms).</td>
          </tr>
          <tr>
            <td>
              <code>jitter</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>0.25</td>
            <td>Reconnect back-off jitter factor (0–1).</td>
          </tr>
        </tbody>
      </table>

      <h3 id="sse-server">Server Handler</h3>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>createSseHandler</code>
            </td>
            <td>
              <code>(options?: SseHandlerOptions) =&gt; SseHandler</code>
            </td>
            <td>
              Creates a Fetch-API–compatible SSE handler (GET opens a stream,
              POST dispatches actions). Compatible with Cloudflare Workers,
              Deno, Bun, and Node.js (via a Fetch adapter). Maintains in-memory
              connection state — single-process only.
            </td>
          </tr>
        </tbody>
      </table>

      <h4>SseHandler methods</h4>
      <table className="api-table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>handle</code>
            </td>
            <td>
              <code>(req: Request) =&gt; Promise&lt;Response&gt;</code>
            </td>
            <td>Handle an incoming HTTP request (GET / POST / OPTIONS).</td>
          </tr>
          <tr>
            <td>
              <code>broadcast</code>
            </td>
            <td>
              <code>(channel: string, data: unknown) =&gt; void</code>
            </td>
            <td>
              Push a message to all SSE connections subscribed to{' '}
              <code>channel</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>connectionCount</code>
            </td>
            <td>
              <code>() =&gt; number</code>
            </td>
            <td>Return the current number of active SSE connections.</td>
          </tr>
          <tr>
            <td>
              <code>createStream</code>
            </td>
            <td>
              <code>
                &lt;TEvent&gt;(options: {'{'} channel, hmacKey? {'}'}) =&gt;
                ServerStream&lt;TEvent&gt;
              </code>
            </td>
            <td>
              Create a <code>ServerStream</code> that publishes via{' '}
              <code>broadcast()</code>.
            </td>
          </tr>
        </tbody>
      </table>

      <h4>SseHandlerOptions</h4>
      <table className="api-table">
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
              <code>pingInterval</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>30000</td>
            <td>
              Keep-alive ping interval in ms. Set to <code>0</code> to disable.
            </td>
          </tr>
          <tr>
            <td>
              <code>getUser</code>
            </td>
            <td>
              <code>
                (req: Request) =&gt; {'{'} userId: string {'}'} | null |
                Promise&lt;...&gt;
              </code>
            </td>
            <td>—</td>
            <td>
              Authenticate the request. Return <code>null</code> to reject with
              401.
            </td>
          </tr>
          <tr>
            <td>
              <code>authorize</code>
            </td>
            <td>
              <code>AuthorizeFn</code>
            </td>
            <td>—</td>
            <td>
              Per-channel access control. Receives{' '}
              <code>(userId, parsedChannel)</code> and returns{' '}
              <code>ChannelPermissions | boolean</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>onClientConnect</code>
            </td>
            <td>
              <code>
                (info: {'{'} connectionId, userId {'}'}) =&gt; void
              </code>
            </td>
            <td>—</td>
            <td>
              Fires after <code>getUser</code> succeeds and the SSE stream is
              established. Fire-and-forget — errors are logged, not propagated.
            </td>
          </tr>
          <tr>
            <td>
              <code>onClientDisconnect</code>
            </td>
            <td>
              <code>
                (info: {'{'} connectionId, userId {'}'}) =&gt; void
              </code>
            </td>
            <td>—</td>
            <td>
              Fires when the SSE stream closes (client disconnect or network
              drop). Fire-and-forget.
            </td>
          </tr>
          <tr>
            <td>
              <code>onFirstSubscriber</code>
            </td>
            <td>
              <code>(channel: string) =&gt; void</code>
            </td>
            <td>—</td>
            <td>
              Fires when the first subscriber joins a previously-empty channel.
              Useful for spinning up live queries or background tasks.
            </td>
          </tr>
          <tr>
            <td>
              <code>onChannelEmpty</code>
            </td>
            <td>
              <code>(channel: string) =&gt; void</code>
            </td>
            <td>—</td>
            <td>
              Fires when the last subscriber leaves a channel (count → 0).
              Useful for tearing down resources.
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        Import:{' '}
        <code>
          import {'{'} sseTransport, createSseHandler {'}'} from
          '@tanstack/realtime-adapter-sse'
        </code>
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* @tanstack/realtime-adapter-centrifugo                               */}
      {/* ------------------------------------------------------------------ */}
      <h2 id="adapter-centrifugo">@tanstack/realtime-adapter-centrifugo</h2>
      <p>
        Centrifugo v4+ WebSocket transport adapter with built-in presence and
        epoch/offset recovery.
      </p>

      <h3 id="centrifugo-transport">Transport</h3>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>centrifugoTransport</code>
            </td>
            <td>
              <code>
                (options: CentrifugoTransportOptions) =&gt; RealtimeTransport
                &amp; PresenceCapable
              </code>
            </td>
            <td>
              Creates a <code>RealtimeTransport</code> that connects to a
              Centrifugo server via the v4+ JSON WebSocket protocol. Supports
              presence via a sidecar channel, epoch/offset recovery for
              reconnect, and exponential back-off reconnection.
            </td>
          </tr>
        </tbody>
      </table>

      <h4>CentrifugoTransportOptions</h4>
      <table className="api-table">
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
            <td>required</td>
            <td>Centrifugo WebSocket endpoint URL.</td>
          </tr>
          <tr>
            <td>
              <code>token</code>
            </td>
            <td>
              <code>string | (() =&gt; string | Promise&lt;string&gt;)</code>
            </td>
            <td>—</td>
            <td>JWT token or factory for token-based auth.</td>
          </tr>
          <tr>
            <td>
              <code>data</code>
            </td>
            <td>
              <code>Record&lt;string, unknown&gt;</code>
            </td>
            <td>—</td>
            <td>
              Arbitrary connection data forwarded in the <code>connect</code>{' '}
              command.
            </td>
          </tr>
          <tr>
            <td>
              <code>presencePrefix</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>'$prs:'</td>
            <td>Namespace prefix for the sidecar presence channel.</td>
          </tr>
          <tr>
            <td>
              <code>initialDelay</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>1000</td>
            <td>Reconnect back-off initial delay (ms).</td>
          </tr>
          <tr>
            <td>
              <code>maxDelay</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>30000</td>
            <td>Reconnect back-off maximum delay (ms).</td>
          </tr>
          <tr>
            <td>
              <code>jitter</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>0.25</td>
            <td>Reconnect back-off jitter factor (0–1).</td>
          </tr>
          <tr>
            <td>
              <code>WebSocket</code>
            </td>
            <td>
              <code>typeof globalThis.WebSocket</code>
            </td>
            <td>globalThis.WebSocket</td>
            <td>
              Custom WebSocket constructor — pass the <code>ws</code> package
              class for Node.js {'<'} 21.
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        Import:{' '}
        <code>
          import {'{'} centrifugoTransport {'}'} from
          '@tanstack/realtime-adapter-centrifugo'
        </code>
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* @tanstack/realtime-preset-start                                     */}
      {/* ------------------------------------------------------------------ */}
      <h2 id="preset-start">@tanstack/realtime-preset-start</h2>
      <p>
        TanStack Start / TanStack Router server-side preset. Composes{' '}
        <code>createSseHandler</code> with a pluggable{' '}
        <code>PublishBackend</code> for scalable multi-process deployments.
      </p>

      <h3 id="start-handler">Handler</h3>
      <table className="api-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>createStartHandler</code>
            </td>
            <td>
              <code>
                (options?: StartHandlerOptions) =&gt; StartRealtimeHandler
              </code>
            </td>
            <td>
              Create a TanStack Start–compatible realtime handler. Returns{' '}
              <code>handle</code>, <code>publish</code>,{' '}
              <code>createStream</code>, and <code>dispose</code>. Optionally
              accepts a <code>backend</code> for multi-process fan-out.
            </td>
          </tr>
        </tbody>
      </table>

      <h4>StartRealtimeHandler methods</h4>
      <table className="api-table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>handle</code>
            </td>
            <td>
              <code>(req: Request) =&gt; Promise&lt;Response&gt;</code>
            </td>
            <td>Mount on a TanStack Start API route (GET / POST / OPTIONS).</td>
          </tr>
          <tr>
            <td>
              <code>publish</code>
            </td>
            <td>
              <code>
                (channel: QueryKey | string, data: unknown) =&gt;
                Promise&lt;void&gt;
              </code>
            </td>
            <td>
              Broadcast data from server functions. Routes through the backend
              when configured.
            </td>
          </tr>
          <tr>
            <td>
              <code>createStream</code>
            </td>
            <td>
              <code>
                &lt;TEvent&gt;(options: {'{'} channel, hmacKey? {'}'}) =&gt;
                ServerStream&lt;TEvent&gt;
              </code>
            </td>
            <td>
              Create a <code>ServerStream</code> that routes pushes through the
              configured backend.
            </td>
          </tr>
          <tr>
            <td>
              <code>dispose</code>
            </td>
            <td>
              <code>() =&gt; void</code>
            </td>
            <td>
              Release resources. Calls the backend unsubscribe function if one
              was registered.
            </td>
          </tr>
        </tbody>
      </table>

      <h4>StartHandlerOptions</h4>
      <p>
        Extends <code>SseHandlerOptions</code> (<code>getUser</code>,{' '}
        <code>authorize</code>, <code>pingInterval</code>) with:
      </p>
      <table className="api-table">
        <thead>
          <tr>
            <th>Option</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>backend</code>
            </td>
            <td>
              <code>PublishBackend</code>
            </td>
            <td>
              External pub/sub backend for multi-process deployments. Omit for
              single-process (the common case).
            </td>
          </tr>
        </tbody>
      </table>

      <h4>PublishBackend interface</h4>
      <p>
        Implement this interface to route publishes through Redis, Postgres
        LISTEN/NOTIFY, Cloudflare Durable Objects, or any other storage without
        being tied to a specific provider.
      </p>
      <table className="api-table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Signature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>publish</code>
            </td>
            <td>
              <code>
                (channel: string, data: unknown) =&gt; Promise&lt;void&gt;
              </code>
            </td>
            <td>
              Write a message to the backing store so all server instances are
              notified.
            </td>
          </tr>
          <tr>
            <td>
              <code>subscribe</code>
            </td>
            <td>
              <code>
                (onMessage: (channel: string, data: unknown) =&gt; void) =&gt;
                () =&gt; void
              </code>
            </td>
            <td>
              Subscribe to messages from the store and call{' '}
              <code>onMessage</code>. Return a cleanup function. Only needed for
              multi-process deployments.
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        Import:{' '}
        <code>
          import {'{'} createStartHandler {'}'} from
          '@tanstack/realtime-preset-start'
        </code>
      </p>

      {/* Key Types Reference */}
      <h2 id="key-types">Key Types</h2>
      <p>
        All types are exported from their respective packages. The most commonly
        referenced types are listed below.
      </p>
      <table className="api-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Package</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>RealtimeClient</code>
            </td>
            <td>
              <code>@tanstack/realtime</code>
            </td>
            <td>
              The client object returned by <code>createRealtimeClient</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>RealtimeTransport</code>
            </td>
            <td>
              <code>@tanstack/realtime</code>
            </td>
            <td>
              Core transport interface (connect, disconnect, subscribe,
              publish).
            </td>
          </tr>
          <tr>
            <td>
              <code>PresenceCapable</code>
            </td>
            <td>
              <code>@tanstack/realtime</code>
            </td>
            <td>
              Optional transport extension for joinPresence, updatePresence,
              leavePresence, onPresenceChange.
            </td>
          </tr>
          <tr>
            <td>
              <code>ConnectionStatus</code>
            </td>
            <td>
              <code>@tanstack/realtime</code>
            </td>
            <td>
              <code>
                'disconnected' | 'connecting' | 'connected' | 'reconnecting'
              </code>
            </td>
          </tr>
          <tr>
            <td>
              <code>QueryKey</code>
            </td>
            <td>
              <code>@tanstack/realtime</code>
            </td>
            <td>
              Array channel key, e.g.{' '}
              <code>
                ['todos', {'{'} projectId {'}'}]
              </code>
              .
            </td>
          </tr>
          <tr>
            <td>
              <code>PresenceUser&lt;TData&gt;</code>
            </td>
            <td>
              <code>@tanstack/realtime</code>
            </td>
            <td>
              <code>
                {'{'} connectionId: string; data: TData {'}'}
              </code>{' '}
              — shape of a presence member.
            </td>
          </tr>
          <tr>
            <td>
              <code>ServerStream&lt;TEvent&gt;</code>
            </td>
            <td>
              <code>@tanstack/realtime</code>
            </td>
            <td>
              Handle with <code>push(event)</code>, <code>done()</code>, and{' '}
              <code>error(message)</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>StreamStatus</code>
            </td>
            <td>
              <code>@tanstack/realtime</code>
            </td>
            <td>
              <code>'pending' | 'streaming' | 'done' | 'error' | 'stale'</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>PublishFn</code>
            </td>
            <td>
              <code>@tanstack/realtime</code>
            </td>
            <td>
              <code>
                (channel: QueryKey | string, data: unknown) =&gt;
                Promise&lt;void&gt;
              </code>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  )
}
