/**
 * Mock AI token-streaming UI built on `useStream`.
 *
 * Clicking "Generate" assigns a fresh sessionId, which mounts a `useStream`
 * subscription on the `['ai', { sessionId }]` channel. We then POST to
 * `/api/generate`, and the server pushes mock tokens back over that channel.
 *
 * The UI reflects the stream lifecycle: pending → streaming → done (or error /
 * stale), driven entirely by `useStream`'s `status`.
 */
import { useEffect, useState } from 'react'
import { useStream } from '@realtimejs/react'
import { aiStream } from './streamDef.js'

function StreamView({ sessionId }: { sessionId: string }) {
  const { state, status, error } = useStream(aiStream, {
    params: { sessionId },
  })

  // Trigger generation once the subscription has had a moment to register on
  // the server (the SSE subscribe action is a separate round-trip).
  useEffect(() => {
    const t = setTimeout(() => {
      void fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
    }, 150)
    return () => clearTimeout(t)
  }, [sessionId])

  return (
    <div className="stream">
      <div className={`badge ${status}`}>{status}</div>
      {status === 'pending' && <p className="muted">Waiting for tokens…</p>}
      {status === 'error' && <p className="err">Error: {error}</p>}
      {status === 'stale' && (
        <p className="muted">Stream went quiet — may have disconnected.</p>
      )}
      <p className="content">
        {state.content}
        {status === 'streaming' && <span className="caret">▋</span>}
      </p>
    </div>
  )
}

export function App() {
  const [sessionId, setSessionId] = useState<string | null>(null)

  return (
    <>
      <h1>AI Streaming</h1>
      <p className="sub">
        A mock LLM streams tokens from the server over a single SSE connection.
        <code>useStream</code> folds them into reactive state.
      </p>
      <button onClick={() => setSessionId(crypto.randomUUID())}>
        {sessionId ? 'Regenerate' : 'Generate'}
      </button>
      {sessionId && <StreamView key={sessionId} sessionId={sessionId} />}
    </>
  )
}
