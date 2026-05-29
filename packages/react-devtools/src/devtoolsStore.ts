/**
 * DevtoolsStore — framework-agnostic state collector for the devtools panel.
 *
 * Attaches to a RealtimeClient via the hook system to observe channels,
 * messages, and connection lifecycle without modifying transport behaviour.
 *
 * Optionally tracks presence state (if the transport supports it) and
 * offline queue state (if an OfflineQueueHandle is provided).
 */

import { Store } from '@tanstack/store'
import type {
  HookHandle,
  OfflineQueueHandle,
  PresenceUser,
  RealtimeClient,
} from '@realtimejs/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DevtoolsMessage {
  id: number
  channel: string
  direction: 'inbound' | 'outbound'
  data: unknown
  timestamp: number
}

export interface ChannelInfo {
  channel: string
  subscribedAt: number
  messageCount: number
  lastMessageAt: number | null
  presenceUsers: ReadonlyArray<PresenceUser>
}

export interface DevtoolsEvent {
  id: number
  type:
    | 'connect'
    | 'disconnect'
    | 'reconnect'
    | 'subscribe'
    | 'unsubscribe'
    | 'presence'
    | 'queue'
  detail: string
  timestamp: number
}

export interface OfflineQueueSnapshot {
  pending: number
  flushed: number
  isFlushing: boolean
}

export interface DevtoolsState {
  /** Active channels with subscriber and presence tracking. */
  channels: ReadonlyMap<string, ChannelInfo>
  /** Rolling message log (bounded). */
  messages: ReadonlyArray<DevtoolsMessage>
  /** Connection lifecycle events. */
  events: ReadonlyArray<DevtoolsEvent>
  /** Offline queue snapshot (null if no queue is attached). */
  offlineQueue: OfflineQueueSnapshot | null
  /** Timestamp of last state change. */
  updatedAt: number
}

export interface DevtoolsStoreOptions {
  /** Attach an offline queue handle to track pending/flushed messages. */
  offlineQueue?: OfflineQueueHandle
  /**
   * Automatically track presence on channels when the transport supports it.
   * @default true
   */
  trackPresence?: boolean
}

