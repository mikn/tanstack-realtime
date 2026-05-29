import { createCollection } from '@tanstack/db'
import { REALTIME_BATCH_CHANNEL } from './reactive/engine.js'
import type { Collection } from '@tanstack/db'
import type { RealtimeClient } from './core/types.js'

export { REALTIME_BATCH_CHANNEL }

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The shape returned by a reactive server function.
 * The server function returns the initial data plus the channel name(s) to
 * subscribe to for live updates.
 *
 * A query that reads multiple tables (multiple `db.select().from(...)` calls)
 * is reactive to writes on ALL of them, so it carries one channel per read in
 * `channels`. `channel` is kept as `channels[0]` for back-compat with single-
 * table consumers; new code should fan out over `channels`.
 */
export type ReactiveQueryResult<T> = {
  data: T
  /**
   * The primary channel — always `channels[0]`. Retained for back-compat;
   * prefer `channels` so multi-table queries stay live on every read.
   */
  channel: string
  /**
   * Every channel this query reads from. A single-table query has one entry
   * equal to `channel`. May be absent on results produced by older server
   * functions, in which case consumers fall back to `[channel]`.
   */
  channels?: ReadonlyArray<string>
}

/**
 * A reactive server query function created by `realtime.query()`.
 * The phantom fields `_tag`, `_args`, `_result` are never set at runtime —
 * they exist only for TypeScript inference in client hooks like `useQuery`.
 */
export type ReactiveQueryFn<TArgs, TResult> = ((
  args: TArgs,
) => Promise<ReactiveQueryResult<TResult>>) & {
  readonly _tag: 'ReactiveQuery'
  readonly _args: TArgs
  readonly _result: TResult
}

/**
 * A reactive server mutation function created by `realtime.mutation()`.
 * The phantom fields `_tag`, `_args`, `_result` are never set at runtime —
 * they exist only for TypeScript inference in client hooks like `useMutation`.
 */
export type ReactiveMutationFn<TArgs, TResult> = ((
  args: TArgs,
) => Promise<TResult>) & {
  readonly _tag: 'ReactiveMutation'
  readonly _args: TArgs
  readonly _result: TResult
}

// Internal registry entry shape — not exported
type RegistryEntry<
  TItem extends Record<string, unknown> = Record<string, unknown>,
> = {
  collection: Collection<TItem, string>
  getKey: (item: TItem) => string
  /** Live map of server-confirmed items, keyed by getKey(item). */
  currentItems: Map<string, TItem>
  refetch: () => void
  /**
   * Current subscribed channels, set after initial fetch resolves. A single-
   * table query has one entry; a multi-table query has one per read. Every
   * channel is mapped to this entry's cache key in `channelIndex` so a batch
   * update on ANY of them refreshes the query.
   */
  channels: ReadonlyArray<string>
  /** Apply a data update directly (used by batch fan-out). */
  applyUpdate: ((data: unknown) => void) | null
  /** Whether the first fetch has completed (markReady called). */
  isReady: boolean
  /** Listeners notified when the first fetch completes (or errors). */
  readyListeners: Set<() => void>
  /** The error from the last failed fetch, or null. */
  error: unknown
  /** Listeners notified when a fetch errors. */
  errorListeners: Set<(e: unknown) => void>
  /** Listeners notified whenever new data arrives from the server. */
  dataListeners: Set<() => void>
}

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

/** Module-level singleton registry keyed by cache key string. */
const registry = new Map<string, RegistryEntry>()

/** Reverse index: channel → cache key. Used for O(1) batch fan-out. */
const channelIndex = new Map<string, string>()

/** Clears all entries from the registry. Used in tests only. */
export function clearRegistry(): void {
  registry.clear()
  channelIndex.clear()
}

