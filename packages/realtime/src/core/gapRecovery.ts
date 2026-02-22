/**
 * Gap recovery — wraps a transport to detect missed messages after reconnect
 * and invoke a recovery callback.
 *
 * The wrapper tracks whether each subscribed channel experienced a connection
 * gap (transition through 'reconnecting' or 'disconnected' → back to
 * 'connected'). When a gap is detected, the `onGap` callback is invoked for
 * every active channel so the application can re-fetch missed data.
 */

import type { RealtimeTransport } from './types.js'
import { hasPresence } from './types.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GapRecoveryOptions {
  /**
   * Called for each active channel after a reconnection gap.
   *
   * Use this to re-fetch missed data, request history from the server, or
   * trigger a full collection reload. Async handlers are fully supported.
   * Errors (both sync throws and rejected promises) are silently swallowed
   * so a failing recovery never crashes the transport — log or report them
   * inside the callback if observability is needed.
   *
   * ## withGapRecovery vs refetchOnReconnect
   *
   * | Scenario | Recommendation |
   * |----------|----------------|
   * | Collection backed by `queryFn` (REST / GraphQL) | Use `refetchOnReconnect: true` on `realtimeCollectionOptions`. It re-runs the query and diffs the result automatically, with no extra wiring. |
   * | Raw `client.subscribe()` subscriptions | Use `withGapRecovery` with a custom `onGap`. |
   * | Server-assisted recovery (e.g. Centrifugo epoch/offset replay) | Use `withGapRecovery` — `onGap` can send the stored epoch/offset so only missed messages are replayed, rather than a full re-fetch. |
   * | Collection **without** a `queryFn` | Use `withGapRecovery` — `refetchOnReconnect` is a no-op when no `queryFn` is configured. |
   *
   * The two mechanisms are complementary: `refetchOnReconnect` is the
   * collection-level shortcut for the common REST-refetch case;
   * `withGapRecovery` is the transport-level hook for everything else.
   *
   * @param channel - The serialized channel key that experienced the gap.
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
 * After any connection interruption (`'reconnecting'` or `'disconnected'`)
 * that resolves back to `'connected'`, the `onGap` callback is invoked for
 * every channel that has an active subscription at that moment.
 *
 * Accepts any {@link RealtimeTransport}. When the inner transport also implements
 * {@link PresenceCapable}, the presence methods are forwarded transparently.
 * Calling presence methods on a wrapper around a non-presence transport throws
 * a descriptive error.
 *
 * ## withGapRecovery vs refetchOnReconnect
 *
 * For `realtimeCollectionOptions` collections that have a `queryFn`, prefer
 * `refetchOnReconnect: true` — it is the idiomatic, collection-scoped
 * shortcut. Reserve `withGapRecovery` for raw subscriptions, collections
 * without a `queryFn`, and server-assisted offset-based recovery.
 *
 * @example
 * // Store Centrifugo offsets and replay only missed messages on reconnect
 * const offsets = new Map<string, { epoch: string; offset: number }>()
 *
 * const transport = withGapRecovery(
 *   centrifugoTransport({ url: 'wss://rt.example.com/connection/websocket' }),
 *   {
 *     onGap: async (channel) => {
 *       const pos = offsets.get(channel)
 *       if (!pos) return
 *       const missed = await centrifugo.history(channel, { since: pos })
 *       for (const pub of missed.publications) processMessage(channel, pub.data)
 *       offsets.set(channel, { epoch: missed.epoch, offset: missed.offset })
 *     },
 *   }
 * )
 */
export function withGapRecovery(
  inner: RealtimeTransport,
  options: GapRecoveryOptions,
): GapRecoveryTransport {
  const { onGap } = options
  const activeChannels = new Set<string>()
  let wasDisconnected = false

  // Watch for reconnection events.
  inner.store.subscribe((status) => {
    if (status === 'reconnecting' || status === 'disconnected') {
      wasDisconnected = true
    }
    if (status === 'connected' && wasDisconnected) {
      wasDisconnected = false
      // Fire gap recovery for all active channels. The async IIFE converts
      // sync throws inside onGap() into a rejected promise before .catch() sees
      // them, ensuring both sync and async errors are swallowed.
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
      if (!hasPresence(inner)) {
        throw new Error(
          '[realtime] withGapRecovery: the wrapped transport does not implement PresenceCapable.',
        )
      }
      inner.joinPresence(channel, data)
    },

    updatePresence(channel, data) {
      if (!hasPresence(inner)) {
        throw new Error(
          '[realtime] withGapRecovery: the wrapped transport does not implement PresenceCapable.',
        )
      }
      inner.updatePresence(channel, data)
    },

    leavePresence(channel) {
      if (!hasPresence(inner)) {
        throw new Error(
          '[realtime] withGapRecovery: the wrapped transport does not implement PresenceCapable.',
        )
      }
      inner.leavePresence(channel)
    },

    onPresenceChange(channel, callback) {
      if (!hasPresence(inner)) {
        throw new Error(
          '[realtime] withGapRecovery: the wrapped transport does not implement PresenceCapable.',
        )
      }
      return inner.onPresenceChange(channel, callback)
    },
  }

  return transport
}
