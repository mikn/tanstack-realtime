import { Store } from '@tanstack/store'
import type { ConnectionStatus, RealtimeTransport } from '../core/types.js'

export interface MockTransportOptions {
  /** Initial status. @default 'connected' */
  initialStatus?: ConnectionStatus
}

/** Recorded message from a publish call. */
export interface PublishRecord {
  channel: string
  data: unknown
  timestamp: number
}

export interface MockTransport extends RealtimeTransport {
  /** Simulate receiving a message on a channel from the "server". */
  simulateMessage: (channel: string, data: unknown) => void
  /** Simulate the transport disconnecting unexpectedly. */
  simulateDisconnect: () => void
  /** Simulate the transport reconnecting. */
  simulateReconnect: () => void
  /** All messages published through this transport (for assertions). */
  readonly publishLog: ReadonlyArray<PublishRecord>
  /** All channels currently subscribed to. */
  readonly activeChannels: ReadonlySet<string>
  /** Clear the publish log. */
  clearLog: () => void
  /** Register a callback for subscribe errors. */
  onSubscribeError: (
    callback: (channel: string, reason: string, code?: number) => void,
  ) => () => void
  /** Simulate a subscribe error from the server. */
  simulateSubscribeError: (
    channel: string,
    reason: string,
    code?: number,
  ) => void
}

export function createMockTransport(
  options: MockTransportOptions = {},
): MockTransport {
  const { initialStatus = 'connected' } = options

  const store = new Store<ConnectionStatus>(initialStatus)
  const listeners = new Map<string, Set<(data: unknown) => void>>()
  const publishLog: Array<PublishRecord> = []
  const subscribeErrorListeners = new Set<
    (channel: string, reason: string, code?: number) => void
  >()

  return {
    store,

    connect() {
      store.setState(() => 'connecting')
      store.setState(() => 'connected')
      return Promise.resolve()
    },

    disconnect() {
      store.setState(() => 'disconnected')
    },

    subscribe(channel, onMessage) {
      if (!listeners.has(channel)) {
        listeners.set(channel, new Set())
      }
      listeners.get(channel)!.add(onMessage)

      return () => {
        const set = listeners.get(channel)
        if (set) {
          set.delete(onMessage)
          if (set.size === 0) listeners.delete(channel)
        }
      }
    },

    publish(channel, data) {
      publishLog.push({ channel, data, timestamp: Date.now() })
      return Promise.resolve()
    },

    onSubscribeError(callback) {
      subscribeErrorListeners.add(callback)
      return () => {
        subscribeErrorListeners.delete(callback)
      }
    },

    // --- Mock control methods ---

    simulateMessage(channel, data) {
      const set = listeners.get(channel)
      if (set) {
        for (const cb of set) cb(data)
      }
    },

    simulateDisconnect() {
      store.setState(() => 'reconnecting')
    },

    simulateReconnect() {
      store.setState(() => 'connected')
    },

    simulateSubscribeError(channel, reason, code) {
      for (const cb of subscribeErrorListeners) {
        cb(channel, reason, code)
      }
    },

    get publishLog() {
      return publishLog
    },

    get activeChannels() {
      return new Set(listeners.keys())
    },

    clearLog() {
      publishLog.length = 0
    },
  }
}
