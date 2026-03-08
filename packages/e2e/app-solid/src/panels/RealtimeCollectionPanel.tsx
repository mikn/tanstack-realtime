/**
 * RealtimeCollectionPanel — exercises realtimeCollectionOptions.
 * Pattern: server-synced collection with insert / delete semantics.
 */
import { For, createSignal } from 'solid-js'
import { realtimeCollectionOptions } from '@tanstack/realtime'
import { client, userId } from '../transport.js'
import { createCollectionSync } from '../createCollectionSync.js'

interface Todo {
  id: string
  text: string
  author: string
}

const CHANNEL = 'e2e-todos'
let counterSolid = 0

export function RealtimeCollectionPanel() {
  const [inputValue, setInputValue] = createSignal('')

  const todos = createCollectionSync<Todo>(
    () =>
      realtimeCollectionOptions<Todo, string>({
        client,
        id: 'e2e-todos-collection-solid',
        channel: CHANNEL,
        getKey: (t) => t.id,
      }),
    (t) => t.id,
  )

  function addTodo() {
    const text = inputValue().trim()
    if (!text) return
    const id = `todo-${userId}-${++counterSolid}-${Date.now()}`
    void client.publish(CHANNEL, {
      action: 'insert',
      data: { id, text, author: userId },
    })
    setInputValue('')
  }

  function deleteTodo(id: string) {
    void client.publish(CHANNEL, { action: 'delete', data: { id } })
  }

  return (
    <div class="panel" data-testid="realtime-collection-panel">
      <h2>realtimeCollectionOptions — Todos</h2>
      <input
        data-testid="todo-input"
        type="text"
        placeholder="Todo text…"
        value={inputValue()}
        onInput={(e) => setInputValue(e.currentTarget.value)}
        onKeyDown={(e) => e.key === 'Enter' && addTodo()}
      />
      <button data-testid="add-todo" onClick={addTodo}>
        Add
      </button>
      <div data-testid="todo-list" style={{ 'margin-top': '8px' }}>
        <For each={todos()}>
          {(todo) => (
            <div class="list-item" data-todo-id={todo.id}>
              <span style={{ flex: '1' }}>{todo.text}</span>
              <span class="tag">{todo.author}</span>
              <button
                class="danger"
                data-testid="delete-todo"
                onClick={() => deleteTodo(todo.id)}
              >
                ×
              </button>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
