import { useEffect, useRef, useState } from 'react'
import { CodeBlock } from '../../components/CodeBlock'

// ---------------------------------------------------------------------------
// Interactive presence demo
// ---------------------------------------------------------------------------

interface FakeUser {
  id: string
  name: string
  color: string
  cursor: { x: number; y: number } | null
}

const COLORS = ['#38bdf8', '#c084fc', '#f472b6', '#22c55e']
const NAMES = ['Alice', 'Bob', 'Charlie', 'Dana']

function PresenceDemo() {
  const areaRef = useRef<HTMLDivElement>(null)
  const [users, setUsers] = useState<Array<FakeUser>>([
    { id: '1', name: 'Alice', color: COLORS[0], cursor: null },
    { id: '2', name: 'Bob', color: COLORS[1], cursor: { x: 120, y: 80 } },
  ])
  const [joined, setJoined] = useState<Array<string>>(['1', '2'])

  // Move Bob's cursor randomly
  useEffect(() => {
    const interval = setInterval(() => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== '2' || !joined.includes('2')) return u
          const area = areaRef.current
          if (!area) return u
          const w = area.offsetWidth - 10
          const h = area.offsetHeight - 10
          const cx = u.cursor?.x ?? w / 2
          const cy = u.cursor?.y ?? h / 2
          return {
            ...u,
            cursor: {
              x: Math.max(10, Math.min(w, cx + (Math.random() - 0.5) * 40)),
              y: Math.max(10, Math.min(h, cy + (Math.random() - 0.5) * 40)),
            },
          }
        }),
      )
    }, 600)
    return () => clearInterval(interval)
  }, [joined])

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setUsers((prev) =>
      prev.map((u) => (u.id === '1' ? { ...u, cursor: { x, y } } : u)),
    )
  }

  const toggleUser = (name: string) => {
    const idx = NAMES.indexOf(name)
    const id = String(idx + 1)
    if (joined.includes(id)) {
      setJoined((j) => j.filter((x) => x !== id))
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } else {
      setJoined((j) => [...j, id])
      setUsers((prev) => [
        ...prev,
        { id, name, color: COLORS[idx], cursor: null },
      ])
    }
  }

  return (
    <div className="demo-box">
      <h3>Live presence</h3>
      <p className="demo-desc">
        Move your mouse over the canvas to control Alice's cursor. Bob wanders
        on his own. Toggle users to simulate join/leave.
      </p>
      <div className="demo-presence-controls">
        {NAMES.map((name, i) => (
          <button
            key={name}
            className={`demo-btn demo-btn-sm ${joined.includes(String(i + 1)) ? 'demo-btn-active' : ''}`}
            style={
              joined.includes(String(i + 1))
                ? { borderColor: COLORS[i], color: COLORS[i] }
                : {}
            }
            onClick={() => toggleUser(name)}
          >
            {name} {joined.includes(String(i + 1)) ? '(online)' : '(offline)'}
          </button>
        ))}
      </div>
      <div
        ref={areaRef}
        className="demo-presence-area"
        onMouseMove={onMouseMove}
      >
        <div className="demo-presence-label">
          {users.length} user{users.length !== 1 ? 's' : ''} connected
        </div>
        {users.map((u) =>
          u.cursor ? (
            <div
              key={u.id}
              className="demo-cursor"
              style={{
                left: u.cursor.x,
                top: u.cursor.y,
                color: u.color,
              }}
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
      <div className="demo-presence-avatars">
        {users.map((u) => (
          <span
            key={u.id}
            className="demo-avatar"
            style={{ background: u.color }}
          >
            {u.name[0]}
          </span>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Presence() {
  return (
    <article className="doc-article">
      <h1>Presence</h1>
      <p className="doc-lead">
        Track who's connected and what they're doing. <code>usePresence</code>{' '}
        joins on mount, leaves on unmount, and returns a reactive list of every
        other connected user.
      </p>

      <h2 id="try-it">Try it</h2>
      <PresenceDemo />

      <h2 id="define-channel">Define a presence channel</h2>
      <CodeBlock
        title="presence/channel.ts"
        code={`import { createPresenceChannel } from '@realtimejs/core'

export const docPresence = createPresenceChannel({
  id: 'doc-presence',
  channel: (params: { docId: string }) => ['doc:presence', params],
})`}
      />

      <h2 id="use-presence">Use in a component</h2>
      <CodeBlock
        title="presence/DocumentPage.tsx"
        code={`import { usePresence } from '@realtimejs/react'
import { docPresence } from './channel'

function DocumentPage({ docId }: { docId: string }) {
  const { others, updatePresence } = usePresence(docPresence, {
    params: { docId },
    initial: { name: user.name, color: user.color, cursor: null },
  })

  return (
    <div
      onMouseMove={(e) =>
        updatePresence({ cursor: { x: e.clientX, y: e.clientY } })
      }
    >
      {/* Who's here */}
      <div className="avatar-row">
        {others.map((u) => (
          <Avatar key={u.connectionId} name={u.data.name} color={u.data.color} />
        ))}
      </div>

      {/* Where they are */}
      {others
        .filter((u) => u.data.cursor)
        .map((u) => (
          <RemoteCursor
            key={u.connectionId}
            x={u.data.cursor.x}
            y={u.data.cursor.y}
            name={u.data.name}
            color={u.data.color}
          />
        ))}
    </div>
  )
}`}
      />

      <h2 id="how-it-works">How it works</h2>
      <div className="doc-callout">
        <p>
          <code>usePresence</code> subscribes to the channel, calls{' '}
          <code>client.joinPresence(channel, initial)</code> on mount, and calls{' '}
          <code>client.leavePresence(channel)</code> on unmount. The{' '}
          <code>others</code> array is reactive &mdash; it updates when any peer
          joins, updates their data, or disconnects. The current user is always
          excluded. <code>updatePresence(delta)</code> merges partial data, so a
          cursor update doesn't overwrite the user's name.
        </p>
      </div>

      <h2 id="contextual-presence">Contextual presence</h2>
      <p>
        Scope presence to a specific entity &mdash; a spreadsheet cell, a
        document paragraph, or a kanban card &mdash; so users see{' '}
        <em>who is editing what</em>, not just who is online.
      </p>
      <CodeBlock
        title="features/spreadsheet/CellPresence.tsx"
        code={`import { usePresence } from '@realtimejs/react'
import { createPresenceChannel } from '@realtimejs/core'
import { useState } from 'react'

// One presence channel per cell -- join when focused, leave on blur.
const cellPresence = createPresenceChannel({
  id: 'cell-presence',
  channel: (params: { sheetId: string; cellId: string }) =>
    ['sheet:cell', params],
})

// Inner component -- always calls usePresence (Rules of Hooks safe).
function CellEditor({ sheetId, cellId, onBlur }: {
  sheetId: string
  cellId: string
  onBlur: () => void
}) {
  const { others } = usePresence(cellPresence, {
    params: { sheetId, cellId },
    initial: { name: currentUser.name, color: currentUser.color },
  })

  return (
    <>
      {others.map((u) => (
        <span key={u.connectionId} className="cell-editor-badge"
              style={{ background: u.data.color }}>
          {u.data.name}
        </span>
      ))}
    </>
  )
}

function Cell({ sheetId, cellId }: { sheetId: string; cellId: string }) {
  const [focused, setFocused] = useState(false)

  return (
    <td
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {/* Mount CellEditor only when focused -- usePresence joins/leaves cleanly */}
      {focused && <CellEditor sheetId={sheetId} cellId={cellId} onBlur={() => setFocused(false)} />}
    </td>
  )
}`}
      />
      <div className="doc-callout">
        <p>
          Keep contextual presence channels short-lived. Join when the user
          focuses the entity, leave on blur. This avoids accumulating hundreds
          of idle presence subscriptions across a large document.
        </p>
      </div>

      <h2 id="throttling">Throttling high-frequency updates</h2>
      <p>
        Cursor positions change dozens of times per second. Without throttling,
        each <code>mousemove</code> triggers a publish &mdash; flooding the
        server and peers. Use the built-in <code>throttle</code> utility to cap
        the update rate.
      </p>
      <CodeBlock
        title="features/Canvas.tsx"
        code={`import { throttle } from '@realtimejs/core'
import { usePresence } from '@realtimejs/react'
import { useMemo, useCallback } from 'react'

function Canvas({ docId }: { docId: string }) {
  const { updatePresence } = usePresence(docPresence, {
    params: { docId },
    initial: { name: user.name, cursor: null },
  })

  // Cap updates to ~30 per second (33 ms interval).
  const throttledUpdate = useMemo(
    () =>
      throttle(
        (cursor: { x: number; y: number }) => {
          updatePresence({ cursor })
        },
        { interval: 33 },
      ),
    [updatePresence],
  )

  // Read currentTarget eagerly -- before the throttled callback fires.
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect()
      throttledUpdate({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    },
    [throttledUpdate],
  )

  return <div onMouseMove={onMouseMove} onMouseLeave={() => updatePresence({ cursor: null })} />
}`}
      />
      <div className="doc-callout">
        <p>
          <strong>Rule of thumb:</strong> 30&ndash;60 updates/second is enough
          for smooth cursors. For slower-moving data like scroll position,
          5&ndash;10 updates/second is sufficient. The <code>throttle</code>{' '}
          utility uses a trailing-edge strategy, so the final position is always
          sent.
        </p>
      </div>

      <h2 id="see-also">See also</h2>
      <ul>
        <li>
          <a href="#/docs/ephemeral">Ephemeral Channels</a> &mdash; cursor
          sharing recipe using ephemeral events instead of presence
        </li>
        <li>
          <a href="#/docs/channels">Channels &amp; Pub/Sub</a> &mdash; raw
          subscribe/publish for one-way cursor broadcasts
        </li>
      </ul>
    </article>
  )
}
