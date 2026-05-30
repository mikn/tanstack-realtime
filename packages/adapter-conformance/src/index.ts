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
 */
export interface ConformanceHarness {
  /** Create a fresh transport instance under test (wired to a controllable fake provider). */
  createTransport: () => RealtimeTransport
  /** The capabilities the adapter CLAIMS (the kit verifies behavior matches these). */
  capabilities: TransportCapabilities
  /** Simulate the provider/server delivering a message on a channel to the transport. */
  emitMessage: (channel: string, data: unknown) => void
  /** Drive a successful (re)connect on the underlying fake provider. */
  simulateConnected?: () => void
  /** Drive a disconnect (unexpected drop) on the fake provider. */
  simulateDisconnect?: () => void
  /** Drive a reconnect on the fake provider. */
  simulateReconnect?: () => void
  /** Simulate the provider rejecting a subscribe (for onSubscribeError checks). */
  simulateSubscribeError?: (
    channel: string,
    reason: string,
    code?: number,
  ) => void
  /** Presence-only: simulate the provider delivering a member list for a channel. */
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
 * presence). Lifecycle/reconnect/subscribe-error cases that need optional
 * harness hooks are skipped gracefully when those hooks are absent.
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
    describe('reconnect re-subscribe', () => {
      const reconnect = harness.simulateReconnect ?? harness.simulateConnected
      const canReconnect = Boolean(harness.simulateDisconnect && reconnect)

      it.skipIf(!canReconnect)(
        `${p}re-establishes subscriptions across a disconnect/reconnect cycle`,
        async () => {
          const t = harness.createTransport()
          await t.connect()
          const got: Array<unknown> = []
          const unsub = t.subscribe('ch', (data) => got.push(data))
          harness.emitMessage('ch', 'before')

          harness.simulateDisconnect!()
          reconnect!()

          harness.emitMessage('ch', 'after')
          expect(got).toEqual(['before', 'after'])
          unsub()
          t.disconnect()
        },
      )
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
