import { onUnmounted, ref } from 'vue'
import { serializeKey } from '@tanstack/realtime'
import { useRealtimeClient } from './context.js'
import type { Ref } from 'vue'
import type { QueryKey } from '@tanstack/realtime'

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
  typingUsers: Ref<ReadonlyArray<string>>
  /**
   * Call when the current user starts typing (e.g. on input change).
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

/**
 * Tracks who is currently typing in a channel.
 *
 * Publishes `typing:start` / `typing:stop` events to the given channel and
 * listens for the same events from other users. A user is automatically
 * removed from `typingUsers` after `timeout` ms of inactivity, so callers
 * simply call `startTyping()` on each keystroke — no manual debouncing required.
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
 * // In template:
 * // <input @input="startTyping" @blur="stopTyping" />
 * // <p v-if="typingUsers.length">{{ typingUsers.join(', ') }} is typing…</p>
 */
export function useTypingIndicator(
  channel: QueryKey | string,
  options: UseTypingIndicatorOptions,
): UseTypingIndicatorResult {
  const client = useRealtimeClient('useTypingIndicator')

  const { selfId, timeout = 3000 } = options

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const typingUsers = ref<ReadonlyArray<string>>([])

  // Per-user expiry timers: userId → timer handle.
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  // Timer for the local user's auto-stop.
  let selfTimer: ReturnType<typeof setTimeout> | null = null

  // Mutable refs for latest values used in closures.
  const currentSelfId = selfId
  const currentTimeout = timeout
  const currentChannel = serializedChannel

  const removeUser = (userId: string): void => {
    const t = timers.get(userId)
    if (t != null) {
      clearTimeout(t)
      timers.delete(userId)
    }
    typingUsers.value = typingUsers.value.filter((id) => id !== userId)
  }

  const scheduleRemoval = (userId: string): void => {
    const existing = timers.get(userId)
    if (existing != null) clearTimeout(existing)
    timers.set(
      userId,
      setTimeout(() => removeUser(userId), currentTimeout),
    )
  }

  const unsub = client.subscribe(serializedChannel, (data) => {
    const raw = data as { type?: string; userId?: string }
    if (raw.type !== 'typing:start' && raw.type !== 'typing:stop') return

    const msg = raw as TypingMessage
    const { userId } = msg
    if (!userId || userId === currentSelfId) return

    if (msg.type === 'typing:stop') {
      removeUser(userId)
    } else {
      typingUsers.value = typingUsers.value.includes(userId)
        ? typingUsers.value
        : [...typingUsers.value, userId]
      scheduleRemoval(userId)
    }
  })

  onUnmounted(() => {
    timers.forEach((t) => clearTimeout(t))
    timers.clear()
    if (selfTimer != null) clearTimeout(selfTimer)
    unsub()
  })

  const startTyping = (): void => {
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

  const stopTyping = (): void => {
    if (selfTimer != null) {
      clearTimeout(selfTimer)
      selfTimer = null
    }
    void client.publish(currentChannel, {
      type: 'typing:stop',
      userId: currentSelfId,
    })
  }

  // Suppress unused-var for mutable variables used in closures.
  void currentSelfId
  void currentTimeout
  void currentChannel

  return { typingUsers, startTyping, stopTyping }
}
