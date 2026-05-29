import { createEffect, createSignal, onCleanup } from 'solid-js'
import { useRealtimeClient } from './context.js'
import type { Accessor } from 'solid-js'
import type { PresenceChannelDef, PresenceUser } from '@realtimejs/core'

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
   * Reactive accessor for all other connected users in this channel. Starts as
   * an empty array and updates reactively as members join, update, or leave.
   * The current user is always excluded.
   */
  others: Accessor<ReadonlyArray<PresenceUser<TData>>>
  /**
   * Reactive accessor for the current user's presence data as last sent to the
   * server. Initialized to the `initial` value passed to the primitive and
   * updated immediately on each `updatePresence` call (optimistic local state).
   * Useful for rendering the current user's own avatar or cursor alongside peers.
   */
  self: Accessor<TData>
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
 * On mount the component joins the channel with `initial` data and subscribes
 * to presence changes. When `channel` changes the previous presence membership
 * is left and a new one is joined. On unmount the component leaves the channel.
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
 * const onMouseMove = (e) => updatePresence({ cursor: { x: e.clientX, y: e.clientY } })
 *
 * // Render own cursor alongside peers
 * return (
 *   <>
 *     <Cursor position={self().cursor} isSelf />
 *     <For each={others()}>{(u) => <Cursor position={u.data.cursor} />}</For>
 *   </>
 * )
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

  const [others, setOthers] = createSignal<ReadonlyArray<PresenceUser<TData>>>(
    [],
  )
  // Track the current user's own presence data for local optimistic display.
  const [self, setSelf] = createSignal<TData>(initial)

  // Keep the current channel and self in plain vars so callbacks always
  // reference the latest values without creating reactive dependencies.
  let currentChannel = channel
  let currentSelf = initial

  createEffect(() => {
    currentChannel = channel
    // Reset self to the initial data when the channel changes.
    setSelf(() => options.initial)
    currentSelf = options.initial

    // Subscribe to the channel first so the server authorizes this connection
    // before we attempt to join presence. The server drops presence:join
    // messages for channels that haven't been authorized via subscribe.
    const unsubChannel = client.subscribe(channel, () => {})
    client.joinPresence(channel, options.initial)

    const unsubPresence = client.onPresenceChange(channel, (users) => {
      setOthers(users as ReadonlyArray<PresenceUser<TData>>)
    })

    onCleanup(() => {
      unsubPresence()
      client.leavePresence(channel)
      unsubChannel()
    })
  })

  function updatePresence(delta: Partial<TData>): void {
    // Merge delta into local self state optimistically.
    const next = { ...currentSelf, ...delta }
    currentSelf = next
    setSelf(() => next)
    client.updatePresence(currentChannel, delta)
  }

  return { others, self, updatePresence }
}
