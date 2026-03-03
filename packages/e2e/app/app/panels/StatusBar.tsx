/**
 * StatusBar — shows the current connection status and active user ID.
 * data-testid="status" carries the raw status string for Playwright assertions.
 */

import { useStore } from '@tanstack/react-store'
import { client, userId } from '../transport.js'

export function StatusBar() {
  const status = useStore(client.store, (s) => s.status)

  return (
    <div className="status-bar">
      <span className={`dot ${status}`} />
      <span data-testid="status">{status}</span>
      <span style={{ color: '#94a3b8' }}>|</span>
      <span data-testid="user-id">user: {userId}</span>
    </div>
  )
}
