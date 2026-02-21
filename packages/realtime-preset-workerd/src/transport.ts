import { Store } from '@tanstack/store'
import type { RealtimeTransport, PresenceUser, ConnectionStatus } from '@tanstack/realtime'
import type { WorkerdTransportOptions } from './types.js'

// ── Internal per-channel state ────────────────────────────────────────────────

type ChannelReadyState = 'connecting' | 'connected' | 'disconnected'

interface ChannelState {
  ws: WebSocket | null
  readyState: ChannelReadyState
  selfConnectionId: string | null
  /** Callbacks registered via `subscribe()`. */
  messageListeners: Set<(data: unknown) => void>
  /** Callbacks registered via `onPresenceChange()`. */
  presenceListeners: Set<(users: PresenceUser[]) => void>
  /** Messages queued before the connection is authorized. */
  pendingMessages: Array<string>
  retryCount: number
  retryTimer: ReturnType<typeof setTimeout> | null
  /** Set to true when the channel should not reconnect (e.g. after `disconnect()`). */
  intentionalClose: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Client-side transport for {@link @tanstack/realtime#createRealtimeClient} that
 * works in both **browser** and **Cloudflare Workers / workerd** environments
 * (no Node.js APIs required).
 *
 * Opens **one WebSocket per channel**, connecting to the configured server URL.
 * Multiple calls to `subscribe()` or `onPresenceChange()` for the **same**
 * channel share a single WebSocket connection.
 *
 * ## Auth
 *
 * The auth token is appended to the WebSocket URL as a `?token=` query
 * parameter. Configure the server's `getAuthToken` to read it:
 *
 * ```ts
 * getAuthToken(request) {
 *   return new URL(request.url).searchParams.get('token')
 * }
 * ```
 *
 * Alternatively, if you rely on cookies the browser sends them automatically
 * and no `getAuthToken` is needed on the client.
 *
 * ## Example
 *
 * ```ts
 * import { createRealtimeClient } from '@tanstack/realtime'
 * import { workerdTransport } from '@tanstack/realtime-preset-workerd'
 *
 * export const client = createRealtimeClient({
 *   transport: workerdTransport({
 *     url: 'https://my-server.example.com', // omit in a browser
 *     getAuthToken: () => myAuthStore.token,
 *   }),
 * })
 * ```
 */
export function workerdTransport(
  options: WorkerdTransportOptions = {},
): RealtimeTransport {
  const {
    path = '/_realtime',
    retryDelay = 1_000,
    maxRetryDelay = 30_000,
  } = options

  // One entry per channel key.
  const channels = new Map<string, ChannelState>()
  const statusStore = new Store<ConnectionStatus>('disconnected')

  // ── URL helpers ─────────────────────────────────────────────────────────────

  function getBaseWsUrl(): string {
    if (options.url) {
      // Accept http(s) or ws(s) base URLs.
      return options.url.replace(/^http/, 'ws').replace(/\/$/, '')
    }
    if (typeof window !== 'undefined') {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${proto}//${window.location.host}`
    }
    throw new Error(
      '[realtime:workerd] options.url is required outside of a browser context',
    )
  }

  // ── Status management ────────────────────────────────────────────────────────

  function recalcStatus(): void {
    const states = [...channels.values()].map((s) => s.readyState)
    let next: ConnectionStatus
    if (states.some((s) => s === 'connected')) {
      next = 'connected'
    } else if (states.some((s) => s === 'connecting')) {
      next = 'connecting'
    } else {
      next = 'disconnected'
    }
    if (statusStore.state !== next) statusStore.setState(() => next)
  }

  // ── Per-channel WebSocket lifecycle ──────────────────────────────────────────

  function openChannel(channel: string): ChannelState {
    const existing = channels.get(channel)
    if (existing && existing.readyState !== 'disconnected') return existing

    const state: ChannelState = existing ?? {
      ws: null,
      readyState: 'connecting',
      selfConnectionId: null,
      messageListeners: new Set(),
      presenceListeners: new Set(),
      pendingMessages: [],
      retryCount: 0,
      retryTimer: null,
      intentionalClose: false,
    }

    // Reset for reconnect.
    state.ws = null
    state.readyState = 'connecting'
    state.selfConnectionId = null
    channels.set(channel, state)
    recalcStatus()

    void connectChannel(channel, state)
    return state
  }

  async function connectChannel(channel: string, state: ChannelState): Promise<void> {
    const token = (await options.getAuthToken?.()) ?? null
    const wsUrl =
      `${getBaseWsUrl()}${path}/${encodeURIComponent(channel)}` +
      (token ? `?token=${encodeURIComponent(token)}` : '')

    const ws = new WebSocket(wsUrl)
    state.ws = ws

    ws.addEventListener('open', () => {
      // Nothing to send on open — the server immediately sends `connected`.
    })

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data as string) as Record<string, unknown>
      handleIncoming(channel, state, msg)
    })

