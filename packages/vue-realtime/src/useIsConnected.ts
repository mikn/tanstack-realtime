import { computed } from 'vue'
import { useConnectionStatus } from './useConnectionStatus.js'
import type { ComputedRef } from 'vue'

/**
 * Returns a computed boolean that is `true` when the realtime transport is
 * fully connected, `false` otherwise (disconnected, connecting, or reconnecting).
 *
 * This is a convenience wrapper over `useConnectionStatus()` for components
 * that only need a boolean gate — e.g. disabling a send button or skipping a
 * subscription until the connection is ready.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * const connected = useIsConnected()
 *
 * // In template:
 * // <button :disabled="!connected">Send</button>
 */
export function useIsConnected(): ComputedRef<boolean> {
  const status = useConnectionStatus()
  return computed(() => status.value === 'connected')
}
