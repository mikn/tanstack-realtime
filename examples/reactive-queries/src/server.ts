/**
 * Reactive-queries demo server — the HEADLINE feature of realtime.js.
 *
 * This server shows auto-invalidating reactive server queries with ZERO manual
 * channel wiring. A `useQuery` on one client stays live to mutations made by
 * ANY client, because the reactive engine derives the channel from the SQL the
 * query emits and republishes fresh data whenever a matching write lands.
 *
 * How the pieces fit together:
 *
 *  - `@electric-sql/pglite` is embedded Postgres (WASM). It runs in-process with
 *    NO external database to install — that's why this example is zero-setup.
 *  - `wrapReactiveDb(drizzle(...))` proxies the Drizzle client so every
 *    `select()/insert()/update()/delete()` it runs *inside a reactive context*
 *    is captured (the emitted SQL + `$N` params for reads; the affected rows for
 *    writes). The engine parses that SQL with `pgsql-ast-parser`, so it MUST be
 *    the **Postgres dialect** (see `schema.ts`).
 *  - `createReactiveQueries()` is the engine: `query()` wraps a read fn (captures
 *    its SQL → derives a channel → registers a subscription → returns
 *    `{ data, channel, channels }`), `mutation()` wraps a write fn (captures the
 *    write → invalidates every subscription whose predicate matches → republishes).
 *  - `createSseHandler()` is the transport. We compose them: the handler's
 *    `onChannelEmpty` is wired to the engine (so subscriptions are torn down when
 *    the last subscriber leaves), and the engine's `bindPublish` is wired to the
 *    handler's `broadcast` (so invalidation batches fan out over SSE).
 *
 * In a real TanStack Start app, `createServerFn().handler(reactive.query(...))`
 * is the RPC layer. Here there is no Start, so the `POST /api/rpc/:fn` endpoint
 * below is a MINIMAL stand-in: it looks the fn up by name, runs it with the JSON
 * body, and returns its result. The client calls it with `fetch` (`serverFns.ts`).
 */
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { eq } from 'drizzle-orm'
import { serializeKey } from '@realtimejs/core'
import { createSseHandler } from '@realtimejs/adapter-sse'
import {
  createReactiveQueries,
  wrapReactiveDb,
} from '@realtimejs/reactive-drizzle'
import { todos } from './schema.js'

interface ReactiveServer {
  /** Handles the SSE GET stream + POST client actions on /api/realtime. */
  handleRealtime: (req: Request) => Promise<Response>
  /** Handles POST /api/rpc/:fn. Returns null when the path is unmatched. */
  handleRpc: (req: Request) => Promise<Response | null>
}

/**
 * Define the reactive server functions over a wrapped db + engine.
 *
 * NO channel strings appear anywhere below. `query()` derives the channel from
 * the SELECT's SQL; `mutation()` derives which channels to invalidate from the
 * rows the INSERT/UPDATE/DELETE touched. That is the whole point.
 */
function buildFns(
  reactive: ReturnType<typeof createReactiveQueries>,
  db: ReturnType<typeof wrapReactiveDb<ReturnType<typeof drizzle>>>,
) {
  const getTodos = reactive.query(async (args: { teamId: string }) =>
    db.select().from(todos).where(eq(todos.teamId, args.teamId)),
  )

  const createTodo = reactive.mutation(
    async (args: { teamId: string; title: string }) => {
      const id = crypto.randomUUID()
      // `.returning()` gives the engine the affected row so it can match the
      // row against each subscription's predicate (here `team_id = $1`).
      const [row] = await db
        .insert(todos)
        .values({ id, teamId: args.teamId, title: args.title })
        .returning()
      return row
    },
  )

  const toggleTodo = reactive.mutation(
    async (args: { id: string; done: boolean }) => {
      const [row] = await db
        .update(todos)
        .set({ done: args.done })
        .where(eq(todos.id, args.id))
        .returning()
      return row
    },
  )

  const voteTodo = reactive.mutation(
    async (args: { id: string; delta: number }) => {
      const current = await db.select().from(todos).where(eq(todos.id, args.id))
      const currentVotes = current.length > 0 ? current[0].votes : 0
      const [row] = await db
        .update(todos)
        .set({ votes: currentVotes + args.delta })
        .where(eq(todos.id, args.id))
        .returning()
      return row
    },
  )

  const deleteTodo = reactive.mutation(async (args: { id: string }) => {
    const [row] = await db
      .delete(todos)
      .where(eq(todos.id, args.id))
      .returning()
    return row
  })

  return { getTodos, createTodo, toggleTodo, voteTodo, deleteTodo }
}

/**
 * Build the reactive server. Async because pglite + the schema migration boot
 * asynchronously; the Vite plugin awaits this once on startup.
 */
export async function createReactiveServer(): Promise<ReactiveServer> {
  // 1. Embedded Postgres + Drizzle. `wrapReactiveDb` makes reads/writes
  //    captured whenever they run inside a reactive context.
  const pglite = new PGlite()
  const db = wrapReactiveDb(drizzle(pglite, { schema: { todos } }))

  // Create the table + seed a row. pglite has no migration runner, so we run
  // raw DDL once on boot.
  await pglite.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id text PRIMARY KEY,
      team_id text NOT NULL,
      title text NOT NULL,
      done boolean NOT NULL DEFAULT false,
      votes integer NOT NULL DEFAULT 0
    );
  `)
  await pglite.exec(`
    INSERT INTO todos (id, team_id, title, done, votes)
    VALUES ('seed-1', 'alpha', 'Open a second tab — this list stays in sync', false, 0)
    ON CONFLICT (id) DO NOTHING;
  `)

  // 2. The reactive engine.
  const reactive = createReactiveQueries()

  // 3. The transport. Wire the engine's onChannelEmpty in so a channel's
  //    subscription is dropped when its last SSE subscriber disconnects.
  const sse = createSseHandler({
    pingInterval: 0,
    onChannelEmpty: reactive.onChannelEmpty,
  })

  // 4. Wire the handler's broadcast back into the engine so invalidation
  //    batches fan out to subscribed clients.
  reactive.bindPublish((channel, data) => {
    // The engine publishes string channels (the batch channel); serialize
    // defensively to satisfy the `QueryKey | string` publish signature.
    sse.broadcast(
      typeof channel === 'string' ? channel : serializeKey(channel),
      data,
    )
    return Promise.resolve()
  })

  const fns = buildFns(reactive, db)

  // The RPC registry. The keys here MUST match the names the client proxies
  // POST to (see `serverFns.ts`).
  // `undefined` in the value type so the unknown-name guard below is legitimate
  // (an arbitrary path segment may not be a registered fn at runtime).
  const rpc = fns as Record<
    string,
    ((args: unknown) => Promise<unknown>) | undefined
  >

  function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  async function handleRpc(req: Request): Promise<Response | null> {
    const url = new URL(req.url)
    const match = url.pathname.match(/^\/api\/rpc\/(.+)$/)
    if (!match) return null
    if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

    const fn = rpc[match[1]]
    if (!fn) return json({ error: `unknown fn: ${match[1]}` }, 404)

    let args: unknown
    try {
      args = await req.json()
    } catch {
      args = {}
    }

    // Queries return `{ data, channel, channels }`; mutations return the row.
    // Both are JSON-serialised verbatim — the client consumes them as-is.
    const result = await fn(args)
    return json(result)
  }

  return {
    handleRealtime: (req) => sse.handle(req),
    handleRpc,
  }
}
