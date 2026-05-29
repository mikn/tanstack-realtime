import { serializeKey } from '../core/serializeKey.js'
import {
  withEnvelopeStripping,
  withHeartbeatFilter,
} from '../core/streamEnvelope.js'
import { createStreamProcessor } from '../core/streamProcessor.js'
import { STREAM_DONE, STREAM_ERROR } from '../server/serverStream.js'
import type { CollectionConfig, SyncConfig } from '@tanstack/db'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { QueryKey, RealtimeClient } from '../core/types.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StreamStatus = 'pending' | 'streaming' | 'done' | 'error' | 'stale'

/**
 * The single item stored in a stream collection.
 * The collection always contains exactly one item keyed by the channel string.
 */
export interface StreamItem<TState> {
  readonly id: string
  readonly state: TState
  readonly status: StreamStatus
  readonly error?: string
}

export interface StreamChannelConfig<
  TState,
  TEvent = unknown,
  TSchema extends StandardSchemaV1 = never,
> {
  /** The realtime client that manages the underlying transport. */
  client: RealtimeClient
  /** Collection id — must be unique across all collections. */
  id?: string
  /** Zod / Standard Schema for type validation. */
  schema?: TSchema
  /**
   * The channel this stream subscribes to.
   * Accepts a QueryKey array or a pre-serialized channel string.
   */
  channel: QueryKey | string
  /** Initial state before the first event arrives. Status starts as 'pending'. */
  initial: TState
  /**
   * Accumulate each incoming event into the current state.
   * Called for every event that is not flagged as done or error.
   * Status transitions to 'streaming' after the first successful reduce.
   */
  reduce: (state: TState, event: TEvent) => TState
  /**
   * Return true when the event signals that the stream is complete.
   * After this the subscription is closed and status becomes 'done'.
   *
   * Receives the **post-reduce** state (i.e. `reduce` has already been called
   * with the event before `isDone` is evaluated).
   *
   * @default — stream is open-ended (never done)
   */
  isDone?: (state: TState, event: TEvent) => boolean
  /**
   * Return an error message string when the event signals an error,
   * or a falsy value if it is not an error event.
   * After this the subscription is closed and status becomes 'error'.
   *
   * Receives the **pre-reduce** state — `isError` is checked *before* `reduce`
   * so that malformed events can be caught before they corrupt the accumulated
   * state.  This is the opposite evaluation order to `isDone`, which receives
   * the post-reduce state.
   *
   * @example
   * ```ts
   * // Why pre-reduce matters: an error event with type: "error" has no token.
   * // If reduce ran first, it would concatenate `undefined`, corrupting state:
   * //   reduce("Hello", { type: "error" }) → "Helloundefined"
   * // With pre-reduce isError, the state remains "Hello" and status is 'error'.
   * streamChannelOptions({
   *   client,
   *   channel: 'ai-chat',
   *   initial: '',
   *   reduce: (s, e: { type: string; token?: string }) => s + (e.token ?? ''),
   *   isError: (_state, e) => (e.type === 'error' ? 'Stream failed' : false),
   * })
   * ```
   */
  isError?: (state: TState, event: TEvent) => string | false | undefined | null

  /**
   * Milliseconds of silence (no events at all, including heartbeats) before
   * the stream status transitions to `'stale'`.
   *
   * When a new event arrives while stale, status reverts to `'streaming'`.
   * This is a soft failure — the stream is not stopped, just flagged.
   *
   * **Choosing a value**: should be longer than the producer's heartbeat
   * interval (if configured). A good default is 2–3× the heartbeat interval.
   * For example, with `heartbeat: { interval: 5_000 }` on the producer, use
   * `staleAfter: 15_000` on the consumer.
   *
   * @example
   * streamChannelOptions({
   *   client,
   *   channel: 'ai-stream',
   *   initial: '',
   *   reduce: (s, e) => s + e.token,
   *   ...serverStreamCallbacks,
   *   staleAfter: 15_000,
   * })
   */
  staleAfter?: number
}

// ---------------------------------------------------------------------------
// Typed channel definition (for use with useStream)
// ---------------------------------------------------------------------------

/**
 * A typed stream channel definition — a reusable descriptor created at module
 * level and shared across components.  Analogous to `PresenceChannelDef` but
 * for accumulated event streams.  Pass to a compatible stream hook; for
 * direct collection use (without a hook) see `streamChannelOptions`.
 */
