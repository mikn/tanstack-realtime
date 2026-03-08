import { useRealtimeClient } from './context.js'
import { createStoreSignal } from './createStoreSignal.js'
import type { Accessor } from 'solid-js'
import type { ConnectionStatus, RealtimeClient } from '@tanstack/realtime'

export interface UseRealtimeResult {
  /**
   * Reactive connection status accessor. Re-evaluates only when the status
   * value changes (e.g. `'connecting'` → `'connected'`).
   */
  status: Accessor<ConnectionStatus>
  /** Open the connection. Resolves once `status` is `'connected'`. */
  connect: () => Promise<void>
  /**
   * Close the connection immediately. No reconnect will occur.
   * Collections retain their current data but stop receiving live updates.
   */
  disconnect: () => void
  /**
   * The underlying `RealtimeClient` instance. Use this for operations not
   * covered by the primitives, such as manually calling `joinPresence` or
   * subscribing to raw channels outside of Solid's lifecycle.
   */
  client: RealtimeClient
}

/**
 * Returns reactive connection status and control functions.
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * function AuthProvider(props) {
 *   const realtime = useRealtime()
 *
 *   async function handleLogin(creds) {
 *     await login(creds)
 *     realtime.connect()
 *   }
 *
 *   return <div onClick={handleLogin}>{props.children}</div>
 * }
 */
export function useRealtime(): UseRealtimeResult {
  const client = useRealtimeClient('useRealtime')
  const status = createStoreSignal(client.store, (s) => s.status)

  const connect = () => client.connect()
  const disconnect = () => client.disconnect()

  return { status, connect, disconnect, client }
}
