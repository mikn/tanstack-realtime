import { createMockTransport } from './mockTransport.js'
import type {
  PresenceCapable,
  PresenceUser,
  TransportCapabilities,
} from '../core/types.js'
import type { MockTransport, MockTransportOptions } from './mockTransport.js'

export interface MockPresenceTransportOptions extends MockTransportOptions {}

/** Default capabilities for the presence-capable mock transport. */
const DEFAULT_MOCK_PRESENCE_CAPABILITIES: TransportCapabilities = {
  presence: true,
  serverAssistedRecovery: false,
  history: false,
  ephemeral: true,
}

export interface MockPresenceTransport extends MockTransport, PresenceCapable {
  simulatePresenceJoin: (channel: string, user: PresenceUser) => void
  simulatePresenceLeave: (channel: string, connectionId: string) => void
  getPresenceState: (channel: string) => ReadonlyArray<PresenceUser>
}

export function createMockPresenceTransport(
  options: MockPresenceTransportOptions = {},
): MockPresenceTransport {
  // Default to a presence-capable capability set; callers can still override
  // via `options.capabilities` (useful for the conformance kit).
  const base = createMockTransport({
    capabilities: DEFAULT_MOCK_PRESENCE_CAPABILITIES,
    ...options,
  })

  const presenceState = new Map<string, Array<PresenceUser>>()
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

    get publishLog() {
      return base.publishLog
    },
    get activeChannels() {
      return base.activeChannels
    },

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
