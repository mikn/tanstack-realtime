import { Store } from '@tanstack/store'
import { createHookPipeline } from '@realtimejs/core'
import type {
  ConnectionStatus,
  HookHandle,
  HookRegistration,
  PresenceCapable,
  PresenceUser,
  RealtimeTransport,
} from '@realtimejs/core'
import type {
  ClientEnvelope,
  PresenceMember,
  ServerEnvelope,
} from './protocol.js'

// ---------------------------------------------------------------------------
// Structural ("Like") interface — so tests can inject a fake socket without
// depending on the concrete `partysocket` runtime.
// ---------------------------------------------------------------------------

/**
 * Minimal structural type describing the parts of a `partysocket` `PartySocket`
 * this adapter relies on. Depending on this (rather than the concrete class)
 * keeps the adapter offline-testable: the conformance kit injects a synchronous
 * fake that satisfies the same shape.
 *
 * `PartySocket` is itself a **reconnecting** WebSocket: it transparently
 * re-establishes the underlying connection and re-fires `open` on the SAME
 * object. The adapter therefore binds its listeners ONCE per socket instance
 * (see {@link partykitTransport}) and re-sends subscribe envelopes from the
 * `open` handler — there is no per-reconnect re-binding, so the Pusher
 * double-bind class is structurally impossible here.
 */
