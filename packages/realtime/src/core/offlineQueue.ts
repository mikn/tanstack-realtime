/**
 * Offline queue — wraps a {@link RealtimeTransport} to buffer publishes while
 * disconnected and replay them on reconnect.
 *
 * The queue exposes its state via a TanStack Store so the UI can display
 * "N changes pending" badges or sync indicators.
 */

import { Store } from '@tanstack/store'
import type { RealtimeTransport, ConnectionStatus } from './types.js'
import { hasPresence } from './types.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueuedMessage {
  /** Auto-assigned incrementing id for stable identity. */
  readonly id: number
  readonly channel: string
  readonly data: unknown
  /** ISO timestamp of when the message was enqueued. */
  readonly enqueuedAt: string
}

export interface OfflineQueueState {
  /** Messages waiting to be sent. */
  readonly pending: ReadonlyArray<QueuedMessage>
  /** Number of messages successfully flushed since the queue was created. */
  readonly flushed: number
  /** Whether the queue is currently replaying on reconnect. */
  readonly isFlushing: boolean
}

export interface OfflineQueueOptions {
  /**
   * Maximum number of messages to buffer while offline.
   * When the limit is reached the oldest messages are dropped.
   * @default 1000
   */
  maxSize?: number

  /**
   * Called when a queued message fails to publish during replay.
   * Return `true` to retry the message on the next flush, `false` to discard.
   * @default () => false (discard on failure)
   */
  onFlushError?: (message: QueuedMessage, error: unknown) => boolean
}

export interface OfflineQueueTransport extends RealtimeTransport {
  /** TanStack Store holding the queue state. */
  readonly queueStore: Store<OfflineQueueState>
  /** Discard all pending messages without sending them. */
  clearQueue(): void
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Wrap a transport with an offline queue.
 *
 * When the connection is not in `'connected'` state, `publish()` calls are
 * buffered. Once the connection reaches `'connected'`, the queue is flushed
 * in FIFO order.
 *
 * Accepts any {@link RealtimeTransport}. When the inner transport also implements
 * {@link PresenceCapable}, presence methods are forwarded transparently.
 * Calling presence methods on a wrapper around a non-presence transport throws
 * a descriptive error.
 *
 * @example
 * import { createOfflineQueue } from '@tanstack/realtime'
 * import { centrifugoTransport } from '@tanstack/realtime-adapter-centrifugo'
 *
 * const transport = createOfflineQueue(
 *   centrifugoTransport({ url: 'wss://...' }),
 *   { maxSize: 500 }
 * )
 * const client = createRealtimeClient({ transport })
 *
 * // In UI:
 * const pending = useStore(transport.queueStore, s => s.pending.length)
 */
export function createOfflineQueue(
  inner: RealtimeTransport,
  options: OfflineQueueOptions = {},
): OfflineQueueTransport {
  const { maxSize = 1000, onFlushError = () => false } = options
  let nextId = 1

  const queueStore = new Store<OfflineQueueState>({
    pending: [],
    flushed: 0,
    isFlushing: false,
  })

  // Flush the queue when the connection becomes 'connected'.
  let previousStatus: ConnectionStatus = inner.store.state
  inner.store.subscribe((status) => {
    if (previousStatus !== 'connected' && status === 'connected') {
      void flush()
    }
    previousStatus = status
  })

  async function flush(): Promise<void> {
    const { pending } = queueStore.state
    if (pending.length === 0) return

    queueStore.setState((s) => ({ ...s, isFlushing: true }))

    const retry: QueuedMessage[] = []
    let flushedCount = 0

    for (const msg of pending) {
      if (inner.store.state !== 'connected') {
        // Connection dropped mid-flush — keep remaining messages.
        retry.push(msg)
        continue
      }
      try {
        await inner.publish(msg.channel, msg.data)
        flushedCount++
      } catch (err) {
        if (onFlushError(msg, err)) {
          retry.push(msg)
        }
        // else: discard
      }
    }

    queueStore.setState((s) => ({
      pending: retry,
      flushed: s.flushed + flushedCount,
      isFlushing: false,
    }))
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
      // Evict the single oldest message if over capacity (one element added per call).
      if (updated.length > maxSize) updated.shift()
      return { ...s, pending: updated }
    })
  }

  const transport: OfflineQueueTransport = {
    store: inner.store,
    queueStore,

    async connect() {
      return inner.connect()
    },

    disconnect() {
      inner.disconnect()
    },

    subscribe(channel, onMessage) {
      return inner.subscribe(channel, onMessage)
    },

    async publish(channel, data) {
      if (inner.store.state === 'connected') {
        return inner.publish(channel, data)
      }
      enqueue(channel, data)
    },

    joinPresence(channel, data) {
      if (!hasPresence(inner)) {
        throw new Error(
          '[realtime] createOfflineQueue: the wrapped transport does not implement PresenceCapable.',
        )
      }
      inner.joinPresence(channel, data)
    },

    updatePresence(channel, data) {
      if (!hasPresence(inner)) {
        throw new Error(
          '[realtime] createOfflineQueue: the wrapped transport does not implement PresenceCapable.',
        )
      }
      inner.updatePresence(channel, data)
    },

    leavePresence(channel) {
      if (!hasPresence(inner)) {
        throw new Error(
          '[realtime] createOfflineQueue: the wrapped transport does not implement PresenceCapable.',
        )
      }
      inner.leavePresence(channel)
    },

    onPresenceChange(channel, callback) {
      if (!hasPresence(inner)) {
        throw new Error(
          '[realtime] createOfflineQueue: the wrapped transport does not implement PresenceCapable.',
        )
      }
      return inner.onPresenceChange(channel, callback)
    },

    clearQueue() {
      queueStore.setState((s) => ({ ...s, pending: [] }))
    },
  }

  return transport
}
