import { createEffect, createSignal, onCleanup } from 'solid-js'
import { serializeKey } from '@realtimejs/core'
import { useRealtimeClient } from './context.js'
import type { Accessor } from 'solid-js'
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
   * Reactive accessor for IDs of users currently typing, excluding the
   * current user. Updated reactively as users start or stop typing.
   */
  typingUsers: Accessor<ReadonlyArray<string>>
  /**
   * Call when the current user starts typing (e.g. on input `onInput`).
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
// Primitive
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
 *   onInput={(e) => { setValue(e.currentTarget.value); startTyping() }}
 *   onBlur={stopTyping}
 * />
 *
 * // Render who is typing:
 * <Show when={typingUsers().length > 0}>
 *   <p>{typingUsers().join(', ')} {typingUsers().length === 1 ? 'is' : 'are'} typing…</p>
 * </Show>
 */
export function useTypingIndicator(
  channel: QueryKey | string,
  options: UseTypingIndicatorOptions,
): UseTypingIndicatorResult {
  const client = useRealtimeClient('useTypingIndicator')

  const { selfId, timeout = 3000 } = options

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const [typingUsers, setTypingUsers] = createSignal<ReadonlyArray<string>>([])

  // Per-user expiry timers: userId → timer handle.
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  // Timer for the local user's auto-stop.
  let selfTimer: ReturnType<typeof setTimeout> | null = null

  // Keep mutable refs for values used in callbacks.
  let currentChannel = serializedChannel
  let currentSelfId = selfId
  let currentTimeout = timeout

  // Helper: remove a userId from typingUsers.
  function removeUser(userId: string): void {
    const t = timers.get(userId)
    if (t != null) {
      clearTimeout(t)
      timers.delete(userId)
    }
    setTypingUsers((prev) => prev.filter((id) => id !== userId))
  }

  // Helper: (re)set expiry timer for a user.
  function scheduleRemoval(userId: string): void {
    const existing = timers.get(userId)
    if (existing != null) clearTimeout(existing)
    timers.set(
      userId,
      setTimeout(() => removeUser(userId), currentTimeout),
    )
  }

  createEffect(() => {
    currentChannel = serializedChannel
    currentSelfId = selfId
    currentTimeout = timeout

    // Reset all state when channel changes.
    timers.forEach((t) => clearTimeout(t))
    timers.clear()
    setTypingUsers([])

    const unsub = client.subscribe(serializedChannel, (data) => {
      const raw = data as { type?: string; userId?: string }
      if (raw.type !== 'typing:start' && raw.type !== 'typing:stop') return

      const msg = raw as TypingMessage
      const { userId } = msg
      if (!userId || userId === currentSelfId) return

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

    onCleanup(() => {
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
      unsub()
    })
  })

  function startTyping(): void {
    // Auto-stop after timeout — restart on each call.
    if (selfTimer != null) clearTimeout(selfTimer)
    selfTimer = setTimeout(() => {
      void client.publish(currentChannel, {
        type: 'typing:stop',
        userId: currentSelfId,
      })
    }, currentTimeout)

    void client.publish(currentChannel, {
      type: 'typing:start',
      userId: currentSelfId,
    })
  }

  function stopTyping(): void {
    if (selfTimer != null) {
      clearTimeout(selfTimer)
      selfTimer = null
    }
    void client.publish(currentChannel, {
      type: 'typing:stop',
      userId: currentSelfId,
    })
  }

  return { typingUsers, startTyping, stopTyping }
}
