/**
 * @realtimejs/vue-devtools
 *
 * Developer tools panel for inspecting TanStack Realtime client state,
 * channels, messages, and connection lifecycle — Vue edition.
 *
 * @example
 * import { RealtimeDevtools } from '@realtimejs/vue-devtools'
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
