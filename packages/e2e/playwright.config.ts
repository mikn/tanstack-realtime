import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

function resolveChromiumExecutable(): string | undefined {
  const candidates = [
    join(
      homedir(),
      '.cache',
      'ms-playwright',
      'chromium-1194',
      'chrome-linux',
      'chrome',
    ),
    join(
      homedir(),
      '.cache',
      'ms-playwright',
      'chromium_headless_shell-1194',
      'chrome-linux',
      'headless_shell',
    ),
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
  ]
  return candidates.find(existsSync)
}

const executablePath = resolveChromiumExecutable()

export default defineConfig({
  // No globalSetup/Teardown — Centrifugo not needed.
  // vinxi dev (TanStack Start) provides the SSE backend via webServer below.

  webServer: {
    command: `${join(import.meta.dirname, 'node_modules/.bin/vite')}`,
    cwd: join(import.meta.dirname, 'app'),
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },

  use: {
    baseURL: 'http://localhost:3000',
    actionTimeout: 10_000,
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },

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
