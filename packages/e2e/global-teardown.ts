/**
 * Playwright globalTeardown — kills Centrifugo and removes the port temp file.
 */

import { existsSync, unlinkSync } from 'node:fs'
import { PORT_FILE, stopCentrifugo } from './global-setup.js'

export default function teardown(): void {
  stopCentrifugo()
  if (existsSync(PORT_FILE)) {
    try {
      unlinkSync(PORT_FILE)
    } catch {
      // best-effort
    }
  }
}
