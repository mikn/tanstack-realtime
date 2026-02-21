/**
 * Gap recovery — wraps a transport to detect missed messages after reconnect
 * and invoke a recovery callback.
 *
 * The wrapper tracks whether each subscribed channel experienced a connection
 * gap (transition through 'reconnecting' → 'connected'). When a gap is
 * detected, the `onGap` callback is invoked for every active channel,
 * giving the application a chance to re-fetch missed data.
 *
 * This is the client-side complement to server-side features like Centrifugo's
 * epoch/offset recovery. Even without server support, the callback can
 * simply re-run a queryFn to catch up.
 */

import type { RealtimeTransport, ConnectionStatus, PresenceUser } from './types.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GapRecoveryOptions {
  /**
   * Called for each active subscription after a reconnection gap.
   *
   * Implementations can re-fetch data, request history from the server,
   * or trigger a full collection reload.
   *
   * Errors thrown synchronously and rejected promises are both silently
   * ignored — gap recovery must not crash the transport.  Log or report
   * errors inside the callback if observability is needed.
   *
   * @param channel - The channel that experienced a gap.
   */
  onGap: (channel: string) => void | Promise<void>
}

export interface GapRecoveryTransport extends RealtimeTransport {
  /** Set of channels that currently have active subscriptions. */
  readonly activeChannels: ReadonlySet<string>
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Wrap a transport with gap recovery.
 *
 * @example
 * const transport = withGapRecovery(innerTransport, {
 *   onGap: async (channel) => {
 *     // Re-fetch the channel's data from the server
 *     const data = await fetchChannelData(channel)
 *     collection.reload(data)
 *   }
 * })
 */
export function withGapRecovery(
  inner: RealtimeTransport,
  options: GapRecoveryOptions,
): GapRecoveryTransport {
  const { onGap } = options
  const activeChannels = new Set<string>()
  let wasDisconnected = false

  // Watch for reconnection events.
  inner.store.subscribe((status: ConnectionStatus) => {
    if (status === 'reconnecting' || status === 'disconnected') {
      wasDisconnected = true
    }
    if (status === 'connected' && wasDisconnected) {
      wasDisconnected = false
      // Fire gap recovery for all active channels.  Errors (sync throws and
      // rejected promises) are silently swallowed — see GapRecoveryOptions.onGap.
      // The async IIFE catches both: sync throws inside onGap() are converted
      // to a rejected promise by the async wrapper before .catch() sees them.
      for (const channel of activeChannels) {
        void (async () => onGap(channel))().catch(() => {})
      }
    }
  })

  const transport: GapRecoveryTransport = {
    store: inner.store,
    activeChannels,

    async connect() {
      return inner.connect()
    },

    disconnect() {
      inner.disconnect()
    },

    subscribe(channel, onMessage) {
      activeChannels.add(channel)
      const innerUnsub = inner.subscribe(channel, onMessage)

      return () => {
        innerUnsub()
        activeChannels.delete(channel)
      }
    },

    async publish(channel, data) {
      return inner.publish(channel, data)
    },

    joinPresence(channel, data) {
      inner.joinPresence(channel, data)
    },

    updatePresence(channel, data) {
      inner.updatePresence(channel, data)
    },

    leavePresence(channel) {
      inner.leavePresence(channel)
    },

    onPresenceChange(
      channel: string,
      callback: (users: ReadonlyArray<PresenceUser>) => void,
    ) {
      return inner.onPresenceChange(channel, callback)
    },
  }

  return transport
}
