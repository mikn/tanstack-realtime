import { Store } from '@tanstack/store'
import type {
  ConnectionStatus,
  PresenceUser,
  QueryKey,
  RealtimeTransport,
} from './types.js'
import { serializeKey } from './serializeKey.js'

export interface RealtimeClientOptions {
  /** The transport implementation to use (e.g. nodeTransport()). */
  transport: RealtimeTransport
}

export interface RealtimeClient {
  /** TanStack Store holding the current connection status. */
  readonly store: Store<{ status: ConnectionStatus }>

  /** Open the connection. Collections subscribe to channels after this. */
  connect(): Promise<void>
  /** Close the connection. Collections stop receiving live updates. */
  disconnect(): void
  /**
   * Tear down the client and release all internal resources.
   * Call this when the client will no longer be used (e.g. in component cleanup
   * or test teardown) to prevent memory leaks from store subscriptions.
   */
  destroy(): void

  /** Subscribe to a serialized channel key. Returns an unsubscribe function. */
  subscribe(channel: string, onMessage: (data: unknown) => void): () => void

  /** Publish data to a serialized channel key. */
  publish(key: QueryKey | string, data: unknown): Promise<void>

  // Presence helpers (serialized channel key)
  joinPresence(channel: string, data: unknown): void
  updatePresence(channel: string, data: unknown): void
  leavePresence(channel: string): void
  onPresenceChange(
    channel: string,
    callback: (users: ReadonlyArray<PresenceUser>) => void,
  ): () => void
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
    status: transport.store.get(),
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
