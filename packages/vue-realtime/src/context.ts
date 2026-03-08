import { inject, provide } from 'vue'
import type { InjectionKey } from 'vue'
import type { RealtimeClient } from '@tanstack/realtime'

export const REALTIME_CONTEXT_KEY: InjectionKey<RealtimeClient> =
  Symbol('RealtimeClient')

export function provideRealtimeClient(client: RealtimeClient): void {
  provide(REALTIME_CONTEXT_KEY, client)
}

/**
 * Internal helper — retrieves the `RealtimeClient` from context or throws a
 * descriptive error that names the calling composable.
 */
export function useRealtimeClient(hookName: string): RealtimeClient {
  const client = inject(REALTIME_CONTEXT_KEY)
  if (!client) {
    throw new Error(
      `[realtime] ${hookName} must be used inside <RealtimeProvider>.`,
    )
  }
  return client
}
