import { CodeBlock } from '../../components/CodeBlock'

export function Examples() {
  return (
    <article className="doc-article">
      <h1>Examples</h1>
      <p className="doc-lead">
        Runnable example apps showing realtime.js patterns end-to-end. Each
        example is self-contained with a server handler, client setup, and UI.
      </p>

      <div className="examples-grid">
        <div className="example-card">
          <h3>Collaborative Todo List</h3>
          <p>
            A multi-user todo list with real-time sync. Uses{' '}
            <code>realtimeCollectionOptions</code> with LWW fields so edits from
            any client merge automatically.
          </p>
          <div className="example-card-tags">
            <span className="example-card-tag">Collections</span>
            <span className="example-card-tag">CRDTs</span>
            <span className="example-card-tag">SSE</span>
          </div>
        </div>

        <div className="example-card">
          <h3>Chat Room</h3>
          <p>
            Multi-room chat with presence indicators. Uses{' '}
            <code>liveChannelOptions</code> for messages and{' '}
            <code>usePresence</code> to show who&rsquo;s online.
          </p>
          <div className="example-card-tags">
            <span className="example-card-tag">Pub/Sub</span>
            <span className="example-card-tag">Presence</span>
            <span className="example-card-tag">Live Channel</span>
          </div>
        </div>

        <div className="example-card">
          <h3>AI Streaming Chat</h3>
          <p>
            Server-side LLM streaming with <code>createServerStream</code> and
            client-side rendering via <code>useStream</code>. Includes
            resume-on-reconnect with HMAC checkpoints.
          </p>
          <div className="example-card-tags">
            <span className="example-card-tag">Streaming</span>
            <span className="example-card-tag">Server Stream</span>
            <span className="example-card-tag">HMAC</span>
          </div>
        </div>

        <div className="example-card">
          <h3>Cursor Sharing</h3>
          <p>
            Real-time cursor positions using presence. Each user&rsquo;s cursor
            animates smoothly on other screens using throttled presence updates.
          </p>
          <div className="example-card-tags">
            <span className="example-card-tag">Presence</span>
            <span className="example-card-tag">Throttle</span>
          </div>
        </div>

        <div className="example-card">
          <h3>Voting / Polls</h3>
          <p>
            Live poll with PN-Counter CRDTs. Multiple users can vote
            simultaneously and the counter converges without conflicts.
          </p>
          <div className="example-card-tags">
            <span className="example-card-tag">CRDTs</span>
            <span className="example-card-tag">PN-Counter</span>
            <span className="example-card-tag">useSyncedCounter</span>
          </div>
        </div>

        <div className="example-card">
          <h3>Game Lobby</h3>
          <p>
            High-frequency tick-based state sync for a simple multiplayer game.
            Uses <code>useTickBatching</code> with delta compression at 60 Hz.
          </p>
          <div className="example-card-tags">
            <span className="example-card-tag">Tick Sync</span>
            <span className="example-card-tag">Delta Compression</span>
            <span className="example-card-tag">Game</span>
          </div>
        </div>
      </div>

      <h2 id="todo-example">Collaborative Todo List</h2>
      <p>
        The simplest end-to-end example: a shared todo list backed by a REST API
        with realtime sync.
      </p>

      <h3>Server</h3>
      <CodeBlock
        title="app/server/realtime.ts"
        code={`import { createStartHandler } from '@realtimejs/preset-start'

export const realtime = createStartHandler({
  getUser: async (req) => {
    // Replace with your auth logic
    const userId = req.headers.get('x-user-id')
    return userId ? { userId } : null
  },
  authorize: () => ({ subscribe: true, publish: true }),
})`}
      />

      <h3>Shared collection</h3>
      <CodeBlock
        title="app/collections/todos.ts"
        code={`import { createCollection } from '@tanstack/db'
import { realtimeCollectionOptions, withRest } from '@realtimejs/core'
import { client } from '../client'

export const todosCollection = createCollection(
  realtimeCollectionOptions({
    ...withRest({
      url: '/api/todos',
      getKey: (t: { id: string }) => t.id,
    }),
    client,
    channel: ['todos'],
    fields: {
      title: 'lww',
      completed: 'lww',
    },
  })
)`}
      />

      <h3>React component</h3>
      <CodeBlock
        title="app/components/TodoList.tsx"
        code={`import { useCollection } from '@tanstack/react-db'
import { todosCollection } from '../collections/todos'

export function TodoList() {
  const todos = useCollection(todosCollection)

  const addTodo = () => {
    todosCollection.insert({
      id: crypto.randomUUID(),
      title: 'New todo',
      completed: false,
    })
  }

  return (
    <div>
      <button onClick={addTodo}>Add Todo</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() =>
                todosCollection.update(todo.id, {
                  completed: !todo.completed,
                })
              }
            />
            {todo.title}
          </li>
        ))}
      </ul>
    </div>
  )
}`}
      />

      <h2 id="chat-example">Chat Room</h2>
      <p>
        Append-only message log with live presence showing who&rsquo;s online.
      </p>

      <CodeBlock
        title="app/components/ChatRoom.tsx"
        code={`import { useChannel, usePresence } from '@realtimejs/react'
import { useState } from 'react'

export function ChatRoom({ room, userName }: {
  room: string
  userName: string
}) {
  const [messages, setMessages] = useState<Array<{
    user: string
    text: string
  }>>([])

  const { publish } = useChannel(['chat', { room }], (msg) => {
    setMessages((prev) => [...prev, msg as { user: string; text: string }])
  })

  const { others } = usePresence(
    { channel: ['presence', { room }] },
    { data: { name: userName } }
  )

  const [input, setInput] = useState('')

  const send = () => {
    if (!input.trim()) return
    publish({ user: userName, text: input })
    setInput('')
  }

  return (
    <div>
      <div className="online">
        Online: {others.map((u) => u.data.name).join(', ') || 'just you'}
      </div>
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i}>
            <strong>{m.user}:</strong> {m.text}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && send()}
        placeholder="Type a message..."
      />
    </div>
  )
}`}
      />

      <h2 id="stream-example">AI Streaming</h2>
      <p>
        Server pushes tokens via <code>createServerStream</code>, client
        accumulates them with <code>useStream</code>.
      </p>

      <CodeBlock
        title="app/server/generate.ts"
        code={`import { realtime } from './realtime'

export async function generateResponse(prompt: string, sessionId: string) {
  const stream = realtime.createStream<{ type: string; text?: string }>({
    channel: \`ai:\${sessionId}\`,
  })

  // Simulate LLM streaming
  const words = 'The answer to your question is quite interesting.'.split(' ')
  for (const word of words) {
    stream.push({ type: 'token', text: word + ' ' })
    await new Promise((r) => setTimeout(r, 100))
  }
  stream.done()
}`}
      />

      <CodeBlock
        title="app/components/AIChat.tsx"
        code={`import { useStream } from '@realtimejs/react'

export function AIChat({ sessionId }: { sessionId: string }) {
  const { state, status } = useStream({
    channel: \`ai:\${sessionId}\`,
    initial: '',
    reduce: (text, event) =>
      event.type === 'token' ? text + (event.text ?? '') : text,
    isDone: (event) => event.type === '__stream:done',
  })

  return (
    <div>
      <p>{state}</p>
      {status === 'streaming' && <span className="cursor">|</span>}
      {status === 'done' && <em>Complete</em>}
    </div>
  )
}`}
      />

      <div className="doc-callout">
        <p>
          These examples show the core patterns. For full runnable apps with
          build configuration, see the <code>examples/</code> directory in the{' '}
          <a
            href="https://github.com/mikn/tanstack-realtime/tree/main/examples"
            target="_blank"
            rel="noopener"
          >
            GitHub repository
          </a>
          .
        </p>
      </div>
    </article>
  )
}
