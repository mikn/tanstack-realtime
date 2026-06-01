/**
 * Transport hook types — the capability enrichment system.
 *
 * Instead of wrapping transports with middleware proxies, capabilities like
 * offline queueing, gap recovery, and deduplication register hooks into the
 * transport's lifecycle pipeline. The transport stays one object — hooks
 * augment its behaviour without replacing it.
 */

// ---------------------------------------------------------------------------
// Hook callbacks
// ---------------------------------------------------------------------------

export interface TransportHooks {
  /**
   * Called after the transport transitions to 'connected'.
   * Use for: flushing offline queues, re-registering state.
   */
  onConnect?: () => void | Promise<void>

  /**
   * Called when the transport transitions away from 'connected'.
   * Receives the new status ('disconnected' | 'reconnecting').
   */
  onDisconnect?: (status: 'disconnected' | 'reconnecting') => void

  /**
   * Called when the transport transitions from a non-connected state
   * back to 'connected' (i.e., a gap occurred).
   * NOT called on initial connection.
   *
   * Receives the set of channels that currently have active subscribers.
   */
  onReconnect?: (activeChannels: ReadonlySet<string>) => void | Promise<void>

  /**
   * Intercept outbound publishes. Return the (possibly transformed) data
   * to continue, or `false` to suppress the publish entirely.
   * Use for: offline queueing (return false + enqueue), data transformation.
   */
  beforePublish?: (channel: string, data: unknown) => { data: unknown } | false

  /**
   * Intercept inbound messages after the transport receives them but before
   * they reach subscriber callbacks. Return the (possibly transformed) data
   * to continue, or `false` to suppress (dedup, echo filtering).
   */
  beforeDeliver?: (channel: string, data: unknown) => { data: unknown } | false

  /**
   * Called when a channel gains its first subscriber.
   */
  onChannelSubscribe?: (channel: string) => void

  /**
   * Called when a channel loses its last subscriber.
   */
  onChannelUnsubscribe?: (channel: string) => void
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export interface HookRegistration {
  /** Unique name for debugging/logging. */
  name: string
  /** Lower priority runs first. @default 0 */
  priority?: number
  hooks: TransportHooks
}

export interface HookHandle {
  /** Remove this hook registration. */
  unhook: () => void
}
