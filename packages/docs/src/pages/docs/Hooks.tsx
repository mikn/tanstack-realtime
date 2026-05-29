import { CodeBlock } from '../../components/CodeBlock'

export function Hooks() {
  return (
    <article className="doc-article">
      <h1>React Hooks</h1>
      <p className="doc-lead">
        All hooks are exported from <code>@realtimejs/react</code>. The client
        is sourced from <code>RealtimeProvider</code> context.
      </p>
      <p>
        These same hooks are available for{' '}
        <a href="#/docs/solid-primitives">Solid</a> and{' '}
        <a href="#/docs/vue-composables">Vue</a> with identical names and
        signatures.
      </p>

      <h2 id="useRealtime">useRealtime</h2>
      <p>Connection status and control.</p>
      <CodeBlock
        title="ConnectionBadge.tsx"
        code={`import { useRealtime } from '@realtimejs/react'

function ConnectionBadge() {
  const { status, connect, disconnect } = useRealtime()

  return (
    <span className={status}>
      {status === 'connected' ? 'Live' : 'Offline'}
    </span>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function useRealtime(): {
  status: ConnectionStatus  // 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  connect: () => Promise<void>
  disconnect: () => void
  client: RealtimeClient
}`}
      />
      <p>
        See also: <a href="#/docs/resilience">Resilience</a> for connection
        recovery patterns.
      </p>

      <h2 id="useSubscribe">useSubscribe</h2>
      <p>Subscribe to raw channel events for the component lifetime.</p>
      <CodeBlock
        title="TypingIndicator.tsx"
        code={`import { useState } from 'react'
import { useSubscribe } from '@realtimejs/react'

function TypingIndicator({ roomId }: { roomId: string }) {
  const [typing, setTyping] = useState<string[]>([])

  useSubscribe(['chat:typing', { roomId }], (event) => {
    setTyping((event as { users: string[] }).users)
  })

  return <span>{typing.join(', ')} typing...</span>
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function useSubscribe(
  channel: QueryKey | string,   // e.g. ['chat:typing', { roomId }]
  onMessage: (data: unknown) => void,
): { subscribeError: SubscribeError | null }`}
      />
      <p>
        See also: <a href="#/docs/ephemeral">Ephemeral Channels</a> for
        confetti, toasts, and fire-and-forget patterns.
      </p>

      <h2 id="usePublish">usePublish</h2>
      <p>Stable publish function bound to a channel.</p>
      <CodeBlock
        title="TypingBroadcast.tsx"
        code={`import { usePublish } from '@realtimejs/react'

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
      <h3>Signature</h3>
      <CodeBlock
        code={`function usePublish<T = unknown>(
  channel: QueryKey | string,
): (data: T) => Promise<void>`}
      />
      <p>
        See also: <a href="#/docs/channels">Channels</a> for validated
        publishing with <code>createValidatedPublish</code>.
      </p>

      <h2 id="useChannel">useChannel</h2>
      <p>Combined subscribe + publish for one channel.</p>
      <CodeBlock
        title="ChatRoom.tsx"
        code={`import { useState } from 'react'
import { useChannel } from '@realtimejs/react'

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
      <h3>Signature</h3>
      <CodeBlock
        code={`function useChannel(
  channel: QueryKey | string,
  onMessage?: (data: unknown) => void,  // optional — omit for publish-only
): {
  publish: (data: unknown) => Promise<void>
}`}
      />
      <p>
        See also: <a href="#/docs/channels">Channels &amp; Pub/Sub</a>.
      </p>

      <h2 id="usePresence">usePresence</h2>
      <p>Join a presence channel. Returns others + update function.</p>
      <CodeBlock
        title="DocumentPage.tsx"
        code={`import { usePresence } from '@realtimejs/react'
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
      <h3>Signature</h3>
      <CodeBlock
        code={`function usePresence<T>(
  channelDef: PresenceChannelDef,
  options: {
    params: Record<string, string>
    initial: T
  },
): {
  others: ReadonlyArray<PresenceUser<T>>
  updatePresence: (delta: Partial<T>) => void
}`}
      />
      <p>
        See also: <a href="#/docs/presence">Presence</a> for contextual
        presence, throttling guidance, and cursor sharing patterns.
      </p>

      <h2 id="useStream">useStream</h2>
      <p>
        Subscribe to a reduce-based stream. Returns state, status, and error.
      </p>
      <CodeBlock
        title="AIResponse.tsx"
        code={`import { useStream } from '@realtimejs/react'
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
      <h3>Signature</h3>
      <CodeBlock
        code={`function useStream<TState, TEvent = unknown>(
  streamDef: StreamChannelDef<TState, TEvent>,
  options: {
    params: Record<string, string>
  },
): {
  state: TState
  status: 'pending' | 'streaming' | 'done' | 'error' | 'stale'
  error?: string
}`}
      />
      <p>
        See also: <a href="#/docs/streaming">Streaming</a> for checkpointing,
        HMAC signing, and <code>staleAfter</code>.
      </p>

      <h2 id="useRealtimeCollection">useRealtimeCollection</h2>
      <p>
        Creates a CRDT-backed TanStack DB collection. Client is sourced from
        context.
      </p>
      <CodeBlock
        title="TodoList.tsx"
        code={`import { useRealtimeCollection } from '@realtimejs/react'
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
      <h3>Signature</h3>
      <CodeBlock
        code={`function useRealtimeCollection<T>(options: {
  channel: QueryKey
  getKey: (item: T) => string
  queryFn?: () => Promise<T[]>
  fields?: Record<string, 'lww' | 'pn-counter' | 'or-set'>
  optimistic?: boolean
  refetchOnReconnect?: boolean
}): Collection<T>`}
      />
      <p>
        See also: <a href="#/docs/collections">Collections</a> for the full
        progressive spectrum and <a href="#/docs/crdts">CRDTs</a> for
        field-level merge behavior.
      </p>

      <h2 id="useLiveChannel">useLiveChannel</h2>
      <p>
        Creates an append-only live channel collection. For chat, game events,
        and feeds.
      </p>
      <CodeBlock
        title="AuditLog.tsx"
        code={`import { useLiveChannel } from '@realtimejs/react'

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
      <h3>Signature</h3>
      <CodeBlock
        code={`function useLiveChannel<T>(options: {
  channel: QueryKey
  getKey: (item: T) => string
  initialData?: () => Promise<T[]>
  onEvent: (raw: unknown) => T | null
}): Collection<T>`}
      />
      <p>
        See also: <a href="#/docs/channels">Channels &amp; Pub/Sub</a> for
        append-only patterns and{' '}
        <a href="#/docs/read-receipts">Read Receipts</a>.
      </p>

      <h2 id="useConnectionStatus">useConnectionStatus</h2>
      <p>
        Returns the reactive <code>ConnectionStatus</code> value. Lightweight
        alternative to <code>useRealtime()</code> for status-only components.
      </p>
      <CodeBlock
        title="ConnectionBanner.tsx"
        code={`import { useConnectionStatus } from '@realtimejs/react'

function ConnectionBanner() {
  const status = useConnectionStatus()

  if (status === 'connected') return null
  if (status === 'reconnecting') return <p>Reconnecting…</p>
  return <p>Offline — changes will sync when back online</p>
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function useConnectionStatus(): ConnectionStatus
// ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'`}
      />

      <h2 id="useIsConnected">useIsConnected</h2>
      <p>
        Returns <code>true</code> when connected, <code>false</code> otherwise.
        Convenience wrapper over <code>useConnectionStatus()</code>.
      </p>
      <CodeBlock
        title="SendButton.tsx"
        code={`import { useIsConnected } from '@realtimejs/react'

function SendButton({ onClick }: { onClick: () => void }) {
  const connected = useIsConnected()
  return (
    <button onClick={onClick} disabled={!connected}>
      {connected ? 'Send' : 'Connecting…'}
    </button>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock code={`function useIsConnected(): boolean`} />

      <h2 id="useLatestMessage">useLatestMessage</h2>
      <p>
        Subscribes to a channel and returns only the most recently received
        message. Ideal for notification banners, status updates, and live score
        tickers.
      </p>
      <CodeBlock
        title="LiveScore.tsx"
        code={`import { useLatestMessage } from '@realtimejs/react'

function LiveScore({ matchId }: { matchId: string }) {
  const { message: score, messageCount } = useLatestMessage<ScoreUpdate>(
    ['scores', { matchId }],
  )
  return <p>{score ? \`\${score.home} - \${score.away}\` : 'Waiting…'}</p>
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function useLatestMessage<T = unknown>(
  channel: QueryKey | string,
): {
  message: T | undefined
  messageCount: number    // incremented on every message
}`}
      />

      <h2 id="useChannelHistory">useChannelHistory</h2>
      <p>
        Subscribes to a channel and buffers the last <code>maxMessages</code>{' '}
        messages in order (ring buffer). Useful for chat UIs and activity feeds
        without a full database collection.
      </p>
      <CodeBlock
        title="ChatRoom.tsx"
        code={`import { useChannelHistory } from '@realtimejs/react'

function ChatRoom({ roomId }: { roomId: string }) {
  const { messages, clear } = useChannelHistory<Message>(
    ['chat', { roomId }],
    { maxMessages: 100 },
  )

  return (
    <ul>
      {messages.map((m) => (
        <li key={m.id}>{m.author}: {m.text}</li>
      ))}
    </ul>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function useChannelHistory<T = unknown>(
  channel: QueryKey | string,
  options?: {
    maxMessages?: number  // default: 50
  },
): {
  messages: ReadonlyArray<T>
  clear: () => void
}`}
      />

      <h2 id="useTypingIndicator">useTypingIndicator</h2>
      <p>
        Tracks who is typing in a channel. Publishes <code>typing:start</code> /{' '}
        <code>typing:stop</code> events and auto-expires users after a
        configurable timeout.
      </p>
      <CodeBlock
        title="TypingStatus.tsx"
        code={`import { useTypingIndicator } from '@realtimejs/react'

function ChatInput({ roomId }: { roomId: string }) {
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    ['typing', { roomId }],
    { selfId: currentUser.id },
  )

  return (
    <>
      <input
        onChange={(e) => { setValue(e.target.value); startTyping() }}
        onBlur={stopTyping}
      />
      {typingUsers.length > 0 && (
        <p>{typingUsers.join(', ')} typing…</p>
      )}
    </>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function useTypingIndicator(
  channel: QueryKey | string,
  options: {
    selfId: string         // exclude yourself from typingUsers
    timeout?: number       // auto-expire after ms (default: 3000)
  },
): {
  typingUsers: ReadonlyArray<string>
  startTyping: () => void
  stopTyping: () => void
}`}
      />

      <h2 id="useChannelStats">useChannelStats</h2>
      <p>
        Tracks per-channel statistics without consuming message payloads. Useful
        for debug overlays and admin dashboards.
      </p>
      <CodeBlock
        title="ChannelDebug.tsx"
        code={`import { useChannelStats } from '@realtimejs/react'

function ChannelDebugBadge({ channel }: { channel: string }) {
  const { messageCount, lastMessageAt } = useChannelStats(channel)
  return (
    <span>
      {messageCount} msgs
      {lastMessageAt && \` · last \${new Date(lastMessageAt).toLocaleTimeString()}\`}
    </span>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function useChannelStats(
  channel: QueryKey | string,
): {
  messageCount: number
  lastMessageAt: number | null
}`}
      />

      <h2 id="useOnReconnect">useOnReconnect</h2>
      <p>
        Fires a callback each time the realtime connection is restored after
        being disconnected. Useful for refetching server state or showing
        notifications.
      </p>
      <CodeBlock
        title="DataGrid.tsx"
        code={`import { useOnReconnect } from '@realtimejs/react'

function DataGrid() {
  const { refetch } = useQuery(...)

  useOnReconnect(() => {
    refetch()
  })

  return <table>...</table>
}`}
      />
      <h3>Signature</h3>
      <CodeBlock code={`function useOnReconnect(callback: () => void): void`} />

      <h2 id="synced-hooks">Standalone CRDT hooks</h2>
      <p>
        Self-contained hooks for shared counters, values, and sets. No
        collection required.
      </p>

      <h3>useSyncedCounter</h3>
      <CodeBlock
        title="VoteButton.tsx"
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
        title="EditableTitle.tsx"
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
        title="TagEditor.tsx"
        code={`const postTags = defineSyncedSet({
  id: 'post-tags',
  channel: (params: { postId: string }) => ['tags', params],
})

function TagEditor({ postId }: { postId: string }) {
  const { values: tags, add, remove, has } = useSyncedSet(postTags, {
    params: { postId },
    initial: [],
  })
  return (
    <>
      {tags.map(tag => (
        <span key={tag}>{tag} <button onClick={() => remove(tag)}>x</button></span>
      ))}
      <button
        onClick={() => add('important')}
        disabled={has('important')}
      >
        + important
      </button>
    </>
  )
}`}
      />
      <p>
        See also: <a href="#/docs/crdts">CRDTs</a> for theory and merge
        behavior, <a href="#/docs/ephemeral">Ephemeral Channels</a> for pairing
        ephemeral animations with persistent CRDT counters.
      </p>

      <h2 id="useQuery">useQuery</h2>
      <p>
        Subscribes to a reactive server query and keeps the result live. Returns
        a typed item array plus a composable <code>collection</code> for
        client-side filtering with <code>useLiveQuery</code>. See the{' '}
        <a href="#/docs/reactive-queries">Reactive Queries</a> guide for full
        examples.
      </p>
      <CodeBlock
        title="TodoList.tsx"
        code={`import { useQuery } from '@realtimejs/react'
import { getTodos } from '../server/todos'

function TodoList({ teamId }: { teamId: string }) {
  const { data, collection, isPending, error } =
    useQuery(getTodos, { teamId }, { getKey: (t) => t.id })

  if (isPending) return <p>Loading…</p>
  if (error)     return <p>Error: {String(error)}</p>
  return <ul>{data.map((t) => <li key={t.id}>{t.title}</li>)}</ul>
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function useQuery<TArgs, TItem extends Record<string, unknown>>(
  serverFn: ReactiveQueryFn<TArgs, Array<TItem>>,
  args: TArgs,
  options: {
    getKey: (item: TItem) => string    // required — stable key per item
    enabled?: boolean                   // default: true
    refetchOnReconnect?: boolean        // default: true
  }
): {
  data: Array<TItem>                    // live array from the server
  collection: Collection<TItem, string> | null  // pass to useLiveQuery for client-side views
  isPending: boolean
  isFetching: boolean
  error: unknown
  refetch: () => void
}`}
      />

      <h2 id="useMutation">useMutation</h2>
      <p>
        Mutation hook with loading state, error handling, and declarative
        optimistic updates. See the{' '}
        <a href="#/docs/reactive-queries">Reactive Queries</a> guide for full
        examples.
      </p>
      <CodeBlock
        title="AddTodoForm.tsx"
        code={`import { useMutation } from '@realtimejs/react'
import { getTodos, createTodo } from '../server/todos'

function AddTodoForm({ teamId }: { teamId: string }) {
  const { mutate, isPending, error } = useMutation(createTodo, {
    optimistic: (cache, args) => {
      cache.update(getTodos, { teamId: args.teamId }, (prev) => [
        ...(prev ?? []),
        { id: crypto.randomUUID(), title: args.title, done: false },
      ])
    },
  })

  return (
    <button
      disabled={isPending}
      onClick={() => mutate({ teamId, title: 'New todo' })}
    >
      {isPending ? 'Saving…' : 'Add'}
    </button>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function useMutation<TArgs, TResult>(
  serverFn: ReactiveMutationFn<TArgs, TResult>,
  options?: {
    optimistic?: (cache: OptimisticCache, args: TArgs) => void
    onSuccess?: (data: TResult, args: TArgs) => void
    onError?: (error: unknown, args: TArgs) => void
  }
): {
  mutate: (args: TArgs) => Promise<TResult>
  isPending: boolean
  error: unknown
  data: TResult | undefined
  reset: () => void
}`}
      />

      <h2 id="usePaginatedQuery">usePaginatedQuery</h2>
      <p>
        Paginated variant of <code>useQuery</code>. Accumulates pages and keeps
        the first page live. See the{' '}
        <a href="#/docs/reactive-queries">Reactive Queries</a> guide for full
        examples.
      </p>
      <CodeBlock
        title="FeedList.tsx"
        code={`import { usePaginatedQuery } from '@realtimejs/react'
import { getFeedPage } from '../server/feed'

function FeedList({ teamId }: { teamId: string }) {
  const { items, isPending, hasNextPage, fetchNextPage } =
    usePaginatedQuery(getFeedPage, { teamId })

  return (
    <>
      <ul>{items.map((i) => <li key={i.id}>{i.text}</li>)}</ul>
      {hasNextPage && <button onClick={() => fetchNextPage()}>Load more</button>}
    </>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function usePaginatedQuery<TItem, TArgs extends { cursor?: string | number | null; limit?: number }>(
  serverFn: ReactiveQueryFn<TArgs, PaginatedPage<TItem>>,
  args: Omit<TArgs, 'cursor' | 'limit'>,
  options?: {
    pageSize?: number
    enabled?: boolean
    refetchOnReconnect?: boolean
  }
): {
  items: TItem[]
  isPending: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  error: unknown
  fetchNextPage: () => Promise<void>
  refetch: () => void
}`}
      />
    </article>
  )
}
