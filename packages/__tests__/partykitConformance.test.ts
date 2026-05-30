/**
 * Conformance battery for @realtimejs/adapter-partykit (P-5).
 *
 * Runs the reusable `runAdapterConformance` kit against the REAL PartyKit
 * adapter wired to a SYNCHRONOUS fake `PartySocket`. This proves the
 * `RealtimeTransport` (+ `PresenceCapable`) contract and the conformance kit
 * generalise to a THIRD, structurally different infra model: a single
 * multiplexed socket to an edge Durable Object that holds membership
 * server-side (vs. Centrifugo's single socket and Pusher's per-channel objects).
 *
 * ## How the fake models the provider so the three-phase reconnect has teeth
 *
 * `FakePartySocket` models ONE multiplexed room connection that speaks the
 * adapter's envelope wire protocol. It separates two things, exactly like a real
 * PartyKit room:
 *   - the SOCKET OBJECT, which `partysocket` REUSES across reconnects (it is a
 *     reconnecting WebSocket that re-fires `open` on the same instance — it
 *     never hands the adapter a fresh object), and
 *   - the provider-side `subscribed` channel set, which the room drops when the
 *     underlying connection is lost and which the client must REBUILD by
 *     re-sending `{type:'subscribe'}` envelopes on the next `open`.
 *
 * Envelope handling:
 *   - `{type:'subscribe', channel}`   → add to `subscribed`.
 *   - `{type:'unsubscribe', channel}` → remove from `subscribed`.
 *   - `{type:'publish'}`              → accepted (no echo needed by the kit).
 *   - `{type:'presence:*'}`           → tracked for presence reporting.
 *   - `emitMessage(ch,data)`          → delivers a `{type:'message'}` envelope
 *                                       ONLY if `ch` is currently subscribed.
 *   - `simulateDisconnect()`          → clears `subscribed` and fires `close`
 *                                       (adapter → `reconnecting`). A message
 *                                       emitted while disconnected is dropped.
 *   - `simulateReconnect()`           → re-fires `open` on the SAME socket
 *                                       object. The adapter's `open` handler
 *                                       runs `resubscribeAll()`, re-sending a
 *                                       subscribe envelope per active channel —
 *                                       repopulating `subscribed` and restoring
 *                                       delivery. A no-op transport that never
 *                                       re-subscribes fails the kit's
 *                                       negative→positive reconnect assertion.
 *
 * CRITICAL (P-4 lesson): the fake REUSES the socket object across reconnects,
 * mirroring real `partysocket`. The adapter binds its single `message` listener
 * ONCE per socket instance and never re-binds on reconnect, so a double-bind
 * would be CAUGHT here as duplicate delivery — see the dedicated single-delivery
 * guard below. Everything is synchronous (no timers between an emit and the
 * assertion), matching the kit's synchronous delivery contract.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { partykitTransport } from '@realtimejs/adapter-partykit'
import { runAdapterConformance } from '@realtimejs/adapter-conformance'
import type {
  PresenceUser,
  RealtimeTransport,
  TransportCapabilities,
} from '@realtimejs/core'

// The exact flags declared on partykitTransport (see transport.ts). The kit's
// capability-honesty cases assert getCapabilities() deep-equals this object.
const PARTYKIT_CAPS: TransportCapabilities = {
  presence: true,
  serverAssistedRecovery: false,
  history: false,
  ephemeral: true,
}

type Listener = (event: unknown) => void

interface ClientEnvelope {
  type: string
  channel?: string
  data?: unknown
}

// ---------------------------------------------------------------------------
// Fake PartySocket (structurally satisfies PartySocketLike)
// ---------------------------------------------------------------------------

class FakePartySocket {
  // WebSocket-style readyState. Like a real PartySocket, the connection is
  // established asynchronously after construction — we auto-fire `open` on a
  // microtask (the kit awaits connect(), which flushes it). It does NOT start
  // OPEN, so the adapter waits for `open` and learns its connectionId from the
  // `connected` envelope that follows.
  readyState = 0 // CONNECTING

  private readonly listeners = new Map<string, Set<Listener>>()
  /** Provider-side subscription set — the heart of the reconnect check. */
  private readonly subscribed = new Set<string>()
  /** channel → presence payload this connection joined with. */
  private readonly presence = new Map<string, unknown>()
  /** The connection id the room assigns us (sent in the `connected` envelope). */
  readonly connectionId = 'self-conn'

  // Count how many times each event type has been bound, so a test can assert
  // the adapter binds its handlers EXACTLY once per socket instance.
  readonly bindCounts = new Map<string, number>()

  addEventListener(type: string, listener: Listener): void {
    let set = this.listeners.get(type)
    if (!set) {
      set = new Set()
      this.listeners.set(type, set)
    }
    set.add(listener)
    this.bindCounts.set(type, (this.bindCounts.get(type) ?? 0) + 1)
    // Mirror PartySocket: the connection opens asynchronously after the adapter
    // has bound its listeners. We schedule `open` once the adapter binds its
    // `open` handler (which it does inside connect() before awaiting
    // 'connected'); the microtask flushes during that await — AFTER all
    // listeners are in place, so the `connected` envelope is delivered.
    if (type === 'open' && this.readyState === 0) {
      queueMicrotask(() => {
        if (this.readyState === 0) this.fireConnected()
      })
    }
  }

  removeEventListener(type: string, listener: Listener): void {
    this.listeners.get(type)?.delete(listener)
  }

  send(raw: string): void {
    let env: ClientEnvelope
    try {
      env = JSON.parse(raw) as ClientEnvelope
    } catch {
      return
    }
    switch (env.type) {
      case 'subscribe':
        if (env.channel) this.subscribed.add(env.channel)
        break
      case 'unsubscribe':
        if (env.channel) this.subscribed.delete(env.channel)
        break
      case 'presence:join':
      case 'presence:update':
        if (env.channel) this.presence.set(env.channel, env.data)
        break
      case 'presence:leave':
        if (env.channel) this.presence.delete(env.channel)
        break
      // publish: accepted; the kit does not require an echo.
    }
  }

  close(): void {
    this.readyState = 3 // CLOSED
  }

  reconnect(): void {
    /* PartySocket exposes this; not needed by the harness. */
  }

  private emit(type: string, event: unknown): void {
    for (const l of this.listeners.get(type) ?? []) l(event)
  }

  // ── Harness control surface ──────────────────────────────────────────────

  /** Fire the initial `open` (the adapter awaits connect() until 'connected'). */
  fireConnected(): void {
    this.readyState = 1
    this.emit('open', {})
    // The room tells the client its connection id for presence self-exclusion.
    this.emit('message', {
      data: JSON.stringify({
        type: 'connected',
        connectionId: this.connectionId,
      }),
    })
  }

  emitMessage(channel: string, data: unknown): void {
    if (!this.subscribed.has(channel)) return // dropped: not subscribed
    this.emit('message', {
      data: JSON.stringify({ type: 'message', channel, data }),
    })
  }

  emitSubscribeError(channel: string, reason: string, code?: number): void {
    this.emit('message', {
      data: JSON.stringify({ type: 'subscribe:error', channel, reason, code }),
    })
  }

  emitPresence(channel: string, members: ReadonlyArray<PresenceUser>): void {
    this.emit('message', {
      data: JSON.stringify({
        type: 'presence',
        channel,
        members: members.map((m) => ({
          connectionId: m.connectionId,
          data: m.data,
        })),
      }),
    })
  }

  simulateDisconnect(): void {
    // The room drops our subscriptions when the underlying connection is lost.
    this.subscribed.clear()
    this.readyState = 0 // CONNECTING (reconnecting)
    this.emit('close', {})
  }

  simulateReconnect(): void {
    // Real partysocket re-fires `open` on the SAME object. The adapter, which
    // bound its listeners once, re-sends subscribe envelopes from its `open`
    // handler — repopulating `subscribed`.
    this.fireConnected()
  }
}