/** WeakMap to assign stable string identifiers to server function references. */
const fnIds = new WeakMap<object, string>()
let counter = 0

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Derives a stable string cache key for a `(serverFn, args)` pair.
 *
 * Server functions are identified by object identity (via WeakMap). Args are
 * serialised with `JSON.stringify`, so they must be JSON-serialisable.
 */
export function deriveCacheKey(fn: object, args: unknown): string {
  if (!fnIds.has(fn)) fnIds.set(fn, `fn_${counter++}`)
  return `${fnIds.get(fn)!}::${JSON.stringify(args)}`
}

/**
 * Look up an existing registry entry without creating one.
 * Used by `optimisticCache` to apply optimistic updates to already-mounted queries.
 */
export function lookupQueryCollection<TItem extends Record<string, unknown>>(
  key: string,
): RegistryEntry<TItem> | null {
  const entry = registry.get(key)
  if (entry == null || entry.collection.status === 'cleaned-up') return null
  return entry as RegistryEntry<TItem>
}

/**
 * Returns an existing registry entry for `key`, or creates a new one.
 *
 * The collection stores one row per item returned by the server function,
 * keyed by `getKey(item)`. This makes the collection compatible with
 * TanStack DB's `useLiveQuery` for client-side filtering, sorting, and joining.
 *
 * On each server push the collection is diffed: new items are inserted,
 * changed items are updated, and removed items are deleted — all in a single
 * synchronous batch so downstream reactive queries see a consistent snapshot.
 */
export function getOrCreateQueryCollection<
  TItem extends Record<string, unknown>,
>(
  key: string,
  serverFn: (args: unknown) => Promise<ReactiveQueryResult<Array<TItem>>>,
  args: unknown,
  getKey: (item: TItem) => string,
  client: RealtimeClient,
): RegistryEntry<TItem> {
  const existing = registry.get(key)
  if (existing != null) {
    if (existing.collection.status !== 'cleaned-up')
      return existing as RegistryEntry<TItem>
  }

  let triggerRefetch: (() => void) | null = null
  const currentItems = new Map<string, TItem>()

  const collection = createCollection<TItem, string>({
    id: key,
    getKey,

    // No-op handlers: data flows exclusively through the sync channel.
    // optimisticCache uses insert/update/delete for client-side speculation
    // and these handlers confirm immediately so no server round-trip happens.
    onInsert: () => Promise.resolve(undefined),
    onUpdate: () => Promise.resolve(undefined),
    onDelete: () => Promise.resolve(undefined),

    sync: {
      rowUpdateMode: 'full',

      sync({ begin, write, commit, markReady }) {
        let stopped = false
        let channelUnsubs: Array<() => void> = []
        let hasCalledMarkReady = false

        function applyData(rawData: unknown): void {
          const data = rawData as Array<TItem>
          const newKeys = new Set(data.map((item) => getKey(item)))
          const prevKeys = new Set(currentItems.keys())

          begin({ immediate: true })

          // Delete items no longer in the result set
          for (const k of prevKeys) {
            if (!newKeys.has(k)) {
              write({ type: 'delete', key: k })
            }
          }

          // Insert new items / update existing ones
          for (const item of data) {
            const k = getKey(item)
            write({
              type: prevKeys.has(k) ? 'update' : 'insert',
              value: item,
            })
            currentItems.set(k, item)
          }

          // Remove stale keys from the tracking map
          for (const k of prevKeys) {
            if (!newKeys.has(k)) currentItems.delete(k)
          }

          commit()

          // Notify data listeners (used by hooks to clear isFetching)
          for (const listener of entry.dataListeners) listener()
        }

        function runFetch(): void {
          serverFn(args)
            .then(({ data, channel, channels }) => {
              if (stopped) return

              applyData(data)
              entry.error = null

              if (!hasCalledMarkReady) {
                markReady()
                hasCalledMarkReady = true
                entry.isReady = true
                for (const l of entry.readyListeners) l()
              }

              // A multi-table query is reactive to writes on ALL its tables, so
              // every channel must map back to this query. Fall back to the
              // single `channel` for older server functions that omit `channels`.
              const nextChannels =
                channels != null && channels.length > 0 ? channels : [channel]

              // Re-index only when the set actually changed (e.g. args-driven
              // refetch produced different channels). Drop stale entries first.
              const changed =
                nextChannels.length !== entry.channels.length ||
                nextChannels.some((c, i) => c !== entry.channels[i])
              if (changed) {
                for (const prev of entry.channels) channelIndex.delete(prev)
                entry.channels = nextChannels
                entry.applyUpdate = applyData
                for (const c of nextChannels) channelIndex.set(c, key)
              }

              // Subscribe to each individual channel as a fallback for direct
              // realtime.publish() calls that don't go through the batch.
              for (const unsub of channelUnsubs) unsub()
              channelUnsubs = nextChannels.map((c) =>
                client.subscribe(c, (msg: unknown) => {
                  if (stopped) return
                  applyData(msg)
                }),
              )
            })
            .catch((e: unknown) => {
              if (stopped) return
              entry.error = e
              for (const listener of entry.errorListeners) listener(e)
              if (!hasCalledMarkReady) {
                markReady()
                hasCalledMarkReady = true
                entry.isReady = true
                for (const l of entry.readyListeners) l()
              }
            })
        }

        triggerRefetch = runFetch
        runFetch()

        return () => {
          stopped = true
          for (const unsub of channelUnsubs) unsub()
          channelUnsubs = []
          triggerRefetch = null
          // Clean up ALL of this query's channel index entries, not just one.
          for (const c of entry.channels) channelIndex.delete(c)
          registry.delete(key)
          currentItems.clear()
        }
      },
    },
  })

  const entry: RegistryEntry<TItem> = {
    // createCollection returns Collection<TItem, string, UtilsRecord, never, TItem> (TSchema=never
    // since no schema is provided). RegistryEntry uses Collection<TItem, string> whose TSchema
    // defaults to StandardSchemaV1 — a type parameter that affects no runtime behaviour here.
    // The double cast bridges this nominal schema type mismatch safely.
    collection: collection as unknown as Collection<TItem, string>,
    getKey,
    currentItems,
    refetch: () => triggerRefetch?.(),
    channels: [],
    applyUpdate: null,
    isReady: false,
    readyListeners: new Set(),
    error: null,
    errorListeners: new Set(),
    dataListeners: new Set(),
  }
  registry.set(key, entry as RegistryEntry<Record<string, unknown>>)
  return entry
}

