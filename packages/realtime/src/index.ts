/**
 * @tanstack/realtime
 *
 * Framework-agnostic realtime client, collection helpers, CRDT primitives,
 * and presence for TanStack DB.
 *
 * For React hooks and provider, use @tanstack/react-realtime.
 * For transport adapters, use @tanstack/realtime-adapter-sse or @tanstack/realtime-adapter-centrifugo.
 */

// Core primitives
export {
  serializeKey,
  parseChannel,
  deriveChannelFromUrl,
} from './core/serializeKey.js'
export { createRealtimeClient } from './core/client.js'
export { hasPresence } from './core/types.js'

// Hook system
export type {
  TransportHooks,
  HookRegistration,
  HookHandle,
} from './core/hooks.js'
export { createHookPipeline } from './core/hookPipeline.js'
export type { HookPipeline } from './core/hookPipeline.js'
export { createHookableTransport } from './core/hookableTransport.js'

// Stream processing primitives
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
  SubscribeError,
  RealtimeTransport,
  PresenceCapable,
  RealtimeClient,
  RealtimeClientOptions,
} from './core/types.js'

// CRDT primitives
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

// Tick-based batching hook
export {
  useTickBatching,
  computeDelta,
  applyDelta,
} from './core/tickTransport.js'
export type {
  TickTransportOptions,
  TickFrame,
  TickHandle,
} from './core/tickTransport.js'

// DB composition helpers
export { withRest } from './core/withRest.js'
export type { WithRestOptions } from './core/withRest.js'

export { withServerFns } from './core/withServerFns.js'
export type { WithServerFnsOptions } from './core/withServerFns.js'

export { ConflictError, isConflictError } from './core/conflictError.js'

// Core utilities
export { createDedup } from './core/dedup.js'
export type { DedupOptions, DeduplicationFilter } from './core/dedup.js'

export { useOfflineQueue } from './core/offlineQueue.js'
export type {
  QueuedMessage,
  OfflineQueueState,
  OfflineQueueOptions,
  OfflineQueueHandle,
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

export { useGapRecovery } from './core/gapRecovery.js'
export type {
  GapRecoveryOptions,
  GapRecoveryHandle,
} from './core/gapRecovery.js'

// Multi-tab transport coordination.
export { createCoordinatedTransport } from './core/coordinatedTransport.js'
export type { CoordinatedTransportOptions } from './core/coordinatedTransport.js'

export {
  createBroadcastChannelTransport,
  isBroadcastChannelSupported,
} from './core/broadcastChannelTransport.js'
export type { BroadcastChannelTransportOptions } from './core/broadcastChannelTransport.js'

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

// Server-side types
export {
  createValidatedPublish,
  normalizePermissions,
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
  LifecycleHooks,
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

// Query collection registry — shared cache for useQuery
export {
  deriveCacheKey,
  getOrCreateQueryCollection,
  lookupQueryCollection,
  subscribeToRealtimeBatch,
} from './queryCollectionRegistry.js'
export type {
  ReactiveQueryFn,
  ReactiveMutationFn,
  ReactiveQueryResult,
} from './queryCollectionRegistry.js'

// Optimistic cache for useMutation
export { createOptimisticCache } from './optimisticCache.js'
export type { OptimisticCache } from './optimisticCache.js'

// Testing utilities
export {
  createMockTransport,
  createMockPresenceTransport,
} from './testing/index.js'
export type {
  MockTransport,
  MockTransportOptions,
  PublishRecord,
  MockPresenceTransport,
  MockPresenceTransportOptions,
} from './testing/index.js'
