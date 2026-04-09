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
          <code>useQuery</code>, <code>useMutation</code>,{' '}
          <code>usePaginatedQuery</code>
        </li>
      </ul>

      <h2 id="useQuery">useQuery</h2>
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
import { useQuery } from '@tanstack/vue-realtime'
import { getTodos } from '../server/todos'

const props = defineProps<{ teamId: string }>()

const { data, isPending, error } = useQuery(
  getTodos,
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
        code={`function useQuery<TArgs, TResult>(
  serverFn: ReactiveQueryFn<TArgs, TResult>,
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

      <h2 id="useMutation">useMutation</h2>
      <p>
        Mutation composable with loading state, error handling, and declarative
        optimistic updates. See the{' '}
        <a href="#/docs/reactive-queries">Reactive Queries</a> guide for full
        examples.
      </p>
      <CodeBlock
        title="AddTodoForm.vue"
        code={`<script setup lang="ts">
import { useMutation } from '@tanstack/vue-realtime'
import { getTodos, createTodo } from '../server/todos'

const props = defineProps<{ teamId: string }>()

const { mutate, isPending, error, reset } = useMutation(createTodo, {
  optimistic: (cache, args) => {
    cache.update(getTodos, { teamId: args.teamId }, (prev) => [
      ...(prev ?? []),
      { id: crypto.randomUUID(), title: args.title, done: false },
    ])
  },
  onSuccess: (todo) => console.log('Created:', todo.id),
  onError:   (err) => console.error('Failed:', err),
})

function handleAdd() {
  mutate({ teamId: props.teamId, title: 'New todo' })
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
        code={`function useMutation<TArgs, TResult>(
  serverFn: ReactiveMutationFn<TArgs, TResult>,
  options?: {
    optimistic?: (cache: OptimisticCache, args: TArgs) => void
    onSuccess?: (data: TResult, args: TArgs) => void
    onError?: (error: unknown, args: TArgs) => void
  }
): {
  mutate: (args: TArgs) => Promise<TResult>
  isPending: Ref<boolean>
  error: Ref<unknown>
  data: Ref<TResult | undefined>
  reset: () => void
}`}
      />

      <h2 id="usePaginatedQuery">usePaginatedQuery</h2>
      <p>
        Paginated variant of <code>useQuery</code>. Accumulates pages as you
        call <code>fetchNextPage</code> and keeps the first page live. The{' '}
        <code>args</code> parameter accepts <code>MaybeRef&lt;TArgs&gt;</code>.
        See the <a href="#/docs/reactive-queries">Reactive Queries</a> guide for
        full examples.
      </p>
      <CodeBlock
        title="FeedList.vue"
        code={`<script setup lang="ts">
import { usePaginatedQuery } from '@tanstack/vue-realtime'
import { getFeedPage } from '../server/feed'

const props = defineProps<{ teamId: string }>()

const { items, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } =
  usePaginatedQuery(getFeedPage, { teamId: props.teamId })
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
        code={`function usePaginatedQuery<TItem, TArgs extends { cursor?: string | number | null; limit?: number }>(
  serverFn: ReactiveQueryFn<TArgs, PaginatedPage<TItem>>,
  args: MaybeRef<Omit<TArgs, 'cursor' | 'limit'>>,
  options?: {
    pageSize?: number
    enabled?: boolean
    refetchOnReconnect?: boolean
  }
): {
  items: Ref<TItem[]>
  isPending: Ref<boolean>
  isFetchingNextPage: Ref<boolean>
  hasNextPage: Ref<boolean>
  error: Ref<unknown>
  fetchNextPage: () => Promise<void>
  refetch: () => void
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
