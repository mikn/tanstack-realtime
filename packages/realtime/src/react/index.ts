export { RealtimeProvider } from './RealtimeProvider.js'
export type { RealtimeProviderProps } from './RealtimeProvider.js'
export { useRealtime } from './useRealtime.js'
export type { UseRealtimeResult } from './useRealtime.js'
export { usePresence } from './usePresence.js'
export type { UsePresenceOptions, UsePresenceResult } from './usePresence.js'
export { usePublish } from './usePublish.js'
export { useSubscribe } from './useSubscribe.js'

// CRDT standalone hooks
export { useSyncedCounter } from './useSyncedCounter.js'
export type {
  UseSyncedCounterOptions,
  UseSyncedCounterResult,
} from './useSyncedCounter.js'
export { useSyncedValue } from './useSyncedValue.js'
export type {
  UseSyncedValueOptions,
  UseSyncedValueResult,
} from './useSyncedValue.js'
export { useSyncedSet } from './useSyncedSet.js'
export type {
  UseSyncedSetOptions,
  UseSyncedSetResult,
} from './useSyncedSet.js'

// Re-export createRealtimeClient from core so consumers can import it from /react
export { createRealtimeClient } from '../core/client.js'
export type { RealtimeClient, RealtimeClientOptions } from '../core/types.js'

// Re-export CRDT channel defs so consumers can import everything from /react
export {
  defineSyncedCounter,
  defineSyncedValue,
  defineSyncedSet,
} from '../collections/index.js'
export type {
  SyncedCounterDef,
  SyncedValueDef,
  SyncedSetDef,
} from '../collections/index.js'
