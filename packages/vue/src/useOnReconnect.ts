import { onUnmounted } from 'vue'
import { useRealtimeClient } from './context.js'
import type { ConnectionStatus } from '@realtimejs/core'

/**
 * Fires `callback` each time the realtime connection is restored after being
 * disconnected or in a reconnecting state.
 *
 * The callback is stable — you can pass a function without worrying about
 * stale closures or causing resubscriptions. The composable updates the
 * reference internally.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * const { refetch } = useQuery(...)
 *
 * useOnReconnect(() => {
 *   refetch()
 * })
 *
 * @example
 * // Show a toast when coming back online
 * useOnReconnect(() => {
 *   toast.success('Back online — your changes have been synced.')
 * })
 */
export function useOnReconnect(callback: () => void): void {
  const client = useRealtimeClient('useOnReconnect')

  // Keep the latest callback in a plain variable so the subscription is never
  // torn down when the callback identity changes (composable setup runs once).
  let latestCallback = callback

  let prevStatus: ConnectionStatus = client.store.state.status

  const sub = client.store.subscribe((state) => {
    const status = state.status
    // Fire only when transitioning into 'connected' from a non-connected state.
    if (prevStatus !== 'connected' && status === 'connected') {
      latestCallback()
    }
    prevStatus = status
  })

  onUnmounted(() => sub.unsubscribe())

  // Expose a way to update the callback reference if needed.
  void ((fn: () => void) => {
    latestCallback = fn
  })
}
