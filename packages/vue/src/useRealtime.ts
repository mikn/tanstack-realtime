import { useRealtimeClient } from './context.js'
import { useStoreRef } from './useStoreRef.js'
import type { Ref } from 'vue'
import type { ConnectionStatus, RealtimeClient } from '@realtimejs/core'

export interface UseRealtimeResult {
  /**
   * Reactive connection status. Causes a re-render only when the status
   * value changes (e.g. `'connecting'` → `'connected'`).
   */
  status: Ref<ConnectionStatus>
  /** Open the connection. Resolves once `status` is `'connected'`. */
  connect: () => Promise<void>
  /**
   * Close the connection immediately. No reconnect will occur.
   * Collections retain their current data but stop receiving live updates.
   */
  disconnect: () => void
  /**
   * The underlying `RealtimeClient` instance. Use this for operations not
   * covered by the composables, such as manually calling `joinPresence` or
   * subscribing to raw channels outside of Vue's lifecycle.
   */
  client: RealtimeClient
}

/**
 * Returns reactive connection status and control functions.
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * const { status, connect, disconnect } = useRealtime()
 *
 * // Computed banner
 * const banner = computed(() =>
 *   status.value === 'reconnecting' ? 'Reconnecting…' : null
 * )
 */
export function useRealtime(): UseRealtimeResult {
  const client = useRealtimeClient('useRealtime')
  const status = useStoreRef(client.store, (s) => s.status)

  return {
    status,
    connect: () => client.connect(),
    disconnect: () => client.disconnect(),
    client,
  }
}
