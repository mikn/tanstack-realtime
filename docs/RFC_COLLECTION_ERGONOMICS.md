# RFC: Reducing Collection Verbosity for the Common Case

> **Superseded:** The `useRealtimeQuery` hook proposed here was implemented,
> then replaced by adding `url` support directly to `useRealtimeCollection`.
> The two-hook pattern (`useRealtimeCollection` + `useLiveQuery`) is now the
> recommended approach — it's equally concise and more composable (filtering,
> sorting, joins all happen by changing the query, not the collection).
> `useRealtimeQuery` has been removed.

## The Problem

The current "common case" for a realtime collection requires developers to understand
and wire together multiple concepts across two packages:

```tsx
// Current: 15+ lines, 2 hooks, 2 packages, spread pattern
import { realtimeCollectionOptions, withRest } from '@tanstack/react-realtime'
import { useLiveQuery } from '@tanstack/react-db'

function TodoList({ projectId }: { projectId: string }) {
  const todos = useRealtimeCollection({
    ...withRest<Todo, string>({
      url: `/api/todos?projectId=${projectId}`,
      getKey: (t) => t.id,
    }),
    channel: ['todos', { projectId }],
  })

  const { data } = useLiveQuery((q) => q.from({ todos }).select())

  return (
    <ul>
      {data.map((t) => (
        <li key={t.id}>{t.text}</li>
      ))}
    </ul>
  )
}
```

Compare to TanStack Query, the ergonomic benchmark:

```tsx
// TanStack Query: 5 lines, 1 hook, 1 package
function TodoList({ projectId }: { projectId: string }) {
  const { data: todos } = useQuery({
    queryKey: ['todos', projectId],
    queryFn: () => fetchTodos(projectId),
  })

  return (
    <ul>
      {todos?.map((t) => (
        <li key={t.id}>{t.text}</li>
      ))}
    </ul>
  )
}
```

The gap isn't just line count — it's **concept count**:

| Concept            | TanStack Query | TanStack Realtime (current)         |
| ------------------ | -------------- | ----------------------------------- |
| Config factory     | —              | `realtimeCollectionOptions`         |
| Data helper        | —              | `withRest` + spread pattern         |
| Realtime hook      | —              | `useRealtimeCollection`             |
| Query hook         | `useQuery`     | `useLiveQuery` (separate package)   |
| Query builder      | —              | `(q) => q.from({ todos }).select()` |
| Generic params     | inferred       | `<Todo, string>` on `withRest`      |
| **Total concepts** | **1**          | **6**                               |

## Why It's Hard (Constraints)

Before proposing solutions, it's important to understand why the current API looks
like it does. These aren't accidents — they're trade-offs:

1. **`@tanstack/db` Collection is powerful but general-purpose.** It supports
   arbitrary queries, joins, aggregations, and reactive subscriptions via
   `useLiveQuery`. The `(q) => q.from({ todos }).select()` pattern unlocks
   SQL-like querying. But for the 80% case (just give me the array), it's overkill.

2. **The spread pattern (`...withRest()`) enables composition.** You can mix
   `withRest` with `fields`, `serverAuthoritative`, `optimistic`, etc. A flat
   config object with all REST options inlined would be less composable.

3. **`client` comes from context in hooks, but not in `realtimeCollectionOptions`.**
   The options factory is framework-agnostic — it can't read React context. The
   hooks (`useRealtimeCollection`, `useLiveChannel`) bridge this gap.

4. **The two-hook pattern (collection + query) separates concerns.** The collection
   manages sync lifecycle. The query manages reactive rendering. This is correct
   architecture — but it's two steps where developers expect one.

## Proposed Solution: `useRealtimeQuery`

A convenience hook that composes `useRealtimeCollection` + `useLiveQuery` for the
common case. It does NOT replace the existing API — it wraps it.

### API Design

```tsx
import { useRealtimeQuery } from '@tanstack/react-realtime'

function TodoList({ projectId }: { projectId: string }) {
  const { data: todos } = useRealtimeQuery({
    // REST shorthand — replaces withRest spread
    url: `/api/todos?projectId=${projectId}`,
    getKey: (t: Todo) => t.id,
    // Realtime config
    channel: ['todos', { projectId }],
  })

  return (
    <ul>
      {todos.map((t) => (
        <li key={t.id}>{t.text}</li>
      ))}
    </ul>
  )
}
```

**Concept count: 1 hook, 1 config object, 0 spreads, 0 separate packages.**

### Progressive enhancement still works

