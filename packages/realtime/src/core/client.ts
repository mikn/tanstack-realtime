import { Store } from '@tanstack/store'
import type {
  ConnectionStatus,
  QueryKey,
  RealtimeClient,
  RealtimeClientOptions,
} from './types.js'
import { hasPresence } from './types.js'
import { serializeKey } from './serializeKey.js'

/** Throw a consistent error when a non-presence transport is used for presence. */
function presenceNotSupported(method: string): never {
  throw new Error(
    `[realtime] ${method}() requires the transport to implement PresenceCapable ` +
      `(joinPresence, updatePresence, leavePresence, onPresenceChange). ` +
      `Check hasPresence(transport) before calling presence methods, or use a ` +
      `transport that includes presence support (Node preset, Centrifugo adapter, SharedWorker).`,
  )
}

/**
 * Creates a framework-agnostic realtime client that wraps a transport.
 *
 * @example
 * import { createRealtimeClient } from '@tanstack/realtime'
 * import { nodeTransport } from '@tanstack/realtime-preset-node'
 *
 * export const realtimeClient = createRealtimeClient({
 *   transport: nodeTransport(),
 * })
 */
export function createRealtimeClient(
  options: RealtimeClientOptions,
): RealtimeClient {
  const { transport } = options

  // Mirror the transport's status into a typed store so React / Vue / Solid
  // adapters can observe it via their respective `useStore` implementations.
  const store = new Store<{ status: ConnectionStatus }>({
    status: transport.store.state,
  })

  // The status subscription is lazily managed so that destroy() + connect()
  // round-trips are safe — the client can be destroyed and reconnected without
  // creating a second instance. This is important for React Strict Mode where
  // provider effects fire twice (mount → unmount → remount).
  let statusSub: { unsubscribe(): void } | null = null

  function ensureStatusSubscription(): void {
    if (statusSub !== null) return
    statusSub = transport.store.subscribe((status) => {
      store.setState(() => ({ status }))
    })
  }

  // Subscribe immediately so the store reflects transport state from the start.
  ensureStatusSubscription()

  const client: RealtimeClient = {
    store,

    async connect() {
      // Re-establish the status subscription if destroy() was called before.
      ensureStatusSubscription()
      return transport.connect()
    },

    disconnect() {
      transport.disconnect()
    },

    destroy() {
      statusSub?.unsubscribe()
      statusSub = null
    },

    subscribe(channel, onMessage) {
      return transport.subscribe(channel, onMessage)
    },

    async publish(keyOrChannel, data) {
      const channel =
        typeof keyOrChannel === 'string'
          ? keyOrChannel
          : serializeKey(keyOrChannel)
      return transport.publish(channel, data)
    },

    joinPresence(channel, data) {
      if (!hasPresence(transport)) presenceNotSupported('joinPresence')
      transport.joinPresence(channel, data)
    },

    updatePresence(channel, data) {
      if (!hasPresence(transport)) presenceNotSupported('updatePresence')
      transport.updatePresence(channel, data)
    },

    leavePresence(channel) {
      if (!hasPresence(transport)) presenceNotSupported('leavePresence')
      transport.leavePresence(channel)
    },

    onPresenceChange(channel, callback) {
      if (!hasPresence(transport)) presenceNotSupported('onPresenceChange')
      return transport.onPresenceChange(channel, callback)
    },
  }

  return client
}
