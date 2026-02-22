import type { CollectionConfig, SyncConfig } from '@tanstack/db'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { RealtimeClient, QueryKey } from '../core/types.js'
import { serializeKey } from '../core/serializeKey.js'

export interface LiveChannelConfig<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
> {
  /** The realtime client that manages the underlying transport. */
  client: RealtimeClient
  /** Collection id — must be unique across all collections. */
  id?: string
  /** Zod / Standard Schema for type validation. */
  schema?: TSchema
  /** Extract the primary key from a row. */
  getKey: (item: T) => TKey
  /**
   * The channel this collection subscribes to.
   * Accepts a QueryKey array or a pre-serialized channel string.
   */
  channel: QueryKey | string
  /**
   * Optional. Load historical data on mount (e.g. chat history).
   * The promise resolves to an array of rows to pre-populate the collection.
   */
  initialData?: () => Promise<T[]>
  /**
   * Called for every channel event. Return the row to insert into the
   * collection, or `null` / `undefined` to ignore the event.
   */
  onEvent: (event: unknown) => T | null | undefined
}

/**
 * Creates a TanStack DB `CollectionConfig` backed by a live channel.
 *
 * Unlike `realtimeCollectionOptions`, live channels are not database-backed.
 * Data flows directly through the channel (chat, AI tokens, typing indicators,
 * game events). The `onEvent` callback decides what to keep.
 *
 * @example
 * export const chatCollection = createCollection(
 *   liveChannelOptions({
 *     client: realtimeClient,
 *     id: 'chat',
 *     schema: chatMessageSchema,
 *     getKey: (item) => item.id,
 *     channel: ['chat', { roomId: '42' }],
 *     initialData: () => getChatHistory({ data: { roomId: '42' } }),
 *     onEvent: (event) => {
 *       if ((event as { type: string }).type === 'message') return event as T
 *       return null
 *     },
 *   })
 * )
 */
export function liveChannelOptions<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
>(
  config: LiveChannelConfig<T, TKey, TSchema>,
): CollectionConfig<T, TKey, TSchema> {
  const { client, channel, initialData, onEvent, ...collectionConfig } = config

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const sync: SyncConfig<T, TKey> = {
    rowUpdateMode: 'full',

    sync({ begin, write, commit, markReady }) {
      let stopped = false

      // Events that arrive while initialData is still loading are buffered so
      // that history always precedes live events in the collection.  Without
      // this, a message arriving 1 ms before the history fetch completes would
      // appear *before* older messages loaded from the server.
      const pending: unknown[] = []
      let initialized = !initialData // true immediately when there is no history

      // Subscribe to incoming channel events.
      const unsub = client.subscribe(serializedChannel, (raw) => {
        if (stopped) return
        if (!initialized) {
          pending.push(raw)
          return
        }
        const row = onEvent(raw)
        if (row == null) return
        begin({ immediate: true })
        write({ type: 'insert', value: row })
        commit()
      })

      // Load historical data if provided.
      if (initialData) {
        initialData()
          .then((rows) => {
            if (stopped) return
            initialized = true
            begin()
            for (const row of rows) {
              write({ type: 'insert', value: row })
            }
            // Replay buffered live events in arrival order after history.
            for (const raw of pending) {
              const row = onEvent(raw)
              if (row != null) write({ type: 'insert', value: row })
            }
            pending.length = 0
            commit()
            markReady()
          })
          .catch((err) => {
            console.error('[realtime] initialData error', err)
            initialized = true
            if (stopped) return
            markReady()
            // Replay buffered events even when history loading failed so
            // live data is not silently dropped.
            for (const raw of pending) {
              if (stopped) break
              const row = onEvent(raw)
              if (row == null) continue
              begin({ immediate: true })
              write({ type: 'insert', value: row })
              commit()
            }
            pending.length = 0
          })
      } else {
        markReady()
      }

      return () => {
        stopped = true
        unsub()
      }
    },
  }

  return { ...collectionConfig, sync }
}
