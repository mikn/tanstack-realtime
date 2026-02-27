import { CodeBlock } from '../../components/CodeBlock'

export function Hooks() {
  return (
    <article className="doc-article">
      <h1>React Hooks</h1>
      <p className="doc-lead">
        All hooks are exported from <code>@tanstack/react-realtime</code>. The
        client is sourced from <code>RealtimeProvider</code> context.
      </p>

      <h2 id="useRealtime">useRealtime</h2>
      <p>Connection status and control.</p>
      <CodeBlock
        code={`import { useRealtime } from '@tanstack/react-realtime'

function ConnectionBadge() {
  const { status, connect, disconnect } = useRealtime()

  return (
    <span className={status}>
      {status === 'connected' ? 'Live' : 'Offline'}
    </span>
  )
}`}
      />

      <h2 id="useSubscribe">useSubscribe</h2>
      <p>Subscribe to raw channel events for the component lifetime.</p>
      <CodeBlock
        code={`import { useSubscribe } from '@tanstack/react-realtime'

function TypingIndicator({ roomId }: { roomId: string }) {
  const [typing, setTyping] = useState<string[]>([])

  useSubscribe(['chat:typing', { roomId }], (event) => {
    setTyping((event as { users: string[] }).users)
  })

  return <span>{typing.join(', ')} typing...</span>
}`}
      />

      <h2 id="usePublish">usePublish</h2>
      <p>Stable publish function bound to a channel.</p>
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

      <h2 id="useChannel">useChannel</h2>
      <p>Combined subscribe + publish for one channel.</p>
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

      <h2 id="usePresence">usePresence</h2>
      <p>Join a presence channel. Returns others + update function.</p>
      <CodeBlock
        code={`import { usePresence } from '@tanstack/react-realtime'
import { docPresence } from './channel'

function DocumentPage({ docId }: { docId: string }) {
  const { others, updatePresence } = usePresence(docPresence, {
    params: { docId },
    initial: { name: user.name, cursor: null },
  })

  return (
    <div onMouseMove={(e) =>
      updatePresence({ cursor: { x: e.clientX, y: e.clientY } })
    }>
      {others.map((u) => (
        <Avatar key={u.connectionId} name={u.data.name} />
      ))}
    </div>
  )
}`}
      />

      <h2 id="useStream">useStream</h2>
      <p>
        Subscribe to a reduce-based stream. Returns state, status, and error.
      </p>
      <CodeBlock
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

      <h2 id="useRealtimeCollection">useRealtimeCollection</h2>
      <p>
        Creates a CRDT-backed TanStack DB collection. Client is sourced from
        context.
      </p>
      <CodeBlock
        code={`import { useRealtimeCollection } from '@tanstack/react-realtime'
import { useLiveQuery } from '@tanstack/react-db'

function TodoList({ projectId }: { projectId: string }) {
  const todos = useRealtimeCollection<Todo>({
    channel: ['todos', { projectId }],
    getKey: (t) => t.id,
    queryFn: () => fetchTodos(projectId),
  })

  const { data } = useLiveQuery((q) =>
    q.from({ todos }).select()
  )

  return <ul>{data.map((t) => <li key={t.id}>{t.text}</li>)}</ul>
}`}
      />

      <h2 id="useLiveChannel">useLiveChannel</h2>
      <p>
        Creates an append-only live channel collection. For chat, game events,
        and feeds.
      </p>
      <CodeBlock
        code={`import { useLiveChannel } from '@tanstack/react-realtime'

function AuditLog({ resourceId }: { resourceId: string }) {
  const events = useLiveChannel<AuditEvent>({
    channel: ['audit', { resourceId }],
    getKey: (e) => e.id,
    initialData: () => fetchAuditHistory(resourceId),
    onEvent: (raw) => {
      const e = raw as { type: string; event: AuditEvent }
      return e.type === 'audit' ? e.event : null
    },
  })
  // ...
}`}
      />

      <h2 id="synced-hooks">Standalone CRDT hooks</h2>
      <p>
        Self-contained hooks for shared counters, values, and sets. No
        collection required.
      </p>

      <h3>useSyncedCounter</h3>
      <CodeBlock
        code={`const postVotes = defineSyncedCounter({
  id: 'post-votes',
  channel: (params: { postId: string }) => ['votes', params],
})

function VoteButton({ postId }: { postId: string }) {
  const { value, increment, decrement } = useSyncedCounter(postVotes, {
    params: { postId },
    initial: 0,
  })
  return <button onClick={() => increment()}>+1 ({value})</button>
}`}
      />

      <h3>useSyncedValue</h3>
      <CodeBlock
        code={`const docTitle = defineSyncedValue({
  id: 'doc-title',
  channel: (params: { docId: string }) => ['doc:title', params],
})

function EditableTitle({ docId }: { docId: string }) {
  const { value, set } = useSyncedValue(docTitle, {
    params: { docId },
    initial: 'Untitled',
  })
  return <input value={value} onChange={(e) => set(e.target.value)} />
}`}
      />

      <h3>useSyncedSet</h3>
      <CodeBlock
        code={`const postTags = defineSyncedSet({
  id: 'post-tags',
  channel: (params: { postId: string }) => ['tags', params],
})

function TagEditor({ postId }: { postId: string }) {
  const { values: tags, add, remove } = useSyncedSet(postTags, {
    params: { postId },
    initial: [],
  })
  return (
    <>
      {tags.map(tag => (
        <span key={tag}>{tag} <button onClick={() => remove(tag)}>x</button></span>
      ))}
      <button onClick={() => add('important')}>+ important</button>
    </>
  )
}`}
      />
    </article>
  )
}
