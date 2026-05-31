/**
 * Conformance battery for @realtimejs/adapter-centrifugo (P-3).
 *
 * Runs the reusable `runAdapterConformance` kit against the REAL Centrifugo
 * adapter — not a mock — to prove that the capability contract (P-1) and the
 * conformance kit (P-2) generalise to a production adapter before the
 * Pusher/PartyKit adapters are written.
 *
 * ## Why a hand-rolled synchronous fake WebSocket (not the `ws` mini-server)
 *
 * `centrifugo.test.ts` drives the adapter against a real in-process `ws`
 * server. That is ideal for async integration coverage, but the conformance
 * kit asserts delivery SYNCHRONOUSLY (`emitMessage(...)` then `expect(got)...`
 * in the same tick, with no `await` between `simulateReconnect()` and the
 * post-reconnect assertion). Real socket traffic is asynchronous, so we instead
 * reuse the same Centrifugo-protocol modelling over a synchronous fake
 * `WebSocket` whose lifecycle we can drive deterministically. The protocol the
 * fake speaks is identical to the `ws` mini-server in `centrifugo.test.ts`
 * (connect handshake → clientId, subscribe/unsubscribe acks, publish echo).
 *
 * ## How the fake models the provider so the three-phase reconnect check has teeth
 *
 * The fake server keeps a provider-side `subscribed` channel set, exactly like
 * a real broker:
 *   - `subscribe` command   → adds the channel, sends a subscribe reply.
 *   - `unsubscribe` command  → removes the channel.
 *   - `emitMessage(ch)`      → delivers a `publication` push ONLY if `ch` is
 *                              currently in `subscribed` (drops otherwise).
 *   - `simulateDisconnect()` → fires the socket `close` event (the adapter goes
 *                              `reconnecting` and schedules a reconnect) AND
 *                              clears the provider-side `subscribed` set, so a
 *                              message emitted while disconnected is NOT
 *                              delivered.
 *   - `simulateReconnect()`  → advances the adapter's (faked) reconnect timer so
 *                              it opens a fresh socket, then synchronously fires
 *                              that socket's `open` event. The adapter runs its
 *                              real connect handshake; on the connect reply it
 *                              runs `resubscribeAll()`, re-sending a subscribe
 *                              command for every still-active channel — which is
 *                              what repopulates the provider-side `subscribed`
 *                              set and restores delivery. If the adapter did NOT
 *                              re-subscribe on reconnect, the set would stay
 *                              empty and the post-reconnect message would be
 *                              dropped, failing the kit's negative→positive
 *                              reconnect assertion. The re-subscription is thus
 *                              genuinely exercised, not faked by the harness.
 *
 * Fake timers let `simulateReconnect()` drive the adapter's timer-based
 * reconnect synchronously; the socket `open` event is fired explicitly (rather
 * than on a microtask) so the connect→resubscribe handshake completes within
 * the same synchronous turn the kit requires.
 */

import { afterEach, beforeEach, vi } from 'vitest'
import { centrifugoTransport } from '@realtimejs/adapter-centrifugo'
import { runAdapterConformance } from '@realtimejs/adapter-conformance'
import type {
  PresenceUser,
  RealtimeTransport,
  TransportCapabilities,
} from '@realtimejs/core'

// The exact flags declared on centrifugoTransport (see transport.ts). The kit's
// capability-honesty cases assert getCapabilities() deep-equals this object.
const CENTRIFUGO_CAPS: TransportCapabilities = {
  presence: true,
  serverAssistedRecovery: true,
  history: false,
  ephemeral: true,
}

const PRESENCE_PREFIX = '$prs:'

// ---------------------------------------------------------------------------
// Synchronous fake WebSocket that speaks the Centrifugo v4+ JSON protocol.
//
// One FakeCentrifugoServer instance is shared by every fake socket it spawns so
// that the provider-side subscription set survives a socket close/reopen the
// same way a real broker's subscription state is re-established by the client's
// re-subscribe commands (not by the socket itself).
// ---------------------------------------------------------------------------

type Listener = (event: { data?: unknown }) => void

class FakeCentrifugoSocket {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3

  readonly CONNECTING = 0
  readonly OPEN = 1
  readonly CLOSING = 2
  readonly CLOSED = 3

  readyState = FakeCentrifugoSocket.CONNECTING

  private listeners: Record<string, Set<Listener> | undefined> = {
    open: new Set(),
    close: new Set(),
    error: new Set(),
    message: new Set(),
  }

