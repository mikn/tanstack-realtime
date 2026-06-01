import { createEffect } from 'solid-js'
import { useConnectionStatus } from './useConnectionStatus.js'
import { useRealtimeClient } from './context.js'
import type { ConnectionStatus } from '@realtimejs/core'

// ---------------------------------------------------------------------------
// Primitive
// ---------------------------------------------------------------------------

/**
 * Fires `callback` each time the realtime connection is restored after being
 * disconnected or in a reconnecting state.
 *
 * Reactively tracks the connection status via `useConnectionStatus()` and
 * invokes the callback on every transition into `'connected'` from a
 * non-connected state. The callback is read at call time so it is always
 * current — no need to wrap it in a signal.
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
 *   const [data, { refetch }] = createResource(fetchData)
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
  // Ensure we're inside a provider (throws with a helpful message if not).
  useRealtimeClient('useOnReconnect')

  const status = useConnectionStatus()

  // Track previous status in a plain variable; createEffect re-runs
  // synchronously when `status()` changes, so the previous value is always
  // the value from the immediately preceding run.
  let prevStatus: ConnectionStatus | undefined

  createEffect(() => {
    const current = status()

    // Fire only when transitioning into 'connected' from a non-connected state.
    // Skip the very first run (prevStatus === undefined) to avoid firing on mount
    // if the connection is already established.
    if (
      prevStatus !== undefined &&
      prevStatus !== 'connected' &&
      current === 'connected'
    ) {
      callback()
    }

    prevStatus = current
  })
}
