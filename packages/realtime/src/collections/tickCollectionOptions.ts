/**
 * Tick-based collection options — batches all entity updates within a tick
 * into a single begin/commit cycle.
 *
 * Designed for high-frequency game state updates where individual per-entity
 * events are too expensive.
 */

import { serializeKey } from '../core/serializeKey.js'
import type { CollectionConfig, SyncConfig } from '@tanstack/db'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { QueryKey } from '../core/types.js'
import type { TickFrame, TickTransport } from '../core/tickTransport.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TickCollectionConfig<
  T extends object,
  TKey extends string | number,
  TSchema extends StandardSchemaV1 = never,
> {
  /** The tick transport to subscribe to. */
  transport: TickTransport
  /** Collection id — must be unique across all collections. */
  id?: string
  /** Zod / Standard Schema for type validation. */
  schema?: TSchema
  /** Extract the primary key from a row. */
  getKey: (item: T) => TKey
  /** Extract the entity ID from the key. */
  keyToEntityId: (key: TKey) => string
  /**
   * The channel this collection subscribes to.
   * Accepts a QueryKey array or a pre-serialized channel string.
   */
  channel: QueryKey | string

  /**
   * Convert a raw entity state from a tick frame into a full row object.
   * Called for every entity in every received tick frame.
   *
   * @param entityId The entity ID from the tick frame
   * @param state The raw state object from the frame
   * @param existing The current row if it exists (for delta application)
   */
  fromEntity: (entityId: string, state: unknown, existing?: T) => T

  /**
   * Interpolation function. Given previous state, next state, and
   * alpha (0-1 progress between ticks), return interpolated state.
   * Used for smooth rendering between server ticks.
   */
  interpolate?: (prev: T, next: T, alpha: number) => T

  /**
   * Extrapolation function. Given the last known state and time since
   * last update (ms), predict the current state. Used when a tick is late.
   */
  extrapolate?: (last: T, deltaMs: number) => T
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a TanStack DB `CollectionConfig` that syncs from tick frames.
 *
 * Each received tick frame batches all entity updates into a single
 * begin/commit cycle for efficient rendering.
 *
 * @example
 * const playerCollection = createCollection(tickCollectionOptions({
 *   transport: tickTransport,
 *   channel: 'game:room-1',
 *   getKey: (p) => p.id,
 *   keyToEntityId: (key) => key,
 *   fromEntity: (entityId, state) => ({
 *     id: entityId,
 *     ...(state as { x: number; y: number }),
 *   }),
 * }))
 */
export function tickCollectionOptions<
  T extends object,
  TKey extends string | number,
  TSchema extends StandardSchemaV1 = never,
>(
  config: TickCollectionConfig<T, TKey, TSchema>,
): CollectionConfig<T, TKey, TSchema> {
  const serializedChannel =
    typeof config.channel === 'string'
      ? config.channel
      : serializeKey(config.channel)

  const currentState = new Map<TKey, T>()
  // Reverse index: entityId → key for O(1) lookup per frame entity.
  const entityIdToKey = new Map<string, TKey>()

  const sync: SyncConfig<T, TKey> = {
    rowUpdateMode: 'full',

    sync({ begin, write, commit, markReady }) {
      let stopped = false

      markReady()

      const unsub = config.transport.onTick(
        serializedChannel,
        (frame: TickFrame) => {
          if (stopped) return

          begin({ immediate: true })

          // Process entity updates
          for (const [entityId, state] of Object.entries(frame.entities)) {
            const existingKey = entityIdToKey.get(entityId)
            const existing = existingKey !== undefined
              ? currentState.get(existingKey)
              : undefined
            const row = config.fromEntity(entityId, state, existing)
            const key = config.getKey(row)

            if (currentState.has(key)) {
              write({ type: 'update', value: row })
            } else {
              write({ type: 'insert', value: row })
            }
            currentState.set(key, row)
            entityIdToKey.set(entityId, key)
          }

          // Process removals
          for (const entityId of frame.removed) {
            const key = entityIdToKey.get(entityId)
            if (key !== undefined) {
              write({ type: 'delete', key })
              currentState.delete(key)
              entityIdToKey.delete(entityId)
            }
          }

          commit()
        },
      )

      return () => {
        stopped = true
        unsub()
        currentState.clear()
        entityIdToKey.clear()
      }
    },
  }

  return {
    id: config.id ?? `tick:${serializedChannel}`,
    schema: config.schema,
    getKey: config.getKey,
    sync,
  }
}
