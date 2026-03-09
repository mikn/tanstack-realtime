<script setup lang="ts">
/**
 * RealtimeCollectionPanel — exercises realtimeCollectionOptions.
 * Pattern: server-synced collection with insert / delete semantics.
 */
import { ref } from 'vue'
import { realtimeCollectionOptions } from '@tanstack/vue-realtime'
import { client, userId } from '../transport.js'
import { useCollectionSync } from '../useCollectionSync.js'

interface Todo {
  id: string
  text: string
  author: string
}

const CHANNEL = 'e2e-todos'
let counter = 0
const inputValue = ref('')

const todos = useCollectionSync<Todo>(
  () =>
    realtimeCollectionOptions<Todo, string>({
      client,
      id: 'e2e-todos-collection-vue',
      channel: CHANNEL,
      getKey: (t) => t.id,
    }),
  (t) => t.id,
)

function addTodo() {
  const text = inputValue.value.trim()
  if (!text) return
  const id = `todo-${userId}-${++counter}-${Date.now()}`
  void client.publish(CHANNEL, {
    action: 'insert',
    data: { id, text, author: userId },
  })
  inputValue.value = ''
}

function deleteTodo(id: string) {
  void client.publish(CHANNEL, { action: 'delete', data: { id } })
}
</script>

<template>
  <div class="panel" data-testid="realtime-collection-panel">
    <h2>realtimeCollectionOptions — Todos</h2>
    <input
      data-testid="todo-input"
      type="text"
      placeholder="Todo text…"
      v-model="inputValue"
      @keydown.enter="addTodo"
    />
    <button data-testid="add-todo" @click="addTodo">Add</button>
    <div data-testid="todo-list" style="margin-top: 8px">
      <div
        v-for="todo in todos"
        :key="todo.id"
        class="list-item"
        :data-todo-id="todo.id"
      >
        <span style="flex: 1">{{ todo.text }}</span>
        <span class="tag">{{ todo.author }}</span>
        <button
          class="danger"
          data-testid="delete-todo"
          @click="deleteTodo(todo.id)"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>
