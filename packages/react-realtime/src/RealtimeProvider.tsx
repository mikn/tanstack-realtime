import { type ReactNode, useEffect } from 'react'
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
 * `useSubscribe`, `usePublish`, `useStream`) must be descendants of this provider.
 *
 * **Lifecycle**: the provider calls `client.destroy()` on unmount to release
 * the internal status-store subscription. The client itself is **not**
 * disconnected on unmount — call `client.disconnect()` explicitly if you want
 * to close the underlying WebSocket when the provider leaves the tree.
 *
 * Calling `client.connect()` after `destroy()` automatically re-establishes
 * the subscription, so the same client instance is safe to reuse across
 * provider mount/unmount cycles (including React Strict Mode's double-invoke).
 *
 * Typical nesting order in a full TanStack application:
 *
 * @example
 * const realtimeClient = createRealtimeClient({ transport: nodeTransport() })
 * await realtimeClient.connect()
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
  useEffect(() => {
    return () => {
      client.destroy()
    }
  }, [client])

  return (
    <RealtimeContext.Provider value={client}>
      {children}
    </RealtimeContext.Provider>
  )
}
