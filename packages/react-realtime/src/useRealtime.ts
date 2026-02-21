import { use, useCallback } from 'react'
import { useStore } from '@tanstack/react-store'
import type { ConnectionStatus, RealtimeClient } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'

export interface UseRealtimeResult {
  /**
   * Reactive connection status. Causes a re-render only when the status
   * value changes (e.g. `'connecting'` → `'connected'`).
   */
  status: ConnectionStatus
  /** Open the WebSocket connection. Resolves once `status` is `'connected'`. */
  connect(): Promise<void>
  /**
   * Close the connection immediately. No reconnect will occur.
   * Collections retain their current data but stop receiving live updates.
   */
  disconnect(): void
  /**
   * The underlying `RealtimeClient` instance. Use this for operations not
   * covered by the hooks, such as manually calling `joinPresence` or
   * subscribing to raw channels outside of React's lifecycle.
   */
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
