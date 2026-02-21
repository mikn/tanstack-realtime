import { use, useCallback, useEffect, useRef, useState } from 'react'
import type { PresenceUser, PresenceChannelDef } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'

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
  others: ReadonlyArray<PresenceUser<TData>>
  /**
   * Broadcast a presence delta for the current user.
   * Only the provided fields are merged into the server-stored state;
   * all other fields remain unchanged.
   */
  updatePresence(delta: Partial<TData>): void
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
 * const { others, updatePresence } = usePresence(editorPresence, {
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
  const client = use(RealtimeContext)
  if (!client) {
    throw new Error(
      '[realtime] usePresence must be used inside <RealtimeProvider>.',
    )
  }

  const { params, initial } = options
  const channel = channelDef.resolveChannel(params)

  const [others, setOthers] = useState<ReadonlyArray<PresenceUser<TData>>>([])

  // Keep the current channel in a ref so `updatePresence` always targets the
  // latest channel without needing to be recreated when the channel changes.
  const channelRef = useRef(channel)
  channelRef.current = channel

  useEffect(() => {
    // Subscribe to the channel first so the server authorizes this connection
    // before we attempt to join presence. The server drops presence:join
    // messages for channels that haven't been authorized via subscribe.
    const unsubChannel = client.subscribe(channel, () => {})
    client.joinPresence(channel, initial)

    const unsubPresence = client.onPresenceChange(channel, (users) => {
      setOthers(users as ReadonlyArray<PresenceUser<TData>>)
    })

    return () => {
      unsubPresence()
      client.leavePresence(channel)
      unsubChannel()
    }
    // `initial` intentionally excluded — joining/leaving should only
    // happen when the channel changes, not on every initial update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, channel])

  const updatePresence = useCallback(
    (delta: Partial<TData>) => {
      client.updatePresence(channelRef.current, delta)
    },
    [client],
  )

  return { others, updatePresence }
}
