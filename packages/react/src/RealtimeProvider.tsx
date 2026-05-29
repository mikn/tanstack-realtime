import { useEffect } from 'react'
import { useStore } from '@tanstack/react-store'
import { subscribeToRealtimeBatch } from '@realtimejs/core'
import { RealtimeContext } from './context.js'
import type { ReactNode } from 'react'
import type { RealtimeClient } from '@realtimejs/core'

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
 * All hooks from `@realtimejs/react` (`useRealtime`, `usePresence`,
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

  // Subscribe to the batch channel for consistent cross-query snapshots.
  // All queries invalidated by a single mutation update in the same render.
  useEffect(() => subscribeToRealtimeBatch(client), [client])

  // Dev-mode warning: if the client remains disconnected for more than 2 seconds
  // after mount and autoConnect is false, surface a helpful message.
  const status = useStore(client.store, (s) => s.status)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    if (autoConnect) return
    if (status !== 'disconnected') return

    const timer = setTimeout(() => {
      console.warn(
        '[realtime] RealtimeProvider: the client has been disconnected for > 2 seconds ' +
          'and autoConnect is false. Call client.connect() or useRealtime().connect() ' +
          'to establish the connection, or set autoConnect={true} on <RealtimeProvider>.',
      )
    }, 2000)

    return () => clearTimeout(timer)
  }, [autoConnect, status])

  return (
    <RealtimeContext.Provider value={client}>
      {children}
    </RealtimeContext.Provider>
  )
}
