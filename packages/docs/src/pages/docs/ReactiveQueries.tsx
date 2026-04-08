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
        The server wraps a query function with <code>realtime.query(fn)</code>.
        The returned function is callable on both server and client. When a
        client calls it, the server returns the initial data and a channel name
        derived from the query arguments. The client hooks subscribe to that
        channel automatically and keep the data live.
      </p>
      <p>
        Multiple components that call <code>useQuery</code> with the same{' '}
        <code>(serverFn, args)</code> pair deduplicate everything — a single
        network request, a single SSE connection, and a single{' '}
        <a href="#/docs/collections">TanStack DB Collection</a> that all
        components read from.
      </p>
      <div className="doc-callout">
        <p>
          <strong>No manual channel wiring.</strong> You never call{' '}
          <code>realtimeCollectionOptions</code> or pass a channel key by hand.
          The server function encodes the channel into the response and the
          client hooks decode it transparently. When a mutation invalidates
          multiple queries, a single SSE batch message updates all of them in
          the same render pass.
        </p>
      </div>

      <h2 id="server-setup">Server setup — realtime.query()</h2>
      <p>
        Import the <code>realtime</code> handler you already created for{' '}
        <a href="#/docs/server-functions">TanStack Start</a> and wrap your query
        function with <code>realtime.query()</code>.
      </p>
      <CodeBlock
        title="app/server/todos.ts"
        code={`import { createServerFn } from '@tanstack/start'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { todos } from '../../db/schema'
import { realtime } from '../realtime'

// realtime.query() wraps the query — channels are derived automatically
export const getTodos = realtime.query(
  async ({ teamId }: { teamId: string }) =>
    db.select().from(todos).where(eq(todos.teamId, teamId))
)

// Expose it as a TanStack Start server function
export const fetchTodos = createServerFn().handler(getTodos)`}
      />
      <p>
        The wrapped function returns{' '}
        <code>{'ReactiveQueryFn<TArgs, TResult>'}</code>. Channels are derived
        from the SQL WHERE clause automatically — no configuration needed. The
        branded type carries TypeScript phantom fields so <code>useQuery</code>{' '}
        can infer <code>TArgs</code> and <code>TResult</code> without explicit
        generics.
      </p>

      <h2 id="server-mutation">Server setup — realtime.mutation()</h2>
      <p>
        Wrap write operations with <code>realtime.mutation()</code>. The library
        captures which rows were written and publishes a batch invalidation
        message to all affected query subscribers.
      </p>
      <CodeBlock
        title="app/server/todos.ts (continued)"
        code={`// realtime.mutation() wraps the mutation — invalidation is automatic
export const createTodo = realtime.mutation(
  async ({ teamId, title }: { teamId: string; title: string }) => {
    const [todo] = await db
      .insert(todos)
      .values({ teamId, title, done: false })
      .returning()
    return todo
  }
)

export const addTodo = createServerFn().handler(createTodo)`}
      />

      <h2 id="useQuery">useQuery</h2>
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
        code={`import { useQuery } from '@tanstack/react-realtime'
import { getTodos } from '../server/todos'

export function TodoList({ teamId }: { teamId: string }) {
  const {
    data,
    isPending,
    isFetching,
    error,
    isOptimistic,
    optimisticUpdate,
    refetch,
  } = useQuery(getTodos, { teamId })

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
    </>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function useQuery<TArgs, TResult>(
  serverFn: ReactiveQueryFn<TArgs, TResult>,
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

      <h2 id="useMutation">useMutation</h2>
      <p>
        Wraps a reactive mutation function with loading state and error
        handling. The <code>optimistic</code> option provides declarative
        optimistic updates that are automatically rolled back on error.
      </p>
      <p>
        See also the <a href="#/docs/hooks">React Hooks</a> reference for the
        full signature.
      </p>
      <CodeBlock
        title="AddTodoForm.tsx"
        code={`import { useMutation } from '@tanstack/react-realtime'
import { getTodos, createTodo } from '../server/todos'

export function AddTodoForm({ teamId }: { teamId: string }) {
  const { mutate, isPending, error } = useMutation(createTodo, {
    optimistic: (cache, args) => {
      // Speculatively add the todo — rolled back automatically on error
      cache.update(getTodos, { teamId: args.teamId }, (prev) => [
        ...(prev ?? []),
        { id: crypto.randomUUID(), title: args.title, done: false },
      ])
    },
    onSuccess: (todo) => console.log('Created:', todo.id),
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const title = (form.elements.namedItem('title') as HTMLInputElement).value
    await mutate({ teamId, title })
    form.reset()
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="error">{String(error)}</p>}
      <input name="title" placeholder="New todo…" />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : 'Add'}
      </button>
    </form>
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
        Paginated variant of <code>useQuery</code>. Accumulates pages as you
        call <code>fetchNextPage</code> and keeps the first page live via the
        shared SSE subscription.
      </p>
      <p>
        See also the <a href="#/docs/hooks">React Hooks</a> reference for the
        full signature.
      </p>
      <CodeBlock
        title="FeedList.tsx"
        code={`import { usePaginatedQuery } from '@tanstack/react-realtime'
import { getFeedPage } from '../server/feed'

export function FeedList({ teamId }: { teamId: string }) {
  const {
    items,
    isPending,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = usePaginatedQuery(getFeedPage, { teamId })

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
        code={`function usePaginatedQuery<TItem, TArgs extends { cursor?: string | number | null; limit?: number }>(
  serverFn: ReactiveQueryFn<TArgs, PaginatedPage<TItem>>,
  args: Omit<TArgs, 'cursor' | 'limit'>,
  options?: {
    pageSize?: number         // default: 20
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

      <h2 id="shared-cache">Shared query cache</h2>
      <p>
        Under the hood each unique <code>(serverFn, args)</code> pair maps to a
        single TanStack DB Collection. Any number of components can call{' '}
        <code>useQuery</code> with the same pair and they will all:
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

      <h2 id="batched-consistency">Batched consistency</h2>
      <p>
        When a single mutation invalidates multiple queries (e.g. updating a
        todo that appears in a list <em>and</em> a stats widget), the server
        re-runs all affected queries in parallel and sends one atomic{' '}
        <code>__realtime_batch__</code> SSE message containing every update.
      </p>
      <p>
        The client fans these out synchronously inside the{' '}
        <code>RealtimeProvider</code>. React 18 automatic batching then merges
        all resulting state updates into a single render — no torn state, no
        partial updates.
      </p>
      <div className="doc-callout">
        <p>
          <strong>Zero configuration.</strong> Batched consistency is enabled
          automatically by <code>RealtimeProvider</code>. No changes to your
          query or mutation code are needed.
        </p>
      </div>

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
useQuery(getTodos, args)

// ⚠️  may produce two cache entries if callers differ in key order
useQuery(getTodos, { teamId, projectId })
useQuery(getTodos, { projectId, teamId })  // different key!`}
      />
      <p>
        A future version of the library will normalise key order automatically.
        Until then, define args constants in a shared module.
      </p>
    </article>
  )
}
