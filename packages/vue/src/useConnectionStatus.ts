import { useRealtimeClient } from './context.js'
import { useStoreRef } from './useStoreRef.js'
import type { Ref } from 'vue'
import type { ConnectionStatus } from '@realtimejs/core'

/**
 * Returns a reactive ref of the connection status of the nearest `<RealtimeProvider>`.
 *
 * This is a lightweight alternative to `useRealtime()` for components that
 * only need to react to connection changes (e.g. status indicators, banners)
 * and do not need `connect` / `disconnect` control or the client instance.
 *
 * Causes a re-render only when the status value changes.
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * const status = useConnectionStatus()
 *
 * // In template:
 * // <span :class="`badge-${status}`">{{ status }}</span>
 */
export function useConnectionStatus(): Ref<ConnectionStatus> {
  const client = useRealtimeClient('useConnectionStatus')
  return useStoreRef(client.store, (s) => s.status)
}
