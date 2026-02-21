import { type ReactNode } from 'react'
import type { RealtimeClient } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'

export interface RealtimeProviderProps {
  /** The realtime client created with `createRealtimeClient`. */
  client: RealtimeClient
  children: ReactNode
}

/**
 * Provides a `RealtimeClient` to the component tree via React context.
 * All hooks from `@tanstack/react-realtime` (`useRealtime`, `usePresence`,
 * `useSubscribe`, `usePublish`) must be descendants of this provider.
 *
 * Typical nesting order in a full TanStack application:
 *
 * @example
 * const realtimeClient = createRealtimeClient({ transport: nodeTransport() })
 *
 * function Root() {
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       <DBProvider db={db}>
 *         <RealtimeProvider client={realtimeClient}>
 *           <App />
 *         </RealtimeProvider>
 *       </DBProvider>
 *     </QueryClientProvider>
 *   )
 * }
 */
export function RealtimeProvider({ client, children }: RealtimeProviderProps) {
  return (
    <RealtimeContext.Provider value={client}>
      {children}
    </RealtimeContext.Provider>
  )
}
