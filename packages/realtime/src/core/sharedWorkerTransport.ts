/**
 * SharedWorker-based transport — shares a single WebSocket connection across
 * all browser tabs via a SharedWorker.
 *
 * This module contains TWO exports:
 *
 * **Tab side** (`createSharedWorkerTransport`) — call this in your app code.
 * It connects to a SharedWorker and implements `RealtimeTransport`. The
 * SharedWorker holds the real connection; this tab's calls are proxied.
 *
 * **Worker side** (`createSharedWorkerServer`) — call this inside the
 * SharedWorker file. It accepts incoming port connections and manages the
 * underlying `RealtimeTransport` on behalf of all tabs.
 *
 * Why SharedWorker instead of BroadcastChannel + leader election?
 *  - The worker lives independently of tabs — it survives tab close/sleep.
 *  - No election protocol, no heartbeat, no race conditions.
 *  - The browser manages the worker's lifetime automatically.
 *  - Works correctly even when one tab crashes mid-operation.
 *
 * @example — app code (main thread)
 * ```ts
 * import { createSharedWorkerTransport } from '@tanstack/realtime'
 *
 * const transport = createSharedWorkerTransport(
 *   new URL('./realtime.worker.ts', import.meta.url),
 * )
 * const client = createRealtimeClient({ transport })
 * ```
 *
 * @example — realtime.worker.ts (SharedWorker file)
 * ```ts
 * import { createSharedWorkerServer } from '@tanstack/realtime'
 * import { centrifugoTransport } from '@tanstack/realtime-adapter-centrifugo'
 *
 * const server = createSharedWorkerServer(
 *   centrifugoTransport({ url: 'wss://realtime.example.com/connection/websocket' }),
 * )
 *
 * self.addEventListener('connect', (e) => {
 *   server.connect(e.ports[0])
 * })
 * ```
 */

import { Store } from '@tanstack/store'
import type { RealtimeTransport, PresenceCapable, ConnectionStatus, PresenceUser } from './types.js'

// ---------------------------------------------------------------------------
// Wire protocol — messages between tab (port) and worker (server)
// ---------------------------------------------------------------------------

/** Messages sent from a tab to the SharedWorker. */
export type TabToWorkerMsg =
  | { type: 'connect' }
  | { type: 'disconnect' }
  | { type: 'subscribe'; channel: string; listenerId: string }
  | { type: 'unsubscribe'; channel: string; listenerId: string }
  | { type: 'publish'; channel: string; data: unknown; requestId: string }
  | { type: 'joinPresence'; channel: string; data: unknown }
  | { type: 'updatePresence'; channel: string; data: unknown }
  | { type: 'leavePresence'; channel: string }
  | { type: 'onPresenceChange'; channel: string; listenerId: string }
  | { type: 'offPresenceChange'; channel: string; listenerId: string }

/** Messages sent from the SharedWorker to a tab. */
export type WorkerToTabMsg =
  | { type: 'status'; status: ConnectionStatus }
  | { type: 'message'; channel: string; data: unknown }
  | { type: 'publish:ack'; requestId: string; error?: string }
  | { type: 'presence'; channel: string; users: ReadonlyArray<PresenceUser> }

// ---------------------------------------------------------------------------
// Worker-side server
// ---------------------------------------------------------------------------

export interface SharedWorkerServer {
  /**
   * Call this from the SharedWorker's `connect` event handler for each new
   * port (tab) that connects.
   *
   * @example
   * self.addEventListener('connect', (e) => server.connect(e.ports[0]))
   */
  connect(port: MessagePort): void
}

export interface SharedWorkerServerOptions {
  /**
   * Called when the underlying transport's `connect()` rejects.
   *
   * Defaults to `console.error` so failures are always visible in the
   * browser's DevTools console without any setup.
   *
   * Set to `() => {}` to suppress the default logging if you have your own
   * error-reporting pipeline (Sentry, Datadog, etc.).
   *
   * @example
   * createSharedWorkerServer(transport, {
   *   onConnectError: (err) => Sentry.captureException(err),
   * })
   *
   * @default (err) => console.error('[SharedWorkerServer] connect error:', err)
   */
  onConnectError?: (err: unknown) => void
}

