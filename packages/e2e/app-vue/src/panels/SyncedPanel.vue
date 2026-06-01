<script setup lang="ts">
/**
 * SyncedPanel — exercises useSyncedCounter and useSyncedSet.
 * Patterns: PN-Counter CRDT and OR-Set CRDT.
 */
import { useSyncedCounter, useSyncedSet } from '@realtimejs/vue'
import { sharedCounter, sharedSet } from '../defs.js'

const {
  value: count,
  increment,
  decrement,
} = useSyncedCounter(sharedCounter, { params: {}, initial: 0 })

const {
  values: tags,
  add: addTag,
  remove: removeTag,
} = useSyncedSet<string>(sharedSet, { params: {}, initial: [] })
</script>

<template>
  <div class="panel" data-testid="synced-panel">
    <h2>useSyncedCounter — PN-Counter CRDT</h2>
    <div
      style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px"
    >
      <button data-testid="counter-decrement" @click="decrement()">−</button>
      <span
        data-testid="counter-value"
        style="font-weight: 600; font-size: 16px"
        >{{ count }}</span
      >
      <button data-testid="counter-increment" @click="increment()">+</button>
    </div>

    <h2 style="margin-top: 8px">useSyncedSet — OR-Set CRDT</h2>
    <div style="display: flex; gap: 4px; margin-bottom: 6px">
      <button data-testid="set-add-a" @click="addTag('item-a')">
        + item-a
      </button>
      <button data-testid="set-add-b" @click="addTag('item-b')">
        + item-b
      </button>
      <button
        data-testid="set-remove-a"
        class="danger"
        @click="removeTag('item-a')"
      >
        − item-a
      </button>
    </div>
    <div data-testid="set-display">
      <span v-if="tags.length === 0" style="color: #aaa; font-size: 12px">
        empty set
      </span>
      <span
        v-for="tag in tags"
        :key="tag"
        class="tag"
        style="margin-right: 4px"
      >
        {{ tag }}
      </span>
    </div>
  </div>
</template>
