import { type ReactNode } from 'react'
import type { RealtimeClient } from '../core/types.js'
import { RealtimeContext } from './context.js'

export interface RealtimeProviderProps {
  /** The realtime client created with `createRealtimeClient`. */
  client: RealtimeClient
  children: ReactNode
}

/**
 * Provides a `RealtimeClient` to the component tree.
 * Place this inside `<DBProvider>` — and inside `<QueryClientProvider>` too
 * if you are also using TanStack Query alongside TanStack DB.
 *
 * @example
 * const realtimeClient = createRealtimeClient({ transport: nodeTransport() })
 *
 * <RealtimeProvider client={realtimeClient}>
 *   <App />
 * </RealtimeProvider>
 */
export function RealtimeProvider({ client, children }: RealtimeProviderProps) {
  return (
    <RealtimeContext.Provider value={client}>
      {children}
    </RealtimeContext.Provider>
  )
}
