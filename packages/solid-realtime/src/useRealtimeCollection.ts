import { onCleanup } from 'solid-js'
import { createCollection } from '@tanstack/db'
import { realtimeCollectionOptions, withRest } from '@tanstack/realtime'
import { useRealtimeClient } from './context.js'
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
// Primitive
// ---------------------------------------------------------------------------

/**
 * Creates and manages the lifecycle of a realtime-backed TanStack DB collection.
 *
 * The returned `Collection` object is **stable** for the lifetime of the
 * component. Pass it to `useLiveQuery` or `useLiveSuspenseQuery` from
 * `@tanstack/solid-db` to query the data reactively.
 *
 * The collection is automatically cleaned up (subscription closed, sync
 * stopped) when the component unmounts.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * // REST shorthand — url generates queryFn + CRUD, channel derived from URL
 * import { useRealtimeCollection } from '@tanstack/solid-realtime'
 * import { useLiveQuery } from '@tanstack/solid-db'
 *
 * function TodoList(props) {
 *   const todos = useRealtimeCollection<Todo>({
 *     url: `/api/todos?projectId=${props.projectId}`,
 *     getKey: (t) => t.id,
 *   })
 *
 *   const data = useLiveQuery((q) =>
 *     q.from({ todos }).select()
 *   )
 *
 *   return <ul><For each={data()}>{(t) => <li>{t.text}</li>}</For></ul>
 * }
 *
 * @example
 * // Custom data source — pass queryFn directly
 * function TodoList(props) {
 *   const todos = useRealtimeCollection<Todo>({
 *     channel: ['todos', { projectId: props.projectId }],
 *     getKey: (t) => t.id,
 *     queryFn: () => fetchTodos(props.projectId),
 *   })
 *
 *   const data = useLiveQuery((q) =>
 *     q.from({ todos }).where('status', '=', 'active')
 *   )
 *
 *   return <ul><For each={data()}>{(t) => <li>{t.text}</li>}</For></ul>
 * }
 */
export function useRealtimeCollection<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
>(config: UseRealtimeCollectionConfig<T, TKey, TSchema>): Collection<T, TKey> {
  const client = useRealtimeClient('useRealtimeCollection')

  // In Solid, the component function runs once, so we can create the
  // collection directly without needing a ref guard.
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
  const collection = createCollection(
    realtimeCollectionOptions(collectionConfig as never) as never,
  ) as unknown as Collection<T, TKey>

  // Clean up when the component unmounts.
  onCleanup(() => {
    void collection.cleanup()
  })

  return collection
}
