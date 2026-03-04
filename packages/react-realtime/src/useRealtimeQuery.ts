import { useLiveQuery } from '@tanstack/react-db'
import { withRest } from '@tanstack/realtime'
import { useRealtimeCollection } from './useRealtimeCollection.js'
import type {
  Collection,
  CollectionStatus,
  DeleteMutationFn,
  InsertMutationFn,
  UpdateMutationFn,
} from '@tanstack/db'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type {
  CrdtFields,
  QueryKey,
  RealtimeChannelMessage,
  WithRestOptions,
} from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Config for `useRealtimeQuery`.
 *
 * Provide **either** `url` (REST shorthand) **or** `queryFn` + manual mutation
 * callbacks — not both.
 *
 * When `url` is provided, `queryFn`, `onInsert`, `onUpdate`, and `onDelete`
 * are generated automatically via {@link withRest}.
 */
export type UseRealtimeQueryConfig<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = never,
> = {
  // --- Required ---------------------------------------------------------

  /** Extract the primary key from a row. */
  getKey: (item: T) => TKey

  // --- Data source: REST shorthand --------------------------------------

  /**
   * REST endpoint URL.
   *
   * When provided, `queryFn` and CRUD mutation callbacks (`onInsert`,
   * `onUpdate`, `onDelete`) are generated automatically:
   *
   * | Operation | HTTP method | URL               |
   * |-----------|-------------|-------------------|
   * | queryFn   | `GET`       | `url`             |
   * | onInsert  | `POST`      | base URL (no QS)  |
   * | onUpdate  | `PATCH`     | `itemUrl(key)`    |
   * | onDelete  | `DELETE`    | `itemUrl(key)`    |
   *
   * Cannot be combined with `queryFn` / `onInsert` / `onUpdate` / `onDelete`.
   */
  url?: string

  /** Build the per-item URL for PATCH/DELETE. Default: `${baseUrl}/${key}`. */
  itemUrl?: (key: TKey) => string

  /**
   * Headers for REST requests. Static object or (optionally async) factory.
   * Only used when `url` is provided.
   */
  headers?: WithRestOptions<T, TKey>['headers']

  // --- Data source: manual ----------------------------------------------

  /** Initial data loader. Use instead of `url` for non-REST sources. */
  queryFn?: () => Promise<Array<T>>
  /** Persist a local insert. Use instead of `url` for non-REST sources. */
  onInsert?: InsertMutationFn<T, TKey>
  /** Persist a local update. Use instead of `url` for non-REST sources. */
  onUpdate?: UpdateMutationFn<T, TKey>
  /** Persist a local delete. Use instead of `url` for non-REST sources. */
  onDelete?: DeleteMutationFn<T, TKey>

  // --- Collection identity ----------------------------------------------

  /** Collection id — must be unique across all collections. */
  id?: string
  /** Zod / Standard Schema for type validation. */
  schema?: TSchema

  // --- Realtime (optional, progressive) ---------------------------------

  /**
   * Channel to subscribe to and publish back to.
   * Accepts a QueryKey array or a pre-serialized string.
   * Omit for server-only mode (no peer sync).
   */
  channel?: QueryKey | string

  /** Additional read-only channels (fan-in). */
  channels?: Array<QueryKey | string>

  /**
   * Per-field CRDT convergence strategy.
   *
   * ```ts
   * fields: {
   *   title: 'lww',        // Last-write-wins
   *   votes: 'pn-counter', // Concurrent increments always add up
   *   tags:  'or-set',     // Concurrent add/remove never conflicts
   *   draft: 'local',      // Client-only, never synced
   * }
   * ```
   */
  fields?: CrdtFields<T>

  /** Enable optimistic updates with echo suppression. */
  optimistic?: boolean

  /** Consume-only mode — server functions are the exclusive publishers. */
  serverAuthoritative?: boolean

  /** Re-fetch after reconnection gaps. */
  refetchOnReconnect?: boolean

  /** Transform raw channel messages into the standard shape. */
  onMessage?: (raw: unknown) => RealtimeChannelMessage<T> | null | undefined

  /** Called when a subscription is rejected (e.g. authorization denied). */
  onSubscribeError?: (channel: string, reason: string, code?: number) => void

  /** Called when an optimistic mutation fails. UI feedback only. */
  onOptimisticError?: (params: {
    action: 'insert' | 'update' | 'delete'
    key: TKey
    error: unknown
  }) => void
}

export interface UseRealtimeQueryResult<
  T extends object,
  TKey extends string | number,
