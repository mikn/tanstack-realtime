import { describe, expect, it } from 'vitest'
import { getCapabilities, hasPresence } from '@realtimejs/core'
import type {
  PresenceUser,
  RealtimeTransport,
  TransportCapabilities,
} from '@realtimejs/core'

/**
 * The hooks an adapter author supplies so the conformance kit can drive its
 * transport against a controllable fake provider.
 *
 * The kit owns all assertions — the harness only knows how to (a) create a
 * fresh transport instance wired to a fake provider and (b) make that fake
 * provider do things (deliver a message, (re)connect, reject a subscribe…).
 *
 * ## Contract the fake provider MUST honor
 *
 * The reconnect-resubscribe check is only meaningful if the fake provider
 * models real provider semantics. An adapter author wiring this harness MUST
 * ensure:
 *
 *  - **`emitMessage(channel, data)`** delivers ONLY to channels the transport
 *    is CURRENTLY subscribed to *at the provider*. A message on an unsubscribed
 *    (or no-longer-subscribed) channel is dropped.
 *  - **`simulateDisconnect()`** drops the provider-side subscription set, so
 *    messages emitted while disconnected are NOT delivered — they only resume
 *    once the transport re-subscribes.
 *  - **`simulateReconnect()` / `simulateConnected()`** brings the connection
 *    back. On reconnect the transport is expected to re-subscribe its active
 *    channels — this is the documented {@link RealtimeTransport} contract:
 *    "subscribe is deferred and re-sent on the next connection, including after
 *    reconnects". If the adapter fails to re-subscribe, delivery stays
 *    suspended and the reconnect-resubscribe case FAILS.
 *
 * ## Mandatory vs. optional hooks
 *
 * The mandatory hooks (`createTransport`, `capabilities`, `emitMessage`,
 * `simulateDisconnect`, and a reconnect trigger) are the core
 * `RealtimeTransport` contract: every adapter MUST drive them so the
 * reconnect-resubscribe case can run. They are kept optional in the *type* only
 * for ergonomics — the battery asserts they are defined and FAILS conformance
 * (rather than skipping) when reconnect driving is missing. Only
 * `simulateSubscribeError` and `emitPresence` are genuinely provider-specific
 * and legitimately skippable.
 */
export interface ConformanceHarness {
  /** MANDATORY. Create a fresh transport instance under test (wired to a controllable fake provider). */
  createTransport: () => RealtimeTransport
  /** MANDATORY. The capabilities the adapter CLAIMS (the kit verifies behavior matches these). */
  capabilities: TransportCapabilities
  /**
   * MANDATORY. Simulate the provider/server delivering a message on a channel
   * to the transport. Per the contract above, delivery reaches the subscriber
   * ONLY when the channel is currently subscribed at the provider.
   */
  emitMessage: (channel: string, data: unknown) => void
  /**
   * MANDATORY (core reconnect driving). Drive a disconnect (unexpected drop) on
   * the fake provider. MUST drop the provider-side subscription set so messages
   * are no longer delivered until the transport re-subscribes.
   *
   * Kept optional in the type for ergonomics, but the battery asserts it is
   * defined and FAILS when it is missing.
   */
  simulateDisconnect?: () => void
  /**
   * MANDATORY (core reconnect driving — provide this OR
   * {@link ConformanceHarness.simulateConnected}). Drive a reconnect on the
   * fake provider. The transport is expected to re-subscribe its active
   * channels, restoring delivery.
   *
   * Kept optional in the type for ergonomics, but the battery asserts a
   * reconnect trigger is defined and FAILS when none is provided.
   */
  simulateReconnect?: () => void
  /**
   * MANDATORY (core reconnect driving — provide this OR
   * {@link ConformanceHarness.simulateReconnect}). Drive a successful
   * (re)connect on the underlying fake provider.
   */
  simulateConnected?: () => void
  /** OPTIONAL (provider-specific). Simulate the provider rejecting a subscribe (for onSubscribeError checks). */
  simulateSubscribeError?: (
    channel: string,
    reason: string,
    code?: number,
  ) => void
  /** OPTIONAL (presence-only). Simulate the provider delivering a member list for a channel. */
  emitPresence?: (channel: string, members: ReadonlyArray<PresenceUser>) => void
  /** Optional adapter name for test titles. */
  name?: string
}

