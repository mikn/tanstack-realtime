/**
 * Vitest globalSetup for the centrifugo-e2e project.
 *
 * If the Centrifugo binary has not yet been downloaded it is fetched
 * automatically by delegating to scripts/download-centrifugo.mjs — the same
 * script that `npm run download-centrifugo` invokes. Subsequent runs reuse
 * the cached binary (the script is a no-op when the version matches).
 *
 * After ensuring the binary is present, starts an isolated Centrifugo
 * instance on a free port using a temporary JSON config file and waits for
 * the health endpoint, then provides the port to every test via
 * `inject('centrifugoPort')`.
 *
 * Config overview (Centrifugo v6 nested JSON format):
 *   - client.insecure: true          — skip connection token auth
 *   - channel.without_namespace.*    — open subscribe/publish for all anon channels
 *   - channel.namespaces[{name:prs}] — same for the presence sidecar namespace
 *     (named "prs:" not "$prs:" to avoid the private-channel '$' prefix that
 *      requires subscription tokens even in insecure mode)
 */

import { spawn, execFileSync } from 'child_process'
import type { ChildProcess } from 'child_process'
import { existsSync, writeFileSync, unlinkSync } from 'fs'
import { createServer } from 'net'
import { join } from 'path'
import { tmpdir } from 'os'
import { fileURLToPath } from 'url'
import type { GlobalSetupContext } from 'vitest/node'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

// __tests__/ is 2 levels deep from the repo root (packages/__tests__)
const root = fileURLToPath(new URL('../..', import.meta.url))
const IS_WINDOWS = process.platform === 'win32'
const BINARY =
  process.env['CENTRIFUGO_BIN'] ??
  join(root, '.cache', 'centrifugo', IS_WINDOWS ? 'centrifugo.exe' : 'centrifugo')

// ---------------------------------------------------------------------------
// Config builder
// ---------------------------------------------------------------------------

function buildConfig(port: number): string {
  return JSON.stringify(
    {
      http_server: {
        address: '127.0.0.1',
        port: String(port), // v6 expects a string here
      },
      log: { level: 'none' },
      health: { enabled: true },
      client: { insecure: true },
      channel: {
        without_namespace: {
          allow_subscribe_for_anonymous: true,
          allow_publish_for_anonymous: true,
          allow_publish_for_subscriber: true,
          allow_presence_for_anonymous: true,
          allow_presence_for_subscriber: true,
        },
        // "prs" namespace used for presence sidecar channels (presencePrefix: 'prs:').
        // Must NOT start with '$' — Centrifugo treats channels starting with '$'
        // as private (require subscription tokens) even in insecure mode.
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

async function waitForHealth(port: number, timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      // Localhost fetch is not routed through HTTPS_PROXY
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
// Global setup / teardown
// ---------------------------------------------------------------------------

let proc: ChildProcess | undefined
let configFile: string | undefined

export default async function setup({ provide }: GlobalSetupContext) {
  // ── 1. Ensure binary is present (download if necessary) ─────────────────
  if (!existsSync(BINARY)) {
    console.log('[centrifugo-e2e] Binary not cached — downloading via download-centrifugo.mjs…')
    execFileSync(
      process.execPath, // the `node` binary running this process
      [join(root, 'scripts', 'download-centrifugo.mjs')],
      { stdio: 'inherit', cwd: root },
    )
  }

  // ── 2. Find a free port ───────────────────────────────────────────────────
  const port = await findFreePort()

  // ── 3. Write a temporary config file ─────────────────────────────────────
  configFile = join(tmpdir(), `centrifugo-e2e-${port}.json`)
  writeFileSync(configFile, buildConfig(port), 'utf8')

  // ── 4. Start the binary with the config file ──────────────────────────────
  proc = spawn(BINARY, ['--config', configFile], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  })

  const stderr: string[] = []
  proc.stderr?.on('data', (chunk: Buffer) => stderr.push(chunk.toString()))
  proc.stdout?.on('data', () => {}) // drain stdout

  proc.on('error', (err) => {
    throw new Error(`[centrifugo-e2e] Failed to spawn binary: ${err.message}`)
  })

  proc.on('exit', (code) => {
    if (code !== null && code !== 0) {
      const log = stderr.join('').slice(-2000)
      throw new Error(
        `[centrifugo-e2e] Centrifugo exited unexpectedly with code ${code}.\nStderr:\n${log}`,
      )
    }
  })

  // ── 5. Wait for health ────────────────────────────────────────────────────
  try {
    await waitForHealth(port)
  } catch (err) {
    proc.kill()
    const log = stderr.join('').slice(-2000)
    throw new Error(
      `[centrifugo-e2e] ${(err as Error).message}\nStderr:\n${log || '(empty)'}`,
    )
  }

  console.log(`[centrifugo-e2e] Centrifugo ready on port ${port}`)

  // ── 6. Expose port to tests ───────────────────────────────────────────────
  provide('centrifugoPort', port)

  // ── 7. Teardown ───────────────────────────────────────────────────────────
  return function teardown() {
    proc?.kill('SIGTERM')
    proc = undefined
    if (configFile && existsSync(configFile)) {
      try {
        unlinkSync(configFile)
      } catch {
        // best-effort cleanup
      }
      configFile = undefined
    }
  }
}
