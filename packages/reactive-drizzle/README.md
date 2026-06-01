# @realtimejs/reactive-drizzle

Optional Drizzle/Postgres **reactive-query engine** for [`@realtimejs/core`](../realtime).

It is intentionally a separate package so the core install carries **zero**
`drizzle-orm` / `pgsql-ast-parser` dependencies. Install it only when you want
auto-derived channels, predicate matching, and automatic invalidation backed by
Drizzle:

```sh
pnpm add @realtimejs/reactive-drizzle
```

This package composes with `createStartHandler` from
`@realtimejs/preset-start`: the handler owns the **transport**
(`publish`, `handle`, `createStream`), while this package owns the **reactive
engine** (`query`, `mutation`, `invalidate`, `subscriptionManager`).

## Canonical wiring

`createReactiveQueries()` and `createStartHandler()` have a chicken-and-egg
relationship: the handler needs the engine's `onChannelEmpty`, and the engine
needs the handler's `publish`. Create the engine first, pass its
`onChannelEmpty` into the handler, then inject `publish` back via `bindPublish`.

```ts
// app/server/realtime.ts
import { createStartHandler } from '@realtimejs/preset-start'
import { createReactiveQueries } from '@realtimejs/reactive-drizzle'

// 1. Create the reactive engine first (defaults to the Drizzle engine).
const reactive = createReactiveQueries()

// 2. Create the transport handler, wiring the engine's onChannelEmpty in.
export const realtime = createStartHandler({
  onChannelEmpty: reactive.onChannelEmpty,
})

// 3. Inject the handler's publish back into the engine so invalidations fan out.
reactive.bindPublish(realtime.publish)

export const realtimePublish = realtime.publish
export const { query, mutation, invalidate } = reactive
```

Use the wrapped `db` inside your server functions so reads/writes are captured:

```ts
import { wrapReactiveDb } from '@realtimejs/reactive-drizzle'
import { db as rawDb } from './db'

export const db = wrapReactiveDb(rawDb)

export const getTodos = createServerFn().handler(
  query(async (args: { teamId: string }) =>
    db.select().from(todos).where(eq(todos.teamId, args.teamId)),
  ),
)

export const createTodo = createServerFn().handler(
  mutation(async (args: { teamId: string; title: string }) => {
    await db.insert(todos).values(args).returning()
  }),
)
```

## Multi-table queries and the JOIN limitation

A reactive query that reads **several tables in separate `select().from()`
calls** stays live to writes on **all** of them. Each read derives its own
channel, every channel is propagated to the client, and a write to any of those
tables re-runs the query:

```ts
export const getDashboard = createServerFn().handler(
  query(async (args: { teamId: string }) => {
    const todos = await db
      .select()
      .from(todosTable)
      .where(eq(todosTable.teamId, args.teamId))
    const projects = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.teamId, args.teamId))
    return { todos, projects } // invalidated by writes to EITHER table
  }),
)
```

**Limitation — SQL JOINs are not covered.** A single statement that JOINs
tables (`db.select().from(a).leftJoin(b, ...)`) only captures the **primary**
table `a`; the joined table `b` is not intercepted, so writes to `b` will **not**
invalidate the query. Multi-table reactivity works only for **separate**
`select().from()` calls.

For a JOIN (or any shape the auto-capture cannot see), take manual control with
the explicit `channel` override / `predicate` escape hatch so you decide exactly
which channel(s) the query subscribes to and how rows are matched.

## Composing your own `onChannelEmpty`

`reactive.onChannelEmpty` unregisters a channel's subscription when its last SSE
subscriber disconnects (it never unregisters the batch channel). If you have
additional teardown of your own, compose the two — call yours, then the
engine's:

```ts
export const realtime = createStartHandler({
  onChannelEmpty: (channel) => {
    myMetrics.channelClosed(channel) // your logic
    reactive.onChannelEmpty(channel) // then let the engine clean up
  },
})
```

## Implementing a custom engine

The reactive **orchestration** (`createReactiveQueries`) depends only on the
neutral `ReactiveQueryEngine` interface from `@realtimejs/core` — never on
Drizzle or `pgsql-ast-parser` directly. The Drizzle engine is just the first
implementation; you can plug in Kysely, Prisma, raw SQL, or a test double.

```ts
import type {
  ReactiveQueryEngine,
  CapturedRead,
  WriteDescriptor,
  QueryKey,
} from '@realtimejs/core'

interface ReactiveQueryEngine {
  /**
   * Run `queryFn` capturing its read(s); return the result plus how to
   * invalidate. `channelOverride` forces the channel when provided.
   * Returns an ARRAY of reads to support multi-table queries.
   */
  captureReads: <T>(
    queryFn: () => Promise<T>,
    channelOverride?: QueryKey | string,
  ) => Promise<{ result: T; reads: ReadonlyArray<CapturedRead> }>

  /** Run `mutationFn` capturing its write descriptors. */
  captureWrites: <T>(
    mutationFn: () => Promise<T>,
  ) => Promise<{ result: T; writes: ReadonlyArray<WriteDescriptor> }>
}
```

A `CapturedRead` describes one read: the `table`, a `compiled(row)` predicate
that answers "does this post-write row belong to the query's result set?", the
`referencedColumns` the predicate touches (for conservative UPDATE
invalidation), and the `channel` its updates are delivered on.

Pass your engine to `createReactiveQueries`:

```ts
const reactive = createReactiveQueries({ engine: myEngine })
```

When `engine` is omitted it defaults to `createDrizzleEngine()`, so existing
Drizzle call sites keep working unchanged.
