/**
 * Server-side stream abstraction for pushing events to a channel.
 *
 * Designed for TanStack Start server functions: the stream handle is created
 * within a server function, pushes events via a `PublishFn`, and cleans up
 * when the function returns. No persistent server process is assumed.
 *
 * Resilience features:
 * - **Sequence numbers** (`_seq`): monotonic counter on every event for dedup
 * - **Heartbeats**: periodic sentinel events to prevent false stale detection
 * - **Checkpointing**: periodic snapshots of accumulated state for recovery
 *
 * @example
 * // In a TanStack Start server function
 * import { createServerStream } from '@tanstack/realtime'
 *
 * export const generateAI = createServerFn()(async ({ sessionId }) => {
 *   const stream = createServerStream({
 *     publish: realtimePublish,
 *     channel: ['ai', { sessionId }],
 *   })
 *
 *   for await (const chunk of llmResponse) {
 *     stream.push({ type: 'token', content: chunk })
 *   }
 *   stream.done()
 * })
 *
 * @example
 * // With resilience features (heartbeat + checkpoint)
 * const stream = createServerStream({
 *   publish: realtimePublish,
 *   channel: ['ai', { messageId }],
 *   heartbeat: { interval: 5_000 },
 *   checkpoint: {
 *     initial: { content: '' },
 *     reduce: (s, e) => ({ content: s.content + (e.delta ?? '') }),
 *     interval: { time: 10_000 },
 *     handler: async (cp) => {
 *       await db.messages.upsert({ id: messageId, content: cp.state.content })
 *     },
 *   },
 * })
 */

import { serializeKey } from '../core/serializeKey.js'
import type { StreamChannelDef } from '../collections/streamChannelOptions.js'
import type { QueryKey } from '../core/types.js'
import type { PublishFn } from './index.js'

// ---------------------------------------------------------------------------
// Sentinel constants — shared between server (createServerStream) and client
// (streamChannelOptions). Import these in isDone / isError callbacks so the
// sentinel strings are never duplicated.
// ---------------------------------------------------------------------------

/**
 * Sentinel `type` value pushed by `ServerStream.done()`.
 * Use in `streamChannelOptions({ isDone })` to detect stream completion:
 *
 * ```ts
 * isDone: (_state, event) => (event as any).type === STREAM_DONE
 * ```
 */
export const STREAM_DONE = '__stream:done' as const

/**
 * Sentinel `type` value pushed by `ServerStream.error()`.
 * Use in `streamChannelOptions({ isError })` to detect stream errors:
 *
 * ```ts
 * isError: (_state, event) => {
 *   const e = event as any
 *   return e.type === STREAM_ERROR ? (e.message ?? 'Stream error') : false
 * }
 * ```
 */
export const STREAM_ERROR = '__stream:error' as const

/**
 * Sentinel `type` value pushed periodically by the heartbeat timer.
 * Consumers use this to reset their stale detection timer without calling
 * the user-supplied `reduce` function.
 */
export const STREAM_HEARTBEAT = '__stream:heartbeat' as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Snapshot of stream progress, passed to the checkpoint handler.
 */
export interface StreamCheckpoint<TState> {
  /** The serialized channel string. */
  channel: string
  /** Sequence number of the last event that was checkpointed. */
  seq: number
  /** Accumulated state at the time of the checkpoint. */
  state: TState
  /** Milliseconds elapsed since the stream was created. */
  elapsed: number
}

/**
 * Configuration for periodic checkpointing of stream state.
 *
 * The producer mirrors the consumer's reducer to track accumulated state
 * and periodically calls `handler` so the application can persist a
 * recovery snapshot (e.g. to KV, D1, or a CRDT-enabled collection).
 *
 * You can provide `initial` and `reduce` explicitly, **or** pass a
 * `channelDef` to reuse the consumer's channel definition — ensuring the
 * producer and consumer always use the same reduce logic.
 *
 * @example
 * // Explicit initial/reduce (original API — still works)
 * checkpoint: {
 *   initial: { content: '' },
 *   reduce: (s, e) => ({ content: s.content + e.delta }),
 *   interval: { time: 10_000 },
 *   handler: async (cp) => { ... },
 * }
 *
 * @example
 * // Unified: reuse the channel definition (no drift risk)
 * checkpoint: {
 *   channelDef: aiStream,
 *   interval: { time: 10_000 },
 *   handler: async (cp) => { ... },
 * }
 */
