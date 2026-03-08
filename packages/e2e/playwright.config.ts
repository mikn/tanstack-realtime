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

const viteBin = join(import.meta.dirname, 'node_modules/.bin/vite')
const launchOpts = executablePath ? { launchOptions: { executablePath } } : {}

export default defineConfig({
  // React app (port 3000) + Solid app (port 3001) run as separate Vite servers.
  webServer: [
    {
      command: viteBin,
      cwd: join(import.meta.dirname, 'app'),
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env['CI'],
      timeout: 60_000,
    },
    {
      command: `${viteBin} --config vite.config.ts`,
      cwd: join(import.meta.dirname, 'app-solid'),
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env['CI'],
      timeout: 60_000,
    },
  ],

  workers: 1,
  timeout: 30_000,

  projects: [
    {
      name: 'chromium',
      testMatch: '**/multi-user.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        actionTimeout: 10_000,
        ...launchOpts,
      },
    },
    {
      name: 'solid-chromium',
      testMatch: '**/solid-multi-user.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
        actionTimeout: 10_000,
        ...launchOpts,
      },
    },
  ],

  testDir: './tests',
})
