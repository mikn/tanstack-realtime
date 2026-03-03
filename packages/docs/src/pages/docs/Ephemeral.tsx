import { CodeBlock } from '../../components/CodeBlock'

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Ephemeral() {
  return (
    <article className="doc-article">
      <h1>Ephemeral Channels</h1>
      <p className="doc-lead">
        Fire-and-forget events that expire after a TTL. Typing indicators,
        reactions, &ldquo;user is viewing&rdquo; notifications.
      </p>

      <h2 id="define">Define an ephemeral channel</h2>
      <p>
        <code>ephemeralLiveOptions</code> creates a TanStack DB collection
        backed by an auto-expiring map. Each incoming channel event is mapped
        through <code>onEvent</code> to a row. When the same key receives a new
        event the TTL timer resets. When the TTL expires without a new event the
        row is automatically removed from the collection.
      </p>
      <CodeBlock
        title="features/chat/typing.ts"
        code={`import { createCollection } from '@tanstack/db'
import { ephemeralLiveOptions } from '@tanstack/realtime'

interface TypingUser {
  userId: string
  name: string
}

export const typingCollection = createCollection(
  ephemeralLiveOptions<TypingUser, string>({
    client: realtimeClient,
    channel: ['chat:typing', { roomId }],
    id: 'typing',
    getKey: (item) => item.userId,

    onEvent: (raw) => {
      const e = raw as { type: string; userId: string; name: string }
      if (e.type !== 'typing') return null
      return { userId: e.userId, name: e.name }
    },

    // Row is removed 3 seconds after the last event for this key.
    ttl: 3000,
  })
)`}
      />
      <div className="doc-callout">
        <p>
          The <code>ttl</code> option defaults to <strong>3 000 ms</strong>.
          Setting the same key again resets the timer &mdash; use this for
          heartbeat-style &ldquo;still active&rdquo; events.
        </p>
      </div>

      <h2 id="typing">Recipe: Typing indicators</h2>
      <p>
        The classic ephemeral use case. The server publishes a{' '}
        <code>typing</code> event every time a user presses a key. Each
        client&rsquo;s collection shows who is currently typing. When a user
        stops typing the entry expires automatically.
      </p>
      <CodeBlock
        title="features/chat/TypingIndicator.tsx"
        code={`import { useLiveQuery } from '@tanstack/react-db'
import { typingCollection } from './typing'

function TypingIndicator() {
  const { data: typing } = useLiveQuery((q) =>
    q.from({ typingCollection })
  )

  if (typing.length === 0) return null

  const names = typing.map((t) => t.name)
  return (
    <span className="typing-indicator">
      {names.join(', ')} {names.length === 1 ? 'is' : 'are'} typing...
    </span>
  )
}`}
      />
      <p>
        On the sending side, publish a typing event on every keystroke (or
        debounced). The TTL handles the &ldquo;stopped typing&rdquo; case
        automatically &mdash; no explicit &ldquo;stop&rdquo; event needed.
      </p>
      <CodeBlock
        title="features/chat/ChatInput.tsx"
        code={`import { usePublish } from '@tanstack/react-realtime'

function ChatInput({ roomId, currentUser }: Props) {
  const publish = usePublish(['chat:typing', { roomId }])

  return (
    <input
      onChange={() =>
        publish({ type: 'typing', userId: currentUser.id, name: currentUser.name })
      }
      placeholder="Type a message..."
    />
  )
}`}
      />

      <h2 id="reactions">Recipe: Emoji reactions</h2>
      <p>
        Ephemeral events are perfect for lightweight animations that should
        appear briefly and then disappear. Publish a reaction event, animate it
        on the client, and let the TTL clean it up.
      </p>
      <CodeBlock
        title="features/reactions/reactions.ts"
        code={`import { createCollection } from '@tanstack/db'
import { ephemeralLiveOptions } from '@tanstack/realtime'

interface Reaction {
  id: string
  emoji: string
  userId: string
}

export const reactionCollection = createCollection(
  ephemeralLiveOptions<Reaction, string>({
    client: realtimeClient,
    channel: ['reactions', { postId }],
    id: 'reactions',
    getKey: (r) => r.id,

    onEvent: (raw) => {
      const e = raw as { type: string } & Reaction
      return e.type === 'reaction' ? e : null
    },

    // Reactions animate in, then auto-expire after 2 seconds.
    ttl: 2000,
  })
)`}
      />
      <CodeBlock
        title="features/reactions/ReactionOverlay.tsx"
        code={`import { useLiveQuery } from '@tanstack/react-db'
import { reactionCollection } from './reactions'

function ReactionOverlay() {
  const { data: reactions } = useLiveQuery((q) =>
    q.from({ reactionCollection })
  )

  return (
    <div className="reaction-overlay">
      {reactions.map((r) => (
        <span key={r.id} className="reaction-bubble animate-float">
          {r.emoji}
        </span>
      ))}
    </div>
  )
}`}
      />

      <h2 id="viewing">Recipe: &ldquo;User is viewing&rdquo;</h2>
      <p>
        For presence-like indicators on channels that don&rsquo;t support the
        full presence protocol, ephemeral events work as a lightweight
        alternative. Each client publishes a heartbeat every few seconds; the
        TTL removes users who stop sending.
      </p>
      <CodeBlock
        title="features/viewing/viewing.ts"
        code={`import { createCollection } from '@tanstack/db'
import { ephemeralLiveOptions } from '@tanstack/realtime'

interface Viewer {
  userId: string
  name: string
  avatarUrl: string
}

export const viewerCollection = createCollection(
  ephemeralLiveOptions<Viewer, string>({
    client: realtimeClient,
    channel: ['doc:viewers', { docId }],
    id: 'viewers',
    getKey: (v) => v.userId,

    onEvent: (raw) => {
      const e = raw as { type: string } & Viewer
      return e.type === 'viewing' ? e : null
    },

    // If no heartbeat arrives in 10 seconds, the viewer disappears.
    ttl: 10_000,
  })
)`}
      />
      <CodeBlock
        title="features/viewing/ViewerHeartbeat.tsx"
        code={`import { useEffect } from 'react'
import { usePublish } from '@tanstack/react-realtime'

function ViewerHeartbeat({ docId, currentUser }: Props) {
  const publish = usePublish(['doc:viewers', { docId }])

  useEffect(() => {
    // Send a heartbeat immediately, then every 5 seconds.
    const payload = {
      type: 'viewing',
      userId: currentUser.id,
      name: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
    }
    publish(payload)
    const interval = setInterval(() => publish(payload), 5000)
    return () => clearInterval(interval)
  }, [docId, currentUser.id])

  return null // Headless component
}`}
      />
      <div className="doc-callout">
        <p>
          Set the <code>ttl</code> to at least 2&times; the heartbeat interval
          to avoid flickering. A heartbeat every 5 s with a TTL of 10 s gives
          one missed heartbeat as grace period.
        </p>
      </div>
    </article>
  )
}