export type CheckpointConfig<TState, TEvent = unknown> =
  | ExplicitCheckpointConfig<TState, TEvent>
  | ChannelDefCheckpointConfig<TState, TEvent>

/**
 * Checkpoint config with explicit `initial` and `reduce` — the original API.
 */
export interface ExplicitCheckpointConfig<TState, TEvent = unknown> {
  /** Initial state — should match the consumer's `initial`. */
  initial: TState
  /** Reducer — should match the consumer's `reduce`. */
  reduce: (state: TState, event: TEvent) => TState
  /**
   * How often to checkpoint. At least one of `time` or `events` is required.
   * When both are set, whichever fires first triggers a checkpoint.
   */
  interval: {
    /** Checkpoint every N milliseconds. */
    time?: number
    /** Checkpoint every N user events (excludes heartbeats and sentinels). */
    events?: number
  }
  /**
   * Called with the accumulated state snapshot. Persist this for recovery.
   *
   * Also called once on `done()` with the final state, and on `error()`
   * with the last good state — so the application always has a chance to
   * persist the final result.
   */
  handler: (checkpoint: StreamCheckpoint<TState>) => Promise<void>
}

/**
 * Checkpoint config that derives `initial` and `reduce` from a
 * `StreamChannelDef`.  Guarantees the producer mirrors the consumer's
 * exact reduce logic — no drift risk.
 */
export interface ChannelDefCheckpointConfig<TState, TEvent = unknown> {
  /**
   * The stream channel definition to derive `initial` and `reduce` from.
   * This is the same object you pass to `useStream` or use with
   * `streamChannelOptions` — ensuring a single source of truth.
   */
  channelDef: StreamChannelDef<TState, TEvent>
  /**
   * How often to checkpoint. At least one of `time` or `events` is required.
   * When both are set, whichever fires first triggers a checkpoint.
   */
  interval: {
    /** Checkpoint every N milliseconds. */
    time?: number
    /** Checkpoint every N user events (excludes heartbeats and sentinels). */
    events?: number
  }
  /**
   * Called with the accumulated state snapshot. Persist this for recovery.
   */
  handler: (checkpoint: StreamCheckpoint<TState>) => Promise<void>
}

/**
 * A server-side stream handle for pushing events to a channel.
 */
export interface ServerStream<TEvent = unknown> {
  /** Push an event to all subscribers of the stream's channel. */
  push: (event: TEvent) => Promise<void>
  /** Signal completion. Pushes a `{ type: STREAM_DONE }` sentinel. */
  done: () => Promise<void>
  /** Signal error. Pushes a `{ type: STREAM_ERROR, message }` sentinel. */
  error: (message: string) => Promise<void>
  /** The serialized channel string this stream publishes to. */
  readonly channel: string
  /** Current sequence number (number of events published so far). */
  readonly seq: number
}

export interface CreateServerStreamOptions<TState = unknown, TEvent = unknown> {
  /**
   * The publish function from your transport/preset.
   * In a TanStack Start context, this typically wraps `nodeServer.publish()`
   * or calls an external pub/sub service.
   */
  publish: PublishFn

  /**
   * Channel key for the stream. Accepts QueryKey or string.
   */
  channel: QueryKey | string

  /**
   * Optional HMAC-SHA256 key for signing events.
   *
   * **HMAC is symmetric** — the same key is used for signing (server) and
   * verification (consumer). Only share this key with trusted server-side
   * code. Never ship it to the browser unless the verification is purely
   * server-to-server.
   *
   * When provided, each pushed event includes a `_signature` field.
   * Verify with `verifyEventSignature(event, signature, key)`.
   *
   * Uses the Web Crypto API (`crypto.subtle`).
   */
  hmacKey?: string

  /**
   * Emit periodic heartbeat events so consumers can distinguish "no data
   * yet" from "producer died". The heartbeat resets the consumer's stale
   * timer without triggering the user-supplied `reduce`.
   *
   * Recommended interval: 5000ms. Should be shorter than the consumer's
   * `staleAfter` threshold.
   */
  heartbeat?: {
    /** Milliseconds between heartbeat events. */
    interval: number
  }

