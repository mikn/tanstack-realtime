import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type {
  RealtimeClient,
  ConnectionStatus,
} from '@tanstack/realtime-client'

interface RealtimeContextValue {
  client: RealtimeClient
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

export interface RealtimeProviderProps {
  client: RealtimeClient
  children: ReactNode
}

/**
 * Provides the RealtimeClient to the component tree.
 * Must be placed inside `QueryClientProvider`.
 *
 * @example
 * ```tsx
 * <QueryClientProvider client={queryClient}>
 *   <RealtimeProvider client={realtimeClient}>
 *     <App />
 *   </RealtimeProvider>
 * </QueryClientProvider>
 * ```
 */
export function RealtimeProvider({ client, children }: RealtimeProviderProps) {
  return (
    <RealtimeContext.Provider value={{ client }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtimeContext(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext)
  if (!ctx) {
    throw new Error('useRealtime must be used inside a <RealtimeProvider>')
  }
  return ctx
}

export interface RealtimeControls {
  status: ConnectionStatus
  connect: () => void
  disconnect: () => void
}

/**
 * Returns reactive connection controls. Uses `useSyncExternalStore` so the
 * status is always consistent with the external client even in concurrent
 * rendering.
 *
 * @example
 * ```tsx
 * const { status, connect, disconnect } = useRealtime()
 * ```
 */
export function useRealtime(): RealtimeControls {
  const { client } = useRealtimeContext()

  const status = useSyncExternalStore(
    // subscribe: the store notifies React by calling onStoreChange().
    // onStatus receives the new status but useSyncExternalStore reads it
    // via getSnapshot(), so we just signal that something changed.
    useCallback(
      (onStoreChange: () => void) => client.onStatus(onStoreChange),
      [client],
    ),
    // getSnapshot: called on every render and after every notification.
    () => client.status,
    // getServerSnapshot: used during SSR / hydration.
    () => 'disconnected' as ConnectionStatus,
  )

  const connect = useCallback(() => client.connect(), [client])
  const disconnect = useCallback(() => client.disconnect(), [client])

  return { status, connect, disconnect }
}