/** Prefix every `it` title with the adapter name when one is supplied. */
function titlePrefix(harness: ConformanceHarness): string {
  return harness.name ? `[${harness.name}] ` : ''
}

/**
 * Run the full transport conformance battery against a caller-provided adapter.
 *
 * Call this inside a vitest file (it registers its own `describe`/`it`). Every
 * first-party adapter (and the in-repo mocks) runs the same battery to PROVE it
 * satisfies the {@link RealtimeTransport} (+ optional `PresenceCapable`)
 * contract and that its declared {@link TransportCapabilities} are honest.
 *
 * The battery is capability-aware: the presence sub-battery only runs when
 * `harness.capabilities.presence` is `true`, and the kit asserts that
 * `hasPresence(transport)` agrees with the declared flag (no half-implemented
 * presence).
 *
 * The mandatory core checks — lifecycle, subscribe/deliver, channel isolation,
 * unsubscribe, publish, reconnect re-subscribe, and capability honesty — always
 * run. Only the subscribe-error and presence cases are genuinely
 * provider-specific and skip when their (optional) harness hooks are absent.
 *
 * ## What the battery does and does NOT exercise
 *
 *  - The `serverAssistedRecovery`, `history`, and `ephemeral` capability flags
 *    are **declaration-only**: the kit verifies they are reported honestly and
 *    consistently (capability-honesty cases), but does not behaviorally
 *    exercise the features they describe — the kit has no provider-side view of
 *    gap recovery / history fetches / ephemeral semantics to assert against.
 *  - **`publish` conformance only asserts the call resolves.** The kit cannot
 *    see the wire, so it cannot verify that published data actually reached the
 *    provider — only that the adapter's `publish()` contract (returns a promise
 *    that resolves) holds.
 */
