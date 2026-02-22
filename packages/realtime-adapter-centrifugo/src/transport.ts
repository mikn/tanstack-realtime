import { Store } from '@tanstack/store'
import type { ConnectionStatus, PresenceCapable, PresenceUser, RealtimeTransport } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface CentrifugoTransportOptions {
  /**
   * Centrifugo WebSocket endpoint URL.
   * @example 'ws://localhost:8000/connection/websocket'
   */
  url: string
  /**
   * JWT token for authentication, or an async function that returns one.
   * Required when the Centrifugo server has token-based auth enabled.
   */
  token?: string | (() => string | Promise<string>)
  /**
   * Arbitrary connection data forwarded to the server in the `connect` command.
   * Centrifugo passes it to the `rpc` handler (if configured).
   */
  data?: Record<string, unknown>
  /**
   * Name prefix for the sidecar presence channel.
   * Each channel `ch` joins presence via `${presencePrefix}ch`.
   * Your Centrifugo namespace for this prefix must allow client publishing.
   * @default '$prs:'
   */
  presencePrefix?: string
  /** Reconnection: initial back-off delay in ms. @default 1000 */
  initialDelay?: number
  /** Reconnection: maximum back-off delay in ms. @default 30000 */
  maxDelay?: number
  /** Reconnection: jitter factor (0–1). @default 0.25 */
  jitter?: number
}

// ---------------------------------------------------------------------------
// Centrifugo v4+ JSON protocol types
// ---------------------------------------------------------------------------

type ConnectCmd = { token?: string; data?: Record<string, unknown> }
type SubscribeCmd = {
  channel: string
  /** Request recovery — send `true` alongside `epoch` and `offset`. */
  recover?: boolean
  /** Recovery position: epoch from the last subscribe reply. */
  epoch?: string
  /** Recovery position: offset of the last message received on this channel. */
  offset?: number
}
type UnsubscribeCmd = { channel: string }
type PublishCmd = { channel: string; data: unknown }

type CentrifugoCommand =
  | { id: number; connect: ConnectCmd }
  | { id: number; subscribe: SubscribeCmd }
  | { id: number; unsubscribe: UnsubscribeCmd }
  | { id: number; publish: PublishCmd }

interface CentrifugoError {
  code: number
  message: string
}

// Server → client: reply to a command (has numeric `id`)
interface CentrifugoReply {
  id: number
  connect?: { client: string; version: string; data?: unknown; subs?: unknown }
  subscribe?: {
    recoverable?: boolean
    epoch?: string
    /** Current stream offset at the time of subscribe. */
    offset?: number
    /** Publications missed since the client's last known position. */
    publications?: Array<{ data: unknown; offset?: number }>
    data?: unknown
  }
  publish?: Record<string, never>
  unsubscribe?: Record<string, never>
  error?: CentrifugoError
}

// Server → client: unsolicited push (no `id`)
interface CentrifugoPush {
  push: {
    channel: string
    pub?: { data: unknown; offset?: number; tags?: Record<string, string> }
    join?: { info: CentrifugoClientInfo }
    leave?: { info: CentrifugoClientInfo }
    unsubscribe?: { resubscribe?: boolean }
    subscribe?: { channel: string; recoverable?: boolean }
    disconnect?: { code: number; reason: string; reconnect?: boolean }
  }
}

interface CentrifugoClientInfo {
  user: string
  client: string
  conn_info?: unknown
  chan_info?: unknown
}

type IncomingMsg = CentrifugoReply | CentrifugoPush

// ---------------------------------------------------------------------------
// Recovery position per channel
// ---------------------------------------------------------------------------

interface RecoveryPosition {
  epoch: string
  offset: number
}

// ---------------------------------------------------------------------------
// Sidecar presence message format
// ---------------------------------------------------------------------------

interface PrsJoin {
  type: 'prs:join'
  clientId: string
  data: unknown
}
interface PrsUpdate {
  type: 'prs:update'
  clientId: string
  data: unknown
}
interface PrsLeave {
  type: 'prs:leave'
  clientId: string
}
type PrsMsg = PrsJoin | PrsUpdate | PrsLeave

