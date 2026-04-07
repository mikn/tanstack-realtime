import { CodeBlock } from '../../components/CodeBlock'

export function VueComposables() {
  return (
    <article className="doc-article">
      <h1>Vue Composables</h1>
      <p className="doc-lead">
        All composables are exported from <code>@tanstack/vue-realtime</code>.
        The client is sourced from <code>RealtimeProvider</code> context via
        Vue&rsquo;s provide/inject.
      </p>

      <p>
        The Vue adapter mirrors the React adapter 1:1 — every hook listed on the{' '}
        <a href="#/docs/hooks">React Hooks</a> page has a Vue equivalent with
        the same name and signature. Return values are Vue <code>ref</code> /{' '}
        <code>computed</code> values instead of React state.
      </p>

      <h2>Installation</h2>
      <CodeBlock
        code={`npm install @tanstack/realtime @tanstack/vue-realtime`}
      />

      <h2>Provider</h2>
      <CodeBlock
        title="App.vue"
        code={`<script setup lang="ts">
import { RealtimeProvider } from '@tanstack/vue-realtime'
import { client } from './client'
</script>

<template>
  <RealtimeProvider :client="client">
    <MyApp />
  </RealtimeProvider>
</template>`}
      />

      <h2>Available composables</h2>
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

      <h2 id="useReactiveQuery">useReactiveQuery</h2>
      <p>
        Subscribes to a reactive server query and keeps the result live. The{' '}
        <code>args</code> parameter accepts a plain object or a{' '}
        <code>MaybeRef&lt;TArgs&gt;</code> — Vue will automatically track
        reactive references and re-subscribe when they change. See the{' '}
        <a href="#/docs/reactive-queries">Reactive Queries</a> guide for full
        examples.
      </p>
      <CodeBlock
        title="TodoList.vue"
        code={`<script setup lang="ts">
import { toRef } from 'vue'
import { useReactiveQuery } from '@tanstack/vue-realtime'
import { fetchTodos } from '../server/todos'

const props = defineProps<{ teamId: string }>()

const { data, isPending, error, optimisticUpdate } = useReactiveQuery(
  fetchTodos,
  toRef(props, 'teamId').value ? { teamId: props.teamId } : { teamId: '' },
)
</script>

<template>
  <p v-if="isPending">Loading…</p>
  <p v-else-if="error">Error: {{ error }}</p>
  <ul v-else>
    <li v-for="todo in data" :key="todo.id">{{ todo.title }}</li>
  </ul>
</template>`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function useReactiveQuery<TResult, TArgs>(
  serverFn: (args: TArgs) => Promise<ReactiveQueryResult<TResult>>,
  args: MaybeRef<TArgs>,      // plain object or ref — reactive refs are tracked
  options?: {
    enabled?: boolean
    refetchOnReconnect?: boolean
  }
): {
  data: Ref<TResult | undefined>
  isPending: Ref<boolean>
  isFetching: Ref<boolean>
  error: Ref<unknown>
  isOptimistic: Ref<boolean>
  optimisticUpdate: (transform: (prev: TResult | undefined) => TResult) => () => void
  refetch: () => void
}`}
      />

      <h2 id="useReactiveMutation">useReactiveMutation</h2>
      <p>
        Mutation composable with loading state and error handling. Pair it with{' '}
        <code>optimisticUpdate</code> from <code>useReactiveQuery</code> for
        full optimistic UI. See the{' '}
        <a href="#/docs/reactive-queries">Reactive Queries</a> guide for full
        examples.
      </p>
      <CodeBlock
        title="AddTodoForm.vue"
        code={`<script setup lang="ts">
import { useReactiveMutation } from '@tanstack/vue-realtime'
import { createTodo } from '../server/todos'

const props = defineProps<{ teamId: string }>()

const { mutate, isPending, error, reset } = useReactiveMutation(createTodo, {
  onSuccess: (todo) => console.log('Created:', todo.id),
  onError:   (err) => console.error('Failed:', err),
})

function handleAdd() {
  mutate({ id: crypto.randomUUID(), teamId: props.teamId, title: 'New', done: false })
}
</script>

<template>
  <p v-if="error">{{ error }} <button @click="reset">Dismiss</button></p>
  <button :disabled="isPending" @click="handleAdd">
    {{ isPending ? 'Saving…' : 'Add' }}
  </button>
</template>`}
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
  isPending: Ref<boolean>
  error: Ref<unknown>
  data: Ref<TResult | undefined>
  reset: () => void
}`}
      />

      <h2 id="useReactivePaginatedQuery">useReactivePaginatedQuery</h2>
      <p>
        Paginated variant of <code>useReactiveQuery</code>. Accumulates pages as
        you call <code>fetchNextPage</code> and keeps each page live. The{' '}
        <code>args</code> parameter accepts <code>MaybeRef&lt;TArgs&gt;</code>.
        See the <a href="#/docs/reactive-queries">Reactive Queries</a> guide for
        full examples.
      </p>
      <CodeBlock
        title="FeedList.vue"
        code={`<script setup lang="ts">
import { useReactivePaginatedQuery } from '@tanstack/vue-realtime'
import { fetchFeedPage } from '../server/feed'

const props = defineProps<{ teamId: string }>()

const { items, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } =
  useReactivePaginatedQuery(fetchFeedPage, { teamId: props.teamId })
</script>

<template>
  <p v-if="isPending">Loading…</p>
  <ul v-else>
    <li v-for="item in items" :key="item.id">{{ item.text }}</li>
  </ul>
  <button v-if="hasNextPage" :disabled="isFetchingNextPage" @click="fetchNextPage">
    {{ isFetchingNextPage ? 'Loading…' : 'Load more' }}
  </button>
</template>`}
      />
      <h3>Signature</h3>
      <CodeBlock
        code={`function useReactivePaginatedQuery<TItem, TArgs>(
  serverFn: (args: TArgs & { cursor?: string }) => Promise<ReactiveQueryResult<{
    items: TItem[]
    nextCursor?: string
  }>>,
  args: MaybeRef<TArgs>,
  options?: {
    enabled?: boolean
    refetchOnReconnect?: boolean
  }
): {
  items: Ref<TItem[]>
  isPending: Ref<boolean>
  isFetching: Ref<boolean>
  error: Ref<unknown>
  hasNextPage: Ref<boolean>
  isFetchingNextPage: Ref<boolean>
  fetchNextPage: () => void
}`}
      />

      <h2>Testing utilities</h2>
      <p>
        <code>createTestRealtimeProvider</code> and{' '}
        <code>createTestRealtimeProviderWithPresence</code> are exported for
        testing components that use realtime composables.
      </p>
      <p>
        See <a href="#/docs/testing">Testing</a> for patterns and examples.
      </p>

      <h2>DevTools</h2>
      <p>
        Use <code>@tanstack/vue-realtime-devtools</code> for the Vue developer
        tools panel. See <a href="#/docs/devtools">DevTools</a>.
      </p>
    </article>
  )
}
