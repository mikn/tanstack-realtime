<script setup lang="ts">
/**
 * LiveChannelPanel — exercises liveChannelOptions.
 * Pattern: append-only event stream (chat messages).
 */
import { ref } from 'vue'
import { liveChannelOptions } from '@realtimejs/vue'
import { client, userId } from '../transport.js'
import { useCollectionSync } from '../useCollectionSync.js'

interface ChatMessage {
  id: string
  text: string
  author: string
  ts: number
}

const CHANNEL = 'e2e-chat'
let msgCounter = 0
const inputValue = ref('')

const messages = useCollectionSync<ChatMessage>(() =>
  liveChannelOptions<ChatMessage, string>({
    client,
    id: 'e2e-chat-collection-vue',
    channel: CHANNEL,
    getKey: (m) => m.id,
    onEvent: (raw) => {
      const e = raw as {
        type?: string
        id?: string
        text?: string
        author?: string
        ts?: number
      }
      if (e.type !== 'message') return null
      return { id: e.id!, text: e.text!, author: e.author!, ts: e.ts! }
    },
  }),
)

function sendMessage() {
  const text = inputValue.value.trim()
  if (!text) return
  void client.publish(CHANNEL, {
    type: 'message',
    id: `msg-${userId}-${++msgCounter}-${Date.now()}`,
    text,
    author: userId,
    ts: Date.now(),
  })
  inputValue.value = ''
}
</script>

<template>
  <div class="panel" data-testid="live-channel-panel">
    <h2>liveChannelOptions — Chat</h2>
    <input
      data-testid="chat-input"
      type="text"
      placeholder="Message…"
      v-model="inputValue"
      @keydown.enter="sendMessage"
    />
    <button data-testid="send-message" @click="sendMessage">Send</button>
    <div data-testid="chat-messages" style="margin-top: 8px">
      <div v-for="msg in messages" :key="msg.id" class="list-item">
        <span class="tag">{{ msg.author }}</span>
        <span style="flex: 1">{{ msg.text }}</span>
      </div>
    </div>
  </div>
</template>
