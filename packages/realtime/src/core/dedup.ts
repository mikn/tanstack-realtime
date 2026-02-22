/**
 * Message deduplication filter.
 *
 * Maintains a bounded set of recently-seen message IDs per channel.
 * When a message arrives, call `seen(id)` — returns `true` if the ID
 * has already been processed (duplicate), `false` if it is new.
 *
 * The window is capped at `maxSize` entries per channel using FIFO eviction:
 * the oldest-inserted ID is dropped when the cap is reached. Seeing a
 * duplicate does not refresh its position — the eviction order is strictly
 * by insertion time.
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
  // Set preserves insertion order, so the oldest entry is always first in iteration.
  const channels = new Map<string, Set<string>>()

  function getOrCreate(channel: string): Set<string> {
    let set = channels.get(channel)
    if (!set) {
      set = new Set()
      channels.set(channel, set)
    }
    return set
  }

  return {
    seen(channel: string, id: string): boolean {
      const set = getOrCreate(channel)
      if (set.has(id)) return true

      // Evict the oldest entry when at capacity.  Set iteration order is
      // insertion order, so the first element is always the oldest.
      if (set.size >= maxSize) {
        set.delete(set.values().next().value!)
      }

      set.add(id)
      return false
    },

    resetChannel(channel: string): void {
      channels.delete(channel)
    },

    reset(): void {
      channels.clear()
    },

    size(channel: string): number {
      return channels.get(channel)?.size ?? 0
    },
  }
}
