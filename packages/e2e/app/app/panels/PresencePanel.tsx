/**
 * PresencePanel — exercises presenceChannelOptions / usePresence.
 *
 * Pattern: live presence list (who's currently connected).
 * Both users join on mount with their userId. Each sees the other in the
 * presence list.
 *
 * Presence protocol note: the sidecar channel only delivers messages to
 * subscribers who are already listening when a `prs:join` is broadcast.
 * To handle late joiners (peers who connect after us), the panel re-announces
 * its full presence data on a short interval via `updatePresence`. This ensures
 * every new subscriber sees us within a few seconds.
 */

import { useEffect } from 'react'
import { usePresence, useSyncedValue } from '@tanstack/react-realtime'
import { roomPresence, sharedValue } from '../defs.js'
import { userId } from '../transport.js'

interface UserPresenceData {
  name: string
  status: string
}

const PRESENCE_HEARTBEAT_MS = 2_000

export function PresencePanel() {
  const { others, updatePresence } = usePresence<UserPresenceData>(
    roomPresence,
    {
      params: {},
      initial: { name: userId, status: 'online' },
    },
  )

  // Re-announce our full presence data periodically so that peers who join
  // after our initial `prs:join` can still discover us via `prs:update`.
  useEffect(() => {
    const id = setInterval(() => {
      updatePresence({ name: userId, status: 'online' })
    }, PRESENCE_HEARTBEAT_MS)
    return () => clearInterval(id)
  }, [updatePresence])

  // Also demonstrate useSyncedValue within the same panel.
  const { value: sharedText, set: setSharedText } = useSyncedValue<string>(
    sharedValue,
    { params: {}, initial: '' },
  )

  return (
    <div className="panel" data-testid="presence-panel">
      <h2>usePresence — Online Users</h2>
      <div data-testid="presence-users">
        {others.length === 0 ? (
          <span style={{ color: '#888', fontSize: 12 }}>
            No other users online
          </span>
        ) : (
          others.map((u) => (
            <div key={u.connectionId} className="list-item">
              <span>
                {(u.data as UserPresenceData | undefined)?.name ??
                  u.connectionId}
              </span>
              <span className="tag">
                {(u.data as UserPresenceData | undefined)?.status}
              </span>
            </div>
          ))
        )}
      </div>
      <button
        data-testid="set-status-away"
        onClick={() => updatePresence({ name: userId, status: 'away' })}
        style={{ marginTop: 8 }}
      >
        Set Away
      </button>

      <h2 style={{ marginTop: 12 }}>useSyncedValue — Shared Text (LWW)</h2>
      <input
        data-testid="value-input"
        type="text"
        placeholder="Type a shared value…"
        value={sharedText}
        onChange={(e) => setSharedText(e.target.value)}
      />
      <div data-testid="value-display" style={{ marginTop: 4, color: '#555' }}>
        {sharedText || <em style={{ color: '#aaa' }}>empty</em>}
      </div>
    </div>
  )
}
