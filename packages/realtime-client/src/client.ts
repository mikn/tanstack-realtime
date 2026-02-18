import type {
  ConnectionStatus,
  StatusListener,
  InvalidateListener,
  PresenceListener,
  PresenceClientEvent,
  ServerMessage,
} from './types.js'

export interface RealtimeClientOptions {
  /** WebSocket URL. Defaults to same origin with /_realtime path. */
  url?: string
  /** Reconnection settings */
  reconnect?: {
    /** Initial delay in ms. Default: 1000 */
    initialDelay?: number
    /** Max delay in ms. Default: 30000 */
    maxDelay?: number
    /** Jitter factor (0-1). Default: 0.25 */
    jitter?: number
  }
  /** Batched refetch settings on reconnect */
  refetch?: {
    /** Max concurrent invalidations. Default: 5 */
    maxConcurrency?: number
    /** Stagger delay between batches in ms. Default: 50 */
    stagger?: number
  }
}

export interface RealtimeClient {
  /** Open the WebSocket connection. Call after auth. */
  connect(): void
  /** Close the WebSocket and clear subscriptions. */
  disconnect(): void
  /** Current connection status (reactive via onStatus) */
  readonly status: ConnectionStatus

  /** Subscribe to an invalidation event for a serialized query key */
  subscribe(serializedKey: string): void
  /** Unsubscribe from a serialized query key */
  unsubscribe(serializedKey: string): void

  /** Join a presence channel */
  presenceJoin(serializedKey: string, data: unknown): void
  /** Update presence data on a channel */
  presenceUpdate(serializedKey: string, data: unknown): void
  /** Leave a presence channel */
  presenceLeave(serializedKey: string): void

  /** Register a listener for status changes */
  onStatus(listener: StatusListener): () => void
  /** Register a listener for invalidation signals */
  onInvalidate(listener: InvalidateListener): () => void
  /** Register a listener for presence events */
  onPresence(listener: PresenceListener): () => void
  /** Cleanup all resources */
  destroy(): void
}

function resolveUrl(url?: string): string {
  if (url) return url
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/_realtime`
  }
  return 'ws://localhost:3000/_realtime'
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
  // Active presence channels: key -> last sent data
  const presenceChannels = new Map<string, unknown>()

  // Listeners
  const statusListeners = new Set<StatusListener>()
  const invalidateListeners = new Set<InvalidateListener>()
  const presenceListeners = new Set<PresenceListener>()

  function setStatus(next: ConnectionStatus) {
    if (status === next) return
    status = next
    for (const l of statusListeners) l(next)
  }

  function send(msg: object) {
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(msg))
    }
  }

  function resubscribeAll() {
    for (const key of subscriptions) {
      send({ type: 'subscribe', key })
    }
    // Rejoin presence channels
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

    if (keys.length > 0) {
      setTimeout(flush, refetchOpts.stagger)
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

    // Presence messages
    if (
      msg.type === 'presence:join' ||
      msg.type === 'presence:update' ||
      msg.type === 'presence:leave' ||
      msg.type === 'presence:sync'
    ) {
      let event: PresenceClientEvent
      if (msg.type === 'presence:join') {
        event = { type: 'join', connectionId: msg.connectionId, data: msg.data }
      } else if (msg.type === 'presence:update') {
        event = {
          type: 'update',
          connectionId: msg.connectionId,
          data: msg.data,
        }
      } else if (msg.type === 'presence:leave') {
        event = { type: 'leave', connectionId: msg.connectionId }
      } else {
        event = { type: 'sync', users: msg.users }
      }
      for (const l of presenceListeners) l(msg.key, event)
    }
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
        // Reconnected after a drop — invalidate all active queries to catch missed events
        batchInvalidateAll()
      }
      setStatus('connected')
    })

    socket.addEventListener('message', (event) => {
      handleMessage(event.data as string)
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
      // close event will follow
    })
  }

  function scheduleReconnect() {
    if (explicitDisconnect) return
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

  // Window focus handler
  let focusHandlerAttached = false
  function attachFocusHandler() {
    if (focusHandlerAttached || typeof window === 'undefined') return
    focusHandlerAttached = true
    window.addEventListener('focus', handleWindowFocus)
  }
  function detachFocusHandler() {
    if (typeof window === 'undefined') return
    window.removeEventListener('focus', handleWindowFocus)
    focusHandlerAttached = false
  }
  function handleWindowFocus() {
    if (status === 'disconnected' || status === 'reconnecting') return
    if (!ws || ws.readyState !== ws.OPEN) {
      scheduleReconnect()
      return
    }
    // Connection alive — invalidate all to catch missed events
    batchInvalidateAll()
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
      explicitDisconnect = true
      cancelReconnect()
      detachFocusHandler()
      if (ws) {
        ws.close()
        ws = null
      }
      setStatus('disconnected')
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
      const existing = presenceChannels.get(serializedKey)
      const merged =
        typeof existing === 'object' && existing !== null
          ? { ...(existing as object), ...(data as object) }
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
      return () => statusListeners.delete(listener)
    },

    onInvalidate(listener: InvalidateListener) {
      invalidateListeners.add(listener)
      return () => invalidateListeners.delete(listener)
    },

    onPresence(listener: PresenceListener) {
      presenceListeners.add(listener)
      return () => presenceListeners.delete(listener)
    },

    destroy() {
      this.disconnect()
      statusListeners.clear()
      invalidateListeners.clear()
      presenceListeners.clear()
    },
  }
}

/**
 * Serialize a query key using deterministic JSON with sorted object keys.
 * Mirrors TanStack Query's hashKey behavior.
 */
export function serializeKey(key: ReadonlyArray<unknown>): string {
  return JSON.stringify(key, (_, val) => {
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