/**
 * Creates the server-side coordinator that runs inside a SharedWorker.
 *
 * It manages the underlying `RealtimeTransport`, fans messages out to all
 * connected tabs, and relays publishes from tabs to the transport.
 *
 * The inner transport is connected automatically when the first port registers
 * and kept alive until the worker itself is terminated.
 *
 * **Lifecycle**: the inner transport is connected automatically as soon as
 * the first port is registered.  Calling `tab.connect()` is still accepted —
 * it is a no-op when the transport is already active.  The inner transport
 * is disconnected only when every active tab has called `tab.disconnect()`.
 *
 * **Presence replay**: when a tab subscribes to a channel's presence via
 * `onPresenceChange`, the server immediately sends the last known presence
 * list for that channel (if one has been received).  Subsequent changes are
 * pushed as they arrive.  The cache is cleared when the last subscriber
 * leaves the channel, so a re-subscription after a quiet period may see an
 * empty initial snapshot until the next change event.
 */
export function createSharedWorkerServer(
  inner: RealtimeTransport & PresenceCapable,
  options: SharedWorkerServerOptions = {},
): SharedWorkerServer {
  const {
    onConnectError = (err: unknown) =>
      console.error('[SharedWorkerServer] connect error:', err),
  } = options

  const activePorts = new Set<MessagePort>()
  // Tracks ports that have explicitly called disconnect() so we don't keep
  // the inner transport alive on their behalf.
  const disconnectedPorts = new Set<MessagePort>()

  // Per-channel: Set of (port, listenerId) pairs that subscribed.
  // We keep a single real subscription on `inner` per channel.
  const channelPorts = new Map<
    string,
    Set<{ port: MessagePort; listenerId: string }>
  >()
  const channelUnsubs = new Map<string, () => void>()

  // Per-channel: presence unsub, subscribed ports, and last known user list.
  const presencePorts = new Map<
    string,
    Set<{ port: MessagePort; listenerId: string }>
  >()
  const presenceUnsubs = new Map<string, () => void>()
  // Cache of the most recent presence snapshot per channel.  Used to replay
  // the current list to tabs that subscribe after the first update has fired.
  const presenceCache = new Map<string, ReadonlyArray<PresenceUser>>()

  function postToPort(port: MessagePort, msg: WorkerToTabMsg): void {
    try {
      port.postMessage(msg)
    } catch {
      // Port closed — will be cleaned up on next operation or on close event.
    }
  }

  function broadcastStatus(status: ConnectionStatus): void {
    for (const port of activePorts) {
      postToPort(port, { type: 'status', status })
    }
  }

  // Forward inner transport status to all connected tabs.
  inner.store.subscribe((status) => {
    broadcastStatus(status)
  })

  function ensureChannelSubscription(channel: string): void {
    if (channelUnsubs.has(channel)) return

    const unsub = inner.subscribe(channel, (data) => {
      const subscribers = channelPorts.get(channel)
      if (!subscribers) return
      // Fan out to each unique port once — not to every {port, listenerId} pair.
      // A single tab may hold multiple callbacks for the same channel; the tab
      // dispatches the single message to all its local callbacks itself.
      const seen = new Set<MessagePort>()
      for (const { port } of subscribers) {
        if (!seen.has(port)) {
          seen.add(port)
          postToPort(port, { type: 'message', channel, data })
        }
      }
    })
    channelUnsubs.set(channel, unsub)
  }

  function cleanupChannelPort(port: MessagePort, channel: string, listenerId: string): void {
    const subs = channelPorts.get(channel)
    if (!subs) return

    for (const sub of subs) {
      if (sub.port === port && sub.listenerId === listenerId) {
        subs.delete(sub)
        break
      }
    }

    if (subs.size === 0) {
      channelPorts.delete(channel)
      channelUnsubs.get(channel)?.()
      channelUnsubs.delete(channel)
    }
  }

  function ensurePresenceSubscription(channel: string): void {
    if (presenceUnsubs.has(channel)) return

    const unsub = inner.onPresenceChange(channel, (users) => {
      presenceCache.set(channel, users)
      const subscribers = presencePorts.get(channel)
      if (!subscribers) return
      // Fan out to each unique port once — same rationale as ensureChannelSubscription.
      const seen = new Set<MessagePort>()
      for (const { port } of subscribers) {
        if (!seen.has(port)) {
          seen.add(port)
          postToPort(port, { type: 'presence', channel, users })
        }
      }
    })
    presenceUnsubs.set(channel, unsub)
  }

  function cleanupPresencePort(port: MessagePort, channel: string, listenerId: string): void {
    const subs = presencePorts.get(channel)
    if (!subs) return

    for (const sub of subs) {
      if (sub.port === port && sub.listenerId === listenerId) {
        subs.delete(sub)
        break
      }
    }

    if (subs.size === 0) {
      presencePorts.delete(channel)
      presenceUnsubs.get(channel)?.()
      presenceUnsubs.delete(channel)
      presenceCache.delete(channel)
    }
  }

  function cleanupPort(port: MessagePort): void {
    activePorts.delete(port)
    disconnectedPorts.delete(port)

    // Snapshot subscriptions before cleanup to avoid mutating maps/sets while
    // iterating them — cleanupChannelPort deletes from channelPorts in place.
    const channelSubs: Array<{ channel: string; listenerId: string }> = []
    for (const [channel, subs] of channelPorts) {
      for (const sub of subs) {
        if (sub.port === port) channelSubs.push({ channel, listenerId: sub.listenerId })
      }
    }
    for (const { channel, listenerId } of channelSubs) {
      cleanupChannelPort(port, channel, listenerId)
    }

    const presenceSubs: Array<{ channel: string; listenerId: string }> = []
    for (const [channel, subs] of presencePorts) {
      for (const sub of subs) {
        if (sub.port === port) presenceSubs.push({ channel, listenerId: sub.listenerId })
      }
    }
    for (const { channel, listenerId } of presenceSubs) {
      cleanupPresencePort(port, channel, listenerId)
    }
  }

  function handlePortMessage(port: MessagePort, msg: TabToWorkerMsg): void {
    switch (msg.type) {
      case 'connect':
        // If this tab previously called disconnect() and now wants to reconnect,
        // remove it from the disconnected set so the lifecycle accounting stays
        // consistent — subsequent disconnect() calls from other tabs will no
        // longer count this tab as "already gone".
        disconnectedPorts.delete(port)
        inner.connect().catch(onConnectError)
        break

      case 'disconnect':
        disconnectedPorts.add(port)
        // Only disconnect the inner transport when every active port has
        // requested a disconnect (i.e. no tab still wants to stay connected).
        if ([...activePorts].every((p) => disconnectedPorts.has(p))) {
          inner.disconnect()
        }
        break

      case 'subscribe': {
        if (!channelPorts.has(msg.channel)) {
          channelPorts.set(msg.channel, new Set())
        }
        channelPorts.get(msg.channel)!.add({ port, listenerId: msg.listenerId })
        ensureChannelSubscription(msg.channel)
        break
      }

      case 'unsubscribe':
        cleanupChannelPort(port, msg.channel, msg.listenerId)
        break

      case 'publish':
        inner
          .publish(msg.channel, msg.data)
          .then(() =>
            postToPort(port, { type: 'publish:ack', requestId: msg.requestId }),
          )
          .catch((err) =>
            postToPort(port, {
              type: 'publish:ack',
              requestId: msg.requestId,
              error: String(err),
            }),
          )
        break

      case 'joinPresence':
        inner.joinPresence(msg.channel, msg.data)
        break

      case 'updatePresence':
        inner.updatePresence(msg.channel, msg.data)
        break

      case 'leavePresence':
        inner.leavePresence(msg.channel)
        break

      case 'onPresenceChange': {
        if (!presencePorts.has(msg.channel)) {
          presencePorts.set(msg.channel, new Set())
        }
        presencePorts.get(msg.channel)!.add({ port, listenerId: msg.listenerId })
        ensurePresenceSubscription(msg.channel)
        // Replay the last known presence snapshot so the new subscriber
        // doesn't start blind waiting for the next change event.
        const cached = presenceCache.get(msg.channel)
        if (cached !== undefined) {
          postToPort(port, { type: 'presence', channel: msg.channel, users: cached })
        }
        break
      }

      case 'offPresenceChange':
        cleanupPresencePort(port, msg.channel, msg.listenerId)
        break
    }
  }

  return {
    connect(port: MessagePort) {
      activePorts.add(port)

      // Send the current connection status so the tab starts in sync.
      postToPort(port, { type: 'status', status: inner.store.state })

      // Auto-connect the inner transport if it is currently idle.  From the
      // tab's perspective the worker is already "live", so requiring an
      // explicit tab.connect() call is surprising.  We connect eagerly on
      // first port arrival and re-connect whenever a new tab arrives and finds
      // the inner transport disconnected (e.g. after all previous tabs left).
      if (inner.store.state === 'disconnected') {
        inner.connect().catch(onConnectError)
      }

      port.onmessage = (event: MessageEvent<TabToWorkerMsg>) => {
        handlePortMessage(port, event.data)
      }

      // When the port closes (tab navigates / crashes), clean up all
      // subscriptions associated with it.
      port.addEventListener('close', () => {
        cleanupPort(port)
      })

      port.start()
    },
  }
}