```tsx
// Step 1: Just data (no realtime)
const { data } = useRealtimeQuery({
  url: '/api/todos',
  getKey: (t: Todo) => t.id,
})

// Step 2: Add realtime
const { data } = useRealtimeQuery({
  url: '/api/todos',
  getKey: (t: Todo) => t.id,
  channel: ['todos'], // ← one line
})

// Step 3: Add CRDTs
const { data } = useRealtimeQuery({
  url: '/api/todos',
  getKey: (t: Todo) => t.id,
  channel: ['todos'],
  fields: { title: 'lww', tags: 'or-set' }, // ← one line
})

// Step 4: Add optimistic updates
const { data, collection } = useRealtimeQuery({
  url: '/api/todos',
  getKey: (t: Todo) => t.id,
  channel: ['todos'],
  fields: { title: 'lww', tags: 'or-set' },
  optimistic: true, // ← one line
})

// Mutations via the returned collection
await collection.insert({ id: uuid(), text: 'New todo' })
await collection.update(id, { text: 'Updated' })
await collection.delete(id)
```

### Type signature

```tsx
interface UseRealtimeQueryConfig<
  T extends object,
  TKey extends string | number = string,
> {
  // --- Data source (choose one) ---

  /** REST endpoint URL — generates queryFn + CRUD mutations automatically. */
  url?: string
  /** Custom item URL builder for PATCH/DELETE. Default: `${baseUrl}/${key}` */
  itemUrl?: (key: TKey) => string
  /** Headers for REST requests. Static object or async factory. */
  headers?:
    | Record<string, string>
    | (() => Record<string, string> | Promise<Record<string, string>>)

  /** Manual query function — use instead of `url` for non-REST data sources. */
  queryFn?: () => Promise<Array<T>>
  /** Manual mutation callbacks — use instead of `url` for non-REST mutations. */
  onInsert?: InsertMutationFn<T, TKey>
  onUpdate?: UpdateMutationFn<T, TKey>
  onDelete?: DeleteMutationFn<T, TKey>

  // --- Required ---
  /** Extract primary key from a row. */
  getKey: (item: T) => TKey

  // --- Realtime (optional, progressive) ---
  channel?: QueryKey | string
  channels?: Array<QueryKey | string>
  fields?: CrdtFields<T>
  optimistic?: boolean
  serverAuthoritative?: boolean
  refetchOnReconnect?: boolean
  onMessage?: (raw: unknown) => RealtimeChannelMessage<T> | null | undefined
  onSubscribeError?: (channel: string, reason: string, code?: number) => void
  onOptimisticError?: (params: {
    action: string
    key: TKey
    error: unknown
  }) => void

  // --- Query options ---
  /** Custom query builder. Default: `(q) => q.from({ collection }).select()` */
  select?: (q: QueryBuilder, collection: Collection<T, TKey>) => Query
}

interface UseRealtimeQueryResult<T, TKey> {
  /** Reactive data array — re-renders when data changes. */
  data: Array<T>
  /**
   * The underlying Collection for mutations and advanced queries.
   * Use this for `collection.insert()`, `collection.update()`, `collection.delete()`.
   */
  collection: Collection<T, TKey>
}
```

### Implementation sketch

```tsx
export function useRealtimeQuery<
  T extends object,
  TKey extends string | number = string,
>(config: UseRealtimeQueryConfig<T, TKey>): UseRealtimeQueryResult<T, TKey> {
  // If `url` is provided, generate REST helpers internally
  const restConfig = config.url
    ? withRest<T, TKey>({
        url: config.url,
        getKey: config.getKey,
        itemUrl: config.itemUrl,
        headers: config.headers,
      })
    : {
        getKey: config.getKey,
        queryFn: config.queryFn,
        onInsert: config.onInsert,
        onUpdate: config.onUpdate,
        onDelete: config.onDelete,
      }

  // Create the collection (gets client from context)
  const collection = useRealtimeCollection<T, TKey>({
    ...restConfig,
    channel: config.channel,
    channels: config.channels,
    fields: config.fields,
    optimistic: config.optimistic,
    serverAuthoritative: config.serverAuthoritative,
    refetchOnReconnect: config.refetchOnReconnect,
    onMessage: config.onMessage,
    onSubscribeError: config.onSubscribeError,
    onOptimisticError: config.onOptimisticError,
  })

  // Default query: select all from collection
  const { data } = useLiveQuery(
    config.select
      ? (q) => config.select!(q, collection)
      : (q) => q.from({ collection }).select(),
  )

  return { data: data as Array<T>, collection }
}
```

