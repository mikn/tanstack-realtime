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

// ---------------------------------------------------------------------------
// Conventions (documented for server authors)
// ---------------------------------------------------------------------------

/**
 * The single Pusher event name this adapter binds to (and publishes as) for
 * every realtime.js channel.
 *
 * realtime.js channels carry an opaque `data` payload, whereas Pusher is an
 * `(eventName, data)` model. The adapter collapses that to one conventional
 * event name: **servers publishing to Pusher MUST emit `'message'`** for the
 * payload to reach realtime.js subscribers.
 */
export const PUSHER_MESSAGE_EVENT = 'message'

/**
 * The Pusher client-event name used for client→channel publishing.
 *
 * Pusher only permits *client events* (the `client-` prefix) on **private or
 * presence** channels, and only when the app has "client events" enabled. The
 * adapter publishes via `channel.trigger('client-message', data)`.
 */
export const PUSHER_CLIENT_MESSAGE_EVENT = 'client-message'

/**
 * Prefix used to map a realtime.js channel onto a Pusher **presence** channel.
 * Pusher requires presence channels to be named `presence-…`.
 */
export const PUSHER_PRESENCE_PREFIX = 'presence-'

// ---------------------------------------------------------------------------
// Structural ("Like") interfaces — so tests can inject a fake client without
// depending on the concrete `pusher-js` runtime.
// ---------------------------------------------------------------------------

/** Member map as exposed by a Pusher presence channel's `members` object. */
export interface PusherMembersLike {
  /** The calling connection's own member (`{ id, info }`) — used to exclude self. */
  readonly me: { id: string; info?: unknown } | null
  /** Iterate every member; `info` is the member's presence data. */
  each: (cb: (member: { id: string; info?: unknown }) => void) => void
}

/** A subscribed Pusher channel object. */
export interface PusherChannelLike {
  /** Bind an event handler. Pusher events include `'message'` and the
   * presence lifecycle events (`pusher:subscription_succeeded`, etc.). */
  bind: (event: string, handler: (data: unknown) => void) => void
  /** Remove an event handler (or all handlers for an event). */
  unbind: (event: string, handler?: (data: unknown) => void) => void
  /**
   * Trigger a client event. Returns whether the event was sent. Only valid on
   * private/presence channels when client events are enabled.
   */
  trigger: (event: string, data: unknown) => boolean
  /** Present on presence channels — the current member list. */
  members?: PusherMembersLike
}

/** The Pusher connection object (state + lifecycle events). */
export interface PusherConnectionLike {
  /** Current connection state (`'connected'`, `'disconnected'`, …). */
  state: string
  /** Bind a connection-level event (`'state_change'`, `'connected'`, …). */
  bind: (event: string, handler: (data: unknown) => void) => void
}

/**
 * Minimal structural type describing the parts of the `pusher-js` `Pusher`
 * instance this adapter relies on. Depending on this (rather than the concrete
 * class) keeps the adapter offline-testable: the conformance kit injects a
 * synchronous fake that satisfies the same shape.
 */
