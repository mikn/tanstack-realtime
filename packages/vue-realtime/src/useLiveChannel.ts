import { onUnmounted } from 'vue'
import { createCollection } from '@tanstack/db'
import { liveChannelOptions } from '@tanstack/realtime'
import { useRealtimeClient } from './context.js'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { Collection } from '@tanstack/db'
import type { LiveChannelConfig } from '@tanstack/realtime'

/**
 * Config for `useLiveChannel`.
 * Identical to `LiveChannelConfig` but without `client` — the client is
 * sourced automatically from `<RealtimeProvider>`.
 */
export type UseLiveChannelConfig<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
> = Omit<LiveChannelConfig<T, TKey, TSchema>, 'client'>

/**
 * Creates and manages the lifecycle of an append-only live-channel collection.
 *
 * Unlike `useRealtimeCollection` (which is designed for database-backed
 * entities with insert / update / delete semantics), `useLiveChannel` is for
 * append-only streams: chat messages, game events, AI tokens, activity feeds.
 * Every event that passes the `onEvent` filter is inserted as a new row;
 * nothing is updated or deleted.
 *
 * The returned `Collection` object is **stable** for the lifetime of the
 * component. Pass it to `useLiveQuery` from `@tanstack/vue-db`.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * const messages = useLiveChannel<ChatMessage>({
 *   id: `chat-${roomId}`,
 *   channel: ['chat', { roomId }],
 *   getKey: (m) => m.id,
 *   initialData: () => fetchHistory(roomId),
 *   onEvent: (raw) => {
 *     const e = raw as { type: string; message: ChatMessage }
 *     return e.type === 'message' ? e.message : null
 *   },
 * })
 */
export function useLiveChannel<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
>(config: UseLiveChannelConfig<T, TKey, TSchema>): Collection<T, TKey> {
  const client = useRealtimeClient('useLiveChannel')

  // createCollection's overloads are strict about schema generics; cast through unknown.
  const collection = createCollection(
    liveChannelOptions({ ...config, client }) as never,
  ) as unknown as Collection<T, TKey>

  onUnmounted(() => {
    void collection.cleanup()
  })

  return collection
}
