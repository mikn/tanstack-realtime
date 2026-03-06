import { Store } from '@tanstack/store'
import { createHookPipeline } from '../core/hookPipeline.js'
import type { HookHandle, HookRegistration } from '../core/hooks.js'
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

  const pipeline = createHookPipeline()

  // Track channel ref counts for hook lifecycle.
  const channelRefCounts = new Map<string, number>()
  const activeChannelsSet = new Set<string>()

  // Track connection status for hook invocation.
  let previousStatus: ConnectionStatus = initialStatus
  let wasEverConnected = initialStatus === 'connected'
  let wasDisconnected = false

  store.subscribe((status) => {
    const prev = previousStatus
    previousStatus = status

    if (prev === 'connected' && status !== 'connected') {
      pipeline.runOnDisconnect(status as 'disconnected' | 'reconnecting')
    }

    if (status === 'reconnecting' || status === 'disconnected') {
      wasDisconnected = true
    }

    if (status === 'connected') {
      if (wasDisconnected && wasEverConnected) {
        void pipeline.runOnReconnect(activeChannelsSet)
      }
      void pipeline.runOnConnect()
      wasEverConnected = true
      wasDisconnected = false
    }
  })

  return {
    store,

    hook(registration: HookRegistration): HookHandle {
      return pipeline.register(registration)
    },

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

      const count = channelRefCounts.get(channel) ?? 0
      channelRefCounts.set(channel, count + 1)
      if (count === 0) {
        activeChannelsSet.add(channel)
        pipeline.runOnChannelSubscribe(channel)
      }

      const wrappedCallback = (raw: unknown) => {
        const result = pipeline.runBeforeDeliver(channel, raw)
        if (result === false) return
        onMessage(result.data)
      }
      listeners.get(channel)!.add(wrappedCallback)

      return () => {
        const set = listeners.get(channel)
        if (set) {
          set.delete(wrappedCallback)
          if (set.size === 0) listeners.delete(channel)
        }

        const newCount = (channelRefCounts.get(channel) ?? 1) - 1
        if (newCount <= 0) {
          channelRefCounts.delete(channel)
          activeChannelsSet.delete(channel)
          pipeline.runOnChannelUnsubscribe(channel)
        } else {
          channelRefCounts.set(channel, newCount)
        }
      }
    },

    publish(channel, data) {
      const result = pipeline.runBeforePublish(channel, data)
      if (result === false) return Promise.resolve()
      publishLog.push({ channel, data: result.data, timestamp: Date.now() })
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
