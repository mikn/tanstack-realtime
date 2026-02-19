// Re-export the canonical type from core so consumers have a single import.
export type { QueryKey } from '@tanstack/realtime-core'

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'

export interface PresenceUser<T = unknown> {
  connectionId: string
  data: T
}

export type StatusListener = (status: ConnectionStatus) => void
export type InvalidateListener = (key: string) => void
export type PresenceListener = (
  key: string,
  event: PresenceClientEvent,
) => void

export type PresenceClientEvent =
  | { type: 'join'; connectionId: string; data: unknown }
  | { type: 'update'; connectionId: string; data: unknown }
  | { type: 'leave'; connectionId: string }
  | { type: 'sync'; users: Array<PresenceUser> }

// Wire protocol messages (client → server)
export type ClientMessage =
  | { type: 'subscribe'; key: string }
  | { type: 'unsubscribe'; key: string }
  | { type: 'presence:join'; key: string; data: unknown }
  | { type: 'presence:update'; key: string; data: unknown }
  | { type: 'presence:leave'; key: string }

// Wire protocol messages (server → client)
export type ServerMessage =
  | { type: 'invalidate'; key: string }
  | { type: 'presence:join'; key: string; connectionId: string; data: unknown }
  | { type: 'presence:update'; key: string; connectionId: string; data: unknown }
  | { type: 'presence:leave'; key: string; connectionId: string }
  | {
      type: 'presence:sync'
      key: string
      users: Array<{ connectionId: string; data: unknown }>
    }
