import { use, useEffect, useRef } from 'react'
import { createCollection } from '@tanstack/db'
import { realtimeCollectionOptions } from '@tanstack/realtime'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { Collection } from '@tanstack/db'
import type { RealtimeCollectionConfig } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Config for `useRealtimeCollection`.
 * Identical to `RealtimeCollectionConfig` but without `client` — the client
 * is sourced automatically from `<RealtimeProvider>`.
 */
export type UseRealtimeCollectionConfig<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
> = Omit<RealtimeCollectionConfig<T, TKey, TSchema>, 'client'>

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Creates and manages the lifecycle of a realtime-backed TanStack DB collection.
 *
 * The returned `Collection` object is **stable** across renders (identity is
 * preserved until the component unmounts).  Pass it to `useLiveQuery` or
 * `useLiveSuspenseQuery` from `@tanstack/react-db` to query the data
 * reactively.
 *
 * The collection is automatically cleaned up (subscription closed, sync
 * stopped) when the component unmounts.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * import { useRealtimeCollection } from '@tanstack/react-realtime'
 * import { useLiveQuery } from '@tanstack/react-db'
 *
 * function TodoList({ projectId }: { projectId: string }) {
 *   const todos = useRealtimeCollection<Todo>({
 *     id: `todos-${projectId}`,
 *     channel: ['todos', { projectId }],
 *     getKey: (t) => t.id,
 *     queryFn: () => fetchTodos(projectId),
 *   })
 *
 *   const { data } = useLiveQuery((q) =>
 *     q.from({ todos }).select()
 *   )
 *
 *   return <ul>{data.map((t) => <li key={t.id}>{t.text}</li>)}</ul>
 * }
 */
export function useRealtimeCollection<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
>(
  config: UseRealtimeCollectionConfig<T, TKey, TSchema>,
): Collection<T, TKey> {
  const client = use(RealtimeContext)
  if (!client) {
    throw new Error(
      '[realtime] useRealtimeCollection must be used inside <RealtimeProvider>.',
    )
  }

  // Hold the collection in a ref so it is created once and stays stable
  // across renders. Created synchronously so it is available on the first
  // render for useLiveQuery / useLiveSuspenseQuery.
  const collectionRef = useRef<Collection<T, TKey> | null>(null)

  if (!collectionRef.current) {
    // createCollection's overloads are strict about schema generics; cast through unknown.
    collectionRef.current = createCollection(
      realtimeCollectionOptions({ ...config, client }) as never,
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