export interface DevtoolsStoreHandle {
  store: Store<DevtoolsState>
  /** Detach from the client and stop collecting. */
  destroy: () => void
  /** Clear all collected messages and events. */
  clear: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_MESSAGES = 200
const MAX_EVENTS = 200

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createDevtoolsStore(
  client: RealtimeClient,
  options: DevtoolsStoreOptions = {},
): DevtoolsStoreHandle {
  const { offlineQueue, trackPresence = true } = options

  let nextMsgId = 0
  let nextEventId = 0

  const store = new Store<DevtoolsState>({
    channels: new Map(),
    messages: [],
    events: [],
    offlineQueue: offlineQueue
      ? { pending: 0, flushed: 0, isFlushing: false }
      : null,
    updatedAt: Date.now(),
  })

  // Track presence unsubscribe functions per channel.
  const presenceUnsubs = new Map<string, () => void>()

  function pushMessage(msg: Omit<DevtoolsMessage, 'id'>) {
    store.setState((prev) => {
      const messages = [...prev.messages, { ...msg, id: nextMsgId++ }]
      if (messages.length > MAX_MESSAGES) {
        messages.splice(0, messages.length - MAX_MESSAGES)
      }

      const channels = new Map(prev.channels)
      const existing = channels.get(msg.channel)
      if (existing) {
        channels.set(msg.channel, {
          ...existing,
          messageCount: existing.messageCount + 1,
          lastMessageAt: msg.timestamp,
        })
      }

      return { ...prev, channels, messages, updatedAt: Date.now() }
    })
  }

  function pushEvent(type: DevtoolsEvent['type'], detail: string) {
    store.setState((prev) => {
      const events = [
        ...prev.events,
        { id: nextEventId++, type, detail, timestamp: Date.now() },
      ]
      if (events.length > MAX_EVENTS) {
        events.splice(0, events.length - MAX_EVENTS)
      }
      return { ...prev, events, updatedAt: Date.now() }
    })
  }

  // -- Presence tracking ----------------------------------------------------

  function startPresenceTracking(channel: string) {
    // Only if transport supports presence and tracking is enabled.
    if (!trackPresence) return
    try {
      const unsub = client.onPresenceChange(
        channel,
        (users: ReadonlyArray<PresenceUser>) => {
          store.setState((prev) => {
            const channels = new Map(prev.channels)
            const existing = channels.get(channel)
            if (existing) {
              channels.set(channel, { ...existing, presenceUsers: users })
            }
            return { ...prev, channels, updatedAt: Date.now() }
          })
          pushEvent(
            'presence',
            `${channel}: ${users.length} user${users.length === 1 ? '' : 's'}`,
          )
        },
      )
      presenceUnsubs.set(channel, unsub)
    } catch {
      // Transport doesn't support presence — silently skip.
    }
  }

  function stopPresenceTracking(channel: string) {
    const unsub = presenceUnsubs.get(channel)
    if (unsub) {
      unsub()
      presenceUnsubs.delete(channel)
    }
  }

  // -- Offline queue tracking -----------------------------------------------

  let queueSub: { unsubscribe: () => void } | undefined
  if (offlineQueue) {
    queueSub = offlineQueue.store.subscribe(() => {
      const qs = offlineQueue.store.state
      store.setState((prev) => ({
        ...prev,
        offlineQueue: {
          pending: qs.pending.length,
          flushed: qs.flushed,
          isFlushing: qs.isFlushing,
        },
        updatedAt: Date.now(),
      }))
    })
  }

  // -- Hook registration ----------------------------------------------------

  // Register a low-priority hook so we observe after all user hooks.
  const hookHandle: HookHandle = client.hook({
    name: 'devtools',
    priority: 999,
    hooks: {
      onConnect() {
        pushEvent('connect', 'Connected')
      },
      onDisconnect(status) {
        pushEvent('disconnect', `Disconnected → ${status}`)
      },
      onReconnect(activeChannels) {
        pushEvent(
          'reconnect',
          `Reconnected (${activeChannels.size} active channel${activeChannels.size === 1 ? '' : 's'})`,
        )
      },
      beforePublish(channel, data) {
        pushMessage({
          channel,
          direction: 'outbound',
          data,
          timestamp: Date.now(),
        })
        // Always pass through — devtools never suppresses.
        return { data }
      },
      beforeDeliver(channel, data) {
        pushMessage({
          channel,
          direction: 'inbound',
          data,
          timestamp: Date.now(),
        })
        return { data }
      },
      onChannelSubscribe(channel) {
        store.setState((prev) => {
          const channels = new Map(prev.channels)
          channels.set(channel, {
            channel,
            subscribedAt: Date.now(),
            messageCount: 0,
            lastMessageAt: null,
            presenceUsers: [],
          })
          return { ...prev, channels, updatedAt: Date.now() }
        })
        pushEvent('subscribe', channel)
        startPresenceTracking(channel)
      },
      onChannelUnsubscribe(channel) {
        stopPresenceTracking(channel)
        store.setState((prev) => {
          const channels = new Map(prev.channels)
          channels.delete(channel)
          return { ...prev, channels, updatedAt: Date.now() }
        })
        pushEvent('unsubscribe', channel)
      },
    },
  })

  return {
    store,
    destroy() {
      hookHandle.unhook()
      for (const unsub of presenceUnsubs.values()) {
        unsub()
      }
      presenceUnsubs.clear()
      queueSub?.unsubscribe()
    },
    clear() {
      nextMsgId = 0
      nextEventId = 0
      store.setState((prev) => ({
        ...prev,
        messages: [],
        events: [],
        updatedAt: Date.now(),
      }))
    },
  }
}
