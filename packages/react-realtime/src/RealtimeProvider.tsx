import { useEffect } from 'react'
import { RealtimeContext } from './context.js'
import type { ReactNode } from 'react'
import type { RealtimeClient } from '@tanstack/realtime'

export interface RealtimeProviderProps {
  /** The realtime client created with `createRealtimeClient`. */
  client: RealtimeClient
  children: ReactNode
  /**
   * Automatically call `client.connect()` on mount.
   *
   * When `true` (the default), the provider connects on mount and
   * disconnects + destroys on unmount. Set to `false` to manage
   * the connection lifecycle yourself.
   *
   * @default true
   */
  autoConnect?: boolean
}

/**
 * Provides a `RealtimeClient` to the component tree via React context.
 * All hooks from `@tanstack/react-realtime` (`useRealtime`, `usePresence`,
 * `useSubscribe`, `usePublish`, `useStream`) must be descendants of this provider.
 *
 * **Lifecycle**: by default (`autoConnect={true}`), the provider calls
 * `client.connect()` on mount and `client.destroy()` on unmount.
 * Set `autoConnect={false}` to manage the connection yourself.
 *
 * Calling `client.connect()` after `destroy()` automatically re-establishes
 * the subscription, so the same client instance is safe to reuse across
 * provider mount/unmount cycles (including React Strict Mode's double-invoke).
 *
 * @example
 * const realtimeClient = createRealtimeClient({ transport: sseTransport({ url: '/api/realtime/sse' }) })
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
export function RealtimeProvider({
  client,
  children,
  autoConnect = true,
}: RealtimeProviderProps) {
  useEffect(() => {
    if (autoConnect) {
      client.connect()
    }
    return () => {
      client.destroy()
    }
  }, [client, autoConnect])

  return (
    <RealtimeContext.Provider value={client}>
      {children}
    </RealtimeContext.Provider>
  )
}