  /**
   * Periodic checkpointing of accumulated state for recovery.
   *
   * When provided, the producer mirrors the consumer's reducer and
   * periodically calls `handler` with a state snapshot. The application
   * can persist this to KV, D1, or a CRDT-enabled collection for
   * recovery if the producer dies.
   */
  checkpoint?: CheckpointConfig<TState, TEvent>
}

// ---------------------------------------------------------------------------
// Signature helpers
// ---------------------------------------------------------------------------

async function importHmacKey(
  key: string,
  usages: ReadonlyArray<KeyUsage>,
): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages as Array<KeyUsage>,
  )
}

async function signEvent(
  event: unknown,
  cryptoKey: CryptoKey,
): Promise<string> {
  const enc = new TextEncoder()
  const data = enc.encode(JSON.stringify(event))
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, data)
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ---------------------------------------------------------------------------
// Client-side signature verification
// ---------------------------------------------------------------------------

/**
 * Verify an HMAC-SHA256 signature on a received event.
 *
 * Uses constant-time comparison via `crypto.subtle.verify` to prevent
 * timing side-channel attacks.
 *
 * **Important:** HMAC is symmetric — the `hmacKey` used here must be the
 * same key used to sign the event. Only call this in trusted server-side
 * code or in environments where the key is not exposed to end users.
 *
 * @example
 * const isValid = await verifyEventSignature(event, event._signature, HMAC_KEY)
 * if (!isValid) return currentState // skip untrusted event
 */
