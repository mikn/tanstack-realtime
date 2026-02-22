import { WebSocket as NodeWebSocket } from 'ws'
import { Store } from '@tanstack/store'
import type { ConnectionStatus, PresenceCapable, PresenceUser, RealtimeTransport } from '@tanstack/realtime'

// Use the native WebSocket when running in a browser, or the `ws` package in Node.js.
const WS: typeof WebSocket =
  (globalThis as unknown as { WebSocket?: typeof WebSocket }).WebSocket ??
  (NodeWebSocket as unknown as typeof WebSocket)

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface NodeTransportOptions {
  /**
   * Base WebSocket server URL, e.g. `"ws://localhost:3000"`.
   * The `path` option is appended to form the final URL.
   *
   * Required when running in Node.js. In a browser this can be omitted —
   * the transport derives the URL from `window.location` (using `wss:` over
   * HTTPS and `ws:` over HTTP) so the connection always targets the current page's origin.
   */
  url?: string
  /**
   * WebSocket endpoint path appended to `url` (or the derived origin in a browser).
   * Must match the `path` passed to `createNodeServer`. Defaults to `/_realtime`.
   */
  path?: string
  /** Reconnection: initial back-off delay in ms. Defaults to `1000`. */
  initialDelay?: number
  /** Reconnection: maximum back-off delay in ms. Defaults to `30000`. */
  maxDelay?: number
  /** Reconnection: jitter factor applied to each delay, between 0 and 1. Defaults to `0.25`. */
  jitter?: number
}

// ---------------------------------------------------------------------------
// Incoming message types (server → client)
// ---------------------------------------------------------------------------

type ServerMsg =
  | { type: 'connected'; connectionId: string }
  | { type: 'subscribe:ok'; channel: string }
  | { type: 'subscribe:error'; channel: string; code: number; reason: string }
  | { type: 'message'; channel: string; data: unknown }
  | { type: 'presence:update'; channel: string; users: ReadonlyArray<PresenceUser> }

// ---------------------------------------------------------------------------
// Transport factory
// ---------------------------------------------------------------------------

/**
 * Creates a `RealtimeTransport` that connects to a `createNodeServer` instance
 * via WebSocket. Handles automatic reconnection with exponential backoff + jitter.
 *
 * Uses the native `WebSocket` API in browsers and the `ws` package in Node.js,
 * making it safe to import from both server-side tests and browser bundles.
 *
 * @example
 * import { nodeTransport } from '@tanstack/realtime-preset-node'
 * import { createRealtimeClient } from '@tanstack/realtime'
 *
 * export const realtimeClient = createRealtimeClient({
 *   transport: nodeTransport({ url: 'ws://localhost:3000' }),
 * })
 */
