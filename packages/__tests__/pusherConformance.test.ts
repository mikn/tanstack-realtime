/**
 * Conformance battery for @realtimejs/adapter-pusher (P-4).
 *
 * Runs the reusable `runAdapterConformance` kit against the REAL Pusher adapter
 * (the first NEW provider adapter) wired to a SYNCHRONOUS fake Pusher client.
 * This proves the `RealtimeTransport` (+ `PresenceCapable`) contract and the
 * conformance kit generalise beyond Centrifugo to a second, structurally
 * different provider (Pusher's `(event, data)` channel model + presence
 * channels + client-event publish).
 *
 * ## How the fake models the provider so the three-phase reconnect has teeth
 *
 * `FakePusher` separates two things, exactly like real pusher-js: the channel
 * OBJECTS it retains for the client's lifetime (`channels`), and which of them
 * are CURRENTLY subscribed at the provider (`activeSubs`):
 *   - `subscribe(ch)`        → REUSES the existing channel object if present
 *                              (real pusher-js never discards channel objects);
 *                              marks `ch` active; fires
 *                              `pusher:subscription_succeeded` so presence
 *                              members are reported.
 *   - `unsubscribe(ch)`      → marks `ch` inactive AND releases the object
 *                              (mirrors `Pusher.unsubscribe`).
 *   - `emitMessage(ch,data)` → invokes the `'message'` handler ONLY if `ch` is
 *                              currently active (drops otherwise).
 *   - `simulateDisconnect()` → clears `activeSubs` but RETAINS channel objects
 *                              and their bindings; fires `state_change` →
 *                              `unavailable` so the adapter goes
 *                              `reconnecting`. A message emitted while
 *                              disconnected is NOT delivered.
 *   - `simulateReconnect()`  → fires `state_change` → `connected`. The adapter's
 *                              `handleStateChange('connected')` runs
 *                              `resubscribeAll()`, which calls `subscribe(ch)`
 *                              again for every active channel — re-activating it
 *                              against the SAME retained channel object and
 *                              restoring delivery. If the adapter did NOT
 *                              re-subscribe, the channel stays inactive and the
 *                              post-reconnect message is dropped, failing the
 *                              kit's negative→positive reconnect assertion.
 *
 * Retaining the channel object across a disconnect is what gives the kit teeth
 * against handler double-binding: if the adapter re-binds its `'message'`
 * handler on reconnect WITHOUT unbinding first, the reused object now has two
 * handlers and a single `emitMessage` fans out twice — caught by the
 * three-phase reconnect assertion and by the dedicated double-bind guard below.
 *
 * Everything is synchronous (no timers / microtasks between an emit and the
 * assertion), matching the kit's synchronous delivery contract.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { pusherTransport } from '@realtimejs/adapter-pusher'
import { runAdapterConformance } from '@realtimejs/adapter-conformance'
import type {
  PresenceUser,
  RealtimeTransport,
  TransportCapabilities,
} from '@realtimejs/core'

// The exact flags declared on pusherTransport (see transport.ts). The kit's
// capability-honesty cases assert getCapabilities() deep-equals this object.
const PUSHER_CAPS: TransportCapabilities = {
  presence: true,
  serverAssistedRecovery: false,
  history: false,
  ephemeral: true,
}

const PRESENCE_PREFIX = 'presence-'

type Handler = (data: unknown) => void

// ---------------------------------------------------------------------------
// Fake Pusher channel object
// ---------------------------------------------------------------------------

interface FakeMember {
  id: string
  info?: unknown
}

class FakeChannel {
  private readonly handlers = new Map<string, Set<Handler>>()
  /** Member list (presence channels only). */
  readonly memberMap = new Map<string, unknown>()
  /** This connection's own member (presence channels only). */
  me: FakeMember | null = null

  constructor(readonly name: string) {}

  get isPresence(): boolean {
    return this.name.startsWith(PRESENCE_PREFIX)
  }

  bind(event: string, handler: Handler): void {
    let set = this.handlers.get(event)
    if (!set) {
      set = new Set()
      this.handlers.set(event, set)
    }
    set.add(handler)
  }

  unbind(event: string, handler?: Handler): void {
    if (!handler) {
      this.handlers.delete(event)
      return
    }
    this.handlers.get(event)?.delete(handler)
  }

  trigger(_event: string, _data: unknown): boolean {
    // Client events are best-effort and require private/presence channels.
    // The fake accepts the call (and reports success on presence channels) but
    // does not loop the event back — matching Pusher (the sender does not
    // receive its own client event).
    return this.isPresence
  }

  emit(event: string, data: unknown): void {
    for (const h of this.handlers.get(event) ?? []) h(data)
  }

  /** Pusher presence channel `members` shape consumed by the adapter. */
  get members(): {
    me: FakeMember | null
    each: (cb: (m: FakeMember) => void) => void
  } {
    return {
      me: this.me,
      each: (cb) => {
        for (const [id, info] of this.memberMap) cb({ id, info })
      },
    }
  }
}

