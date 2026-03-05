import { Store } from '@tanstack/store'
import { createHookPipeline } from '@tanstack/realtime'
import type {
  ConnectionStatus,
  HookHandle,
  HookRegistration,
  RealtimeTransport,
} from '@tanstack/realtime'
import type { ClientAction, ServerEvent } from './protocol.js'

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface SseTransportOptions {
  /**
   * Full URL (or URL object) for the SSE endpoint, e.g.
   * `"https://example.com/_realtime/sse"`.
   */
  url: string | URL
  /**
   * Async function that returns a Bearer token to include in the
   * `Authorization` header on every request (stream + actions).
   * Called once per connection attempt so short-lived tokens can be refreshed.
   *
   * @example
   * getToken: () => getAuthSession().then((s) => s.accessToken)
   */
  getToken?: () => string | Promise<string>
  /** Reconnection: initial back-off delay in ms. @default 1000 */
  initialDelay?: number
  /** Reconnection: maximum back-off delay in ms. @default 30000 */
  maxDelay?: number
  /** Reconnection: jitter factor (0–1). @default 0.25 */
  jitter?: number
}

// ---------------------------------------------------------------------------
// sseTransport
// ---------------------------------------------------------------------------

/**
 * Creates a `RealtimeTransport` backed by Server-Sent Events (SSE) + HTTP POST.
 *
 * Unlike `EventSource`, this transport uses `fetch()` so it can:
 * - Set `Authorization` headers (required for token-based auth).
 * - Work in environments that lack `EventSource` (some Node.js runtimes).
 * - Reconnect with exponential back-off.
 *
 * **Server requirement**: pair with `createSseHandler` from this package, or
 * any HTTP server that speaks the same SSE wire protocol.
 *
 * @example
 * import { sseTransport } from '@tanstack/realtime-adapter-sse'
 * import { createRealtimeClient } from '@tanstack/realtime'
 *
 * export const realtimeClient = createRealtimeClient({
 *   transport: sseTransport({
 *     url: 'https://api.example.com/_realtime/sse',
 *     getToken: () => auth.getToken(),
 *   }),
 * })
 */
