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

  // Subscribe-ordering race (intentional, documented limitation):
  //
  // `useStream` subscribes to the channel on mount, but the SSE subscribe is a
  // separate client→server round-trip. If we POST /api/generate immediately,
  // the server can start pushing tokens BEFORE this client is registered as a
  // subscriber — and this mock server stream has no replay/buffer, so those
  // early tokens are dropped and the UI shows a truncated response.
  //
  // The clean fix is to gate generation on the subscription actually being
  // live, but the current client API does not surface a subscribe-confirmation:
  // `client.subscribe` returns synchronously (an unsub fn, not a promise) and
  // `useStream`'s `status` starts at `'pending'` on mount regardless of whether
  // the server has registered us yet — so there is no "subscribed" signal to
  // await here. As a teaching example we therefore use a small fixed delay to
  // let the subscribe round-trip land first.
  //
  // Production code should NOT rely on a timing guess. Instead, buffer/replay
  // the stream server-side (so tokens emitted before a subscriber attaches are
  // still delivered), or have the server emit tokens only after it observes the
  // subscription (e.g. via an `onChannelSubscribe` hook). See the README.
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
