/**
 * Shared transport — deduplicates WebSocket connections across browser tabs
 * using the BroadcastChannel API.
 *
 * One tab is elected "leader" and holds the real WebSocket connection.
 * Other tabs ("followers") relay publishes and receive messages through
 * the BroadcastChannel.
 *
 * If the leader tab closes, a follower is promoted automatically.
 *
 * This reduces server load (1 WebSocket per user vs. 1 per tab) and
 * deduplicates presence entries.
 */

import { Store } from '@tanstack/store'
import type { RealtimeTransport, ConnectionStatus, PresenceUser } from './types.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SharedTransportOptions {
  /**
   * BroadcastChannel name. All tabs with the same name share one connection.
   * @default 'tanstack-realtime'
   */
  channelName?: string

  /**
   * Factory that creates the underlying transport. Only called on the
   * leader tab.
   */
  createTransport: () => RealtimeTransport

  /**
   * How long (ms) followers wait before assuming the leader is dead after
   * a leader heartbeat is missed.
   * @default 5000
   */
  leaderTimeout?: number
}

// Internal message types for inter-tab communication.
type BroadcastMsg =
  | { type: 'leader:announce'; tabId: string }
  | { type: 'leader:heartbeat'; tabId: string }
  | { type: 'leader:resign'; tabId: string }
  | { type: 'status'; status: ConnectionStatus }
  | { type: 'message'; channel: string; data: unknown }
  | { type: 'publish'; channel: string; data: unknown; requestId: string }
  | { type: 'publish:ack'; requestId: string; error?: string }
  | { type: 'subscribe'; channel: string; tabId: string }
  | { type: 'unsubscribe'; channel: string; tabId: string }

export interface SharedTransport extends RealtimeTransport {
  /** Whether this tab is the current leader. */
  readonly isLeader: boolean
  /** Tear down the shared transport and release the BroadcastChannel. */
  destroy(): void
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Create a shared transport that coordinates across browser tabs.
 *
 * @example
 * const transport = createSharedTransport({
 *   channelName: 'my-app-realtime',
 *   createTransport: () => centrifugoTransport({ url: 'wss://...' }),
 * })
 * const client = createRealtimeClient({ transport })
 */
export function createSharedTransport(
  options: SharedTransportOptions,
): SharedTransport {
  const {
    channelName = 'tanstack-realtime',
    createTransport,
    leaderTimeout = 5000,
  } = options

  const tabId = `tab-${Math.random().toString(36).slice(2)}-${Date.now()}`
  const store = new Store<ConnectionStatus>('disconnected')

  // Local subscription tracking.
  const localSubscriptions = new Map<string, Set<(data: unknown) => void>>()
  const presenceCallbacks = new Map<
    string,
    Set<(users: ReadonlyArray<PresenceUser>) => void>
  >()

  let bc: BroadcastChannel
  let inner: RealtimeTransport | null = null
  let isLeader = false
  let leaderId: string | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let leaderCheckTimer: ReturnType<typeof setTimeout> | null = null
  let lastLeaderHeartbeat = 0
  let destroyed = false

  // Pending publish requests (follower → leader → ack).
  const pendingPublishes = new Map<
    string,
    { resolve: () => void; reject: (err: Error) => void }
  >()

  function broadcast(msg: BroadcastMsg): void {
    try {
      bc.postMessage(msg)
    } catch {
      // BroadcastChannel may be closed.
    }
  }

  function becomeLeader(): void {
    if (isLeader || destroyed) return
    isLeader = true
    leaderId = tabId

    inner = createTransport()

    // Mirror inner transport status to our store and broadcast to followers.
    inner.store.subscribe((status) => {
      store.setState(() => status)
      broadcast({ type: 'status', status })
    })

    // Start heartbeat so followers know we're alive.
    heartbeatTimer = setInterval(() => {
      broadcast({ type: 'leader:heartbeat', tabId })
    }, leaderTimeout / 2)

    broadcast({ type: 'leader:announce', tabId })
  }

  function resignLeadership(): void {
    if (!isLeader) return
    isLeader = false

    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }

    broadcast({ type: 'leader:resign', tabId })

    if (inner) {
      inner.disconnect()
      inner = null
    }
  }

  function tryBecomeLeader(): void {
    // Simple election: announce ourselves. If no other leader responds
    // within a short window, we become leader.
    broadcast({ type: 'leader:announce', tabId })
    setTimeout(() => {
      if (!leaderId || leaderId === tabId) {
        becomeLeader()
      }
    }, 100 + Math.random() * 100)
  }

