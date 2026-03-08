import { createMemo } from 'solid-js'
import { useConnectionStatus } from './useConnectionStatus.js'
import type { Accessor } from 'solid-js'

/**
 * Returns a reactive accessor that is `true` when the realtime transport is
 * fully connected, `false` otherwise (disconnected, connecting, or reconnecting).
 *
 * This is a convenience wrapper over `useConnectionStatus()` for components
 * that only need a boolean gate — e.g. disabling a send button or skipping a
 * subscription until the connection is ready.
 *
 * Re-evaluates only when the boolean value changes (connected ↔ not).
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * function SendButton(props) {
 *   const connected = useIsConnected()
 *   return (
 *     <button onClick={props.onClick} disabled={!connected()}>
 *       {connected() ? 'Send' : 'Connecting…'}
 *     </button>
 *   )
 * }
 *
 * @example
 * // Conditional rendering
 * const connected = useIsConnected()
 * return <Show when={connected()} fallback={<ReconnectingBanner />}><App /></Show>
 */
export function useIsConnected(): Accessor<boolean> {
  const status = useConnectionStatus()
  return createMemo(() => status() === 'connected')
}
