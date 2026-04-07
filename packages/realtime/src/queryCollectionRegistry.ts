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

// Internal registry entry shape — not exported
type RegistryEntry = {
  collection: Collection<QueryEntry<unknown>, string>
  refetch: () => void
}

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

/** Module-level singleton registry keyed by cache key string. */
const registry = new Map<string, RegistryEntry>()

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
    const status = (existing.collection as unknown as { status: string }).status
    if (status !== 'cleaned-up') return existing
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

        // Write an initial placeholder row immediately so consumers always
        // have an entry to read (value === undefined indicates pending).
        begin()
        write({
          type: 'insert',
          value: { _key: 'result', value: undefined, error: null },
        })
        commit()

        function runFetch(): void {
          serverFn(args)
            .then(({ data, channel }) => {
              if (stopped) return

              // Overwrite the placeholder with the real data.
              begin({ immediate: true })
              write({
                type: 'update',
                value: { _key: 'result', value: data, error: null },
              })
              commit()
              markReady()

              // Subscribe to the channel for live updates.
              channelUnsub?.()
              channelUnsub = client.subscribe(channel, (msg: unknown) => {
                if (stopped) return
                begin({ immediate: true })
                write({
                  type: 'update',
                  value: { _key: 'result', value: msg as T, error: null },
                })
                commit()
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
              markReady()
            })
        }

        triggerRefetch = runFetch
        runFetch()

        return () => {
          stopped = true
          channelUnsub?.()
          triggerRefetch = null
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
  }
  registry.set(key, entry)
  return entry
}
