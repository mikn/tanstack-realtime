import { createCollection } from '@tanstack/db'
import type { Collection } from '@tanstack/db'
import type { RealtimeClient } from './core/types.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The single row stored in each query collection.
 * Using a literal `_key` field so `getKey` always returns `'result'`.
 */
export type QueryEntry<T> = {
  _key: 'result'
  value: T | undefined
  error: unknown
}

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
type RegistryEntry = {
  collection: Collection<QueryEntry<unknown>, string>
  refetch: () => void
  /** Current subscribed channel, set after initial fetch resolves. */
  channel: string | null
  /** Apply a data update directly (used by batch fan-out). */
  applyUpdate: ((data: unknown) => void) | null
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
 * Returns an existing registry entry for `key`, or creates a new one.
 *
 * The collection has a single row (`_key === 'result'`) that holds either the
 * latest server value or an error.  Sync writes the initial row immediately
 * (with `value: undefined`) so downstream `useLiveQuery` calls always have
 * an entry to read.
 *
 * The `refetch` function triggers a new server-function call and overwrites
 * the row with fresh data.
 */
export function getOrCreateQueryCollection<T>(
  key: string,
  serverFn: (args: unknown) => Promise<ReactiveQueryResult<T>>,
  args: unknown,
  client: RealtimeClient,
): RegistryEntry {
  const existing = registry.get(key)
  if (existing != null) {
    // Re-use only if the collection has not been cleaned up
    if (existing.collection.status !== 'cleaned-up') return existing
  }

  // `triggerRefetch` is set inside the sync callback once the collection is
  // created.  We capture it via closure so `entry.refetch` always calls the
  // most recent fetch loop.
  let triggerRefetch: (() => void) | null = null

  const collection = createCollection<QueryEntry<T>, string>({
    id: key,
    getKey: (entry) => entry._key,

    // Allow optimistic updates to this collection without persisting to any
    // server. The onUpdate handler is intentionally a no-op — callers are
    // responsible for rolling back if needed.
    onUpdate: () => Promise.resolve(undefined),

    sync: {
      rowUpdateMode: 'full',

      sync({ begin, write, commit, markReady }) {
        let stopped = false
        let channelUnsub: (() => void) | null = null
        let hasCalledMarkReady = false

        // Write an initial placeholder row immediately so consumers always
        // have an entry to read (value === undefined indicates pending).
        begin({ immediate: true })
        write({
          type: 'insert',
          value: { _key: 'result', value: undefined, error: null },
        })
        commit()

        function applyData(data: unknown): void {
          begin({ immediate: true })
          write({
            type: 'update',
            value: { _key: 'result', value: data as T, error: null },
          })
          commit()
        }

        function runFetch(): void {
          serverFn(args)
            .then(({ data, channel }) => {
              if (stopped) return

              // Overwrite the placeholder with the real data.
              applyData(data)
              if (!hasCalledMarkReady) {
                markReady()
                hasCalledMarkReady = true
              }

              // Register channel in the reverse index and on the entry.
              // This enables O(1) batch fan-out in subscribeToRealtimeBatch.
              if (entry.channel !== channel) {
                if (entry.channel != null) {
                  channelIndex.delete(entry.channel)
                }
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
              begin({ immediate: true })
              write({
                type: 'update',
                value: { _key: 'result', value: undefined, error: e },
              })
              commit()
              if (!hasCalledMarkReady) {
                markReady()
                hasCalledMarkReady = true
              }
            })
        }

        triggerRefetch = runFetch
        runFetch()

        return () => {
          stopped = true
          channelUnsub?.()
          triggerRefetch = null
          if (entry.channel != null) {
            channelIndex.delete(entry.channel)
          }
          registry.delete(key)
        }
      },
    },
  })

  const entry: RegistryEntry = {
    collection: collection as unknown as Collection<
      QueryEntry<unknown>,
      string
    >,
    refetch: () => triggerRefetch?.(),
    channel: null,
    applyUpdate: null,
  }
  registry.set(key, entry)
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
