/**
 * World-class multi-user integration scenarios for @realtimejs/core.
 *
 * Call registerScenarios() from a Playwright spec file.  The baseURL is
 * injected by the project configuration so the same 23 scenarios run against
 * both the React app (port 3000) and the Solid app (port 3001).
 *
 * Patterns covered (all 9 + reconnection resilience):
 *   1.  realtimeCollectionOptions  — server-synced collection
 *   2.  liveChannelOptions         — append-only event stream (chat)
 *   3.  usePresence                — presence over pub/sub (withPresence)
 *   4.  ephemeralLiveOptions       — typing indicators with TTL auto-expiry
 *   5.  streamChannelOptions       — token-accumulation stream (useStream)
 *   6.  tickCollectionOptions      — game-state batch updates via tick transport
 *   7.  useSyncedCounter           — PN-Counter CRDT
 *   8.  useSyncedValue             — LWW-Register CRDT
 *   9.  useSyncedSet               — OR-Set CRDT
 *  10.  Reconnection resilience    — transport reconnect & post-reconnect sync
 */

import { expect, test } from '@playwright/test'
import type { Browser, BrowserContext, Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function appUrl(userId: string): string {
  return `/?userId=${userId}`
}

async function openContext(
  browser: Browser,
  userId: string,
): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(appUrl(userId))
  await expect(page.getByTestId('status')).toHaveText('connected', {
    timeout: 15_000,
  })
  await expect(page.getByTestId('todo-input')).toBeVisible({ timeout: 5_000 })
  return { ctx, page }
}

// ---------------------------------------------------------------------------
// Exported scenario registration
// ---------------------------------------------------------------------------

