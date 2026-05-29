/**
 * Collaborative todo list backed by `useRealtimeCollection` + CRDT fields.
 *
 * - `text` is an `lww` (last-write-wins) field: concurrent edits resolve to the
 *   latest writer deterministically.
 * - `votes` is a `pn-counter`: concurrent increments from many tabs all add up
 *   without lost updates.
 * - `done` is a plain (incoming-wins) field.
 *
 * The collection uses the REST shorthand (`url`) so `queryFn` + CRUD callbacks
 * are generated automatically. This example uses the **client-authoritative**
 * CRDT path (`optimistic: true` + `fields`, NO `serverAuthoritative`):
 *
 *  - The server's REST endpoints are pure persistence + the source of truth for
 *    the initial load (`GET /api/todos`).
 *  - After a local mutation, the mutating client publishes a message back over
 *    the `todos` channel carrying the per-field `_crdt` header (e.g. the PN
 *    counter `inc`/`dec` maps for `votes`). Peers merge that header with
 *    `mergePn` so concurrent upvotes from many tabs always add up — no lost
 *    updates and no forced reset to 0.
 *  - The server does NOT re-broadcast a plain (header-less) row for these
 *    mutations; doing so would race with / overwrite the CRDT-merged value on
 *    peers. Peer sync flows exclusively through the client's CRDT publish-back.
 */
import { useState } from 'react'
import { useConnectionStatus, useRealtimeCollection } from '@realtimejs/react'
import { useLiveQuery } from '@tanstack/react-db'

interface Todo {
  id: string
  text: string
  votes: number
  done: boolean
}

export function App() {
  const status = useConnectionStatus()
  const [draft, setDraft] = useState('')

  const todos = useRealtimeCollection<Todo>({
    url: '/api/todos',
    getKey: (t) => t.id,
    // CRDT convergence per field — see file header.
    fields: { text: 'lww', votes: 'pn-counter' },
    // Client-authoritative CRDT path: the mutating client publishes the `_crdt`
    // header back over the `todos` channel; `optimistic` enables echo
    // suppression so we don't re-apply our own publish.
    optimistic: true,
  })

  const { data } = useLiveQuery((q) =>
    q.from({ todos }).orderBy(({ todos: t }) => t.id, 'asc'),
  )

  function addTodo() {
    const text = draft.trim()
    if (!text) return
    todos.insert({ id: crypto.randomUUID(), text, votes: 0, done: false })
    setDraft('')
  }

  return (
    <>
      <h1>Collaborative Todos</h1>
      <p className="sub">
        Open this page in two browser tabs and watch edits, votes, and
        completion converge in real time.
      </p>
      <div className="status">
        <span className={`dot ${status === 'connected' ? 'connected' : ''}`} />
        {status}
      </div>

      <div className="add">
        <input
          type="text"
          placeholder="Add a todo…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addTodo()
          }}
        />
        <button onClick={addTodo}>Add</button>
      </div>

      {data.map((todo) => (
        <div key={todo.id} className={`todo ${todo.done ? 'done' : ''}`}>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={(e) =>
              todos.update(todo.id, (draft) => {
                draft.done = e.target.checked
              })
            }
          />
          <span className="text">{todo.text}</span>
          <button
            className="ghost"
            onClick={() =>
              todos.update(todo.id, (draft) => {
                draft.votes -= 1
              })
            }
          >
            −
          </button>
          <span className="votes">{todo.votes}</span>
          <button
            className="ghost"
            onClick={() =>
              todos.update(todo.id, (draft) => {
                draft.votes += 1
              })
            }
          >
            +
          </button>
          <button className="ghost" onClick={() => todos.delete(todo.id)}>
            ✕
          </button>
        </div>
      ))}
    </>
  )
}
