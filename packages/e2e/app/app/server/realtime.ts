/**
 * Server-side realtime handler (SSE) for the TanStack Start e2e app.
 * Mounted as an API route at /api/realtime.
 */
import { createStartHandler } from '@tanstack/realtime-preset-start'

export const realtime = createStartHandler({
  pingInterval: 0,
})
