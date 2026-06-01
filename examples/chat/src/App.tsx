/**
 * Chat room demonstrating append-only live channels, presence, and typing.
 *
 * - `useLiveChannel` — append-only message stream, seeded from in-memory
 *   history via `initialData`.
 * - `usePresence` — reactive list of other online users in the room.
 * - `useTypingIndicator` — who is currently typing (auto-expires).
 *
 * Messages are sent with a plain `fetch` POST to the in-memory server, which
 * appends to history and broadcasts over the `chat` channel.
 */
import { useEffect, useState } from 'react'
import {
  createPresenceChannel,
  useConnectionStatus,
  useLiveChannel,
  usePresence,
  useTypingIndicator,
} from '@realtimejs/react'
import { useLiveQuery } from '@tanstack/react-db'
import { userId } from './realtime.js'

interface ChatMessage {
  id: string
  userId: string
  text: string
  timestamp: number
}

const ROOM = 'lobby'

// How often each client re-announces its presence (see the heartbeat note below).
const PRESENCE_HEARTBEAT_MS = 2_000

const roomPresence = createPresenceChannel({
  id: 'chat-room-presence',
  channel: (p: { room: string }) => ['chat-presence', { room: p.room }],
})

export function App() {
  const status = useConnectionStatus()
  const [draft, setDraft] = useState('')

  const messages = useLiveChannel<ChatMessage>({
    id: `chat-${ROOM}`,
    channel: 'chat',
    getKey: (m) => m.id,
    initialData: async () => {
      const res = await fetch('/api/messages')
      return res.json() as Promise<Array<ChatMessage>>
    },
    onEvent: (raw) => {
      const e = raw as { type: string; data: ChatMessage }
      return e.type === 'message' ? e.data : null
    },
  })

  const { data } = useLiveQuery((q) =>
    q.from({ messages }).orderBy(({ messages: m }) => m.timestamp, 'asc'),
  )

  const { others, updatePresence } = usePresence<
    { name: string },
    { room: string }
  >(roomPresence, { params: { room: ROOM }, initial: { name: userId } })

  // Late-joiner handling: presence is layered on a plain pub/sub sidecar
  // channel, which only delivers a `join` announcement to peers who are
  // already subscribed when it is published. So if Alice joins and then Bob
  // joins, Bob's `join` reaches Alice, but Alice's earlier `join` never reaches
  // Bob — the list would be asymmetric. We fix this the same way the repo's
  // e2e PresencePanel does: each client re-announces its full presence data on
  // a short interval via `updatePresence`, so every peer (including late
  // joiners) discovers everyone else within a couple of seconds. The interval
  // is cleared on unmount.
  useEffect(() => {
    const id = setInterval(() => {
      updatePresence({ name: userId })
    }, PRESENCE_HEARTBEAT_MS)
    return () => clearInterval(id)
  }, [updatePresence])

  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    ['chat-typing', { room: ROOM }],
    { selfId: userId },
  )

  async function send() {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    stopTyping()
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, text, timestamp: Date.now() }),
    })
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Online</h2>
        <ul className="users">
          <li className="me">{userId} (you)</li>
          {others.map((u) => (
            <li key={u.connectionId}>{u.data.name}</li>
          ))}
        </ul>
        <div className="status">
          <span
            className={`dot ${status === 'connected' ? 'connected' : ''}`}
          />
          {status}
        </div>
      </aside>

      <main className="chat">
        <div className="messages">
          {data.map((m) => (
            <div
              key={m.id}
              className={`msg ${m.userId === userId ? 'own' : ''}`}
            >
              <span className="author">{m.userId}</span>
              <span className="text">{m.text}</span>
            </div>
          ))}
        </div>

        <div className="typing">
          {typingUsers.length > 0 &&
            `${typingUsers.join(', ')} ${
              typingUsers.length === 1 ? 'is' : 'are'
            } typing…`}
        </div>

        <div className="composer">
          <input
            type="text"
            placeholder="Type a message…"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              startTyping()
            }}
            onBlur={stopTyping}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void send()
            }}
          />
          <button onClick={() => void send()}>Send</button>
        </div>
      </main>
    </div>
  )
}