export interface PusherLike {
  connection: PusherConnectionLike
  subscribe: (channel: string) => PusherChannelLike
  unsubscribe: (channel: string) => void
  /** Look up an already-subscribed channel, if any. */
  channel?: (channel: string) => PusherChannelLike | undefined
  connect: () => void
  disconnect: () => void
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface PusherTransportOptions {
  /**
   * Pusher app key. Required for real use (ignored when an explicit `pusher`
   * client / `createClient` is injected).
   */
  key?: string
  /** Pusher cluster (e.g. `'eu'`). For Soketi, set `wsHost`/`wsPort` instead. */
  cluster?: string
  /**
   * Endpoint that authorizes private/presence channel subscriptions.
   * Required for presence and for client-event publishing.
   */
  authEndpoint?: string
  /** Soketi / custom host (self-hosted, Pusher-protocol-compatible). */
  wsHost?: string
  /** Soketi / custom port. */
  wsPort?: number
  /** Use TLS for the WebSocket connection. @default true */
  forceTLS?: boolean
  /**
   * Extra options forwarded verbatim to the `pusher-js` constructor
   * (e.g. `authorizer`, `auth`, `channelAuthorization`). Merged last.
   */
  pusherOptions?: Record<string, unknown>
  /**
   * Pre-built Pusher client (or anything matching {@link PusherLike}).
   * Primarily an injection point for tests, but also useful when you already
   * own a `pusher-js` instance. When supplied, connection config is ignored.
   */
  pusher?: PusherLike
  /**
   * Factory that builds a {@link PusherLike} client. Called once on the first
   * `connect()`. Lets callers (and tests) construct the client lazily.
   * Takes precedence over `pusher`'s eager value only if `pusher` is absent.
   */
  createClient?: () => PusherLike
}

// ---------------------------------------------------------------------------
// Transport factory
// ---------------------------------------------------------------------------

/**
 * Creates a `RealtimeTransport` backed by **Pusher Channels** (the hosted SaaS)
 * or a **self-hosted Soketi** server (wire-compatible — use the same adapter
 * and point `wsHost`/`wsPort` at Soketi).
 *
 * ## Channel mapping
 * A realtime.js channel string maps 1:1 to a Pusher channel of the same name.
 * realtime.js messages are opaque `data`; Pusher is `(event, data)`. The
 * adapter binds to a single conventional event — {@link PUSHER_MESSAGE_EVENT}
 * (`'message'`) — on subscribe. **Servers publishing to Pusher must emit the
 * `'message'` event** for payloads to reach subscribers.
 *
 * ## Publish (client events — a real Pusher constraint)
 * `publish(channel, data)` sends a Pusher **client event**
 * (`client-message`, see {@link PUSHER_CLIENT_MESSAGE_EVENT}) via
 * `channel.trigger(...)`. Pusher only allows client events on **private or
 * presence** channels (and only when "client events" is enabled for the app).
 * On a plain public channel `trigger` is a no-op at the broker — public-channel
 * fan-out is therefore **server-published** (your serverless endpoint posts to
 * Pusher's HTTP API). `publish` always resolves; it does not assert delivery.
 *
 * ## Presence
 * Presence is mapped onto Pusher **presence channels**. A realtime.js channel
 * `ch` uses the Pusher channel `presence-ch` (see
 * {@link PUSHER_PRESENCE_PREFIX}). `onPresenceChange` reports the **other**
 * members (self is excluded via the presence channel's `members.me`). Presence
 * channels require auth — configure `authEndpoint` (or an `authorizer` via
 * `pusherOptions`).
 *
 * ## Recovery
 * Pusher has no offset/epoch gap replay: delivery is at-most-once across
 * disconnects, so `serverAssistedRecovery` is **false**. The adapter does track
 * subscription *intent* and re-subscribes its active channels on reconnect.
 *
 * @example
 * import { pusherTransport } from '@realtimejs/adapter-pusher'
 * import { createRealtimeClient } from '@realtimejs/core'
 *
 * export const realtimeClient = createRealtimeClient({
 *   transport: pusherTransport({
 *     key: 'app-key',
 *     cluster: 'eu',
 *     authEndpoint: '/api/pusher/auth',
 *   }),
 * })
 */
export function pusherTransport(
  options: PusherTransportOptions,
): RealtimeTransport & PresenceCapable {
  const pipeline = createHookPipeline()
  const store = new Store<ConnectionStatus>('disconnected')

  // channel → Set of message callbacks (data channels only)
  const subscriptions = new Map<string, Set<(data: unknown) => void>>()

  // channel → the live Pusher channel object (for trigger/unbind)
  const channelObjects = new Map<string, PusherChannelLike>()

  // realtime.js channel → Set of presence callbacks (keyed by the DATA channel)
  const presenceListeners = new Map<
    string,
    Set<(users: ReadonlyArray<PresenceUser>) => void>
  >()

  // realtime.js channels we have presence intent on (need a presence- sub)
  const presenceIntent = new Set<string>()

  const subscribeErrorListeners = new Set<
    (channel: string, reason: string, code?: number) => void
  >()

  let client: PusherLike | null = null
  let intentionalDisconnect = false

  // --------------------------------------------------------------------------
  // Client construction
  // --------------------------------------------------------------------------

  async function buildClient(): Promise<PusherLike> {
    if (options.pusher) return options.pusher
    if (options.createClient) return options.createClient()

    if (!options.key) {
      throw new Error(
        '[realtime:pusher] `key` is required when no `pusher`/`createClient` is provided',
      )
    }
    // Lazy dynamic import so `pusher-js` is only loaded when actually needed
    // (real use), keeping the adapter import-safe in environments where a
    // client is always injected (tests / non-browser).
    const mod = (await import('pusher-js')) as unknown as {
      default: new (key: string, opts: Record<string, unknown>) => PusherLike
    }
    const Pusher = mod.default
    const ctorOptions: Record<string, unknown> = {
      ...(options.cluster !== undefined ? { cluster: options.cluster } : {}),
      ...(options.authEndpoint !== undefined
        ? { authEndpoint: options.authEndpoint }
        : {}),
      ...(options.wsHost !== undefined ? { wsHost: options.wsHost } : {}),
      ...(options.wsPort !== undefined ? { wsPort: options.wsPort } : {}),
      forceTLS: options.forceTLS ?? true,
      ...(options.pusherOptions ?? {}),
    }
    return new Pusher(options.key, ctorOptions)
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  function presenceChannelName(channel: string): string {
    return `${PUSHER_PRESENCE_PREFIX}${channel}`
  }

  function deliverMessage(channel: string, data: unknown): void {
    const listeners = subscriptions.get(channel)
    if (!listeners || listeners.size === 0) return
    const result = pipeline.runBeforeDeliver(channel, data)
    if (result === false) return
    for (const cb of listeners) cb(result.data)
  }

  function dispatchPresence(channel: string): void {
    const listeners = presenceListeners.get(channel)
    if (!listeners || listeners.size === 0) return
    const presenceCh = channelObjects.get(presenceChannelName(channel))
    const members = presenceCh?.members
    const myId = members?.me?.id ?? null
    const users: Array<PresenceUser> = []
    members?.each((m) => {
      if (m.id !== myId) users.push({ connectionId: m.id, data: m.info })
    })
    for (const cb of listeners) cb(users)
  }

  // --------------------------------------------------------------------------
  // Pusher channel wiring
  // --------------------------------------------------------------------------

  function bindDataChannel(channel: string, ch: PusherChannelLike): void {
    // Idempotent binding: real pusher-js REUSES channel objects across
    // reconnects (it never deletes them, only marks them unsubscribed and
    // re-subscribes on reconnect). Since resubscribeAll() re-runs this on every
    // reconnect, we must unbind OUR previously-registered handlers first or we
    // accumulate a duplicate 'message' handler per reconnect — fanning a single
    // inbound message out to the realtime.js subscriber N+1 times after N
    // reconnects. unbind(event) with no callback removes all handlers for that
    // event (the adapter owns these specific events).
    ch.unbind(PUSHER_MESSAGE_EVENT)
    ch.unbind('pusher:subscription_error')
    ch.bind(PUSHER_MESSAGE_EVENT, (data) => deliverMessage(channel, data))
    ch.bind('pusher:subscription_error', (raw) => {
      const { reason, code } = parseSubscriptionError(raw)
      for (const cb of subscribeErrorListeners) cb(channel, reason, code)
    })
  }

  function bindPresenceChannel(channel: string, ch: PusherChannelLike): void {
    // Idempotent binding — see bindDataChannel. Against a reused presence
    // channel object, re-binding without unbinding first would multiply every
    // presence callback per reconnect.
    ch.unbind('pusher:subscription_succeeded')
    ch.unbind('pusher:member_added')
    ch.unbind('pusher:member_removed')
    ch.unbind('pusher:subscription_error')
    const refresh = () => dispatchPresence(channel)
    ch.bind('pusher:subscription_succeeded', refresh)
    ch.bind('pusher:member_added', refresh)
    ch.bind('pusher:member_removed', refresh)
    ch.bind('pusher:subscription_error', (raw) => {
      const { reason, code } = parseSubscriptionError(raw)
      for (const cb of subscribeErrorListeners)
        cb(presenceChannelName(channel), reason, code)
    })
  }

  function parseSubscriptionError(raw: unknown): {
    reason: string
    code?: number
  } {
    if (raw && typeof raw === 'object') {
      const o = raw as { status?: number; error?: string; type?: string }
      const code = typeof o.status === 'number' ? o.status : undefined
      const reason = o.error ?? o.type ?? 'subscription_error'
      return { reason, code }
    }
    return { reason: typeof raw === 'string' ? raw : 'subscription_error' }
  }

  /** (Re)subscribe a single data channel at the provider and bind handlers. */
  function openDataSubscription(channel: string): void {
    if (!client) return
    if (channelObjects.has(channel)) return
    const ch = client.subscribe(channel)
    channelObjects.set(channel, ch)
    bindDataChannel(channel, ch)
  }

  /** (Re)subscribe a single presence channel and bind handlers. */
  function openPresenceSubscription(channel: string): void {
    if (!client) return
    const presenceCh = presenceChannelName(channel)
    if (channelObjects.has(presenceCh)) return
    const ch = client.subscribe(presenceCh)
    channelObjects.set(presenceCh, ch)
    bindPresenceChannel(channel, ch)
  }

  /**
   * Re-establish all subscription intent at the provider. Called on every
   * (re)connect: pusher-js re-subscribes its own channels, but we must rebuild
   * OUR channel-object map + handler bindings (a reconnect yields fresh channel
   * objects) so realtime.js delivery resumes.
   */
  function resubscribeAll(): void {
    if (!client) return
    // Channel objects from the previous connection are stale.
    channelObjects.clear()
    for (const [channel, listeners] of subscriptions) {
      if (listeners.size > 0) openDataSubscription(channel)
    }
    for (const channel of presenceIntent) {
      openPresenceSubscription(channel)
      dispatchPresence(channel)
    }
  }

  function handleStateChange(state: string): void {
    switch (state) {
      case 'connected':
        intentionalDisconnect = false
        store.setState(() => 'connected')
        // Rebuild subscriptions in the same turn the connection becomes usable.
        resubscribeAll()
        break
      case 'connecting':
      case 'initialized':
        store.setState(() => 'connecting')
        break
      case 'unavailable':
        store.setState(() => 'reconnecting')
        break
      case 'disconnected':
      case 'failed':
        store.setState(() =>
          intentionalDisconnect ? 'disconnected' : 'reconnecting',
        )
        break
    }
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
          reject(new Error('[realtime:pusher] Connection failed'))
        }
      })
    })
  }

  // --------------------------------------------------------------------------
  // Transport interface
  // --------------------------------------------------------------------------

  const transport: RealtimeTransport & PresenceCapable = {
    store,

    // Honest capability declaration — verified by pusherConformance.test.ts.
    //
    //  - presence: true — Pusher presence channels expose server-held
    //    membership (`members` + member_added/removed); implemented via the
    //    `presence-`-prefixed channel.
    //  - serverAssistedRecovery: FALSE — Pusher has no offset/epoch gap replay.
    //    Delivery is at-most-once across disconnects; we re-subscribe intent on
    //    reconnect but the broker replays nothing missed. Do not over-claim.
    //  - history: false — Pusher channel history is a separate server-side HTTP
    //    API, not part of this client transport.
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

      if (!client) {
        const c = await buildClient()
        client = c
        c.connection.bind('state_change', (data) => {
          const { current: cur } = data as { current?: string }
          if (typeof cur === 'string') handleStateChange(cur)
        })
      }

      // Reflect an already-connected injected client immediately.
      if (client.connection.state === 'connected') {
        handleStateChange('connected')
        return
      }

      store.setState(() => 'connecting')
      const promise = awaitConnection()
      client.connect()
      return promise
    },

    disconnect() {
      intentionalDisconnect = true
      if (client) {
        for (const ch of subscriptions.keys()) client.unsubscribe(ch)
        for (const channel of presenceIntent) {
          client.unsubscribe(presenceChannelName(channel))
        }
        client.disconnect()
      }
      channelObjects.clear()
      store.setState(() => 'disconnected')
    },

    subscribe(channel, onMessage) {
      if (!subscriptions.has(channel)) subscriptions.set(channel, new Set())
      const listeners = subscriptions.get(channel)!
      listeners.add(onMessage)

      if (listeners.size === 1 && store.get() === 'connected') {
        openDataSubscription(channel)
      }

      return () => {
        listeners.delete(onMessage)
        if (listeners.size === 0) {
          subscriptions.delete(channel)
          const ch = channelObjects.get(channel)
          if (ch) {
            ch.unbind(PUSHER_MESSAGE_EVENT)
            ch.unbind('pusher:subscription_error')
            channelObjects.delete(channel)
          }
          if (client && store.get() === 'connected') {
            client.unsubscribe(channel)
          }
        }
      }
    },

    publish(channel, data) {
      // Pusher client→channel publishing uses client events, only permitted on
      // private/presence channels. trigger() is best-effort; we resolve
      // regardless (the kit asserts the promise resolves, not delivery).
      const ch =
        channelObjects.get(channel) ??
        channelObjects.get(presenceChannelName(channel))
      ch?.trigger(PUSHER_CLIENT_MESSAGE_EVENT, data)
      return Promise.resolve()
    },

    joinPresence(channel, data) {
      presenceIntent.add(channel)
      if (client && store.get() === 'connected') {
        openPresenceSubscription(channel)
      }
      // Pusher presence membership data is supplied by the auth endpoint at
      // subscription time (channel_data), not by a client publish. We still
      // broadcast our join intent as a client event so peers using client
      // events can react; member lists themselves come from Pusher.
      const presenceCh = channelObjects.get(presenceChannelName(channel))
      presenceCh?.trigger(PUSHER_CLIENT_MESSAGE_EVENT, {
        __presence: 'join',
        data,
      })
    },

    updatePresence(channel, data) {
      const presenceCh = channelObjects.get(presenceChannelName(channel))
      presenceCh?.trigger(PUSHER_CLIENT_MESSAGE_EVENT, {
        __presence: 'update',
        data,
      })
    },

    leavePresence(channel) {
      presenceIntent.delete(channel)
      const presenceCh = presenceChannelName(channel)
      const ch = channelObjects.get(presenceCh)
      if (ch) {
        ch.unbind('pusher:subscription_succeeded')
        ch.unbind('pusher:member_added')
        ch.unbind('pusher:member_removed')
        ch.unbind('pusher:subscription_error')
        channelObjects.delete(presenceCh)
      }
      if (client && store.get() === 'connected') {
        client.unsubscribe(presenceCh)
      }
    },

    onPresenceChange(channel, callback) {
      if (!presenceListeners.has(channel)) {
        presenceListeners.set(channel, new Set())
      }
      presenceListeners.get(channel)!.add(callback)

      // Observing presence requires being subscribed to the Pusher presence
      // channel (member lists only flow to subscribers). Register the intent
      // and subscribe now if connected; otherwise resubscribeAll() picks it up
      // on the next (re)connect.
      presenceIntent.add(channel)
      if (client && store.get() === 'connected') {
        openPresenceSubscription(channel)
      }

      // If a presence channel is already live, deliver the current snapshot.
      if (channelObjects.has(presenceChannelName(channel))) {
        dispatchPresence(channel)
      }
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
