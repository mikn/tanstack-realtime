import { useEffect, useRef, useState } from 'react'
import { CodeBlock } from '../../components/CodeBlock'

// ---------------------------------------------------------------------------
// Interactive read receipts demo
// ---------------------------------------------------------------------------

interface DemoMessage {
  id: string
  author: 'Alice' | 'Bob'
  text: string
  ts: number
}

interface ReadState {
  alice: string | null // last message id Alice has read
  bob: string | null // last message id Bob has read
}

function ReadReceiptsDemo() {
  const [messages, setMessages] = useState<Array<DemoMessage>>([
    {
      id: 'm1',
      author: 'Alice',
      text: 'Hey, did you see the new design?',
      ts: Date.now() - 4000,
    },
    {
      id: 'm2',
      author: 'Bob',
      text: 'Just opened it — looks great!',
      ts: Date.now() - 3000,
    },
    {
      id: 'm3',
      author: 'Alice',
      text: 'Thanks! The animations were tricky.',
      ts: Date.now() - 2000,
    },
  ])
  const [reads, setReads] = useState<ReadState>({ alice: 'm3', bob: 'm2' })
  const [activeUser, setActiveUser] = useState<'Alice' | 'Bob'>('Bob')
  const [input, setInput] = useState('')
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (feedRef.current)
      feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [messages.length])

  const send = () => {
    if (!input.trim()) return
    const id = `m${Date.now()}`
    const msg: DemoMessage = {
      id,
      author: activeUser,
      text: input.trim(),
      ts: Date.now(),
    }
    setMessages((prev) => [...prev, msg])
    // Sender automatically marks their own message as read
    setReads((prev) => ({ ...prev, [activeUser.toLowerCase()]: id }))
    setInput('')
  }

  const markRead = (user: 'Alice' | 'Bob') => {
    const lastId = messages[messages.length - 1]?.id ?? null
    setReads((prev) => ({ ...prev, [user.toLowerCase()]: lastId }))
  }

  const getUnreadCount = (user: 'Alice' | 'Bob') => {
    const lastRead = reads[user.toLowerCase() as 'alice' | 'bob']
    if (!lastRead) return messages.length
    const idx = messages.findIndex((m) => m.id === lastRead)
    if (idx === -1) return messages.length
    return messages.length - 1 - idx
  }

  const getReadByList = (msgId: string) => {
    const readers: Array<string> = []
    const msgIdx = messages.findIndex((m) => m.id === msgId)
    if (msgIdx === -1) return readers
    if (reads.alice) {
      const aliceIdx = messages.findIndex((m) => m.id === reads.alice)
      if (aliceIdx >= msgIdx) readers.push('Alice')
    }
    if (reads.bob) {
      const bobIdx = messages.findIndex((m) => m.id === reads.bob)
      if (bobIdx >= msgIdx) readers.push('Bob')
    }
    return readers
  }

  return (
    <div className="demo-box">
      <h3>Read receipts</h3>
      <p className="demo-desc">
        Switch between users to simulate reading. "Mark read" advances the read
        pointer for that user. The last message shows who has read up to it.
      </p>

      {/* User switcher with unread badges */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {(['Alice', 'Bob'] as const).map((user) => {
          const unread = getUnreadCount(user)
          return (
            <button
              key={user}
              className={`demo-btn demo-btn-sm${activeUser === user ? ' demo-btn-active' : ''}`}
              style={
                activeUser === user
                  ? {
                      borderColor: user === 'Alice' ? '#38bdf8' : '#c084fc',
                      color: user === 'Alice' ? '#38bdf8' : '#c084fc',
                    }
                  : {}
              }
              onClick={() => setActiveUser(user)}
            >
              {user}
              {unread > 0 && (
                <span
                  style={{
                    marginLeft: '0.35rem',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    borderRadius: '100px',
                    padding: '0.05rem 0.35rem',
                    lineHeight: 1.4,
                  }}
                >
                  {unread}
                </span>
              )}
            </button>
          )
        })}
        <button
          className="demo-btn demo-btn-sm"
          onClick={() => markRead(activeUser)}
          style={{ marginLeft: 'auto' }}
        >
          Mark all read as {activeUser}
        </button>
      </div>

      {/* Message feed */}
      <div ref={feedRef} className="demo-chat-feed" style={{ maxHeight: 220 }}>
        {messages.map((msg, idx) => {
          const isLast = idx === messages.length - 1
          const readers = isLast ? getReadByList(msg.id) : []
          return (
            <div
              key={msg.id}
              className={`demo-chat-msg demo-chat-${msg.author.toLowerCase() === 'alice' ? 'a' : 'b'}`}
            >
              <span
                className={`demo-dot demo-dot-${msg.author.toLowerCase() === 'alice' ? 'a' : 'b'}`}
                style={{ marginTop: 3 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    marginRight: '0.35rem',
                  }}
                >
                  {msg.author}
                </span>
                {msg.text}
                {isLast && readers.length > 0 && (
                  <div
                    style={{
                      marginTop: '0.2rem',
                      fontSize: '0.68rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      gap: '0.25rem',
                      alignItems: 'center',
                    }}
                  >
                    <span>Read by</span>
                    {readers.map((r) => (
                      <span
                        key={r}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          background: r === 'Alice' ? '#38bdf8' : '#c084fc',
                          color: '#000',
                        }}
                      >
                        {r[0]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Send bar */}
      <div className="demo-chat-input-row">
        <input
          className="demo-input"
          value={input}
          placeholder={`Message as ${activeUser}…`}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="demo-btn demo-btn-primary" onClick={send}>
          Send
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function ReadReceipts() {
  return (
    <article className="doc-article">
      <h1>Read Receipts</h1>
      <p className="doc-lead">
        Show users when their messages have been seen. TanStack Realtime
        supports two approaches: <strong>presence-based</strong> for ephemeral
        "last seen" state that lives only while users are connected, and{' '}
        <strong>collection-based</strong> for durable read receipts persisted to
        your database.
      </p>

      <h2 id="try-it">Try it</h2>
      <ReadReceiptsDemo />

      <h2 id="approaches">Choosing an approach</h2>
      <div className="doc-grid">
        <div className="doc-grid-card">
          <h3>Presence-based</h3>
          <p>
            Store <code>lastReadMessageId</code> in the presence data for a
            room. Fast, zero persistence, and requires no extra database table.
            Receipt state is lost when the user disconnects.
          </p>
        </div>
        <div className="doc-grid-card">
          <h3>Collection-based</h3>
          <p>
            Persist a <code>read_receipts</code> row per user per room. Survives
            disconnections and page refreshes. Visible to users who were offline
            when the message arrived.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      <h2 id="presence-approach">Presence-based read receipts</h2>
      <p>
        Use <code>createPresenceChannel</code> to define a typed presence
        channel for a chat room, then broadcast a <code>lastReadMessageId</code>{' '}
        field whenever the user scrolls to the bottom or focuses the window.
      </p>

      <h3 id="presence-channel">1. Define the presence channel</h3>
      <CodeBlock
        title="features/chat/presence.ts"
        code={`import { createPresenceChannel } from '@tanstack/realtime'

export interface ChatPresenceData {
  userId: string
  displayName: string
  lastReadMessageId: string | null
}

// createPresenceChannel requires an 'id' and a 'channel' factory.
export const chatPresence = createPresenceChannel({
  id: 'chat-presence',
  channel: (params: { roomId: string }) =>
    ['chat:presence', { roomId: params.roomId }],
})`}
      />

      <h3 id="presence-hook">
        2. Join and read presence in the chat component
      </h3>
      <p>
        Pass <code>initial</code> data when joining. Call{' '}
        <code>updatePresence</code> with a delta — only the listed fields are
        merged, everything else stays unchanged.
      </p>
      <CodeBlock
        title="features/chat/ChatRoom.tsx"
        code={`import { usePresence } from '@tanstack/react-realtime'
import { chatPresence, type ChatPresenceData } from './presence'

function ChatRoom({ roomId, currentUser }: { roomId: string; currentUser: User }) {
  const { others, updatePresence } = usePresence<ChatPresenceData>(chatPresence, {
    params: { roomId },
    initial: {
      userId: currentUser.id,
      displayName: currentUser.name,
      lastReadMessageId: null,
    },
  })

  // Call this when the user reaches the bottom of the message list
  const markRead = (messageId: string) => {
    updatePresence({ lastReadMessageId: messageId })
  }

  return (
    <div>
      <MessageList
        roomId={roomId}
        onLastMessageVisible={markRead}
        // Pass 'others' so MessageList can show who has read each message
        readers={others}
      />
    </div>
  )
}`}
      />

      <h3 id="presence-indicators">3. Render "read by" indicators</h3>
      <p>
        The <code>others</code> array from <code>usePresence</code> is reactive.
        Each entry is a <code>PresenceUser</code> whose <code>.data</code> field
        holds the typed presence payload. Filter by{' '}
        <code>lastReadMessageId</code> to determine who has seen a message.
      </p>
      <CodeBlock
        title="features/chat/MessageList.tsx"
        code={`import type { PresenceUser } from '@tanstack/react-realtime'
import type { ChatPresenceData } from './presence'

interface Props {
  messages: Message[]
  readers: ReadonlyArray<PresenceUser<ChatPresenceData>>
  onLastMessageVisible: (messageId: string) => void
}

export function MessageList({ messages, readers, onLastMessageVisible }: Props) {
  // Build a map: messageId -> list of display names who have read up to it
  function getReadersUpTo(messageId: string): string[] {
    const msgIndex = messages.findIndex((m) => m.id === messageId)
    return readers
      .filter((reader) => {
        const lastRead = reader.data.lastReadMessageId
        if (!lastRead) return false
        const readerIndex = messages.findIndex((m) => m.id === lastRead)
        return readerIndex >= msgIndex
      })
      .map((reader) => reader.data.displayName)
  }

  const lastMessage = messages[messages.length - 1]

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          <p>{msg.text}</p>
          {/* Show read receipts only on the last message to avoid clutter */}
          {msg.id === lastMessage?.id && (
            <ReadByRow names={getReadersUpTo(msg.id)} />
          )}
        </div>
      ))}
    </div>
  )
}

function ReadByRow({ names }: { names: string[] }) {
  if (names.length === 0) return null
  return (
    <div className="read-by-row">
      {names.map((name) => (
        <span key={name} className="read-avatar" title={name}>
          {name[0]}
        </span>
      ))}
    </div>
  )
}`}
      />

      <div className="doc-callout">
        <p>
          <strong>Note:</strong> <code>updatePresence</code> sends only the
          fields you provide — it merges into the server-stored state. A{' '}
          <code>lastReadMessageId</code> update will not overwrite{' '}
          <code>displayName</code> or any other field. The <code>initial</code>{' '}
          object is sent once on mount and is not reactive; subsequent changes
          must go through <code>updatePresence</code>.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      <h2 id="collection-approach">Collection-based read receipts</h2>
      <p>
        For durable receipts that survive disconnection, store a row per user
        per room in a <code>read_receipts</code> table. Use{' '}
        <code>realtimeCollectionOptions</code> to sync the collection in real
        time so every connected client sees receipt updates as they happen.
      </p>

      <h3 id="collection-schema">1. Data model</h3>
      <CodeBlock
        title="db/schema.ts"
        code={`// One row per user per room — upserted whenever the user reads new messages.
export interface ReadReceipt {
  id: string          // e.g. \`\${userId}:\${roomId}\`
  userId: string
  roomId: string
  lastReadMessageId: string
  readAt: string      // ISO-8601 timestamp
}`}
      />

      <h3 id="collection-definition">2. Define the collection</h3>
      <p>
        Use <code>useRealtimeCollection</code> (React hook) or the lower-level{' '}
        <code>realtimeCollectionOptions</code> to wire up the collection. The{' '}
        <code>getKey</code> function returns the composite key so upserts land
        on the correct row.
      </p>
      <CodeBlock
        title="features/chat/readReceiptsCollection.ts"
        code={`import { realtimeCollectionOptions } from '@tanstack/realtime'
import { realtimeClient } from '../../client/realtime'
import type { ReadReceipt } from '../../db/schema'

export const readReceiptsOptions = (roomId: string) =>
  realtimeCollectionOptions<ReadReceipt>({
    client: realtimeClient,
    // Composite key keeps one row per user per room
    getKey: (r) => r.id,
    channel: ['read-receipts', { roomId }],

    // Load existing receipts on mount
    queryFn: () =>
      fetch(\`/api/rooms/\${roomId}/read-receipts\`).then((r) => r.json()),

    // Called when the current user upserts their receipt
    onInsert: async ({ transaction }) => {
      const data = transaction.mutations[0].modified
      const res = await fetch('/api/read-receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()  // returning the saved row triggers auto-broadcast
    },

    onUpdate: async ({ transaction }) => {
      const data = transaction.mutations[0].modified
      const res = await fetch(\`/api/read-receipts/\${data.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
  })`}
      />

      <h3 id="collection-hook">3. Use the collection in a component</h3>
      <p>
        <code>useRealtimeCollection</code> creates and manages the collection
        lifecycle. Pass the stable <code>Collection</code> object to{' '}
        <code>useLiveQuery</code> from <code>@tanstack/react-db</code> to query
        reactively.
      </p>
      <CodeBlock
        title="features/chat/ChatRoom.tsx"
        code={`import { useRealtimeCollection } from '@tanstack/react-realtime'
import { useLiveQuery } from '@tanstack/react-db'
import { readReceiptsOptions } from './readReceiptsCollection'
import type { ReadReceipt } from '../../db/schema'

function ChatRoom({ roomId, currentUser }: { roomId: string; currentUser: User }) {
  // The collection is stable across renders
  const receiptsCollection = useRealtimeCollection<ReadReceipt>(
    readReceiptsOptions(roomId),
  )

  // Query all receipts for this room reactively
  const { data: receipts } = useLiveQuery((q) =>
    q.from({ receiptsCollection }).select(),
  )

  // Mark the current user as having read up to a message
  const markRead = async (messageId: string) => {
    const receiptId = \`\${currentUser.id}:\${roomId}\`
    const existing = receipts.find((r) => r.id === receiptId)

    if (existing) {
      await receiptsCollection.update({
        ...existing,
        lastReadMessageId: messageId,
        readAt: new Date().toISOString(),
      })
    } else {
      await receiptsCollection.insert({
        id: receiptId,
        userId: currentUser.id,
        roomId,
        lastReadMessageId: messageId,
        readAt: new Date().toISOString(),
      })
    }
  }

  return (
    <MessageList
      roomId={roomId}
      receipts={receipts}
      onLastMessageVisible={markRead}
    />
  )
}`}
      />

      {/* ------------------------------------------------------------------ */}
      <h2 id="read-by-indicators">Showing "read by" indicators</h2>
      <p>
        Whether you use presence or collections, the rendering logic is the
        same: for each message, find the receipts where{' '}
        <code>lastReadMessageId</code> is at or after that message in the
        ordered list.
      </p>
      <CodeBlock
        title="features/chat/MessageList.tsx (collection variant)"
        code={`interface Props {
  messages: Message[]
  receipts: ReadReceipt[]
}

export function MessageList({ messages, receipts }: Props) {
  // Index message positions for O(1) lookups
  const msgIndex = new Map(messages.map((m, i) => [m.id, i]))

  function getReadersUpTo(messageId: string): ReadReceipt[] {
    const threshold = msgIndex.get(messageId) ?? -1
    return receipts.filter((r) => {
      const readerPos = msgIndex.get(r.lastReadMessageId) ?? -1
      return readerPos >= threshold
    })
  }

  const lastMessage = messages[messages.length - 1]

  return (
    <ul>
      {messages.map((msg) => (
        <li key={msg.id}>
          <p>{msg.text}</p>

          {/* Only show read receipts on the last message */}
          {msg.id === lastMessage?.id && (
            <div className="read-by-row">
              {getReadersUpTo(msg.id).map((r) => (
                <Avatar key={r.userId} userId={r.userId} size={16} />
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}`}
      />

      {/* ------------------------------------------------------------------ */}
      <h2 id="unread-count">Unread count badge</h2>
      <p>
        Compute the unread count by comparing the current user's{' '}
        <code>lastReadMessageId</code> against the full message list. This works
        for both the presence and collection approaches.
      </p>
      <CodeBlock
        title="features/chat/UnreadBadge.tsx"
        code={`interface Props {
  messages: Message[]
  lastReadMessageId: string | null
}

export function UnreadBadge({ messages, lastReadMessageId }: Props) {
  const unread = (() => {
    if (!lastReadMessageId) return messages.length
    const lastReadIndex = messages.findIndex((m) => m.id === lastReadMessageId)
    if (lastReadIndex === -1) return messages.length
    return messages.length - 1 - lastReadIndex
  })()

  if (unread === 0) return null

  return (
    <span className="unread-badge">
      {unread > 99 ? '99+' : unread}
    </span>
  )
}

// Usage — presence-based
function RoomListItem({ room, currentUser }: { room: Room; currentUser: User }) {
  const { others } = usePresence(chatPresence, {
    params: { roomId: room.id },
    initial: { userId: currentUser.id, displayName: currentUser.name, lastReadMessageId: null },
  })

  // Find the current user's own receipt from presence
  // (presence 'others' excludes the current user, so track it via local state
  //  or a separate source of truth like the collection approach below)
  return (
    <div>
      {room.name}
      <UnreadBadge
        messages={room.messages}
        lastReadMessageId={currentUser.lastReadMessageId}
      />
    </div>
  )
}

// Usage — collection-based (cleaner for room lists)
function RoomListItemWithCollection({ room, currentUser }: { room: Room; currentUser: User }) {
  const receiptsCollection = useRealtimeCollection(readReceiptsOptions(room.id))
  const { data: receipts } = useLiveQuery((q) =>
    q.from({ receiptsCollection }).select(),
  )

  const myReceipt = receipts.find((r) => r.userId === currentUser.id)

  return (
    <div>
      {room.name}
      <UnreadBadge
        messages={room.messages}
        lastReadMessageId={myReceipt?.lastReadMessageId ?? null}
      />
    </div>
  )
}`}
      />

      {/* ------------------------------------------------------------------ */}
      <h2 id="mark-read-on-scroll">Triggering mark-read automatically</h2>
      <p>
        Use an <code>IntersectionObserver</code> on the last message element to
        call <code>markRead</code> automatically when the user scrolls to the
        bottom. This avoids button-based UX and matches the behavior users
        expect from chat apps.
      </p>
      <CodeBlock
        title="features/chat/useMarkReadOnVisible.ts"
        code={`import { useEffect, useRef } from 'react'

/**
 * Calls \`onVisible\` with the message id when the element enters the viewport.
 * Ideal for the last message in a list.
 */
export function useMarkReadOnVisible(
  messageId: string | undefined,
  onVisible: (messageId: string) => void,
) {
  const ref = useRef<HTMLDivElement | null>(null)
  const callbackRef = useRef(onVisible)
  callbackRef.current = onVisible

  useEffect(() => {
    const el = ref.current
    if (!el || !messageId) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) callbackRef.current(messageId)
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [messageId])

  return ref
}

// Usage
function LastMessage({ message, onRead }: { message: Message; onRead: (id: string) => void }) {
  const ref = useMarkReadOnVisible(message.id, onRead)
  return <div ref={ref}>{message.text}</div>
}`}
      />

      {/* ------------------------------------------------------------------ */}
      <h2 id="which-to-use">Which approach to choose</h2>
      <div className="doc-callout">
        <p>
          <strong>Use presence-based receipts</strong> when you only need to
          show "currently reading" state to other active users — lightweight
          chat apps, document viewers, support widgets. There is no persistence
          and no database table to manage.
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          <strong>Use collection-based receipts</strong> when receipt state must
          survive page refreshes and be visible after a user reconnects — team
          chat, async collaboration tools, notification inboxes. A{' '}
          <code>read_receipts</code> table gives you a queryable audit trail and
          correct unread counts even for users who were offline when messages
          arrived.
        </p>
      </div>
    </article>
  )
}
