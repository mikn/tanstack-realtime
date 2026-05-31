# Reactive Queries — realtime.js example

The **headline feature** of realtime.js: auto-invalidating reactive server
queries. A `useQuery` on the client stays live to mutations made by **any**
client — a mutation in one tab updates the other tab's query automatically,
with **zero manual channel wiring**.

It is powered by [`@realtimejs/reactive-drizzle`](../../packages/reactive-drizzle):
`createReactiveQueries` + `wrapReactiveDb` capture the SQL your Drizzle queries
emit, derive a channel from it, and republish fresh data whenever a matching
write lands.

## Why pglite (embedded Postgres)

The reactive engine parses the SQL Drizzle emits with `pgsql-ast-parser` and
binds `$N` positional params — i.e. it speaks the **Postgres dialect**. A SQLite
schema (emitting `?` placeholders) would **not** work. To keep this example
zero-setup, it runs on [`@electric-sql/pglite`](https://pglite.dev) — Postgres
compiled to WASM, running in-process. There is **no external database to
install**; the table is created and seeded on boot.

## Architecture

```
┌────────── Browser tab ──────────┐        ┌────── Vite dev server ──────┐
│ useQuery(getTodos, { teamId })   │        │  POST /api/rpc/:fn          │
│   └─ fetch('/api/rpc/getTodos')──┼────────┼─▶ reactive.query(...)       │
│        ← { data, channels }      │        │     wrapReactiveDb(drizzle) │
│   └─ auto-subscribes to channels │        │       └─ pglite (Postgres)  │
│                                   │        │                             │
│ useMutation(createTodo)           │        │  reactive.mutation(...)     │
│   └─ fetch('/api/rpc/createTodo')─┼────────┼─▶ INSERT → engine derives   │
│                                   │        │     affected channel(s) and │
│ RealtimeProvider ◀─ SSE batch ───┼────────┼─ republishes over broadcast │
│   └─ refreshes matching useQuery  │        │  GET /api/realtime (SSE)    │
└───────────────────────────────────┘        └─────────────────────────────┘
```

### The RPC bridge

In a real TanStack Start app, `createServerFn().handler(reactive.query(...))`
generates the client↔server RPC wrapper for you. This example has no Start, so
it ships a **minimal stand-in**:

- **Server** ([`src/server.ts`](./src/server.ts)) exposes
  `POST /api/rpc/:fn` — it looks the reactive fn up by name, runs it with the
  JSON body, and returns its result (`{ data, channel, channels }` for queries;
  the row for mutations). The SSE stream stays on `GET /api/realtime`.
- **Client** ([`src/serverFns.ts`](./src/serverFns.ts)) provides hand-written
  `fetch` proxies typed as `ReactiveQueryFn` / `ReactiveMutationFn`. `useQuery`
  consumes the proxy's `{ data, channels }` and auto-subscribes to every
  channel; `useMutation` consumes the mutation proxy.

> In production you delete the RPC bridge and use `createServerFn` — the server
> fns and client usage are otherwise identical.

### The reactive engine

The composition in [`src/server.ts`](./src/server.ts) (no channel strings
anywhere):

```ts
const db = wrapReactiveDb(drizzle(pglite, { schema: { todos } }))
const reactive = createReactiveQueries()
const sse = createSseHandler({ onChannelEmpty: reactive.onChannelEmpty })
reactive.bindPublish((ch, data) => {
  sse.broadcast(ch, data) // void
  return Promise.resolve() // PublishFn must return Promise<void>
})

const getTodos = reactive.query(async ({ teamId }) =>
  db.select().from(todos).where(eq(todos.teamId, teamId)),
)
const createTodo = reactive.mutation(async ({ teamId, title }) => {
  return (await db.insert(todos).values({ ... }).returning())[0]
})
```

`query()` runs the read inside a reactive context, captures the emitted SQL,
derives a channel (e.g. `todos:teamId=alpha:q=…`), registers a subscription, and
returns `{ data, channel, channels }`. `mutation()` runs the write, captures the
affected rows, finds every subscription whose predicate (`team_id = $1`) matches,
re-runs those queries, and publishes one atomic batch. `RealtimeProvider`
subscribes to that batch channel automatically and fans updates out to the
right `useQuery` collections.

## What it exercises

| API                                                | Where                          |
| -------------------------------------------------- | ------------------------------ |
| `createReactiveQueries` (`query` / `mutation`)     | `src/server.ts`                |
| `wrapReactiveDb` + `drizzle-orm/pglite`            | `src/server.ts`                |
| `createSseHandler` (`broadcast`, `onChannelEmpty`) | `src/server.ts`                |
| `reactive.bindPublish`                             | `src/server.ts`                |
| pg-core Drizzle schema (Postgres dialect)          | `src/schema.ts`                |
| `ReactiveQueryFn` / `ReactiveMutationFn` proxies   | `src/serverFns.ts`             |
| `useQuery` (auto channel subscription)             | `src/App.tsx`                  |
| `useMutation` (`optimistic`)                       | `src/App.tsx`                  |
| `useConnectionStatus`, `RealtimeProvider`          | `src/App.tsx` / `src/main.tsx` |

## Run

```sh
pnpm install          # from the repo root
pnpm --filter @realtimejs-example/reactive-queries dev
```

Open <http://localhost:5173> in **two browser tabs**. Add, toggle, vote, or
delete a todo in one tab — the other tab's list updates automatically. No
channel was ever named: the engine derived it from the query's SQL.

## Scripts

- `dev` — start the Vite dev server (client + reactive SSE/RPC server middleware)
- `build` — production client build (`vite build`)
- `typecheck` — `tsc --noEmit`
