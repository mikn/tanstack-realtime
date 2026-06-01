import { onCleanup } from 'solid-js'
import { createCollection } from '@tanstack/db'
import { liveChannelOptions } from '@realtimejs/core'
import { useRealtimeClient } from './context.js'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { Collection } from '@tanstack/db'
import type { LiveChannelConfig } from '@realtimejs/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Primitive
// ---------------------------------------------------------------------------

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
 * component. Pass it to `useLiveQuery` or `useLiveSuspenseQuery` from
 * `@tanstack/solid-db`.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * import { useLiveChannel } from '@realtimejs/solid'
 * import { useLiveQuery } from '@tanstack/solid-db'
 *
 * function ChatRoom(props) {
 *   const messages = useLiveChannel<ChatMessage>({
 *     id: `chat-${props.roomId}`,
 *     channel: ['chat', { roomId: props.roomId }],
 *     getKey: (m) => m.id,
 *     initialData: () => fetchHistory(props.roomId),
 *     onEvent: (raw) => {
 *       const e = raw as { type: string; message: ChatMessage }
 *       return e.type === 'message' ? e.message : null
 *     },
 *   })
 *
 *   const data = useLiveQuery((q) =>
 *     q.from({ messages }).orderBy(({ messages }) => messages.timestamp)
 *   )
 *
 *   return <div><For each={data()}>{(m) => <p>{m.text}</p>}</For></div>
 * }
 */
export function useLiveChannel<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
>(config: UseLiveChannelConfig<T, TKey, TSchema>): Collection<T, TKey> {
  const client = useRealtimeClient('useLiveChannel')

  // In Solid, the component function runs once, so we can create the
  // collection directly without needing a ref guard.
  // createCollection's overloads are strict about schema generics; cast through unknown.
  const collection = createCollection(
    liveChannelOptions({ ...config, client }) as never,
  ) as unknown as Collection<T, TKey>

  // Clean up when the component unmounts.
  onCleanup(() => {
    void collection.cleanup()
  })

  return collection
}
