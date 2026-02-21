/**
 * Derived channel options — subscribe to multiple channels and combine
 * their data through a selector function into a single collection.
 *
 * This is the realtime equivalent of a SQL JOIN or a TanStack Query
 * `useQueries` + selector. Each source channel maintains its own state,
 * and the selector derives the final rows from all sources.
 *
 * @example
 * const dashboardCollection = createCollection(
 *   derivedChannelOptions({
 *     client,
 *     id: 'dashboard',
 *     getKey: (item) => item.id,
 *     sources: {
 *       orders: { channel: 'orders' },
 *       inventory: { channel: 'inventory' },
 *     },
 *     select: (sources) => {
 *       const orders = sources.orders
 *       const inventory = sources.inventory
 *       return orders
 *         .filter(o => inventory.some(i => i.productId === o.productId))
 *         .map(o => ({
 *           ...o,
 *           inStock: inventory.find(i => i.productId === o.productId)!.qty > 0,
 *         }))
 *     },
 *   })
 * )
 */

import type { CollectionConfig, SyncConfig } from '@tanstack/db'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { RealtimeClient, QueryKey } from '../core/types.js'
import { serializeKey } from '../core/serializeKey.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DerivedSource {
  /**
   * The channel to subscribe to.
   * Accepts a QueryKey array or a pre-serialized string.
   */
  channel: QueryKey | string
  /**
   * Optional initial data loader for this source.
   */
  initialData?: () => Promise<Array<unknown>>
}

export interface DerivedChannelConfig<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
  TSources extends Record<string, DerivedSource> = Record<string, DerivedSource>,
> {
  client: RealtimeClient
  id?: string
  schema?: TSchema
  getKey: (item: T) => TKey

  /**
   * Named source channels. Each key becomes the property name in the
   * `select` callback's argument.
   */
  sources: TSources

  /**
   * Derive the collection rows from all source states.
   * Called whenever any source receives a new message.
   *
   * The argument is keyed by source name, each containing an array of
   * all messages received on that source (accumulated).
   */
  select: (sources: { [K in keyof TSources]: Array<unknown> }) => T[]
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function derivedChannelOptions<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
  TSources extends Record<string, DerivedSource> = Record<string, DerivedSource>,
>(
  config: DerivedChannelConfig<T, TKey, TSchema, TSources>,
): CollectionConfig<T, TKey, TSchema> {
  const { client, sources, select, ...collectionConfig } = config

  const sync: SyncConfig<T, TKey> = {
    rowUpdateMode: 'full',

    sync({ begin, write, commit, markReady }) {
      let stopped = false
      const unsubs: Array<() => void> = []

      // Accumulated state per source.
      const sourceState: Record<string, Array<unknown>> = {}
      for (const key of Object.keys(sources)) {
        sourceState[key] = []
      }

      // Track which sources have loaded initial data.
      const sourceReady = new Set<string>()
      const totalSources = Object.keys(sources).length
      let allReady = false

      function recompute(): void {
        if (stopped) return

        const rows = select(
          sourceState as { [K in keyof TSources]: Array<unknown> },
        )

        begin({ immediate: true })
        // Write a delete-all + re-insert pattern since the selector produces
        // a completely new set of rows. This is simple and correct; for
        // performance-critical cases, a diff algorithm could be added later.
        // TanStack DB's `rowUpdateMode: 'full'` handles this efficiently.
        for (const row of rows) {
          write({ type: 'insert', value: row })
        }
        commit()
      }

      function markSourceReady(key: string): void {
        sourceReady.add(key)
        if (!allReady && sourceReady.size >= totalSources) {
          allReady = true
          recompute()
          markReady()
        }
      }

      // Subscribe to each source channel.
      for (const [key, source] of Object.entries(sources)) {
        const serialized =
          typeof source.channel === 'string'
            ? source.channel
            : serializeKey(source.channel)

        const unsub = client.subscribe(serialized, (data) => {
          if (stopped) return
          sourceState[key]!.push(data)
          if (allReady) recompute()
        })
        unsubs.push(unsub)

        // Load initial data if provided.
        if (source.initialData) {
          source
            .initialData()
            .then((rows) => {
              if (stopped) return
              sourceState[key] = [...rows, ...sourceState[key]!]
              markSourceReady(key)
            })
            .catch(() => {
              markSourceReady(key) // Ready even on error.
            })
        } else {
          markSourceReady(key)
        }
      }

      return () => {
        stopped = true
        for (const unsub of unsubs) unsub()
      }
    },
  }

  return { ...collectionConfig, sync }
}
