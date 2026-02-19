import type {
  ConnectionStatus,
  QueryKey,
  StatusListener,
  InvalidateListener,
  PresenceListener,
  PresenceClientEvent,
  ServerMessage,
  ClientMessage,
} from './types.js'

export interface RealtimeClientOptions {
  /**
   * WebSocket URL to connect to.
   * Defaults to the same origin with `/_realtime` path when running in a
   * browser. Must be provided explicitly in non-browser environments.
   */
  url?: string
  /** Reconnection back-off settings. */
  reconnect?: {
    /** Initial delay in ms. Default: 1000 */
    initialDelay?: number
    /** Maximum delay in ms. Default: 30000 */
    maxDelay?: number
    /**
     * Jitter factor applied to each delay as a multiplier in `[-jitter, +jitter]`.
     * Default: 0.25
     */
    jitter?: number
  }
  /** Batched invalidation settings applied after a reconnect. */
  refetch?: {
    /** Maximum keys to invalidate per batch. Default: 5 */
    maxConcurrency?: number
    /** Delay between batches in ms. Default: 50 */
    stagger?: number
  }
}

export interface RealtimeClient {
  /** Open the WebSocket connection. Call after auth. */
  connect(): void
  /** Close the WebSocket and clear all pending reconnects. */
  disconnect(): void
  /** Current connection status. Subscribe to changes with `onStatus`. */
  readonly status: ConnectionStatus

  /** Send a subscribe message for a serialized query key. */
  subscribe(serializedKey: string): void
  /** Send an unsubscribe message for a serialized query key. */
  unsubscribe(serializedKey: string): void

  /** Join a presence channel with initial data. */
  presenceJoin(serializedKey: string, data: unknown): void
  /** Send a partial update to a presence channel. */
  presenceUpdate(serializedKey: string, data: unknown): void
  /** Leave a presence channel. */
  presenceLeave(serializedKey: string): void

  /** Register a status-change listener. Returns an unsubscribe function. */
  onStatus(listener: StatusListener): () => void
  /** Register an invalidation listener. Returns an unsubscribe function. */
  onInvalidate(listener: InvalidateListener): () => void
  /** Register a presence listener. Returns an unsubscribe function. */
  onPresence(listener: PresenceListener): () => void

  /** Disconnect and remove all listeners. */
  destroy(): void
}

