<script setup lang="ts">
/**
 * PresencePanel — exercises presenceChannelOptions / usePresence.
 * Also demonstrates useSyncedValue within the same panel.
 *
 * Re-announces presence every 2 s so late-joining peers can discover us.
 */
import { onMounted, onUnmounted, ref } from 'vue'
import { usePresence, useSyncedValue } from '@tanstack/vue-realtime'
import { roomPresence, sharedValue } from '../defs.js'
import { userId } from '../transport.js'

interface UserPresenceData {
  name: string
  status: string
}

const HEARTBEAT_MS = 2_000

const { others, updatePresence } = usePresence<UserPresenceData>(roomPresence, {
  params: {},
  initial: { name: userId, status: 'online' },
})

// Re-announce presence for late joiners.
let heartbeatId: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  heartbeatId = setInterval(() => {
    updatePresence({ name: userId, status: 'online' })
  }, HEARTBEAT_MS)
})
onUnmounted(() => {
  if (heartbeatId !== null) clearInterval(heartbeatId)
})

const { value: sharedText, set: setSharedText } = useSyncedValue<string>(
  sharedValue,
  { params: {}, initial: '' },
)

const localInput = ref(sharedText.value)

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  localInput.value = val
  setSharedText(val)
}
</script>

<template>
  <div class="panel" data-testid="presence-panel">
    <h2>usePresence — Online Users</h2>
    <div data-testid="presence-users">
      <span v-if="others.length === 0" style="color: #888; font-size: 12px">
        No other users online
      </span>
      <div v-for="u in others" :key="u.connectionId" class="list-item">
        <span>{{
          (u.data as UserPresenceData | undefined)?.name ?? u.connectionId
        }}</span>
        <span class="tag">{{
          (u.data as UserPresenceData | undefined)?.status
        }}</span>
      </div>
    </div>
    <button
      data-testid="set-status-away"
      style="margin-top: 8px"
      @click="updatePresence({ name: userId, status: 'away' })"
    >
      Set Away
    </button>

    <h2 style="margin-top: 12px">useSyncedValue — Shared Text (LWW)</h2>
    <input
      data-testid="value-input"
      type="text"
      placeholder="Type a shared value…"
      :value="sharedText"
      @input="onInput"
    />
    <div data-testid="value-display" style="margin-top: 4px; color: #555">
      <em v-if="!sharedText" style="color: #aaa">empty</em>
      <template v-else>{{ sharedText }}</template>
    </div>
  </div>
</template>
