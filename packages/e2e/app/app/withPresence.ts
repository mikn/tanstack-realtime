/**
 * withPresence — adds presence capability to any RealtimeTransport using
 * regular pub/sub channels (prs:<channel>).
 *
 * Protocol on channel `prs:<channel>`:
 *   { type: 'join',   connectionId, data }
 *   { type: 'update', connectionId, data }
 *   { type: 'leave',  connectionId }
 *
 * Late-joiner handling: PresencePanel calls updatePresence() every 2 s so
 * any peer who joins after us will see us within that interval.
 */
import type { PresenceUser, RealtimeTransport } from '@tanstack/realtime'

type PresenceCapableTransport = RealtimeTransport & {
  joinPresence: (channel: string, data: unknown) => void
  updatePresence: (channel: string, delta: unknown) => void
  leavePresence: (channel: string) => void
  onPresenceChange: (
    channel: string,
    callback: (users: ReadonlyArray<PresenceUser>) => void,
  ) => () => void
}

type PresenceMsg =
  | { type: 'join'; connectionId: string; data: unknown }
  | { type: 'update'; connectionId: string; data: unknown }
  | { type: 'leave'; connectionId: string }

export function withPresence(
  inner: RealtimeTransport,
  myConnectionId: string,
): PresenceCapableTransport {
  const presenceMaps = new Map<string, Map<string, unknown>>()
  const changeListeners = new Map<
    string,
    Set<(users: ReadonlyArray<PresenceUser>) => void>
  >()
  const channelUnsubs = new Map<string, () => void>()

  function notify(channel: string): void {
    const map = presenceMaps.get(channel)
    if (!map) return
    const users: Array<PresenceUser> = Array.from(map.entries())
      .filter(([id]) => id !== myConnectionId)
      .map(([connectionId, data]) => ({ connectionId, data }))
    const listeners = changeListeners.get(channel)
    if (listeners) for (const cb of listeners) cb(users)
  }

  function handleMsg(channel: string, raw: unknown): void {
    const msg = raw as PresenceMsg
    if (msg.type === 'join' || msg.type === 'update') {
      let map = presenceMaps.get(channel)
      if (!map) {
        map = new Map()
        presenceMaps.set(channel, map)
      }
      const existing =
        msg.type === 'update' ? (map.get(msg.connectionId) ?? {}) : {}
      const merged = {
        ...(existing as Record<string, unknown>),
        ...(msg.data as Record<string, unknown>),
      }
      map.set(msg.connectionId, merged)
      notify(channel)
    } else {
      const map = presenceMaps.get(channel)
      if (map) {
        map.delete(msg.connectionId)
        if (map.size === 0) presenceMaps.delete(channel)
        notify(channel)
      }
    }
  }

  return {
    ...inner,

    joinPresence(channel: string, data: unknown): void {
      const presenceChannel = `prs:${channel}`
      const unsub = inner.subscribe(presenceChannel, (raw) =>
        handleMsg(channel, raw),
      )
      channelUnsubs.set(channel, unsub)
      void inner.publish(presenceChannel, {
        type: 'join',
        connectionId: myConnectionId,
        data,
      })
    },

    updatePresence(channel: string, delta: unknown): void {
      void inner.publish(`prs:${channel}`, {
        type: 'update',
        connectionId: myConnectionId,
        data: delta,
      })
    },

    leavePresence(channel: string): void {
      void inner.publish(`prs:${channel}`, {
        type: 'leave',
        connectionId: myConnectionId,
      })
      channelUnsubs.get(channel)?.()
      channelUnsubs.delete(channel)
      presenceMaps.delete(channel)
    },

    onPresenceChange(
      channel: string,
      callback: (users: ReadonlyArray<PresenceUser>) => void,
    ): () => void {
      if (!changeListeners.has(channel)) changeListeners.set(channel, new Set())
      changeListeners.get(channel)!.add(callback)
      return () => changeListeners.get(channel)?.delete(callback)
    },
  }
}
