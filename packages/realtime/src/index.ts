/**
 * @tanstack/realtime
 *
 * Live data, ephemeral channels, and presence for TanStack DB.
 *
 * Subpath exports:
 *   @tanstack/realtime        — collection primitives + key utilities
 *   @tanstack/realtime/react  — React provider and hooks
 *   @tanstack/realtime/server — server-side authorize type and publish helper
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
} from './core/types.js'
export type { RealtimeClient, RealtimeClientOptions } from './core/client.js'

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
