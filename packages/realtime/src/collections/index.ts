export { realtimeCollectionOptions } from './realtimeCollectionOptions.js'
export type {
  RealtimeCollectionConfig,
  RealtimeChannelMessage,
} from './realtimeCollectionOptions.js'

export { liveChannelOptions } from './liveChannelOptions.js'
export type { LiveChannelConfig } from './liveChannelOptions.js'

export { createPresenceChannel } from './presenceChannel.js'
export type {
  PresenceChannelConfig,
  PresenceChannelDef,
} from './presenceChannel.js'

export { presenceChannelOptions } from './presenceChannelOptions.js'
export type { PresenceCollectionConfig } from './presenceChannelOptions.js'

export { ephemeralLiveOptions } from './ephemeralLiveOptions.js'
export type { EphemeralLiveConfig } from './ephemeralLiveOptions.js'

export {
  streamChannelOptions,
  createStreamChannel,
} from './streamChannelOptions.js'
export type {
  StreamChannelConfig,
  StreamChannelDef,
  StreamChannelDefConfig,
  StreamItem,
  StreamStatus,
} from './streamChannelOptions.js'

export { tickCollectionOptions } from './tickCollectionOptions.js'
export type { TickCollectionConfig } from './tickCollectionOptions.js'

// CRDT standalone channel definitions
export { defineSyncedCounter } from './syncedCounter.js'
export type { SyncedCounterConfig, SyncedCounterDef } from './syncedCounter.js'

export { defineSyncedValue } from './syncedValue.js'
export type { SyncedValueConfig, SyncedValueDef } from './syncedValue.js'

export { defineSyncedSet } from './syncedSet.js'
export type { SyncedSetConfig, SyncedSetDef } from './syncedSet.js'
