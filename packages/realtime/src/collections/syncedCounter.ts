import { serializeKey } from '../core/serializeKey.js'
import type { QueryKey } from '../core/types.js'

export interface SyncedCounterConfig<
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Unique identifier for this synced counter definition. */
  id: string
  /**
   * Function that derives the channel key from runtime params.
   * @example
   * channel: ({ postId }: { postId: string }) => ['post:votes', { postId }]
   */
  channel: (params: TParams) => QueryKey | string
}

/**
 * A synced counter definition — a typed descriptor used by `useSyncedCounter`.
 * Create at module level and share across components.
 */
export interface SyncedCounterDef<
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly id: string
  resolveChannel: (params: TParams) => string
}

/**
 * Define a shared, concurrent-safe counter backed by a PN-Counter CRDT.
 *
 * Concurrent `increment()` and `decrement()` calls from multiple clients
 * always converge to the correct total — no increments are ever lost, even
 * if two clients modify the counter simultaneously while offline.
 *
 * @example
 * // channels.ts — define once
 * export const postVotes = defineSyncedCounter({
 *   id: 'post-votes',
 *   channel: ({ postId }: { postId: string }) => ['post:votes', { postId }],
 * })
 *
 * // Post.tsx — use in React
 * const { value, increment, decrement } = useSyncedCounter(postVotes, {
 *   params: { postId: post.id },
 *   initial: post.votes,
 * })
 */
export function defineSyncedCounter<
  TParams extends Record<string, unknown> = Record<string, unknown>,
>(config: SyncedCounterConfig<TParams>): SyncedCounterDef<TParams> {
  return {
    id: config.id,
    resolveChannel(params: TParams): string {
      const key = config.channel(params)
      return typeof key === 'string' ? key : serializeKey(key)
    },
  }
}
