/**
 * @realtimejs/react-devtools
 *
 * Developer tools panel for inspecting realtime.js client state,
 * channels, messages, and connection lifecycle.
 *
 * @example
 * import { RealtimeDevtools } from '@realtimejs/react-devtools'
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
