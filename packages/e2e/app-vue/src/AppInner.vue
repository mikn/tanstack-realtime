<script setup lang="ts">
/**
 * AppInner — renders all realtime pattern panels once connected.
 * Must be a child of <RealtimeProvider> so useConnectionStatus() resolves.
 */
import { ref, watchEffect } from 'vue'
import { useConnectionStatus } from '@realtimejs/vue'
import StatusBar from './panels/StatusBar.vue'
import RealtimeCollectionPanel from './panels/RealtimeCollectionPanel.vue'
import LiveChannelPanel from './panels/LiveChannelPanel.vue'
import PresencePanel from './panels/PresencePanel.vue'
import EphemeralPanel from './panels/EphemeralPanel.vue'
import StreamPanel from './panels/StreamPanel.vue'
import TickPanel from './panels/TickPanel.vue'
import SyncedPanel from './panels/SyncedPanel.vue'

const status = useConnectionStatus()
const hasConnected = ref(status.value === 'connected')

watchEffect(() => {
  if (status.value === 'connected') hasConnected.value = true
})
</script>

<template>
  <StatusBar />
  <div v-if="hasConnected" id="app">
    <RealtimeCollectionPanel />
    <LiveChannelPanel />
    <PresencePanel />
    <EphemeralPanel />
    <StreamPanel />
    <TickPanel />
    <SyncedPanel />
  </div>
</template>
