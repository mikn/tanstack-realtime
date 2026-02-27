/**
 * Stream envelope utilities — shared between all stream consumers.
 *
 * The producer (`createServerStream`) wraps every event with framework metadata
 * (`_seq`, `_ts`, optional `_signature`).  Consumers strip this envelope before
 * forwarding events to user callbacks.
 *
 * This module provides:
 * - `stripEnvelope` — extract the user event and sequence number from a raw
 *   envelope.  Used by the stream processor and available for custom consumers.
 * - `withEnvelopeStripping` — composable handler wrapper that strips the
 *   envelope and deduplicates by sequence number before forwarding.
 * - `withHeartbeatFilter` — composable handler wrapper that silently drops
 *   heartbeat events, optionally calling a side-effect callback (e.g. to reset
 *   a stale timer).
 *
 * These compose naturally:
 * ```ts
 * const handler = withHeartbeatFilter(
 *   withEnvelopeStripping(myBusinessLogic),
 *   { onHeartbeat: resetStaleTimer },
 * )
 * client.subscribe(channel, handler)
 * ```
 *
 * @module
 */

import { STREAM_HEARTBEAT } from '../server/serverStream.js'

// ---------------------------------------------------------------------------
// Framework metadata keys — stripped from events before user callbacks.
// ---------------------------------------------------------------------------

/** @internal Keys added by the producer's envelope. Stripped before reduce. */
const FRAMEWORK_KEYS = new Set(['_seq', '_ts', '_signature'])

// ---------------------------------------------------------------------------
// stripEnvelope
// ---------------------------------------------------------------------------

export interface EnvelopeResult {
  /** The event with framework metadata removed. */
  userEvent: unknown
  /** Sequence number if present, otherwise undefined. */
  seq: number | undefined
}

/**
 * Strip framework metadata (`_seq`, `_ts`, `_signature`) from a raw event
 * envelope, returning only the user-defined event fields.
 *
 * If the raw value is not an object or has no framework keys, it is returned
 * as-is (fast path).
 */
export function stripEnvelope(raw: unknown): EnvelopeResult {
  if (raw == null || typeof raw !== 'object')
    return { userEvent: raw, seq: undefined }
  const envelope = raw as Record<string, unknown>
  const seq = typeof envelope._seq === 'number' ? envelope._seq : undefined
  // Fast path: if no _seq key is present, no framework metadata to strip.
  if (!('_seq' in envelope)) {
    return { userEvent: raw, seq }
  }
  const stripped: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(envelope)) {
    if (!FRAMEWORK_KEYS.has(k)) stripped[k] = v
  }
  return { userEvent: stripped, seq }
}

// ---------------------------------------------------------------------------
// withEnvelopeStripping — handler middleware
// ---------------------------------------------------------------------------

/**
 * Wrap a handler to strip framework envelope metadata and deduplicate by
 * sequence number.
 *
 * The returned function accepts a raw envelope (as received from the
 * transport) and forwards the stripped user event only when its sequence
 * number is new (or absent — for backward-compatible events without `_seq`).
 *
 * @param handler  Receives the stripped user event.
 * @returns A transport-level handler (`(raw: unknown) => void`).
 */
export function withEnvelopeStripping(
  handler: (userEvent: unknown) => void,
): (rawEnvelope: unknown) => void {
  let lastSeenSeq = 0
  return (rawEnvelope: unknown): void => {
    const { userEvent, seq } = stripEnvelope(rawEnvelope)
    if (seq != null) {
      if (seq <= lastSeenSeq) return
      lastSeenSeq = seq
    }
    handler(userEvent)
  }
}

// ---------------------------------------------------------------------------
// withHeartbeatFilter — handler middleware
// ---------------------------------------------------------------------------

export interface HeartbeatFilterOptions {
  /**
   * Called when a heartbeat is received.  Useful for resetting stale timers.
   * The heartbeat event itself is not forwarded to the inner handler.
   */
  onHeartbeat?: () => void
}

/**
 * Wrap a handler to silently drop heartbeat events.
 *
 * Heartbeats (`{ type: STREAM_HEARTBEAT }`) are consumed internally — they
 * never reach `reduce`, `isDone`, or `isError`.  An optional `onHeartbeat`
 * callback fires for side-effects (e.g. resetting a stale timer).
 *
 * @param handler  Inner handler that processes non-heartbeat events.
 * @param options  Optional callbacks.
 * @returns A handler that filters out heartbeats.
 */
export function withHeartbeatFilter(
  handler: (userEvent: unknown) => void,
  options?: HeartbeatFilterOptions,
): (userEvent: unknown) => void {
  return (userEvent: unknown): void => {
    const eventObj = userEvent as Record<string, unknown> | null
    if (eventObj && eventObj.type === STREAM_HEARTBEAT) {
      options?.onHeartbeat?.()
      return
    }
    handler(userEvent)
  }
}
