import { createMockTransport } from './mockTransport.js'
import type { PresenceCapable, PresenceUser } from '../core/types.js'
import type { MockTransport, MockTransportOptions } from './mockTransport.js'

export interface MockPresenceTransportOptions extends MockTransportOptions {}

export interface MockPresenceTransport extends MockTransport, PresenceCapable {
  /** Simulate a user joining presence on a channel. */
  simulatePresenceJoin: (channel: string, user: PresenceUser) => void
  /** Simulate a user leaving presence on a channel. */
  simulatePresenceLeave: (channel: string, connectionId: string) => void
  /** Get the current presence data for a channel. */
  getPresenceState: (channel: string) => ReadonlyArray<PresenceUser>
}

export function createMockPresenceTransport(
  options: MockPresenceTransportOptions = {},
): MockPresenceTransport {
  const base = createMockTransport(options)

  // Track presence state per channel
  const presenceState = new Map<string, Array<PresenceUser>>()
  // Track the "self" connectionId per channel so updatePresence / leavePresence
  // operate on the correct entry even when simulated peers are interspersed.
  const selfConnectionIds = new Map<string, string>()
  const presenceListeners = new Map<
    string,
    Set<(users: ReadonlyArray<PresenceUser>) => void>
  >()

  function notifyPresence(channel: string) {
    const users = presenceState.get(channel) ?? []
    const cbs = presenceListeners.get(channel)
    if (cbs) {
      for (const cb of cbs) cb(users)
    }
  }

  return {
    ...base,

    joinPresence(channel, data) {
      if (!presenceState.has(channel)) presenceState.set(channel, [])
      const users = presenceState.get(channel)!
      const connectionId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      selfConnectionIds.set(channel, connectionId)
      users.push({ connectionId, data })
      notifyPresence(channel)
    },

    updatePresence(channel, data) {
      const selfId = selfConnectionIds.get(channel)
      const users = presenceState.get(channel)
      if (selfId && users) {
        const self = users.find((u) => u.connectionId === selfId)
        if (self) {
          self.data = {
            ...(self.data as Record<string, unknown>),
            ...(data as Record<string, unknown>),
          }
          notifyPresence(channel)
        }
      }
    },

    leavePresence(channel) {
      const selfId = selfConnectionIds.get(channel)
      const users = presenceState.get(channel)
      if (selfId && users) {
        const idx = users.findIndex((u) => u.connectionId === selfId)
        if (idx !== -1) {
          users.splice(idx, 1)
        }
        selfConnectionIds.delete(channel)
        notifyPresence(channel)
      }
    },

    onPresenceChange(channel, callback) {
      if (!presenceListeners.has(channel)) {
        presenceListeners.set(channel, new Set())
      }
      presenceListeners.get(channel)!.add(callback)

      return () => {
        const set = presenceListeners.get(channel)
        if (set) {
          set.delete(callback)
          if (set.size === 0) presenceListeners.delete(channel)
        }
      }
    },

    // --- Mock control methods ---

    simulatePresenceJoin(channel, user) {
      if (!presenceState.has(channel)) presenceState.set(channel, [])
      presenceState.get(channel)!.push(user)
      notifyPresence(channel)
    },

    simulatePresenceLeave(channel, connectionId) {
      const users = presenceState.get(channel)
      if (users) {
        const idx = users.findIndex((u) => u.connectionId === connectionId)
        if (idx !== -1) {
          users.splice(idx, 1)
          notifyPresence(channel)
        }
      }
    },

    getPresenceState(channel) {
      return presenceState.get(channel) ?? []
    },
  }
}
