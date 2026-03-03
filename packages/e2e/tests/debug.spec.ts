/**
 * Diagnostic test — captures browser console and page state.
 * Run with: npx playwright test --grep "debug"
 */
import { test } from '@playwright/test'

test('debug - capture console and page state', async ({ browser }) => {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  const consoleLogs: Array<string> = []
  page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => consoleLogs.push(`[pageerror] ${err.message}`))
  page.on('requestfailed', (req) =>
    consoleLogs.push(`[reqfailed] ${req.url()} — ${req.failure()?.errorText}`),
  )

  await page.goto('/?userId=alice')
  await page.waitForTimeout(5000)

  const statusText = await page.getByTestId('status').textContent()
  console.log('Status:', statusText)
  for (const log of consoleLogs) console.log(' ', log)

  const html = await page.content()
  console.log('Root element inner text:', html.slice(0, 500))

  await ctx.close()
})
