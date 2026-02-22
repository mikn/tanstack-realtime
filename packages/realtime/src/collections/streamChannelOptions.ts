import type { CollectionConfig, SyncConfig } from '@tanstack/db'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { RealtimeClient, QueryKey } from '../core/types.js'
import { serializeKey } from '../core/serializeKey.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StreamStatus = 'pending' | 'streaming' | 'done' | 'error'

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
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
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
   */
  isError?: (state: TState, event: TEvent) => string | false | undefined | null
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
  resolveChannel(params: TParams): string
  readonly initial: TState
  readonly reduce: (state: TState, event: TEvent) => TState
  /** Receives post-reduce state. See `StreamChannelConfig.isDone`. */
  readonly isDone?: (state: TState, event: TEvent) => boolean
  /** Receives pre-reduce state. See `StreamChannelConfig.isError`. */
  readonly isError?: (
    state: TState,
    event: TEvent,
  ) => string | false | undefined | null
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
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
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
      let stopped = false
      let currentState = config.initial

      // Write the initial (pending) item before markReady so the collection
      // is never empty from the consumer's perspective.
      begin()
      write({
        type: 'insert',
        value: { id: serializedChannel, state: currentState, status: 'pending' },
      })
      commit()
      markReady()

      // `unsub` is assigned after subscribe() so the event handler can call it
      // when done/error terminates the stream early. Initialise to a no-op to
      // avoid a temporal dead zone if an event fires synchronously.
      let unsub: () => void = () => {}

      const handler = (rawEvent: unknown): void => {
        if (stopped) return
        const event = rawEvent as TEvent

        // Error check runs before reduce so a malformed event can be caught.
        const errorMsg = config.isError?.(currentState, event)
        if (errorMsg) {
          stopped = true
          begin({ immediate: true })
          write({
            type: 'update',
            value: {
              id: serializedChannel,
              state: currentState,
              status: 'error',
              error: errorMsg,
            },
          })
          commit()
          unsub()
          return
        }

        const nextState = config.reduce(currentState, event)
        const done = config.isDone?.(nextState, event) ?? false
        currentState = nextState

        begin({ immediate: true })
        write({
          type: 'update',
          value: {
            id: serializedChannel,
            state: currentState,
            status: done ? 'done' : 'streaming',
          },
        })
        commit()

        if (done) {
          stopped = true
          unsub()
        }
      }

      unsub = config.client.subscribe(serializedChannel, handler)

      return () => {
        stopped = true
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
