<script setup lang="ts">
/**
 * EphemeralPanel — exercises ephemeralLiveOptions.
 * Pattern: short-lived state that auto-expires after a TTL.
 */
import { ephemeralLiveOptions } from '@realtimejs/vue'
import { client, userId } from '../transport.js'
import { useCollectionSync } from '../useCollectionSync.js'

interface TypingUser {
  userId: string
  name: string
}

const CHANNEL = 'e2e-typing'
// 2 s TTL — short enough for a Playwright test to witness expiry.
const TTL = 2000

const typingUsers = useCollectionSync<TypingUser>(
  () =>
    ephemeralLiveOptions<TypingUser, string>({
      client,
      id: 'e2e-typing-collection-vue',
      channel: CHANNEL,
      getKey: (u) => u.userId,
      onEvent: (raw) => {
        const e = raw as { type?: string; userId?: string; name?: string }
        if (e.type !== 'typing') return null
        return { userId: e.userId!, name: e.name! }
      },
      ttl: TTL,
    }),
  (u) => u.userId,
)

function startTyping() {
  void client.publish(CHANNEL, { type: 'typing', userId, name: userId })
}
</script>

<template>
  <div class="panel" data-testid="ephemeral-panel">
    <h2>ephemeralLiveOptions — Typing Indicators (TTL {{ TTL }}ms)</h2>
    <button data-testid="start-typing" @click="startTyping">
      Send Typing Event
    </button>
    <div data-testid="typing-indicators" style="margin-top: 8px">
      <span
        v-if="typingUsers.length === 0"
        style="color: #aaa; font-size: 12px"
      >
        No one typing
      </span>
      <div v-for="u in typingUsers" :key="u.userId" class="list-item">
        <span>{{ u.name }} is typing…</span>
      </div>
    </div>
  </div>
</template>
