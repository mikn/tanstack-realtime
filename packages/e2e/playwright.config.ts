import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

// Use a pre-cached Chromium binary if the canonical Playwright revision is not
// available (common in sandboxed CI / offline environments).
function resolveChromiumExecutable(): string | undefined {
  const candidates = [
    // Full Chromium (preferred — headless_shell may drop WebSocket frames).
    join(
      homedir(),
      '.cache',
      'ms-playwright',
      'chromium-1194',
      'chrome-linux',
      'chrome',
    ),
    // Headless shell fallback.
    join(
      homedir(),
      '.cache',
      'ms-playwright',
      'chromium_headless_shell-1194',
      'chrome-linux',
      'headless_shell',
    ),
    // System Chromium fallbacks.
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
  ]
  return candidates.find(existsSync)
}

const executablePath = resolveChromiumExecutable()

export default defineConfig({
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  // Start the Vite dev server before the tests run.
  webServer: {
    command: 'node_modules/.bin/vite app/ --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env['CI'],
    timeout: 30_000,
  },

  use: {
    baseURL: 'http://localhost:5173',
    // Generous timeout for realtime sync across two browser contexts.
    actionTimeout: 10_000,
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },

  // Run tests serially to avoid Centrifugo channel name collisions.
  workers: 1,

  timeout: 30_000,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  testDir: './tests',
})
