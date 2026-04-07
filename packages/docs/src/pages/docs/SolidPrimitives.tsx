import { CodeBlock } from '../../components/CodeBlock'

export function SolidPrimitives() {
  return (
    <article className="doc-article">
      <h1>Solid Primitives</h1>
      <p className="doc-lead">
        All primitives are exported from <code>@tanstack/solid-realtime</code>.
        The client is sourced from <code>RealtimeProvider</code> context.
      </p>

      <p>
        The Solid adapter mirrors the React adapter 1:1 — every hook listed on
        the <a href="#/docs/hooks">React Hooks</a> page has a Solid equivalent
        with the same name and signature. Internally, hooks use Solid signals
        and <code>createEffect</code> instead of React state and{' '}
        <code>useEffect</code>.
      </p>

      <h2>Installation</h2>
      <CodeBlock
        code={`npm install @tanstack/realtime @tanstack/solid-realtime`}
      />

      <h2>Provider</h2>
      <CodeBlock
        title="App.tsx"
        code={`import { RealtimeProvider } from '@tanstack/solid-realtime'
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
          <code>useReactiveQuery</code>, <code>useReactiveMutation</code>,{' '}
          <code>useReactivePaginatedQuery</code>
        </li>
      </ul>

      <h2 id="createReactiveQuery">createReactiveQuery</h2>
      <p>
        Solid alias for <code>useReactiveQuery</code>. Subscribes to a reactive
        server query and keeps the result live via a shared SSE connection. See
        the <a href="#/docs/reactive-queries">Reactive Queries</a> guide for
        full examples.
      </p>
      <CodeBlock
        title="TodoList.tsx"
        code={`import { createReactiveQuery } from '@tanstack/solid-realtime'
import { fetchTodos } from '../server/todos'

function TodoList(props: { teamId: string }) {
  const query = createReactiveQuery(fetchTodos, () => ({ teamId: props.teamId }))

  return (
    <Show when={!query.isPending} fallback={<p>Loading…</p>}>
      <ul>
        <For each={query.data}>{(todo) => <li>{todo.title}</li>}</For>
      </ul>
    </Show>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function createReactiveQuery<TResult, TArgs>(
  serverFn: (args: TArgs) => Promise<ReactiveQueryResult<TResult>>,
  args: () => TArgs,          // reactive accessor — reruns when args change
  options?: {
    enabled?: boolean
    refetchOnReconnect?: boolean
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

      <h2 id="createReactiveMutation">createReactiveMutation</h2>
      <p>
        Solid alias for <code>useReactiveMutation</code>. Wraps an async
        mutation function with loading state and error handling. See the{' '}
        <a href="#/docs/reactive-queries">Reactive Queries</a> guide for full
        examples.
      </p>
      <CodeBlock
        title="AddTodoForm.tsx"
        code={`import { createReactiveMutation } from '@tanstack/solid-realtime'
import { createTodo } from '../server/todos'

function AddTodoForm(props: { teamId: string }) {
  const mutation = createReactiveMutation(createTodo)

  return (
    <button
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate({
          id: crypto.randomUUID(),
          teamId: props.teamId,
          title: 'New todo',
          done: false,
        })
      }
    >
      {mutation.isPending ? 'Saving…' : 'Add'}
    </button>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function createReactiveMutation<TArgs, TResult = unknown>(
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

      <h2 id="createReactivePaginatedQuery">createReactivePaginatedQuery</h2>
      <p>
        Solid alias for <code>useReactivePaginatedQuery</code>. Paginated
        variant that accumulates pages and keeps each page live. See the{' '}
        <a href="#/docs/reactive-queries">Reactive Queries</a> guide for full
        examples.
      </p>
      <CodeBlock
        title="FeedList.tsx"
        code={`import { createReactivePaginatedQuery } from '@tanstack/solid-realtime'
import { fetchFeedPage } from '../server/feed'

function FeedList(props: { teamId: string }) {
  const query = createReactivePaginatedQuery(
    fetchFeedPage,
    () => ({ teamId: props.teamId }),
  )

  return (
    <>
      <ul>
        <For each={query.items}>{(item) => <li>{item.text}</li>}</For>
      </ul>
      <Show when={query.hasNextPage}>
        <button onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
          {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
        </button>
      </Show>
    </>
  )
}`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function createReactivePaginatedQuery<TItem, TArgs>(
  serverFn: (args: TArgs & { cursor?: string }) => Promise<ReactiveQueryResult<{
    items: TItem[]
    nextCursor?: string
  }>>,
  args: () => TArgs,
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
        Use <code>@tanstack/solid-realtime-devtools</code> for the Solid
        developer tools panel. See <a href="#/docs/devtools">DevTools</a>.
      </p>
    </article>
  )
}