export interface StreamChannelDef<
  TState,
  TEvent = unknown,
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly id: string
  /** Resolve the serialized channel key for a given set of params. */
  resolveChannel: (params: TParams) => string
  readonly initial: TState
  readonly reduce: (state: TState, event: TEvent) => TState
  /** Receives post-reduce state. See `StreamChannelConfig.isDone`. */
  readonly isDone?: (state: TState, event: TEvent) => boolean
  /** Receives pre-reduce state. See `StreamChannelConfig.isError`. */
  readonly isError?: (
    state: TState,
    event: TEvent,
  ) => string | false | undefined | null
  /** Stale detection threshold. See `StreamChannelConfig.staleAfter`. */
  readonly staleAfter?: number
}

export interface StreamChannelDefConfig<
  TState,
  TEvent = unknown,
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Unique identifier for this stream channel definition. */
  id: string
  /**
   * Function that derives the channel from runtime params.
   * @example
   * channel: (params: { messageId: string }) => ['ai', { messageId: params.messageId }]
   */
  channel: (params: TParams) => QueryKey | string
  /** Initial state before the first event arrives. */
  initial: TState
  /** Accumulate each incoming event into the current state. */
  reduce: (state: TState, event: TEvent) => TState
  /** Receives post-reduce state. See `StreamChannelConfig.isDone`. */
  isDone?: (state: TState, event: TEvent) => boolean
  /** Receives pre-reduce state. See `StreamChannelConfig.isError`. */
  isError?: (state: TState, event: TEvent) => string | false | undefined | null
  /** Stale detection threshold. See `StreamChannelConfig.staleAfter`. */
  staleAfter?: number
}

/**
 * Define a typed stream channel.
 *
 * Create once at module level and pass to `useStream` in components.
 *
 * @example
 * export const aiMessageStream = createStreamChannel({
 *   id: 'ai-message',
 *   channel: (params: { messageId: string }) => ['ai', params],
 *   initial: { content: '' },
 *   reduce: (state, event: { type: string; content?: string }) =>
 *     event.type === 'token'
 *       ? { content: state.content + (event.content ?? '') }
 *       : state,
 *   isDone:  (_, e) => (e as { type: string }).type === 'done',
 *   isError: (_, e) =>
 *     (e as { type: string }).type === 'error'
 *       ? ((e as { message?: string }).message ?? 'Unknown error')
 *       : false,
 * })
 */
export function createStreamChannel<
  TState,
  TEvent = unknown,
  TParams extends Record<string, unknown> = Record<string, unknown>,
>(
  config: StreamChannelDefConfig<TState, TEvent, TParams>,
): StreamChannelDef<TState, TEvent, TParams> {
  return {
    id: config.id,
    resolveChannel(params: TParams): string {
      const key = config.channel(params)
      return typeof key === 'string' ? key : serializeKey(key)
    },
    initial: config.initial,
    reduce: config.reduce,
    isDone: config.isDone,
    isError: config.isError,
    staleAfter: config.staleAfter,
  }
}

// ---------------------------------------------------------------------------
// streamChannelOptions — TanStack DB collection integration
// ---------------------------------------------------------------------------

/**
 * Creates a TanStack DB `CollectionConfig` that accumulates a channel's events
 * into a single reactive item via a reducer.
 *
 * The collection always contains exactly one item:
 *   `{ id: string, state: TState, status: StreamStatus, error?: string }`
 *
 * Designed for AI / LLM token streams, progress bars, and any channel where
 * you want to fold successive events into one piece of state rather than
 * create a new row per event.
 *
 * **Restarting a stream / triggering a new generation**
 *
 * Once `status` reaches `'done'` or `'error'` the subscription is closed and
 * the item is frozen.  To start a fresh generation, change the `channel` value
 * passed to `streamChannelOptions` — a new channel key causes TanStack DB to
 * tear down and remount the collection, resetting status to `'pending'` and
 * re-subscribing.  The idiomatic pattern is to include a request / generation
 * ID in the channel key and bump it when the user triggers a retry or a new
 * prompt:
 *
 * ```ts
 * const [requestId, setRequestId] = useState(() => crypto.randomUUID())
 * const aiStream = createCollection(
 *   streamChannelOptions({ client, channel: ['ai', { requestId }], ... })
 * )
 * // Trigger a fresh generation:
 * const retry = () => setRequestId(crypto.randomUUID())
 * ```
 *
 * @example
 * const aiStream = createCollection(streamChannelOptions({
 *   client,
 *   channel: ['ai', { messageId }],
 *   initial: { content: '' },
 *   reduce: (state, event: { type: string; content?: string }) =>
 *     event.type === 'token'
 *       ? { content: state.content + (event.content ?? '') }
 *       : state,
 *   isDone:  (_, e) => e.type === 'done',
 *   isError: (_, e) => e.type === 'error' ? e.message : false,
 * }))
 */
