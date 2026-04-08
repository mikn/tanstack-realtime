import { createCollection } from '@tanstack/db'
import type { Collection } from '@tanstack/db'
import type { RealtimeClient } from './core/types.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The shape returned by a reactive server function.
 * The server function returns the initial data plus a channel name to
 * subscribe to for live updates.
 */
export type ReactiveQueryResult<T> = {
  data: T
  channel: string
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
type RegistryEntry<TItem = unknown> = {
  collection: Collection<TItem, string>
  getKey: (item: TItem) => string
  /** Live map of server-confirmed items, keyed by getKey(item). */
  currentItems: Map<string, TItem>
  refetch: () => void
  /** Current subscribed channel, set after initial fetch resolves. */
  channel: string | null
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
const fnIds = new WeakMap<Function, string>()
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
export function deriveCacheKey(fn: Function, args: unknown): string {
  if (!fnIds.has(fn)) fnIds.set(fn, `fn_${counter++}`)
  return `${fnIds.get(fn)!}::${JSON.stringify(args)}`
}

/**
 * Look up an existing registry entry without creating one.
 * Used by `optimisticCache` to apply optimistic updates to already-mounted queries.
 */
export function lookupQueryCollection<TItem>(
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
export function getOrCreateQueryCollection<TItem>(
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
        let channelUnsub: (() => void) | null = null
        let hasCalledMarkReady = false

        function applyData(rawData: unknown): void {
          const data = rawData as Array<TItem>
          const newKeys = new Set(data.map((item) => getKey(item)))
          const prevKeys = new Set(currentItems.keys())

          begin({ immediate: true })

          // Delete items no longer in the result set
          for (const k of prevKeys) {
            if (!newKeys.has(k)) {
              write({ type: 'delete', value: currentItems.get(k)! })
            }
          }

          // Insert new items / update existing ones
          for (const item of data) {
            const k = getKey(item)
            write({ type: prevKeys.has(k) ? 'update' : 'insert', value: item })
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
            .then(({ data, channel }) => {
              if (stopped) return

              applyData(data)
              entry.error = null

              if (!hasCalledMarkReady) {
                markReady()
                hasCalledMarkReady = true
                entry.isReady = true
                for (const l of entry.readyListeners) l()
              }

              // Register channel in the reverse index
              if (entry.channel !== channel) {
                if (entry.channel != null) channelIndex.delete(entry.channel)
                entry.channel = channel
                entry.applyUpdate = applyData
                channelIndex.set(channel, key)
              }

              // Subscribe to the individual channel as fallback for direct
              // realtime.publish() calls that don't go through batch.
              channelUnsub?.()
              channelUnsub = client.subscribe(channel, (msg: unknown) => {
                if (stopped) return
                applyData(msg)
              })
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
          channelUnsub?.()
          triggerRefetch = null
          if (entry.channel != null) channelIndex.delete(entry.channel)
          registry.delete(key)
          currentItems.clear()
        }
      },
    },
  })

  const entry: RegistryEntry<TItem> = {
    collection: collection as unknown as Collection<TItem, string>,
    getKey,
    currentItems,
    refetch: () => triggerRefetch?.(),
    channel: null,
    applyUpdate: null,
    isReady: false,
    readyListeners: new Set(),
    error: null,
    errorListeners: new Set(),
    dataListeners: new Set(),
  }
  registry.set(key, entry as RegistryEntry<unknown>)
  return entry
}

/**
 * The SSE channel name used for batched invalidation messages.
 * Re-exported here so client packages can reference it without depending
 * on `@tanstack/realtime-preset-start`.
 */
export const REALTIME_BATCH_CHANNEL = '__realtime_batch__'

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
    for (const { channel, data } of batch.updates) {
      const cacheKey = channelIndex.get(channel)
      if (cacheKey == null) continue
      registry.get(cacheKey)?.applyUpdate?.(data)
    }
  })
}