### What about `useLiveQuery`'s richer features?

The `select` escape hatch handles this:

```tsx
// Filtering
const { data } = useRealtimeQuery({
  url: '/api/todos',
  getKey: (t: Todo) => t.id,
  channel: ['todos'],
  select: (q, todos) =>
    q.from({ todos }).where(({ todos }) => todos.done === false),
})

// Ordering
const { data } = useRealtimeQuery({
  url: '/api/todos',
  getKey: (t: Todo) => t.id,
  channel: ['todos'],
  select: (q, todos) =>
    q.from({ todos }).orderBy(({ todos }) => todos.createdAt),
})
```

But for the 80% case (just give me all the rows), no `select` is needed.

### What about non-REST data sources?

Use `queryFn` + `onInsert/Update/Delete` directly (no `url`):

```tsx
const { data } = useRealtimeQuery({
  getKey: (t: Todo) => t.id,
  queryFn: () => myCustomFetch('/todos'),
  onInsert: async ({ transaction }) =>
    myCustomCreate(transaction.mutations[0].modified),
  onUpdate: async ({ transaction }) =>
    myCustomUpdate(transaction.mutations[0].modified),
  channel: ['todos'],
})
```

This is still simpler than today because you don't need `withRest`, `useLiveQuery`,
or the spread pattern.

### What about `withServerFns`?

Same pattern — just pass the function references directly:

```tsx
const { data } = useRealtimeQuery({
  getKey: (t: Todo) => t.id,
  queryFn: () => fetchTodos(),
  onInsert: async ({ transaction }) =>
    createTodo({ data: transaction.mutations[0].modified }),
  onUpdate: async ({ transaction }) =>
    updateTodo({ data: transaction.mutations[0].modified }),
  onDelete: async ({ transaction }) =>
    deleteTodo({ data: transaction.mutations[0].modified }),
  channel: ['todos'],
  serverAuthoritative: true,
})
```

Or we could add a `serverFns` shorthand equivalent to the `url` shorthand:

```tsx
const { data } = useRealtimeQuery({
  getKey: (t: Todo) => t.id,
  serverFns: {
    query: fetchTodos,
    insert: createTodo,
    update: updateTodo,
    delete: deleteTodo,
  },
  channel: ['todos'],
  serverAuthoritative: true,
})
```

## What This Does NOT Do

1. **Does not replace `useRealtimeCollection`** — power users who need the raw
   Collection for multi-collection joins, complex queries, or non-React usage
   keep the current API.

2. **Does not replace `realtimeCollectionOptions`** — the framework-agnostic
   factory function stays for Vue/Solid/Svelte adapters and vanilla JS.

3. **Does not replace `withRest` / `withServerFns`** — they're still useful for
   composition in advanced configs.

4. **Does not change `useLiveQuery`** — it's used internally but not exposed to
   the developer in the default case.

## What This DOES Do

1. **Drops the common case from 6 concepts to 1.** One hook, one config object.

2. **Eliminates the `...spread` pattern** for the 80% case. The spread is a
   "wait, what?" moment for developers unfamiliar with config composition.

3. **Removes the two-package import.** No need to know about `@tanstack/react-db`
   to get started. (Power users still import it for advanced queries.)

4. **Makes type inference better.** `getKey: (t: Todo) => t.id` infers `T` as
   `Todo` and `TKey` as `string` — no explicit generics needed on `withRest`.

5. **Preserves the progressive spectrum.** Each realtime feature is still one
   config key. The on-ramp is just shorter.

## Migration Path

No migration needed. This is additive. The Getting Started guide switches to
`useRealtimeQuery`, the Collections page introduces `useRealtimeCollection`
for advanced cases.

## Naming Alternatives

| Name                | Pros                                                          | Cons                                               |
| ------------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| `useRealtimeQuery`  | Familiar to TanStack Query users, implies "data in, data out" | Could confuse users who think it IS TanStack Query |
| `useRealtimeData`   | Clear, no naming collision                                    | Less familiar, no precedent                        |
| `useLiveCollection` | Matches `useLiveQuery`, indicates reactivity                  | Could confuse with `useRealtimeCollection`         |
| `useRealtime`       | Already taken (returns connection status)                     | —                                                  |
| `useRealtimeList`   | Implies flat array return                                     | Too specific, doesn't hint at mutations            |

**Recommendation: `useRealtimeQuery`** — the familiarity benefit outweighs the
confusion risk, and the behavior IS analogous (declarative data fetching with
reactive updates).