  constructor(private readonly server: FakeCentrifugoServer) {
    server.attach(this)
    // Auto-open on a microtask for the INITIAL connect() (which the kit awaits,
    // so the microtask flushes). For reconnects the server fires open()
    // synchronously via flushOpen() before this microtask runs; the readyState
    // guard then makes this a no-op.
    queueMicrotask(() => this.fireOpen())
  }

  fireOpen(): void {
    if (this.readyState !== FakeCentrifugoSocket.CONNECTING) return
    this.readyState = FakeCentrifugoSocket.OPEN
    this.emit('open', {})
  }

  addEventListener(type: string, cb: Listener): void {
    this.listeners[type]?.add(cb)
  }

  send(raw: string): void {
    if (this.readyState !== FakeCentrifugoSocket.OPEN) return
    this.server.handleClientCommand(this, raw)
  }

  close(): void {
    if (
      this.readyState === FakeCentrifugoSocket.CLOSED ||
      this.readyState === FakeCentrifugoSocket.CLOSING
    ) {
      return
    }
    this.readyState = FakeCentrifugoSocket.CLOSED
    this.server.detach(this)
    this.emit('close', {})
  }

  /** Deliver a server→client frame to the adapter's message listeners. */
  deliver(payload: unknown): void {
    if (this.readyState !== FakeCentrifugoSocket.OPEN) return
    this.emit('message', { data: JSON.stringify(payload) })
  }

  private emit(type: string, event: { data?: unknown }): void {
    for (const cb of this.listeners[type] ?? []) cb(event)
  }
}

class FakeCentrifugoServer {
  /** The socket the adapter currently holds (it holds at most one). */
  private active: FakeCentrifugoSocket | null = null
  /** Provider-side subscription set — the heart of the reconnect check. */
  private readonly subscribed = new Set<string>()
  /** Latest subscribe command id per channel, for targeting subscribe errors. */
  private readonly lastSubscribeId = new Map<string, number>()
  /**
   * Subscribe commands awaiting their (single) reply, keyed by channel. A real
   * broker answers each subscribe with EXACTLY ONE reply — either a success or
   * an error, never both. We therefore defer the auto-success to a microtask so
   * a synchronous `simulateSubscribeError(channel, …)` issued right after
   * `subscribe(channel)` can claim that pending command and turn its single
   * reply into an error instead (matching the wire protocol the adapter relies
   * on: one subscribe id → one reply).
   */
  private readonly pendingSubscribes = new Map<string, number>()
  private clientCounter = 0

  attach(socket: FakeCentrifugoSocket): void {
    this.active = socket
  }

  detach(socket: FakeCentrifugoSocket): void {
    if (this.active === socket) this.active = null
  }

  /** Synchronously open the currently-connecting socket (used on reconnect). */
  flushOpen(): void {
    this.active?.fireOpen()
  }

  /** Parse and respond to a client command, mirroring centrifugo.test.ts. */
  handleClientCommand(socket: FakeCentrifugoSocket, raw: string): void {
    let msgs: Array<Record<string, unknown>>
    try {
      const parsed: unknown = JSON.parse(raw)
      msgs = Array.isArray(parsed)
        ? (parsed as Array<Record<string, unknown>>)
        : [parsed as Record<string, unknown>]
    } catch {
      return
    }

    for (const msg of msgs) {
      const id = msg['id'] as number | undefined

      if (msg['connect'] !== undefined) {
        socket.deliver({
          id,
          connect: {
            client: `client-${++this.clientCounter}`,
            version: '4.0.0',
          },
        })
      } else if (msg['subscribe'] !== undefined) {
        const ch = (msg['subscribe'] as { channel: string }).channel
        // Register the provider-side subscription synchronously so publications
        // emitted in the same tick are delivered (the kit asserts delivery
        // synchronously). The subscribe *reply frame*, however, is deferred to a
        // microtask so a synchronous simulateSubscribeError() issued right after
        // subscribe() can claim this command and make its SINGLE reply an error
        // instead — matching the real wire protocol (one subscribe id → exactly
        // one reply, success XOR error) the adapter relies on.
        this.subscribed.add(ch)
        if (typeof id === 'number') {
          this.lastSubscribeId.set(ch, id)
          this.pendingSubscribes.set(ch, id)
          const replyId = id
          queueMicrotask(() => {
            if (this.pendingSubscribes.get(ch) !== replyId) return
            this.pendingSubscribes.delete(ch)
            socket.deliver({ id: replyId, subscribe: { recoverable: false } })
          })
        } else {
          socket.deliver({ id, subscribe: { recoverable: false } })
        }
      } else if (msg['unsubscribe'] !== undefined) {
        const ch = (msg['unsubscribe'] as { channel: string }).channel
        this.subscribed.delete(ch)
        socket.deliver({ id, unsubscribe: {} })
      } else if (msg['publish'] !== undefined) {
        const { channel: ch, data } = msg['publish'] as {
          channel: string
          data: unknown
        }
        socket.deliver({ id, publish: {} })
        // Echo client publishes back to subscribers (real broker behaviour);
        // this also drives the sidecar presence channel.
        this.deliverPublication(ch, data)
      }
    }
  }