// ---------------------------------------------------------------------------
// Tab-side transport
// ---------------------------------------------------------------------------

export interface SharedWorkerTransportOptions {
  /**
   * URL of the SharedWorker script.
   * Use `new URL('./realtime.worker.ts', import.meta.url)` for bundler support.
   */
  url: string | URL
  /**
   * Timeout (ms) for publish requests before rejecting with an error.
   * @default 10000
   */
  publishTimeout?: number
}

/**
 * Returns `true` when the `SharedWorker` global is available in the current
 * environment. `SharedWorker` is missing in Safari on iOS (prior to iOS 16),
 * some older Firefox versions, and non-browser environments such as
 * Cloudflare Workers or server-side rendering runtimes.
 */
export function isSharedWorkerSupported(): boolean {
  return typeof SharedWorker !== 'undefined'
}

/**
 * Creates a `RealtimeTransport` that proxies all operations to a SharedWorker.
 *
 * The SharedWorker must call `createSharedWorkerServer(transport).connect(port)`
 * in its `connect` event handler.
 *
 * The worker connects the inner transport automatically when the first tab
 * port is registered, so no explicit `connect()` call is required to start
 * receiving data.  Call `transport.disconnect()` (or `client.disconnect()`)
 * when the tab no longer needs the connection; the inner transport is torn
 * down only when every active tab has disconnected.
 *
 * **Environment support**: `SharedWorker` is not available in all browsers
 * (notably Safari on iOS and some server-side environments). Pass a `fallback`
 * factory that returns a direct transport for those environments. When no
 * `fallback` is provided and `SharedWorker` is unavailable, this function
 * throws at call time — making the failure early and explicit.
 *
 * Use {@link isSharedWorkerSupported} to branch before constructing the
 * transport if you prefer manual feature-detection over the `fallback` param.
 *
 * @param options - Transport options or a bare worker URL / URL string.
 * @param fallback - Optional factory called when `SharedWorker` is unavailable.
 *   Receives the same `options` object so you can reuse the `url` if needed.
 *
 * @example
 * // With automatic fallback to a direct transport
 * import { nodeTransport } from '@tanstack/realtime-preset-node'
 *
 * const transport = createSharedWorkerTransport(
 *   { url: new URL('./realtime.worker.ts', import.meta.url) },
 *   () => nodeTransport({ url: 'wss://realtime.example.com' }),
 * )
 * const client = createRealtimeClient({ transport })
 * // No explicit client.connect() needed — the worker auto-connects.
 */
