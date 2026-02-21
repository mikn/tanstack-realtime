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

// Server-side types — transport-agnostic, exported from core so any preset
// can implement the same contract without an additional import path.
export type {
  ChannelPermissions,
  AuthorizeFn,
  PublishFn,
} from './server/index.js'
