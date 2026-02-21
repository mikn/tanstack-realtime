/**
 * @tanstack/realtime
 *
 * Framework-agnostic realtime client, collection helpers, and presence for TanStack DB.
 *
 * For React hooks and provider, use @tanstack/react-realtime.
 * For the Node.js preset, use @tanstack/realtime-preset-node.
 */

// Core primitives
export { serializeKey, parseChannel } from './core/serializeKey.js'
export { createRealtimeClient } from './core/client.js'
export type {
  ConnectionStatus,
  PresenceUser,
  ParsedChannel,
  QueryKey,
  RealtimeTransport,
  RealtimeClient,
  RealtimeClientOptions,
} from './core/types.js'

// Collection sources
export { realtimeCollectionOptions } from './collections/realtimeCollectionOptions.js'
export type {
  RealtimeCollectionConfig,
  RealtimeChannelMessage,
} from './collections/realtimeCollectionOptions.js'

export { liveChannelOptions } from './collections/liveChannelOptions.js'
export type { LiveChannelConfig } from './collections/liveChannelOptions.js'

export { createPresenceChannel } from './collections/presenceChannel.js'
export type {
  PresenceChannelConfig,
  PresenceChannelDef,
} from './collections/presenceChannel.js'

export { streamChannelOptions, createStreamChannel } from './collections/streamChannelOptions.js'
export type {
  StreamChannelConfig,
  StreamChannelDef,
  StreamChannelDefConfig,
  StreamItem,
  StreamStatus,
} from './collections/streamChannelOptions.js'

// Derived / multi-channel collections
export { derivedChannelOptions } from './collections/derivedChannelOptions.js'
export type {
  DerivedSource,
  DerivedChannelConfig,
} from './collections/derivedChannelOptions.js'

// Optimistic mutations + conflict resolution
export { optimisticCollectionOptions } from './collections/optimisticCollectionOptions.js'
export type {
  PendingMutation,
  OptimisticState,
  OptimisticCollectionConfig,
} from './collections/optimisticCollectionOptions.js'

// Core utilities
export { createDedup } from './core/dedup.js'
export type { DedupOptions, DeduplicationFilter } from './core/dedup.js'

export { createOfflineQueue } from './core/offlineQueue.js'
export type {
  QueuedMessage,
  OfflineQueueState,
  OfflineQueueOptions,
  OfflineQueueTransport,
} from './core/offlineQueue.js'

export { throttle } from './core/throttle.js'
export type { ThrottleOptions, ThrottledFn } from './core/throttle.js'

export { createEphemeralMap } from './core/ephemeral.js'
export type {
  EphemeralMapOptions,
  EphemeralEntry,
  EphemeralMap,
} from './core/ephemeral.js'

export { withGapRecovery } from './core/gapRecovery.js'
export type {
  GapRecoveryOptions,
  GapRecoveryTransport,
} from './core/gapRecovery.js'

export { createSharedTransport } from './core/sharedTransport.js'
export type {
  SharedTransportOptions,
  SharedTransport,
} from './core/sharedTransport.js'

// Server-side types — transport-agnostic, exported from core so any preset
// can implement the same contract without an additional import path.
export type {
  ChannelPermissions,
  AuthorizeFn,
  PublishFn,
} from './server/index.js'
