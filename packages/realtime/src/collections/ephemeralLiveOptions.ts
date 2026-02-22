import type { CollectionConfig, SyncConfig } from '@tanstack/db'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { RealtimeClient, QueryKey } from '../core/types.js'
import { createEphemeralMap } from '../core/ephemeral.js'
import { serializeKey } from '../core/serializeKey.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EphemeralLiveConfig<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
> {
  /** The realtime client that manages the underlying transport. */
  client: RealtimeClient
  /**
   * The channel to subscribe to.
   * Accepts a QueryKey array or a pre-serialized channel string.
   */
  channel: QueryKey | string
  /** Collection id — must be unique across all collections. */
  id?: string
  /** Zod / Standard Schema for type validation. */
  schema?: TSchema
  /** Extract the primary key from a row. Also used as the ephemeral map key. */
  getKey: (item: T) => TKey
  /**
   * Convert a raw channel event into a row value, or return `null` / `undefined`
   * to discard the event. Setting the same key again resets the TTL timer —
   * use this for "still active" heartbeats (e.g. repeated typing events).
   */
  onEvent: (raw: unknown) => T | null | undefined
  /**
   * Time-to-live in milliseconds. A row that receives no new events within
   * this window is automatically removed from the collection.
   * @default 3000
   */
  ttl?: number
}

// ---------------------------------------------------------------------------
// ephemeralLiveOptions
// ---------------------------------------------------------------------------

/**
 * Creates a TanStack DB `CollectionConfig` backed by an ephemeral map.
 *
 * Each incoming channel event is mapped through `onEvent` to a row value.
 * The row is keyed by `getKey(value)` in an internal ephemeral map. The map
 * entry's TTL resets every time the same key receives a new event. When the
 * TTL expires without a new event, the row is automatically removed from the
 * collection.
 *
 * **Primary use-case — typing indicators:**
 *
 * ```
 * Server events: { type: 'typing', userId: string, name: string }
 * Collection:    { userId: string; name: string }[]  (auto-expires after ttl ms)
 * ```
 *
 * Other suitable use-cases: ephemeral cursors, live video thumbnails,
 * "who is editing this cell" badges, presence-like state for channels that
 * don't support the full presence protocol.
 *
 * @example
 * // Server publishes: { type: 'typing', userId: string, name: string }
 * export const typingCollection = createCollection(
 *   ephemeralLiveOptions({
 *     client,
 *     channel: ['chat', { roomId }],
 *     id: 'typing',
 *     getKey: (item) => item.userId,
 *     onEvent: (raw) => {
 *       const e = raw as { type: string; userId: string; name: string }
 *       if (e.type !== 'typing') return null
 *       return { userId: e.userId, name: e.name }
 *     },
 *     ttl: 3000,
 *   })
 * )
 *
 * // In a component:
 * const typing = useLiveQuery(typingCollection, (q) => q)
 * // → [{ userId: 'u1', name: 'Alice' }, ...] — auto-empty after 3 s of silence
 */
export function ephemeralLiveOptions<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
>(
  config: EphemeralLiveConfig<T, TKey, TSchema>,
): CollectionConfig<T, TKey, TSchema> {
  const { client, channel, getKey, onEvent, ttl = 3000, id, schema } = config

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const sync: SyncConfig<T, TKey> = {
    rowUpdateMode: 'full',

    sync({ begin, write, commit, markReady }) {
      let stopped = false

      // The ephemeral map is recreated per sync session so TTL timers don't
      // bleed across collection mount/unmount cycles.
      const ephemeral = createEphemeralMap<T>({ ttl })

      // Track which keys are currently in the collection so we can emit
      // proper delete operations when entries expire.
      let currentKeys = new Set<TKey>()

      // Reflect the ephemeral map's state into the TanStack DB collection.
      // Fires on every set() and on every TTL expiry.
      const unsubEphemeral = ephemeral.subscribe((entries) => {
        if (stopped) return

        const nextKeys = new Set(entries.map((e) => getKey(e.value)))

        begin({ immediate: true })

        // Deletions for expired entries.
        for (const key of currentKeys) {
          if (!nextKeys.has(key)) {
            write({ type: 'delete', key })
          }
        }

        // Inserts / updates for present entries.
        for (const entry of entries) {
          const key = getKey(entry.value)
          write({
            type: currentKeys.has(key) ? 'update' : 'insert',
            value: entry.value,
          })
        }

        commit()
        currentKeys = nextKeys
      })

      // Feed channel events into the ephemeral map.
      const unsubChannel = client.subscribe(serializedChannel, (raw) => {
        if (stopped) return
        const value = onEvent(raw)
        if (value == null) return
        // String(key) because EphemeralMap keys are always strings internally.
        ephemeral.set(String(getKey(value)), value)
      })

      markReady()

      return () => {
        stopped = true
        unsubChannel()
        unsubEphemeral()
        ephemeral.destroy()
      }
    },
  }

  return {
    id: id ?? `ephemeral:${serializedChannel}`,
    schema,
    getKey,
    sync,
  }
}
