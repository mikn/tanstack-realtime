/**
 * Re-export of `wsTransport` from `@tanstack/realtime` for backwards
 * compatibility. The transport is now in the base package because it is
 * browser-safe and has no Node.js dependencies.
 *
 * New code should import directly:
 *   import { wsTransport } from '@tanstack/realtime'
 *
 * In Node.js < 21 (no global WebSocket), pass the `ws` package:
 *   import { WebSocket } from 'ws'
 *   wsTransport({ url: '...', WebSocket })
 */

import { WebSocket as NodeWebSocket } from 'ws'
import { wsTransport } from '@tanstack/realtime'
import type { WsTransportOptions } from '@tanstack/realtime'

export type { WsTransportOptions as NodeTransportOptions }

/**
 * @deprecated Use `wsTransport` from `@tanstack/realtime` instead.
 * This re-export auto-injects the `ws` WebSocket for Node.js compatibility.
 */
export function nodeTransport(
  options: Omit<WsTransportOptions, 'WebSocket'> & {
    WebSocket?: typeof globalThis.WebSocket
  } = {},
) {
  return wsTransport({
    ...options,
    WebSocket:
      options.WebSocket ??
      (NodeWebSocket as unknown as typeof globalThis.WebSocket),
  })
}
