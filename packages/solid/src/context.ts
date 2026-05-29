import { createContext, useContext } from 'solid-js'
import type { RealtimeClient } from '@realtimejs/core'

export const RealtimeContext = createContext<RealtimeClient | null>(null)

/**
 * Internal hook — retrieves the `RealtimeClient` from context or throws a
 * descriptive error that names the calling primitive.
 */
export function useRealtimeClient(hookName: string): RealtimeClient {
  const client = useContext(RealtimeContext)
  if (!client) {
    throw new Error(
      `[realtime] ${hookName} must be used inside <RealtimeProvider>.`,
    )
  }
  return client
}
