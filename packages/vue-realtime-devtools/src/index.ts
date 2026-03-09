/**
 * @tanstack/vue-realtime-devtools
 *
 * Developer tools panel for inspecting TanStack Realtime client state,
 * channels, messages, and connection lifecycle — Vue edition.
 *
 * @example
 * import { RealtimeDevtools } from '@tanstack/vue-realtime-devtools'
 *
 * // In your root component:
 * <RealtimeProvider :client="client">
 *   <MyApp />
 *   <RealtimeDevtools />
 * </RealtimeProvider>
 */

export { RealtimeDevtools } from './RealtimeDevtools.js'
export type {
  RealtimeDevtoolsProps,
  DevtoolsPosition,
} from './RealtimeDevtools.js'

export { createDevtoolsStore } from './devtoolsStore.js'
export type {
  DevtoolsStoreHandle,
  DevtoolsStoreOptions,
  DevtoolsState,
  DevtoolsMessage,
  DevtoolsEvent,
  ChannelInfo,
  OfflineQueueSnapshot,
} from './devtoolsStore.js'