// ---------------------------------------------------------------------------
// Harness wiring
// ---------------------------------------------------------------------------

let socket: FakePartySocket

beforeEach(() => {
  socket = new FakePartySocket()
})

function createTransport(): RealtimeTransport {
  // Inject the fake socket. It starts OPEN, so the adapter's connect() takes
  // the already-open fast path and resubscribes synchronously.
  return partykitTransport({ socket })
}

runAdapterConformance({
  name: 'partykitTransport',
  capabilities: PARTYKIT_CAPS,
  createTransport,
  emitMessage: (channel, data) => socket.emitMessage(channel, data),
  simulateDisconnect: () => socket.simulateDisconnect(),
  simulateReconnect: () => socket.simulateReconnect(),
  simulateSubscribeError: (channel, reason, code) =>
    socket.emitSubscribeError(channel, reason, code),
  emitPresence: (channel, members) => socket.emitPresence(channel, members),
})

// ---------------------------------------------------------------------------
// Regression guard: single delivery across reconnects (no double-bind).
//
// Real partysocket REUSES the socket object across reconnects (it re-fires
// `open` on the same instance). The adapter binds its single `message` listener
// ONCE per socket instance and re-sends subscribe envelopes from `open` WITHOUT
// re-binding. This locks in the single-delivery invariant across MULTIPLE
// reconnect cycles (the kit's three-phase case covers one) and asserts the
// adapter never accumulates a second `message`/`open` listener.
// ---------------------------------------------------------------------------