// ---------------------------------------------------------------------------
// Transport factory
// ---------------------------------------------------------------------------

/**
 * Creates a `RealtimeTransport` that connects to a Centrifugo server via the
 * Centrifugo v4+ JSON WebSocket protocol.
 *
 * ## Standard channels
 * `subscribe` / `publish` / `unsubscribe` map directly to Centrifugo commands.
 * Your channel namespace configuration controls access control.
 *
 * ## Epoch/offset recovery
 * When a channel is configured as recoverable on the server, the adapter
 * tracks the last seen `epoch` and `offset` per channel. On reconnect, it
 * automatically subscribes with `recover: true` and the stored position,
 * causing Centrifugo to replay only the missed publications — no full
 * re-fetch needed. Recovered publications are dispatched to subscribers in
 * order before the normal live stream resumes.
 *
 * This is more efficient than `refetchOnReconnect: true` when:
 * - The channel is configured with `history_size > 0` and `history_ttl > 0`
 *   in Centrifugo so the server can retain missed messages.
 * - You want to replay exact missed events rather than re-running a REST query.
 *
 * ## Presence
 * Presence is implemented via a **sidecar channel** (`${presencePrefix}{channel}`
 * — default `$prs:{channel}`). When a client calls `joinPresence`, it subscribes
 * to the sidecar channel and broadcasts a `prs:join` message. Other subscribers
 * receive it and update their local presence map. `updatePresence` broadcasts
 * `prs:update`; `leavePresence` broadcasts `prs:leave` then unsubscribes.
 *
 * **Server requirements for presence:**
 * The Centrifugo namespace that matches `presencePrefix` must allow client
 * publishing (e.g. `allow_publish_for_subscriber: true`).
 *
 * @example
 * import { centrifugoTransport } from '@tanstack/realtime-adapter-centrifugo'
 * import { createRealtimeClient } from '@tanstack/realtime'
 *
 * export const realtimeClient = createRealtimeClient({
 *   transport: centrifugoTransport({
 *     url: 'wss://my-centrifugo.example.com/connection/websocket',
 *     token: () => fetchAuthToken(),
 *   }),
 * })
 */