function resolveUrl(url?: string): string {
  if (url) return url
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/_realtime`
  }
  throw new Error(
    '[realtime] No WebSocket URL provided and no browser environment detected. ' +
      'Pass `url` explicitly to createRealtimeClient.',
  )
}

export function createRealtimeClient(
  options: RealtimeClientOptions = {},
): RealtimeClient {
  const url = resolveUrl(options.url)
  const reconnectOpts = {
    initialDelay: options.reconnect?.initialDelay ?? 1000,
    maxDelay: options.reconnect?.maxDelay ?? 30_000,
    jitter: options.reconnect?.jitter ?? 0.25,
  }
  const refetchOpts = {
    maxConcurrency: options.refetch?.maxConcurrency ?? 5,
    stagger: options.refetch?.stagger ?? 50,
  }

  let status: ConnectionStatus = 'disconnected'
  let ws: WebSocket | null = null
  let reconnectAttempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let explicitDisconnect = false

  // Active subscriptions: serialized keys
  const subscriptions = new Set<string>()
  // Active presence channels: serialized key → full merged data last sent to server
  const presenceChannels = new Map<string, unknown>()

  const statusListeners = new Set<StatusListener>()
  const invalidateListeners = new Set<InvalidateListener>()
  const presenceListeners = new Set<PresenceListener>()

  function setStatus(next: ConnectionStatus) {
    if (status === next) return
    status = next
    for (const l of statusListeners) l(next)
  }

  function send(msg: ClientMessage) {
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(msg))
    }
  }

  function resubscribeAll() {
    for (const key of subscriptions) {
      send({ type: 'subscribe', key })
    }
    for (const [key, data] of presenceChannels) {
      send({ type: 'presence:join', key, data })
    }
  }

  function batchInvalidateAll() {
    const keys = Array.from(subscriptions)
    let i = 0

    function flush() {
      const batch = keys.slice(i, i + refetchOpts.maxConcurrency)
      i += refetchOpts.maxConcurrency
      for (const key of batch) {
        for (const l of invalidateListeners) l(key)
      }
      if (i < keys.length) {
        setTimeout(flush, refetchOpts.stagger)
      }
    }

    // First batch fires immediately; subsequent batches are staggered to
    // avoid a thundering-herd refetch after reconnect.
    if (keys.length > 0) {
      flush()
    }
  }

  function handleMessage(raw: string) {
    let msg: ServerMessage
    try {
      msg = JSON.parse(raw) as ServerMessage
    } catch {
      return
    }

    if (msg.type === 'invalidate') {
      for (const l of invalidateListeners) l(msg.key)
      return
    }

    let event: PresenceClientEvent
    switch (msg.type) {
      case 'presence:join':
        event = { type: 'join', connectionId: msg.connectionId, data: msg.data }
        break
      case 'presence:update':
        event = { type: 'update', connectionId: msg.connectionId, data: msg.data }
        break
      case 'presence:leave':
        event = { type: 'leave', connectionId: msg.connectionId }
        break
      case 'presence:sync':
        event = { type: 'sync', users: msg.users }
        break
      default:
        return
    }

    for (const l of presenceListeners) l(msg.key, event)
  }

  function openSocket() {
    if (ws) return

    setStatus(reconnectAttempt === 0 ? 'connecting' : 'reconnecting')

    const socket = new WebSocket(url)
    ws = socket

    socket.addEventListener('open', () => {
      const wasReconnecting = reconnectAttempt > 0
      reconnectAttempt = 0
      resubscribeAll()
      if (wasReconnecting) {
        // Reconnected after a drop — invalidate all active queries in batches
        // to avoid a thundering-herd refetch.
        batchInvalidateAll()
      }
      setStatus('connected')
    })

    socket.addEventListener('message', (e) => {
      handleMessage(e.data as string)
    })

    socket.addEventListener('close', () => {
      ws = null
      if (explicitDisconnect) {
        setStatus('disconnected')
        return
      }
      scheduleReconnect()
    })

    socket.addEventListener('error', () => {
      // A 'close' event always follows 'error'; let it drive the state transition.
    })
  }

  function scheduleReconnect() {
    if (explicitDisconnect) return
    // Cancel any existing timer so that concurrent calls (e.g. the window
    // focus handler racing with the socket 'close' event) don't leak a timer
    // or double-increment reconnectAttempt.
    cancelReconnect()
    setStatus('reconnecting')
    const delay = Math.min(
      reconnectOpts.initialDelay * Math.pow(2, reconnectAttempt),
      reconnectOpts.maxDelay,
    )
    const jitter = delay * reconnectOpts.jitter * (Math.random() * 2 - 1)
    reconnectAttempt++

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      openSocket()
    }, Math.max(0, delay + jitter))
  }

  function cancelReconnect() {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  let focusHandlerAttached = false

  function handleWindowFocus() {
    // Ignore focus events when we are not in an active / connected state.
    if (status === 'disconnected' || status === 'reconnecting' || status === 'connecting') {
      return
    }
    if (!ws || ws.readyState !== ws.OPEN) {
      scheduleReconnect()
      return
    }
    // Connection is alive — invalidate all active queries since events may
    // have been missed while the tab was in the background.
    batchInvalidateAll()
  }

  function attachFocusHandler() {
    if (focusHandlerAttached || typeof window === 'undefined') return
    focusHandlerAttached = true
    window.addEventListener('focus', handleWindowFocus)
  }

  function detachFocusHandler() {
    if (!focusHandlerAttached || typeof window === 'undefined') return
    window.removeEventListener('focus', handleWindowFocus)
    focusHandlerAttached = false
  }

  // All disconnect logic lives here; methods call this instead of duplicating.
  function disconnectInternal() {
    explicitDisconnect = true
    cancelReconnect()
    detachFocusHandler()
    if (ws) {
      ws.close()
      ws = null
    }
    setStatus('disconnected')
  }

  return {
    get status() {
      return status
    },

    connect() {
      explicitDisconnect = false
      attachFocusHandler()
      if (status === 'connected' || status === 'connecting') return
      reconnectAttempt = 0
      openSocket()
    },

    disconnect() {
      disconnectInternal()
    },

    subscribe(serializedKey: string) {
      subscriptions.add(serializedKey)
      send({ type: 'subscribe', key: serializedKey })
    },

    unsubscribe(serializedKey: string) {
      subscriptions.delete(serializedKey)
      send({ type: 'unsubscribe', key: serializedKey })
    },

    presenceJoin(serializedKey: string, data: unknown) {
      presenceChannels.set(serializedKey, data)
      send({ type: 'presence:join', key: serializedKey, data })
    },

    presenceUpdate(serializedKey: string, data: unknown) {
      // The client tracks the full merged state locally.
      // Only the delta is sent to the server, which merges it server-side
      // so that any late-joining clients receive accurate presence:sync data.
      const existing = presenceChannels.get(serializedKey)
      const merged =
        typeof existing === 'object' && existing !== null
          ? { ...(existing as Record<string, unknown>), ...(data as Record<string, unknown>) }
          : data
      presenceChannels.set(serializedKey, merged)
      send({ type: 'presence:update', key: serializedKey, data })
    },

    presenceLeave(serializedKey: string) {
      presenceChannels.delete(serializedKey)
      send({ type: 'presence:leave', key: serializedKey })
    },

    onStatus(listener: StatusListener) {
      statusListeners.add(listener)
      return () => {
        statusListeners.delete(listener)
      }
    },

    onInvalidate(listener: InvalidateListener) {
      invalidateListeners.add(listener)
      return () => {
        invalidateListeners.delete(listener)
      }
    },

    onPresence(listener: PresenceListener) {
      presenceListeners.add(listener)
      return () => {
        presenceListeners.delete(listener)
      }
    },

    destroy() {
      disconnectInternal()
      statusListeners.clear()
      invalidateListeners.clear()
      presenceListeners.clear()
    },
  }
}

/**
 * Serialize a query key to a stable, deterministic JSON string.
 * Object keys are sorted at every level, mirroring TanStack Query's `hashKey`.
 */
export function serializeKey(key: QueryKey): string {
  return JSON.stringify(key, (_, val: unknown) => {
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      return Object.fromEntries(
        Object.entries(val as Record<string, unknown>).sort(([a], [b]) =>
          a.localeCompare(b),
        ),
      )
    }
    return val
  })
}
