/**
 * Multi-user integration tests for @tanstack/solid-realtime.
 *
 * Mirrors multi-user.spec.ts exactly but runs against the Solid app
 * (localhost:3001 via the solid-chromium Playwright project).
 *
 * The Solid app uses identical channel definitions, channel names, and
 * data-testid attributes as the React app, so the same assertions apply.
 *
 * Patterns covered (all 9):
 *   1. realtimeCollectionOptions  — server-synced collection (insert / delete)
 *   2. liveChannelOptions         — append-only event stream (chat)
 *   3. usePresence                — presence over pub/sub (withPresence wrapper)
 *   4. ephemeralLiveOptions       — typing indicators with TTL auto-expiry
 *   5. streamChannelOptions       — token-accumulation stream (useStream)
 *   6. tickCollectionOptions      — game-state batch updates
 *   7. useSyncedCounter           — PN-Counter CRDT
 *   8. useSyncedValue             — LWW-Register CRDT
 *   9. useSyncedSet               — OR-Set CRDT
 */

import { expect, test } from '@playwright/test'
import type { Browser, BrowserContext, Page } from '@playwright/test'

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
// 1. realtimeCollectionOptions
// ---------------------------------------------------------------------------

test.describe('realtimeCollectionOptions — multi-user todo sync', () => {
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
})

// ---------------------------------------------------------------------------
// 2. liveChannelOptions
// ---------------------------------------------------------------------------

test.describe('liveChannelOptions — multi-user chat', () => {
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
})

// ---------------------------------------------------------------------------
// 3. usePresence (over pub/sub via withPresence)
// ---------------------------------------------------------------------------

test.describe('usePresence — presence channel', () => {
  test('alice and bob each see the other in the presence list', async ({
    browser,
  }) => {
    const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
    const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

    // withPresence uses 2 s heartbeat for late-joiner discovery.
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
// 4. ephemeralLiveOptions
// ---------------------------------------------------------------------------

test.describe('ephemeralLiveOptions — typing indicators', () => {
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

    await pageB.waitForTimeout(3000)
    await expect(pageB.getByTestId('typing-indicators')).not.toContainText(
      'alice',
    )

    await ctxA.close()
    await ctxB.close()
  })
})

// ---------------------------------------------------------------------------
// 5. streamChannelOptions / useStream
// ---------------------------------------------------------------------------

test.describe('streamChannelOptions — token stream', () => {
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
})

// ---------------------------------------------------------------------------
// 6. tickCollectionOptions
// ---------------------------------------------------------------------------

test.describe('tickCollectionOptions — game entity positions', () => {
  test('alice moves an entity; bob sees the updated position', async ({
    browser,
  }) => {
    const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
    const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

    await pageA.waitForTimeout(500)
    await pageA.getByTestId('move-entity').click()

    await expect(pageB.getByTestId('tick-entities')).toContainText('entity1', {
      timeout: 10_000,
    })

    await ctxA.close()
    await ctxB.close()
  })
})

// ---------------------------------------------------------------------------
// 7. useSyncedCounter
// ---------------------------------------------------------------------------

test.describe('useSyncedCounter — concurrent increments', () => {
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
})

// ---------------------------------------------------------------------------
// 8. useSyncedValue
// ---------------------------------------------------------------------------

test.describe('useSyncedValue — last-write-wins shared text', () => {
  test('alice sets a value; bob sees it', async ({ browser }) => {
    const { ctx: ctxA, page: pageA } = await openContext(browser, 'alice')
    const { ctx: ctxB, page: pageB } = await openContext(browser, 'bob')

    const sharedText = `shared-${Date.now()}`
    await pageA.getByTestId('value-input').fill(sharedText)

    await expect(pageB.getByTestId('value-display')).toContainText(sharedText, {
      timeout: 8_000,
    })

    await ctxA.close()
    await ctxB.close()
  })
})

// ---------------------------------------------------------------------------
// 9. useSyncedSet
// ---------------------------------------------------------------------------

test.describe('useSyncedSet — concurrent add / add convergence', () => {
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
})