// ---------------------------------------------------------------------------
// Fake Pusher client (structurally satisfies PusherLike)
// ---------------------------------------------------------------------------

class FakePusher {
  connection = {
    state: 'initialized' as string,
    bind: (event: string, handler: Handler) => {
      let set = this.connectionHandlers.get(event)
      if (!set) {
        set = new Set()
        this.connectionHandlers.set(event, set)
      }
      set.add(handler)
    },
  }

  private readonly connectionHandlers = new Map<string, Set<Handler>>()
  /**
   * Channel OBJECTS, retained for the lifetime of the client — mirrors real
   * pusher-js, which keeps `Channel` instances (and their event bindings)
   * across disconnects and REUSES them on reconnect rather than constructing
   * fresh ones. `subscribe(name)` returns the pre-existing object if present.
   */
  private readonly channels = new Map<string, FakeChannel>()
  /**
   * Which channels are CURRENTLY subscribed at the provider — the heart of the
   * reconnect check. A disconnect flips these off (so `emitMessage` drops while
   * disconnected) WITHOUT discarding the channel objects, so a double-bind
   * survives a reconnect and is observable as duplicate delivery.
   */
  private readonly activeSubs = new Set<string>()

  connect(): void {
    this.setState('connecting')
    this.setState('connected')
  }

  disconnect(): void {
    // Real pusher-js retains channel objects on disconnect; it only stops
    // delivering. Keep the objects (and their bindings), just mark inactive.
    this.activeSubs.clear()
    this.setState('disconnected')
  }

  subscribe(name: string): FakeChannel {
    let ch = this.channels.get(name)
    if (!ch) {
      ch = new FakeChannel(name)
      this.channels.set(name, ch)
    }
    this.activeSubs.add(name)
    // Presence channels: the auth flow assigns this connection a member id.
    if (ch.isPresence && !ch.me) {
      ch.me = { id: 'self-conn', info: { self: true } }
      ch.memberMap.set('self-conn', { self: true })
    }
    // Pusher fires subscription_succeeded once the subscribe round-trips.
    ch.emit('pusher:subscription_succeeded', {})
    return ch
  }

  unsubscribe(name: string): void {
    // An explicit unsubscribe DOES release the channel object (matches real
    // pusher-js `Pusher.unsubscribe`, which removes it from its channels map).
    this.activeSubs.delete(name)
    this.channels.delete(name)
  }

  channel(name: string): FakeChannel | undefined {
    return this.activeSubs.has(name) ? this.channels.get(name) : undefined
  }

  private setState(state: string): void {
    const previous = this.connection.state
    this.connection.state = state
    for (const h of this.connectionHandlers.get('state_change') ?? []) {
      h({ previous, current: state })
    }
  }

  // ── Harness control surface ──────────────────────────────────────────────

  /** The currently-subscribed channel object, or undefined if dropped. */
  private activeChannel(name: string): FakeChannel | undefined {
    return this.activeSubs.has(name) ? this.channels.get(name) : undefined
  }

  emitMessage(channel: string, data: unknown): void {
    const ch = this.activeChannel(channel)
    if (!ch) return // dropped: not currently subscribed at the provider
    ch.emit('message', data)
  }

