/**
 * Test worker entry point for @cloudflare/vitest-pool-workers.
 *
 * Exports the RealtimeChannel DO class (so wrangler can bind it) and wires up
 * a real createWorkerdHandler with simple allow/deny auth logic that the
 * integration tests can exercise.
 *
 * Token rules:
 *   (none)       → subscribe + publish + presence
 *   'readonly'   → subscribe + presence only (no publish)
 *   'deny'       → rejected (null permissions)
 */
import {
  RealtimeChannel,
  createWorkerdHandler,
  type WorkerdEnv,
} from '@tanstack/realtime-preset-workerd'

// Re-export so wrangler binds the class to REALTIME_CHANNEL.
export { RealtimeChannel }

const handler = createWorkerdHandler<WorkerdEnv>({
  getAuthToken(request) {
    return new URL(request.url).searchParams.get('token')
  },
  authorize(token, _channel) {
    if (token === 'deny') return null
    return {
      subscribe: true,
      publish: token !== 'readonly',
      presence: true,
    }
  },
})

export default { fetch: handler.fetch }
