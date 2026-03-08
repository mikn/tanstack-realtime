/**
 * DevtoolsStore — framework-agnostic state collector for the devtools panel.
 *
 * Attaches to a RealtimeClient via the hook system to observe channels,
 * messages, and connection lifecycle without modifying transport behaviour.
 */

import { Store } from '@tanstack/store'
import type { HookHandle, RealtimeClient } from '@tanstack/realtime'

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
}

export interface DevtoolsEvent {
  id: number
  type: 'connect' | 'disconnect' | 'reconnect' | 'subscribe' | 'unsubscribe'
  detail: string
  timestamp: number
}

export interface DevtoolsState {
  /** Active channels with subscriber tracking. */
  channels: ReadonlyMap<string, ChannelInfo>
  /** Rolling message log (bounded). */
  messages: ReadonlyArray<DevtoolsMessage>
  /** Connection lifecycle events. */
  events: ReadonlyArray<DevtoolsEvent>
  /** Timestamp of last state change. */
  updatedAt: number
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
): DevtoolsStoreHandle {
  let nextMsgId = 0
  let nextEventId = 0

  const store = new Store<DevtoolsState>({
    channels: new Map(),
    messages: [],
    events: [],
    updatedAt: Date.now(),
  })

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
          })
          return { ...prev, channels, updatedAt: Date.now() }
        })
        pushEvent('subscribe', channel)
      },
      onChannelUnsubscribe(channel) {
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
