/**
 * Playwright globalSetup for the e2e package.
 *
 * Starts an isolated Centrifugo instance on a free port (reusing the exact
 * same binary, cache path, and config as packages/__tests__/centrifugo.globalSetup.ts).
 * Writes the port to .centrifugo-port.tmp so each test can read it.
 */

import { execFileSync, spawn } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import type { ChildProcess } from 'node:child_process'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

// packages/e2e is 2 levels below the repo root
const root = fileURLToPath(new URL('../..', import.meta.url))
const IS_WINDOWS = process.platform === 'win32'

export const BINARY =
  process.env['CENTRIFUGO_BIN'] ??
  join(
    root,
    '.cache',
    'centrifugo',
    IS_WINDOWS ? 'centrifugo.exe' : 'centrifugo',
  )

export const PORT_FILE = join(
  fileURLToPath(new URL('.', import.meta.url)),
  '.centrifugo-port.tmp',
)

// ---------------------------------------------------------------------------
// Config builder (same as centrifugo.globalSetup.ts)
// ---------------------------------------------------------------------------

function buildConfig(port: number): string {
  return JSON.stringify(
    {
      http_server: {
        address: '127.0.0.1',
        port: String(port),
      },
      log: { level: 'none' },
      health: { enabled: true },
      client: { insecure: true, allowed_origins: ['*'] },
      channel: {
        without_namespace: {
          allow_subscribe_for_anonymous: true,
          allow_publish_for_anonymous: true,
          allow_publish_for_subscriber: true,
          allow_presence_for_anonymous: true,
          allow_presence_for_subscriber: true,
        },
        namespaces: [
          {
            name: 'prs',
            allow_subscribe_for_anonymous: true,
            allow_publish_for_anonymous: true,
            allow_publish_for_subscriber: true,
            allow_presence_for_anonymous: true,
            allow_presence_for_subscriber: true,
          },
        ],
      },
    },
    null,
    2,
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as { port: number }).port
      server.close(() => resolve(port))
    })
    server.on('error', reject)
  })
}

async function waitForHealth(port: number, timeoutMs = 15_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`)
      if (res.ok) return
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error(`Centrifugo did not become healthy within ${timeoutMs}ms`)
}

// ---------------------------------------------------------------------------
// Module-level state for teardown
// ---------------------------------------------------------------------------

let proc: ChildProcess | undefined
let configFile: string | undefined

export async function startCentrifugo(): Promise<number> {
  // 1. Ensure binary is present
  if (!existsSync(BINARY)) {
    console.log(
      '[e2e] Binary not cached — downloading via download-centrifugo.mjs…',
    )
    execFileSync(
      process.execPath,
      [join(root, 'scripts', 'download-centrifugo.mjs')],
      { stdio: 'inherit', cwd: root },
    )
  }

  // 2. Find a free port
  const port = await findFreePort()

  // 3. Write config file
  configFile = join(tmpdir(), `centrifugo-e2e-playwright-${port}.json`)
  writeFileSync(configFile, buildConfig(port), 'utf8')

  // 4. Spawn Centrifugo
  proc = spawn(BINARY, ['--config', configFile], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  })

  const stderr: Array<string> = []
  proc.stderr?.on('data', (chunk: Buffer) => stderr.push(chunk.toString()))
  proc.stdout?.on('data', () => {})

  proc.on('error', (err) => {
    throw new Error(`[e2e] Failed to spawn Centrifugo: ${err.message}`)
  })

  proc.on('exit', (code) => {
    if (code !== null && code !== 0) {
      const log = stderr.join('').slice(-2000)
      throw new Error(
        `[e2e] Centrifugo exited unexpectedly with code ${code}.\nStderr:\n${log}`,
      )
    }
  })

  // 5. Wait for health
  try {
    await waitForHealth(port)
  } catch (err) {
    proc.kill()
    const log = stderr.join('').slice(-2000)
    throw new Error(
      `[e2e] ${(err as Error).message}\nStderr:\n${log || '(empty)'}`,
    )
  }

  console.log(`[e2e] Centrifugo ready on port ${port}`)
  return port
}

export function stopCentrifugo(): void {
  proc?.kill('SIGTERM')
  proc = undefined
  if (configFile && existsSync(configFile)) {
    try {
      // best-effort cleanup
      import('node:fs').then(({ unlinkSync }) => {
        try {
          unlinkSync(configFile!)
        } catch {
          // ignore
        }
      })
    } catch {
      // ignore
    }
    configFile = undefined
  }
}

// ---------------------------------------------------------------------------
// Playwright globalSetup entry point
// ---------------------------------------------------------------------------

export default async function setup(): Promise<void> {
  const port = await startCentrifugo()
  // Write port to file so tests can read it
  writeFileSync(PORT_FILE, String(port), 'utf8')
}