export function createSharedWorkerTransport(
  options: SharedWorkerTransportOptions | string | URL,
  fallback?: (options: SharedWorkerTransportOptions | string | URL) => RealtimeTransport & PresenceCapable,
): RealtimeTransport & PresenceCapable {
  // Surface environment incompatibility early with a clear error (or fallback).
  if (!isSharedWorkerSupported()) {
    if (fallback) return fallback(options)
    throw new Error(
      '[realtime] SharedWorker is not supported in this environment ' +
        '(e.g. Safari on iOS, server-side rendering runtimes). ' +
        'Pass a `fallback` factory as the second argument to createSharedWorkerTransport ' +
        'to use a direct transport in unsupported environments. ' +
        'Use isSharedWorkerSupported() to detect support before constructing the transport.',
    )
  }

  const { url, publishTimeout = 10_000 } =
    typeof options === 'string' || options instanceof URL
      ? { url: options, publishTimeout: 10_000 }
      : options

  const worker = new SharedWorker(url as string | URL)
  const port = worker.port

  const store = new Store<ConnectionStatus>('disconnected')

  // Local subscription listeners: channel → listenerId → callback
  const subscriptions = new Map<string, Map<string, (data: unknown) => void>>()

  // Local presence listeners: channel → listenerId → callback
  const presenceListeners = new Map<
    string,
    Map<string, (users: ReadonlyArray<PresenceUser>) => void>
  >()

  // Pending publish promise handlers.
  const pendingPublishes = new Map<
    string,
    { resolve: () => void; reject: (err: Error) => void; timer: ReturnType<typeof setTimeout> }
  >()

  let listenerCounter = 0
  function nextId(): string {
    return String(++listenerCounter)
  }

  port.onmessage = (event: MessageEvent<WorkerToTabMsg>) => {
    const msg = event.data
    switch (msg.type) {
      case 'status':
        store.setState(() => msg.status)
        break

      case 'message': {
        const channelListeners = subscriptions.get(msg.channel)
        if (channelListeners) {
          for (const cb of channelListeners.values()) cb(msg.data)
        }
        break
      }

      case 'publish:ack': {
        const pending = pendingPublishes.get(msg.requestId)
        if (pending) {
          clearTimeout(pending.timer)
          pendingPublishes.delete(msg.requestId)
          if (msg.error) {
            pending.reject(new Error(msg.error))
          } else {
            pending.resolve()
          }
        }
        break
      }

      case 'presence': {
        const channelPresence = presenceListeners.get(msg.channel)
        if (channelPresence) {
          for (const cb of channelPresence.values()) cb(msg.users)
        }
        break
      }
    }
  }

  port.start()

  const transport: RealtimeTransport & PresenceCapable = {
    store,

    async connect() {
      port.postMessage({ type: 'connect' } satisfies TabToWorkerMsg)
    },

    disconnect() {
      port.postMessage({ type: 'disconnect' } satisfies TabToWorkerMsg)
    },

    subscribe(channel, onMessage) {
      const listenerId = nextId()

      if (!subscriptions.has(channel)) {
        subscriptions.set(channel, new Map())
      }
      subscriptions.get(channel)!.set(listenerId, onMessage)

      // Tell the worker to subscribe (it deduplicates at the inner transport).
      port.postMessage({
        type: 'subscribe',
        channel,
        listenerId,
      } satisfies TabToWorkerMsg)

      return () => {
        subscriptions.get(channel)?.delete(listenerId)
        if (subscriptions.get(channel)?.size === 0) {
          subscriptions.delete(channel)
        }

        port.postMessage({
          type: 'unsubscribe',
          channel,
          listenerId,
        } satisfies TabToWorkerMsg)
      }
    },

    async publish(channel, data) {
      const requestId = nextId()

      return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          pendingPublishes.delete(requestId)
          reject(new Error(`[SharedWorkerTransport] publish timed out after ${publishTimeout}ms`))
        }, publishTimeout)

        pendingPublishes.set(requestId, { resolve, reject, timer })

        port.postMessage({
          type: 'publish',
          channel,
          data,
          requestId,
        } satisfies TabToWorkerMsg)
      })
    },

    joinPresence(channel, data) {
      port.postMessage({ type: 'joinPresence', channel, data } satisfies TabToWorkerMsg)
    },

    updatePresence(channel, data) {
      port.postMessage({ type: 'updatePresence', channel, data } satisfies TabToWorkerMsg)
    },

    leavePresence(channel) {
      port.postMessage({ type: 'leavePresence', channel } satisfies TabToWorkerMsg)
    },

    onPresenceChange(channel, callback) {
      const listenerId = nextId()

      if (!presenceListeners.has(channel)) {
        presenceListeners.set(channel, new Map())
      }
      presenceListeners.get(channel)!.set(listenerId, callback)

      port.postMessage({
        type: 'onPresenceChange',
        channel,
        listenerId,
      } satisfies TabToWorkerMsg)

      return () => {
        presenceListeners.get(channel)?.delete(listenerId)
        if (presenceListeners.get(channel)?.size === 0) {
          presenceListeners.delete(channel)
        }

        port.postMessage({
          type: 'offPresenceChange',
          channel,
          listenerId,
        } satisfies TabToWorkerMsg)
      }
    },
  }

  return transport
}
