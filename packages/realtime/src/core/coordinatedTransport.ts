/**
 * Smart transport wrapper that automatically selects the best multi-tab
 * coordination strategy for the current environment.
 *
 * Selection order:
 *  1. **SharedWorker** — single connection shared via a worker process.
 *     Requires a `workerUrl` option pointing to a worker file that calls
 *     `createSharedWorkerCoordinator()`.
 *  2. **BroadcastChannel** — leader election across tabs. One tab holds the
 *     connection; others proxy through BroadcastChannel. No setup required.
 *  3. **Direct** — no multi-tab coordination. Each tab opens its own
 *     connection. Used when neither SharedWorker nor BroadcastChannel is
 *     available, or in server-side environments.
 *
 * On the server (no `window` global), this function throws a clear error
 * directing users to use the transport directly.
 *
 * @example
 * ```ts
 * import { createCoordinatedTransport, wsTransport } from '@tanstack/realtime'
 *
 * // Automatic — picks BroadcastChannel in browsers, errors on server
 * const transport = createCoordinatedTransport({
 *   transport: () => wsTransport({ url: 'wss://rt.example.com' }),
 * })
 *
 * // Best: SharedWorker when available, falls back to BroadcastChannel
 * const transport = createCoordinatedTransport({
 *   transport: () => wsTransport({ url: 'wss://rt.example.com' }),
 *   workerUrl: new URL('./realtime.worker.ts', import.meta.url),
 * })
 * ```
 */

import {
  createBroadcastChannelTransport,
  isBroadcastChannelSupported,
} from './broadcastChannelTransport.js'
import {
  createSharedWorkerTransport,
  isSharedWorkerSupported,
} from './sharedWorkerTransport.js'
import { hasPresence } from './types.js'
import type { BroadcastChannelTransportOptions } from './broadcastChannelTransport.js'
import type { PresenceCapable, RealtimeTransport } from './types.js'

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface CoordinatedTransportOptions {
  /**
   * Factory that creates the underlying transport (e.g. `wsTransport`,
   * `centrifugoTransport`). Called lazily — only when this tab needs to
   * own the connection (leader in BroadcastChannel mode, or direct fallback).
   *
   * Must return a fresh instance each time.
   */
  transport: () => RealtimeTransport & Partial<PresenceCapable>

  /**
   * URL to a SharedWorker script that calls `createSharedWorkerCoordinator()`.
   * When provided AND SharedWorker is supported, SharedWorker coordination is
   * used (best performance — single connection survives tab close).
   *
   * When omitted or SharedWorker is unavailable, falls back to
   * BroadcastChannel leader election.
   *
   * @example
   * workerUrl: new URL('./realtime.worker.ts', import.meta.url)
   */
  workerUrl?: string | URL

  /**
   * BroadcastChannel name used for tab coordination.
   * Only relevant when BroadcastChannel is the selected strategy.
   * @default 'tanstack-realtime'
   */
  channelName?: string

  /**
   * Additional BroadcastChannel options (heartbeat timing, publish timeout).
   * Only relevant when BroadcastChannel is the selected strategy.
   */
  broadcastOptions?: Omit<BroadcastChannelTransportOptions, 'name'>
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a transport with automatic multi-tab coordination.
 *
 * Picks the best available strategy:
 *  SharedWorker (if `workerUrl` provided) → BroadcastChannel → direct.
 *
 * @throws {Error} When called in a server-side environment (no `window`).
 *   Use the transport directly on the server instead.
 */
export function createCoordinatedTransport(
  options: CoordinatedTransportOptions,
): RealtimeTransport & PresenceCapable {
  // ── Server-side guard ───────────────────────────────────────────────────
  if (typeof window === 'undefined') {
    throw new Error(
      '[realtime] createCoordinatedTransport is for browser environments.\n' +
        'On the server, use the transport directly:\n\n' +
        '  import { wsTransport } from "@tanstack/realtime"\n' +
        '  const transport = wsTransport({ url: "ws://localhost:3000" })\n',
    )
  }

  // ── 1. SharedWorker (best) ──────────────────────────────────────────────
  if (options.workerUrl && isSharedWorkerSupported()) {
    return createSharedWorkerTransport(options.workerUrl)
  }

  // ── 2. BroadcastChannel + leader election (good) ────────────────────────
  if (isBroadcastChannelSupported()) {
    return createBroadcastChannelTransport(options.transport, {
      name: options.channelName,
      ...options.broadcastOptions,
    })
  }

  // ── 3. Direct transport (fallback) ──────────────────────────────────────
  const inner = options.transport()
  if (hasPresence(inner)) return inner

  // Wrap non-presence transports with throwing stubs so the return type is
  // consistent. The client layer already throws descriptive errors for
  // presence calls on non-capable transports, but this ensures the type
  // contract holds even when used without createRealtimeClient.
  return {
    ...inner,
    joinPresence() {
      throw new Error(
        '[realtime] Transport does not support presence. ' +
          'Use a transport that implements PresenceCapable.',
      )
    },
    updatePresence() {
      throw new Error(
        '[realtime] Transport does not support presence. ' +
          'Use a transport that implements PresenceCapable.',
      )
    },
    leavePresence() {
      throw new Error(
        '[realtime] Transport does not support presence. ' +
          'Use a transport that implements PresenceCapable.',
      )
    },
    onPresenceChange() {
      throw new Error(
        '[realtime] Transport does not support presence. ' +
          'Use a transport that implements PresenceCapable.',
      )
    },
  }
}
