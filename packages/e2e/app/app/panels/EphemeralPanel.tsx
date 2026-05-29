/**
 * EphemeralPanel — exercises ephemeralLiveOptions.
 *
 * Pattern: short-lived state that auto-expires after a TTL.
 * User A clicks "Start Typing" → User B sees "alice is typing…"
 * After 2 seconds without a new event, the indicator disappears automatically.
 */

import { ephemeralLiveOptions } from '@realtimejs/core'
import { client, userId } from '../transport.js'
import { useCollectionSync } from '../useCollectionSync.js'

interface TypingUser {
  userId: string
  name: string
}

const CHANNEL = 'e2e-typing'
// 2 s TTL — short enough for a Playwright test to witness expiry.
const TTL = 2000

export function EphemeralPanel() {
  const typingUsers = useCollectionSync<TypingUser>(
    () =>
      ephemeralLiveOptions<TypingUser, string>({
        client,
        id: 'e2e-typing-collection',
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
    void client.publish(CHANNEL, {
      type: 'typing',
      userId,
      name: userId,
    })
  }

  return (
    <div className="panel" data-testid="ephemeral-panel">
      <h2>ephemeralLiveOptions — Typing Indicators (TTL {TTL}ms)</h2>
      <button data-testid="start-typing" onClick={startTyping}>
        Send Typing Event
      </button>
      <div data-testid="typing-indicators" style={{ marginTop: 8 }}>
        {typingUsers.length === 0 ? (
          <span style={{ color: '#aaa', fontSize: 12 }}>No one typing</span>
        ) : (
          typingUsers.map((u) => (
            <div key={u.userId} className="list-item">
              <span>{u.name} is typing…</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
