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

export { useConnectionStatus } from './useConnectionStatus.js'

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

export { useLiveChannel } from './useLiveChannel.js'
export type { UseLiveChannelConfig } from './useLiveChannel.js'

// Testing utilities
export {
  createTestRealtimeProvider,
  createTestRealtimeProviderWithPresence,
} from './TestRealtimeProvider.js'
export type {
  TestRealtimeProviderProps,
  TestRealtimeProviderResult,
  TestRealtimeProviderWithPresenceResult,
} from './TestRealtimeProvider.js'

// Convenience hooks for common real-time UI patterns
export { useIsConnected } from './useIsConnected.js'

export { useLatestMessage } from './useLatestMessage.js'
export type { UseLatestMessageResult } from './useLatestMessage.js'

export { useChannelHistory } from './useChannelHistory.js'
export type {
  UseChannelHistoryOptions,
  UseChannelHistoryResult,
} from './useChannelHistory.js'

export { useTypingIndicator } from './useTypingIndicator.js'
export type {
  UseTypingIndicatorOptions,
  UseTypingIndicatorResult,
} from './useTypingIndicator.js'

export { useChannelStats } from './useChannelStats.js'
export type { UseChannelStatsResult } from './useChannelStats.js'

export { useOnReconnect } from './useOnReconnect.js'

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