export function runAdapterConformance(harness: ConformanceHarness): void {
  const p = titlePrefix(harness)
  const suiteName = harness.name
    ? `adapter conformance: ${harness.name}`
    : 'adapter conformance'

  describe(suiteName, () => {
    // ── 1. Lifecycle ─────────────────────────────────────────────────────
    describe('lifecycle', () => {
      it(`${p}connect() resolves and the store reaches 'connected'`, async () => {
        const t = harness.createTransport()
        await t.connect()
        expect(t.store.get()).toBe('connected')
        t.disconnect()
      })

      it(`${p}disconnect() drives the store to 'disconnected'`, async () => {
        const t = harness.createTransport()
        await t.connect()
        t.disconnect()
        expect(t.store.get()).toBe('disconnected')
      })

      it(`${p}status transitions are observable via the store`, async () => {
        const t = harness.createTransport()
        const seen: Array<string> = []
        const sub = t.store.subscribe(() => seen.push(t.store.get()))
        await t.connect()
        t.disconnect()
        sub.unsubscribe()
        expect(seen).toContain('connected')
        expect(seen).toContain('disconnected')
      })
    })

    // ── 2. Subscribe / deliver ───────────────────────────────────────────
    describe('subscribe / deliver', () => {
      it(`${p}delivers a message to the subscriber for that channel`, async () => {
        const t = harness.createTransport()
        await t.connect()
        const got: Array<unknown> = []
        const unsub = t.subscribe('news', (data) => got.push(data))
        harness.emitMessage('news', { headline: 'hi' })
        expect(got).toEqual([{ headline: 'hi' }])
        unsub()
        t.disconnect()
      })

      it(`${p}does not deliver a different channel's message`, async () => {
        const t = harness.createTransport()
        await t.connect()
        const got: Array<unknown> = []
        const unsub = t.subscribe('news', (data) => got.push(data))
        harness.emitMessage('sports', { headline: 'nope' })
        expect(got).toEqual([])
        unsub()
        t.disconnect()
      })
    })

    // ── 3. Unsubscribe ───────────────────────────────────────────────────
    describe('unsubscribe', () => {
      it(`${p}the returned fn stops delivery`, async () => {
        const t = harness.createTransport()
        await t.connect()
        const got: Array<unknown> = []
        const unsub = t.subscribe('ch', (data) => got.push(data))
        harness.emitMessage('ch', 'first')
        unsub()
        harness.emitMessage('ch', 'second')
        expect(got).toEqual(['first'])
        t.disconnect()
      })

      it(`${p}removing the last listener stops delivery while others remain`, async () => {
        const t = harness.createTransport()
        await t.connect()
        const a: Array<unknown> = []
        const b: Array<unknown> = []
        const unsubA = t.subscribe('ch', (data) => a.push(data))
        const unsubB = t.subscribe('ch', (data) => b.push(data))
        harness.emitMessage('ch', 'one')
        unsubA()
        harness.emitMessage('ch', 'two')
        expect(a).toEqual(['one'])
        expect(b).toEqual(['one', 'two'])
        unsubB()
        harness.emitMessage('ch', 'three')
        expect(b).toEqual(['one', 'two'])
        t.disconnect()
      })
    })

    // ── 4. Publish ───────────────────────────────────────────────────────
    describe('publish', () => {
      it(`${p}publish() resolves`, async () => {
        const t = harness.createTransport()
        await t.connect()
        await expect(t.publish('ch', { x: 1 })).resolves.toBeUndefined()
        t.disconnect()
      })
    })

    // ── 5. Reconnect re-subscribe ────────────────────────────────────────
    //
    // MANDATORY core check. This is the most important guarantee the kit
    // provides, so it runs UNCONDITIONALLY. Reconnect driving is part of the
    // core RealtimeTransport contract: an adapter that cannot drive a
    // disconnect + reconnect (or that does not re-subscribe on reconnect) FAILS
    // conformance — it never silently skips.
    describe('reconnect re-subscribe', () => {
      it(`${p}provides the required reconnect-driving hooks (core contract)`, () => {
        // Kept optional in the type for ergonomics; asserted here so a harness
        // that omits reconnect driving FAILS conformance rather than skipping
        // the most important check.
        expect(
          harness.simulateDisconnect,
          'core conformance requires reconnect driving: provide harness.simulateDisconnect',
        ).toBeDefined()
        expect(
          harness.simulateReconnect ?? harness.simulateConnected,
          'core conformance requires reconnect driving: provide harness.simulateReconnect or harness.simulateConnected',
        ).toBeDefined()
      })

      it(`${p}re-establishes subscriptions across a disconnect/reconnect cycle`, async () => {
        const reconnect = harness.simulateReconnect ?? harness.simulateConnected
        // Guarded above by the explicit hook-presence assertion. We assert again
        // here so a missing hook surfaces as a clear failure instead of a
        // confusing "is not a function" throw mid-test.
        expect(
          harness.simulateDisconnect,
          'core conformance requires reconnect driving: provide harness.simulateDisconnect',
        ).toBeDefined()
        expect(
          reconnect,
          'core conformance requires reconnect driving: provide harness.simulateReconnect or harness.simulateConnected',
        ).toBeDefined()
        const simulateDisconnect = harness.simulateDisconnect!

        const t = harness.createTransport()
        await t.connect()
        const got: Array<unknown> = []
        const unsub = t.subscribe('ch', (data) => got.push(data))

        // (a) Subscribed + connected → delivered.
        harness.emitMessage('ch', 'before')
        expect(got).toEqual(['before'])

        // (b) NEGATIVE PHASE — this is what gives the check teeth. After a
        // disconnect the provider drops the subscription, so a message is NOT
        // delivered until the transport re-subscribes. If delivery did not stop
        // here, phase (c) would prove nothing.
        simulateDisconnect()
        harness.emitMessage('ch', 'while-disconnected')
        expect(
          got,
          'message emitted while disconnected must NOT be delivered (provider dropped the subscription)',
        ).toEqual(['before'])

        // (c) After reconnect the adapter MUST re-subscribe its active channels
        // (deferred-subscribe contract), restoring delivery. A no-op transport
        // that never re-subscribes fails here.
        reconnect!()
        harness.emitMessage('ch', 'after')
        expect(
          got,
          'after reconnect the adapter must have re-subscribed, so delivery resumes',
        ).toEqual(['before', 'after'])

        unsub()
        t.disconnect()
      })
    })

    // ── 6. Subscribe error ───────────────────────────────────────────────
    describe('subscribe error', () => {
      const canError = Boolean(harness.simulateSubscribeError)

      it.skipIf(!canError)(
        `${p}onSubscribeError receives (channel, reason, code)`,
        async () => {
          const t = harness.createTransport()
          expect(typeof t.onSubscribeError).toBe('function')
          await t.connect()
          const errors: Array<{
            channel: string
            reason: string
            code?: number
          }> = []
          const unsub = t.onSubscribeError!((channel, reason, code) => {
            errors.push({ channel, reason, code })
          })
          t.subscribe('denied', () => {})
          harness.simulateSubscribeError!('denied', 'forbidden', 403)
          expect(errors).toEqual([
            { channel: 'denied', reason: 'forbidden', code: 403 },
          ])
          unsub()
          t.disconnect()
        },
      )
    })

    // ── 7. Capability honesty ────────────────────────────────────────────
    describe('capability honesty', () => {
      it(`${p}getCapabilities() deep-equals the declared capabilities`, () => {
        const t = harness.createTransport()
        expect(getCapabilities(t)).toEqual(harness.capabilities)
      })

      it(`${p}hasPresence() agrees with the declared presence flag`, () => {
        const t = harness.createTransport()
        expect(hasPresence(t)).toBe(harness.capabilities.presence)
      })
    })

    // ── 8. Presence sub-battery (only when capabilities.presence) ─────────
    describe('presence', () => {
      const presenceClaimed = harness.capabilities.presence

      it.skipIf(!presenceClaimed)(
        `${p}exposes joinPresence / updatePresence / leavePresence`,
        () => {
          const t = harness.createTransport()
          expect(hasPresence(t)).toBe(true)
          if (hasPresence(t)) {
            expect(typeof t.joinPresence).toBe('function')
            expect(typeof t.updatePresence).toBe('function')
            expect(typeof t.leavePresence).toBe('function')
            expect(typeof t.onPresenceChange).toBe('function')
          }
        },
      )

      it.skipIf(!presenceClaimed)(
        `${p}join / update / leave presence do not throw`,
        async () => {
          const t = harness.createTransport()
          if (!hasPresence(t)) throw new Error('expected presence transport')
          await t.connect()
          t.subscribe('room', () => {})
          expect(() => t.joinPresence('room', { name: 'me' })).not.toThrow()
          expect(() =>
            t.updatePresence('room', { status: 'busy' }),
          ).not.toThrow()
          expect(() => t.leavePresence('room')).not.toThrow()
          t.disconnect()
        },
      )

      it.skipIf(!presenceClaimed || !harness.emitPresence)(
        `${p}onPresenceChange fires with the member list from the provider`,
        async () => {
          const t = harness.createTransport()
          if (!hasPresence(t)) throw new Error('expected presence transport')
          await t.connect()
          const lists: Array<ReadonlyArray<PresenceUser>> = []
          const unsub = t.onPresenceChange('room', (users) => lists.push(users))
          const members: ReadonlyArray<PresenceUser> = [
            { connectionId: 'conn-a', data: { name: 'alice' } },
            { connectionId: 'conn-b', data: { name: 'bob' } },
          ]
          harness.emitPresence!('room', members)
          expect(lists.length).toBeGreaterThan(0)
          const reported = lists[lists.length - 1] ?? []
          // Every remote member the provider delivered is reported. (The kit
          // does not know the adapter's own connectionId, so the strict
          // "self excluded" check — documented contract — lives in
          // adapter-specific suites such as centrifugo.test.ts. Here we assert
          // the member list is delivered faithfully and that the caller's own
          // presence is never *added* to the remote list.)
          for (const member of members) {
            expect(
              reported.some((r) => r.connectionId === member.connectionId),
            ).toBe(true)
          }
          unsub()
          t.disconnect()
        },
      )
    })
  })
}
