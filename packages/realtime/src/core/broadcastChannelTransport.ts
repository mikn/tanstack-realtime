/**
 * BroadcastChannel-based multi-tab transport — coordinates a single WebSocket
 * connection across browser tabs using BroadcastChannel and leader election.
 *
 * One tab is elected "leader" and holds the real transport connection. Other
 * tabs proxy their operations through BroadcastChannel. If the leader tab
 * closes, a new leader is elected and reconnects.
 *
 * This is the automatic middle-ground between SharedWorker (best, but requires
 * a worker file) and direct transport (no coordination). It requires zero setup
 * — no worker file, no bundler config.
 *
 * Trade-offs vs SharedWorker:
 *  + Zero setup (no worker file, no bundler config)
 *  + Works in more environments (Safari iOS < 16, some WebViews)
 *  - Leader death causes a brief reconnect while new leader is elected
 *  - The leader tab does slightly more work (runs the transport)
 *
 * @example
 * ```ts
 * import { createBroadcastChannelTransport } from '@tanstack/realtime'
 * import { sseTransport } from '@tanstack/realtime-adapter-sse'
 *
 * const transport = createBroadcastChannelTransport(
 *   () => sseTransport({ url: '/api/realtime/sse' }),
 * )
 * const client = createRealtimeClient({ transport })
 * ```
 */

import { Store } from '@tanstack/store'
import { createHookPipeline } from './hookPipeline.js'
import { hasPresence } from './types.js'
import type { HookHandle, HookRegistration } from './hooks.js'
import type {
  ConnectionStatus,
  PresenceCapable,
  PresenceUser,
  RealtimeTransport,
} from './types.js'

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface BroadcastChannelTransportOptions {
  /** BroadcastChannel name shared across tabs. @default 'tanstack-realtime' */
  name?: string
  /** Leader heartbeat interval in ms. @default 2000 */
  heartbeatMs?: number
  /** Time without heartbeat before triggering re-election. @default 6000 */
  leaderTimeoutMs?: number
  /** Publish ack timeout in ms. @default 10000 */
  publishTimeout?: number
  /**
   * Called when the inner transport's `connect()` rejects on the leader tab.
   * @default (err) => console.error('[BroadcastChannelTransport] connect error:', err)
   */
  onConnectError?: (err: unknown) => void
}

// ---------------------------------------------------------------------------
// Wire protocol — messages between tabs via BroadcastChannel
// ---------------------------------------------------------------------------

/** @internal */
type BCMsg =
  // Election & lifecycle
  | { type: 'hello'; tabId: string }
  | { type: 'leader'; tabId: string; status: ConnectionStatus }
  | { type: 'heartbeat'; tabId: string }
  | { type: 'claim'; tabId: string }
  | { type: 'bye'; tabId: string }
  | { type: 'reregister' }
  // Leader → all broadcasts
  | { type: 'status'; status: ConnectionStatus }
  | { type: 'message'; channel: string; data: unknown }
  | { type: 'presence'; channel: string; users: ReadonlyArray<PresenceUser> }
  // Follower → leader requests
  | { type: 'subscribe'; tabId: string; channel: string }
  | { type: 'unsubscribe'; tabId: string; channel: string }
  | {
      type: 'publish'
      tabId: string
      channel: string
      data: unknown
      requestId: string
    }
  | {
      type: 'publish:ack'
      to: string
      requestId: string
      error?: string
    }
  | { type: 'joinPresence'; tabId: string; channel: string; data: unknown }
  | { type: 'updatePresence'; tabId: string; channel: string; data: unknown }
  | { type: 'leavePresence'; tabId: string; channel: string }
  | { type: 'presenceOn'; tabId: string; channel: string }
  | { type: 'presenceOff'; tabId: string; channel: string }
  // Leader → all: subscribe error notification
  | { type: 'subscribeError'; channel: string; reason: string; code?: number }
  // Follower → leader: re-registration after new leader elected
  | {
      type: 'register'
      tabId: string
      channels: Array<string>
      presenceChannels: Array<string>
    }

