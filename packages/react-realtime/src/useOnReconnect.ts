import { use, useEffect, useRef } from 'react'
import { RealtimeContext } from './context.js'
import type { ConnectionStatus } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fires `callback` each time the realtime connection is restored after being
 * disconnected or in a reconnecting state.
 *
 * The callback is stable — you can pass an inline function without worrying
 * about stale closures or causing resubscriptions. The hook internally uses a
 * ref so the latest function is always called without the effect ever needing
 * to re-run.
 *
 * Typical use cases:
 * - Refetching server state that may have changed while offline.
 * - Showing a "Back online — syncing…" notification.
 * - Triggering a gap-recovery fetch to catch up on missed messages.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * function DataGrid() {
 *   const { refetch } = useQuery(...)
 *
 *   useOnReconnect(() => {
 *     refetch()
 *   })
 *
 *   return <table>...</table>
 * }
 *
 * @example
 * // Show a toast when coming back online
 * useOnReconnect(() => {
 *   toast.success('Back online — your changes have been synced.')
 * })
 */
export function useOnReconnect(callback: () => void): void {
  const client = use(RealtimeContext)
  if (!client) {
    throw new Error(
      '[realtime] useOnReconnect must be used inside <RealtimeProvider>.',
    )
  }

  // Keep the latest callback in a ref so the effect never needs to re-run
  // when the callback identity changes.
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    let prevStatus: ConnectionStatus = client.store.state.status

    const sub = client.store.subscribe((state) => {
      const status = state.status
      // Fire only when transitioning into 'connected' from a non-connected state.
      if (prevStatus !== 'connected' && status === 'connected') {
        callbackRef.current()
      }
      prevStatus = status
    })

    return () => sub.unsubscribe()
  }, [client])
}
