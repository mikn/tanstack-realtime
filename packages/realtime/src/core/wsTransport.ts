/**
 * WebSocket transport — connects to a `createNodeServer` instance using the
 * built-in TanStack Realtime wire protocol over WebSocket.
 *
 * Uses the native `WebSocket` API available in all modern browsers, Deno, Bun,
 * and Node.js >= 21. For older Node.js versions, pass the `ws` package via the
 * `WebSocket` option.
 *
 * This transport lives in the base `@tanstack/realtime` package because it is
 * browser-safe — no Node.js-specific imports. It works in browser tabs,
 * SharedWorkers, and any environment with a standard `WebSocket` global.
 */

import { Store } from '@tanstack/store'
import type {
  ConnectionStatus,
  PresenceCapable,
  PresenceUser,
  RealtimeTransport,
} from './types.js'

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface WsTransportOptions {
  /**
   * Base WebSocket server URL, e.g. `"ws://localhost:3000"`.
   * The `path` option is appended to form the final URL.
   *
   * Required when running in Node.js. In a browser this can be omitted —
   * the transport derives the URL from `window.location` (using `wss:` over
   * HTTPS and `ws:` over HTTP) so the connection always targets the current
   * page's origin.
   */
  url?: string
  /**
   * WebSocket endpoint path appended to `url` (or the derived origin in a
   * browser). Must match the `path` passed to `createNodeServer`.
   * @default '/_realtime'
   */
  path?: string
  /**
   * Async function that returns an auth token appended to the WebSocket URL
   * as `?token=<value>`. Called once per connection attempt so short-lived
   * tokens (e.g. JWTs) are refreshed on every reconnect.
   *
   * @example
   * getToken: () => fetch('/api/realtime-token').then((r) => r.text())
   */
  getToken?: () => string | Promise<string>
  /** Reconnection: initial back-off delay in ms. @default 1000 */
  initialDelay?: number
  /** Reconnection: maximum back-off delay in ms. @default 30000 */
  maxDelay?: number
  /** Reconnection: jitter factor applied to each delay, between 0 and 1. @default 0.25 */
  jitter?: number
  /**
   * WebSocket constructor to use. Defaults to the global `WebSocket`.
   * Useful in Node.js environments that lack a native WebSocket global
   * (Node < 21) — pass the `WebSocket` class from the `ws` package.
   *
   * @example
   * import { WebSocket } from 'ws'
   * wsTransport({ url: 'ws://localhost:3001', WebSocket })
   */
  WebSocket?: typeof globalThis.WebSocket
}

// ---------------------------------------------------------------------------
// Incoming message types (server → client)
// ---------------------------------------------------------------------------

type ServerMsg =
  | { type: 'connected'; connectionId: string }
  | { type: 'subscribe:ok'; channel: string }
  | { type: 'subscribe:error'; channel: string; code: number; reason: string }
  | { type: 'message'; channel: string; data: unknown }
  | {
      type: 'presence:update'
      channel: string
      users: ReadonlyArray<PresenceUser>
    }

// ---------------------------------------------------------------------------
// Transport factory
// ---------------------------------------------------------------------------

/**
 * Creates a `RealtimeTransport` that connects to a `createNodeServer` instance
 * via WebSocket. Handles automatic reconnection with exponential backoff +
 * jitter.
 *
 * Uses the native `WebSocket` API by default. In Node.js < 21 (which lacks a
 * global `WebSocket`), pass the `ws` package via the `WebSocket` option.
 *
 * @example
 * // Browser — uses native WebSocket
 * import { wsTransport, createRealtimeClient } from '@tanstack/realtime'
 *
 * const client = createRealtimeClient({
 *   transport: wsTransport({ url: 'ws://localhost:3001' }),
 * })
 *
 * @example
 * // Node.js < 21 — pass the ws package
 * import { WebSocket } from 'ws'
 * import { wsTransport, createRealtimeClient } from '@tanstack/realtime'
 *
 * const client = createRealtimeClient({
 *   transport: wsTransport({ url: 'ws://localhost:3001', WebSocket }),
 * })
 */
export function wsTransport(
  options: WsTransportOptions = {},
): RealtimeTransport & PresenceCapable {
  const {
    url,
    path = '/_realtime',
    getToken,
    initialDelay = 1000,
    maxDelay = 30000,
    jitter = 0.25,
  } = options

  // globalThis.WebSocket may be undefined in Node.js < 21 — the type says it's
  // always present, but it isn't.  The runtime guard catches this early.
  const _WS =
    options.WebSocket ??
    (globalThis as { WebSocket?: typeof WebSocket }).WebSocket

  if (!_WS) {
    throw new Error(
      '[realtime] No WebSocket implementation found. ' +
        'In Node.js < 21, pass the `ws` package: wsTransport({ WebSocket }). ' +
        'In browsers and Node.js >= 21, the native WebSocket is used automatically.',
    )
  }

  // Re-assign after the guard so TypeScript narrows the type for closures.
  const WS: typeof WebSocket = _WS

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

  function resolveUrl(token?: string): string {
    let base: string
    if (url) {
      base = url.replace(/\/?$/, '') + path
    } else if (typeof window !== 'undefined') {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      base = `${proto}//${window.location.host}${path}`
    } else {
      throw new Error(
        '[realtime] No WebSocket URL provided. Pass `url` to wsTransport().',
      )
    }
    return token ? `${base}?token=${encodeURIComponent(token)}` : base
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
          `[realtime] Subscribe rejected for "${msg.channel}": ${msg.reason} (${msg.code})`,
        )
        break
      }
      // subscribe:ok — no action needed; channel is live
    }
  }

  async function openSocket() {
    selfConnectionId = null // reset until the server echoes our connectionId
    store.setState(() => 'connecting')

    let token: string | undefined
    if (getToken) {
      try {
        token = await getToken()
      } catch {
        // Token fetch failed; schedule reconnect without updating state.
        if (!intentionalClose) scheduleReconnect()
        return
      }
    }

    if (intentionalClose) return

    const wsUrl = resolveUrl(token)
    const ws = new WS(wsUrl)
    socket = ws

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
        const raw =
          typeof event.data === 'string' ? event.data : String(event.data)
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
      if (!intentionalClose) void openSocket()
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
          reject(new Error('[realtime] Connection failed'))
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
      void openSocket()
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

    publish(channel, data) {
      send({ type: 'publish', channel, data })
      return Promise.resolve()
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
