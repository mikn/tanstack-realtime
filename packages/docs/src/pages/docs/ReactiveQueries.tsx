import { CodeBlock } from '../../components/CodeBlock'

export function ReactiveQueries() {
  return (
    <article className="doc-article">
      <h1>Reactive Queries</h1>
      <p className="doc-lead">
        Declare a server query once. Every component that calls it shares one
        fetch, one SSE subscription, and one cache &mdash; automatically. When
        data changes, all subscribers update in the same render pass.
      </p>

      <h2 id="concept">How it works</h2>
      <p>
        <code>realtime.query(fn)</code> wraps your server function and returns a{' '}
        <code>ReactiveQueryFn</code>. When a client calls it via{' '}
        <code>useQuery</code>, the server returns the initial data along with a
        channel name derived from the query arguments. The client subscribes to
        that channel automatically and keeps the data live.
      </p>
      <p>
        Multiple components calling <code>useQuery</code> with the same{' '}
        <code>(serverFn, args)</code> pair deduplicate everything &mdash; one
        network request, one SSE connection, one{' '}
        <a href="https://tanstack.com/db" target="_blank" rel="noopener">
          TanStack DB Collection
        </a>{' '}
        that all components read from.
      </p>
      <div className="doc-callout">
        <p>
          <strong>No manual channel wiring.</strong> You never call{' '}
          <code>realtimeCollectionOptions</code> or pass a channel key by hand.
          The server function encodes the channel into the response and the
          client hooks decode it transparently. When a mutation invalidates
          multiple queries, a single SSE batch message updates all of them in
          the same render pass &mdash; no torn state.
        </p>
      </div>

      <h2 id="server-setup">Server — realtime.query()</h2>
      <div className="doc-callout">
        <p>
          <strong>
            Where does <code>realtime.query</code> come from?
          </strong>{' '}
          It is <em>not</em> a method on the transport handler.{' '}
          <code>createStartHandler</code> (from{' '}
          <code>@realtimejs/preset-start</code>) returns{' '}
          <code>{'{ handle, publish, createStream, dispose }'}</code> &mdash;
          the reactive <code>query</code>/<code>mutation</code> wrappers come
          from <code>createReactiveQueries()</code> in{' '}
          <code>@realtimejs/reactive-drizzle</code> (the Drizzle/Postgres
          engine, the one reactive engine that ships today). You compose the two
          once and re-export a single <code>realtime</code> object. See{' '}
          <a href="#/docs/server-functions">TanStack Start + Drizzle</a> and{' '}
          <a href="#/docs/getting-started">Getting Started</a> for the exact
          wiring. If your stack isn&rsquo;t Drizzle/Postgres, use the
          vendor-neutral <a href="#/docs/collections">collection</a> /{' '}
          <a href="#/docs/channels">channel</a> primitives instead.
        </p>
      </div>
      <p>
        Import the composed <code>realtime</code> object from your server setup
        and wrap your query function. The wrapped function is callable on both
        server and client.
      </p>
      <CodeBlock
        title="app/server/todos.ts"
        code={`import { realtime } from './realtime'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { todos } from '../../db/schema'

// realtime.query() wraps the function — channels derived automatically
export const getTodos = realtime.query(
  async ({ teamId }: { teamId: string }) =>
    db.select().from(todos).where(eq(todos.teamId, teamId))
)`}
      />
      <p>
        The branded <code>ReactiveQueryFn</code> type carries TypeScript phantom
        fields so <code>useQuery</code> infers <code>TArgs</code> and{' '}
        <code>TItem</code> without explicit generics.
      </p>

      <h2 id="server-mutation">Server — realtime.mutation()</h2>
      <p>
        Wrap write operations with <code>realtime.mutation()</code>. The library
        captures which rows were written and publishes a batch invalidation to
        all affected query subscribers.
      </p>
      <CodeBlock
        title="app/server/todos.ts (continued)"
        code={`export const createTodo = realtime.mutation(
  async ({ teamId, title }: { teamId: string; title: string }) => {
    const [todo] = await db
      .insert(todos)
      .values({ teamId, title, done: false })
      .returning()
    return todo
  }
)`}
      />

      <h2 id="useQuery">useQuery</h2>
      <p>
        Subscribe to a reactive server query and keep the result live. Returns
        an array of typed items plus a composable <code>collection</code> for
        client-side filtering and sorting.
      </p>
      <CodeBlock
        title="TodoList.tsx"
        code={`import { useQuery } from '@realtimejs/react'
import { getTodos } from '../server/todos'

export function TodoList({ teamId }: { teamId: string }) {
  const {
    data,
    collection,
    isPending,
    isFetching,
    error,
    refetch,
  } = useQuery(getTodos, { teamId }, { getKey: (t) => t.id })

  if (isPending) return <p>Loading…</p>
  if (error)     return <p>Error: {String(error)}</p>

  return (
    <ul>
      {data.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function useQuery<TArgs, TItem extends Record<string, unknown>>(
  serverFn: ReactiveQueryFn<TArgs, Array<TItem>>,
  args: TArgs,
  options: {
    getKey: (item: TItem) => string   // required — extracts a stable key per item
    enabled?: boolean                  // default: true — set false to skip initial fetch
    refetchOnReconnect?: boolean       // default: true
  }
): {
  data: Array<TItem>                   // live array of items from the server
  collection: Collection<TItem, string> | null  // TanStack DB collection for useLiveQuery
  isPending: boolean                   // true until first data arrives
  isFetching: boolean                  // true during background refetch
  error: unknown
  refetch: () => void
}`}
      />

      <h2 id="collection-composability">
        Client-side filtering with collection
      </h2>
      <p>
        The <code>collection</code> returned by <code>useQuery</code> is a live{' '}
        <a href="https://tanstack.com/db" target="_blank" rel="noopener">
          TanStack DB Collection
        </a>
        . Pass it to <code>useLiveQuery</code> to filter, sort, or join
        client-side &mdash; no extra server requests needed.
      </p>
      <CodeBlock
        title="ActiveTodos.tsx"
        code={`import { useQuery } from '@realtimejs/react'
import { useLiveQuery } from '@tanstack/react-db'
import { getTodos } from '../server/todos'

export function ActiveTodos({ teamId }: { teamId: string }) {
  const { collection } = useQuery(getTodos, { teamId }, { getKey: (t) => t.id })

  // Client-side filter — reactive, no network request
  const { data: active } = useLiveQuery(
    (q) => q.from({ todos: collection }).where('done', '=', false),
    [collection],
  )

  return <ul>{active.map(t => <li key={t.id}>{t.title}</li>)}</ul>
}`}
      />
      <p>
        Multiple components can call <code>useQuery</code> with the same pair
        and each apply a different <code>useLiveQuery</code> filter &mdash; all
        reading from the same underlying collection, zero duplicate fetches.
      </p>
      <CodeBlock
        code={`// Component A — shows done items, sorted by completion time
const { data: done } = useLiveQuery(
  (q) => q.from({ todos: collection })
          .where('done', '=', true)
          .orderBy('completedAt', 'desc'),
  [collection],
)

// Component B — shows active items assigned to current user
const { data: mine } = useLiveQuery(
  (q) => q.from({ todos: collection })
          .where('done', '=', false)
          .where('assigneeId', '=', currentUserId),
  [collection],
)`}
      />

      <h2 id="useMutation">useMutation</h2>
      <p>
        Wraps a reactive mutation function with loading state and error
        handling. The <code>optimistic</code> option provides declarative
        optimistic updates that are automatically rolled back on error.
      </p>
      <CodeBlock
        title="AddTodoForm.tsx"
        code={`import { useMutation } from '@realtimejs/react'
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
      <CodeBlock
        title="FeedList.tsx"
        code={`import { usePaginatedQuery } from '@realtimejs/react'
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
        <li>Share the initial HTTP request &mdash; only one fetch fires.</li>
        <li>
          Share the SSE subscription &mdash; one connection services all
          components.
        </li>
        <li>
          Reflect optimistic updates from <em>any</em> sibling component
          instantly, with no prop drilling.
        </li>
      </ul>
      <p>
        The collection is torn down and garbage-collected once all components
        using it unmount.
      </p>

      <h2 id="batched-consistency">Batched consistency</h2>
      <p>
        When a single mutation invalidates multiple queries (e.g. updating a
        todo that appears in a list <em>and</em> a stats widget), the server
        re-runs all affected queries in parallel and sends one atomic{' '}
        <code>__realtime_batch__</code> SSE message containing every update.
      </p>
      <p>
        The client fans these out synchronously inside{' '}
        <code>RealtimeProvider</code>. React 18 automatic batching merges all
        resulting state updates into a single render &mdash; no torn state, no
        partial updates.
      </p>
      <div className="doc-callout">
        <p>
          <strong>Zero configuration.</strong> Batched consistency is enabled
          automatically by <code>RealtimeProvider</code>. No changes to your
          query or mutation code are required.
        </p>
      </div>

      <h2 id="invalidation">How invalidation is routed</h2>
      <p>
        When a <code>realtime.mutation()</code> writes to the database, the
        server determines which subscriptions to re-run without broadcasting to
        all of them. It works in two steps:
      </p>
      <ol>
        <li>
          The reactive DB proxy captures the WHERE clause from each{' '}
          <code>realtime.query()</code> call and compiles it into a row-matching
          function stored alongside the subscription.
        </li>
        <li>
          On write, the <code>.returning()</code> rows are checked against every
          active subscription&rsquo;s compiled predicate. Only matching
          subscriptions are re-queried and pushed to clients.
        </li>
      </ol>
      <p>
        For <strong>UPDATE</strong> operations there is one additional step: if
        the mutation&rsquo;s <code>.set(&#123;&hellip;&#125;)</code> changed a
        column that is referenced by a subscription&rsquo;s predicate, that
        subscription is re-run even when the post-update row no longer matches
        it. This ensures subscribers see items <em>disappear</em> from filtered
        result sets, not just appear.
      </p>

      <h3 id="invalidation-predicate-design">
        Design predicates on stable fields
      </h3>
      <p>
        Invalidation is most precise when server-side predicates filter on{' '}
        <strong>stable fields</strong> (IDs, team membership, foreign keys) and{' '}
        <strong>mutable field filtering happens client-side</strong> via{' '}
        <code>useLiveQuery</code>. This is the recommended pattern:
      </p>
      <CodeBlock
        code={`// ✅  Server predicate on stable field — precise invalidation
export const getTodos = realtime.query(
  async ({ teamId }: { teamId: string }) =>
    db.select().from(todos).where(eq(todos.teamId, teamId))
)

// ✅  Client-side split on mutable field — no extra server request
const { collection } = useQuery(getTodos, { teamId }, { getKey: (t) => t.id })

const { data: active } = useLiveQuery(
  (q) => q.from({ todos: collection }).where('done', '=', false),
  [collection],
)
const { data: done } = useLiveQuery(
  (q) => q.from({ todos: collection }).where('done', '=', true),
  [collection],
)`}
      />
      <p>
        The alternative &mdash; separate server queries filtering on{' '}
        <code>done = false</code> and <code>done = true</code> &mdash; works
        correctly (the conservative UPDATE check handles it), but re-runs both
        subscriptions on every toggle instead of just updating the shared
        collection client-side. One server query, two client views is both more
        efficient and simpler.
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
useQuery(getTodos, args, { getKey: (t) => t.id })

// ⚠️  may produce two cache entries if callers differ in key order
useQuery(getTodos, { teamId, projectId }, { getKey: (t) => t.id })
useQuery(getTodos, { projectId, teamId }, { getKey: (t) => t.id })  // different key!`}
      />
      <p>
        A future version of the library will normalise key order automatically.
        Until then, define args constants in a shared module.
      </p>
    </article>
  )
}
