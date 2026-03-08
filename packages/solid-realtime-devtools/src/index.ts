/**
 * @tanstack/solid-realtime-devtools
 *
 * Developer tools panel for inspecting TanStack Realtime client state,
 * channels, messages, presence, offline queue, and connection lifecycle.
 *
 * @example
 * import { RealtimeDevtools } from '@tanstack/solid-realtime-devtools'
 *
 * function App() {
 *   return (
 *     <RealtimeProvider client={client}>
 *       <MyApp />
 *       <RealtimeDevtools />
 *     </RealtimeProvider>
 *   )
 * }
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
