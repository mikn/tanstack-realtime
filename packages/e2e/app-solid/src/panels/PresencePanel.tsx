/**
 * PresencePanel — exercises presenceChannelOptions / usePresence.
 * Also demonstrates useSyncedValue within the same panel.
 *
 * Re-announces presence every 2 s so late-joining peers can discover us.
 */
import { For, Show, createEffect, onCleanup } from 'solid-js'
import { usePresence, useSyncedValue } from '@tanstack/solid-realtime'
import { roomPresence, sharedValue } from '../defs.js'
import { userId } from '../transport.js'

interface UserPresenceData {
  name: string
  status: string
}

const HEARTBEAT_MS = 2_000

export function PresencePanel() {
  const { others, updatePresence } = usePresence<UserPresenceData>(
    roomPresence,
    {
      params: {},
      initial: { name: userId, status: 'online' },
    },
  )

  // Re-announce presence for late joiners.
  createEffect(() => {
    const id = setInterval(() => {
      updatePresence({ name: userId, status: 'online' })
    }, HEARTBEAT_MS)
    onCleanup(() => clearInterval(id))
  })

  const { value: sharedText, set: setSharedText } = useSyncedValue<string>(
    sharedValue,
    { params: {}, initial: '' },
  )

  return (
    <div class="panel" data-testid="presence-panel">
      <h2>usePresence — Online Users</h2>
      <div data-testid="presence-users">
        <Show
          when={others().length > 0}
          fallback={
            <span style={{ color: '#888', 'font-size': '12px' }}>
              No other users online
            </span>
          }
        >
          <For each={others()}>
            {(u) => (
              <div class="list-item">
                <span>
                  {(u.data as UserPresenceData | undefined)?.name ??
                    u.connectionId}
                </span>
                <span class="tag">
                  {(u.data as UserPresenceData | undefined)?.status}
                </span>
              </div>
            )}
          </For>
        </Show>
      </div>
      <button
        data-testid="set-status-away"
        onClick={() => updatePresence({ name: userId, status: 'away' })}
        style={{ 'margin-top': '8px' }}
      >
        Set Away
      </button>

      <h2 style={{ 'margin-top': '12px' }}>
        useSyncedValue — Shared Text (LWW)
      </h2>
      <input
        data-testid="value-input"
        type="text"
        placeholder="Type a shared value…"
        value={sharedText()}
        onInput={(e) => setSharedText(e.currentTarget.value)}
      />
      <div
        data-testid="value-display"
        style={{ 'margin-top': '4px', color: '#555' }}
      >
        <Show
          when={sharedText()}
          fallback={<em style={{ color: '#aaa' }}>empty</em>}
        >
          {sharedText()}
        </Show>
      </div>
    </div>
  )
}
