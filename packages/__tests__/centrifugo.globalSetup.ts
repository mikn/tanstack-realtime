/**
 * Vitest globalSetup for the centrifugo-e2e project.
 *
 * Checks that the Centrifugo binary has been pre-downloaded (via
 * `npm run download-centrifugo`), starts an instance on a free port with a
 * minimal test config, waits for the health endpoint, and provides the port
 * to every test via `inject('centrifugoPort')`.
 *
 * If the binary is absent this module throws immediately with a clear
 * actionable message — no silent skips, no download attempts here.
 */

import { spawn } from 'child_process'
import type { ChildProcess } from 'child_process'
import { writeFileSync, existsSync } from 'fs'
import { createServer } from 'net'
import { tmpdir } from 'os'
import { join } from 'path'
import { fileURLToPath } from 'url'
import type { GlobalSetupContext } from 'vitest/node'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const root = fileURLToPath(new URL('../../..', import.meta.url))
const IS_WINDOWS = process.platform === 'win32'
const BINARY =
  process.env['CENTRIFUGO_BIN'] ??
  join(root, '.cache', 'centrifugo', IS_WINDOWS ? 'centrifugo.exe' : 'centrifugo')

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

function buildConfig(port: number): string {
  // Centrifugo v5+ JSON config.
  // Targets the "channel_without_namespace" (default namespace) and the
  // "$prs" namespace (used by centrifugoTransport for sidecar presence).
  // All channels are open for anonymous subscribers/publishers — test-only.
  return JSON.stringify(
    {
      port,
      address: '127.0.0.1',
      log_level: 'none',
      // A dummy HMAC secret satisfies the validation check even though no
      // tokens are required in this anonymous-access config.
      token_hmac_secret_key: 'e2e-test-secret-key-at-least-32-bytes!',
      // Allow connections without a JWT token.
      allow_anonymous_connect: true,
      // Default namespace — applies to every channel with no explicit namespace.
      channel_without_namespace: {
        allow_subscribe_for_anonymous: true,
        allow_publish_for_subscriber: true,
      },
      // Presence sidecar namespace ($prs:<channel>).
      namespaces: [
        {
          name: '$prs',
          allow_subscribe_for_anonymous: true,
          allow_publish_for_subscriber: true,
        },
      ],
    },
    null,
    2,
  )
}

async function waitForHealth(port: number, timeoutMs = 10_000): Promise<void> {
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
// Global setup / teardown
// ---------------------------------------------------------------------------

let proc: ChildProcess | undefined

export default async function setup({ provide }: GlobalSetupContext) {
  // ── 1. Binary presence check ─────────────────────────────────────────────
  if (!existsSync(BINARY)) {
    throw new Error(
      `[centrifugo-e2e] Centrifugo binary not found at:\n  ${BINARY}\n\n` +
        `Run the download step first:\n  npm run download-centrifugo\n\n` +
        `Then re-run the E2E tests:\n  npx vitest run --project centrifugo-e2e\n`,
    )
  }

  // ── 2. Find a free port ───────────────────────────────────────────────────
  const port = await findFreePort()

  // ── 3. Write temp config ─────────────────────────────────────────────────
  const configPath = join(tmpdir(), `centrifugo-e2e-${port}.json`)
  writeFileSync(configPath, buildConfig(port), 'utf8')

  // ── 4. Start the binary ───────────────────────────────────────────────────
  proc = spawn(BINARY, ['--config', configPath], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  })

  const stderr: string[] = []
  proc.stderr?.on('data', (chunk: Buffer) => stderr.push(chunk.toString()))
  proc.stdout?.on('data', () => {}) // drain stdout

  proc.on('error', (err) => {
    throw new Error(`[centrifugo-e2e] Failed to spawn binary: ${err.message}`)
  })

  proc.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      const log = stderr.join('').slice(-2000)
      throw new Error(
        `[centrifugo-e2e] Centrifugo exited with code ${code}.\n` +
          `Config: ${configPath}\nStderr:\n${log}`,
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
      `[centrifugo-e2e] ${(err as Error).message}\n` +
        `Config: ${configPath}\n` +
        `Stderr:\n${log || '(empty)'}`,
    )
  }

  console.log(`[centrifugo-e2e] Centrifugo ready on port ${port}`)

  // ── 6. Expose port to tests ───────────────────────────────────────────────
  provide('centrifugoPort', port)

  // ── 7. Teardown ───────────────────────────────────────────────────────────
  return function teardown() {
    proc?.kill('SIGTERM')
    proc = undefined
  }
}
