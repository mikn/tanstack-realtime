/**
 * Channel definitions for every realtime pattern the library supports.
 * Defined at module level and shared across components (stable references).
 */

import {
  createPresenceChannel,
  createStreamChannel,
  defineSyncedCounter,
  defineSyncedSet,
  defineSyncedValue,
} from '@tanstack/vue-realtime'

// ---------------------------------------------------------------------------
// Presence channel — usePresence
// ---------------------------------------------------------------------------

export const roomPresence = createPresenceChannel({
  id: 'e2e-room-presence',
  channel: () => 'e2e-presence-room',
})

// ---------------------------------------------------------------------------
// Stream channel — useStream
// ---------------------------------------------------------------------------

interface StreamState {
  content: string
}

interface StreamEvent {
  type: 'token' | 'done' | 'error'
  token?: string
  message?: string
}

export const textStream = createStreamChannel<
  StreamState,
  StreamEvent,
  Record<string, never>
>({
  id: 'e2e-text-stream',
  channel: () => ['e2e-stream', {}],
  initial: { content: '' },
  reduce: (state, event) =>
    event.type === 'token'
      ? { content: state.content + (event.token ?? '') }
      : state,
  isDone: (_, event) => event.type === 'done',
  isError: (_, event) =>
    event.type === 'error' ? (event.message ?? 'stream error') : null,
})

// ---------------------------------------------------------------------------
// CRDT synced counter — useSyncedCounter
// ---------------------------------------------------------------------------

export const sharedCounter = defineSyncedCounter({
  id: 'e2e-shared-counter',
  channel: () => 'e2e-counter',
})

// ---------------------------------------------------------------------------
// CRDT synced value — useSyncedValue
// ---------------------------------------------------------------------------

export const sharedValue = defineSyncedValue<string, Record<string, never>>({
  id: 'e2e-shared-value',
  channel: () => 'e2e-value',
})

// ---------------------------------------------------------------------------
// CRDT synced set — useSyncedSet
// ---------------------------------------------------------------------------

export const sharedSet = defineSyncedSet<string, Record<string, never>>({
  id: 'e2e-shared-set',
  channel: () => 'e2e-set',
})
