/**
 * PartyKit provider demo — the SAME hooks as the SSE examples, but the realtime
 * traffic flows over a PartyKit room (a Cloudflare Durable Object) instead of
 * SSE. Two things showcase what the DO model enables:
 *
 * 1. **Server-held presence** — `usePresence` shows a live "who's here" list.
 *    Membership is held by the Durable Object (the live connection list), so it
 *    updates the moment a tab opens or closes — no client-side heartbeat hack.
 *    (Contrast the SSE chat example, which re-announces presence on a timer
 *    because its pub/sub sidecar has no server-held membership.)
 * 2. **Broadcast fan-out** — a shared reaction feed over `useChannel`. Any tab's
 *    reaction fans out to every other tab through the room.
 *
 * Open two browser tabs (optionally with `?name=alice` / `?name=bob`): the
 * presence list and the reaction feed stay in sync across both — over PartyKit,
 * not SSE.
 */
import { useState } from 'react'
import {
  createPresenceChannel,
  useChannel,
  useConnectionStatus,
  usePresence,
} from '@realtimejs/react'
import { userName } from './realtime.js'

/** One fixed demo space. realtime.js multiplexes every channel over one room. */
const SPACE = 'lobby'

const EMOJIS = ['👋', '🎉', '🚀', '❤️', '🔥', '😂'] as const

interface Reaction {
  id: string
  from: string
  emoji: string
  at: number
}

// Presence channel — membership for this is held by the PartyKit Durable
// Object, derived from its live connection list (see the reference server).
const lobbyPresence = createPresenceChannel({
  id: 'partykit-lobby-presence',
  channel: (p: { space: string }) => ['presence', { space: p.space }],
})

export function App() {
  const status = useConnectionStatus()
  const [feed, setFeed] = useState<Array<Reaction>>([])

  // Server-held presence: `others` is keyed by the DO-assigned connectionId and
  // excludes `self`. It reflects the DO's live membership in real time.
  const { others, self } = usePresence<{ name: string }, { space: string }>(
    lobbyPresence,
    { params: { space: SPACE }, initial: { name: userName } },
  )

  // Shared broadcast channel — reactions fan out to every subscribed tab.
  const { publish } = useChannel(['reactions', { space: SPACE }], (raw) => {
    const r = raw as Reaction
    setFeed((prev) => [r, ...prev].slice(0, 30))
  })

  function react(emoji: string) {
    void publish({
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      from: userName,
      emoji,
      at: Date.now(),
    } satisfies Reaction)
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Who's here</h2>
        <ul className="users">
          <li className="me">{self.name} (you)</li>
          {others.map((u) => (
            <li key={u.connectionId}>{u.data.name}</li>
          ))}
        </ul>
        <p className="hint">
          {others.length === 0
            ? 'Open another tab to see live presence.'
            : `${others.length} other ${
                others.length === 1 ? 'person' : 'people'
              } online`}
        </p>
        <div className="status">
          <span
            className={`dot ${status === 'connected' ? 'connected' : ''}`}
          />
          {status}
        </div>
        <p className="provider">over PartyKit (Durable Object)</p>
      </aside>

      <main className="stage">
        <h1>Send a reaction</h1>
        <div className="reactions">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => react(e)} aria-label={`react ${e}`}>
              {e}
            </button>
          ))}
        </div>

        <div className="feed">
          {feed.length === 0 && (
            <p className="empty">No reactions yet — tap an emoji above.</p>
          )}
          {feed.map((r) => (
            <div
              key={r.id}
              className={`reaction ${r.from === userName ? 'own' : ''}`}
            >
              <span className="emoji">{r.emoji}</span>
              <span className="from">{r.from}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
