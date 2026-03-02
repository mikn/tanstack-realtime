/**
 * @tanstack/realtime
 *
 * Framework-agnostic realtime client, collection helpers, CRDT primitives,
 * and presence for TanStack DB.
 *
 * For React hooks and provider, use @tanstack/react-realtime.
 * For the Node.js preset, use @tanstack/realtime-preset-node.
 */

// Core primitives
export { serializeKey, parseChannel } from './core/serializeKey.js'
export { createRealtimeClient } from './core/client.js'
export { hasPresence } from './core/types.js'

// Stream processing primitives — shared between collection and hook consumers.
// The envelope middleware composes at the handler level; the processor provides
// the pure event fold.
export {
  stripEnvelope,
  withEnvelopeStripping,
  withHeartbeatFilter,
} from './core/streamEnvelope.js'
export type {
  EnvelopeResult,
  HeartbeatFilterOptions,
} from './core/streamEnvelope.js'

export { processEvent, createStreamProcessor } from './core/streamProcessor.js'
export type {
  StreamSnapshot,
  StreamProcessorConfig,
  ProcessEventResult,
  StreamTransitionCallback,
  StreamProcessor,
} from './core/streamProcessor.js'
export type {
  ConnectionStatus,
  PresenceUser,
  ParsedChannel,
  QueryKey,
  // Core transport interface (no presence required for custom implementations)
  RealtimeTransport,
  // Optional presence extension — implement alongside RealtimeTransport
  PresenceCapable,
  // Utility type for middleware that preserves presence capability
  PresenceAwareTransport,
  RealtimeClient,
  RealtimeClientOptions,
} from './core/types.js'

// CRDT primitives — field types, merge functions, and wire format types.
// Import these when building custom integrations or transport adapters.
export type {
  CrdtFieldType,
  CrdtFields,
  CrdtRowState,
  CrdtFieldState,
  CrdtFieldWire,
  CrdtMessageHeader,
  LwwState,
  LwwWire,
  PnState,
  PnWire,
  OrEntry,
  OrState,
  OrWire,
  LamportClock,
} from './core/crdt.js'
export {
  generateClientId,
  tickClock,
  advanceClock,
  resetClock,
  createClock,
  lwwWins,
  pnValue,
  mergePn,
  pnIncrement,
  pnDecrement,
  orValues,
  mergeOr,
  compactOr,
  orAdd,
  orRemove,
  orHas,
  initOrFromArray,
} from './core/crdt.js'

// Collection sources
export {
  realtimeCollectionOptions,
  liveChannelOptions,
  createPresenceChannel,
  presenceChannelOptions,
  ephemeralLiveOptions,
  streamChannelOptions,
  createStreamChannel,
  serverStreamCallbacks,
  tickCollectionOptions,
  defineSyncedCounter,
  defineSyncedValue,
  defineSyncedSet,
} from './collections/index.js'
export type {
  RealtimeCollectionConfig,
  RealtimeChannelMessage,
  LiveChannelConfig,
  PresenceChannelConfig,
  PresenceChannelDef,
  PresenceCollectionConfig,
  EphemeralLiveConfig,
  StreamChannelConfig,
  StreamChannelDef,
  StreamChannelDefConfig,
  StreamItem,
  StreamStatus,
  TickCollectionConfig,
  SyncedCounterConfig,
  SyncedCounterDef,
  SyncedValueConfig,
  SyncedValueDef,
  SyncedSetConfig,
  SyncedSetDef,
} from './collections/index.js'

// Built-in WebSocket transport — browser-safe, no Node.js dependencies.
// Connects to a createNodeServer instance using the built-in wire protocol.
export { wsTransport } from './core/wsTransport.js'
export type { WsTransportOptions } from './core/wsTransport.js'

// Tick-based transport — batches updates per tick interval for game state.
export {
  tickTransport,
  computeDelta,
  applyDelta,
} from './core/tickTransport.js'
export type {
  TickTransportOptions,
  TickFrame,
  TickTransport,
} from './core/tickTransport.js'

// DB composition helpers
export { withServerFns } from './core/withServerFns.js'
export type { WithServerFnsOptions } from './core/withServerFns.js'

export { ConflictError, isConflictError } from './core/conflictError.js'

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

export {
  createIndexedDBStorage,
  createLocalStorageAdapter,
} from './core/offlineQueueStorage.js'
export type {
  OfflineQueueStorage,
  IndexedDBStorageOptions,
  LocalStorageOptions,
} from './core/offlineQueueStorage.js'

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

// Multi-tab transport coordination.
// createCoordinatedTransport() is the recommended entry point — it
// automatically selects SharedWorker > BroadcastChannel > direct.
export { createCoordinatedTransport } from './core/coordinatedTransport.js'
export type { CoordinatedTransportOptions } from './core/coordinatedTransport.js'

// BroadcastChannel-based multi-tab transport — leader election, no worker file.
export {
  createBroadcastChannelTransport,
  isBroadcastChannelSupported,
} from './core/broadcastChannelTransport.js'
export type { BroadcastChannelTransportOptions } from './core/broadcastChannelTransport.js'

// SharedWorker-based multi-tab transport — best performance, requires worker file.
// Tab side: createSharedWorkerTransport(workerUrl)
// Worker side: createSharedWorkerCoordinator(innerTransport) — call in the SharedWorker file.
export {
  createSharedWorkerTransport,
  createSharedWorkerCoordinator,
  isSharedWorkerSupported,
} from './core/sharedWorkerTransport.js'
export type {
  SharedWorkerTransportOptions,
  SharedWorkerCoordinatorOptions,
  SharedWorkerCoordinator,
  TabToWorkerMsg,
  WorkerToTabMsg,
} from './core/sharedWorkerTransport.js'

// Server-side types — transport-agnostic, exported from core so any preset
// can implement the same contract without an additional import path.
export {
  createValidatedPublish,
  PublishValidationError,
  createServerStream,
  verifyEventSignature,
  STREAM_DONE,
  STREAM_ERROR,
  STREAM_HEARTBEAT,
} from './server/index.js'
export type {
  ChannelPermissions,
  AuthorizeFn,
  PublishFn,
  PublishValidation,
  PublishValidationResult,
  ValidatePublishFn,
  ValidatedPublishOptions,
  ServerStream,
  CreateServerStreamOptions,
  StreamCheckpoint,
  CheckpointConfig,
  ExplicitCheckpointConfig,
  ChannelDefCheckpointConfig,
} from './server/index.js'
