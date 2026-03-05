import { use, useEffect, useRef } from 'react'
import { createCollection } from '@tanstack/db'
import { realtimeCollectionOptions, withRest } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { Collection } from '@tanstack/db'
import type {
  RealtimeCollectionConfig,
  WithRestOptions,
} from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Config for `useRealtimeCollection`.
 * Identical to `RealtimeCollectionConfig` but without `client` — the client
 * is sourced automatically from `<RealtimeProvider>`.
 *
 * **REST shorthand:** When `url` is provided and `queryFn` is omitted,
 * `queryFn`, `onInsert`, `onUpdate`, and `onDelete` are generated
 * automatically via {@link withRest}. The channel is also derived from
 * the URL when `channel` is omitted.
 */
export type UseRealtimeCollectionConfig<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
> = Omit<RealtimeCollectionConfig<T, TKey, TSchema>, 'client'> & {
  /** Build the per-item URL for PATCH/DELETE. Default: `${baseUrl}/${key}`. */
  itemUrl?: (key: TKey) => string

  /**
   * Headers for REST requests. Static object or (optionally async) factory.
   * Only used when `url` is provided without `queryFn`.
   */
  headers?: WithRestOptions<T, TKey>['headers']
}

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
 * // REST shorthand — url generates queryFn + CRUD, channel derived from URL
 * import { useRealtimeCollection } from '@tanstack/react-realtime'
 * import { useLiveQuery } from '@tanstack/react-db'
 *
 * function TodoList({ projectId }: { projectId: string }) {
 *   const todos = useRealtimeCollection<Todo>({
 *     url: `/api/todos?projectId=${projectId}`,
 *     getKey: (t) => t.id,
 *   })
 *
 *   const { data } = useLiveQuery((q) =>
 *     q.from({ todos }).select()
 *   )
 *
 *   return <ul>{data.map((t) => <li key={t.id}>{t.text}</li>)}</ul>
 * }
 *
 * @example
 * // Custom data source — pass queryFn directly
 * function TodoList({ projectId }: { projectId: string }) {
 *   const todos = useRealtimeCollection<Todo>({
 *     channel: ['todos', { projectId }],
 *     getKey: (t) => t.id,
 *     queryFn: () => fetchTodos(projectId),
 *   })
 *
 *   // Filter reactively — only re-renders when active todos change
 *   const { data } = useLiveQuery((q) =>
 *     q.from({ todos }).where('status', '=', 'active')
 *   )
 *
 *   return <ul>{data.map((t) => <li key={t.id}>{t.text}</li>)}</ul>
 * }
 *
 * @example
 * // Escape hatch: use TanStack Query for initial data
 * const todos = useRealtimeCollection<Todo>({
 *   channel: ['todos'],
 *   getKey: (t) => t.id,
 *   queryFn: () => queryClient.fetchQuery({ queryKey: ['todos'], queryFn: fetchTodos }),
 * })
 */
export function useRealtimeCollection<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
>(config: UseRealtimeCollectionConfig<T, TKey, TSchema>): Collection<T, TKey> {
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
    // REST shorthand: when `url` is provided without `queryFn`, expand via
    // withRest to generate queryFn + CRUD callbacks automatically.
    const { itemUrl, headers, ...rest } = config
    const collectionConfig =
      config.url && !config.queryFn
        ? {
            ...withRest<T, TKey>({
              url: config.url,
              getKey: config.getKey,
              itemUrl,
              headers,
            }),
            ...rest,
            // Pass url through for channel derivation when channel is omitted
            url: config.channel ? undefined : config.url,
            client,
          }
        : { ...rest, client }

    // createCollection's overloads are strict about schema generics; cast through unknown.
    collectionRef.current = createCollection(
      realtimeCollectionOptions(collectionConfig as never) as never,
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
