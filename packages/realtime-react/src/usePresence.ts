import { useCallback, useEffect, useRef, useState } from 'react'
import { serializeKey } from '@tanstack/realtime-client'
import type { PresenceUser, RealtimeClient } from '@tanstack/realtime-client'
import { useRealtimeContext } from './context.js'

export interface UsePresenceOptions<T> {
  /** The presence channel key. Same shape as a TanStack Query key. */
  key: ReadonlyArray<unknown>
  /** Initial presence data for this user. */
  initial: T
  /** Throttle delay for `updatePresence` in ms. Default: 50 */
  throttleMs?: number
}

export interface UsePresenceResult<T> {
  /**
   * Other users currently on this presence channel, excluding the current
   * user. Each entry has a stable `connectionId` suitable for use as a React
   * key and a `data` field typed as `T`.
   */
  others: Array<PresenceUser<T>>
  /**
   * Update this user's presence data. Only pass the fields that changed —
   * the library merges the delta on the server so other users always receive
   * the full state. Calls are automatically throttled (default 50 ms) so it
   * is safe to call on every pointer move.
   */
  updatePresence: (data: Partial<T>) => void
}

/**
 * A trailing-edge throttle: the first call starts a timer; the last value
 * received within the window is what gets flushed when the timer fires.
 * No updates are lost — `flush()` delivers any pending value immediately.
 */
function makeThrottle(fn: (data: unknown) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: unknown = undefined
  let hasPending = false

  return {
    call(data: unknown) {
      pending = data
      hasPending = true
      if (!timer) {
        timer = setTimeout(() => {
          timer = null
          if (hasPending) {
            hasPending = false
            fn(pending)
          }
        }, delay)
      }
    },
    flush() {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      if (hasPending) {
        hasPending = false
        fn(pending)
      }
    },
  }
}

/**
 * Join a presence channel and observe other users' ephemeral state.
 *
 * @example
 * ```tsx
 * const { others, updatePresence } = usePresence({
 *   key: ['document', { documentId }],
 *   initial: { cursor: null, name: userName },
 * })
 * ```
 */
export function usePresence<T extends object>(
  options: UsePresenceOptions<T>,
): UsePresenceResult<T> {
  const { key, initial, throttleMs = 50 } = options
  const { client } = useRealtimeContext()
  const serializedKey = serializeKey(key)
  const [others, setOthers] = useState<Array<PresenceUser<T>>>([])

  // Refs so the throttled callback always accesses the current values without
  // needing to be recreated on every render.
  const clientRef = useRef<RealtimeClient>(client)
  const serializedKeyRef = useRef(serializedKey)
  clientRef.current = client
  serializedKeyRef.current = serializedKey

  useEffect(() => {
    // Reset before joining the new channel so stale users from the previous
    // channel are never visible while waiting for presence:sync.
    setOthers([])
    clientRef.current.presenceJoin(serializedKey, initial)

    const unsubscribe = clientRef.current.onPresence((presenceKey, event) => {
      if (presenceKey !== serializedKeyRef.current) return

      setOthers((prev) => {
        switch (event.type) {
          case 'sync':
            return event.users.map((u) => ({
              connectionId: u.connectionId,
              data: u.data as T,
            }))
          case 'join':
            if (prev.some((u) => u.connectionId === event.connectionId))
              return prev
            return [
              ...prev,
              { connectionId: event.connectionId, data: event.data as T },
            ]
          case 'update':
            return prev.map((u) =>
              u.connectionId === event.connectionId
                ? { ...u, data: event.data as T }
                : u,
            )
          case 'leave':
            return prev.filter((u) => u.connectionId !== event.connectionId)
        }
      })
    })

    return () => {
      clientRef.current.presenceLeave(serializedKey)
      unsubscribe()
    }
    // Re-run whenever the channel key or the client changes. `initial` is
    // intentionally excluded: the initial value is only used on join.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedKey, client])

  // The throttle instance lives for the component's lifetime. It reads the
  // current key and client through refs so it never goes stale.
  const throttleRef = useRef(
    makeThrottle((data: unknown) => {
      clientRef.current.presenceUpdate(serializedKeyRef.current, data)
    }, throttleMs),
  )

  // Flush any pending update on unmount so the last state is always sent.
  useEffect(() => {
    return () => {
      throttleRef.current.flush()
    }
  }, [])

  const updatePresence = useCallback((data: Partial<T>) => {
    throttleRef.current.call(data)
  }, [])

  return { others, updatePresence }
}
