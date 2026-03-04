/**
 * @tanstack/react-realtime
 *
 * React provider and hooks for @tanstack/realtime.
 */

// Re-export everything from the framework-agnostic core so consumers only
// need a single import: `import { createRealtimeClient, useRealtime } from '@tanstack/react-realtime'`
export * from '@tanstack/realtime'

export { RealtimeProvider } from './RealtimeProvider.js'
export type { RealtimeProviderProps } from './RealtimeProvider.js'

export { useRealtime } from './useRealtime.js'
export type { UseRealtimeResult } from './useRealtime.js'

export { usePresence } from './usePresence.js'
export type { UsePresenceOptions, UsePresenceResult } from './usePresence.js'

export { useSubscribe } from './useSubscribe.js'
export type { UseSubscribeResult } from './useSubscribe.js'

export { usePublish } from './usePublish.js'

export { useChannel } from './useChannel.js'
export type { UseChannelResult } from './useChannel.js'

export { useStream } from './useStream.js'
export type { UseStreamOptions, UseStreamResult } from './useStream.js'

export { useRealtimeCollection } from './useRealtimeCollection.js'
export type { UseRealtimeCollectionConfig } from './useRealtimeCollection.js'

export { useRealtimeQuery } from './useRealtimeQuery.js'
export type {
  UseRealtimeQueryConfig,
  UseRealtimeQueryResult,
} from './useRealtimeQuery.js'

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
