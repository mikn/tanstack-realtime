import { CodeBlock } from '../../components/CodeBlock'

export function Examples() {
  return (
    <article className="doc-article">
      <h1>Examples</h1>
      <p className="doc-lead">
        Three runnable example apps live in the{' '}
        <a
          href="https://github.com/mikn/tanstack-realtime/tree/main/examples"
          target="_blank"
          rel="noopener"
        >
          <code>examples/</code>
        </a>{' '}
        directory of the repo. Each is a self-contained Vite + React app talking
        to an in-memory SSE server mounted as Vite dev middleware &mdash; no
        database, no ORM, no external platform (the &ldquo;bring your own
        backend&rdquo; showcase). The snippets below are simplified extracts;
        follow each card to the full source.
      </p>

      <div className="examples-grid">
        <div className="example-card">
          <h3>
            <a
              href="https://github.com/mikn/tanstack-realtime/tree/main/examples/collaborative-todos"
              target="_blank"
              rel="noopener"
            >
              Collaborative Todos
            </a>
          </h3>
          <p>
            A multi-tab todo list demonstrating optimistic updates and CRDT
            convergence. Uses <code>useRealtimeCollection</code> (REST
            shorthand) with field-level CRDTs (<code>lww</code> title/completed,{' '}
            <code>pn-counter</code> votes) so concurrent edits merge without a
            server-side merge step.
          </p>
          <div className="example-card-tags">
            <span className="example-card-tag">useRealtimeCollection</span>
            <span className="example-card-tag">CRDTs</span>
            <span className="example-card-tag">SSE</span>
          </div>
        </div>

        <div className="example-card">
          <h3>
            <a
              href="https://github.com/mikn/tanstack-realtime/tree/main/examples/chat"
              target="_blank"
              rel="noopener"
            >
              Chat
            </a>
          </h3>
          <p>
            A real-time chat room with an append-only message log, presence
            (&ldquo;who&rsquo;s online&rdquo;), and typing indicators. Uses{' '}
            <code>useLiveChannel</code> + <code>useLiveQuery</code> for
            messages, <code>createPresenceChannel</code> +{' '}
            <code>usePresence</code> for presence (layered onto the SSE
            transport via a small <code>withPresence</code> wrapper), and{' '}
            <code>useTypingIndicator</code>.
          </p>
          <div className="example-card-tags">
            <span className="example-card-tag">useLiveChannel</span>
            <span className="example-card-tag">Presence</span>
            <span className="example-card-tag">useTypingIndicator</span>
          </div>
        </div>

        <div className="example-card">
          <h3>
            <a
              href="https://github.com/mikn/tanstack-realtime/tree/main/examples/ai-streaming"
              target="_blank"
              rel="noopener"
            >
              AI Streaming
            </a>
          </h3>
          <p>
            Streams mock LLM tokens from the server to the browser and renders{' '}
            <code>pending → streaming → done</code> states. Uses{' '}
            <code>createStreamChannel</code> for the typed stream definition,{' '}
            <code>handler.createStream</code> on the server, and{' '}
            <code>useStream</code> on the client, with <code>STREAM_DONE</code>/
            <code>STREAM_ERROR</code> sentinels.
          </p>
          <div className="example-card-tags">
            <span className="example-card-tag">createStreamChannel</span>
            <span className="example-card-tag">useStream</span>
            <span className="example-card-tag">Server Stream</span>
          </div>
        </div>
      </div>

      <h2 id="todo-example">Collaborative Todos</h2>
      <p>
        A shared todo list backed by a REST endpoint with realtime sync. The
        mutating client publishes a CRDT-tagged message back over the{' '}
        <code>todos</code> channel so peers converge on field-level merges.{' '}
        <a
          href="https://github.com/mikn/tanstack-realtime/tree/main/examples/collaborative-todos"
          target="_blank"
          rel="noopener"
        >
          Full source →
        </a>
      </p>

      <h3>Server</h3>
      <CodeBlock
        title="src/realtime.ts"
        code={`import { createSseHandler } from '@realtimejs/adapter-sse'

// In-memory SSE handler — the "database" is a plain Map in src/server.ts.
export const handler = createSseHandler({
  authorize: () => ({ subscribe: true, publish: true }),
})`}
      />

      <h3>React component</h3>
      <p>
        <code>useRealtimeCollection</code> with the <code>url</code> REST
        shorthand auto-derives the channel and CRUD callbacks.{' '}
        <code>fields</code> declares per-field CRDT merge: <code>text</code> is
        last-write-wins, <code>votes</code> is a PN-counter. Query the stable
        collection with <code>useLiveQuery</code>.
      </p>
      <CodeBlock
        title="src/App.tsx"
        code={`import { useRealtimeCollection } from '@realtimejs/react'
import { useLiveQuery } from '@tanstack/react-db'

interface Todo { id: string; text: string; votes: number; done: boolean }

export function TodoList() {
  const todos = useRealtimeCollection<Todo>({
    url: '/api/todos',
    getKey: (t) => t.id,
    fields: { text: 'lww', votes: 'pn-counter' },
    optimistic: true,  // echo suppression for the client-authoritative CRDT path
  })

  const { data } = useLiveQuery((q) =>
    q.from({ todos }).orderBy(({ todos: t }) => t.id, 'asc'),
  )

  const addTodo = () =>
    todos.insert({ id: crypto.randomUUID(), text: 'New todo', votes: 0, done: false })

  return (
    <div>
      <button onClick={addTodo}>Add Todo</button>
      <ul>
        {data.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => todos.update(todo.id, (draft) => { draft.done = !draft.done })}
            />
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  )
}`}
      />

      <h2 id="chat-example">Chat</h2>
      <p>
        Append-only message log with live presence and typing indicators. Define
        the presence channel once with <code>createPresenceChannel</code>, then
        join it with <code>usePresence</code> (peers are in <code>others</code>,
        keyed by <code>connectionId</code>).{' '}
        <a
          href="https://github.com/mikn/tanstack-realtime/tree/main/examples/chat"
          target="_blank"
          rel="noopener"
        >
          Full source →
        </a>
      </p>

      <CodeBlock
        title="src/App.tsx"
        code={`import {
  createPresenceChannel,
  useLiveChannel,
  usePresence,
  useTypingIndicator,
} from '@realtimejs/react'
import { useLiveQuery } from '@tanstack/react-db'

const roomPresence = createPresenceChannel({
  id: 'chat-room-presence',
  channel: (p: { room: string }) => ['chat-presence', { room: p.room }],
})

export function ChatRoom({ room, userName }: { room: string; userName: string }) {
  // Append-only message collection seeded from REST, fed by 'message' events.
  const messages = useLiveChannel<ChatMessage>({
    id: \`chat-\${room}\`,
    channel: 'chat',
    getKey: (m) => m.id,
    initialData: () => fetch('/api/messages').then((r) => r.json()),
    onEvent: (raw) => {
      const e = raw as { type: string; data: ChatMessage }
      return e.type === 'message' ? e.data : null
    },
  })
  const { data } = useLiveQuery((q) =>
    q.from({ messages }).orderBy(({ messages: m }) => m.timestamp, 'asc'),
  )

  // Presence — 'others' excludes you and is keyed by connectionId.
  const { others, updatePresence } = usePresence<{ name: string }, { room: string }>(
    roomPresence,
    { params: { room }, initial: { name: userName } },
  )

  const { typingUsers, startTyping } = useTypingIndicator(['typing', { room }], {
    selfId: userName,
  })

  return (
    <div>
      <div className="online">
        Online: {others.map((u) => u.data.name).join(', ') || 'just you'}
      </div>
      <div className="messages">
        {data.map((m) => (
          <div key={m.id}>
            <strong>{m.author}:</strong> {m.text}
          </div>
        ))}
      </div>
      {typingUsers.length > 0 && <p>{typingUsers.join(', ')} typing…</p>}
    </div>
  )
}`}
      />

      <h2 id="stream-example">AI Streaming</h2>
      <p>
        Define a typed stream with <code>createStreamChannel</code>, push tokens
        server-side via <code>handler.createStream</code>, and fold them into
        reactive state on the client with <code>useStream</code>.{' '}
        <a
          href="https://github.com/mikn/tanstack-realtime/tree/main/examples/ai-streaming"
          target="_blank"
          rel="noopener"
        >
          Full source →
        </a>
      </p>

      <CodeBlock
        title="src/streamDef.ts"
        code={`import { STREAM_DONE, STREAM_ERROR, createStreamChannel } from '@realtimejs/core'

interface StreamState {
  content: string
}
type StreamEvent =
  | { type: 'token'; content: string }
  | { type: typeof STREAM_DONE }
  | { type: typeof STREAM_ERROR; message?: string }

export const aiStream = createStreamChannel<StreamState, StreamEvent, { sessionId: string }>({
  id: 'ai-message-stream',
  channel: (p) => ['ai', { sessionId: p.sessionId }],
  initial: { content: '' },
  reduce: (state, event) =>
    event.type === 'token' ? { content: state.content + event.content } : state,
  isDone: (_state, event) => event.type === STREAM_DONE,
  isError: (_state, event) =>
    event.type === STREAM_ERROR ? (event.message ?? 'Stream error') : false,
  staleAfter: 15_000,
})`}
      />

      <CodeBlock
        title="src/server.ts"
        code={`import { createSseHandler } from '@realtimejs/adapter-sse'

const sse = createSseHandler({ pingInterval: 0 })

export async function runMockStream(sessionId: string) {
  const stream = sse.createStream<{ type: 'token'; content: string }>({
    channel: ['ai', { sessionId }],
  })

  const words = 'The answer to your question is quite interesting.'.split(' ')
  for (const word of words) {
    await stream.push({ type: 'token', content: word + ' ' })
    await new Promise((r) => setTimeout(r, 100))
  }
  await stream.done()  // pushes the STREAM_DONE sentinel
}`}
      />

      <CodeBlock
        title="src/App.tsx"
        code={`import { useStream } from '@realtimejs/react'
import { aiStream } from './streamDef'

export function AIChat({ sessionId }: { sessionId: string }) {
  const { state, status, error } = useStream(aiStream, { params: { sessionId } })

  if (status === 'pending') return <span>Thinking…</span>
  if (status === 'error')   return <span>Error: {error}</span>

  return (
    <div>
      <p>{state.content}</p>
      {status === 'streaming' && <span className="cursor">|</span>}
      {status === 'done' && <em>Complete</em>}
    </div>
  )
}`}
      />

      <div className="doc-callout">
        <p>
          These snippets are simplified extracts. For the full runnable apps
          &mdash; server middleware, auth stub, and build config &mdash; see the{' '}
          <a
            href="https://github.com/mikn/tanstack-realtime/tree/main/examples"
            target="_blank"
            rel="noopener"
          >
            <code>examples/</code> directory
          </a>{' '}
          in the GitHub repository.
        </p>
      </div>
    </article>
  )
}
