import { CodeBlock } from '../../components/CodeBlock'

export function SolidPrimitives() {
  return (
    <article className="doc-article">
      <h1>Solid Primitives</h1>
      <p className="doc-lead">
        All primitives are exported from <code>@realtimejs/solid</code>. The
        client is sourced from <code>RealtimeProvider</code> context.
      </p>

      <p>
        The Solid adapter mirrors the React adapter — every hook on the{' '}
        <a href="#/docs/hooks">React Hooks</a> page has a Solid equivalent.
        Names match, with one convention difference: the reactive-query
        primitives are <code>createQuery</code>, <code>createMutation</code>,
        and <code>createPaginatedQuery</code> (Solid-idiomatic{' '}
        <code>create*</code> naming) rather than React&rsquo;s{' '}
        <code>useQuery</code>/<code>useMutation</code>/
        <code>usePaginatedQuery</code>. Every other primitive keeps its{' '}
        <code>use*</code> name. Internally, primitives use Solid signals and{' '}
        <code>createEffect</code> instead of React state and{' '}
        <code>useEffect</code>, so query/mutation results are{' '}
        <strong>signal accessors</strong> (call them: <code>query.data()</code>,{' '}
        <code>mutation.isPending()</code>).
      </p>

      <h2>Installation</h2>
      <CodeBlock code={`npm install @realtimejs/core @realtimejs/solid`} />

      <h2>Provider</h2>
      <CodeBlock
        title="App.tsx"
        code={`import { RealtimeProvider } from '@realtimejs/solid'
import { client } from './client'

function App() {
  return (
    <RealtimeProvider client={client}>
      <MyApp />
    </RealtimeProvider>
  )
}`}
      />

      <h2>Available primitives</h2>
      <p>
        All hooks from the React adapter are available with identical names and
        signatures:
      </p>
      <ul>
        <li>
          <code>useRealtime</code>, <code>useConnectionStatus</code>,{' '}
          <code>useIsConnected</code>
        </li>
        <li>
          <code>useSubscribe</code>, <code>usePublish</code>,{' '}
          <code>useChannel</code>
        </li>
        <li>
          <code>usePresence</code>, <code>useStream</code>
        </li>
        <li>
          <code>useRealtimeCollection</code>, <code>useLiveChannel</code>
        </li>
        <li>
          <code>useLatestMessage</code>, <code>useChannelHistory</code>,{' '}
          <code>useChannelStats</code>
        </li>
        <li>
          <code>useTypingIndicator</code>, <code>useOnReconnect</code>
        </li>
        <li>
          <code>useSyncedCounter</code>, <code>useSyncedValue</code>,{' '}
          <code>useSyncedSet</code>
        </li>
        <li>
          <code>createQuery</code>, <code>createMutation</code>,{' '}
          <code>createPaginatedQuery</code>
        </li>
      </ul>

      <h2 id="createQuery">createQuery</h2>
      <p>
        Solid primitive for reactive server queries. Subscribes to a reactive
        server query and keeps the result live via a shared SSE connection. See
        the <a href="#/docs/reactive-queries">Reactive Queries</a> guide for
        full examples.
      </p>
      <CodeBlock
        title="TodoList.tsx"
        code={`import { createQuery } from '@realtimejs/solid'
import { getTodos } from '../server/todos'

function TodoList(props: { teamId: string }) {
  const query = createQuery(
    getTodos,
    () => ({ teamId: props.teamId }),
    { getKey: (t) => t.id },
  )

  return (
    <Show when={!query.isPending()} fallback={<p>Loading…</p>}>
      <ul>
        <For each={query.data()}>{(todo) => <li>{todo.title}</li>}</For>
      </ul>
    </Show>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function createQuery<TArgs, TItem extends Record<string, unknown>>(
  serverFn: ReactiveQueryFn<TArgs, Array<TItem>>,
  args: Accessor<TArgs>,      // reactive accessor — reruns when args change
  options: {
    getKey: (item: TItem) => string    // required — stable key per item
    enabled?: Accessor<boolean>
    refetchOnReconnect?: Accessor<boolean>
  },
): {
  data: Accessor<Array<TItem>>           // live array from the server
  collection: Accessor<Collection<TItem, string> | null>
  isPending: Accessor<boolean>
  isFetching: Accessor<boolean>
  error: Accessor<unknown>
  refetch: () => void
}`}
      />

      <h2 id="createMutation">createMutation</h2>
      <p>
        Solid primitive for reactive mutations. Wraps an async mutation function
        with loading state, error handling, and declarative optimistic updates.
        See the <a href="#/docs/reactive-queries">Reactive Queries</a> guide for
        full examples.
      </p>
      <CodeBlock
        title="AddTodoForm.tsx"
        code={`import { createMutation } from '@realtimejs/solid'
import { getTodos, createTodo } from '../server/todos'

function AddTodoForm(props: { teamId: string }) {
  const mutation = createMutation(createTodo, {
    optimistic: (cache, args) => {
      cache.update(getTodos, { teamId: args.teamId }, (prev) => [
        ...(prev ?? []),
        { id: crypto.randomUUID(), title: args.title, done: false },
      ])
    },
  })

  return (
    <button
      disabled={mutation.isPending()}
      onClick={() => mutation.mutate({ teamId: props.teamId, title: 'New todo' })}
    >
      {mutation.isPending() ? 'Saving…' : 'Add'}
    </button>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function createMutation<TArgs, TResult>(
  serverFn: ReactiveMutationFn<TArgs, TResult>,
  options?: {
    optimistic?: (cache: OptimisticCache, args: TArgs) => void
    onSuccess?: (data: TResult, args: TArgs) => void
    onError?: (error: unknown, args: TArgs) => void
  }
): {
  mutate: (args: TArgs) => Promise<TResult>
  isPending: Accessor<boolean>
  error: Accessor<unknown>
  data: Accessor<TResult | undefined>
  reset: () => void
}`}
      />

      <h2 id="createPaginatedQuery">createPaginatedQuery</h2>
      <p>
        Paginated variant of <code>createQuery</code>. Accumulates pages and
        keeps the first page live. See the{' '}
        <a href="#/docs/reactive-queries">Reactive Queries</a> guide for full
        examples.
      </p>
      <CodeBlock
        title="FeedList.tsx"
        code={`import { createPaginatedQuery } from '@realtimejs/solid'
import { getFeedPage } from '../server/feed'

function FeedList(props: { teamId: string }) {
  const query = createPaginatedQuery(
    getFeedPage,
    () => ({ teamId: props.teamId }),
  )

  return (
    <>
      <ul>
        <For each={query.items()}>{(item) => <li>{item.text}</li>}</For>
      </ul>
      <Show when={query.hasNextPage()}>
        <button onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage()}>
          {query.isFetchingNextPage() ? 'Loading…' : 'Load more'}
        </button>
      </Show>
    </>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function createPaginatedQuery<TItem, TArgs extends { cursor?: string | number | null; limit?: number }>(
  serverFn: ReactiveQueryFn<TArgs, PaginatedPage<TItem>>,
  args: Accessor<Omit<TArgs, 'cursor' | 'limit'>>,
  options?: {
    pageSize?: Accessor<number>
    enabled?: Accessor<boolean>
    refetchOnReconnect?: Accessor<boolean>
  },
): {
  items: Accessor<Array<TItem>>
  isPending: Accessor<boolean>
  isFetchingNextPage: Accessor<boolean>
  hasNextPage: Accessor<boolean>
  error: Accessor<unknown>
  fetchNextPage: () => Promise<void>
  refetch: () => void
}`}
      />

      <h2>Testing utilities</h2>
      <p>
        <code>createTestRealtimeProvider</code> and{' '}
        <code>createTestRealtimeProviderWithPresence</code> are exported for
        testing components that use realtime primitives.
      </p>
      <p>
        See <a href="#/docs/testing">Testing</a> for patterns and examples.
      </p>

      <h2>DevTools</h2>
      <p>
        Use <code>@realtimejs/solid-devtools</code> for the Solid developer
        tools panel. See <a href="#/docs/devtools">DevTools</a>.
      </p>
    </article>
  )
}
