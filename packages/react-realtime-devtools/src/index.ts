/**
 * @tanstack/react-realtime-devtools
 *
 * Developer tools panel for inspecting TanStack Realtime client state,
 * channels, messages, and connection lifecycle.
 *
 * @example
 * import { RealtimeDevtools } from '@tanstack/react-realtime-devtools'
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
  DevtoolsState,
  DevtoolsMessage,
  DevtoolsEvent,
  ChannelInfo,
} from './devtoolsStore.js'
