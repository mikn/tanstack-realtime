import { onUnmounted, ref } from 'vue'
import { useRealtimeClient } from './context.js'
import type { Ref } from 'vue'
import type { PresenceChannelDef, PresenceUser } from '@tanstack/realtime'

export interface UsePresenceOptions<
  TData extends object = Record<string, unknown>,
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Params used to resolve the serialized channel key via `channelDef.resolveChannel`. */
  params: TParams
  /**
   * Presence data sent when the component mounts (or when `channel` changes).
   * **Not reactive** — subsequent changes to this value are ignored. Call
   * `updatePresence` to broadcast field updates after the initial join.
   */
  initial: TData
}

export interface UsePresenceResult<
  TData extends object = Record<string, unknown>,
> {
  /**
   * All other connected users in this channel. Starts as an empty array
   * and updates reactively as members join, update, or leave.
   * The current user is always excluded.
   */
  others: Ref<ReadonlyArray<PresenceUser<TData>>>
  /**
   * The current user's presence data as last sent to the server.
   * Initialized to the `initial` value passed to the composable and updated
   * immediately on each `updatePresence` call (optimistic local state).
   */
  self: Ref<TData>
  /**
   * Broadcast a presence delta for the current user.
   * Only the provided fields are merged into the server-stored state;
   * all other fields remain unchanged.
   */
  updatePresence: (delta: Partial<TData>) => void
}

/**
 * Joins a presence channel and returns reactive presence state.
 *
 * On setup the component joins the channel with `initial` data and subscribes
 * to presence changes. On unmount the component leaves the channel.
 *
 * `initial` is sent once on join — it is **not** reactive. To broadcast
 * subsequent changes (e.g. cursor movement) call `updatePresence`.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * const { others, self, updatePresence } = usePresence(editorPresence, {
 *   params: { documentId },
 *   initial: { cursor: null, name: userName },
 * })
 *
 * // Broadcast cursor position on mouse move
 * updatePresence({ cursor: { x: e.clientX, y: e.clientY } })
 */
export function usePresence<
  TData extends object = Record<string, unknown>,
  TParams extends Record<string, unknown> = Record<string, unknown>,
>(
  channelDef: PresenceChannelDef<TParams>,
  options: UsePresenceOptions<TData, TParams>,
): UsePresenceResult<TData> {
  const client = useRealtimeClient('usePresence')

  const { params, initial } = options
  const channel = channelDef.resolveChannel(params)

  const others = ref<ReadonlyArray<PresenceUser<TData>>>([]) as Ref<
    ReadonlyArray<PresenceUser<TData>>
  >
  const self = ref<TData>(initial) as Ref<TData>

  // Keep mutable references for use in updatePresence without reactivity overhead.
  const currentChannel = channel
  let currentSelf: TData = initial

  // Subscribe to the channel first so the server authorizes this connection
  // before we attempt to join presence.
  const unsubChannel = client.subscribe(channel, () => {})
  client.joinPresence(channel, initial)

  const unsubPresence = client.onPresenceChange(channel, (users) => {
    others.value = users as ReadonlyArray<PresenceUser<TData>>
  })

  onUnmounted(() => {
    unsubPresence()
    client.leavePresence(currentChannel)
    unsubChannel()
  })

  const updatePresence = (delta: Partial<TData>): void => {
    const next = { ...currentSelf, ...delta }
    currentSelf = next
    self.value = next
    client.updatePresence(currentChannel, delta)
  }

  return { others, self, updatePresence }
}
