import { use, useCallback } from 'react'
import { useStore } from '@tanstack/react-store'
import type { ConnectionStatus } from '../core/types.js'
import type { RealtimeClient } from '../core/client.js'
import { RealtimeContext } from './context.js'

export interface UseRealtimeResult {
  /** Current connection status, reactive. */
  status: ConnectionStatus
  /** Open the connection. Collections start receiving live data. */
  connect(): Promise<void>
  /** Close the connection. Collections fall back to `queryFn` data. */
  disconnect(): void
  /** Access the full client for advanced use cases. */
  client: RealtimeClient
}

function getClient(ctx: RealtimeClient | null): RealtimeClient {
  if (!ctx) {
    throw new Error(
      '[realtime] useRealtime must be used inside <RealtimeProvider>.',
    )
  }
  return ctx
}

/**
 * Returns reactive connection status and control functions.
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * function AuthProvider({ children }) {
 *   const realtime = useRealtime()
 *
 *   async function handleLogin(creds) {
 *     await login(creds)
 *     realtime.connect()
 *   }
 *
 *   return <div onClick={handleLogin}>{children}</div>
 * }
 */
export function useRealtime(): UseRealtimeResult {
  const client = getClient(use(RealtimeContext))
  const status = useStore(client.store, (s) => s.status)

  const connect = useCallback(() => client.connect(), [client])
  const disconnect = useCallback(() => client.disconnect(), [client])

  return { status, connect, disconnect, client }
}