// ---------------------------------------------------------------------------
// Feature detection
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the `BroadcastChannel` global is available.
 * Missing in Node.js < 18.x (available as a global since v18) and
 * some restricted WebView environments.
 */
export function isBroadcastChannelSupported(): boolean {
  return typeof BroadcastChannel !== 'undefined'
}

// ---------------------------------------------------------------------------
// Transport factory
// ---------------------------------------------------------------------------

/**
 * Creates a `RealtimeTransport` that coordinates a single connection across
 * browser tabs using BroadcastChannel leader election.
 *
 * Call this in every tab with the same `name`. One tab is elected leader and
 * creates the real transport via `createInner()`. Other tabs proxy through
 * BroadcastChannel. When the leader tab closes or crashes, a new leader is
 * elected automatically.
 *
 * @param createInner - Factory that produces the underlying transport. Called
 *   only on the leader tab. Must return a fresh instance each time (the
 *   previous leader's transport is disconnected on failover).
 * @param options - Optional configuration.
 */
export function createBroadcastChannelTransport(
  createInner: () => RealtimeTransport & Partial<PresenceCapable>,
  options: BroadcastChannelTransportOptions = {},
): RealtimeTransport & PresenceCapable {
  const {
    name = 'tanstack-realtime',
    heartbeatMs = 2000,
    leaderTimeoutMs = 6000,
    publishTimeout = 10_000,
    onConnectError = (err: unknown) =>
      console.error('[BroadcastChannelTransport] connect error:', err),
  } = options

  const tabId = crypto.randomUUID()
  const store = new Store<ConnectionStatus>('disconnected')
  const bc = new BroadcastChannel(name)

  // ── Local state ─────────────────────────────────────────────────────────

  let isLeader = false
  let leaderTabId: string | null = null
  let inner: (RealtimeTransport & Partial<PresenceCapable>) | null = null
  let innerStatusUnsub: (() => void) | null = null
  let innerSubscribeErrorUnsub: (() => void) | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let leaderWatchTimer: ReturnType<typeof setInterval> | null = null
  let lastHeartbeat = 0
  let electionTimer: ReturnType<typeof setTimeout> | null = null
  let userCalledConnect = false

  // This tab's subscriptions
  const subscribeErrorListeners = new Set<
    (channel: string, reason: string, code?: number) => void
  >()
  const localSubs = new Map<string, Set<(data: unknown) => void>>()
  const localPresenceSubs = new Map<
    string,
    Set<(users: ReadonlyArray<PresenceUser>) => void>
  >()
  const pendingPublishes = new Map<
    string,
    {
      resolve: () => void
      reject: (err: Error) => void
      timer: ReturnType<typeof setTimeout>
    }
  >()
  let publishCounter = 0
  function nextRequestId(): string {
    return `${tabId}:${++publishCounter}`
  }

  // ── Leader-only state: track which channels each follower tab needs ─────

  // channel → Set of follower tabIds that need this channel
  const channelTabSubs = new Map<string, Set<string>>()
  const innerChannelUnsubs = new Map<string, () => void>()
  const presenceTabSubs = new Map<string, Set<string>>()
  const innerPresenceUnsubs = new Map<string, () => void>()

  // ── Helpers ─────────────────────────────────────────────────────────────

  function post(msg: BCMsg): void {
    try {
      bc.postMessage(msg)
    } catch {
      /* channel closed */
    }
  }

  // ── Inner transport subscription management (leader only) ───────────────

  function subscribeInner(channel: string): void {
    if (!inner || innerChannelUnsubs.has(channel)) return
    const unsub = inner.subscribe(channel, (data) => {
      // Deliver to leader's own callbacks
      const cbs = localSubs.get(channel)
      if (cbs) for (const cb of cbs) cb(data)
      // Broadcast to followers (BroadcastChannel does NOT deliver to sender)
      post({ type: 'message', channel, data })
    })
    innerChannelUnsubs.set(channel, unsub)
  }

  function unsubscribeInner(channel: string): void {
    const unsub = innerChannelUnsubs.get(channel)
    if (unsub) {
      unsub()
      innerChannelUnsubs.delete(channel)
    }
  }

  function subscribePresenceInner(channel: string): void {
    if (!inner || !hasPresence(inner) || innerPresenceUnsubs.has(channel))
      return
    const unsub = inner.onPresenceChange(channel, (users) => {
      const cbs = localPresenceSubs.get(channel)
      if (cbs) for (const cb of cbs) cb(users)
      post({ type: 'presence', channel, users })
    })
    innerPresenceUnsubs.set(channel, unsub)
  }

  function unsubscribePresenceInner(channel: string): void {
    const unsub = innerPresenceUnsubs.get(channel)
    if (unsub) {
      unsub()
      innerPresenceUnsubs.delete(channel)
    }
  }

  /** Add a follower tab's interest in a channel (leader only). */
  function addTabChannel(tId: string, channel: string): void {
    if (!channelTabSubs.has(channel)) channelTabSubs.set(channel, new Set())
    channelTabSubs.get(channel)!.add(tId)
    subscribeInner(channel)
  }

  /** Remove a follower tab's interest in a channel (leader only). */
  function removeTabChannel(tId: string, channel: string): void {
    const tabs = channelTabSubs.get(channel)
    if (!tabs) return
    tabs.delete(tId)
    if (tabs.size === 0 && !localSubs.has(channel)) {
      channelTabSubs.delete(channel)
      unsubscribeInner(channel)
    }
  }

  function addTabPresence(tId: string, channel: string): void {
    if (!presenceTabSubs.has(channel)) presenceTabSubs.set(channel, new Set())
    presenceTabSubs.get(channel)!.add(tId)
    subscribePresenceInner(channel)
  }

  function removeTabPresence(tId: string, channel: string): void {
    const tabs = presenceTabSubs.get(channel)
    if (!tabs) return
    tabs.delete(tId)
    if (tabs.size === 0 && !localPresenceSubs.has(channel)) {
      presenceTabSubs.delete(channel)
      unsubscribePresenceInner(channel)
    }
  }

  /** Remove all subscriptions for a departing tab (leader only). */
  function cleanupTab(departedTabId: string): void {
    // Snapshot keys before mutating
    const chans = [...channelTabSubs.entries()]
      .filter(([, tabs]) => tabs.has(departedTabId))
      .map(([ch]) => ch)
    for (const ch of chans) removeTabChannel(departedTabId, ch)

    const pchans = [...presenceTabSubs.entries()]
      .filter(([, tabs]) => tabs.has(departedTabId))
      .map(([ch]) => ch)
    for (const ch of pchans) removeTabPresence(departedTabId, ch)
  }

  // ── Leader lifecycle ────────────────────────────────────────────────────

  function becomeLeader(): void {
    if (isLeader) return
    isLeader = true
    leaderTabId = tabId
    stopLeaderWatch()

    // Create the real transport
    inner = createInner()

    // Mirror inner status → local store + broadcast to followers
    const sub = inner.store.subscribe((status) => {
      store.setState(() => status)
      post({ type: 'status', status })
    })
    innerStatusUnsub = () => sub.unsubscribe()

    // Mirror inner subscribe errors → local listeners + broadcast to followers
    if (inner.onSubscribeError) {
      innerSubscribeErrorUnsub = inner.onSubscribeError(
        (channel, reason, code) => {
          for (const cb of subscribeErrorListeners) cb(channel, reason, code)
          post({ type: 'subscribeError', channel, reason, code })
        },
      )
    }

    // Subscribe to this tab's own channels on the inner transport
    for (const channel of localSubs.keys()) subscribeInner(channel)
    for (const channel of localPresenceSubs.keys())
      subscribePresenceInner(channel)

    // Connect the inner transport if the user already called connect()
    if (userCalledConnect) {
      inner.connect().catch(onConnectError)
    }

    startHeartbeat()

    // Announce leadership and ask followers to re-register
    post({ type: 'leader', tabId, status: inner.store.get() })
    post({ type: 'reregister' })
  }

  function resignLeader(): void {
    if (!isLeader) return
    isLeader = false

    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
    if (innerStatusUnsub) {
      innerStatusUnsub()
      innerStatusUnsub = null
    }
    if (innerSubscribeErrorUnsub) {
      innerSubscribeErrorUnsub()
      innerSubscribeErrorUnsub = null
    }

    // Tear down all inner subscriptions
    for (const unsub of innerChannelUnsubs.values()) unsub()
    innerChannelUnsubs.clear()
    for (const unsub of innerPresenceUnsubs.values()) unsub()
    innerPresenceUnsubs.clear()
    channelTabSubs.clear()
    presenceTabSubs.clear()

    inner?.disconnect()
    inner = null
  }

  function startHeartbeat(): void {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    heartbeatTimer = setInterval(() => {
      post({ type: 'heartbeat', tabId })
    }, heartbeatMs)
  }

  function startLeaderWatch(): void {
    if (leaderWatchTimer) clearInterval(leaderWatchTimer)
    lastHeartbeat = Date.now()
    leaderWatchTimer = setInterval(() => {
      if (Date.now() - lastHeartbeat > leaderTimeoutMs) {
        // Leader is dead — trigger re-election
        leaderTabId = null
        stopLeaderWatch()
        startElection()
      }
    }, heartbeatMs)
  }

  function stopLeaderWatch(): void {
    if (leaderWatchTimer) {
      clearInterval(leaderWatchTimer)
      leaderWatchTimer = null
    }
  }

  // ── Election ────────────────────────────────────────────────────────────

  function startElection(): void {
    if (electionTimer || isLeader) return
    post({ type: 'claim', tabId })
    // Wait for competing claims; lowest tabId wins
    electionTimer = setTimeout(() => {
      electionTimer = null
      if (!leaderTabId && !isLeader) {
        becomeLeader()
      }
    }, 150)
  }

  // ── BroadcastChannel message handler ────────────────────────────────────

  bc.onmessage = (event: MessageEvent<BCMsg>) => {
    const msg = event.data

    switch (msg.type) {
      // ── Election & lifecycle ───────────────────────────────────────────
      case 'hello':
        if (isLeader) {
          post({
            type: 'leader',
            tabId,
            status: inner?.store.get() ?? 'disconnected',
          })
        }
        break

      case 'leader':
        if (msg.tabId === tabId) break
        if (isLeader) {
          // Two leaders — lower tabId wins
          if (msg.tabId < tabId) {
            resignLeader()
            leaderTabId = msg.tabId
            store.setState(() => msg.status)
            startLeaderWatch()
          }
          // else: we have the lower ID, keep leadership
        } else {
          leaderTabId = msg.tabId
          if (electionTimer) {
            clearTimeout(electionTimer)
            electionTimer = null
          }
          store.setState(() => msg.status)
          startLeaderWatch()
        }
        break

      case 'heartbeat':
        if (msg.tabId === leaderTabId) {
          lastHeartbeat = Date.now()
        }
        break

      case 'claim':
        if (msg.tabId === tabId) break
        // If a lower-ID tab is claiming, yield our election attempt
        if (msg.tabId < tabId && electionTimer) {
          clearTimeout(electionTimer)
          electionTimer = null
        }
        // If we're already leader, re-announce so the claimer discovers us
        if (isLeader) {
          post({
            type: 'leader',
            tabId,
            status: inner?.store.get() ?? 'disconnected',
          })
        }
        break

      case 'bye':
        if (msg.tabId === leaderTabId) {
          leaderTabId = null
          stopLeaderWatch()
          startElection()
        }
        if (isLeader) cleanupTab(msg.tabId)
        break

      case 'reregister':
        // New leader wants us to re-register our subscriptions
        if (!isLeader) {
          const channels = [...localSubs.keys()]
          const presenceChannels = [...localPresenceSubs.keys()]
          if (channels.length > 0 || presenceChannels.length > 0) {
            post({ type: 'register', tabId, channels, presenceChannels })
          }
        }
        break

      case 'register':
        if (isLeader && msg.tabId !== tabId) {
          for (const ch of msg.channels) addTabChannel(msg.tabId, ch)
          for (const ch of msg.presenceChannels) addTabPresence(msg.tabId, ch)
        }
        break

      // ── Leader → all broadcasts (followers handle these) ───────────────
      case 'status':
        if (!isLeader) store.setState(() => msg.status)
        break

      case 'message':
        if (!isLeader) {
          const cbs = localSubs.get(msg.channel)
          if (cbs) for (const cb of cbs) cb(msg.data)
        }
        break

      case 'presence':
        if (!isLeader) {
          const cbs = localPresenceSubs.get(msg.channel)
          if (cbs) for (const cb of cbs) cb(msg.users)
        }
        break

      case 'subscribeError':
        if (!isLeader) {
          for (const cb of subscribeErrorListeners) {
            cb(msg.channel, msg.reason, msg.code)
          }
        }
        break

      case 'publish:ack':
        if (msg.to === tabId) {
          const pending = pendingPublishes.get(msg.requestId)
          if (pending) {
            clearTimeout(pending.timer)
            pendingPublishes.delete(msg.requestId)
            if (msg.error) pending.reject(new Error(msg.error))
            else pending.resolve()
          }
        }
        break

      // ── Follower → leader requests (leader handles these) ──────────────
      case 'subscribe':
        if (isLeader && msg.tabId !== tabId)
          addTabChannel(msg.tabId, msg.channel)
        break

      case 'unsubscribe':
        if (isLeader && msg.tabId !== tabId)
          removeTabChannel(msg.tabId, msg.channel)
        break

      case 'publish':
        if (isLeader && msg.tabId !== tabId) {
          inner
            ?.publish(msg.channel, msg.data)
            .then(() =>
              post({
                type: 'publish:ack',
                to: msg.tabId,
                requestId: msg.requestId,
              }),
            )
            .catch((err) =>
              post({
                type: 'publish:ack',
                to: msg.tabId,
                requestId: msg.requestId,
                error: String(err),
              }),
            )
        }
        break

      case 'joinPresence':
        if (isLeader && inner && hasPresence(inner))
          inner.joinPresence(msg.channel, msg.data)
        break

      case 'updatePresence':
        if (isLeader && inner && hasPresence(inner))
          inner.updatePresence(msg.channel, msg.data)
        break

      case 'leavePresence':
        if (isLeader && inner && hasPresence(inner))
          inner.leavePresence(msg.channel)
        break

      case 'presenceOn':
        if (isLeader && msg.tabId !== tabId)
          addTabPresence(msg.tabId, msg.channel)
        break

      case 'presenceOff':
        if (isLeader && msg.tabId !== tabId)
          removeTabPresence(msg.tabId, msg.channel)
        break
    }
  }

  // ── Bootstrap: discover or become leader ────────────────────────────────

  post({ type: 'hello', tabId })
  // If no leader responds within 150ms, start election
  const discoveryTimer = setTimeout(() => {
    if (!leaderTabId && !isLeader) startElection()
  }, 150)

  // ── Tab unload cleanup ──────────────────────────────────────────────────

  function onTabClose(): void {
    clearTimeout(discoveryTimer)
    if (electionTimer) {
      clearTimeout(electionTimer)
      electionTimer = null
    }
    if (isLeader) resignLeader()
    post({ type: 'bye', tabId })
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', onTabClose)
    // pagehide fires on mobile Safari where beforeunload may not
    window.addEventListener('pagehide', onTabClose)
  }

  // ── Transport interface ─────────────────────────────────────────────────

  const transport: RealtimeTransport & PresenceCapable = {
    store,

    async connect() {
      userCalledConnect = true
      if (isLeader && inner) {
        return inner.connect()
      }
      // Follower: leader manages the connection. If no leader yet, it will
      // connect once elected because userCalledConnect is now true.
      return Promise.resolve()
    },

    disconnect() {
      userCalledConnect = false
      if (isLeader && inner) {
        inner.disconnect()
        store.setState(() => 'disconnected')
        post({ type: 'status', status: 'disconnected' })
      }
    },

    subscribe(channel, onMessage) {
      if (!localSubs.has(channel)) localSubs.set(channel, new Set())
      localSubs.get(channel)!.add(onMessage)

      if (isLeader) {
        subscribeInner(channel)
      } else if (leaderTabId) {
        post({ type: 'subscribe', tabId, channel })
      }
      // If no leader yet, subscription will be registered via reregister

      return () => {
        const cbs = localSubs.get(channel)
        if (cbs) {
          cbs.delete(onMessage)
          if (cbs.size === 0) {
            localSubs.delete(channel)
            if (isLeader) {
              // Only unsubscribe inner if no follower tabs need this channel
              const followers = channelTabSubs.get(channel)
              if (!followers || followers.size === 0) {
                channelTabSubs.delete(channel)
                unsubscribeInner(channel)
              }
            } else if (leaderTabId) {
              post({ type: 'unsubscribe', tabId, channel })
            }
          }
        }
      }
    },

    async publish(channel, data) {
      if (isLeader && inner) {
        return inner.publish(channel, data)
      }
      const requestId = nextRequestId()
      return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          pendingPublishes.delete(requestId)
          reject(
            new Error(
              `[BroadcastChannelTransport] publish timed out after ${publishTimeout}ms`,
            ),
          )
        }, publishTimeout)
        pendingPublishes.set(requestId, { resolve, reject, timer })
        post({ type: 'publish', tabId, channel, data, requestId })
      })
    },

    joinPresence(channel, data) {
      if (isLeader && inner && hasPresence(inner)) {
        inner.joinPresence(channel, data)
      } else {
        post({ type: 'joinPresence', tabId, channel, data })
      }
    },

    updatePresence(channel, data) {
      if (isLeader && inner && hasPresence(inner)) {
        inner.updatePresence(channel, data)
      } else {
        post({ type: 'updatePresence', tabId, channel, data })
      }
    },

    leavePresence(channel) {
      if (isLeader && inner && hasPresence(inner)) {
        inner.leavePresence(channel)
      } else {
        post({ type: 'leavePresence', tabId, channel })
      }
    },

    onPresenceChange(channel, callback) {
      if (!localPresenceSubs.has(channel))
        localPresenceSubs.set(channel, new Set())
      localPresenceSubs.get(channel)!.add(callback)

      if (isLeader) {
        subscribePresenceInner(channel)
      } else if (leaderTabId) {
        post({ type: 'presenceOn', tabId, channel })
      }

      return () => {
        const cbs = localPresenceSubs.get(channel)
        if (cbs) {
          cbs.delete(callback)
          if (cbs.size === 0) {
            localPresenceSubs.delete(channel)
            if (isLeader) {
              const followers = presenceTabSubs.get(channel)
              if (!followers || followers.size === 0) {
                presenceTabSubs.delete(channel)
                unsubscribePresenceInner(channel)
              }
            } else if (leaderTabId) {
              post({ type: 'presenceOff', tabId, channel })
            }
          }
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
      return localPipeline.register(registration)
    },
  }

  const localPipeline = createHookPipeline()

  return transport
}
