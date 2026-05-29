/**
 * Gap recovery hook — detects missed messages after reconnect and invokes
 * a recovery callback for each active channel.
 *
 * Uses the transport's hook pipeline instead of wrapping the transport.
 * The transport stays one object; gap recovery is a registered hook.
 */

import type { HookHandle } from './hooks.js'
import type { RealtimeTransport } from './types.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GapRecoveryOptions {
  /**
   * Called for each active channel after a reconnection gap.
   *
   * Use this to re-fetch missed data, request history from the server, or
   * trigger a full collection reload. Async handlers are fully supported.
   *
   * @param channel - The serialized channel key that experienced the gap.
   */
  onGap: (channel: string) => void | Promise<void>
  /**
   * Called when `onGap` throws or returns a rejected promise.
   *
   * By default errors are silently swallowed so a failing recovery never
   * crashes the transport. Provide `onGapError` to log them or report to
   * an error tracker.
   */
  onGapError?: (error: unknown, channel: string) => void
}

export interface GapRecoveryHandle {
  /** Set of channels that currently have active subscriptions. */
  readonly activeChannels: ReadonlySet<string>
  /** Remove gap recovery from the transport. */
  unhook: () => void
}

// ---------------------------------------------------------------------------
// Hook factory
// ---------------------------------------------------------------------------

/**
 * Register gap recovery hooks on a transport.
 *
 * After any connection interruption that resolves back to 'connected',
 * the `onGap` callback is invoked for every channel that has an active
 * subscription at that moment.
 *
 * @example
 * const recovery = useGapRecovery(transport, {
 *   onGap: async (ch) => { await refetch(ch) },
 *   onGapError: (err, ch) => console.error(`Gap recovery failed for ${ch}`, err),
 * })
 *
 * // recovery.activeChannels — currently subscribed channels
 * // recovery.unhook() — remove gap recovery
 */
export function useGapRecovery(
  transport: RealtimeTransport,
  options: GapRecoveryOptions,
): GapRecoveryHandle {
  const { onGap, onGapError } = options
  const activeChannels = new Set<string>()

  const handle: HookHandle = transport.hook({
    name: 'gap-recovery',
    hooks: {
      onReconnect(channels) {
        for (const channel of channels) {
          void (async () => onGap(channel))().catch((err: unknown) => {
            if (onGapError) onGapError(err, channel)
          })
        }
      },
      onChannelSubscribe(channel) {
        activeChannels.add(channel)
      },
      onChannelUnsubscribe(channel) {
        activeChannels.delete(channel)
      },
    },
  })

  return {
    activeChannels,
    unhook: handle.unhook,
  }
}