> {
  /** Reactive data array. Re-renders on every insert, update, or delete. */
  data: Array<T>

  /**
   * The underlying TanStack DB Collection.
   *
   * Use for mutations:
   * ```ts
   * collection.insert({ id: uuid(), text: 'New item' })
   * collection.update(id, (draft) => { draft.done = true })
   * collection.delete(id)
   * ```
   *
   * Or pass to `useLiveQuery` from `@tanstack/react-db` for advanced queries
   * (filtering, joining, aggregating).
   */
  collection: Collection<T, TKey>

  /** Collection lifecycle status. */
  status: CollectionStatus

  /** `true` while `queryFn` is loading initial data. */
  isLoading: boolean
  /** `true` once initial data is loaded and the collection is ready. */
  isReady: boolean
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * One-hook API for realtime-backed data.
 *
 * Combines collection creation, sync lifecycle, and reactive rendering into a
 * single call. Returns a reactive `data` array that re-renders on every
 * change, plus the underlying `collection` for mutations.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * // REST shorthand — generates queryFn + CRUD automatically
 * function TodoList({ projectId }: { projectId: string }) {
 *   const { data: todos, collection } = useRealtimeQuery({
 *     url: `/api/todos?projectId=${projectId}`,
 *     getKey: (t: Todo) => t.id,
 *     channel: ['todos', { projectId }],
 *   })
 *
 *   return (
 *     <ul>
 *       {todos.map(t => <li key={t.id}>{t.text}</li>)}
 *     </ul>
 *   )
 * }
 *
 * @example
 * // Progressive enhancement — add features one key at a time
 * const { data, collection } = useRealtimeQuery({
 *   url: '/api/todos',
 *   getKey: (t: Todo) => t.id,
 *   channel: ['todos'],                         // ← realtime sync
 *   fields: { title: 'lww', tags: 'or-set' },   // ← CRDTs
 *   optimistic: true,                            // ← instant UI
 *   refetchOnReconnect: true,                    // ← gap recovery
 * })
 *
 * @example
 * // Custom data source (non-REST)
 * const { data, collection } = useRealtimeQuery({
 *   getKey: (t: Todo) => t.id,
 *   queryFn: () => myApi.listTodos(),
 *   onInsert: async ({ transaction }) => myApi.create(transaction.mutations[0].modified),
 *   onUpdate: async ({ transaction }) => myApi.update(transaction.mutations[0].modified),
 *   onDelete: async ({ transaction }) => myApi.remove(transaction.mutations[0].modified),
 *   channel: ['todos'],
 * })
 */
export function useRealtimeQuery<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = never,
>(
  config: UseRealtimeQueryConfig<T, TKey, TSchema>,
): UseRealtimeQueryResult<T, TKey> {
  // Build the collection config — either from REST shorthand or manual callbacks.
  const collectionConfig = config.url
    ? {
        ...withRest<T, TKey>({
          url: config.url,
          getKey: config.getKey,
          itemUrl: config.itemUrl,
          headers: config.headers,
        }),
        id: config.id,
        schema: config.schema,
        channel: config.channel,
        channels: config.channels,
        fields: config.fields,
        optimistic: config.optimistic,
        serverAuthoritative: config.serverAuthoritative,
        refetchOnReconnect: config.refetchOnReconnect,
        onMessage: config.onMessage,
        onSubscribeError: config.onSubscribeError,
        onOptimisticError: config.onOptimisticError,
      }
    : {
        getKey: config.getKey,
        queryFn: config.queryFn,
        onInsert: config.onInsert,
        onUpdate: config.onUpdate,
        onDelete: config.onDelete,
        id: config.id,
        schema: config.schema,
        channel: config.channel,
        channels: config.channels,
        fields: config.fields,
        optimistic: config.optimistic,
        serverAuthoritative: config.serverAuthoritative,
        refetchOnReconnect: config.refetchOnReconnect,
        onMessage: config.onMessage,
        onSubscribeError: config.onSubscribeError,
        onOptimisticError: config.onOptimisticError,
      }

  // Create a stable, lifecycle-managed collection via context.
  const collection = useRealtimeCollection<T, TKey, TSchema>(
    collectionConfig as Parameters<
      typeof useRealtimeCollection<T, TKey, TSchema>
    >[0],
  )

  // Reactive data via useLiveQuery — single subscription path, no duplication
  // if the user also queries this collection elsewhere.
  const { data, status, isLoading, isReady } = useLiveQuery((q) =>
    q.from({ items: collection }),
  )

  return {
    data: data as Array<T>,
    collection,
    status,
    isLoading,
    isReady,
  }
}
