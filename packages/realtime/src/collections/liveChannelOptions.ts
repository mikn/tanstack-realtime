import type { CollectionConfig, SyncConfig } from '@tanstack/db'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { RealtimeClient } from '../core/types.js'
import type { QueryKey } from '../core/types.js'
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
   * collection, or `null` to ignore the event.
   */
  onEvent: (event: unknown) => T | null
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

      // Subscribe to incoming channel events.
      const unsub = client.subscribe(serializedChannel, (raw) => {
        if (stopped) return
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
            begin()
            for (const row of rows) {
              write({ type: 'insert', value: row })
            }
            commit()
            markReady()
          })
          .catch((err) => {
            console.error('[realtime] initialData error', err)
            markReady()
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
