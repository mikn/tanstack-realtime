/**
 * Self-test for @realtimejs/adapter-conformance.
 *
 * Runs `runAdapterConformance` — the reusable transport conformance battery —
 * against BOTH in-repo mock transports:
 *   - `createMockTransport`         (presence: false)
 *   - `createMockPresenceTransport` (presence: true)
 *
 * This proves two things at once:
 *   1. The conformance kit itself works (its battery registers and passes).
 *   2. The mocks are conformant `RealtimeTransport` implementations and that
 *      their declared capabilities are honest.
 *
 * P-3 will run the same `runAdapterConformance` against the Centrifugo adapter;
 * P-4/P-5 against Pusher and PartyKit. Every adapter runs this identical
 * battery — that is what turns "commoditise most WS providers" into a guarantee.
 */

import {
  createMockPresenceTransport,
  createMockTransport,
} from '@realtimejs/core'
import { runAdapterConformance } from '@realtimejs/adapter-conformance'
import type {
  MockPresenceTransport,
  MockTransport,
  PresenceUser,
  TransportCapabilities,
} from '@realtimejs/core'

// ---------------------------------------------------------------------------
// Mock #1 — base (non-presence) transport
// ---------------------------------------------------------------------------

const BASE_CAPS: TransportCapabilities = {
  presence: false,
  serverAssistedRecovery: false,
  history: false,
  ephemeral: true,
}

{
  // The kit calls `createTransport()` fresh per test; the simulate/emit hooks
  // must target the most-recently-created instance, so capture it in a closure.
  let current: MockTransport

  runAdapterConformance({
    name: 'createMockTransport',
    capabilities: BASE_CAPS,
    createTransport: () => {
      current = createMockTransport({ capabilities: BASE_CAPS })
      return current
    },
    emitMessage: (channel, data) => current.simulateMessage(channel, data),
    simulateDisconnect: () => current.simulateDisconnect(),
    simulateReconnect: () => current.simulateReconnect(),
    simulateSubscribeError: (channel, reason, code) =>
      current.simulateSubscribeError(channel, reason, code),
  })
}

// ---------------------------------------------------------------------------
// Mock #2 — presence-capable transport
// ---------------------------------------------------------------------------

const PRESENCE_CAPS: TransportCapabilities = {
  presence: true,
  serverAssistedRecovery: false,
  history: false,
  ephemeral: true,
}

{
  let current: MockPresenceTransport

  runAdapterConformance({
    name: 'createMockPresenceTransport',
    capabilities: PRESENCE_CAPS,
    createTransport: () => {
      current = createMockPresenceTransport({ capabilities: PRESENCE_CAPS })
      return current
    },
    emitMessage: (channel, data) => current.simulateMessage(channel, data),
    simulateDisconnect: () => current.simulateDisconnect(),
    simulateReconnect: () => current.simulateReconnect(),
    simulateSubscribeError: (channel, reason, code) =>
      current.simulateSubscribeError(channel, reason, code),
    // The mock has no single "deliver this exact member list" hook, so build
    // the list up via simulatePresenceJoin — the final notification carries the
    // full member set, which is what the kit asserts on.
    emitPresence: (channel, members: ReadonlyArray<PresenceUser>) => {
      for (const member of members)
        current.simulatePresenceJoin(channel, member)
    },
  })
}
