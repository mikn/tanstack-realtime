/**
 * Multi-user integration tests for @tanstack/realtime.
 *
 * Each `describe` block exercises a different library pattern by coordinating
 * two Playwright browser contexts (alice + bob) against a real Centrifugo
 * instance started by global-setup.ts.
 *
 * Patterns covered:
 *   1. realtimeCollectionOptions  — server-synced collection (insert / delete)
 *   2. liveChannelOptions         — append-only event stream (chat)
 *   3. usePresence                — presence channel (who's online)
 *   4. ephemeralLiveOptions       — typing indicators with TTL auto-expiry
 *   5. streamChannelOptions       — token-accumulation stream (useStream)
 *   6. tickCollectionOptions      — game-state batch updates
 *   7. useSyncedCounter           — PN-Counter CRDT
 *   8. useSyncedValue             — LWW-Register CRDT
 *   9. useSyncedSet               — OR-Set CRDT
 *
 * How it works
 * ─────────────
 * global-setup.ts writes the Centrifugo port to .centrifugo-port.tmp.
 * Each test reads that file and navigates both contexts to
 *   http://localhost:5173/?userId=<id>&centrifugoPort=<port>
 * The app reads those params and creates a client connected to Centrifugo.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Browser, BrowserContext, Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ESM-safe __dirname equivalent
const __dirname = dirname(fileURLToPath(import.meta.url))

const PORT_FILE = join(__dirname, '..', '.centrifugo-port.tmp')

function centrifugoPort(): string {
  return readFileSync(PORT_FILE, 'utf8').trim()
}

function appUrl(userId: string): string {
  return `/?userId=${userId}&centrifugoPort=${centrifugoPort()}`
}

async function openContext(
  browser: Browser,
  userId: string,
): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(appUrl(userId))
  // Wait until the realtime client reports "connected".
  await expect(page.getByTestId('status')).toHaveText('connected', {
    timeout: 15_000,
  })
  // Wait until the panels are mounted and subscriptions are set up.
  // App.tsx defers panel rendering until the first successful connection, so
  // there is one extra React render cycle after the status text updates.
  // Waiting for a panel element ensures all hooks (e.g. useSyncedValue) have
  // subscribed to their channels before we start performing test actions.
  await expect(page.getByTestId('todo-input')).toBeVisible({ timeout: 5_000 })
  return { ctx, page }
}

// ---------------------------------------------------------------------------
// 1. realtimeCollectionOptions — Todos
// ---------------------------------------------------------------------------

test.describe('realtimeCollectionOptions — multi-user todo sync', () => {
  test('alice inserts a todo; bob sees it; alice deletes it; bob sees deletion', async ({
    browser,
  }) => {
    const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
    const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

    // Alice adds a todo.
    const todoText = `Buy milk ${Date.now()}`
    await pageA.getByTestId('todo-input').fill(todoText)
    await pageA.getByTestId('add-todo').click()

    // Bob should see the new todo.
    await expect(pageB.getByTestId('todo-list')).toContainText(todoText, {
      timeout: 8_000,
    })

    // Alice deletes the todo (first delete button in her list).
    await pageA.getByTestId('delete-todo').first().click()

    // Bob should no longer see the todo.
    await expect(pageB.getByTestId('todo-list')).not.toContainText(todoText, {
      timeout: 8_000,
    })

    await ctxA.close()
    await ctxB.close()
  })
})

// ---------------------------------------------------------------------------
// 2. liveChannelOptions — Chat
// ---------------------------------------------------------------------------

test.describe('liveChannelOptions — multi-user chat', () => {
  test('alice sends a message; bob sees it; bob replies; alice sees reply', async ({
    browser,
  }) => {
    const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
    const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

    // Alice sends.
    const msgA = `Hello from alice ${Date.now()}`
    await pageA.getByTestId('chat-input').fill(msgA)
    await pageA.getByTestId('send-message').click()

    await expect(pageB.getByTestId('chat-messages')).toContainText(msgA, {
      timeout: 8_000,
    })

    // Bob replies.
    const msgB = `Hi alice from bob ${Date.now()}`
    await pageB.getByTestId('chat-input').fill(msgB)
    await pageB.getByTestId('send-message').click()

    await expect(pageA.getByTestId('chat-messages')).toContainText(msgB, {
      timeout: 8_000,
    })

    await ctxA.close()
    await ctxB.close()
  })
})

// ---------------------------------------------------------------------------
// 3. usePresence — online users
// ---------------------------------------------------------------------------

test.describe('usePresence — presence channel', () => {
  test('alice and bob each see the other in the presence list', async ({
    browser,
  }) => {
    const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
    const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

    // Both should appear in each other's presence list.
    // Give presence a moment to propagate after both have connected.
    await expect(pageA.getByTestId('presence-users')).toContainText('bob', {
      timeout: 8_000,
    })
    await expect(pageB.getByTestId('presence-users')).toContainText('alice', {
      timeout: 8_000,
    })

    await ctxA.close()
    await ctxB.close()
  })
})

// ---------------------------------------------------------------------------
// 4. ephemeralLiveOptions — typing indicators with TTL
// ---------------------------------------------------------------------------

test.describe('ephemeralLiveOptions — typing indicators', () => {
  test('alice triggers typing; bob sees it; then it auto-expires', async ({
    browser,
  }) => {
    const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
    const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

    // Suppress unused variable warning — pageA is used below.
    void pageA

    // Alice sends a typing event.
    await pageA.getByTestId('start-typing').click()

    // Bob should see the indicator.
    await expect(pageB.getByTestId('typing-indicators')).toContainText(
      'alice',
      { timeout: 8_000 },
    )

    // After the TTL (2000ms) + buffer, the indicator should disappear.
    await pageB.waitForTimeout(3000)
    await expect(pageB.getByTestId('typing-indicators')).not.toContainText(
      'alice',
    )

    await ctxA.close()
    await ctxB.close()
  })
})

// ---------------------------------------------------------------------------
// 5. streamChannelOptions / useStream — token accumulation
// ---------------------------------------------------------------------------

test.describe('streamChannelOptions — token stream', () => {
  test('alice starts a stream; bob sees accumulated content and done status', async ({
    browser,
  }) => {
    const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
    const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

    // Alice triggers the stream.
    await pageA.getByTestId('start-stream').click()

    // Bob should accumulate tokens and reach "done".
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
})

// ---------------------------------------------------------------------------
// 6. tickCollectionOptions — game-state batch updates
// ---------------------------------------------------------------------------

test.describe('tickCollectionOptions — game entity positions', () => {
  test('alice moves an entity; bob sees the updated position', async ({
    browser,
  }) => {
    const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
    const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

    // Wait for tick transports to connect.
    await pageA.waitForTimeout(500)

    // Alice clicks "Move Entity" — the tick transport will batch and publish.
    await pageA.getByTestId('move-entity').click()

    // Bob should see entity1 in the tick entities list.
    await expect(pageB.getByTestId('tick-entities')).toContainText('entity1', {
      timeout: 10_000,
    })

    await ctxA.close()
    await ctxB.close()
  })
})

// ---------------------------------------------------------------------------
// 7. useSyncedCounter — PN-Counter CRDT
// ---------------------------------------------------------------------------

test.describe('useSyncedCounter — concurrent increments', () => {
  test('alice increments 3×; bob increments 2×; both converge to 5', async ({
    browser,
  }) => {
    const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
    const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

    // Both increment concurrently.
    for (let i = 0; i < 3; i++) {
      await pageA.getByTestId('counter-increment').click()
    }
    for (let i = 0; i < 2; i++) {
      await pageB.getByTestId('counter-increment').click()
    }

    // Both should converge to 5.
    await expect(pageA.getByTestId('counter-value')).toHaveText('5', {
      timeout: 8_000,
    })
    await expect(pageB.getByTestId('counter-value')).toHaveText('5', {
      timeout: 8_000,
    })

    await ctxA.close()
    await ctxB.close()
  })
})

// ---------------------------------------------------------------------------
// 8. useSyncedValue — LWW-Register CRDT
// ---------------------------------------------------------------------------

test.describe('useSyncedValue — last-write-wins shared text', () => {
  test('alice sets a value; bob sees it', async ({ browser }) => {
    const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
    const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

    const sharedText = `shared-${Date.now()}`
    await pageA.getByTestId('value-input').fill(sharedText)
    // The useSyncedValue hook publishes on every keystroke (onChange).

    await expect(pageB.getByTestId('value-display')).toContainText(sharedText, {
      timeout: 8_000,
    })

    await ctxA.close()
    await ctxB.close()
  })
})

// ---------------------------------------------------------------------------
// 9. useSyncedSet — OR-Set CRDT
// ---------------------------------------------------------------------------

test.describe('useSyncedSet — concurrent add / add convergence', () => {
  test('alice adds item-a; bob sees it; bob adds item-b; alice sees it; both converge', async ({
    browser,
  }) => {
    const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
    const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

    // Alice adds item-a.
    await pageA.getByTestId('set-add-a').click()
    await expect(pageB.getByTestId('set-display')).toContainText('item-a', {
      timeout: 8_000,
    })

    // Bob adds item-b concurrently — it should appear on alice's side.
    await pageB.getByTestId('set-add-b').click()
    await expect(pageA.getByTestId('set-display')).toContainText('item-b', {
      timeout: 8_000,
    })

    // Both should see both items (OR-Set union convergence).
    await expect(pageA.getByTestId('set-display')).toContainText('item-a', {
      timeout: 8_000,
    })
    await expect(pageB.getByTestId('set-display')).toContainText('item-b', {
      timeout: 8_000,
    })

    await ctxA.close()
    await ctxB.close()
  })
})
