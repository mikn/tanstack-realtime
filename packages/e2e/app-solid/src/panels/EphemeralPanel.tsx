/**
 * EphemeralPanel — exercises ephemeralLiveOptions.
 * Pattern: short-lived state that auto-expires after a TTL.
 */
import { For, Show } from 'solid-js'
import { ephemeralLiveOptions } from '@tanstack/realtime'
import { client, userId } from '../transport.js'
import { createCollectionSync } from '../createCollectionSync.js'

interface TypingUser {
  userId: string
  name: string
}

const CHANNEL = 'e2e-typing'
// 2 s TTL — short enough for a Playwright test to witness expiry.
const TTL = 2000

export function EphemeralPanel() {
  const typingUsers = createCollectionSync<TypingUser>(
    () =>
      ephemeralLiveOptions<TypingUser, string>({
        client,
        id: 'e2e-typing-collection-solid',
        channel: CHANNEL,
        getKey: (u) => u.userId,
        onEvent: (raw) => {
          const e = raw as { type?: string; userId?: string; name?: string }
          if (e.type !== 'typing') return null
          return { userId: e.userId!, name: e.name! }
        },
        ttl: TTL,
      }),
    (u) => u.userId,
  )

  function startTyping() {
    void client.publish(CHANNEL, { type: 'typing', userId, name: userId })
  }

  return (
    <div class="panel" data-testid="ephemeral-panel">
      <h2>ephemeralLiveOptions — Typing Indicators (TTL {TTL}ms)</h2>
      <button data-testid="start-typing" onClick={startTyping}>
        Send Typing Event
      </button>
      <div data-testid="typing-indicators" style={{ 'margin-top': '8px' }}>
        <Show
          when={typingUsers().length > 0}
          fallback={
            <span style={{ color: '#aaa', 'font-size': '12px' }}>
              No one typing
            </span>
          }
        >
          <For each={typingUsers()}>
            {(u) => (
              <div class="list-item">
                <span>{u.name} is typing…</span>
              </div>
            )}
          </For>
        </Show>
      </div>
    </div>
  )
}