export interface PartySocketLike {
  /** Bind an event handler (`'open' | 'message' | 'close' | 'error'`). */
  addEventListener: (type: string, listener: (event: unknown) => void) => void
  /** Remove an event handler. */
  removeEventListener?: (
    type: string,
    listener: (event: unknown) => void,
  ) => void
  /** Send a frame to the room. */
  send: (data: string) => void
  /** Close the connection (and stop reconnecting). */
  close: () => void
  /** Force an immediate reconnect (optional; PartySocket exposes it). */
  reconnect?: () => void
  /** Current ready state, mirroring the WebSocket constants. */
  readyState?: number
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface PartyKitTransportOptions {
  /**
   * PartyKit host (the deployment domain or `localhost:1999` in dev).
   * Required for real use (ignored when `socket`/`createSocket` is injected).
   * @example '127.0.0.1:1999' | 'my-app.username.partykit.dev'
   */
  host?: string
  /**
   * The PartyKit room id. realtime.js multiplexes ALL its channels over this
   * single room connection (the "hub"). Required for real use.
   */
  room?: string
  /**
   * The PartyKit party (server) name. Defaults to PartyKit's `'main'` party.
   * @default 'main'
   */
  party?: string
  /**
   * Query params forwarded to the room connection (e.g. an auth token).
   * Passed verbatim to the `PartySocket` constructor.
   */
  query?: Record<string, string> | (() => Record<string, string>)
  /**
   * Extra options forwarded verbatim to the `PartySocket` constructor.
   * Merged last.
   */
  partySocketOptions?: Record<string, unknown>
  /**
   * Pre-built socket (or anything matching {@link PartySocketLike}). Primarily
   * an injection point for tests, but also useful when you already own a
   * `PartySocket`. When supplied, connection config is ignored.
   */
  socket?: PartySocketLike
  /**
   * Factory that builds a {@link PartySocketLike}. Called once on the first
   * `connect()`. Lets callers (and tests) construct the socket lazily.
   * Takes precedence over `socket` only if `socket` is absent.
   */
  createSocket?: () => PartySocketLike
}

// ---------------------------------------------------------------------------
// Transport factory
// ---------------------------------------------------------------------------

/**
 * Creates a `RealtimeTransport` backed by a **PartyKit** room (a Cloudflare
 * **Durable Object**). This proves the contract against a structurally
 * different infra model than Centrifugo/Pusher: the room server holds
 * membership and fan-out state at the edge.
 *
 * ## Single multiplexed connection + envelope wire protocol
 * Unlike Pusher (one provider channel per realtime.js channel), this adapter
 * opens ONE socket to a PartyKit room and carries every realtime.js channel
 * inside JSON envelopes routed by a `channel` field — mirroring the Centrifugo
 * single-socket design. See `protocol.ts` for the full envelope set. Because
 * there is exactly one `message` listener on the socket (bound once), the
 * per-channel double-bind class that bit Pusher is structurally impossible.
 *
 * A reference room server implementing this wire protocol ships in
 * `@realtimejs/adapter-partykit/server` (documentation; not a tested CI path).
 *
 * ## Reconnect
 * `PartySocket` is a reconnecting WebSocket: it re-establishes the underlying
 * connection and re-fires `open` on the SAME object. The adapter binds listeners
 * once and, from every `open`, re-sends a `subscribe` envelope for each active
 * channel and re-broadcasts presence intent (the deferred-subscribe contract).
 *
 * ## Presence
 * PartyKit / the Durable Object holds connection membership server-side.
 * `joinPresence`/`updatePresence`/`leavePresence` send `presence:*` envelopes;
 * `onPresenceChange(channel, cb)` fires from `{type:'presence', channel,
 * members}` server messages. The adapter learns its own `connectionId` from the
 * `{type:'connected'}` envelope on connect and **excludes self** from the
 * reported member list.
 *
 * ## Capabilities
 *  - presence: true — the DO holds membership; implemented faithfully.
 *  - serverAssistedRecovery: false — PartySocket is a reconnecting WS with no
 *    built-in offset/epoch gap replay; we do not claim it.
 *  - history: false — no on-demand server-side history retrieval API.
 *  - ephemeral: true — fire-and-forget pub/sub is the baseline.
 *
 * @example
 * import { partykitTransport } from '@realtimejs/adapter-partykit'
 * import { createRealtimeClient } from '@realtimejs/core'
 *
 * export const realtimeClient = createRealtimeClient({
 *   transport: partykitTransport({
 *     host: 'my-app.username.partykit.dev',
 *     room: 'hub',
 *   }),
 * })
 */
export function partykitTransport(
  options: PartyKitTransportOptions,
): RealtimeTransport & PresenceCapable {
  const pipeline = createHookPipeline()
  const store = new Store<ConnectionStatus>('disconnected')

  // channel → Set of message callbacks
  const subscriptions = new Map<string, Set<(data: unknown) => void>>()

  // channel → Set of presence callbacks
  const presenceListeners = new Map<
    string,
    Set<(users: ReadonlyArray<PresenceUser>) => void>
  >()

  // channel → latest presence data we want to (re)broadcast on reconnect.
  // Holding the last join/update payload lets us re-assert membership after a
  // reconnect (the DO loses our prior connection's membership).
  const presenceIntent = new Map<string, unknown>()

  // subscribe error callbacks
  const subscribeErrorListeners = new Set<
    (channel: string, reason: string, code?: number) => void
  >()

  let socket: PartySocketLike | null = null
  // Tracks whether listeners are already bound to the CURRENT socket instance,
  // so a re-`connect()` against a reused injected socket never double-binds.
  let listenersBound = false
  // The handler functions currently bound to `socket`, kept so we can call
  // `removeEventListener` for each on teardown. Without this, a reused injected
  // socket put through connect → disconnect → connect would accumulate a second
  // set of listeners (the latent double-bind class fixed in the Pusher adapter).
  let boundHandlers: {
    open: (event: unknown) => void
    message: (event: unknown) => void
    close: (event: unknown) => void
    error: (event: unknown) => void
  } | null = null
  let myConnectionId: string | null = null
  let intentionalDisconnect = false

  // --------------------------------------------------------------------------
  // Socket construction
  // --------------------------------------------------------------------------

  async function buildSocket(): Promise<PartySocketLike> {
    if (options.socket) return options.socket
    if (options.createSocket) return options.createSocket()

    if (!options.host || !options.room) {
      throw new Error(
        '[realtime:partykit] `host` and `room` are required when no `socket`/`createSocket` is provided',
      )
    }
    // Lazy dynamic import so `partysocket` is only loaded when actually needed
    // (real use), keeping the adapter import-safe in environments where a socket
    // is always injected (tests / non-browser).
    const mod = (await import('partysocket')) as unknown as {
      PartySocket: new (opts: Record<string, unknown>) => PartySocketLike
    }
    const PartySocket = mod.PartySocket
    const query =
      typeof options.query === 'function' ? options.query() : options.query
    return new PartySocket({
      host: options.host,
      room: options.room,
      ...(options.party !== undefined ? { party: options.party } : {}),
      ...(query !== undefined ? { query } : {}),
      ...(options.partySocketOptions ?? {}),
    })
  }

  // --------------------------------------------------------------------------
  // Send helper
  // --------------------------------------------------------------------------

  function send(envelope: ClientEnvelope): void {
    socket?.send(JSON.stringify(envelope))
  }

  // --------------------------------------------------------------------------
  // Inbound routing (ONE message handler; routed by `channel`)
  // --------------------------------------------------------------------------

  function dispatchMessage(channel: string, data: unknown): void {
    const listeners = subscriptions.get(channel)
    if (!listeners || listeners.size === 0) return
    const result = pipeline.runBeforeDeliver(channel, data)
    if (result === false) return
    for (const cb of listeners) cb(result.data)
  }

  function dispatchPresence(
    channel: string,
    members: ReadonlyArray<PresenceMember>,
  ): void {
    const listeners = presenceListeners.get(channel)
    if (!listeners || listeners.size === 0) return
    const users: Array<PresenceUser> = []
    for (const m of members) {
      // Exclude self — the DO tags our own connection with the id we learned
      // from the `connected` envelope.
      if (m.connectionId === myConnectionId) continue
      users.push({ connectionId: m.connectionId, data: m.data })
    }
    for (const cb of listeners) cb(users)
  }

  function handleEnvelope(envelope: ServerEnvelope): void {
    switch (envelope.type) {
      case 'connected':
        myConnectionId = envelope.connectionId
        break
      case 'message':
        dispatchMessage(envelope.channel, envelope.data)
        break
      case 'subscribe:error':
        for (const cb of subscribeErrorListeners) {
          cb(envelope.channel, envelope.reason, envelope.code)
        }
        break
      case 'presence':
        dispatchPresence(envelope.channel, envelope.members)
        break
    }
  }

  function handleRaw(raw: unknown): void {
    if (typeof raw !== 'string') return
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return
    }
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as { type?: unknown }).type === 'string'
    ) {
      handleEnvelope(parsed as ServerEnvelope)
    }
  }

  // --------------------------------------------------------------------------
  // (Re)subscribe everything — runs on every `open` (initial + reconnect).
  // --------------------------------------------------------------------------

  function resubscribeAll(): void {
    for (const [channel, listeners] of subscriptions) {
      if (listeners.size > 0) send({ type: 'subscribe', channel })
    }
    // Re-assert presence membership — the previous connection's membership was
    // dropped by the DO when the old socket closed.
    for (const [channel, data] of presenceIntent) {
      send({ type: 'presence:join', channel, data })
    }
  }

  // --------------------------------------------------------------------------
  // Listener binding — bound ONCE per socket instance (no per-reconnect rebind)
  // --------------------------------------------------------------------------

  function bindSocket(s: PartySocketLike): void {
    if (listenersBound) return
    listenersBound = true

    const onOpen = () => {
      myConnectionId = null
      store.setState(() => 'connected')
      // Re-subscribe in the SAME turn the connection becomes usable so a
      // freshly-arriving message isn't dropped between connect and resubscribe.
      resubscribeAll()
    }

    const onMessage = (event: unknown) => {
      const data = (event as { data?: unknown }).data
      handleRaw(data)
    }

    const onClose = () => {
      store.setState(() =>
        intentionalDisconnect ? 'disconnected' : 'reconnecting',
      )
    }

    const onError = () => {
      // PartySocket reconnects internally; `close`/`open` drive status.
    }

    boundHandlers = {
      open: onOpen,
      message: onMessage,
      close: onClose,
      error: onError,
    }

    s.addEventListener('open', onOpen)
    s.addEventListener('message', onMessage)
    s.addEventListener('close', onClose)
    s.addEventListener('error', onError)
  }

  // Detach the handlers bound by `bindSocket` from the given socket. Idempotent.
  // Keeping the bind-once invariant requires removing the OLD listeners before a
  // fresh bind, otherwise a reused (injected) socket would accumulate duplicates.
  function unbindSocket(s: PartySocketLike | null): void {
    if (s && boundHandlers && s.removeEventListener) {
      s.removeEventListener('open', boundHandlers.open)
      s.removeEventListener('message', boundHandlers.message)
      s.removeEventListener('close', boundHandlers.close)
      s.removeEventListener('error', boundHandlers.error)
    }
    boundHandlers = null
    listenersBound = false
  }

  function awaitConnection(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const sub = store.subscribe(() => {
        const status = store.get()
        if (status === 'connected') {
          sub.unsubscribe()
          resolve()
        } else if (status === 'disconnected') {
          sub.unsubscribe()
          reject(new Error('[realtime:partykit] Connection failed'))
        }
      })
    })
  }

  // --------------------------------------------------------------------------
  // Transport interface
  // --------------------------------------------------------------------------

  const transport: RealtimeTransport & PresenceCapable = {
    store,

    // Honest capability declaration — verified by partykitConformance.test.ts.
    //
    //  - presence: true — the Durable Object holds connection membership;
    //    implemented via the presence envelopes + `{type:'presence'}` pushes.
    //  - serverAssistedRecovery: FALSE — PartySocket is a reconnecting WS with
    //    no built-in offset/epoch gap replay. We re-subscribe intent on
    //    reconnect but the room replays nothing missed. Do not over-claim.
    //  - history: false — no on-demand server-side history retrieval API.
    //  - ephemeral: true — fire-and-forget pub/sub is the baseline.
    capabilities: {
      presence: true,
      serverAssistedRecovery: false,
      history: false,
      ephemeral: true,
    },

    async connect() {
      const current = store.get()
      if (current === 'connected') return
      if (current !== 'disconnected') return awaitConnection()

      intentionalDisconnect = false

      if (!socket) {
        // Fresh socket: ensure no handler bookkeeping survives from a prior
        // instance before we bind to this one.
        boundHandlers = null
        listenersBound = false
        socket = await buildSocket()
      }
      bindSocket(socket)

      // Reflect an already-open injected socket immediately.
      if (socket.readyState === 1 /* OPEN */) {
        store.setState(() => 'connected')
        resubscribeAll()
        return
      }

      store.setState(() => 'connecting')
      return awaitConnection()
    },

    disconnect() {
      intentionalDisconnect = true
      myConnectionId = null
      const closing = socket
      closing?.close()
      // Remove our listeners from the socket BEFORE dropping the reference, so a
      // reused injected socket re-entering connect() rebinds from a clean slate
      // (no accumulated, never-removed handlers → no double delivery).
      unbindSocket(closing)
      socket = null
      store.setState(() => 'disconnected')
    },

    subscribe(channel, onMessage) {
      if (!subscriptions.has(channel)) subscriptions.set(channel, new Set())
      const listeners = subscriptions.get(channel)!
      listeners.add(onMessage)

      if (listeners.size === 1 && store.get() === 'connected') {
        send({ type: 'subscribe', channel })
      }

      return () => {
        listeners.delete(onMessage)
        if (listeners.size === 0) {
          subscriptions.delete(channel)
          if (store.get() === 'connected') {
            send({ type: 'unsubscribe', channel })
          }
        }
      }
    },

    publish(channel, data) {
      send({ type: 'publish', channel, data })
      // Fire-and-forget: the kit asserts the promise resolves, not delivery.
      return Promise.resolve()
    },

    joinPresence(channel, data) {
      presenceIntent.set(channel, data)
      if (store.get() === 'connected') {
        send({ type: 'presence:join', channel, data })
      }
    },

    updatePresence(channel, data) {
      presenceIntent.set(channel, data)
      if (store.get() === 'connected') {
        send({ type: 'presence:update', channel, data })
      }
    },

    leavePresence(channel) {
      presenceIntent.delete(channel)
      if (store.get() === 'connected') {
        send({ type: 'presence:leave', channel })
      }
    },

    onPresenceChange(channel, callback) {
      if (!presenceListeners.has(channel)) {
        presenceListeners.set(channel, new Set())
      }
      presenceListeners.get(channel)!.add(callback)

      return () => {
        presenceListeners.get(channel)?.delete(callback)
        if (presenceListeners.get(channel)?.size === 0) {
          presenceListeners.delete(channel)
        }
      }
    },

    onSubscribeError(callback) {
      subscribeErrorListeners.add(callback)
      return () => {
        subscribeErrorListeners.delete(callback)
      }
    },

    hook(registration: HookRegistration): HookHandle {
      return pipeline.register(registration)
    },
  }

  return transport
}