export function sseTransport(options: SseTransportOptions): RealtimeTransport {
  const {
    url,
    getToken,
    initialDelay = 1000,
    maxDelay = 30_000,
    jitter = 0.25,
  } = options

  const store = new Store<ConnectionStatus>('disconnected')
  const pipeline = createHookPipeline()

  // channel → Set of message callbacks
  const subscriptions = new Map<string, Set<(data: unknown) => void>>()

  // subscribe error callbacks
  const subscribeErrorListeners = new Set<
    (channel: string, reason: string, code?: number) => void
  >()

  let connectionId: string | null = null
  let abortCtrl: AbortController | null = null
  let reconnectAttempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let intentionalClose = false

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function resolveUrl(suffix = ''): string {
    const base = typeof url === 'string' ? url : url.toString()
    return base + suffix
  }

  async function authHeaders(): Promise<Record<string, string>> {
    if (!getToken) return {}
    const token = await getToken()
    return { Authorization: `Bearer ${token}` }
  }

  async function postAction(action: ClientAction): Promise<void> {
    const headers = await authHeaders()
    const response = await fetch(resolveUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(action),
    })
    if (!response.ok) {
      console.warn(
        `[realtime:sse] POST action "${action.action}" failed with status ${response.status}`,
      )
    }
  }

  async function resubscribeAll(): Promise<void> {
    if (!connectionId) return
    const cid = connectionId
    for (const [channel, listeners] of subscriptions) {
      if (listeners.size > 0) {
        await postAction({ action: 'subscribe', connectionId: cid, channel })
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
      if (!intentionalClose) void openStream()
    }, delay)
  }

  // ---------------------------------------------------------------------------
  // SSE stream reader
  // ---------------------------------------------------------------------------

  /**
   * Parse a raw SSE text chunk and extract the `data:` payload.
   * A single SSE event is one or more lines terminated by `\n\n`.
   * Only `data:` fields are used; id/event/retry are ignored.
   */
  function parseEvent(raw: string): ServerEvent | null {
    const lines = raw.split('\n')
    const dataLines: Array<string> = []
    for (const line of lines) {
      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart())
      }
    }
    if (dataLines.length === 0) return null
    try {
      return JSON.parse(dataLines.join('\n')) as ServerEvent
    } catch {
      return null
    }
  }

  async function openStream(): Promise<void> {
    connectionId = null
    store.setState(() => 'connecting')

    const ctrl = new AbortController()
    abortCtrl = ctrl

    let headers: Record<string, string>
    try {
      headers = await authHeaders()
    } catch {
      if (intentionalClose) return
      store.setState(() => 'reconnecting')
      scheduleReconnect()
      return
    }

    let response: Response
    try {
      response = await fetch(resolveUrl(), {
        method: 'GET',
        headers: { Accept: 'text/event-stream', ...headers },
        signal: ctrl.signal,
      })
    } catch {
      if (intentionalClose || ctrl.signal.aborted) return
      store.setState(() => 'reconnecting')
      scheduleReconnect()
      return
    }

    if (!response.ok || !response.body) {
      if (intentionalClose) return
      store.setState(() => 'reconnecting')
      scheduleReconnect()
      return
    }

    const reader = response.body.getReader()
    const dec = new TextDecoder()
    let buf = ''

    // Read chunks continuously.
    const readLoop = async (): Promise<void> => {
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break

          buf += dec.decode(value, { stream: true })

          // SSE events are separated by double newlines.
          const parts = buf.split('\n\n')
          // Keep the last (potentially incomplete) part in the buffer.
          buf = parts.pop() ?? ''

          for (const part of parts) {
            const trimmed = part.trim()
            if (!trimmed) continue
            const event = parseEvent(trimmed)
            if (!event) continue
            handleServerEvent(event)
          }
        }
      } catch {
        // Stream aborted or network error; fall through.
      }

      reader.releaseLock()

      if (intentionalClose || ctrl.signal.aborted) return
      store.setState(() => 'reconnecting')
      scheduleReconnect()
    }

    void readLoop()
  }

  function handleServerEvent(event: ServerEvent): void {
    switch (event.type) {
      case 'connected': {
        connectionId = event.connectionId
        reconnectAttempt = 0
        store.setState(() => 'connected')
        void resubscribeAll()
        break
      }
      case 'message': {
        const listeners = subscriptions.get(event.channel)
        if (listeners) {
          for (const cb of listeners) cb(event.data)
        }
        break
      }
      case 'subscribe:error': {
        for (const cb of subscribeErrorListeners) {
          cb(event.channel, event.reason, event.code)
        }
        break
      }
      case 'ping':
        // Keep-alive; no action needed.
        break
    }
  }

  // ---------------------------------------------------------------------------
  // Transport interface
  // ---------------------------------------------------------------------------

  const transport: RealtimeTransport = {
    store,

    async connect() {
      const current = store.get()
      if (current === 'connected') return
      if (current !== 'disconnected') {
        return new Promise<void>((resolve, reject) => {
          const unsub = store.subscribe((status) => {
            if (status === 'connected') {
              unsub.unsubscribe()
              resolve()
            } else if (status === 'disconnected') {
              unsub.unsubscribe()
              reject(new Error('[realtime:sse] Connection failed'))
            }
          })
        })
      }
      intentionalClose = false
      void openStream()
      return new Promise<void>((resolve, reject) => {
        const unsub = store.subscribe((status) => {
          if (status === 'connected') {
            unsub.unsubscribe()
            resolve()
          } else if (status === 'disconnected') {
            unsub.unsubscribe()
            reject(new Error('[realtime:sse] Connection failed'))
          }
        })
      })
    },

    disconnect() {
      intentionalClose = true
      connectionId = null
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      abortCtrl?.abort()
      abortCtrl = null
      store.setState(() => 'disconnected')
    },

    subscribe(channel, onMessage) {
      if (!subscriptions.has(channel)) {
        subscriptions.set(channel, new Set())
      }
      const listeners = subscriptions.get(channel)!
      listeners.add(onMessage)

      // Subscribe on the server if we're connected and this is the first listener.
      if (listeners.size === 1 && connectionId && store.get() === 'connected') {
        void postAction({ action: 'subscribe', connectionId, channel })
      }

      return () => {
        listeners.delete(onMessage)
        if (listeners.size === 0) {
          subscriptions.delete(channel)
          if (connectionId && store.get() === 'connected') {
            void postAction({ action: 'unsubscribe', connectionId, channel })
          }
        }
      }
    },

    async publish(channel, data) {
      await postAction({ action: 'publish', channel, data })
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
