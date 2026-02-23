import { serializeKey } from '../core/serializeKey.js'
import type { QueryKey } from '../core/types.js'

export interface SyncedValueConfig<
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Unique identifier for this synced value definition. */
  id: string
  /**
   * Function that derives the channel key from runtime params.
   * @example
   * channel: ({ userId }: { userId: string }) => ['cursor', { userId }]
   */
  channel: (params: TParams) => QueryKey | string
}

/**
 * A synced value definition — a typed descriptor used by `useSyncedValue`.
 * The type parameter `T` is the type of the shared value.
 * Create at module level and share across components.
 */
export interface SyncedValueDef<
  T,
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly id: string
  resolveChannel: (params: TParams) => string
  /** @internal — phantom type marker only, never has a runtime value */
  readonly _type?: T
}

/**
 * Define a shared value backed by a LWW-Register CRDT.
 *
 * The last write always wins, with concurrent writes resolved by Lamport
 * clock and then by client ID for deterministic tie-breaking. Every client
 * always converges to the same value regardless of message arrival order.
 *
 * Use this for shared state like active cursor positions, selected items,
 * user status indicators, or any value where "most recent wins" is correct.
 *
 * @example
 * // channels.ts — define once
 * export const activeCursor = defineSyncedValue<{ x: number; y: number }>({
 *   id: 'cursor',
 *   channel: ({ userId }: { userId: string }) => ['cursor', { userId }],
 * })
 *
 * // Canvas.tsx — use in React
 * const { value, set } = useSyncedValue(activeCursor, {
 *   params: { userId },
 *   initial: { x: 0, y: 0 },
 * })
 */
export function defineSyncedValue<
  T,
  TParams extends Record<string, unknown> = Record<string, unknown>,
>(config: SyncedValueConfig<TParams>): SyncedValueDef<T, TParams> {
  return {
    id: config.id,
    resolveChannel(params: TParams): string {
      const key = config.channel(params)
      return typeof key === 'string' ? key : serializeKey(key)
    },
  }
}
