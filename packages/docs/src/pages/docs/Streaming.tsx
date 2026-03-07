import { useEffect, useRef, useState } from 'react'
import { CodeBlock } from '../../components/CodeBlock'

// ---------------------------------------------------------------------------
// Interactive streaming demo
// ---------------------------------------------------------------------------

const SAMPLE_RESPONSE = `TanStack Realtime is a transport layer that adds live updates to your existing application. It plugs into whatever server and database you already have — no migration required. Start with a queryFn, add a channel to go live, and layer on CRDTs when you need conflict-free concurrent editing.`

function StreamDemo() {
  const [status, setStatus] = useState<
    'idle' | 'pending' | 'streaming' | 'done' | 'error'
  >('idle')
  const [tokens, setTokens] = useState('')
  const [error, setError] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const idxRef = useRef(0)

  const start = () => {
    setStatus('pending')
    setTokens('')
    setError('')
    idxRef.current = 0

    // Simulate server processing delay
    setTimeout(() => {
      setStatus('streaming')
      const words = SAMPLE_RESPONSE.split(' ')
      intervalRef.current = setInterval(() => {
        if (idxRef.current >= words.length) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setStatus('done')
          return
        }
        const word = words[idxRef.current]
        idxRef.current++
        setTokens((t) => (t ? t + ' ' + word : word))
      }, 60)
    }, 800)
  }

  const simulateError = () => {
    setStatus('pending')
    setTokens('')
    setError('')
    idxRef.current = 0

    setTimeout(() => {
      setStatus('streaming')
      const words = SAMPLE_RESPONSE.split(' ').slice(0, 8)
      intervalRef.current = setInterval(() => {
        if (idxRef.current >= words.length) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setStatus('error')
          setError('Connection lost: upstream timeout')
          return
        }
        const word = words[idxRef.current]
        idxRef.current++
        setTokens((t) => (t ? t + ' ' + word : word))
      }, 60)
    }, 800)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div className="demo-box">
      <h3>AI token streaming</h3>
      <p className="demo-desc">
        Simulates a server-initiated stream with status tracking:{' '}
        <code>pending</code> &rarr; <code>streaming</code> &rarr;{' '}
        <code>done</code> (or <code>error</code>). Each token event is folded
        into state via a <code>reduce</code> function.
      </p>
      <div className="demo-stream-output">
        {status === 'idle' && (
          <span className="demo-stream-placeholder">
            Click "Ask AI" to start a stream...
          </span>
        )}
        {status === 'pending' && (
          <span className="demo-stream-thinking">Thinking...</span>
        )}
        {(status === 'streaming' ||
          status === 'done' ||
          status === 'error') && (
          <span>
            {tokens}
            {status === 'streaming' && (
              <span className="demo-stream-cursor">|</span>
            )}
          </span>
        )}
        {status === 'error' && (
          <div className="demo-stream-error-msg">{error}</div>
        )}
      </div>
      <div className="demo-stream-status">
        Status:{' '}
        <span className={`demo-stream-badge demo-stream-${status}`}>
          {status}
        </span>
      </div>
      <div className="demo-actions">
        <button
          className="demo-btn demo-btn-primary"
          onClick={start}
          disabled={status === 'pending' || status === 'streaming'}
        >
          Ask AI
        </button>
        <button
          className="demo-btn demo-btn-red"
          onClick={simulateError}
          disabled={status === 'pending' || status === 'streaming'}
        >
          Simulate error
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Streaming() {
  return (
    <article className="doc-article">
      <h1>Streaming</h1>
      <p className="doc-lead">
        AI token streams, live metrics, and progress bars aren't collections of
        rows. They're a sequence of events folded into a single piece of state.{' '}
        <code>streamChannelOptions</code> with a <code>reduce</code> function
        handles this pattern.
      </p>

      <h2 id="try-it">Try it</h2>
      <StreamDemo />

      <h2 id="define-stream">Define a stream channel</h2>
      <CodeBlock
        title="features/ai/stream.ts"
        code={`import { createStreamChannel, serverStreamCallbacks } from '@tanstack/realtime'

export const aiResponseStream = createStreamChannel({
  id: 'ai-response',
  channel: (params: { requestId: string }) => ['ai', params],

  initial: { content: '' },

  reduce: (state, event: { type: string; token?: string }) =>
    event.type === 'token'
      ? { content: state.content + (event.token ?? '') }
      : state,

  ...serverStreamCallbacks,
})`}
      />

      <h2 id="consume-stream">Consume in React</h2>
      <CodeBlock
        title="features/ai/AIResponse.tsx"
        code={`import { useStream } from '@tanstack/react-realtime'
import { aiResponseStream } from './stream'

function AIResponse({ requestId }: { requestId: string }) {
  const { state, status, error } = useStream(aiResponseStream, {
    params: { requestId },
  })

  if (status === 'pending')  return <span>Thinking...</span>
  if (status === 'error')    return <span>Error: {error}</span>

  return (
    <p>
      {state.content}
      {status === 'streaming' && <span className="cursor">|</span>}
    </p>
  )
}`}
      />

      <h2 id="server-side">Server-side streaming</h2>
      <CodeBlock
        title="server/routes/chat.ts"
        code={`import { createServerStream } from '@tanstack/realtime'
import { sseHandler } from '../realtime'

app.post('/api/chat', async (req) => {
  const { requestId, prompt } = req.body

  const stream = createServerStream({
    publish: (ch, data) => { sseHandler.broadcast(ch as string, data); return Promise.resolve() },
    channel: ['ai', { requestId }],
    hmacKey: process.env.STREAM_HMAC_KEY,
    checkpoint: {
      channelDef: aiResponseStream,
      interval: { time: 10_000 },
      handler: async (cp) => {
        await db.aiResponses.upsert({
          id: requestId,
          content: cp.state.content,
        })
      },
    },
  })

  try {
    for await (const chunk of openai.stream(prompt)) {
      await stream.push({ type: 'token', token: chunk.text })
    }
    await stream.done()
  } catch (err) {
    await stream.error(String(err))
  }
})`}
      />

      <h2 id="stale-after">
        Stale detection with <code>staleAfter</code>
      </h2>
      <p>
        Long-running streams can silently stall &mdash; the producer crashes,
        the network drops, or an upstream service times out. The{' '}
        <code>staleAfter</code> option adds a silence timer: if no events
        (including heartbeats) arrive within the configured window, the stream
        status transitions to <code>&apos;stale&apos;</code>.
      </p>
      <CodeBlock
        title="features/ai/stream.ts"
        code={`import { createStreamChannel, serverStreamCallbacks } from '@tanstack/realtime'

export const aiResponseStream = createStreamChannel({
  id: 'ai-response',
  channel: (params: { requestId: string }) => ['ai', params],

  initial: { content: '' },

  reduce: (state, event: { type: string; token?: string }) =>
    event.type === 'token'
      ? { content: state.content + (event.token ?? '') }
      : state,

  ...serverStreamCallbacks,

  // If no event arrives for 15 seconds, mark the stream as stale.
  // Choose a value 2-3x the server's heartbeat interval.
  staleAfter: 15_000,
})`}
      />
      <p>
        In your component, check for the <code>&apos;stale&apos;</code> status
        alongside the other lifecycle states:
      </p>
      <CodeBlock
        title="features/ai/AIResponse.tsx"
        code={`import { useStream } from '@tanstack/react-realtime'
import { aiResponseStream } from './stream'

function AIResponse({ requestId }: { requestId: string }) {
  const { state, status, error } = useStream(aiResponseStream, {
    params: { requestId },
  })

  if (status === 'pending')   return <span>Thinking...</span>
  if (status === 'error')     return <span>Error: {error}</span>
  if (status === 'stale')     return <span>Stream may have disconnected...</span>

  return (
    <p>
      {state.content}
      {status === 'streaming' && <span className="cursor">|</span>}
    </p>
  )
}`}
      />
      <div className="doc-callout">
        <p>
          Stale is a <strong>soft failure</strong>. The stream is not stopped,
          just flagged. If a new event arrives while stale, status reverts to{' '}
          <code>&apos;streaming&apos;</code> automatically. You can also
          override <code>staleAfter</code> per-hook instance via the{' '}
          <code>useStream</code> options.
        </p>
      </div>

      <h2 id="other-uses">Beyond AI</h2>
      <p>
        <code>streamChannelOptions</code> works for any accumulated stream.
        Here's a live server metrics gauge:
      </p>
      <CodeBlock
        code={`const cpuStream = createStreamChannel({
  id: 'cpu-metrics',
  channel: (params: { serverId: string }) => ['metrics:cpu', params],

  initial: { pct: 0, samples: [] as number[] },

  reduce: (state, event: { pct: number }) => ({
    pct: event.pct,
    samples: [...state.samples.slice(-60), event.pct],
  }),
  // Open-ended — no isDone, stream runs until unmount
})`}
      />

      <h2 id="checkpoint-persistence">Server-side checkpoint persistence</h2>
      <p>
        For long-running streams (AI responses, ETL pipelines), persist
        checkpoints so clients can resume after a page reload or reconnection
        without replaying the entire stream from the beginning.
      </p>
      <CodeBlock
        title="server/routes/ai-stream.ts"
        code={`import { createServerStream } from '@tanstack/realtime'
import { sseHandler } from '../realtime'
import { db } from '../db'

const stream = createServerStream({
  publish: (ch, data) => { sseHandler.broadcast(ch as string, data); return Promise.resolve() },
  channel: ['ai', { requestId }],
  // Persist checkpoint to database after every N events
  checkpoint: {
    channelDef: aiResponseStream,
    interval: { events: 50 },
    handler: async (cp) => {
      await db.streamCheckpoints.upsert({
        where: { streamId: requestId },
        update: { checkpoint: JSON.stringify(cp), updatedAt: new Date() },
        create: { streamId: requestId, checkpoint: JSON.stringify(cp) },
      })
    },
  },
})`}
      />

      <div className="doc-callout">
        <p>
          <strong>Checkpoint granularity.</strong> Checkpointing every event
          adds database writes. For AI token streams, checkpoint every 50-100
          tokens or every 2-3 seconds. The <code>checkpoint.interval</code>{' '}
          option controls this: <code>{'interval: { events: 50 }'}</code>{' '}
          checkpoints every 50th event.
        </p>
      </div>
    </article>
  )
}
