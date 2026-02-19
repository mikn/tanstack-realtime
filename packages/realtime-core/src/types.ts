/**
 * A structured query key — the same shape used by TanStack Query.
 * Arrays of strings, numbers, objects, booleans, or null values.
 */
export type QueryKey = ReadonlyArray<unknown>

/**
 * A user entry in a presence channel.
 * `connectionId` is a server-assigned stable identifier suitable for use as
 * a React key; `data` carries the user's ephemeral state.
 */
export interface PresenceUser<T = unknown> {
  connectionId: string
  data: T
}

// ---------------------------------------------------------------------------
// Wire protocol — the shared contract between client and server.
// Defined once in core to guarantee both sides always agree.
// ---------------------------------------------------------------------------

/** Messages sent from client to server. */
export type ClientMessage =
  | { type: 'subscribe'; key: string }
  | { type: 'unsubscribe'; key: string }
  | { type: 'presence:join'; key: string; data: unknown }
  | { type: 'presence:update'; key: string; data: unknown }
  | { type: 'presence:leave'; key: string }

/** Messages sent from server to client. */
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
