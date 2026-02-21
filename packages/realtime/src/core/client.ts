import { Store } from '@tanstack/store'
import type {
  ConnectionStatus,
  QueryKey,
  RealtimeClient,
  RealtimeClientOptions,
} from './types.js'
import { serializeKey } from './serializeKey.js'

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

  // Keep a reference so we can clean up in destroy().
  const statusSub = transport.store.subscribe((status) => {
    store.setState(() => ({ status }))
  })

  const client: RealtimeClient = {
    store,

    async connect() {
      await transport.connect()
    },

    disconnect() {
      transport.disconnect()
    },

    destroy() {
      statusSub.unsubscribe()
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
      transport.joinPresence(channel, data)
    },

    updatePresence(channel, data) {
      transport.updatePresence(channel, data)
    },

    leavePresence(channel) {
      transport.leavePresence(channel)
    },

    onPresenceChange(channel, callback) {
      return transport.onPresenceChange(channel, callback)
    },
  }

  return client
}
