/**
 * In-memory "bring your own backend" server for the collaborative todos demo.
 *
 * There is NO database and NO ORM here — just a JavaScript Map. This is the
 * explicit BYOB showcase: realtime.js does not care where your data lives, it
 * only needs a transport (SSE) and a channel to broadcast mutations on.
 *
 * Responsibilities:
 *  - `GET  /api/todos`  → returns the current todo list (queryFn source).
 *  - `POST /api/todos`  → create a todo, broadcast `{ action: 'insert', data }`.
 *  - `PATCH /api/todos/:id` → update a todo, broadcast `{ action: 'update', data }`.
 *  - `DELETE /api/todos/:id` → delete a todo, broadcast `{ action: 'delete', data }`.
 *  - SSE stream + client actions are delegated to `createSseHandler`.
 *
 * The REST mutations persist into the Map and then call `handler.broadcast` so
 * every connected client converges. CRDT fields on the client (`votes` as a
 * `pn-counter`, `text` as `lww`) make concurrent edits converge without loss.
 */
import { createSseHandler } from '@realtimejs/adapter-sse'

interface Todo {
  id: string
  text: string
  votes: number
  done: boolean
}

const TODOS_CHANNEL = 'todos'

interface TodosServer {
  /** Handles the SSE GET stream and POST client actions on /api/realtime. */
  handleRealtime: (req: Request) => Promise<Response>
  /** Handles REST CRUD on /api/todos. Returns null when the path is unmatched. */
  handleRest: (req: Request) => Promise<Response | null>
}

export function createTodosServer(): TodosServer {
  const sse = createSseHandler({ pingInterval: 0 })

  // The entire "database" — an in-memory Map. Swap this for Postgres, SQLite,
  // Redis, or anything else; the realtime wiring stays identical.
  const store = new Map<string, Todo>()
  store.set('seed-1', {
    id: 'seed-1',
    text: 'Try editing this from two browser tabs',
    votes: 0,
    done: false,
  })

  function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  async function handleRest(req: Request): Promise<Response | null> {
    const url = new URL(req.url)
    if (!url.pathname.startsWith('/api/todos')) return null

    const idMatch = url.pathname.match(/^\/api\/todos\/(.+)$/)
    const id = idMatch ? decodeURIComponent(idMatch[1]) : null

    // GET /api/todos — list (used by the collection's queryFn).
    if (req.method === 'GET' && !id) {
      return json([...store.values()])
    }

    // POST /api/todos — create.
    if (req.method === 'POST' && !id) {
      const body = (await req.json()) as Partial<Todo>
      const todo: Todo = {
        id: body.id ?? crypto.randomUUID(),
        text: body.text ?? '',
        votes: body.votes ?? 0,
        done: body.done ?? false,
      }
      store.set(todo.id, todo)
      sse.broadcast(TODOS_CHANNEL, { action: 'insert', data: todo })
      return json(todo, 201)
    }

    // PATCH /api/todos/:id — update (merges partial fields).
    if (req.method === 'PATCH' && id) {
      const existing = store.get(id)
      if (!existing) return json({ error: 'not found' }, 404)
      const patch = (await req.json()) as Partial<Todo>
      const updated: Todo = { ...existing, ...patch, id }
      store.set(id, updated)
      sse.broadcast(TODOS_CHANNEL, { action: 'update', data: updated })
      return json(updated)
    }

    // DELETE /api/todos/:id — delete.
    if (req.method === 'DELETE' && id) {
      const existing = store.get(id)
      store.delete(id)
      sse.broadcast(TODOS_CHANNEL, {
        action: 'delete',
        data: existing ?? { id },
      })
      return json({ ok: true })
    }

    return json({ error: 'method not allowed' }, 405)
  }

  return {
    handleRealtime: (req) => sse.handle(req),
    handleRest,
  }
}
