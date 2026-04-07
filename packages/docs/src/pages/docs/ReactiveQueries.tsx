import { CodeBlock } from '../../components/CodeBlock'

export function ReactiveQueries() {
  return (
    <article className="doc-article">
      <h1>Reactive Queries</h1>
      <p className="doc-lead">
        Reactive queries let you declare a server query once and have every
        component that calls it share one fetch, one SSE subscription, and one
        set of propagated optimistic updates — all without manually wiring
        channels or collections.
      </p>

      <h2 id="concept">How it works</h2>
      <p>
        The server wraps a query function with <code>queryWithChannel</code>.
        When a client calls that server function it receives both the initial
        data <em>and</em> the channel name the server is already broadcasting
        changes on. The client hooks subscribe to that channel automatically and
        keep the data live.
      </p>
      <p>
        Multiple components that call <code>useReactiveQuery</code> with the
        same <code>(serverFn, args)</code> pair deduplicate everything — a
        single network request, a single SSE connection, and a single{' '}
        <a href="#/docs/collections">TanStack DB Collection</a> that all
        components read from.
      </p>
      <div className="doc-callout">
        <p>
          <strong>No manual channel wiring.</strong> You never call{' '}
          <code>realtimeCollectionOptions</code> or pass a channel key by hand.
          The server function encodes the channel into the response and the
          client hooks decode it transparently.
        </p>
      </div>

      <h2 id="server-setup">Server setup — queryWithChannel</h2>
      <p>
        Import the <code>realtime</code> handler you already created for{' '}
        <a href="#/docs/server-functions">TanStack Start</a> and wrap your query
        function with <code>realtime.queryWithChannel</code>.
      </p>
      <CodeBlock
        title="app/server/todos.ts"
        code={`import { createServerFn } from '@tanstack/start'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { todos } from '../../db/schema'
import { realtime } from '../realtime'

// queryWithChannel wraps the query and returns { data, channel }
export const getTodos = realtime.queryWithChannel(
  async (db, { teamId }: { teamId: string }) => {
    return db.select().from(todos).where(eq(todos.teamId, teamId))
  },
)

// Expose it as a TanStack Start server function
export const fetchTodos = createServerFn()
  .handler(({ data }: { data: { teamId: string } }) =>
    getTodos(db, data)
  )`}
      />
      <p>
        The wrapped function returns{' '}
        <code>{'{ data: T; channel: string }'}</code>. The channel string is
        derived from the query arguments so that different argument sets fan out
        to different channels automatically.
      </p>

      <h2 id="useReactiveQuery">useReactiveQuery</h2>
      <p>
        Subscribe to a reactive server query and keep the result live. The hook
        fetches the initial data from the server, subscribes to the returned
        channel, and re-renders whenever the server publishes an update.
      </p>
      <p>
        See also the <a href="#/docs/hooks">React Hooks</a> reference for the
        full signature.
      </p>
      <CodeBlock
        title="TodoList.tsx"
        code={`import { useReactiveQuery } from '@tanstack/react-realtime'
import { fetchTodos } from '../server/todos'

export function TodoList({ teamId }: { teamId: string }) {
  const {
    data,
    isPending,
    isFetching,
    error,
    isOptimistic,
    optimisticUpdate,
    refetch,
  } = useReactiveQuery(fetchTodos, { teamId })

  if (isPending) return <p>Loading…</p>
  if (error)     return <p>Error: {String(error)}</p>

  return (
    <>
      {isOptimistic && <span className="saving">Saving…</span>}
      <ul>
        {data?.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
      <button
        onClick={() =>
          optimisticUpdate((prev) => [
            ...(prev ?? []),
            { id: crypto.randomUUID(), title: 'New todo', done: false },
          ])
        }
      >
        Add optimistically
      </button>
    </>
  )
}`}
      />
      <h3>Optimistic updates</h3>
      <p>
        <code>optimisticUpdate(transform)</code> applies a local transformation
        immediately and returns a <em>rollback function</em>. Call the rollback
        if the mutation fails. Because the underlying collection is shared, all
        components reading from the same query see the optimistic state
        instantly.
      </p>
      <CodeBlock
        title="TodoItem.tsx"
        code={`import { useReactiveQuery, useReactiveMutation } from '@tanstack/react-realtime'
import { fetchTodos, updateTodo } from '../server/todos'

function TodoItem({ teamId, todo }: { teamId: string; todo: Todo }) {
  const { optimisticUpdate } = useReactiveQuery(fetchTodos, { teamId })
  const { mutate } = useReactiveMutation(updateTodo)

  const toggle = async () => {
    // Apply optimistic state immediately
    const rollback = optimisticUpdate((prev) =>
      prev?.map((t) => t.id === todo.id ? { ...t, done: !t.done } : t)
    )

    try {
      await mutate({ ...todo, done: !todo.done })
    } catch {
      rollback()
    }
  }

  return (
    <li onClick={toggle} style={{ opacity: todo.done ? 0.5 : 1 }}>
      {todo.title}
    </li>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function useReactiveQuery<TResult, TArgs>(
  serverFn: (args: TArgs) => Promise<ReactiveQueryResult<TResult>>,
  args: TArgs,
  options?: {
    enabled?: boolean            // default: true — set false to skip initial fetch
    refetchOnReconnect?: boolean // default: true
  }
): {
  data: TResult | undefined
  isPending: boolean
  isFetching: boolean
  error: unknown
  isOptimistic: boolean
  optimisticUpdate: (transform: (prev: TResult | undefined) => TResult) => () => void
  refetch: () => void
}`}
      />

      <h2 id="useReactiveMutation">useReactiveMutation</h2>
      <p>
        Wraps an async mutation function with loading state and error handling.
        Pair it with <code>optimisticUpdate</code> from{' '}
        <code>useReactiveQuery</code> for full optimistic UI.
      </p>
      <p>
        See also the <a href="#/docs/hooks">React Hooks</a> reference for the
        full signature.
      </p>
      <CodeBlock
        title="AddTodoForm.tsx"
        code={`import { useReactiveMutation } from '@tanstack/react-realtime'
import { createTodo } from '../server/todos'

export function AddTodoForm({ teamId }: { teamId: string }) {
  const { mutate, isPending, error, reset } = useReactiveMutation(createTodo, {
    onSuccess: (newTodo) => {
      console.log('Created:', newTodo.id)
    },
    onError: (err) => {
      console.error('Failed:', err)
    },
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const title = (form.elements.namedItem('title') as HTMLInputElement).value
    await mutate({ id: crypto.randomUUID(), teamId, title, done: false })
    form.reset()
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="error">{String(error)}</p>}
      <input name="title" placeholder="New todo…" />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : 'Add'}
      </button>
      {error && <button type="button" onClick={reset}>Dismiss</button>}
    </form>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function useReactiveMutation<TArgs, TResult = unknown>(
  mutateFn: (args: TArgs) => Promise<TResult>,
  options?: {
    onSuccess?: (data: TResult) => void
    onError?: (error: unknown) => void
  }
): {
  mutate: (args: TArgs) => Promise<TResult>
  isPending: boolean
  error: unknown
  data: TResult | undefined
  reset: () => void
}`}
      />

      <h2 id="useReactivePaginatedQuery">useReactivePaginatedQuery</h2>
      <p>
        Paginated variant of <code>useReactiveQuery</code>. Accumulates pages as
        you call <code>fetchNextPage</code> and keeps each page live via the
        shared SSE subscription.
      </p>
      <p>
        See also the <a href="#/docs/hooks">React Hooks</a> reference for the
        full signature.
      </p>
      <CodeBlock
        title="FeedList.tsx"
        code={`import { useReactivePaginatedQuery } from '@tanstack/react-realtime'
import { fetchFeedPage } from '../server/feed'

export function FeedList({ teamId }: { teamId: string }) {
  const {
    items,
    isPending,
    isFetching,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useReactivePaginatedQuery(fetchFeedPage, { teamId })

  if (isPending) return <p>Loading feed…</p>
  if (error)     return <p>Error: {String(error)}</p>

  return (
    <>
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading…' : 'Load more'}
        </button>
      )}
    </>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function useReactivePaginatedQuery<TItem, TArgs>(
  serverFn: (args: TArgs & { cursor?: string }) => Promise<ReactiveQueryResult<{
    items: TItem[]
    nextCursor?: string
  }>>,
  args: TArgs,
  options?: {
    enabled?: boolean
    refetchOnReconnect?: boolean
  }
): {
  items: TItem[]
  isPending: boolean
  isFetching: boolean
  error: unknown
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}`}
      />

      <h2 id="shared-cache">Shared query cache</h2>
      <p>
        Under the hood each unique <code>(serverFn, args)</code> pair maps to a
        single TanStack DB Collection. Any number of components can call{' '}
        <code>useReactiveQuery</code> with the same pair and they will all:
      </p>
      <ul>
        <li>Share the initial HTTP request — only one fetch fires.</li>
        <li>
          Share the SSE subscription — one connection services all components.
        </li>
        <li>
          See optimistic updates from <em>any</em> of the sibling components
          instantly, with no prop drilling.
        </li>
      </ul>
      <p>
        The collection is torn down and garbage-collected once all components
        using it unmount, so there is no global leak.
      </p>

      <h2 id="arg-serialisation">Arg serialisation gotcha</h2>
      <p>
        The cache key is derived from <code>JSON.stringify(args)</code>.{' '}
        <code>JSON.stringify</code> does <em>not</em> guarantee key order for
        plain objects, so two components passing logically equal args can create
        two separate collections if the object keys are in different order.
      </p>
      <div className="doc-callout">
        <p>
          <strong>Recommendation:</strong> always pass args as a literal object
          in a consistent key order, or define a shared constant:
        </p>
      </div>
      <CodeBlock
        code={`// ✅ consistent — always same cache key
const args = { projectId, teamId } as const
useReactiveQuery(fetchTodos, args)

// ⚠️  may produce two cache entries if callers differ in key order
useReactiveQuery(fetchTodos, { teamId, projectId })
useReactiveQuery(fetchTodos, { projectId, teamId })  // different key!`}
      />
      <p>
        A future version of the library will normalise key order automatically.
        Until then, define args constants in a shared module.
      </p>
    </article>
  )
}
