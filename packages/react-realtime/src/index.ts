/**
 * @tanstack/react-realtime
 *
 * React provider and hooks for @tanstack/realtime.
 *
 * Import framework-agnostic primitives (createRealtimeClient, CRDT helpers,
 * collection options, etc.) directly from `@tanstack/realtime`.
 */

export { RealtimeProvider } from './RealtimeProvider.js'
export type { RealtimeProviderProps } from './RealtimeProvider.js'

export { useRealtime } from './useRealtime.js'
export type { UseRealtimeResult } from './useRealtime.js'

export { usePresence } from './usePresence.js'
export type { UsePresenceOptions, UsePresenceResult } from './usePresence.js'

export { useSubscribe } from './useSubscribe.js'

export { usePublish } from './usePublish.js'

export { useChannel } from './useChannel.js'
export type { UseChannelResult } from './useChannel.js'

export { useStream } from './useStream.js'
export type { UseStreamOptions, UseStreamResult } from './useStream.js'

export { useRealtimeCollection } from './useRealtimeCollection.js'
export type { UseRealtimeCollectionConfig } from './useRealtimeCollection.js'

export { useLiveChannel } from './useLiveChannel.js'
export type { UseLiveChannelConfig } from './useLiveChannel.js'

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
export type { UseSyncedSetOptions, UseSyncedSetResult } from './useSyncedSet.js'
