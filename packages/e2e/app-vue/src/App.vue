<script setup lang="ts">
/**
 * App root — provides the RealtimeProvider and renders AppInner.
 */
import { RealtimeProvider } from '@tanstack/vue-realtime'
import { client } from './transport.js'
import AppInner from './AppInner.vue'
</script>

<template>
  <RealtimeProvider :client="client">
    <AppInner />
  </RealtimeProvider>
</template>