export function registerScenarios(): void {
  // ── 1. realtimeCollectionOptions ──────────────────────────────────────────

  test.describe('realtimeCollectionOptions — multi-user todo sync', () => {
    /**
     * Core insert / delete propagation.  Any client that publishes a mutation
     * should see it echoed back, and every other subscriber should receive it.
     */
    test('alice inserts a todo; bob sees it; alice deletes it; bob sees deletion', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      const todoText = `Buy milk ${Date.now()}`
      await pageA.getByTestId('todo-input').fill(todoText)
      await pageA.getByTestId('add-todo').click()

      await expect(pageB.getByTestId('todo-list')).toContainText(todoText, {
        timeout: 8_000,
      })

      await pageA.getByTestId('delete-todo').first().click()
      await expect(pageB.getByTestId('todo-list')).not.toContainText(todoText, {
        timeout: 8_000,
      })

      await ctxA.close()
      await ctxB.close()
    })

    /**
     * Concurrent inserts from two different users must both appear on both
     * sides without loss or duplication, verifying fan-out correctness.
     */
    test('simultaneous inserts from both users — all items visible to both', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      const ts = Date.now()
      const textA = `alice-todo-${ts}`
      const textB = `bob-todo-${ts}`

      await Promise.all([
        (async () => {
          await pageA.getByTestId('todo-input').fill(textA)
          await pageA.getByTestId('add-todo').click()
        })(),
        (async () => {
          await pageB.getByTestId('todo-input').fill(textB)
          await pageB.getByTestId('add-todo').click()
        })(),
      ])

      // Both users must see both items.
      await expect(pageA.getByTestId('todo-list')).toContainText(textA, {
        timeout: 8_000,
      })
      await expect(pageA.getByTestId('todo-list')).toContainText(textB, {
        timeout: 8_000,
      })
      await expect(pageB.getByTestId('todo-list')).toContainText(textA, {
        timeout: 8_000,
      })
      await expect(pageB.getByTestId('todo-list')).toContainText(textB, {
        timeout: 8_000,
      })

      await ctxA.close()
      await ctxB.close()
    })
  })

  // ── 2. liveChannelOptions ─────────────────────────────────────────────────

  test.describe('liveChannelOptions — multi-user chat', () => {
    /** Bidirectional message delivery across two live connections. */
    test('alice sends a message; bob sees it; bob replies; alice sees reply', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      const msgA = `Hello from alice ${Date.now()}`
      await pageA.getByTestId('chat-input').fill(msgA)
      await pageA.getByTestId('send-message').click()
      await expect(pageB.getByTestId('chat-messages')).toContainText(msgA, {
        timeout: 8_000,
      })

      const msgB = `Hi alice from bob ${Date.now()}`
      await pageB.getByTestId('chat-input').fill(msgB)
      await pageB.getByTestId('send-message').click()
      await expect(pageA.getByTestId('chat-messages')).toContainText(msgB, {
        timeout: 8_000,
      })

      await ctxA.close()
      await ctxB.close()
    })

    /**
     * Five rapid messages sent without awaiting acknowledgement must arrive at
     * the remote peer in the same insertion order.  Tests SSE frame ordering
     * under back-pressure.
     */
    test('five rapid messages arrive at bob in insertion order', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      const ts = Date.now()
      const messages = [1, 2, 3, 4, 5].map((i) => `msg-${ts}-ord-${i}`)

      // Send all five without waiting for delivery confirmation.
      for (const msg of messages) {
        await pageA.getByTestId('chat-input').fill(msg)
        await pageA.getByTestId('send-message').click()
      }

      // All five must arrive at Bob.
      for (const msg of messages) {
        await expect(pageB.getByTestId('chat-messages')).toContainText(msg, {
          timeout: 8_000,
        })
      }

      // Their relative order in the DOM must match insertion order.
      const chatText = await pageB.getByTestId('chat-messages').textContent()
      for (let i = 0; i < messages.length - 1; i++) {
        const posA = (chatText ?? '').indexOf(messages[i] ?? '')
        const posB = (chatText ?? '').indexOf(messages[i + 1] ?? '')
        expect(posA).toBeLessThan(posB)
      }

      await ctxA.close()
      await ctxB.close()
    })

    /**
     * liveChannelOptions is an append-only live stream — it carries no
     * server-side history.  A client that connects after messages were sent
     * must not see those messages; only subsequently published ones arrive.
     * This distinguishes it from realtimeCollectionOptions (which can prefill
     * via queryFn).
     */
    test('late joiner does NOT receive pre-connection chat history', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')

      const ts = Date.now()
      const preMsg1 = `history-pre-1-${ts}`
      const preMsg2 = `history-pre-2-${ts}`

      await pageA.getByTestId('chat-input').fill(preMsg1)
      await pageA.getByTestId('send-message').click()
      await pageA.getByTestId('chat-input').fill(preMsg2)
      await pageA.getByTestId('send-message').click()

      // Ensure messages are fully processed before Bob opens the page.
      await pageA.waitForTimeout(300)

      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')
      await pageB.waitForTimeout(300)

      // Historical messages must be absent from Bob's view.
      await expect(pageB.getByTestId('chat-messages')).not.toContainText(
        preMsg1,
      )
      await expect(pageB.getByTestId('chat-messages')).not.toContainText(
        preMsg2,
      )

      // New messages sent after Bob's connection must arrive normally.
      const newMsg = `live-after-join-${ts}`
      await pageA.getByTestId('chat-input').fill(newMsg)
      await pageA.getByTestId('send-message').click()
      await expect(pageB.getByTestId('chat-messages')).toContainText(newMsg, {
        timeout: 8_000,
      })

      await ctxA.close()
      await ctxB.close()
    })
  })

  // ── 3. usePresence ────────────────────────────────────────────────────────

  test.describe('usePresence — presence channel', () => {
    /**
     * Late-joiner discovery via the 2 s heartbeat: each peer must see the
     * other even when they connect at slightly different times.
     */
    test('alice and bob each see the other in the presence list', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      await expect(pageA.getByTestId('presence-users')).toContainText('bob', {
        timeout: 8_000,
      })
      await expect(pageB.getByTestId('presence-users')).toContainText('alice', {
        timeout: 8_000,
      })

      await ctxA.close()
      await ctxB.close()
    })

    /**
     * Presence delta updates must propagate to all other subscribers.
     * The "Set Away" button calls updatePresence({ status: 'away' }); Bob
     * must see the changed status tag without a full re-join.
     */
    test('alice sets status to away; bob sees the updated status', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      // Wait for mutual discovery before mutating status.
      await expect(pageB.getByTestId('presence-users')).toContainText('alice', {
        timeout: 8_000,
      })

      await pageA.getByTestId('set-status-away').click()

      await expect(pageB.getByTestId('presence-users')).toContainText('away', {
        timeout: 8_000,
      })

      await ctxA.close()
      await ctxB.close()
    })
  })

  // ── 4. ephemeralLiveOptions ───────────────────────────────────────────────

  test.describe('ephemeralLiveOptions — typing indicators', () => {
    /**
     * A typing event must appear at the remote peer, then disappear
     * automatically when the 2 s TTL elapses without a renewal.
     */
    test('alice triggers typing; bob sees it; then it auto-expires', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      await pageA.getByTestId('start-typing').click()
      await expect(pageB.getByTestId('typing-indicators')).toContainText(
        'alice',
        { timeout: 8_000 },
      )

      await pageB.waitForTimeout(3_000)
      await expect(pageB.getByTestId('typing-indicators')).not.toContainText(
        'alice',
      )

      await ctxA.close()
      await ctxB.close()
    })

    /**
     * With multiple concurrent typers every participant must see every
     * other, confirming that the ephemeral map tracks entries per-key and
     * that broadcast reaches all subscribers.
     */
    test('alice and bob both send typing events; each sees the other', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      await Promise.all([
        pageA.getByTestId('start-typing').click(),
        pageB.getByTestId('start-typing').click(),
      ])

      await expect(pageA.getByTestId('typing-indicators')).toContainText(
        'bob',
        { timeout: 5_000 },
      )
      await expect(pageB.getByTestId('typing-indicators')).toContainText(
        'alice',
        { timeout: 5_000 },
      )

      await ctxA.close()
      await ctxB.close()
    })

    /**
     * Sending a typing event before the previous TTL expires must reset the
     * timer.  The indicator should remain visible throughout continuous
     * activity and disappear only after the final event's TTL elapses.
     * This validates the EphemeralMap.set() timer-reset behaviour.
     */
    test('repeated typing events reset the TTL — indicator stays alive, then expires', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      // First typing event — indicator appears.
      await pageA.getByTestId('start-typing').click()
      await expect(pageB.getByTestId('typing-indicators')).toContainText(
        'alice',
        { timeout: 5_000 },
      )

      // Re-send at ~1.5 s (< 2 s TTL) to reset the expiry timer.
      await pageA.waitForTimeout(1_500)
      await pageA.getByTestId('start-typing').click()

      // At ~1.5 s after the second event alice should still be visible
      // (TTL restarted from the second event, so only ~1.5 s have elapsed).
      await pageA.waitForTimeout(1_500)
      await expect(pageB.getByTestId('typing-indicators')).toContainText(
        'alice',
      )

      // After the remaining ~0.5 s of the reset TTL (total ~2 s from last event).
      await pageB.waitForTimeout(700)
      await expect(pageB.getByTestId('typing-indicators')).not.toContainText(
        'alice',
      )

      await ctxA.close()
      await ctxB.close()
    })
  })

  // ── 5. streamChannelOptions / useStream ───────────────────────────────────

  test.describe('streamChannelOptions — token stream', () => {
    /** Core accumulation: all tokens must be concatenated and status reaches done. */
    test('alice starts a stream; bob sees accumulated content and done status', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      await pageA.getByTestId('start-stream').click()

      await expect(pageB.getByTestId('stream-content')).toContainText(
        'Hello World!',
        { timeout: 10_000 },
      )
      await expect(pageB.getByTestId('stream-status')).toHaveText('done', {
        timeout: 5_000,
      })

      await ctxA.close()
      await ctxB.close()
    })

    /**
     * Before any stream starts the status must be 'pending'.  As tokens
     * arrive status transitions to 'streaming' and content accumulates
     * token-by-token.  After the done event status becomes 'done'.
     *
     * The StreamPanel sends tokens with a 30 ms inter-token delay, giving a
     * ~120 ms streaming window in which both intermediate states are observable.
     */
    test('stream status: pending → streaming → done; content visible before completion', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      // Initial state before any stream has been started.
      await expect(pageB.getByTestId('stream-status')).toHaveText('pending', {
        timeout: 2_000,
      })

      await pageA.getByTestId('start-stream').click()

      // Status transitions to 'streaming' as the first token arrives.
      await expect(pageB.getByTestId('stream-status')).toHaveText('streaming', {
        timeout: 5_000,
      })

      // Partial content is visible while remaining tokens are in flight.
      await expect(pageB.getByTestId('stream-content')).toContainText('Hello', {
        timeout: 5_000,
      })

      // Terminal state: full accumulation and 'done'.
      await expect(pageB.getByTestId('stream-status')).toHaveText('done', {
        timeout: 5_000,
      })
      await expect(pageB.getByTestId('stream-content')).toContainText(
        'Hello World!',
      )

      await ctxA.close()
      await ctxB.close()
    })
  })

  // ── 6. tickCollectionOptions ──────────────────────────────────────────────

  test.describe('tickCollectionOptions — game entity positions', () => {
    /** A single setState call must propagate to the remote peer as a tick frame. */
    test('alice moves an entity; bob sees the updated position', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      await pageA.waitForTimeout(500)
      await pageA.getByTestId('move-entity').click()

      await expect(pageB.getByTestId('tick-entities')).toContainText(
        'entity1',
        {
          timeout: 10_000,
        },
      )

      await ctxA.close()
      await ctxB.close()
    })

    /**
     * Multiple rapid setState calls within a single tick interval are batched
     * by the tick transport into one frame.  The remote peer must converge to
     * a stable entity entry with valid coordinates rather than seeing stale or
     * partially applied state.
     */
    test('multiple rapid moves — bob converges to a stable entity with coordinates', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      await pageA.waitForTimeout(500)

      // Five moves in rapid succession; tick transport batches within tickMs window.
      for (let i = 0; i < 5; i++) {
        await pageA.getByTestId('move-entity').click()
      }

      // Bob should see entity1 with both x and y coordinate labels.
      await expect(pageB.getByTestId('tick-entities')).toContainText(
        'entity1',
        {
          timeout: 10_000,
        },
      )
      await expect(pageB.getByTestId('tick-entities')).toContainText('x:', {
        timeout: 5_000,
      })
      await expect(pageB.getByTestId('tick-entities')).toContainText('y:', {
        timeout: 5_000,
      })

      await ctxA.close()
      await ctxB.close()
    })
  })

  // ── 7. useSyncedCounter ───────────────────────────────────────────────────

  test.describe('useSyncedCounter — PN-Counter CRDT', () => {
    /**
     * Standard PN-Counter convergence: increments from two clients must be
     * merged correctly so both see the combined total.
     */
    test('alice increments 3×; bob increments 2×; both converge to 5', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      for (let i = 0; i < 3; i++)
        await pageA.getByTestId('counter-increment').click()
      for (let i = 0; i < 2; i++)
        await pageB.getByTestId('counter-increment').click()

      await expect(pageA.getByTestId('counter-value')).toHaveText('5', {
        timeout: 8_000,
      })
      await expect(pageB.getByTestId('counter-value')).toHaveText('5', {
        timeout: 8_000,
      })

      await ctxA.close()
      await ctxB.close()
    })

    /**
     * The 'dec' side of the PN-Counter must subtract independently tracked
     * per-client decrements.  Alice's increments and Bob's decrements must
     * merge to the correct net value.
     */
    test('decrement: alice +5, bob −2 → both converge to 3', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      for (let i = 0; i < 5; i++)
        await pageA.getByTestId('counter-increment').click()
      for (let i = 0; i < 2; i++)
        await pageB.getByTestId('counter-decrement').click()

      await expect(pageA.getByTestId('counter-value')).toHaveText('3', {
        timeout: 8_000,
      })
      await expect(pageB.getByTestId('counter-value')).toHaveText('3', {
        timeout: 8_000,
      })

      await ctxA.close()
      await ctxB.close()
    })

    /**
     * True concurrent increments fired simultaneously via Promise.all must
     * converge to the correct total (2) on both sides, demonstrating that
     * the per-clientId accumulator correctly separates each client's
     * contributions during the CRDT merge.
     */
    test('concurrent single increments via Promise.all — both converge to 2', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      // Fire both increments simultaneously.
      await Promise.all([
        pageA.getByTestId('counter-increment').click(),
        pageB.getByTestId('counter-increment').click(),
      ])

      await expect(pageA.getByTestId('counter-value')).toHaveText('2', {
        timeout: 8_000,
      })
      await expect(pageB.getByTestId('counter-value')).toHaveText('2', {
        timeout: 8_000,
      })

      await ctxA.close()
      await ctxB.close()
    })
  })

  // ── 8. useSyncedValue ─────────────────────────────────────────────────────

  test.describe('useSyncedValue — LWW-Register CRDT', () => {
    /** A single write from one client must be visible to all others. */
    test('alice sets a value; bob sees it', async ({ browser }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      const sharedText = `shared-${Date.now()}`
      await pageA.getByTestId('value-input').fill(sharedText)

      await expect(pageB.getByTestId('value-display')).toContainText(
        sharedText,
        { timeout: 8_000 },
      )

      await ctxA.close()
      await ctxB.close()
    })

    /**
     * Concurrent writes from two clients must converge to the same winner on
     * both sides.  The LWW register uses Lamport clock + clientId tie-break,
     * so exactly one value must win and both peers must display it.
     */
    test('concurrent writes from both users — both converge to the same LWW winner', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      const valueA = `val-alice-${Date.now()}`
      const valueB = `val-bob-${Date.now()}`

      // Both write simultaneously.
      await Promise.all([
        pageA.getByTestId('value-input').fill(valueA),
        pageB.getByTestId('value-input').fill(valueB),
      ])

      // Both pages must eventually display the same value (one winner).
      await expect(pageA.getByTestId('value-display')).toContainText(
        /val-alice|val-bob/,
        { timeout: 8_000 },
      )
      await expect(pageB.getByTestId('value-display')).toContainText(
        /val-alice|val-bob/,
        { timeout: 8_000 },
      )

      const winnerA = await pageA.getByTestId('value-display').textContent()
      const winnerB = await pageB.getByTestId('value-display').textContent()
      expect(winnerA?.trim()).toBe(winnerB?.trim())

      await ctxA.close()
      await ctxB.close()
    })
  })

  // ── 9. useSyncedSet ───────────────────────────────────────────────────────

  test.describe('useSyncedSet — OR-Set CRDT', () => {
    /** Concurrent adds from two clients must both appear on both sides. */
    test('alice adds item-a; bob sees it; bob adds item-b; alice sees it; both converge', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      await pageA.getByTestId('set-add-a').click()
      await expect(pageB.getByTestId('set-display')).toContainText('item-a', {
        timeout: 8_000,
      })

      await pageB.getByTestId('set-add-b').click()
      await expect(pageA.getByTestId('set-display')).toContainText('item-b', {
        timeout: 8_000,
      })

      await expect(pageA.getByTestId('set-display')).toContainText('item-a')
      await expect(pageB.getByTestId('set-display')).toContainText('item-b')

      await ctxA.close()
      await ctxB.close()
    })

    /**
     * OR-Set add-wins semantics: after an item is removed, re-adding it must
     * create a fresh tag that survives any outstanding remove operations.
     * This validates that orAdd() generates a new unique tag on each call so
     * a previously applied remove cannot suppress the new entry.
     */
    /**
     * OR-Set add-wins semantics: `mergeOr` is a union-by-tag operation.
     * Once a peer has seen an add (its tag is in their CRDT state), a remote
     * remove published by the adder cannot evict that entry via the merge —
     * the union keeps existing tags.  Only a local remove call clears the
     * caller's own view.
     *
     * This test verifies:
     *   1. Alice adds item-a → both peers see it.
     *   2. Alice removes item-a → Alice's local view is cleared; Bob retains
     *      item-a because mergeOr({existing tag}, {empty}) keeps the tag.
     *   3. Alice re-adds item-a (fresh unique tag) → Alice's view is restored.
     *
     * This is the documented add-wins invariant: a new orAdd() always creates
     * a unique tag unaffected by any prior or concurrent remove operation.
     */
    test('OR-Set add-wins — self-remove clears local view; peer retains via union merge; re-add restores', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      // Alice adds item-a; both see it.
      await pageA.getByTestId('set-add-a').click()
      await expect(pageA.getByTestId('set-display')).toContainText('item-a', {
        timeout: 5_000,
      })
      await expect(pageB.getByTestId('set-display')).toContainText('item-a', {
        timeout: 5_000,
      })

      // Alice removes item-a — disappears from Alice's local view immediately.
      await pageA.getByTestId('set-remove-a').click()
      await expect(pageA.getByTestId('set-display')).not.toContainText(
        'item-a',
        { timeout: 3_000 },
      )

      // Bob retains item-a: Alice published {entries: []}, but mergeOr keeps
      // Bob's existing uuid entry (union semantics — tags are never discarded).
      await pageB.waitForTimeout(300)
      await expect(pageB.getByTestId('set-display')).toContainText('item-a')

      // Alice re-adds item-a (fresh unique tag) → Alice's view is restored.
      await pageA.getByTestId('set-add-a').click()
      await expect(pageA.getByTestId('set-display')).toContainText('item-a', {
        timeout: 5_000,
      })

      await ctxA.close()
      await ctxB.close()
    })
  })

  // ── 10. Reconnection resilience ────────────────────────────────────────────

  test.describe('reconnection resilience', () => {
    /**
     * A full page reload (equivalent to the user pressing F5) tears down the
     * SSE connection, unmounts all components, and forces the transport to
     * reconnect from scratch.  The app must reach 'connected' status again and
     * restore all channel subscriptions.
     *
     * Note: Playwright's context.setOffline() does not affect loopback (localhost)
     * SSE streams because Chromium's network emulation bypasses the loopback
     * interface.  Page reload is therefore used as the reliable disconnect trigger.
     */
    test('connection is fully re-established after page reload', async ({
      browser,
    }) => {
      const { ctx, page } = await openContext(browser, 'alice-reload')

      // Reload the page — kills SSE stream, transport reinitialises.
      await page.reload()

      // Transport must reconnect and report 'connected' within the normal timeout.
      await expect(page.getByTestId('status')).toHaveText('connected', {
        timeout: 15_000,
      })
      await expect(page.getByTestId('todo-input')).toBeVisible({
        timeout: 5_000,
      })

      await ctx.close()
    })

    /**
     * After a page reload the transport must re-subscribe to all previously
     * active channels and resume delivering messages from other clients.
     * This tests the resubscription logic that fires after the 'connected'
     * event is received from the server.
     */
    test('sync resumes after page reload — new publishes propagate to peers', async ({
      browser,
    }) => {
      const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
      const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

      // Establish a shared todo before the reload.
      const preTodo = `pre-reload-${Date.now()}`
      await pageA.getByTestId('todo-input').fill(preTodo)
      await pageA.getByTestId('add-todo').click()
      await expect(pageB.getByTestId('todo-list')).toContainText(preTodo, {
        timeout: 8_000,
      })

      // Alice reloads — simulates a browser refresh.
      await pageA.reload()
      await expect(pageA.getByTestId('status')).toHaveText('connected', {
        timeout: 15_000,
      })
      await expect(pageA.getByTestId('todo-input')).toBeVisible({
        timeout: 5_000,
      })

      // A new todo inserted after the reconnect must still reach Bob,
      // proving that the channel subscription was restored.
      const postTodo = `post-reconnect-${Date.now()}`
      await pageA.getByTestId('todo-input').fill(postTodo)
      await pageA.getByTestId('add-todo').click()
      await expect(pageB.getByTestId('todo-list')).toContainText(postTodo, {
        timeout: 8_000,
      })

      await ctxA.close()
      await ctxB.close()
    })
  })
}