  emitSubscribeError(channel: string, reason: string, code?: number): void {
    const ch = this.activeChannel(channel)
    if (!ch) return
    ch.emit('pusher:subscription_error', {
      type: 'AuthError',
      error: reason,
      status: code,
    })
  }

  emitPresence(channel: string, members: ReadonlyArray<PresenceUser>): void {
    const ch = this.activeChannel(`${PRESENCE_PREFIX}${channel}`)
    if (!ch) return
    for (const m of members) {
      ch.memberMap.set(m.connectionId, m.data)
      ch.emit('pusher:member_added', { id: m.connectionId, info: m.data })
    }
  }

  simulateDisconnect(): void {
    // Mirror real pusher-js: a transport drop stops delivery (channels become
    // inactive) but RETAINS the channel objects and their bindings. On
    // reconnect the adapter re-subscribes the SAME object — so if it re-binds
    // without unbinding, the double-bind is observable as duplicate delivery.
    this.activeSubs.clear()
    this.setState('unavailable')
  }

  simulateReconnect(): void {
    this.setState('connected')
  }
}

// ---------------------------------------------------------------------------
// Harness wiring
// ---------------------------------------------------------------------------

let pusher: FakePusher

beforeEach(() => {
  pusher = new FakePusher()
})

function createTransport(): RealtimeTransport {
  return pusherTransport({ pusher })
}

runAdapterConformance({
  name: 'pusherTransport',
  capabilities: PUSHER_CAPS,
  createTransport,
  emitMessage: (channel, data) => pusher.emitMessage(channel, data),
  simulateDisconnect: () => pusher.simulateDisconnect(),
  simulateReconnect: () => pusher.simulateReconnect(),
  simulateSubscribeError: (channel, reason, code) =>
    pusher.emitSubscribeError(channel, reason, code),
  emitPresence: (channel, members) => pusher.emitPresence(channel, members),
})

// ---------------------------------------------------------------------------
// Regression guard: handler double-binding across reconnects (P-4 review).
//
// Real pusher-js REUSES channel objects across reconnects. The adapter runs
// resubscribeAll() on every `state_change → connected`, re-binding its
// PUSHER-level handlers on the SAME reused channel object. Without an
// unbind-before-rebind step that accumulates a duplicate 'message' handler per
// reconnect, fanning a single inbound message out to the realtime.js subscriber
// N+1 times after N reconnects. This locks in the single-delivery invariant
// across MULTIPLE reconnect cycles (the kit's three-phase case covers one).
// ---------------------------------------------------------------------------

describe('pusherTransport double-bind regression guard', () => {
  it('delivers a single inbound message exactly once after repeated reconnects', async () => {
    const t = createTransport()
    await t.connect()

    const got: Array<unknown> = []
    const unsub = t.subscribe('room', (data) => got.push(data))

    pusher.emitMessage('room', 'm0')
    expect(got).toEqual(['m0'])

    // Three disconnect/reconnect cycles against the REUSED channel object.
    for (let i = 1; i <= 3; i++) {
      pusher.simulateDisconnect()
      pusher.simulateReconnect()
      got.length = 0
      pusher.emitMessage('room', `m${i}`)
      // Exactly one delivery, not N+1.
      expect(got, `after ${i} reconnect(s) the message must fire once`).toEqual(
        [`m${i}`],
      )
    }

    unsub()
    t.disconnect()
  })

  it('fires presence callbacks once per change after repeated reconnects', async () => {
    const t = createTransport() as RealtimeTransport & {
      onPresenceChange: (
        channel: string,
        cb: (users: ReadonlyArray<PresenceUser>) => void,
      ) => () => void
    }
    await t.connect()

    let calls = 0
    const off = t.onPresenceChange('lobby', () => {
      calls++
    })

    for (let i = 1; i <= 3; i++) {
      pusher.simulateDisconnect()
      pusher.simulateReconnect()
      calls = 0
      pusher.emitPresence('lobby', [{ connectionId: `peer-${i}`, data: {} }])
      // A single member_added must invoke the presence callback exactly once.
      expect(calls, `after ${i} reconnect(s) presence must fire once`).toBe(1)
    }

    off()
    t.disconnect()
  })
})
