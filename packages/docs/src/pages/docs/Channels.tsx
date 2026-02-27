import { useEffect, useRef, useState } from 'react'
import { CodeBlock } from '../../components/CodeBlock'

// ---------------------------------------------------------------------------
// Interactive pub/sub demo
// ---------------------------------------------------------------------------

interface Msg {
  id: string
  from: 'A' | 'B'
  text: string
  ts: number
}

function PubSubDemo() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [inputA, setInputA] = useState('')
  const [inputB, setInputB] = useState('')
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [msgs.length])

  const send = (from: 'A' | 'B', text: string) => {
    if (!text.trim()) return
    setMsgs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), from, text: text.trim(), ts: Date.now() },
    ])
  }

  const sendA = () => { send('A', inputA); setInputA('') }
  const sendB = () => { send('B', inputB); setInputB('') }

  return (
    <div className="demo-box">
      <h3>Pub/Sub channel</h3>
      <p className="demo-desc">
        Two clients publish messages to the same channel. Both see every
        message in real time. Type in either input and press Enter.
      </p>
      <div
        ref={feedRef}
        className="demo-chat-feed"
      >
        {msgs.length === 0 && (
          <div className="demo-chat-empty">
            No messages yet. Send one from Client A or B.
          </div>
        )}
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`demo-chat-msg demo-chat-${m.from.toLowerCase()}`}
          >
            <span className={`demo-dot demo-dot-${m.from.toLowerCase()}`} />
            <strong>Client {m.from}</strong>: {m.text}
          </div>
        ))}
      </div>
      <div className="demo-clients">
        <div className="demo-client demo-client-a">
          <div className="demo-client-hdr">
            <span className="demo-dot demo-dot-a" /> Client A
          </div>
          <div className="demo-chat-input-row">
            <input
              className="demo-input"
              value={inputA}
              placeholder="Type a message..."
              onChange={(e) => setInputA(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendA()}
            />
            <button className="demo-btn demo-btn-primary" onClick={sendA}>
              Send
            </button>
          </div>
        </div>
        <div className="demo-client demo-client-b">
          <div className="demo-client-hdr">
            <span className="demo-dot demo-dot-b" /> Client B
          </div>
          <div className="demo-chat-input-row">
            <input
              className="demo-input"
              value={inputB}
              placeholder="Type a message..."
              onChange={(e) => setInputB(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendB()}
            />
            <button className="demo-btn demo-btn-primary" onClick={sendB}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Channels() {
  return (
    <article className="doc-article">
      <h1>Channels &amp; Pub/Sub</h1>
      <p className="doc-lead">
        Not every piece of realtime data is a database row. Channels give you
        raw pub/sub messaging, append-only event streams, and ephemeral data
        like typing indicators.
      </p>

      <h2 id="try-it">Try it</h2>
      <PubSubDemo />

      <h2 id="use-subscribe">useSubscribe &mdash; raw channel events</h2>
      <CodeBlock
        code={`import { useSubscribe } from '@tanstack/react-realtime'

function TypingIndicator({ roomId }: { roomId: string }) {
  const [typing, setTyping] = useState<string[]>([])

  useSubscribe(['chat:typing', { roomId }], (event) => {
    setTyping((event as { users: string[] }).users)
  })

  return typing.length > 0
    ? <span>{typing.join(', ')} typing...</span>
    : null
}`}
      />

      <h2 id="use-publish">usePublish &mdash; publish to a channel</h2>
      <CodeBlock
        code={`import { usePublish } from '@tanstack/react-realtime'

function TypingBroadcast({ roomId }: { roomId: string }) {
  const publish = usePublish(['chat:typing', { roomId }])

  return (
    <input
      onFocus={() => publish({ users: [currentUser.id] })}
      onBlur={() => publish({ users: [] })}
    />
  )
}`}
      />

      <h2 id="use-channel">useChannel &mdash; subscribe + publish</h2>
      <CodeBlock
        code={`import { useChannel } from '@tanstack/react-realtime'

function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const { publish } = useChannel(
    ['chat', { roomId }],
    (raw) => setMessages((prev) => [...prev, raw as Message]),
  )

  return (
    <>
      {messages.map((m) => <p key={m.id}>{m.text}</p>)}
      <button onClick={() =>
        publish({ id: crypto.randomUUID(), text: 'Hi!' })
      }>
        Send
      </button>
    </>
  )
}`}
      />

      <h2 id="live-channels">Live event channels</h2>
      <p>
        Use <code>liveChannelOptions</code> for append-only streams like chat,
        audit logs, or game events. Unlike <code>realtimeCollectionOptions</code>,
        there is no <code>onUpdate</code> or <code>onDelete</code>.
      </p>
      <CodeBlock
        title="features/chat/collection.ts"
        code={`import { liveChannelOptions } from '@tanstack/realtime'

const chatOptions = (roomId: string) =>
  liveChannelOptions<Message, string>({
    client: realtimeClient,
    channel: ['chat', { roomId }],
    getKey: (m) => m.id,

    initialData: () =>
      fetch(\`/api/rooms/\${roomId}/messages?limit=50\`).then(r => r.json()),

    onEvent: (raw) => {
      const e = raw as { type: string; message: Message }
      return e.type === 'message' ? e.message : null
    },
  })`}
      />

      <h2 id="when-to-use">liveChannelOptions vs realtimeCollectionOptions</h2>
      <div className="doc-callout">
        <p>
          Use <code>realtimeCollectionOptions</code> when your data lives in a
          database and has full CRUD semantics. Use{' '}
          <code>liveChannelOptions</code> when events only ever append &mdash;
          chat, audit logs, game events. The key difference:{' '}
          <code>liveChannelOptions</code> has no <code>onUpdate</code> or{' '}
          <code>onDelete</code>, and its <code>onEvent</code> callback decides
          which events to keep.
        </p>
      </div>
    </article>
  )
}