  function handleMessage(msg: BroadcastMsg): void {
    if (destroyed) return

    switch (msg.type) {
      case 'leader:announce':
        if (msg.tabId !== tabId) {
          leaderId = msg.tabId
          lastLeaderHeartbeat = Date.now()
        }
        break

      case 'leader:heartbeat':
        if (msg.tabId !== tabId) {
          leaderId = msg.tabId
          lastLeaderHeartbeat = Date.now()
        }
        break

      case 'leader:resign':
        if (msg.tabId === leaderId) {
          leaderId = null
          // Leader left — try to become the new leader.
          tryBecomeLeader()
        }
        break

      case 'status':
        if (!isLeader) {
          store.setState(() => msg.status)
        }
        break

      case 'message':
        // Dispatch to local subscribers.
        {
          const listeners = localSubscriptions.get(msg.channel)
          if (listeners) {
            for (const cb of listeners) cb(msg.data)
          }
        }
        break

      case 'publish':
        // Leader receives publish requests from followers.
        if (isLeader && inner) {
          inner
            .publish(msg.channel, msg.data)
            .then(() => {
              broadcast({
                type: 'publish:ack',
                requestId: msg.requestId,
              })
            })
            .catch((err) => {
              broadcast({
                type: 'publish:ack',
                requestId: msg.requestId,
                error: String(err),
              })
            })
        }
        break

      case 'publish:ack': {
        const pending = pendingPublishes.get(msg.requestId)
        if (pending) {
          pendingPublishes.delete(msg.requestId)
          if (msg.error) {
            pending.reject(new Error(msg.error))
          } else {
            pending.resolve()
          }
        }
        break
      }

      case 'subscribe':
      case 'unsubscribe':
        // Leader manages actual subscriptions.
        if (isLeader && inner) {
          if (msg.type === 'subscribe') {
            // Subscribe on the inner transport if not already.
            if (!localSubscriptions.has(msg.channel)) {
              const unsub = inner.subscribe(msg.channel, (data) => {
                // Broadcast to all tabs (including self).
                broadcast({ type: 'message', channel: msg.channel, data })
                // Also dispatch locally on leader.
                const listeners = localSubscriptions.get(msg.channel)
                if (listeners) {
                  for (const cb of listeners) cb(data)
                }
              })
              // Store the unsub function... we track it differently.
              // For simplicity, the leader subscribes once per channel.
              localSubscriptions.set(msg.channel, new Set())
              // Store unsub via a side channel (closure-based tracking).
              ;(localSubscriptions.get(msg.channel) as unknown as { _unsub: () => void })._unsub = unsub
            }
          }
        }
        break
    }
  }

  // Initialize BroadcastChannel.
  bc = new BroadcastChannel(channelName)
  bc.onmessage = (event) => handleMessage(event.data as BroadcastMsg)

  // Start leader election.
  tryBecomeLeader()

  // Monitor leader health.
  leaderCheckTimer = setInterval(() => {
    if (!isLeader && leaderId && Date.now() - lastLeaderHeartbeat > leaderTimeout) {
      leaderId = null
      tryBecomeLeader()
    }
  }, leaderTimeout / 2) as unknown as ReturnType<typeof setTimeout>

  const transport: SharedTransport = {
    store,

    get isLeader() {
      return isLeader
    },

    async connect() {
      if (isLeader && inner) {
        return inner.connect()
      }
      // Followers wait for the leader to announce connected status.
      if (store.state === 'connected') return
      return new Promise<void>((resolve) => {
        const unsub = store.subscribe((status) => {
          if (status === 'connected') {
            unsub.unsubscribe()
            resolve()
          }
        })
      })
    },

    disconnect() {
      if (isLeader && inner) {
        inner.disconnect()
      }
    },

    subscribe(channel, onMessage) {
      if (!localSubscriptions.has(channel)) {
        localSubscriptions.set(channel, new Set())

        // If we're the leader, subscribe on the inner transport.
        if (isLeader && inner) {
          const unsub = inner.subscribe(channel, (data) => {
            // Broadcast to followers.
            broadcast({ type: 'message', channel, data })
            // Dispatch locally.
            const listeners = localSubscriptions.get(channel)
            if (listeners) {
              for (const cb of listeners) cb(data)
            }
          })
          ;(localSubscriptions.get(channel) as unknown as { _unsub: () => void })._unsub = unsub
        } else {
          // Tell the leader to subscribe.
          broadcast({ type: 'subscribe', channel, tabId })
        }
      }

      const listeners = localSubscriptions.get(channel)!
      listeners.add(onMessage)

      return () => {
        listeners.delete(onMessage)
        if (listeners.size === 0) {
          localSubscriptions.delete(channel)
          if (isLeader && inner) {
            const stored = listeners as unknown as { _unsub?: () => void }
            stored._unsub?.()
          } else {
            broadcast({ type: 'unsubscribe', channel, tabId })
          }
        }
      }
    },

    async publish(channel, data) {
      if (isLeader && inner) {
        return inner.publish(channel, data)
      }
      // Relay through the leader.
      const requestId = `${tabId}-${Math.random().toString(36).slice(2)}`
      return new Promise<void>((resolve, reject) => {
        pendingPublishes.set(requestId, { resolve, reject })
        broadcast({ type: 'publish', channel, data, requestId })

        // Timeout after 10 seconds.
        setTimeout(() => {
          if (pendingPublishes.has(requestId)) {
            pendingPublishes.delete(requestId)
            reject(new Error('Publish request timed out'))
          }
        }, 10000)
      })
    },

    joinPresence(channel, data) {
      if (isLeader && inner) {
        inner.joinPresence(channel, data)
      }
    },

    updatePresence(channel, data) {
      if (isLeader && inner) {
        inner.updatePresence(channel, data)
      }
    },

    leavePresence(channel) {
      if (isLeader && inner) {
        inner.leavePresence(channel)
      }
    },

    onPresenceChange(channel, callback) {
      if (!presenceCallbacks.has(channel)) {
        presenceCallbacks.set(channel, new Set())
      }
      presenceCallbacks.get(channel)!.add(callback)

      let innerUnsub: (() => void) | null = null
      if (isLeader && inner) {
        innerUnsub = inner.onPresenceChange(channel, (users) => {
          const cbs = presenceCallbacks.get(channel)
          if (cbs) for (const cb of cbs) cb(users)
        })
      }

      return () => {
        presenceCallbacks.get(channel)?.delete(callback)
        innerUnsub?.()
      }
    },

    destroy() {
      destroyed = true
      resignLeadership()

      if (leaderCheckTimer) {
        clearInterval(leaderCheckTimer as unknown as number)
        leaderCheckTimer = null
      }

      try {
        bc.close()
      } catch {
        // Already closed.
      }

      pendingPublishes.clear()
      localSubscriptions.clear()
      presenceCallbacks.clear()
    },
  }

  return transport
}
