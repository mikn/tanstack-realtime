import { use } from 'react'
import { useStore } from '@tanstack/react-store'
import { RealtimeContext } from './context.js'
import type { ConnectionStatus } from '@realtimejs/core'

/**
 * Returns the reactive connection status of the nearest `<RealtimeProvider>`.
 *
 * This is a lightweight alternative to `useRealtime()` for components that
 * only need to react to connection changes (e.g. status indicators, banners)
 * and do not need `connect` / `disconnect` control or the client instance.
 *
 * Causes a re-render only when the status value changes.
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * function ConnectionBanner() {
 *   const status = useConnectionStatus()
 *
 *   if (status === 'connected') return null
 *   if (status === 'reconnecting') return <p>Reconnecting…</p>
 *   return <p>Offline — changes will sync when back online</p>
 * }
 *
 * @example
 * // Status badge in a nav bar
 * const status = useConnectionStatus()
 * return <span className={`badge badge-${status}`}>{status}</span>
 */
export function useConnectionStatus(): ConnectionStatus {
  const client = use(RealtimeContext)
  if (!client) {
    throw new Error(
      '[realtime] useConnectionStatus must be used inside <RealtimeProvider>.',
    )
  }
  return useStore(client.store, (s) => s.status)
}