export function streamChannelOptions<
  TState,
  TEvent = unknown,
  TSchema extends StandardSchemaV1 = never,
>(
  config: StreamChannelConfig<TState, TEvent, TSchema>,
): CollectionConfig<StreamItem<TState>, string, TSchema> {
  const serializedChannel =
    typeof config.channel === 'string'
      ? config.channel
      : serializeKey(config.channel)

  const sync: SyncConfig<StreamItem<TState>, string> = {
    rowUpdateMode: 'full',

    sync({ begin, write, commit, markReady }) {
      // Write the initial (pending) item before markReady so the collection
      // is never empty from the consumer's perspective.
      begin()
      write({
        type: 'insert',
        value: {
          id: serializedChannel,
          state: config.initial,
          status: 'pending',
        },
      })
      commit()
      markReady()

      // `unsub` is assigned after subscribe() so the event handler can call it
      // when done/error terminates the stream early. Initialise to a no-op to
      // avoid a temporal dead zone if an event fires synchronously.
      let unsub: () => void = () => {}

      // ----- Stale detection timer -----
      let staleTimer: ReturnType<typeof setTimeout> | null = null
      let staleStopped = false

      function clearStaleTimer(): void {
        if (staleTimer != null) {
          clearTimeout(staleTimer)
          staleTimer = null
        }
      }

      function resetStaleTimer(): void {
        clearStaleTimer()
        if (!config.staleAfter || staleStopped) return
        staleTimer = setTimeout(() => {
          if (staleStopped) return
          begin({ immediate: true })
          write({
            type: 'update',
            value: {
              id: serializedChannel,
              state: processor.currentSnapshot.state,
              status: 'stale',
            },
          })
          commit()
        }, config.staleAfter)
      }

      // ----- Stream processor (shared immutable state machine) -----
      const processor = createStreamProcessor<TState, TEvent>(
        {
          reduce: config.reduce,
          isDone: config.isDone,
          isError: config.isError,
        },
        config.initial,
        (snapshot, stopped) => {
          begin({ immediate: true })
          write({
            type: 'update',
            value: {
              id: serializedChannel,
              state: snapshot.state,
              status: snapshot.status,
              ...(snapshot.error != null ? { error: snapshot.error } : {}),
            },
          })
          commit()

          if (stopped) {
            staleStopped = true
            clearStaleTimer()
            unsub()
          }
        },
      )

      // ----- Compose handler pipeline -----
      // Inner: stream processor receives stripped, non-heartbeat events.
      // Middle: heartbeat filter drops heartbeats, resets stale timer.
      // Outer: envelope stripping + sequence dedup.
      const handler = withEnvelopeStripping(
        withHeartbeatFilter(
          (userEvent) => {
            resetStaleTimer()
            processor.process(userEvent)
          },
          {
            onHeartbeat: resetStaleTimer,
          },
        ),
      )

      unsub = config.client.subscribe(serializedChannel, handler)

      return () => {
        staleStopped = true
        clearStaleTimer()
        unsub()
      }
    },
  }

  return {
    id: config.id ?? `stream:${serializedChannel}`,
    schema: config.schema,
    getKey: (item) => item.id,
    sync,
  }
}

// ---------------------------------------------------------------------------
// Server stream integration helpers
// ---------------------------------------------------------------------------

/**
 * Pre-built `isDone` / `isError` callbacks that match the sentinel events
 * pushed by `createServerStream` (from `@realtimejs/core`).
 *
 * Spread these into your `streamChannelOptions` config to avoid manually
 * checking for the `__stream:done` / `__stream:error` sentinel types.
 *
 * @example
 * import { streamChannelOptions, serverStreamCallbacks } from '@realtimejs/core'
 *
 * const aiStream = createCollection(streamChannelOptions({
 *   client,
 *   channel: ['ai', { sessionId }],
 *   initial: '',
 *   reduce: (s, e) => e.type === 'token' ? s + e.content : s,
 *   ...serverStreamCallbacks,
 * }))
 */
export const serverStreamCallbacks = {
  isDone: (_state: unknown, event: unknown): boolean => {
    return (event as Record<string, unknown>).type === STREAM_DONE
  },
  isError: (_state: unknown, event: unknown): string | false => {
    const e = event as Record<string, unknown>
    if (e.type === STREAM_ERROR) {
      return typeof e.message === 'string' ? e.message : 'Stream error'
    }
    return false
  },
} as const
