/**
 * Diagnostic test to check browser console and app state.
 * Run with: npx playwright test --grep "debug"
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from '@playwright/test'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT_FILE = join(__dirname, '..', '.centrifugo-port.tmp')

test('debug - capture console and page state', async ({ browser }) => {
  const port = readFileSync(PORT_FILE, 'utf8').trim()
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  const consoleLogs: Array<string> = []
  page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => consoleLogs.push(`[pageerror] ${err.message}`))
  page.on('requestfailed', (req) =>
    consoleLogs.push(`[reqfailed] ${req.url()} — ${req.failure()?.errorText}`),
  )

  await page.goto(`/?userId=alice&centrifugoPort=${port}`)
  await page.waitForTimeout(5000)

  const statusText = await page.getByTestId('status').textContent()
  console.log('Status:', statusText)
  console.log('Console logs:')
  for (const log of consoleLogs) {
    console.log(' ', log)
  }

  const html = await page.content()
  console.log('Root element inner text:', html.slice(0, 500))

  await ctx.close()
})
