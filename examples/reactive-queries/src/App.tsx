/**
 * Reactive-queries UI.
 *
 * `useQuery(getTodos, { teamId }, ...)` fetches the list AND subscribes to the
 * channel(s) the server derived from the SELECT's SQL — we never name a channel.
 * `useMutation(createTodo, ...)` POSTs to the server fn; the engine sees the
 * INSERT, matches it against the live `getTodos` subscription's predicate
 * (`team_id = $1`), re-runs the query, and republishes. Every tab's `useQuery`
 * updates. The same holds for toggle / vote / delete.
 *
 * Optimistic updates make the local tab feel instant; the server push then
 * confirms (and is what drives OTHER tabs).
 */
import { useState } from 'react'
import { useConnectionStatus, useMutation, useQuery } from '@realtimejs/react'
import {
  createTodo,
  deleteTodo,
  getTodos,
  toggleTodo,
  voteTodo,
} from './serverFns.js'
import type { Todo } from './schema.js'

const TEAM_ID = 'alpha'

export function App() {
  const status = useConnectionStatus()
  const [draft, setDraft] = useState('')

  const { data, isPending } = useQuery(
    getTodos,
    { teamId: TEAM_ID },
    { getKey: (t) => t.id },
  )

  const create = useMutation(createTodo, {
    optimistic: (cache, args) => {
      cache.update(getTodos, { teamId: args.teamId }, (prev) => [
        ...prev,
        {
          id: `optimistic-${Date.now()}`,
          teamId: args.teamId,
          title: args.title,
          done: false,
          votes: 0,
        } satisfies Todo,
      ])
    },
  })

  const toggle = useMutation(toggleTodo, {
    optimistic: (cache, args) => {
      cache.update(getTodos, { teamId: TEAM_ID }, (prev) =>
        prev.map((t) => (t.id === args.id ? { ...t, done: args.done } : t)),
      )
    },
  })

  const vote = useMutation(voteTodo, {
    optimistic: (cache, args) => {
      cache.update(getTodos, { teamId: TEAM_ID }, (prev) =>
        prev.map((t) =>
          t.id === args.id ? { ...t, votes: t.votes + args.delta } : t,
        ),
      )
    },
  })

  const remove = useMutation(deleteTodo, {
    optimistic: (cache, args) => {
      cache.update(getTodos, { teamId: TEAM_ID }, (prev) =>
        prev.filter((t) => t.id !== args.id),
      )
    },
  })

  function addTodo() {
    const title = draft.trim()
    if (!title) return
    void create.mutate({ teamId: TEAM_ID, title })
    setDraft('')
  }

  return (
    <>
      <h1>Reactive Queries</h1>
      <p className="sub">
        Open this page in two browser tabs. A mutation in one tab updates the
        other tab&apos;s <code>useQuery</code> automatically — the reactive
        engine derives the channel from the SQL. No channel wiring anywhere.
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

      {isPending ? (
        <p className="sub">Loading…</p>
      ) : (
        data.map((todo) => (
          <div key={todo.id} className={`todo ${todo.done ? 'done' : ''}`}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={(e) =>
                void toggle.mutate({ id: todo.id, done: e.target.checked })
              }
            />
            <span className="text">{todo.title}</span>
            <button
              className="ghost"
              onClick={() => void vote.mutate({ id: todo.id, delta: -1 })}
            >
              −
            </button>
            <span className="votes">{todo.votes}</span>
            <button
              className="ghost"
              onClick={() => void vote.mutate({ id: todo.id, delta: 1 })}
            >
              +
            </button>
            <button
              className="ghost"
              onClick={() => void remove.mutate({ id: todo.id })}
            >
              ✕
            </button>
          </div>
        ))
      )}
    </>
  )
}
