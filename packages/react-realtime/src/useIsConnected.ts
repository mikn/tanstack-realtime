import { useConnectionStatus } from './useConnectionStatus.js'

/**
 * Returns `true` when the realtime transport is fully connected, `false`
 * otherwise (disconnected, connecting, or reconnecting).
 *
 * This is a convenience wrapper over `useConnectionStatus()` for components
 * that only need a boolean gate — e.g. disabling a send button or skipping a
 * subscription until the connection is ready.
 *
 * Causes a re-render only when the boolean value changes (connected ↔ not).
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * function SendButton({ onClick }: { onClick: () => void }) {
 *   const connected = useIsConnected()
 *   return (
 *     <button onClick={onClick} disabled={!connected}>
 *       {connected ? 'Send' : 'Connecting…'}
 *     </button>
 *   )
 * }
 *
 * @example
 * // Conditional rendering
 * const connected = useIsConnected()
 * if (!connected) return <ReconnectingBanner />
 */
export function useIsConnected(): boolean {
  return useConnectionStatus() === 'connected'
}