    ws.addEventListener('close', () => {
      if (state.intentionalClose) {
        state.readyState = 'disconnected'
        recalcStatus()
        return
      }
      scheduleReconnect(channel, state)
    })

    ws.addEventListener('error', () => {
      // `close` always follows `error`, so reconnect logic lives there.
    })
  }

  function handleIncoming(
    channel: string,
    state: ChannelState,
    msg: Record<string, unknown>,
  ): void {
    switch (msg.type) {
      case 'connected': {
        state.selfConnectionId = msg.connectionId as string
        state.readyState = 'connected'
        state.retryCount = 0
        recalcStatus()
        // Flush messages queued during handshake.
        for (const raw of state.pendingMessages) {
          state.ws?.send(raw)
        }
        state.pendingMessages = []
        break
      }

      case 'message': {
        for (const cb of state.messageListeners) cb(msg.data)
        break
      }

      case 'presence:update': {
        const users = (msg.users as PresenceUser[]).filter(
          (u) => u.connectionId !== state.selfConnectionId,
        )
        for (const cb of state.presenceListeners) cb(users)
        break
      }

      case 'error': {
        console.error(`[realtime:workerd] channel "${channel}" error:`, msg.message)
        break
      }
    }
  }

  function scheduleReconnect(channel: string, state: ChannelState): void {
    state.readyState = 'disconnected'
    state.ws = null
    recalcStatus()

    const delay = clamp(
      retryDelay * 2 ** state.retryCount + Math.random() * retryDelay,
      retryDelay,
      maxRetryDelay,
    )
    state.retryCount++

    state.retryTimer = setTimeout(() => {
      if (state.intentionalClose) return
      void connectChannel(channel, state)
    }, delay)
  }

  function send(channel: string, state: ChannelState, msg: Record<string, unknown>): void {
    const raw = JSON.stringify(msg)
    if (state.readyState === 'connected' && state.ws) {
      state.ws.send(raw)
    } else {
      state.pendingMessages.push(raw)
    }
  }

  function maybeCloseChannel(channel: string, state: ChannelState): void {
    if (state.messageListeners.size === 0 && state.presenceListeners.size === 0) {
      state.intentionalClose = true
      if (state.retryTimer !== null) {
        clearTimeout(state.retryTimer)
        state.retryTimer = null
      }
      state.ws?.close()
      channels.delete(channel)
      recalcStatus()
    }
  }

  // ── RealtimeTransport implementation ────────────────────────────────────────

  return {
    store: statusStore,

    /**
     * Transitions the overall status to `connecting`. Individual channel
     * sockets open lazily when `subscribe()` or `onPresenceChange()` is called.
     */
    async connect(): Promise<void> {
      if (statusStore.state === 'disconnected') {
        statusStore.setState(() => 'connecting')
      }
    },

    /** Close all open channel WebSockets and cancel any pending reconnects. */
    disconnect(): void {
      for (const [channel, state] of channels) {
        state.intentionalClose = true
        if (state.retryTimer !== null) {
          clearTimeout(state.retryTimer)
          state.retryTimer = null
        }
        state.ws?.close()
        channels.delete(channel)
      }
      statusStore.setState(() => 'disconnected')
    },

    subscribe(channel, callback) {
      const state = openChannel(channel)
      state.messageListeners.add(callback)
      return () => {
        state.messageListeners.delete(callback)
        maybeCloseChannel(channel, state)
      }
    },

    async publish(channel, data): Promise<void> {
      const state = openChannel(channel)
      send(channel, state, { type: 'publish', data })
    },

    joinPresence(channel, data) {
      const state = openChannel(channel)
      send(channel, state, { type: 'presence:join', data })
    },

    updatePresence(channel, data) {
      const state = channels.get(channel)
      if (state) send(channel, state, { type: 'presence:update', data })
    },

    leavePresence(channel) {
      const state = channels.get(channel)
      if (state) send(channel, state, { type: 'presence:leave' })
    },

    onPresenceChange(channel, callback) {
      const state = openChannel(channel)
      state.presenceListeners.add(callback)
      return () => {
        state.presenceListeners.delete(callback)
        maybeCloseChannel(channel, state)
      }
    },
  }
}
