/**
 * Message deduplication filter.
 *
 * Maintains a bounded set of recently-seen message IDs per channel.
 * When a message arrives, call `seen(id)` — returns `true` if the ID
 * has already been processed (duplicate), `false` if it is new.
 *
 * The window is capped at `maxSize` entries per channel using LRU eviction.
 * Old entries are automatically pruned when the cap is reached.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DedupOptions {
  /**
   * Maximum number of message IDs to remember per channel.
   * When this limit is reached the oldest entry is evicted.
   * @default 1000
   */
  maxSize?: number
}

export interface DeduplicationFilter {
  /**
   * Returns `true` if `id` has already been seen on `channel` (duplicate).
   * Returns `false` and records the ID if it is new.
   */
  seen(channel: string, id: string): boolean

  /** Remove all tracked IDs for a specific channel. */
  resetChannel(channel: string): void

  /** Remove all tracked IDs across all channels. */
  reset(): void

  /** Number of IDs currently tracked for a channel (for testing). */
  size(channel: string): number
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Create a deduplication filter.
 *
 * @example
 * const dedup = createDedup({ maxSize: 500 })
 *
 * transport.subscribe('chat', (msg) => {
 *   if (dedup.seen('chat', msg.id)) return // skip duplicate
 *   handleMessage(msg)
 * })
 */
export function createDedup(options: DedupOptions = {}): DeduplicationFilter {
  const { maxSize = 1000 } = options
  // Map uses insertion order — iterating from the beginning gives oldest first.
  const channels = new Map<string, Set<string>>()
  // Track insertion order for LRU eviction within each channel.
  const orderMap = new Map<string, string[]>()

  function getOrCreate(channel: string): { set: Set<string>; order: string[] } {
    let set = channels.get(channel)
    let order = orderMap.get(channel)
    if (!set) {
      set = new Set()
      channels.set(channel, set)
    }
    if (!order) {
      order = []
      orderMap.set(channel, order)
    }
    return { set, order }
  }

  return {
    seen(channel: string, id: string): boolean {
      const { set, order } = getOrCreate(channel)
      if (set.has(id)) return true

      // Evict oldest if at capacity.
      while (set.size >= maxSize && order.length > 0) {
        const oldest = order.shift()!
        set.delete(oldest)
      }

      set.add(id)
      order.push(id)
      return false
    },

    resetChannel(channel: string): void {
      channels.delete(channel)
      orderMap.delete(channel)
    },

    reset(): void {
      channels.clear()
      orderMap.clear()
    },

    size(channel: string): number {
      return channels.get(channel)?.size ?? 0
    },
  }
}
