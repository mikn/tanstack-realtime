// Wire protocol types live in core — single source of truth.
export type {
  QueryKey,
  PresenceUser,
  ClientMessage,
  ServerMessage,
} from '@tanstack/realtime-core'

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'

import type { PresenceUser } from '@tanstack/realtime-core'

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
