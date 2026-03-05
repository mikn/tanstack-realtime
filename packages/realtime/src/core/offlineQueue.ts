/**
 * Offline queue hook — buffers publishes while disconnected and replays
 * them on reconnect.
 *
 * Uses the transport's hook pipeline instead of wrapping the transport.
 * Queue state is exposed via a TanStack Store on the returned handle.
 */

import { Store } from '@tanstack/store'
import type { HookHandle } from './hooks.js'
import type { RealtimeTransport } from './types.js'
import type { OfflineQueueStorage } from './offlineQueueStorage.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueuedMessage {
  readonly id: number
  readonly channel: string
  readonly data: unknown
  readonly enqueuedAt: string
}

export interface OfflineQueueState {
  readonly pending: ReadonlyArray<QueuedMessage>
  readonly flushed: number
  readonly isFlushing: boolean
}

export interface OfflineQueueOptions {
  /** Maximum number of messages to buffer. @default 1000 */
  maxSize?: number
  /** Called on flush error. Return `true` to retry, `false` to discard. */
  onFlushError?: (message: QueuedMessage, error: unknown) => boolean
  /** Pluggable storage for persisting across page refreshes. */
  storage?: OfflineQueueStorage
}

export interface OfflineQueueHandle {
  /** TanStack Store holding the queue state. */
  readonly store: Store<OfflineQueueState>
  /** Discard all pending messages without sending them. */
  clearQueue: () => void
  /** Remove the offline queue hook from the transport. */
  unhook: () => void
}

// ---------------------------------------------------------------------------
// Hook factory
// ---------------------------------------------------------------------------

/**
 * Register an offline queue on a transport.
 *
 * When the connection is not 'connected', `publish()` calls are buffered.
 * Once the connection reaches 'connected', the queue is flushed in FIFO order.
 *
 * @example
 * const queue = useOfflineQueue(transport, { maxSize: 500 })
 *
 * // queue.store — reactive queue state
 * // queue.clearQueue() — discard pending
 * // queue.unhook() — remove offline queueing
 */
export function useOfflineQueue(
  transport: RealtimeTransport,
  options: OfflineQueueOptions = {},
): OfflineQueueHandle {
  const { maxSize = 1000, onFlushError = () => false, storage } = options
  let nextId = 1

  const queueStore = new Store<OfflineQueueState>({
    pending: [],
    flushed: 0,
    isFlushing: false,
  })

  // Storage initialization
  if (storage) {
    storage
      .load()
      .then((persisted) => {
        if (persisted.length > 0) {
          queueStore.setState((s) => {
            const maxPersistedId = Math.max(...persisted.map((m) => m.id))
            if (maxPersistedId >= nextId) nextId = maxPersistedId + 1
            const reIdPending = s.pending.map((m) => ({
              ...m,
              id: nextId++,
            }))
            const merged = [...persisted, ...reIdPending]
            return { ...s, pending: merged.slice(-maxSize) }
          })
        }
      })
      .catch(() => {
        // Storage unavailable — continue with in-memory queue.
      })
  }

  function persistToStorage(): void {
    if (!storage) return
    storage.save(queueStore.state.pending).catch(() => {})
  }

  async function flush(): Promise<void> {
    const { pending } = queueStore.state
    if (pending.length === 0) return

    queueStore.setState((s) => ({ ...s, isFlushing: true }))

    const retry: Array<QueuedMessage> = []
    let flushedCount = 0

    for (const msg of pending) {
      if (transport.store.get() !== 'connected') {
        retry.push(msg)
        continue
      }
      try {
        await transport.publish(msg.channel, msg.data)
        flushedCount++
      } catch (err) {
        if (onFlushError(msg, err)) {
          retry.push(msg)
        }
      }
    }

    queueStore.setState((s) => ({
      pending: retry,
      flushed: s.flushed + flushedCount,
      isFlushing: false,
    }))
    persistToStorage()
  }

  function enqueue(channel: string, data: unknown): void {
    const msg: QueuedMessage = {
      id: nextId++,
      channel,
      data,
      enqueuedAt: new Date().toISOString(),
    }

    queueStore.setState((s) => {
      const updated = [...s.pending, msg]
      if (updated.length > maxSize) updated.shift()
      return { ...s, pending: updated }
    })
    persistToStorage()
  }

  function clearQueue(): void {
    queueStore.setState((s) => ({ ...s, pending: [] }))
    if (storage) {
      storage.clear().catch(() => {})
    }
  }

  const handle: HookHandle = transport.hook({
    name: 'offline-queue',
    priority: -10,
    hooks: {
      beforePublish(channel, data) {
        if (transport.store.get() !== 'connected') {
          enqueue(channel, data)
          return false
        }
        return { data }
      },
      onConnect() {
        return flush()
      },
    },
  })

  return {
    store: queueStore,
    clearQueue,
    unhook: handle.unhook,
  }
}
