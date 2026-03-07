import { useEffect, useRef, useState } from 'react'
import { CodeBlock } from '../../components/CodeBlock'

// ---------------------------------------------------------------------------
// Emoji reactions demo
// ---------------------------------------------------------------------------

const EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉']
const COLORS = ['#38bdf8', '#c084fc', '#f472b6', '#22c55e', '#fb923c']
const USER_NAMES = ['Alice', 'Bob', 'Charlie', 'Dana', 'Eve']

interface FloatingReaction {
  id: string
  emoji: string
  x: number
  createdAt: number
}

interface ReactionCount {
  emoji: string
  count: number
}

function EmojiReactionsDemo() {
  const [floating, setFloating] = useState<Array<FloatingReaction>>([])
  const [counts, setCounts] = useState<Array<ReactionCount>>(
    EMOJIS.map((e) => ({ emoji: e, count: 0 })),
  )
  const [activeUser, setActiveUser] = useState(0)

  // Remove floating reactions after animation
  useEffect(() => {
    if (floating.length === 0) return
    const timeout = setTimeout(() => {
      const now = Date.now()
      setFloating((prev) => prev.filter((r) => now - r.createdAt < 1800))
    }, 1800)
    return () => clearTimeout(timeout)
  }, [floating])

  const sendReaction = (emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`
    const x = 10 + Math.random() * 80 // percent
    setFloating((prev) => [...prev, { id, emoji, x, createdAt: Date.now() }])
    setCounts((prev) =>
      prev.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r)),
    )
  }

  return (
    <div className="demo-box">
      <h3>Emoji reactions</h3>
      <p className="demo-desc">
        Click an emoji to send a reaction. Reactions float up and disappear
        after ~2 seconds — exactly like ephemeral channel events with a short
        TTL. Persistent counts accumulate separately.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {USER_NAMES.map((name, i) => (
          <button
            key={name}
            className={`demo-btn demo-btn-sm${activeUser === i ? ' demo-btn-active' : ''}`}
            style={
              activeUser === i
                ? { borderColor: COLORS[i], color: COLORS[i] }
                : {}
            }
            onClick={() => setActiveUser(i)}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Floating reaction stage */}
      <div
        style={{
          position: 'relative',
          height: 100,
          background: 'var(--surface-2, #1e293b)',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        {floating.map((r) => (
          <span
            key={r.id}
            style={{
              position: 'absolute',
              left: `${r.x}%`,
              bottom: 0,
              fontSize: 24,
              animation: 'floatUp 1.8s ease-out forwards',
              pointerEvents: 'none',
            }}
          >
            {r.emoji}
          </span>
        ))}
        <style>{`
          @keyframes floatUp {
            from { transform: translateY(0); opacity: 1; }
            to   { transform: translateY(-90px); opacity: 0; }
          }
        `}</style>
      </div>

      {/* Reaction buttons */}
      <div
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}
      >
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="demo-btn"
            style={{ fontSize: 20, padding: '4px 12px' }}
            onClick={() => sendReaction(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Persistent counts */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {counts.map((r) => (
          <span
            key={r.emoji}
            style={{
              fontSize: 14,
              color: 'var(--text-muted, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {r.emoji}
            <strong style={{ color: 'var(--text, #e2e8f0)' }}>{r.count}</strong>
          </span>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Viewing indicator demo
// ---------------------------------------------------------------------------

interface ViewerEntry {
  id: string
  name: string
  color: string
  lastSeen: number
}

function ViewingIndicatorDemo() {
  const TTL = 3000
  const [viewers, setViewers] = useState<Array<ViewerEntry>>([])
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const simulateHeartbeat = (name: string, color: string) => {
    const id = name.toLowerCase()
    const entry: ViewerEntry = { id, name, color, lastSeen: Date.now() }

    setViewers((prev) => {
      const filtered = prev.filter((v) => v.id !== id)
      return [...filtered, entry]
    })

    // Clear existing timer, set new one
    if (id in timers.current) clearTimeout(timers.current[id])
    timers.current[id] = setTimeout(() => {
      setViewers((prev) => prev.filter((v) => v.id !== id))
      delete timers.current[id]
    }, TTL)
  }

  useEffect(() => {
    const currentTimers = timers.current
    return () => {
      // Cleanup timers on unmount
      for (const t of Object.values(currentTimers)) clearTimeout(t)
    }
  }, [])

  const colorMap: Record<string, string> = {
    Alice: COLORS[0],
    Bob: COLORS[1],
    Charlie: COLORS[2],
    Dana: COLORS[3],
  }

  return (
    <div className="demo-box">
      <h3>User is viewing</h3>
      <p className="demo-desc">
        Click a user's button to send a heartbeat. Their badge appears and
        automatically disappears after 3 seconds of silence — the same
        auto-expiry behaviour as <code>ephemeralLiveOptions</code>.
      </p>

      <div
        style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}
      >
        {['Alice', 'Bob', 'Charlie', 'Dana'].map((name) => (
          <button
            key={name}
            className="demo-btn"
            onClick={() => simulateHeartbeat(name, colorMap[name])}
          >
            Heartbeat as {name}
          </button>
        ))}
      </div>

      <div style={{ minHeight: 40 }}>
        {viewers.length === 0 ? (
          <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: 14 }}>
            No one is viewing (send a heartbeat)
          </span>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: 13 }}>
              Viewing:
            </span>
            {viewers.map((v) => (
              <span
                key={v.id}
                className="demo-avatar"
                style={{ background: v.color }}
                title={`${v.name} (expires in ~3s)`}
              >
                {v.name[0]}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cursor sharing demo (presence)
// ---------------------------------------------------------------------------

interface CursorUser {
  id: string
  name: string
  color: string
  cursor: { x: number; y: number } | null
}

function CursorSharingDemo() {
  const areaRef = useRef<HTMLDivElement>(null)
  const [peers, setPeers] = useState<Array<CursorUser>>([
    { id: 'peer-1', name: 'Bob', color: COLORS[1], cursor: { x: 120, y: 60 } },
    {
      id: 'peer-2',
      name: 'Charlie',
      color: COLORS[2],
      cursor: { x: 200, y: 100 },
    },
  ])
  const [localCursor, setLocalCursor] = useState<{
    x: number
    y: number
  } | null>(null)

  // Animate peers
  useEffect(() => {
    const interval = setInterval(() => {
      setPeers((prev) =>
        prev.map((u) => {
          if (!u.cursor) return u
          const area = areaRef.current
          if (!area) return u
          const w = area.offsetWidth - 16
          const h = area.offsetHeight - 16
          return {
            ...u,
            cursor: {
              x: Math.max(
                8,
                Math.min(w, u.cursor.x + (Math.random() - 0.5) * 30),
              ),
              y: Math.max(
                8,
                Math.min(h, u.cursor.y + (Math.random() - 0.5) * 30),
              ),
            },
          }
        }),
      )
    }, 700)
    return () => clearInterval(interval)
  }, [])

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setLocalCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const onMouseLeave = () => setLocalCursor(null)

  return (
    <div className="demo-box">
      <h3>Cursor sharing</h3>
      <p className="demo-desc">
        Move your mouse over the canvas to see your cursor. Bob and Charlie move
        automatically. In a real app, cursor positions are broadcast via{' '}
        <code>updatePresence</code>.
      </p>
      <div
        ref={areaRef}
        className="demo-presence-area"
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ userSelect: 'none' }}
      >
        <div className="demo-presence-label">
          {peers.length + (localCursor ? 1 : 0)} cursor
          {peers.length + (localCursor ? 1 : 0) !== 1 ? 's' : ''} visible
        </div>
        {/* Local cursor */}
        {localCursor && (
          <div
            className="demo-cursor"
            style={{
              left: localCursor.x,
              top: localCursor.y,
              color: COLORS[0],
            }}
          >
            <svg width="16" height="20" viewBox="0 0 16 20" fill="currentColor">
              <path d="M0 0L16 12H6L3.5 20L0 0Z" />
            </svg>
            <span
              className="demo-cursor-label"
              style={{ background: COLORS[0] }}
            >
              You
            </span>
          </div>
        )}
        {/* Peer cursors */}
        {peers.map((u) =>
          u.cursor ? (
            <div
              key={u.id}
              className="demo-cursor"
              style={{ left: u.cursor.x, top: u.cursor.y, color: u.color }}
            >
              <svg
                width="16"
                height="20"
                viewBox="0 0 16 20"
                fill="currentColor"
              >
                <path d="M0 0L16 12H6L3.5 20L0 0Z" />
              </svg>
              <span
                className="demo-cursor-label"
                style={{ background: u.color }}
              >
                {u.name}
              </span>
            </div>
          ) : null,
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Ephemeral() {
  return (
    <article className="doc-article">
      <h1>Ephemeral &amp; Reaction Patterns</h1>
      <p className="doc-lead">
        Ephemeral data has a short life — typing indicators, cursors, emoji
        reactions, and "user is viewing" badges. This guide shows six
        production-ready patterns built on <code>ephemeralLiveOptions</code>,{' '}
        <code>usePublish</code>, <code>usePresence</code>,{' '}
        <code>useSubscribe</code>, and <code>useSyncedCounter</code>.
      </p>

      {/* ------------------------------------------------------------------
          1. Emoji reactions
      ------------------------------------------------------------------ */}
      <h2 id="emoji-reactions">1. Emoji reactions</h2>
      <p>
        Send ephemeral reaction events with a short TTL so every client sees the
        animation, then discard them automatically. Pair with a persistent
        counter (PN-Counter CRDT) when you need a total that survives page
        reloads.
      </p>

      <EmojiReactionsDemo />

      <h3 id="reactions-server">Server — publish to a reactions channel</h3>
      <p>
        The server receives reaction events from any client and re-broadcasts
        them to the channel. Nothing is stored permanently — the ephemeral map
        on each client handles the TTL.
      </p>
      <CodeBlock
        title="server/routes/reactions.ts"
        code={`import { createValidatedPublish } from '@tanstack/realtime'
import { realtime } from './realtime.server'

// Validate and re-broadcast incoming reaction events.
// The payload is discarded after TTL ms — no database write needed.
export const publishReaction = createValidatedPublish({
  publish: realtime.publish,
  validate: ({ data }) => {
    const e = data as { type: string; emoji: string; userId: string }
    if (e.type !== 'reaction') return { accepted: false, reason: 'Not a reaction' }
    if (!['👍','❤️','😂','🔥','🎉'].includes(e.emoji)) {
      return { accepted: false, reason: 'Invalid emoji' }
    }
    return {
      accepted: true,
      data: { type: 'reaction', emoji: e.emoji, userId: e.userId },
    }
  },
})`}
      />

      <h3 id="reactions-collection">
        Client — ephemeral collection for animation
      </h3>
      <p>
        Use <code>ephemeralLiveOptions</code> to create a TanStack DB collection
        that holds only <em>currently animating</em> reactions. Each reaction
        entry expires after <code>ttl</code> ms and is automatically removed
        from the collection.
      </p>
      <CodeBlock
        title="features/reactions/collection.ts"
        code={`import { createCollection } from '@tanstack/db'
import { ephemeralLiveOptions } from '@tanstack/realtime'
import { realtimeClient } from '../client'

interface Reaction {
  id: string       // crypto.randomUUID() from the sender
  emoji: string
  userId: string
}

// Each reaction lives for 2 seconds then auto-expires.
export const reactionsCollection = createCollection(
  ephemeralLiveOptions<Reaction>({
    client: realtimeClient,
    channel: ['reactions', { postId: 'global' }],
    id: 'reactions',
    getKey: (r) => r.id,
    onEvent: (raw) => {
      const e = raw as { type: string; id: string; emoji: string; userId: string }
      if (e.type !== 'reaction') return null
      return { id: e.id, emoji: e.emoji, userId: e.userId }
    },
    ttl: 2000,  // remove from collection after 2 s
  }),
)`}
      />

      <h3 id="reactions-component">
        Client — sending and displaying reactions
      </h3>
      <CodeBlock
        title="features/reactions/ReactionBar.tsx"
        code={`import { useLiveQuery } from '@tanstack/react-db'
import { usePublish } from '@tanstack/react-realtime'
import { reactionsCollection } from './collection'

const EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉']

function ReactionBar({ postId }: { postId: string }) {
  const publish = usePublish(['reactions', { postId }])

  // Only currently-animating reactions (auto-empties after TTL).
  const { data: animating } = useLiveQuery((q) =>
    q.from({ r: reactionsCollection }).select(),
  )

  const sendReaction = (emoji: string) => {
    void publish({
      type: 'reaction',
      id: crypto.randomUUID(),
      emoji,
      userId: currentUser.id,
    })
  }

  return (
    <div>
      {/* Floating animation layer */}
      {animating.map((r) => (
        <FloatingEmoji key={r.id} emoji={r.emoji} />
      ))}

      {/* Reaction buttons */}
      {EMOJIS.map((emoji) => (
        <button key={emoji} onClick={() => sendReaction(emoji)}>
          {emoji}
        </button>
      ))}
    </div>
  )
}`}
      />

      <div className="doc-callout">
        <p>
          <strong>Why not useState?</strong> Using an ephemeral collection
          instead of local state means every tab and every client sees the same
          reactions — including reactions sent by other users. The{' '}
          <code>onEvent</code> filter ensures only <code>type: 'reaction'</code>{' '}
          events enter the collection; other event types on the same channel
          (e.g. messages) are ignored.
        </p>
      </div>

      {/* ------------------------------------------------------------------
          2. Viewing indicator (heartbeat)
      ------------------------------------------------------------------ */}
      <h2 id="viewing-indicator">2. "User is viewing" indicator</h2>
      <p>
        Broadcast a heartbeat every few seconds to indicate that a user is
        actively viewing a page. The <code>ttl</code> is set slightly longer
        than the heartbeat interval so a missed pulse causes the badge to
        disappear.
      </p>

      <ViewingIndicatorDemo />

      <h3 id="viewing-collection">Collection definition</h3>
      <CodeBlock
        title="features/viewing/collection.ts"
        code={`import { createCollection } from '@tanstack/db'
import { ephemeralLiveOptions } from '@tanstack/realtime'
import { realtimeClient } from '../client'

interface Viewer {
  userId: string
  name: string
  avatarUrl?: string
}

// TTL = 5 s, heartbeat interval = 3 s → one missed pulse = badge gone.
export const viewersCollection = createCollection(
  ephemeralLiveOptions<Viewer>({
    client: realtimeClient,
    channel: ['viewing', { pageId: 'home' }],
    id: 'viewers',
    getKey: (v) => v.userId,
    onEvent: (raw) => {
      const e = raw as { type: string; userId: string; name: string; avatarUrl?: string }
      if (e.type !== 'viewing') return null
      return { userId: e.userId, name: e.name, avatarUrl: e.avatarUrl }
    },
    ttl: 5000,  // badge disappears after 5 s of silence
  }),
)`}
      />

      <h3 id="viewing-component">Heartbeat component</h3>
      <p>
        Send the heartbeat on mount and at a regular interval. Use{' '}
        <code>usePublish</code> for the outgoing side and{' '}
        <code>useLiveQuery</code> to reactively read the viewers collection.
      </p>
      <CodeBlock
        title="features/viewing/ViewingIndicator.tsx"
        code={`import { useEffect } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { usePublish } from '@tanstack/react-realtime'
import { viewersCollection } from './collection'

const HEARTBEAT_INTERVAL = 3000  // ms

function ViewingIndicator({ pageId }: { pageId: string }) {
  const publish = usePublish(['viewing', { pageId }])

  // Broadcast heartbeat on mount and every HEARTBEAT_INTERVAL ms.
  useEffect(() => {
    const payload = {
      type: 'viewing',
      userId: currentUser.id,
      name: currentUser.name,
    }
    void publish(payload)  // immediate on mount
    const id = setInterval(() => void publish(payload), HEARTBEAT_INTERVAL)
    return () => clearInterval(id)
  }, [publish])

  // Reactive list of current viewers (excludes self via server-side filtering
  // or by filtering userId on the client).
  const { data: viewers } = useLiveQuery((q) =>
    q.from({ v: viewersCollection })
      .where(({ v }) => v.userId !== currentUser.id)
      .select(),
  )

  return (
    <div className="avatar-row">
      {viewers.map((v) => (
        <img
          key={v.userId}
          src={v.avatarUrl ?? '/default-avatar.png'}
          alt={v.name}
          title={\`\${v.name} is viewing\`}
        />
      ))}
    </div>
  )
}`}
      />

      <div className="doc-callout">
        <p>
          <strong>Heartbeat pattern:</strong> Calling <code>set()</code> on the
          ephemeral map (inside <code>ephemeralLiveOptions</code>) resets the
          TTL timer every time a new event arrives. As long as heartbeats keep
          arriving, the entry stays. One missed heartbeat past the TTL window
          removes it automatically.
        </p>
      </div>

      {/* ------------------------------------------------------------------
          3. Cursor sharing
      ------------------------------------------------------------------ */}
      <h2 id="cursor-sharing">3. Cursor sharing</h2>
      <p>
        Cursor positions change tens of times per second. Use{' '}
        <code>usePresence</code> with <code>updatePresence</code> to broadcast
        delta updates. Throttle the updates on the client to avoid flooding the
        server.
      </p>

      <CursorSharingDemo />

      <h3 id="cursor-channel">Define a presence channel</h3>
      <CodeBlock
        title="features/cursors/channel.ts"
        code={`import { createPresenceChannel } from '@tanstack/realtime'

export interface CursorPresenceData {
  name: string
  color: string
  cursor: { x: number; y: number } | null
}

export const cursorPresence = createPresenceChannel({
  id: 'cursor-presence',
  channel: (params: { documentId: string }) =>
    ['cursors', { documentId: params.documentId }],
})`}
      />

      <h3 id="cursor-component">Cursor-aware component</h3>
      <CodeBlock
        title="features/cursors/CollaborativeCanvas.tsx"
        code={`import { usePresence } from '@tanstack/react-realtime'
import { throttle } from '@tanstack/realtime'
import { useMemo } from 'react'
import { cursorPresence, type CursorPresenceData } from './channel'

function CollaborativeCanvas({ documentId }: { documentId: string }) {
  const { others, updatePresence } = usePresence<CursorPresenceData>(
    cursorPresence,
    {
      params: { documentId },
      initial: {
        name: currentUser.name,
        color: currentUser.color,
        cursor: null,
      },
    },
  )

  // Throttle cursor broadcasts to max 30 updates/s.
  const onMouseMove = useMemo(
    () =>
      throttle(
        (e: React.MouseEvent<HTMLDivElement>) => {
          const rect = e.currentTarget.getBoundingClientRect()
          updatePresence({
            cursor: { x: e.clientX - rect.left, y: e.clientY - rect.top },
          })
        },
        { interval: 33 },
      ),
    [updatePresence],
  )

  return (
    <div
      style={{ position: 'relative', width: '100%', height: 400 }}
      onMouseMove={onMouseMove}
      onMouseLeave={() => updatePresence({ cursor: null })}
    >
      {/* Peer cursors */}
      {others
        .filter((u) => u.data.cursor !== null)
        .map((u) => (
          <div
            key={u.connectionId}
            style={{
              position: 'absolute',
              left: u.data.cursor!.x,
              top: u.data.cursor!.y,
              color: u.data.color,
              pointerEvents: 'none',
            }}
          >
            <CursorIcon />
            <span style={{ background: u.data.color }}>{u.data.name}</span>
          </div>
        ))}
    </div>
  )
}`}
      />

      <div className="doc-callout">
        <p>
          <code>usePresence</code> automatically leaves the channel on unmount,
          so peer cursors disappear when a user closes the tab. The{' '}
          <code>others</code> array only contains <em>other</em> connected users
          — the current user is always excluded. Call{' '}
          <code>updatePresence({'{ cursor: null }'})</code> on{' '}
          <code>onMouseLeave</code> to hide the cursor while the pointer is
          outside the canvas.
        </p>
      </div>

      <h3 id="presence-vs-ephemeral">
        Presence vs. ephemeralLiveOptions for cursors
      </h3>
      <div className="doc-grid">
        <div className="doc-grid-card">
          <h3>usePresence</h3>
          <p>
            Server tracks connected users. Join/leave are automatic on
            mount/unmount. Best when you need to know <em>who</em> is connected,
            not just what they last sent.
          </p>
        </div>
        <div className="doc-grid-card">
          <h3>ephemeralLiveOptions</h3>
          <p>
            Client-side TTL map, no server-side presence state. Best for
            channels that don't support the full presence protocol, or when you
            want explicit TTL control without relying on disconnect events.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          4. Combining ephemeral + persistent
      ------------------------------------------------------------------ */}
      <h2 id="combining">4. Combining ephemeral + persistent</h2>
      <p>
        Ephemeral data drives the <em>animation</em>; persistent data keeps the{' '}
        <em>total</em>. This pattern lets every client see flying emojis for 2
        seconds while the cumulative reaction count is durable across page
        reloads.
      </p>

      <CodeBlock
        title="features/reactions/combined.ts"
        code={`// ── Persistent side ──────────────────────────────────────────────────────
// A PN-Counter CRDT that survives reconnects and page reloads.
// Concurrent increments from multiple users never get lost.
import { defineSyncedCounter } from '@tanstack/realtime'

export const reactionCounter = defineSyncedCounter({
  id: 'reaction-count',
  channel: ({ postId }: { postId: string }) => ['reaction-counts', { postId }],
})

// ── Ephemeral side ───────────────────────────────────────────────────────
// Short-lived reaction events for the flying-emoji animation.
import { createCollection } from '@tanstack/db'
import { ephemeralLiveOptions } from '@tanstack/realtime'
import { realtimeClient } from '../client'

interface EphemeralReaction {
  id: string
  emoji: string
  userId: string
}

export const ephemeralReactions = createCollection(
  ephemeralLiveOptions<EphemeralReaction>({
    client: realtimeClient,
    channel: ['reactions', { postId: 'placeholder' }],
    id: 'ephemeral-reactions',
    getKey: (r) => r.id,
    onEvent: (raw) => {
      const e = raw as { type: string; id: string; emoji: string; userId: string }
      if (e.type !== 'reaction') return null
      return { id: e.id, emoji: e.emoji, userId: e.userId }
    },
    ttl: 2000,
  }),
)`}
      />

      <CodeBlock
        title="features/reactions/PostReactions.tsx"
        code={`import { useLiveQuery } from '@tanstack/react-db'
import { usePublish } from '@tanstack/react-realtime'
import { useSyncedCounter } from '@tanstack/react-realtime'
import { reactionCounter, ephemeralReactions } from './combined'

function PostReactions({ postId }: { postId: string }) {
  // Persistent total — survives page reload, concurrent-safe.
  const { value: totalCount, increment } = useSyncedCounter(reactionCounter, {
    params: { postId },
    initial: 0,
  })

  // Ephemeral animation data — auto-expires after 2 s.
  const { data: animating } = useLiveQuery((q) =>
    q.from({ r: ephemeralReactions }).select(),
  )

  const publish = usePublish(['reactions', { postId }])

  const react = (emoji: string) => {
    // 1. Publish ephemeral event → all clients see the animation.
    void publish({
      type: 'reaction',
      id: crypto.randomUUID(),
      emoji,
      userId: currentUser.id,
    })
    // 2. Increment the persistent counter → durable total.
    increment()
  }

  return (
    <div>
      {/* Floating animations driven by the ephemeral collection */}
      {animating.map((r) => (
        <FloatingEmoji key={r.id} emoji={r.emoji} />
      ))}

      <button onClick={() => react('👍')}>
        👍 {totalCount}
      </button>
    </div>
  )
}`}
      />

      <div className="doc-callout">
        <p>
          <strong>Two channels, two jobs.</strong> The <code>reactions</code>{' '}
          channel carries ephemeral events; the <code>reaction-counts</code>{' '}
          channel carries CRDT state. Publishing to both is fine — they're
          independent subscriptions and the server can handle them on different
          routes. The ephemeral collection empties itself after 2 seconds while
          the counter value accumulates indefinitely.
        </p>
      </div>

      {/* ------------------------------------------------------------------
          5. Confetti / celebration animation
      ------------------------------------------------------------------ */}
      <h2 id="confetti">5. Confetti / celebration animation</h2>
      <p>
        Fire a full-screen confetti burst when a milestone is reached. The event
        is ephemeral &mdash; every connected client sees the animation, but
        nothing is stored. Use <code>useSubscribe</code> with a callback that
        triggers the confetti library.
      </p>

      <h3 id="confetti-client">Client &mdash; celebration event listener</h3>
      <CodeBlock
        title="features/celebrations/CelebrationOverlay.tsx"
        code={`import { useSubscribe } from '@tanstack/react-realtime'
import confetti from 'canvas-confetti'

function CelebrationOverlay({ projectId }: { projectId: string }) {
  useSubscribe(['celebrations', { projectId }], (event) => {
    const e = event as { type: string; message: string }
    if (e.type === 'confetti') {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } })
    }
  })

  return null // overlay is purely side-effect-based
}`}
      />

      <h3 id="confetti-server">
        Server &mdash; trigger confetti when a goal is reached
      </h3>
      <CodeBlock
        title="server/routes/goals.ts"
        code={`// Server — trigger confetti when a goal is reached
import { serializeKey } from '@tanstack/realtime'
import { sseHandler } from './realtime.server'

export async function completeGoal(goalId: string, projectId: string) {
  await db.goals.update({ where: { id: goalId }, data: { completed: true } })

  // Ephemeral celebration event — no storage needed
  sseHandler.broadcast(
    serializeKey(['celebrations', { projectId }]),
    { type: 'confetti', message: \`Goal "\${goalId}" completed!\` },
  )
}`}
      />

      <div className="doc-callout">
        <p>
          <strong>Side-effect-only components.</strong> The{' '}
          <code>CelebrationOverlay</code> renders <code>null</code> &mdash; it
          exists purely to subscribe and trigger the confetti side effect. Mount
          it once inside your <code>RealtimeProvider</code> and every page in
          the app will receive celebration events without extra wiring.
        </p>
      </div>

      {/* ------------------------------------------------------------------
          6. Toast notifications from server events
      ------------------------------------------------------------------ */}
      <h2 id="toast-notifications">
        6. Toast notifications from server events
      </h2>
      <p>
        Display system-wide alerts, deployment notifications, or admin messages
        as toast popups. Subscribe to a notifications channel and pipe each
        event into your toast library. The events are fire-and-forget &mdash;
        clients that are offline when the toast fires simply never see it.
      </p>

      <h3 id="toast-client">Client &mdash; notification listener</h3>
      <CodeBlock
        title="features/notifications/NotificationListener.tsx"
        code={`import { useSubscribe } from '@tanstack/react-realtime'
import { toast } from 'your-toast-library'  // sonner, react-hot-toast, etc.

function NotificationListener() {
  useSubscribe(['notifications', { scope: 'global' }], (event) => {
    const e = event as {
      type: 'info' | 'warning' | 'success' | 'error'
      title: string
      body?: string
    }
    toast[e.type](e.title, { description: e.body })
  })

  return null
}

// Mount once at the app root, inside <RealtimeProvider>
function App() {
  return (
    <RealtimeProvider client={realtimeClient}>
      <NotificationListener />
      <Router />
    </RealtimeProvider>
  )
}`}
      />

      <h3 id="toast-server">Server &mdash; broadcast a notification</h3>
      <CodeBlock
        title="server/routes/notifications.ts"
        code={`// Server — broadcast a toast notification to all connected clients
import { serializeKey } from '@tanstack/realtime'
import { sseHandler } from './realtime.server'

export async function broadcastNotification(notification: {
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  body?: string
}) {
  sseHandler.broadcast(
    serializeKey(['notifications', { scope: 'global' }]),
    notification,
  )
}

// Usage: deploy hook, admin action, cron job, etc.
await broadcastNotification({
  type: 'success',
  title: 'Deployment complete',
  body: 'v2.4.1 is now live across all regions.',
})`}
      />

      <div className="doc-callout">
        <p>
          <strong>Any toast library works.</strong> The{' '}
          <code>NotificationListener</code> component is agnostic &mdash; swap{' '}
          <code>{'your-toast-library'}</code> for <code>sonner</code>,{' '}
          <code>react-hot-toast</code>, or any library that exposes{' '}
          <code>toast.info()</code> / <code>toast.error()</code> style APIs.
          Because the listener returns <code>null</code>, it adds zero DOM
          nodes.
        </p>
      </div>

      {/* ------------------------------------------------------------------
          Quick reference
      ------------------------------------------------------------------ */}
      <h2 id="quick-reference">Quick reference</h2>
      <div className="doc-grid">
        <div className="doc-grid-card">
          <h3>ephemeralLiveOptions</h3>
          <p>
            TanStack DB collection backed by a TTL map. Rows auto-expire after{' '}
            <code>ttl</code> ms of silence. Best for typing indicators,
            animation payloads, and "who is editing this cell" badges.
          </p>
        </div>
        <div className="doc-grid-card">
          <h3>usePublish</h3>
          <p>
            Stable publish function for one-way fire-and-forget messages.
            Returns a <code>Promise&lt;void&gt;</code> you can await for
            backpressure. Use for sending reactions, heartbeats, and cursor
            deltas.
          </p>
        </div>
        <div className="doc-grid-card">
          <h3>usePresence</h3>
          <p>
            Joins a presence channel on mount and leaves on unmount.{' '}
            <code>others</code> is reactive. <code>updatePresence(delta)</code>{' '}
            merges partial data — a cursor update doesn't overwrite the user's
            name.
          </p>
        </div>
        <div className="doc-grid-card">
          <h3>useSubscribe</h3>
          <p>
            Raw channel listener &mdash; runs a callback on every event. Returns{' '}
            <code>{'{ subscribeError }'}</code> for error handling. Use for
            confetti, toasts, sound effects, and analytics pings.
          </p>
        </div>
        <div className="doc-grid-card">
          <h3>useSyncedCounter</h3>
          <p>
            PN-Counter CRDT hook. Concurrent <code>increment()</code> calls from
            multiple clients always add up — no increments are ever lost. Pair
            with ephemeral data when you need durable totals.
          </p>
        </div>
      </div>

      <h2 id="choosing">Choosing the right primitive</h2>
      <CodeBlock
        code={`// Short-lived animation payload (flying emoji, typing indicator)
ephemeralLiveOptions({ ttl: 2000, ... })

// Heartbeat / "user is viewing" badge
ephemeralLiveOptions({ ttl: 5000, ... })   // TTL > heartbeat interval
setInterval(() => publish({ type: 'viewing', ... }), 3000)

// Real-time cursor sharing
usePresence(channelDef, { initial: { cursor: null }, ... })
updatePresence({ cursor: { x, y } })       // partial merge, not replace

// Durable reaction count + ephemeral animation
useSyncedCounter(counterDef, { params })   // persistent total
usePublish(channel)                         // ephemeral animation trigger

// Side-effect on channel event (confetti, toast, sound)
useSubscribe(channel, (event) => { /* fire and forget */ })`}
      />
    </article>
  )
}
