import { use, useEffect, useRef } from 'react'
import { createCollection } from '@tanstack/db'
import { liveChannelOptions } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { Collection } from '@tanstack/db'
import type { LiveChannelConfig } from '@tanstack/realtime'

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
// Hook
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
 * The returned `Collection` object is **stable** across renders.  Pass it to
 * `useLiveQuery` or `useLiveSuspenseQuery` from `@tanstack/react-db`.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * import { useLiveChannel } from '@tanstack/react-realtime'
 * import { useLiveQuery } from '@tanstack/react-db'
 *
 * function ChatRoom({ roomId }: { roomId: string }) {
 *   const messages = useLiveChannel<ChatMessage>({
 *     id: `chat-${roomId}`,
 *     channel: ['chat', { roomId }],
 *     getKey: (m) => m.id,
 *     initialData: () => fetchHistory(roomId),
 *     onEvent: (raw) => {
 *       const e = raw as { type: string; message: ChatMessage }
 *       return e.type === 'message' ? e.message : null
 *     },
 *   })
 *
 *   const { data } = useLiveQuery((q) =>
 *     q.from({ messages }).orderBy(({ messages }) => messages.timestamp)
 *   )
 *
 *   return <div>{data.map((m) => <p key={m.id}>{m.text}</p>)}</div>
 * }
 */
export function useLiveChannel<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
>(config: UseLiveChannelConfig<T, TKey, TSchema>): Collection<T, TKey> {
  const client = use(RealtimeContext)
  if (!client) {
    throw new Error(
      '[realtime] useLiveChannel must be used inside <RealtimeProvider>.',
    )
  }

  // Hold the collection in a ref so it is created once and stays stable.
  const collectionRef = useRef<Collection<T, TKey> | null>(null)

  if (!collectionRef.current) {
    // createCollection's overloads are strict about schema generics; cast through unknown.
    collectionRef.current = createCollection(
      liveChannelOptions({ ...config, client }) as never,
    ) as unknown as Collection<T, TKey>
  }

  // Clean up when the component unmounts.
  // Reset the ref to null so React Strict Mode's simulated unmount+remount
  // cycle creates a fresh collection rather than reusing the cleaned-up one.
  useEffect(() => {
    const col = collectionRef.current!
    return () => {
      void col.cleanup()
      collectionRef.current = null
    }
  }, [])

  return collectionRef.current
}
