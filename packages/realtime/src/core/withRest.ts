import type {
  DeleteMutationFn,
  InsertMutationFn,
  UpdateMutationFn,
} from '@tanstack/db'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface WithRestOptions<
  T extends object,
  TKey extends string | number,
> {
  /**
   * URL used for listing all rows (GET) and creating new rows (POST).
   *
   * Query parameters are preserved for `queryFn` but stripped for per-item
   * URLs (PATCH / DELETE) unless you supply a custom `itemUrl`.
   *
   * @example '/api/tasks?projectId=abc'
   */
  url: string

  /** Extract the primary key from a row — used to build per-item URLs. */
  getKey: (item: T) => TKey

  /**
   * Build the per-item URL used for PATCH (update) and DELETE.
   *
   * Defaults to `baseUrl + '/' + key`, where `baseUrl` is `url` with any
   * query string stripped.
   *
   * @example
   * itemUrl: (id) => `/api/v2/tasks/${id}`
   */
  itemUrl?: (key: TKey) => string

  /**
   * Additional headers attached to every request.
   *
   * Accepts a plain object or an (optionally async) factory — useful for
   * attaching short-lived auth tokens that must be fetched before each call.
   *
   * `Content-Type: application/json` is always included and cannot be
   * overridden here (set it on your server if you need a different value).
   *
   * @example
   * headers: () => ({ Authorization: `Bearer ${getToken()}` })
   */
  headers?:
    | Record<string, string>
    | (() => Record<string, string> | Promise<Record<string, string>>)
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function resolveHeaders(
  extra: WithRestOptions<any, any>['headers'],
): Promise<Record<string, string>> {
  const base: Record<string, string> = { 'Content-Type': 'application/json' }
  if (!extra) return base
  const resolved = typeof extra === 'function' ? await extra() : extra
  return { ...base, ...resolved }
}

// ---------------------------------------------------------------------------
// withRest
// ---------------------------------------------------------------------------

/**
 * Generates `{ getKey, queryFn, onInsert, onUpdate, onDelete }` that wire a
 * standard REST/JSON API to `realtimeCollectionOptions`.
 *
 * Spread the result directly into `realtimeCollectionOptions` and add your
 * realtime config on top — no `nodeServer.publish()` calls needed anywhere,
 * because `realtimeCollectionOptions` automatically broadcasts the value
 * returned by each callback to the channel.
 *
 * ```ts
 * import { withRest, realtimeCollectionOptions } from '@tanstack/realtime'
 *
 * const tasksOptions = (projectId: string) =>
 *   realtimeCollectionOptions({
 *     ...withRest<Task, string>({
 *       url: `/api/tasks?projectId=${projectId}`,
 *       getKey: (t) => t.id,
 *     }),
 *     client: realtimeClient,
 *     channel: ['tasks', { projectId }],
 *     fields: { title: 'lww', status: 'lww', assignees: 'or-set' },
 *   })
 * ```
 *
 * **CRUD mapping**
 *
 * | Operation | HTTP method | URL               |
 * |-----------|-------------|-------------------|
 * | queryFn   | `GET`       | `url`             |
 * | onInsert  | `POST`      | `url` (no params) |
 * | onUpdate  | `PATCH`     | `itemUrl(key)`    |
 * | onDelete  | `DELETE`    | `itemUrl(key)`    |
 *
 * Default `itemUrl`: strips the query string from `url` and appends `/${key}`.
 */
export function withRest<T extends object, TKey extends string | number>(
  options: WithRestOptions<T, TKey>,
): {
  getKey: (item: T) => TKey
  queryFn: () => Promise<Array<T>>
  onInsert: InsertMutationFn<T, TKey>
  onUpdate: UpdateMutationFn<T, TKey>
  onDelete: DeleteMutationFn<T, TKey>
} {
  // Strip query string for per-item operations
  const baseUrl = options.url.split('?')[0]
  const itemUrl = options.itemUrl ?? ((key: TKey) => `${baseUrl}/${key}`)

  return {
    getKey: options.getKey,

    queryFn: async () => {
      const res = await fetch(options.url, {
        headers: await resolveHeaders(options.headers),
      })
      if (!res.ok) {
        throw new Error(`withRest queryFn: ${res.status} ${res.statusText}`)
      }
      return res.json() as Promise<Array<T>>
    },

    onInsert: async ({ transaction }) => {
      const data = transaction.mutations[0].modified
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: await resolveHeaders(options.headers),
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        throw new Error(`withRest onInsert: ${res.status} ${res.statusText}`)
      }
      return res.json() as Promise<T>
    },

    onUpdate: async ({ transaction }) => {
      const data = transaction.mutations[0].modified
      const key = options.getKey(data)
      const res = await fetch(itemUrl(key), {
        method: 'PATCH',
        headers: await resolveHeaders(options.headers),
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        throw new Error(`withRest onUpdate: ${res.status} ${res.statusText}`)
      }
      return res.json() as Promise<T>
    },

    onDelete: async ({ transaction }) => {
      const data = transaction.mutations[0].modified
      const key = options.getKey(data)
      const res = await fetch(itemUrl(key), {
        method: 'DELETE',
        headers: await resolveHeaders(options.headers),
      })
      if (!res.ok) {
        throw new Error(`withRest onDelete: ${res.status} ${res.statusText}`)
      }
    },
  }
}