  /** Deliver a publication push ONLY to a currently-subscribed channel. */
  deliverPublication(channel: string, data: unknown): void {
    if (!this.subscribed.has(channel)) return
    this.active?.deliver({ push: { channel, pub: { data } } })
  }

  /**
   * Deliver a presence sidecar publication. The conformance kit registers an
   * onPresenceChange listener without calling joinPresence, so it does not
   * subscribe to the sidecar channel; we therefore deliver the presence frame
   * directly (an unconditional provider delivery, mirroring the mock harness's
   * emitPresence), bypassing the subscribed-set gate that governs data
   * channels.
   */
  deliverPresence(channel: string, data: unknown): void {
    this.active?.deliver({
      push: { channel: `${PRESENCE_PREFIX}${channel}`, pub: { data } },
    })
  }

  /** Push a subscribe error reply for the most recent subscribe on `channel`. */
  emitSubscribeError(channel: string, reason: string, code?: number): void {
    const id = this.lastSubscribeId.get(channel)
    if (id === undefined) return
    // Claim the pending subscribe so its deferred auto-success is suppressed:
    // this error becomes the command's single reply, as on the real wire.
    this.pendingSubscribes.delete(channel)
    this.active?.deliver({ id, error: { code: code ?? 0, message: reason } })
  }

  /**
   * Drop the connection (unexpected disconnect). Clears the provider-side
   * subscription set so messages emitted while disconnected are not delivered
   * until the client re-subscribes, then fires the socket close event so the
   * adapter transitions to `reconnecting` and schedules a reconnect.
   */
  simulateDisconnect(): void {
    this.subscribed.clear()
    this.lastSubscribeId.clear()
    this.pendingSubscribes.clear()
    this.active?.close()
  }
}

// ---------------------------------------------------------------------------
// Harness wiring
// ---------------------------------------------------------------------------

// The kit calls createTransport() fresh per test; capture the live server so
// the emit/simulate hooks target the current instance.
let server: FakeCentrifugoServer

beforeEach(() => {
  vi.useFakeTimers()
  server = new FakeCentrifugoServer()
})

afterEach(() => {
  vi.useRealTimers()
})

function makeFakeWebSocketClass(
  srv: FakeCentrifugoServer,
): typeof globalThis.WebSocket {
  class WS extends FakeCentrifugoSocket {
    constructor(_url: string) {
      super(srv)
    }
  }
  return WS as unknown as typeof globalThis.WebSocket
}

function createTransport(): RealtimeTransport {
  return centrifugoTransport({
    url: 'ws://fake-centrifugo/connection/websocket',
    initialDelay: 1,
    maxDelay: 5,
    jitter: 0,
    WebSocket: makeFakeWebSocketClass(server),
  })
}

runAdapterConformance({
  name: 'centrifugoTransport',
  capabilities: CENTRIFUGO_CAPS,
  createTransport,
  emitMessage: (channel, data) => server.deliverPublication(channel, data),
  simulateDisconnect: () => server.simulateDisconnect(),
  // Drive the adapter's timer-based reconnect synchronously: advance past the
  // back-off delay so openSocket() runs and creates a fresh socket, then fire
  // that socket's open event so the connect→resubscribe handshake completes in
  // this same synchronous turn (re-establishing the provider subscription set).
  simulateReconnect: () => {
    vi.advanceTimersByTime(50)
    server.flushOpen()
  },
  simulateSubscribeError: (channel, reason, code) =>
    server.emitSubscribeError(channel, reason, code),
  emitPresence: (channel, members: ReadonlyArray<PresenceUser>) => {
    for (const m of members) {
      server.deliverPresence(channel, {
        type: 'prs:join',
        clientId: m.connectionId,
        data: m.data,
      })
    }
  },
})
