import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
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
 * Place inside QueryClientProvider.
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
 * Returns reactive connection controls.
 *
 * @example
 * ```tsx
 * const { status, connect, disconnect } = useRealtime()
 * ```
 */
export function useRealtime(): RealtimeControls {
  const { client } = useRealtimeContext()
  const [status, setStatus] = useState<ConnectionStatus>(client.status)

  useEffect(() => {
    // Sync initial state
    setStatus(client.status)
    return client.onStatus((s) => setStatus(s))
  }, [client])

  return {
    status,
    connect: () => client.connect(),
    disconnect: () => client.disconnect(),
  }
}
