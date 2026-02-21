/**
 * Ephemeral map — a key-value store where entries auto-expire after a TTL.
 *
 * Designed for transient realtime state like typing indicators, cursor positions,
 * and "user is viewing" badges that should disappear when the user goes silent.
 *
 * The map notifies listeners whenever an entry is added, updated, or expires.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EphemeralMapOptions {
  /**
   * Time-to-live in milliseconds. Entries expire this long after their
   * last `set()` call.
   * @default 3000
   */
  ttl?: number
}

export interface EphemeralEntry<T> {
  readonly key: string
  readonly value: T
  /** Millisecond timestamp of the last `set()`. */
  readonly updatedAt: number
}

export interface EphemeralMap<T> {
  /** Set or refresh a key. Resets the expiry timer. */
  set(key: string, value: T): void

  /** Remove a key immediately (before its TTL). */
  delete(key: string): void

  /** Get the current value for a key, or undefined if expired/absent. */
  get(key: string): T | undefined

  /** Whether the key exists and has not expired. */
  has(key: string): boolean

  /** Snapshot of all live entries. */
  entries(): ReadonlyArray<EphemeralEntry<T>>

  /** Number of live entries. */
  size(): number

  /** Subscribe to changes. Returns an unsubscribe function. */
  subscribe(callback: (entries: ReadonlyArray<EphemeralEntry<T>>) => void): () => void

  /** Remove all entries and cancel all timers. */
  clear(): void

  /** Cancel all timers (call on teardown to prevent leaks). */
  destroy(): void
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Create an ephemeral map.
 *
 * @example
 * const typing = createEphemeralMap<{ name: string }>({ ttl: 2000 })
 *
 * // When a typing event arrives from the channel:
 * typing.set(userId, { name: 'Alice' })
 *
 * // Subscribe to changes — fires on set, delete, and auto-expiry:
 * typing.subscribe((entries) => {
 *   console.log('Currently typing:', entries.map(e => e.value.name))
 * })
 *
 * // After 2 seconds of silence, Alice's entry disappears automatically.
 */
export function createEphemeralMap<T>(
  options: EphemeralMapOptions = {},
): EphemeralMap<T> {
  const { ttl = 3000 } = options

  const entries = new Map<string, { value: T; updatedAt: number }>()
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  const listeners = new Set<(entries: ReadonlyArray<EphemeralEntry<T>>) => void>()

  function snapshot(): ReadonlyArray<EphemeralEntry<T>> {
    const result: EphemeralEntry<T>[] = []
    for (const [key, entry] of entries) {
      result.push({ key, value: entry.value, updatedAt: entry.updatedAt })
    }
    return result
  }

  function notify(): void {
    const snap = snapshot()
    for (const cb of listeners) cb(snap)
  }

  function scheduleExpiry(key: string): void {
    // Clear existing timer for this key.
    const existing = timers.get(key)
    if (existing !== undefined) clearTimeout(existing)

    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key)
        entries.delete(key)
        notify()
      }, ttl),
    )
  }

  return {
    set(key, value) {
      entries.set(key, { value, updatedAt: Date.now() })
      scheduleExpiry(key)
      notify()
    },

    delete(key) {
      const timer = timers.get(key)
      if (timer !== undefined) {
        clearTimeout(timer)
        timers.delete(key)
      }
      if (entries.delete(key)) {
        notify()
      }
    },

    get(key) {
      return entries.get(key)?.value
    },

    has(key) {
      return entries.has(key)
    },

    entries: snapshot,

    size() {
      return entries.size
    },

    subscribe(callback) {
      listeners.add(callback)
      return () => {
        listeners.delete(callback)
      }
    },

    clear() {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
      entries.clear()
      notify()
    },

    destroy() {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
      listeners.clear()
    },
  }
}
