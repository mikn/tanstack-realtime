import { serializeKey } from '../core/serializeKey.js'
import type { QueryKey } from '../core/types.js'

export interface SyncedSetConfig<
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Unique identifier for this synced set definition. */
  id: string
  /**
   * Function that derives the channel key from runtime params.
   * @example
   * channel: ({ itemId }: { itemId: string }) => ['item:tags', { itemId }]
   */
  channel: (params: TParams) => QueryKey | string
}

/**
 * A synced set definition — a typed descriptor used by `useSyncedSet`.
 * The type parameter `T` is the type of the set elements.
 * Create at module level and share across components.
 */
export interface SyncedSetDef<
  T,
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly id: string
  resolveChannel: (params: TParams) => string
  /** @internal — phantom type marker only, never has a runtime value */
  readonly _type?: T
}

/**
 * Define a shared set backed by an OR-Set CRDT.
 *
 * Concurrent `add()` and `remove()` calls from multiple clients always
 * converge correctly — an add always wins over a concurrent remove, and
 * a re-add after a remove produces a fresh entry that survives merges.
 *
 * Use this for collaborative tags, reactions, shared selections, or any
 * collection of items where concurrent add/remove must not conflict.
 *
 * @example
 * // channels.ts — define once
 * export const postTags = defineSyncedSet<string>({
 *   id: 'post-tags',
 *   channel: ({ postId }: { postId: string }) => ['post:tags', { postId }],
 * })
 *
 * // Post.tsx — use in React
 * const { values, add, remove, has } = useSyncedSet(postTags, {
 *   params: { postId: post.id },
 *   initial: post.tags,
 * })
 */
export function defineSyncedSet<
  T,
  TParams extends Record<string, unknown> = Record<string, unknown>,
>(config: SyncedSetConfig<TParams>): SyncedSetDef<T, TParams> {
  return {
    id: config.id,
    resolveChannel(params: TParams): string {
      const key = config.channel(params)
      return typeof key === 'string' ? key : serializeKey(key)
    },
  }
}
