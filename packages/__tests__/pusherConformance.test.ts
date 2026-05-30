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
 * `FakePusher` keeps a provider-side `subscribed` set of channel names, exactly
 * like a real broker:
 *   - `subscribe(ch)`        → adds `ch`, returns a channel object whose `bind`
 *                              registers handlers; fires
 *                              `pusher:subscription_succeeded` so presence
 *                              members are reported.
 *   - `unsubscribe(ch)`      → removes `ch`.
 *   - `emitMessage(ch,data)` → invokes the `'message'` handler ONLY if `ch` is
 *                              currently in `subscribed` (drops otherwise).
 *   - `simulateDisconnect()` → clears `subscribed`, sets connection state and
 *                              fires `state_change` → `unavailable` so the
 *                              adapter goes `reconnecting`. A message emitted
 *                              while disconnected is NOT delivered.
 *   - `simulateReconnect()`  → fires `state_change` → `connected`. The adapter's
 *                              `handleStateChange('connected')` runs
 *                              `resubscribeAll()`, which calls `subscribe(ch)`
 *                              again for every active channel — repopulating
 *                              the provider-side `subscribed` set and restoring
 *                              delivery. If the adapter did NOT re-subscribe,
 *                              the set would stay empty and the post-reconnect
 *                              message would be dropped, failing the kit's
 *                              negative→positive reconnect assertion. The
 *                              re-subscription is genuinely exercised.
 *
 * Everything is synchronous (no timers / microtasks between an emit and the
 * assertion), matching the kit's synchronous delivery contract.
 */

import { beforeEach } from 'vitest'
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
  /** Provider-side subscription set — the heart of the reconnect check. */
  private readonly subscribed = new Map<string, FakeChannel>()

  connect(): void {
    this.setState('connecting')
    this.setState('connected')
  }

  disconnect(): void {
    this.subscribed.clear()
    this.setState('disconnected')
  }

  subscribe(name: string): FakeChannel {
    let ch = this.subscribed.get(name)
    if (!ch) {
      ch = new FakeChannel(name)
      this.subscribed.set(name, ch)
    }
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
    this.subscribed.delete(name)
  }

  channel(name: string): FakeChannel | undefined {
    return this.subscribed.get(name)
  }

  private setState(state: string): void {
    const previous = this.connection.state
    this.connection.state = state
    for (const h of this.connectionHandlers.get('state_change') ?? []) {
      h({ previous, current: state })
    }
  }

  // ── Harness control surface ──────────────────────────────────────────────

  emitMessage(channel: string, data: unknown): void {
    const ch = this.subscribed.get(channel)
    if (!ch) return // dropped: not currently subscribed at the provider
    ch.emit('message', data)
  }

  emitSubscribeError(channel: string, reason: string, code?: number): void {
    const ch = this.subscribed.get(channel)
    if (!ch) return
    ch.emit('pusher:subscription_error', {
      type: 'AuthError',
      error: reason,
      status: code,
    })
  }

  emitPresence(channel: string, members: ReadonlyArray<PresenceUser>): void {
    const ch = this.subscribed.get(`${PRESENCE_PREFIX}${channel}`)
    if (!ch) return
    for (const m of members) {
      ch.memberMap.set(m.connectionId, m.data)
      ch.emit('pusher:member_added', { id: m.connectionId, info: m.data })
    }
  }

  simulateDisconnect(): void {
    this.subscribed.clear()
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
