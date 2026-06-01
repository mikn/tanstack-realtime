/**
 * Shared stream event processor — the pure state machine at the heart of
 * stream consumption.
 *
 * Both `streamChannelOptions` (TanStack DB collection) and `useStream` (React
 * hook) need to fold incoming events through the same state machine:
 *
 *   isError? → reduce → isDone? → emit snapshot
 *
 * This module extracts that logic into a single, testable unit.  The processor
 * works with **immutable snapshots**: each event produces a new `StreamSnapshot`
 * that the caller can forward to its output mechanism (begin/write/commit for
 * collections, setState for React).
 *
 * Side-effects (stale timers, transport subscriptions) remain the caller's
 * responsibility — the processor is intentionally pure.
 *
 * @module
 */

import type { StreamStatus } from '../collections/streamChannelOptions.js'

// ---------------------------------------------------------------------------
// Immutable snapshot
// ---------------------------------------------------------------------------

/**
 * An immutable snapshot of the stream's accumulated state and lifecycle status.
 *
 * Returned by `processEvent` after each event.  Callers should treat snapshots
 * as values — never mutate them.
 */
export interface StreamSnapshot<TState> {
  readonly state: TState
  readonly status: StreamStatus
  readonly error?: string
}

// ---------------------------------------------------------------------------
// Processor configuration
// ---------------------------------------------------------------------------

/**
 * Minimal configuration for the stream processor — the pure subset of
 * `StreamChannelConfig` that drives the state machine.
 */
export interface StreamProcessorConfig<TState, TEvent = unknown> {
  /** Accumulate each incoming event into the current state. */
  reduce: (state: TState, event: TEvent) => TState
  /**
   * Return true when the event signals that the stream is complete.
   * Receives **post-reduce** state.
   */
  isDone?: (state: TState, event: TEvent) => boolean
  /**
   * Return an error message string when the event signals an error.
   * Receives **pre-reduce** state (checked before `reduce`).
   */
  isError?: (state: TState, event: TEvent) => string | false | undefined | null
}

// ---------------------------------------------------------------------------
// processEvent — pure event fold
// ---------------------------------------------------------------------------

/**
 * Result of processing a single event.
 *
 * `stopped` indicates the stream has reached a terminal state (`done` or
 * `error`) and no further events should be processed.
 */
export interface ProcessEventResult<TState> {
  /** The new immutable snapshot after this event. */
  snapshot: StreamSnapshot<TState>
  /** True when the stream has reached a terminal state. */
  stopped: boolean
}

/**
 * Process a single stream event, producing the next immutable snapshot.
 *
 * This is a **pure function** — no timers, no subscriptions, no side-effects.
 * The caller is responsible for feeding it stripped, deduplicated,
 * non-heartbeat events (use `withEnvelopeStripping` and `withHeartbeatFilter`
 * upstream).
 *
 * Evaluation order:
 * 1. `isError` is checked against the **current** state (pre-reduce).  If it
 *    returns a truthy string, the stream transitions to `'error'` without
 *    calling `reduce`.
 * 2. `reduce` is called to produce the next state.
 * 3. `isDone` is checked against the **next** state (post-reduce).  If it
 *    returns `true`, the stream transitions to `'done'`.
 * 4. Otherwise the stream is `'streaming'`.
 *
 * @param current  The current snapshot (state + status).
 * @param event    The user event (already stripped of envelope metadata).
 * @param config   The processor configuration (reduce, isDone, isError).
 * @returns The next snapshot and whether the stream has stopped.
 */
export function processEvent<TState, TEvent>(
  current: StreamSnapshot<TState>,
  event: TEvent,
  config: StreamProcessorConfig<TState, TEvent>,
): ProcessEventResult<TState> {
  // 1. Error check — pre-reduce, so malformed events don't corrupt state.
  const errorMsg = config.isError?.(current.state, event)
  if (errorMsg) {
    return {
      snapshot: { state: current.state, status: 'error', error: errorMsg },
      stopped: true,
    }
  }

  // 2. Reduce — produce the next state.
  const nextState = config.reduce(current.state, event)

  // 3. Done check — post-reduce.
  const done = config.isDone?.(nextState, event) ?? false

  return {
    snapshot: { state: nextState, status: done ? 'done' : 'streaming' },
    stopped: done,
  }
}

// ---------------------------------------------------------------------------
// createStreamProcessor — stateful wrapper for convenience
// ---------------------------------------------------------------------------

/**
 * Callback invoked by the stream processor on every state transition.
 *
 * `stopped` is true when the stream has reached a terminal state and the
 * caller should tear down its subscription and timers.
 */
export type StreamTransitionCallback<TState> = (
  snapshot: StreamSnapshot<TState>,
  stopped: boolean,
) => void

/**
 * A stateful stream processor that maintains the current snapshot and forwards
 * transitions to a callback.
 *
 * Wraps the pure `processEvent` function with mutable state tracking so
 * callers don't need to manage the snapshot themselves.
 *
 * The processor does **not** manage timers, subscriptions, or transport
 * concerns — those remain the caller's responsibility.
 */
export interface StreamProcessor<TState> {
  /**
   * Feed a user event (already stripped of envelope, deduplicated, non-heartbeat)
   * into the processor.
   *
   * If the processor has already stopped (done/error), subsequent calls are
   * no-ops.
   */
  process: (event: unknown) => void

  /** Read the current immutable snapshot (e.g. for stale timer writes). */
  readonly currentSnapshot: StreamSnapshot<TState>
}

/**
 * Create a stateful stream processor.
 *
 * @param config      The reduce/isDone/isError configuration.
 * @param initial     Initial state.
 * @param onTransition Called on every state transition with the new snapshot.
 * @returns A processor with a `process` method.
 */
export function createStreamProcessor<TState, TEvent = unknown>(
  config: StreamProcessorConfig<TState, TEvent>,
  initial: TState,
  onTransition: StreamTransitionCallback<TState>,
): StreamProcessor<TState> {
  let current: StreamSnapshot<TState> = { state: initial, status: 'pending' }
  let stopped = false

  return {
    get currentSnapshot(): StreamSnapshot<TState> {
      return current
    },

    process(event: unknown): void {
      if (stopped) return

      const result = processEvent(current, event as TEvent, config)
      current = result.snapshot
      stopped = result.stopped
      onTransition(current, stopped)
    },
  }
}