/**
 * Subscribes to the batch channel and synchronously fans out all updates
 * to their respective query collections.
 *
 * Wire this into your `RealtimeProvider` to enable consistent cross-query
 * snapshots: all queries invalidated by a single mutation will update in
 * the same React/Vue/Solid render pass.
 *
 * Returns an unsubscribe function.
 */
export function subscribeToRealtimeBatch(client: RealtimeClient): () => void {
  return client.subscribe(REALTIME_BATCH_CHANNEL, (msg: unknown) => {
    const batch = msg as {
      type: string
      updates: Array<{ channel: string; data: unknown }>
    }
    if (batch.type !== 'realtime_batch') return

    // Synchronous fan-out — React 18 / Vue / Solid batch the resulting
    // state updates into a single render.
    //
    // DEDUPE by cache key: a single mutation can touch multiple tables that a
    // multi-table query reads, producing several updates that all map to the
    // SAME query. Each update carries the full fresh result, so applying the
    // last one per query is sufficient — apply once to avoid redundant
    // re-renders / double application.
    const latestByKey = new Map<string, unknown>()
    for (const { channel, data } of batch.updates) {
      const cacheKey = channelIndex.get(channel)
      if (cacheKey == null) continue
      latestByKey.set(cacheKey, data)
    }
    for (const [cacheKey, data] of latestByKey) {
      registry.get(cacheKey)?.applyUpdate?.(data)
    }
  })
}
