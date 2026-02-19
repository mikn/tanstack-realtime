// Wire protocol types live in core — single source of truth.
export type {
  QueryKey,
  ClientMessage,
  ServerMessage,
} from '@tanstack/realtime-core'

/**
 * A presence event that flows through the adapter between server instances.
 * Each variant only carries fields that are meaningful for that event type.
 */
export type PresenceEvent =
  | { type: 'join'; connectionId: string; data: unknown }
  | { type: 'update'; connectionId: string; data: unknown }
  | { type: 'leave'; connectionId: string }
  | { type: 'sync'; users: Array<{ connectionId: string; data: unknown }> }

export interface RealtimeAdapter {
  /** Publish an invalidation signal to all instances */
  publish(serializedKey: string): Promise<void>
  /** Subscribe to invalidation signals from other instances */
  subscribe(callback: (serializedKey: string) => void): Promise<void>
  /** Publish presence update to all instances */
  publishPresence(channel: string, event: PresenceEvent): Promise<void>
  /** Subscribe to presence events from other instances */
  subscribePresence(
    callback: (channel: string, event: PresenceEvent) => void,
  ): Promise<void>
  /** Cleanup */
  close(): Promise<void>
}
