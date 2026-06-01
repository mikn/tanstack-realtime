import { Store } from '@tanstack/store'
import { createHookPipeline } from '../core/hookPipeline.js'
import type { HookHandle, HookRegistration } from '../core/hooks.js'
import type {
  ConnectionStatus,
  RealtimeTransport,
  TransportCapabilities,
} from '../core/types.js'

export interface MockTransportOptions {
  /** Initial status. @default 'connected' */
  initialStatus?: ConnectionStatus
  /**
   * Override the transport's declared {@link TransportCapabilities}.
   *
   * Defaults to a non-presence transport
   * (`{ presence: false, serverAssistedRecovery: false, history: false, ephemeral: true }`).
   * Pass arbitrary flags to exercise capability-gated code paths in tests
   * (e.g. the conformance kit's capability-honesty battery).
   */
  capabilities?: TransportCapabilities
}

/** Default capabilities for the base (non-presence) mock transport. */
const DEFAULT_MOCK_CAPABILITIES: TransportCapabilities = {
  presence: false,
  serverAssistedRecovery: false,
  history: false,
  ephemeral: true,
}

/** Recorded message from a publish call. */
export interface PublishRecord {
  channel: string
  data: unknown
  timestamp: number
}

export interface MockTransport extends RealtimeTransport {
  /**
   * Simulate the provider/server delivering a message on a channel.
   *
   * Delivery models a real provider: a message reaches the subscriber ONLY
   * when the channel is currently subscribed AT THE PROVIDER. After
   * {@link MockTransport.simulateDisconnect} the provider-side subscription set
   * is dropped, so messages are NOT delivered until the transport
   * re-subscribes (which it does automatically on
   * {@link MockTransport.simulateReconnect}).
   */
  simulateMessage: (channel: string, data: unknown) => void
  /**
   * Simulate the transport disconnecting unexpectedly.
   *
   * Drops the provider-side subscription set: messages emitted via
   * {@link MockTransport.simulateMessage} while disconnected are NOT delivered.
   * The subscription *intent* (what the transport wants to be subscribed to)
   * is retained so it can be re-sent on reconnect.
   */
  simulateDisconnect: () => void
  /**
   * Simulate the transport reconnecting.
   *
   * Re-establishes the provider-side subscription set from the currently-active
   * subscription intent — mimicking the real {@link RealtimeTransport} contract
   * that "subscribe is deferred and re-sent on the next connection, including
   * after reconnects". After this, messages on still-subscribed channels are
   * delivered again.
   */
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
  const {
    initialStatus = 'connected',
    capabilities = DEFAULT_MOCK_CAPABILITIES,
  } = options

  const store = new Store<ConnectionStatus>(initialStatus)
  const listeners = new Map<string, Set<(data: unknown) => void>>()
  /**
   * Channels currently subscribed AT THE PROVIDER. This is distinct from the
   * subscription *intent* tracked by `listeners`/`activeChannelsSet`: on
   * disconnect the provider drops these (delivery stops); on reconnect they are
   * re-established from the active intent (auto re-subscribe). `simulateMessage`
   * delivers only to channels in this set.
   */
  const providerSubscribed = new Set<string>()
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
      // Auto re-subscribe on (re)connect: re-send the active subscription
      // intent to the provider, mirroring the real transport contract that
      // deferred subscribes are re-sent on the next connection.
      for (const channel of activeChannelsSet) providerSubscribed.add(channel)
      if (wasDisconnected && wasEverConnected) {
        void pipeline.runOnReconnect(activeChannelsSet)
      }
      void pipeline.runOnConnect()
      wasEverConnected = true
      wasDisconnected = false
    }

    if (status !== 'connected') {
      // The provider drops every subscription whenever the connection is not
      // live (disconnected/reconnecting). Delivery is suspended until the
      // transport re-subscribes on the next connect.
      providerSubscribed.clear()
    }
  })

  return {
    store,
    capabilities,

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
        // Establish the provider-side subscription when connected. If the
        // transport is currently disconnected the subscribe is deferred — the
        // intent (activeChannelsSet) is retained and re-sent on reconnect.
        if (store.get() === 'connected') providerSubscribed.add(channel)
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
          providerSubscribed.delete(channel)
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
      // Provider only delivers to channels currently subscribed at the
      // provider. After a disconnect (until re-subscribe on reconnect) this set
      // is empty, so delivery is correctly suspended.
      if (!providerSubscribed.has(channel)) return
      const set = listeners.get(channel)
      if (set) {
        for (const cb of set) cb(data)
      }
    },

    simulateDisconnect() {
      // The provider drops every subscription on disconnect (handled by the
      // store subscriber above) — delivery is suspended until the transport
      // re-subscribes. The intent (activeChannelsSet) is preserved so it can be
      // re-sent on reconnect.
      store.setState(() => 'reconnecting')
    },

    simulateReconnect() {
      // Auto re-subscribe is handled by the store subscriber above: the active
      // subscription intent is re-sent to the provider on the 'connected'
      // transition, mirroring the real transport contract.
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