export async function verifyEventSignature(
  event: unknown,
  signature: string | undefined,
  hmacKey: string,
): Promise<boolean> {
  if (!signature) return false
  const enc = new TextEncoder()
  const cryptoKey = await importHmacKey(hmacKey, ['verify'])
  const data = enc.encode(JSON.stringify(event))
  // Convert hex signature back to Uint8Array for constant-time verify
  const sigBytes = new Uint8Array(
    signature.match(/.{2}/g)?.map((h) => parseInt(h, 16)) ?? [],
  )
  return crypto.subtle.verify('HMAC', cryptoKey, sigBytes, data)
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a server-side stream for pushing events to a channel.
 *
 * This is compatible with TanStack Start server functions — it does not
 * require a persistent server process. The stream pushes events via the
 * provided `publish` function and signals completion via sentinel events.
 *
 * Every event is wrapped with framework metadata (`_seq`, `_ts`) that
 * consumers use for deduplication and stale detection. This metadata is
 * stripped before the consumer's `reduce` function sees the event.
 *
 * Clients consume these streams using `streamChannelOptions` with `isDone`
 * and `isError` configured to detect the sentinel constants:
 *
 * ```ts
 * import { STREAM_DONE, STREAM_ERROR } from '@tanstack/realtime'
 *
 * streamChannelOptions({
 *   client,
 *   channel: ['ai', { sessionId }],
 *   initial: '',
 *   reduce: (s, e) => s + e.token,
 *   isDone:  (_, e) => e.type === STREAM_DONE,
 *   isError: (_, e) => e.type === STREAM_ERROR ? e.message : false,
 *   staleAfter: 15_000,
 * })
 * ```
 *
 * @example
 * const stream = createServerStream({
 *   publish: (ch, data) => nodeServer.publish(serializeKey(ch), data),
 *   channel: ['ai', { sessionId }],
 * })
 *
 * for await (const chunk of llmResponse) {
 *   await stream.push({ type: 'token', content: chunk.text })
 * }
 * await stream.done()
 */
export function createServerStream<TEvent = unknown, TState = unknown>(
  options: CreateServerStreamOptions<TState, TEvent>,
): ServerStream<TEvent> {
  const { publish, hmacKey, heartbeat, checkpoint } = options
  const channel =
    typeof options.channel === 'string'
      ? options.channel
      : serializeKey(options.channel)

  // Per-instance key cache — imported once per stream, not shared globally.
  let cachedKey: CryptoKey | undefined

  async function getKey(): Promise<CryptoKey> {
    if (!cachedKey) {
      cachedKey = await importHmacKey(hmacKey!, ['sign'])
    }
    return cachedKey
  }

  // ---------------------------------------------------------------------------
  // Sequence counter — monotonically increasing, attached to every event.
  // ---------------------------------------------------------------------------
  let seq = 0
  const startedAt = Date.now()

  // ---------------------------------------------------------------------------
  // Checkpoint state — mirrors the consumer's reducer on the producer side.
  // Resolve initial/reduce from channelDef (unified) or explicit config.
  // ---------------------------------------------------------------------------
  const cpInitial: TState | undefined = checkpoint
    ? 'channelDef' in checkpoint
      ? checkpoint.channelDef.initial
      : checkpoint.initial
    : undefined
  const cpReduce: ((s: TState, e: TEvent) => TState) | undefined = checkpoint
    ? 'channelDef' in checkpoint
      ? checkpoint.channelDef.reduce
      : checkpoint.reduce
    : undefined

  let checkpointState: TState | undefined = cpInitial
  let eventsSinceCheckpoint = 0

  function buildCheckpoint(): StreamCheckpoint<TState> {
    return {
      channel,
      seq,
      state: checkpointState as TState,
      elapsed: Date.now() - startedAt,
    }
  }

  async function maybeCheckpoint(): Promise<void> {
    if (!checkpoint) return
    const { interval, handler } = checkpoint
    let shouldCheckpoint = false
    if (interval.events && eventsSinceCheckpoint >= interval.events) {
      shouldCheckpoint = true
    }
    // Time-based checkpointing is handled by the timer, not here.
    if (shouldCheckpoint) {
      eventsSinceCheckpoint = 0
      await handler(buildCheckpoint())
    }
  }

  // ---------------------------------------------------------------------------
  // Publish with envelope — adds _seq and _ts to every event.
  // ---------------------------------------------------------------------------

  async function publishEvent(event: unknown): Promise<void> {
    const envelope: Record<string, unknown> = {
      ...(event as Record<string, unknown>),
      _seq: ++seq,
      _ts: Date.now(),
    }

    if (hmacKey) {
      // Strip _signature from the event before signing to avoid circular deps
      const { _signature: _, ...eventWithoutSig } = envelope
      const cryptoKey = await getKey()
      const signature = await signEvent(eventWithoutSig, cryptoKey)
      await publish(channel, { ...eventWithoutSig, _signature: signature })
    } else {
      await publish(channel, envelope)
    }
  }

  // ---------------------------------------------------------------------------
  // Timers — heartbeat and time-based checkpoint. Cleared on done/error.
  // ---------------------------------------------------------------------------

  const timers: Array<ReturnType<typeof setInterval>> = []

  if (heartbeat) {
    timers.push(
      setInterval(() => {
        // Fire-and-forget: heartbeats are best-effort, not awaited.
        publishEvent({ type: STREAM_HEARTBEAT }).catch(() => {})
      }, heartbeat.interval),
    )
  }

  if (checkpoint?.interval.time) {
    timers.push(
      setInterval(() => {
        eventsSinceCheckpoint = 0
        checkpoint.handler(buildCheckpoint()).catch(() => {})
      }, checkpoint.interval.time),
    )
  }

  function clearTimers(): void {
    for (const t of timers) clearInterval(t)
    timers.length = 0
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  return {
    channel,

    get seq() {
      return seq
    },

    async push(event: TEvent): Promise<void> {
      await publishEvent(event)

      // Mirror-reduce for checkpoint tracking.
      if (checkpoint && cpReduce) {
        checkpointState = cpReduce(checkpointState as TState, event)
        eventsSinceCheckpoint++
        await maybeCheckpoint()
      }
    },

    async done(): Promise<void> {
      clearTimers()
      // Final checkpoint before the done sentinel.
      if (checkpoint) {
        await checkpoint.handler(buildCheckpoint())
      }
      await publishEvent({ type: STREAM_DONE })
    },

    async error(message: string): Promise<void> {
      clearTimers()
      // Checkpoint the last good state before the error sentinel.
      if (checkpoint) {
        await checkpoint.handler(buildCheckpoint())
      }
      await publishEvent({ type: STREAM_ERROR, message })
    },
  }
}
