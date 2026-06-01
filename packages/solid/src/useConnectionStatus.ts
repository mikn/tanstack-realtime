import { useContext } from 'solid-js'
import { RealtimeContext } from './context.js'
import { createStoreSignal } from './createStoreSignal.js'
import type { Accessor } from 'solid-js'
import type { ConnectionStatus } from '@realtimejs/core'

/**
 * Returns a reactive accessor for the connection status of the nearest
 * `<RealtimeProvider>`.
 *
 * This is a lightweight alternative to `useRealtime()` for components that
 * only need to react to connection changes (e.g. status indicators, banners)
 * and do not need `connect` / `disconnect` control or the client instance.
 *
 * Re-evaluates only when the status value changes.
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * function ConnectionBanner() {
 *   const status = useConnectionStatus()
 *
 *   return (
 *     <Show when={status() !== 'connected'}>
 *       <Show when={status() === 'reconnecting'} fallback={<p>Offline — changes will sync when back online</p>}>
 *         <p>Reconnecting…</p>
 *       </Show>
 *     </Show>
 *   )
 * }
 *
 * @example
 * // Status badge in a nav bar
 * const status = useConnectionStatus()
 * return <span class={`badge badge-${status()}`}>{status()}</span>
 */
export function useConnectionStatus(): Accessor<ConnectionStatus> {
  const client = useContext(RealtimeContext)
  if (!client) {
    throw new Error(
      '[realtime] useConnectionStatus must be used inside <RealtimeProvider>.',
    )
  }
  return createStoreSignal(client.store, (s) => s.status)
}
