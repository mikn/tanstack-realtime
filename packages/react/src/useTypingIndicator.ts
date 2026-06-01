import { use, useCallback, useEffect, useRef, useState } from 'react'
import { serializeKey } from '@realtimejs/core'
import { RealtimeContext } from './context.js'
import type { QueryKey } from '@realtimejs/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseTypingIndicatorOptions {
  /**
   * How long (ms) after the last `startTyping()` call before a user is
   * automatically removed from the typing list.
   * @default 3000
   */
  timeout?: number
  /**
   * The current user's identifier. Used to exclude the local user from
   * `typingUsers` so you don't show "You are typing" to yourself.
   */
  selfId: string
}

export interface UseTypingIndicatorResult {
  /**
   * IDs of users currently typing, excluding the current user.
   * Updated reactively as users start or stop typing.
   */
  typingUsers: ReadonlyArray<string>
  /**
   * Call when the current user starts typing (e.g. on input `onChange`).
   * Broadcasts a typing signal and schedules automatic stop after `timeout` ms.
   * Multiple calls restart the timeout — debounces naturally.
   */
  startTyping: () => void
  /**
   * Immediately broadcasts that the current user has stopped typing.
   * Call this on form submit or input blur for instant feedback.
   */
  stopTyping: () => void
}

type TypingMessage =
  | { type: 'typing:start'; userId: string }
  | { type: 'typing:stop'; userId: string }

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Tracks who is currently typing in a channel.
 *
 * Publishes `typing:start` / `typing:stop` events to the given channel and
 * listens for the same events from other users. A user is automatically
 * removed from `typingUsers` after `timeout` ms of inactivity (no fresh
 * `typing:start` signal), so callers simply call `startTyping()` on each
 * keystroke — no manual debouncing required.
 *
 * The current user's own events are excluded from `typingUsers`.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
 *   ['typing', { roomId }],
 *   { selfId: currentUser.id },
 * )
 *
 * // In your input handler:
 * <input
 *   onChange={(e) => { setValue(e.target.value); startTyping() }}
 *   onBlur={stopTyping}
 * />
 *
 * // Render who is typing:
 * {typingUsers.length > 0 && (
 *   <p>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…</p>
 * )}
 */
export function useTypingIndicator(
  channel: QueryKey | string,
  options: UseTypingIndicatorOptions,
): UseTypingIndicatorResult {
  const client = use(RealtimeContext)
  if (!client) {
    throw new Error(
      '[realtime] useTypingIndicator must be used inside <RealtimeProvider>.',
    )
  }

  const { selfId, timeout = 3000 } = options

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const [typingUsers, setTypingUsers] = useState<ReadonlyArray<string>>([])

  // Per-user expiry timers: userId → timer handle.
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  )
  // Timer for the local user's auto-stop (avoid leaving ourselves in remote lists).
  const selfTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const channelRef = useRef(serializedChannel)
  channelRef.current = serializedChannel
  const selfIdRef = useRef(selfId)
  selfIdRef.current = selfId
  const timeoutRef = useRef(timeout)
  timeoutRef.current = timeout

  // Helper: remove a userId from typingUsers.
  const removeUser = useCallback((userId: string) => {
    const timers = timersRef.current
    const t = timers.get(userId)
    if (t != null) {
      clearTimeout(t)
      timers.delete(userId)
    }
    setTypingUsers((prev) => prev.filter((id) => id !== userId))
  }, [])

  // Helper: (re)set expiry timer for a user.
  const scheduleRemoval = useCallback(
    (userId: string) => {
      const timers = timersRef.current
      const existing = timers.get(userId)
      if (existing != null) clearTimeout(existing)
      timers.set(
        userId,
        setTimeout(() => removeUser(userId), timeoutRef.current),
      )
    },
    [removeUser],
  )

  useEffect(() => {
    // Reset all state when channel changes.
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current.clear()
    setTypingUsers([])

    // Capture the map once so the cleanup closure always refers to the same
    // Map instance (satisfies react-hooks/exhaustive-deps for ref values).
    const timers = timersRef.current

    const unsub = client.subscribe(serializedChannel, (data) => {
      // Validate shape before narrowing to the union so TypeScript does not
      // flag the second branch of the union check as unreachable.
      const raw = data as { type?: string; userId?: string }
      if (raw.type !== 'typing:start' && raw.type !== 'typing:stop') return

      const msg = raw as TypingMessage
      const { userId } = msg
      if (!userId || userId === selfIdRef.current) return

      if (msg.type === 'typing:stop') {
        removeUser(userId)
      } else {
        // Add user if not already present.
        setTypingUsers((prev) =>
          prev.includes(userId) ? prev : [...prev, userId],
        )
        scheduleRemoval(userId)
      }
    })

    return () => {
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
      unsub()
    }
  }, [client, serializedChannel, removeUser, scheduleRemoval])

  const startTyping = useCallback(() => {
    // Auto-stop after timeout — restart on each call.
    if (selfTimerRef.current != null) clearTimeout(selfTimerRef.current)
    selfTimerRef.current = setTimeout(() => {
      void client.publish(channelRef.current, {
        type: 'typing:stop',
        userId: selfIdRef.current,
      })
    }, timeoutRef.current)

    void client.publish(channelRef.current, {
      type: 'typing:start',
      userId: selfIdRef.current,
    })
  }, [client])

  const stopTyping = useCallback(() => {
    if (selfTimerRef.current != null) {
      clearTimeout(selfTimerRef.current)
      selfTimerRef.current = null
    }
    void client.publish(channelRef.current, {
      type: 'typing:stop',
      userId: selfIdRef.current,
    })
  }, [client])

  return { typingUsers, startTyping, stopTyping }
}
