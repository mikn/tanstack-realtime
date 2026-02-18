export type QueryKey = ReadonlyArray<unknown>

export interface PresenceEvent {
  type: 'join' | 'update' | 'leave' | 'sync'
  connectionId: string
  data?: unknown
  users?: Array<{ connectionId: string; data: unknown }>
}

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

// Messages sent from client to server
export type ClientMessage =
  | { type: 'subscribe'; key: string }
  | { type: 'unsubscribe'; key: string }
  | { type: 'presence:join'; key: string; data: unknown }
  | { type: 'presence:update'; key: string; data: unknown }
  | { type: 'presence:leave'; key: string }

// Messages sent from server to client
export type ServerMessage =
  | { type: 'invalidate'; key: string }
  | { type: 'presence:join'; key: string; connectionId: string; data: unknown }
  | {
      type: 'presence:update'
      key: string
      connectionId: string
      data: unknown
    }
  | { type: 'presence:leave'; key: string; connectionId: string }
  | {
      type: 'presence:sync'
      key: string
      users: Array<{ connectionId: string; data: unknown }>
    }
