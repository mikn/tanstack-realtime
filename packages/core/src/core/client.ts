import { Store } from '@tanstack/store'
import { hasPresence } from './types.js'
import { serializeKey } from './serializeKey.js'
import { generateClientId } from './crdt.js'
import type {
  ConnectionStatus,
  RealtimeClient,
  RealtimeClientOptions,
} from './types.js'

/** Throw a consistent error when a non-presence transport is used for presence. */
function presenceNotSupported(method: string): never {
  throw new Error(
    `[realtime] ${method}() requires the transport to implement PresenceCapable ` +
      `(joinPresence, updatePresence, leavePresence, onPresenceChange). ` +
      `Check hasPresence(transport) before calling presence methods, or use a ` +
      `transport that includes presence support (Centrifugo adapter, SharedWorker).`,
  )
}

/**
 * Creates a framework-agnostic realtime client that wraps a transport.
 *
 * @example
 * import { createRealtimeClient } from '@realtimejs/core'
 * import { sseTransport } from '@realtimejs/adapter-sse'
 *
 * export const realtimeClient = createRealtimeClient({
 *   transport: sseTransport({ url: '/api/core/sse' }),
 * })
 */
export function createRealtimeClient(
  options: RealtimeClientOptions,
): RealtimeClient {
  const { transport } = options

  const store = new Store<{ status: ConnectionStatus }>({
    status: transport.store.get(),
  })

  let statusSub: { unsubscribe: () => void } | null = null

  function ensureStatusSubscription(): void {
    if (statusSub !== null) return
    statusSub = transport.store.subscribe((status) => {
      store.setState(() => ({ status }))
    })
  }

  ensureStatusSubscription()

  const clientId = generateClientId()

  const client: RealtimeClient = {
    clientId,
    store,

    async connect() {
      ensureStatusSubscription()
      return transport.connect()
    },

    disconnect() {
      transport.disconnect()
    },

    destroy() {
      statusSub?.unsubscribe()
      statusSub = null
      transport.disconnect()
    },

    subscribe<T = unknown>(channel: string, onMessage: (data: T) => void) {
      return transport.subscribe(channel, onMessage as (data: unknown) => void)
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

    onSubscribeError(callback) {
      if (transport.onSubscribeError) {
        return transport.onSubscribeError(callback)
      }
      return () => {}
    },

    hook(registration) {
      return transport.hook(registration)
    },
  }

  return client
}
