/**
 * StatusBar — shows the current connection status and active user ID.
 * data-testid="status" carries the raw status string for Playwright assertions.
 */
import { useConnectionStatus } from '@tanstack/solid-realtime'
import { userId } from '../transport.js'

export function StatusBar() {
  const status = useConnectionStatus()

  return (
    <div class="status-bar">
      <span class={`dot ${status()}`} />
      <span data-testid="status">{status()}</span>
      <span style={{ color: '#94a3b8' }}>|</span>
      <span data-testid="user-id">user: {userId}</span>
    </div>
  )
}
