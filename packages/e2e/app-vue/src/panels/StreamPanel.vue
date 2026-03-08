<script setup lang="ts">
/**
 * StreamPanel — exercises streamChannelOptions / useStream.
 * Pattern: reduce-based stream accumulation.
 */
import { useStream } from '@tanstack/vue-realtime'
import { textStream } from '../defs.js'
import { client } from '../transport.js'

const STREAM_CHANNEL = 'e2e-stream'

const { state, status } = useStream(textStream, { params: {} })

async function startStream() {
  const tokens = ['Hello', ' ', 'World', '!']
  for (const token of tokens) {
    await client.publish(STREAM_CHANNEL, { type: 'token', token })
    await new Promise((r) => setTimeout(r, 30))
  }
  await client.publish(STREAM_CHANNEL, { type: 'done' })
}
</script>

<template>
  <div class="panel" data-testid="stream-panel">
    <h2>streamChannelOptions / useStream — Token Accumulation</h2>
    <button data-testid="start-stream" @click="startStream">
      Start Stream
    </button>
    <div style="margin-top: 8px">
      <span style="font-size: 11px; color: #888">Status: </span>
      <span data-testid="stream-status">{{ status }}</span>
    </div>
    <div
      data-testid="stream-content"
      style="
        margin-top: 4px;
        padding: 8px;
        background: #f3f4f6;
        border-radius: 4px;
        min-height: 32px;
        font-family: monospace;
        font-size: 13px;
      "
    >
      <em v-if="!state.content" style="color: #aaa">waiting…</em>
      <template v-else>{{ state.content }}</template>
    </div>
  </div>
</template>
