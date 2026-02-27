/**
 * Pluggable storage adapters for the offline queue.
 *
 * By default the offline queue is memory-only — pending messages are lost on
 * page refresh. Import a storage adapter and pass it to `createOfflineQueue`
 * to persist messages across page reloads.
 *
 * Two built-in adapters are provided:
 * - `createIndexedDBStorage` — IndexedDB-backed, suitable for large queues.
 * - `createLocalStorageAdapter` — localStorage-backed fallback for small queues.
 *
 * Implement `OfflineQueueStorage` for custom backends (e.g. SQLite, OPFS).
 */

import type { QueuedMessage } from './offlineQueue.js'

// ---------------------------------------------------------------------------
// Storage interface
// ---------------------------------------------------------------------------

/**
 * Pluggable storage adapter for the offline queue.
 *
 * Implementations must be async-safe and handle serialization internally.
 */
export interface OfflineQueueStorage {
  /**
   * Load all persisted messages. Called once during queue initialization.
   * Return an empty array if no data is persisted.
   */
  load: () => Promise<Array<QueuedMessage>>

  /**
   * Persist the current set of pending messages.
   * Called after every enqueue, flush, and clearQueue operation.
   * Replaces the entire persisted set (not append-only).
   */
  save: (messages: ReadonlyArray<QueuedMessage>) => Promise<void>

  /**
   * Remove all persisted messages. Called on clearQueue().
   */
  clear: () => Promise<void>
}

// ---------------------------------------------------------------------------
// IndexedDB adapter
// ---------------------------------------------------------------------------

export interface IndexedDBStorageOptions {
  /** IndexedDB database name. @default 'tanstack-realtime-queue' */
  dbName?: string
  /** Object store name. @default 'pending' */
  storeName?: string
}

/**
 * IndexedDB-backed storage for the offline queue.
 *
 * Uses a single object store keyed by message `id`. Suitable for large queues
 * (IndexedDB has no practical size limit). Falls back gracefully if IndexedDB
 * is unavailable (returns empty arrays and no-ops on save/clear).
 *
 * @example
 * import { createOfflineQueue, createIndexedDBStorage } from '@tanstack/realtime'
 *
 * const transport = createOfflineQueue(inner, {
 *   storage: createIndexedDBStorage(),
 * })
 */
export function createIndexedDBStorage(
  options?: IndexedDBStorageOptions,
): OfflineQueueStorage {
  const dbName = options?.dbName ?? 'tanstack-realtime-queue'
  const storeName = options?.storeName ?? 'pending'

  let dbPromise: Promise<IDBDatabase> | null = null

  function openDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(dbName, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    return dbPromise
  }

  return {
    async load(): Promise<Array<QueuedMessage>> {
      try {
        const db = await openDB()
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readonly')
          const store = tx.objectStore(storeName)
          const req = store.getAll()
          req.onsuccess = () => {
            const messages = (req.result as Array<QueuedMessage>).sort(
              (a, b) => a.id - b.id,
            )
            resolve(messages)
          }
          req.onerror = () => reject(req.error)
        })
      } catch {
        return []
      }
    },

    async save(messages: ReadonlyArray<QueuedMessage>): Promise<void> {
      try {
        const db = await openDB()
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite')
          const store = tx.objectStore(storeName)
          store.clear()
          for (const msg of messages) {
            store.put(msg)
          }
          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
        })
      } catch {
        // Silently ignore save failures — the in-memory queue is still valid.
      }
    },

    async clear(): Promise<void> {
      try {
        const db = await openDB()
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite')
          const store = tx.objectStore(storeName)
          const req = store.clear()
          req.onsuccess = () => resolve()
          req.onerror = () => reject(req.error)
        })
      } catch {
        // Silently ignore clear failures.
      }
    },
  }
}

// ---------------------------------------------------------------------------
// localStorage adapter
// ---------------------------------------------------------------------------

export interface LocalStorageOptions {
  /** localStorage key. @default 'tanstack-realtime-queue' */
  key?: string
}

/**
 * localStorage-backed fallback storage for the offline queue.
 *
 * Subject to the ~5 MB localStorage limit. Use for small queues only.
 * For larger queues, use `createIndexedDBStorage`.
 *
 * @example
 * import { createOfflineQueue, createLocalStorageAdapter } from '@tanstack/realtime'
 *
 * const transport = createOfflineQueue(inner, {
 *   storage: createLocalStorageAdapter(),
 * })
 */
export function createLocalStorageAdapter(
  options?: LocalStorageOptions,
): OfflineQueueStorage {
  const key = options?.key ?? 'tanstack-realtime-queue'

  return {
    async load(): Promise<Array<QueuedMessage>> {
      try {
        const raw = localStorage.getItem(key)
        if (!raw) return []
        const parsed = JSON.parse(raw) as Array<QueuedMessage>
        return parsed.sort((a, b) => a.id - b.id)
      } catch {
        return []
      }
    },

    async save(messages: ReadonlyArray<QueuedMessage>): Promise<void> {
      try {
        localStorage.setItem(key, JSON.stringify(messages))
      } catch {
        // Silently ignore — quota exceeded or unavailable.
      }
    },

    async clear(): Promise<void> {
      try {
        localStorage.removeItem(key)
      } catch {
        // Silently ignore.
      }
    },
  }
}
