import { use, useCallback, useEffect, useRef, useState } from 'react'
import type { PresenceUser, PresenceChannelDef } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'

export interface UsePresenceOptions<
  TData extends object = Record<string, unknown>,
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Params used to resolve the channel key. */
  params: TParams
  /** Initial presence data to publish on join. */
  initial: TData
}

export interface UsePresenceResult<
  TData extends object = Record<string, unknown>,
> {
  /** All other connected users in this channel (excludes the current user). */
  others: ReadonlyArray<PresenceUser<TData>>
  /**
   * Update the current user's presence data.
   * Sends a delta — only the provided fields are merged into the stored state.
   */
  updatePresence(delta: Partial<TData>): void
}

/**
 * Joins a presence channel and returns reactive presence state.
 *
 * @example
 * const { others, updatePresence } = usePresence(editorPresence, {
 *   params: { documentId },
 *   initial: { cursor: null, name: userName },
 * })
 *
 * // Broadcast cursor position
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

  // Keep a stable ref to the channel string so effects only re-run on change.
  const channelRef = useRef(channel)
  channelRef.current = channel

  useEffect(() => {
    const ch = channelRef.current

    // Subscribe to the channel first so the server authorizes this connection
    // before we attempt to join presence. The server drops presence:join
    // messages for channels that haven't been authorized via subscribe.
    const unsubChannel = client.subscribe(ch, () => {})
    client.joinPresence(ch, initial)

    const unsubPresence = client.onPresenceChange(ch, (users) => {
      setOthers(users as ReadonlyArray<PresenceUser<TData>>)
    })

    return () => {
      unsubPresence()
      client.leavePresence(ch)
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