export function nodeTransport(options: NodeTransportOptions = {}): RealtimeTransport & PresenceCapable {
  const {
    url,
    path = '/_realtime',
    initialDelay = 1000,
    maxDelay = 30000,
    jitter = 0.25,
  } = options

  const store = new Store<ConnectionStatus>('disconnected')

  // channel → Set of message callbacks
  const subscriptions = new Map<string, Set<(data: unknown) => void>>()
  // channel → Set of presence callbacks
  const presenceListeners = new Map<
    string,
    Set<(users: ReadonlyArray<PresenceUser>) => void>
  >()

  let socket: WebSocket | null = null
  let reconnectAttempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let intentionalClose = false
  let selfConnectionId: string | null = null

  function resolveUrl(): string {
    if (url) return url.replace(/\/?$/, '') + path
    if (typeof window !== 'undefined') {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${proto}//${window.location.host}${path}`
    }
    throw new Error(
      '[realtime:node] No WebSocket URL provided. Pass `url` to nodeTransport().',
    )
  }

  function send(msg: object) {
    if (socket?.readyState === WS.OPEN) {
      socket.send(JSON.stringify(msg))
    }
  }

  function resubscribeAll() {
    for (const [channel, listeners] of subscriptions) {
      if (listeners.size > 0) {
        send({ type: 'subscribe', channel })
      }
    }
  }

  function handleMessage(msg: ServerMsg) {
    switch (msg.type) {
      case 'connected': {
        selfConnectionId = msg.connectionId
        break
      }
      case 'message': {
        const listeners = subscriptions.get(msg.channel)
        if (listeners) {
          for (const cb of listeners) cb(msg.data)
        }
        break
      }
      case 'presence:update': {
        const listeners = presenceListeners.get(msg.channel)
        if (listeners) {
          // Filter out the current connection so callers receive `others` — not self.
          const others = selfConnectionId
            ? msg.users.filter((u) => u.connectionId !== selfConnectionId)
            : msg.users
          for (const cb of listeners) cb(others)
        }
        break
      }
      case 'subscribe:error': {
        console.warn(
          `[realtime:node] Subscribe rejected for "${msg.channel}": ${msg.reason} (${msg.code})`,
        )
        break
      }
      // subscribe:ok — no action needed; channel is live
    }
  }

  function openSocket() {
    selfConnectionId = null // reset until the server echoes our connectionId
    const wsUrl = resolveUrl()
    const ws = new WS(wsUrl)
    socket = ws

    store.setState(() => 'connecting')

    ws.addEventListener('open', () => {
      reconnectAttempt = 0
      store.setState(() => 'connected')
      resubscribeAll()
    })

    ws.addEventListener('close', () => {
      socket = null
      if (intentionalClose) {
        store.setState(() => 'disconnected')
        return
      }
      store.setState(() => 'reconnecting')
      scheduleReconnect()
    })

    ws.addEventListener('error', () => {
      // 'close' always fires after 'error'; reconnect logic lives there.
    })

    ws.addEventListener('message', (event) => {
      let msg: ServerMsg
      try {
        const raw = typeof event.data === 'string' ? event.data : String(event.data)
        msg = JSON.parse(raw) as ServerMsg
      } catch {
        return
      }
      handleMessage(msg)
    })
  }

  function scheduleReconnect() {
    if (reconnectTimer) return
    reconnectAttempt++
    const base = Math.min(initialDelay * 2 ** (reconnectAttempt - 1), maxDelay)
    const delay = base * (1 + jitter * (Math.random() * 2 - 1))
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      if (!intentionalClose) openSocket()
    }, delay)
  }

  // Returns a Promise that resolves when the store reaches 'connected' or
  // rejects when it reaches 'disconnected'. Used by connect() to avoid
  // duplicating the same settlement logic in two code paths.
  function awaitConnection(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const sub = store.subscribe((status) => {
        if (status === 'connected') {
          sub.unsubscribe()
          resolve()
        } else if (status === 'disconnected') {
          sub.unsubscribe()
          reject(new Error('[realtime:node] Connection failed'))
        }
      })
    })
  }

  const transport: RealtimeTransport & PresenceCapable = {
    store,

    async connect() {
      const current = store.get()

      // If already connected, resolve immediately.
      if (current === 'connected') return

      // If a reconnect cycle is in progress (connecting or waiting to retry),
      // return a Promise that settles once the connection is established or
      // intentionally closed — without starting a redundant socket open.
      if (current !== 'disconnected') return awaitConnection()

      intentionalClose = false
      openSocket()
      return awaitConnection()
    },

    disconnect() {
      intentionalClose = true
      selfConnectionId = null
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

      // Send subscribe if this is the first listener and we're connected.
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

    async publish(channel, data) {
      send({ type: 'publish', channel, data })
    },

    joinPresence(channel, data) {
      send({ type: 'presence:join', channel, data })
    },

    updatePresence(channel, data) {
      send({ type: 'presence:update', channel, data })
    },

    leavePresence(channel) {
      send({ type: 'presence:leave', channel })
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
