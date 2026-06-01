import { Store } from '@tanstack/store'
import { getCapabilities, hasPresence } from './types.js'
import { serializeKey } from './serializeKey.js'
import { generateClientId } from './crdt.js'
import type {
  ConnectionStatus,
  RealtimeClient,
  RealtimeClientOptions,
} from './types.js'

/**
 * Throw a consistent, actionable error when a non-presence-capable transport
 * is used for a presence operation. The message is capability-based: it points
 * at `client.capabilities.presence` and names presence-capable providers.
 */
function presenceNotSupported(method: string): never {
  throw new Error(
    `[realtime] ${method}() requires a transport with presence support, ` +
      `but the current transport reports capabilities.presence = false ` +
      `(it does not implement PresenceCapable). ` +
      `Use a presence-capable transport (Centrifugo, Pusher, PartyKit) or ` +
      `check client.capabilities.presence before calling presence methods.`,
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
 *   transport: sseTransport({ url: '/api/realtime/sse' }),
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

  // Resolve capabilities once. Falls back to a shape-derived default for
  // transports (including third-party ones) that don't declare them.
  const capabilities = getCapabilities(transport)

  const client: RealtimeClient = {
    clientId,
    store,
    capabilities,

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
      if (!capabilities.presence || !hasPresence(transport))
        presenceNotSupported('joinPresence')
      transport.joinPresence(channel, data)
    },

    updatePresence(channel, data) {
      if (!capabilities.presence || !hasPresence(transport))
        presenceNotSupported('updatePresence')
      transport.updatePresence(channel, data)
    },

    leavePresence(channel) {
      if (!capabilities.presence || !hasPresence(transport))
        presenceNotSupported('leavePresence')
      transport.leavePresence(channel)
    },

    onPresenceChange(channel, callback) {
      if (!capabilities.presence || !hasPresence(transport))
        presenceNotSupported('onPresenceChange')
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