describe('partykitTransport single-delivery-across-reconnects guard', () => {
  it('delivers a single inbound message exactly once after repeated reconnects', async () => {
    const t = createTransport()
    await t.connect()

    const got: Array<unknown> = []
    const unsub = t.subscribe('room', (data) => got.push(data))

    socket.emitMessage('room', 'm0')
    expect(got).toEqual(['m0'])

    for (let i = 1; i <= 3; i++) {
      socket.simulateDisconnect()
      // (negative phase) message while disconnected is dropped.
      socket.emitMessage('room', `dropped-${i}`)
      socket.simulateReconnect()
      got.length = 0
      socket.emitMessage('room', `m${i}`)
      expect(got, `after ${i} reconnect(s) the message must fire once`).toEqual(
        [`m${i}`],
      )
    }

    unsub()
    t.disconnect()
  })

  it('binds its socket listeners exactly once per socket instance', async () => {
    const t = createTransport()
    await t.connect()

    // Drive several reconnects; the adapter must NOT re-bind listeners on the
    // reused socket object.
    for (let i = 0; i < 3; i++) {
      socket.simulateDisconnect()
      socket.simulateReconnect()
    }

    expect(socket.bindCounts.get('message')).toBe(1)
    expect(socket.bindCounts.get('open')).toBe(1)
    expect(socket.bindCounts.get('close')).toBe(1)

    t.disconnect()
  })

  it('excludes self from the reported presence member list', async () => {
    const t = createTransport() as RealtimeTransport & {
      onPresenceChange: (
        channel: string,
        cb: (users: ReadonlyArray<PresenceUser>) => void,
      ) => () => void
    }
    await t.connect()

    const lists: Array<ReadonlyArray<PresenceUser>> = []
    const off = t.onPresenceChange('lobby', (users) => lists.push(users))

    // The room reports the FULL membership including us ('self-conn'); the
    // adapter must drop the entry matching the connectionId it learned on
    // connect.
    socket.emitPresence('lobby', [
      { connectionId: 'self-conn', data: { me: true } },
      { connectionId: 'peer-a', data: { name: 'alice' } },
    ])

    const reported = lists[lists.length - 1] ?? []
    expect(reported.map((u) => u.connectionId)).toEqual(['peer-a'])

    off()
    t.disconnect()
  })
})