export function centrifugoTransport(
  options: CentrifugoTransportOptions,
): RealtimeTransport & PresenceCapable {
  const {
    url,
    token,
    data: connectData,
    presencePrefix = '$prs:',
    initialDelay = 1000,
    maxDelay = 30000,
    jitter = 0.25,
  } = options

  const store = new Store<ConnectionStatus>('disconnected')

  // channel → Set of message callbacks
  const subscriptions = new Map<string, Set<(data: unknown) => void>>()

  // channel → Set of presence callbacks (keyed by the *data* channel, not sidecar)
  const presenceListeners = new Map<
    string,
    Set<(users: ReadonlyArray<PresenceUser>) => void>
  >()

  // channel → Map<clientId, data> (maintained client-side for sidecar presence)
  const presenceState = new Map<string, Map<string, unknown>>()

  // channel → last known recovery position (epoch + offset)
  // Populated from subscribe replies and updated as publications arrive.
  const channelRecovery = new Map<string, RecoveryPosition>()

  // commandId → channel: maps in-flight subscribe commands to their channel
  // so handleReply can find the channel when the reply arrives.
  const cmdChannels = new Map<number, string>()

  let socket: WebSocket | null = null
  let cmdId = 0
  let centrifugoClientId: string | null = null // assigned on connect reply
  let reconnectAttempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let intentionalClose = false

  // Pending command resolve/reject pairs, keyed by command id
  const pending = new Map<
    number,
    { resolve: (val: unknown) => void; reject: (err: Error) => void }
  >()

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  function nextId(): number {
    return ++cmdId
  }

  function send(cmd: CentrifugoCommand): void {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(cmd))
    }
  }

  function sendCmd<T = unknown>(cmd: CentrifugoCommand): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      pending.set((cmd as { id: number }).id, {
        resolve: resolve as (v: unknown) => void,
        reject,
      })
      send(cmd)
    })
  }

  function presenceChannel(channel: string): string {
    return `${presencePrefix}${channel}`
  }

  // --------------------------------------------------------------------------
  // Presence helpers
  // --------------------------------------------------------------------------

  function dispatchPresence(channel: string): void {
    const listeners = presenceListeners.get(channel)
    if (!listeners || listeners.size === 0) return
    const stateMap = presenceState.get(channel) ?? new Map<string, unknown>()
    const myClientId = centrifugoClientId
    const users: Array<PresenceUser> = []
    for (const [cid, d] of stateMap) {
      // Exclude self from the presence list
      if (cid !== myClientId) {
        users.push({ connectionId: cid, data: d })
      }
    }
    for (const cb of listeners) cb(users)
  }

  function handlePresenceMsg(channel: string, msg: PrsMsg): void {
    let map = presenceState.get(channel)
    if (!map) {
      map = new Map()
      presenceState.set(channel, map)
    }
    switch (msg.type) {
      case 'prs:join':
        map.set(msg.clientId, msg.data)
        break
      case 'prs:update': {
        const existing = map.get(msg.clientId) ?? {}
        map.set(msg.clientId, { ...(existing as object), ...(msg.data as object) })
        break
      }
      case 'prs:leave':
        map.delete(msg.clientId)
        break
    }
    dispatchPresence(channel)
  }

  function isPrsMsg(data: unknown): data is PrsMsg {
    return (
      typeof data === 'object' &&
      data !== null &&
      'type' in data &&
      typeof (data as { type: unknown }).type === 'string' &&
      ['prs:join', 'prs:update', 'prs:leave'].includes(
        (data as { type: string }).type,
      )
    )
  }

  // --------------------------------------------------------------------------
  // Message dispatch
  // --------------------------------------------------------------------------

  function handlePush(push: CentrifugoPush['push']): void {
    const { channel } = push

    if (push.pub !== undefined) {
      const data = push.pub.data

      // Update the recovery offset for this channel as live publications arrive.
      // Only track data channels (not presence sidecars) and only when we have
      // a recovery position (i.e. the channel is marked recoverable by the server).
      if (!channel.startsWith(presencePrefix) && push.pub.offset !== undefined) {
        const existing = channelRecovery.get(channel)
        if (existing) {
          channelRecovery.set(channel, {
            epoch: existing.epoch,
            offset: push.pub.offset,
          })
        }
      }

      // Check if this is a sidecar presence channel message
      if (channel.startsWith(presencePrefix)) {
        const dataChannel = channel.slice(presencePrefix.length)
        if (isPrsMsg(data)) {
          handlePresenceMsg(dataChannel, data)
          return
        }
      }

      // Regular publication — dispatch to data subscribers
      const listeners = subscriptions.get(channel)
      if (listeners) {
        for (const cb of listeners) cb(data)
      }
    }
  }

  function dispatchPublications(
    channel: string,
    publications: Array<{ data: unknown; offset?: number }>,
  ): void {
    const listeners = subscriptions.get(channel)
    if (!listeners || listeners.size === 0) return
    for (const pub of publications) {
      for (const cb of listeners) cb(pub.data)
    }
  }

  function handleReply(reply: CentrifugoReply): void {
    const p = pending.get(reply.id)
    if (!p) return
    pending.delete(reply.id)

    if (reply.error) {
      cmdChannels.delete(reply.id)
      p.reject(
        new Error(
          `[realtime:centrifugo] Command ${reply.id} error ${reply.error.code}: ${reply.error.message}`,
        ),
      )
      return
    }

    if (reply.connect) {
      centrifugoClientId = reply.connect.client
    }

    // Process subscribe replies — update recovery state and dispatch missed pubs.
    if (reply.subscribe) {
      const sub = reply.subscribe
      const channel = cmdChannels.get(reply.id)
      cmdChannels.delete(reply.id)

      if (channel && !channel.startsWith(presencePrefix)) {
        // Update recovery position if the channel is recoverable.
        if (sub.recoverable && sub.epoch !== undefined) {
          // The offset to store is the last offset among the recovered
          // publications (if any), otherwise the channel's current offset.
          const lastPub =
            sub.publications?.length
              ? sub.publications[sub.publications.length - 1]
              : undefined
          const storedOffset =
            lastPub?.offset ?? sub.offset ?? 0

          channelRecovery.set(channel, {
            epoch: sub.epoch,
            offset: storedOffset,
          })
        }

        // Dispatch any missed publications received during recovery.
        if (sub.publications?.length) {
          dispatchPublications(channel, sub.publications)
        }
      }
    }

    p.resolve(reply)
  }

  function handleMessage(raw: string): void {
    // Centrifugo v6 may batch multiple JSON objects in a single WebSocket frame
    // using newline-delimited JSON (NDJSON). For example, when the publishing
    // client is also subscribed to the channel, Centrifugo sends the push
    // notification and the publish reply together:
    //   {"push":{"channel":"ch","pub":{...}}}\n{"id":3,"publish":{}}
    // Older behaviour (single object or a JSON array) is also supported.
    const lines = raw.split('\n')
    for (const line of lines) {
      if (!line.trim()) continue
      let msgs: Array<IncomingMsg>
      try {
        const parsed: unknown = JSON.parse(line)
        // Centrifugo may also batch replies as a JSON array
        msgs = Array.isArray(parsed)
          ? (parsed as Array<IncomingMsg>)
          : [parsed as IncomingMsg]
      } catch {
        continue
      }
      for (const msg of msgs) {
        if ('push' in msg) {
          handlePush(msg.push)
        } else if ('id' in msg) {
          handleReply(msg)
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // Reconnection
  // --------------------------------------------------------------------------

  async function resubscribeAll(): Promise<void> {
    for (const [channel, listeners] of subscriptions) {
      if (listeners.size === 0) continue

      const recovery = channelRecovery.get(channel)
      const id = nextId()

      if (recovery) {
        // Attempt server-assisted recovery: send our last known epoch/offset
        // so Centrifugo can replay only the missed publications.
        cmdChannels.set(id, channel)
        // Use sendCmd so we can process the reply (recovered publications).
        void sendCmd({ id, subscribe: { channel, recover: true, ...recovery } }).catch(
          () => {
            // Recovery failed (e.g. TTL expired) — fall back to a plain subscribe
            // and discard the stored position so the next reconnect doesn't retry.
            channelRecovery.delete(channel)
          },
        )
      } else {
        // Plain subscribe — server will replay nothing (normal behaviour).
        cmdChannels.set(id, channel)
        send({ id, subscribe: { channel } })
      }
    }
  }

  function scheduleReconnect(): void {
    if (reconnectTimer) return
    reconnectAttempt++
    const base = Math.min(initialDelay * 2 ** (reconnectAttempt - 1), maxDelay)
    const delay = base * (1 + jitter * (Math.random() * 2 - 1))
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      if (!intentionalClose) void openSocket()
    }, delay)
  }

  // --------------------------------------------------------------------------
  // Socket lifecycle
  // --------------------------------------------------------------------------

  async function openSocket(): Promise<void> {
    centrifugoClientId = null
    const ws = new WebSocket(url)
    socket = ws

    store.setState(() => 'connecting')

    ws.addEventListener('open', () => {
      void (async () => {
        try {
          const connectCmd: CentrifugoCommand = {
            id: nextId(),
            connect: {
              ...(token !== undefined
                ? {
                    token:
                      typeof token === 'function' ? await token() : token,
                  }
                : {}),
              ...(connectData ? { data: connectData } : {}),
            },
          }
          await sendCmd(connectCmd)
          reconnectAttempt = 0
          store.setState(() => 'connected')
          await resubscribeAll()
        } catch {
          // connect command failed; close will fire and trigger reconnect
          ws.close()
        }
      })()
    })

    ws.addEventListener('close', () => {
      socket = null
      // Reject any pending commands so callers don't hang forever
      for (const [, p] of pending) {
        p.reject(new Error('[realtime:centrifugo] WebSocket closed'))
      }
      pending.clear()
      cmdChannels.clear()

      if (intentionalClose) {
        store.setState(() => 'disconnected')
        return
      }
      store.setState(() => 'reconnecting')
      scheduleReconnect()
    })

    ws.addEventListener('error', () => {
      // 'close' always fires after 'error'; reconnect lives there.
    })

    ws.addEventListener('message', (event) => {
      const raw =
        typeof event.data === 'string' ? event.data : String(event.data)
      handleMessage(raw)
    })
  }

  function awaitConnection(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const sub = store.subscribe((status) => {
        if (status === 'connected') {
          sub.unsubscribe()
          resolve()
        } else if (status === 'disconnected') {
          sub.unsubscribe()
          reject(new Error('[realtime:centrifugo] Connection failed'))
        }
      })
    })
  }

  // --------------------------------------------------------------------------
  // Transport interface
  // --------------------------------------------------------------------------

  const transport: RealtimeTransport & PresenceCapable = {
    store,

    async connect() {
      const current = store.state

      if (current === 'connected') return
      if (current !== 'disconnected') return awaitConnection()

      intentionalClose = false
      void openSocket()
      return awaitConnection()
    },

    disconnect() {
      intentionalClose = true
      centrifugoClientId = null
      channelRecovery.clear()
      cmdChannels.clear()

      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      socket?.close()
      socket = null
      store.setState(() => 'disconnected')
    },

    subscribe(channel, onMessage) {
      if (!subscriptions.has(channel)) {
        subscriptions.set(channel, new Set())
      }
      const listeners = subscriptions.get(channel)!
      listeners.add(onMessage)

      // Send subscribe when the first listener registers and we're connected.
      if (listeners.size === 1 && store.state === 'connected') {
        const id = nextId()
        cmdChannels.set(id, channel)
        send({ id, subscribe: { channel } })
      }

      return () => {
        listeners.delete(onMessage)
        if (listeners.size === 0) {
          subscriptions.delete(channel)
          // Clear any stored recovery position — the channel is no longer
          // actively subscribed, so recovery data is stale.
          channelRecovery.delete(channel)
          if (store.state === 'connected') {
            const id = nextId()
            send({ id, unsubscribe: { channel } })
          }
        }
      }
    },

    async publish(channel, data) {
      const id = nextId()
      await sendCmd<unknown>({ id, publish: { channel, data } })
    },

    joinPresence(channel, data) {
      const prs = presenceChannel(channel)

      // Subscribe to the sidecar channel so we receive presence messages from others.
      if (!subscriptions.has(prs)) {
        subscriptions.set(prs, new Set())
      }
      // We don't add a listener here — publications to the sidecar are handled
      // inside handlePush which dispatches to presenceListeners, not subscriptions.
      if (store.state === 'connected') {
        const id = nextId()
        send({ id, subscribe: { channel: prs } })
      }

      // Broadcast our join data to the presence channel.
      const clientId = centrifugoClientId ?? `local-${Math.random().toString(36).slice(2)}`
      // fire-and-forget; suppress unhandled rejection if socket closes before reply
      void this.publish(prs, { type: 'prs:join', clientId, data } satisfies PrsJoin).catch(() => {})
    },

    updatePresence(channel, data) {
      const prs = presenceChannel(channel)
      const clientId = centrifugoClientId ?? ''
      void this.publish(prs, { type: 'prs:update', clientId, data } satisfies PrsUpdate).catch(() => {})
    },

    leavePresence(channel) {
      const prs = presenceChannel(channel)
      const clientId = centrifugoClientId ?? ''

      void this.publish(prs, { type: 'prs:leave', clientId } satisfies PrsLeave).catch(() => {})

      // Clean up sidecar subscription
      if (subscriptions.has(prs)) {
        subscriptions.delete(prs)
        if (store.state === 'connected') {
          const id = nextId()
          send({ id, unsubscribe: { channel: prs } })
        }
      }

      // Clean up local presence state
      presenceState.delete(channel)
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
  }

  return transport
}
