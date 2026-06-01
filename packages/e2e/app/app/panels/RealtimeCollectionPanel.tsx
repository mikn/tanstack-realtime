/**
 * RealtimeCollectionPanel — exercises realtimeCollectionOptions.
 *
 * Pattern: server-synced collection with insert / delete semantics.
 * User A publishes { action: 'insert', data: { id, text } } → User B's
 * collection receives it and shows the new row.
 *
 * Centrifugo is configured to echo publishes back to subscribers, so both
 * users see every insert/delete (including their own).
 */

import { useRef, useState } from 'react'
import { realtimeCollectionOptions } from '@realtimejs/core'
import { client, userId } from '../transport.js'
import { useCollectionSync } from '../useCollectionSync.js'

interface Todo {
  id: string
  text: string
  author: string
}

const CHANNEL = 'e2e-todos'

export function RealtimeCollectionPanel() {
  const [inputValue, setInputValue] = useState('')
  const counterRef = useRef(0)

  const todos = useCollectionSync<Todo>(
    () =>
      realtimeCollectionOptions<Todo, string>({
        client,
        id: 'e2e-todos-collection',
        channel: CHANNEL,
        getKey: (t) => t.id,
      }),
    (t) => t.id,
  )

  function addTodo() {
    const text = inputValue.trim()
    if (!text) return
    const id = `todo-${userId}-${++counterRef.current}-${Date.now()}`
    void client.publish(CHANNEL, {
      action: 'insert',
      data: { id, text, author: userId },
    })
    setInputValue('')
  }

  function deleteTodo(id: string) {
    void client.publish(CHANNEL, {
      action: 'delete',
      data: { id },
    })
  }

  return (
    <div className="panel" data-testid="realtime-collection-panel">
      <h2>realtimeCollectionOptions — Todos</h2>
      <input
        data-testid="todo-input"
        type="text"
        placeholder="Todo text…"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addTodo()}
      />
      <button data-testid="add-todo" onClick={addTodo}>
        Add
      </button>
      <div data-testid="todo-list" style={{ marginTop: 8 }}>
        {todos.map((todo) => (
          <div key={todo.id} className="list-item" data-todo-id={todo.id}>
            <span style={{ flex: 1 }}>{todo.text}</span>
            <span className="tag">{todo.author}</span>
            <button
              className="danger"
              data-testid="delete-todo"
              onClick={() => deleteTodo(todo.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
