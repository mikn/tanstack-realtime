import { useCallback, useEffect, useRef, useState } from 'react'
import { serializeKey } from '@tanstack/realtime-client'
import type { PresenceUser } from '@tanstack/realtime-client'
import { useRealtimeContext } from './context.js'

export interface UsePresenceOptions<T> {
  /** The presence channel key. Same shape as a TanStack Query key. */
  key: ReadonlyArray<unknown>
  /** Initial presence data for this user. */
  initial: T
  /** Throttle delay for updatePresence in ms. Default: 50 */
  throttleMs?: number
}

export interface UsePresenceResult<T> {
  /** Other users on this presence channel. */
  others: Array<PresenceUser<T>>
  /** Update this user's presence data. Automatically throttled. */
  updatePresence: (data: Partial<T>) => void
}

function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): T & { flush: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null

  function run() {
    timer = null
    if (lastArgs) {
      const args = lastArgs
      lastArgs = null
      fn(...args)
    }
  }

  const throttled = function (...args: Parameters<T>) {
    lastArgs = args
    if (!timer) {
      timer = setTimeout(run, delay)
    }
  } as T & { flush: () => void }

  throttled.flush = function () {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (lastArgs) {
      const args = lastArgs
      lastArgs = null
      fn(...args)
    }
  }

  return throttled
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
export function usePresence<T extends object = Record<string, unknown>>(
  options: UsePresenceOptions<T>,
): UsePresenceResult<T> {
  const { key, initial, throttleMs = 50 } = options
  const { client } = useRealtimeContext()
  const serializedKey = serializeKey(key)
  const [others, setOthers] = useState<Array<PresenceUser<T>>>([])

  // Stable ref to current data for throttled updates
  const currentDataRef = useRef<T>(initial)

  useEffect(() => {
    // Join the presence channel with initial data
    client.presenceJoin(serializedKey, initial)

    const unsubscribe = client.onPresence((presenceKey, event) => {
      if (presenceKey !== serializedKey) return

      setOthers((prev) => {
        if (event.type === 'sync') {
          return event.users.map((u) => ({
            connectionId: u.connectionId,
            data: u.data as T,
          }))
        }
        if (event.type === 'join') {
          if (prev.some((u) => u.connectionId === event.connectionId))
            return prev
          return [
            ...prev,
            { connectionId: event.connectionId, data: event.data as T },
          ]
        }
        if (event.type === 'update') {
          return prev.map((u) =>
            u.connectionId === event.connectionId
              ? { ...u, data: event.data as T }
              : u,
          )
        }
        if (event.type === 'leave') {
          return prev.filter((u) => u.connectionId !== event.connectionId)
        }
        return prev
      })
    })

    return () => {
      client.presenceLeave(serializedKey)
      unsubscribe()
      setOthers([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, serializedKey])

  const throttledUpdate = useRef(
    throttle((data: Partial<T>) => {
      const merged = { ...currentDataRef.current, ...data }
      currentDataRef.current = merged as T
      client.presenceUpdate(serializedKey, data)
    }, throttleMs),
  )

  const updatePresence = useCallback((data: Partial<T>) => {
    throttledUpdate.current(data)
  }, [])

  return { others, updatePresence }
}
