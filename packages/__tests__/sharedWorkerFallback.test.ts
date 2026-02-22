/**
 * Tests for isSharedWorkerSupported() and createSharedWorkerTransport fallback.
 *
 * Covers:
 *  - isSharedWorkerSupported() returns false when SharedWorker is not defined
 *  - isSharedWorkerSupported() returns true when SharedWorker is defined
 *  - createSharedWorkerTransport() calls the fallback when SharedWorker is unavailable
 *  - createSharedWorkerTransport() returns fallback transport directly
 *  - createSharedWorkerTransport() throws with a descriptive message when no fallback
 *  - error message references isSharedWorkerSupported() and fallback param
 *  - fallback receives the original options argument
 *
 * NOTE: sharedTransport.test.ts installs a global MockSharedWorker at module
 * load time. This file manages globalThis.SharedWorker explicitly in each test
 * to control the presence/absence of the global, ensuring isolation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Store } from '@tanstack/store'
import { isSharedWorkerSupported, createSharedWorkerTransport } from '@tanstack/realtime'
import type { RealtimeTransport, PresenceCapable, ConnectionStatus } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Minimal RealtimeTransport & PresenceCapable stub for fallback testing
// ---------------------------------------------------------------------------

function createFallbackTransport(): RealtimeTransport & PresenceCapable {
  const store = new Store<ConnectionStatus>('disconnected')
  return {
    store,
    async connect() {},
    disconnect() {},
    subscribe(_ch, _cb) {
      return () => {}
    },
    async publish() {},
    joinPresence() {},
    updatePresence() {},
    leavePresence() {},
    onPresenceChange(_ch, _cb) {
      return () => {}
    },
  }
}

// ---------------------------------------------------------------------------
// Helpers to manage the SharedWorker global
// ---------------------------------------------------------------------------

function removeSharedWorker(): unknown {
  const g = globalThis as Record<string, unknown>
  const saved = g['SharedWorker']
  delete g['SharedWorker']
  return saved
}

function restoreSharedWorker(saved: unknown): void {
  const g = globalThis as Record<string, unknown>
  if (saved !== undefined) {
    g['SharedWorker'] = saved
  } else {
    delete g['SharedWorker']
  }
}

// ---------------------------------------------------------------------------
// isSharedWorkerSupported
// ---------------------------------------------------------------------------

describe('isSharedWorkerSupported', () => {
  it('returns false when SharedWorker is not in globalThis', () => {
    const saved = removeSharedWorker()
    try {
      expect(isSharedWorkerSupported()).toBe(false)
    } finally {
      restoreSharedWorker(saved)
    }
  })

  it('returns true when SharedWorker is globally available', () => {
    const g = globalThis as Record<string, unknown>
    const saved = g['SharedWorker']
    g['SharedWorker'] = class MockSharedWorker {}
    try {
      expect(isSharedWorkerSupported()).toBe(true)
    } finally {
      restoreSharedWorker(saved)
    }
  })

  it('returns false after SharedWorker is removed (dynamic check, not cached)', () => {
    const saved = removeSharedWorker()
    try {
      // First check: false
      expect(isSharedWorkerSupported()).toBe(false)

      // Add it back
      ;(globalThis as Record<string, unknown>)['SharedWorker'] = class {}
      expect(isSharedWorkerSupported()).toBe(true)

      // Remove again
      delete (globalThis as Record<string, unknown>)['SharedWorker']
      expect(isSharedWorkerSupported()).toBe(false)
    } finally {
      restoreSharedWorker(saved)
    }
  })

  it('result matches typeof check — isSharedWorkerSupported equals typeof SharedWorker !== undefined', () => {
    const saved = removeSharedWorker()
    try {
      // Without SharedWorker
      expect(isSharedWorkerSupported()).toBe(typeof SharedWorker !== 'undefined')

      // With SharedWorker
      ;(globalThis as Record<string, unknown>)['SharedWorker'] = class {}
      expect(isSharedWorkerSupported()).toBe(typeof SharedWorker !== 'undefined')
    } finally {
      restoreSharedWorker(saved)
    }
  })
})

// ---------------------------------------------------------------------------
// createSharedWorkerTransport — fallback behaviour (SharedWorker absent)
// ---------------------------------------------------------------------------

describe('createSharedWorkerTransport — fallback when SharedWorker is unavailable', () => {
  let savedSharedWorker: unknown

  beforeEach(() => {
    // Ensure SharedWorker is absent for all tests in this group.
    savedSharedWorker = removeSharedWorker()
  })

  afterEach(() => {
    restoreSharedWorker(savedSharedWorker)
  })

  it('throws with a descriptive error when no fallback is provided', () => {
    expect(() => {
      createSharedWorkerTransport('wss://example.com/worker.js')
    }).toThrow('SharedWorker is not supported')
  })

  it('error message mentions isSharedWorkerSupported', () => {
    expect(() => {
      createSharedWorkerTransport('wss://example.com/worker.js')
    }).toThrow('isSharedWorkerSupported')
  })

  it('error message mentions the fallback parameter', () => {
    expect(() => {
      createSharedWorkerTransport('wss://example.com/worker.js')
    }).toThrow('fallback')
  })

  it('calls the fallback factory when SharedWorker is unavailable', () => {
    const fallback = vi.fn(() => createFallbackTransport())

    createSharedWorkerTransport('wss://example.com/worker.js', fallback)

    expect(fallback).toHaveBeenCalledTimes(1)
  })

  it('passes a string options to the fallback factory unchanged', () => {
    const fallback = vi.fn(() => createFallbackTransport())
    const options = 'wss://example.com/worker.js'

    createSharedWorkerTransport(options, fallback)

    expect(fallback).toHaveBeenCalledWith(options)
  })

  it('passes a URL object to the fallback factory unchanged', () => {
    const fallback = vi.fn(() => createFallbackTransport())
    const url = new URL('https://example.com/worker.js')

    createSharedWorkerTransport(url, fallback)

    expect(fallback).toHaveBeenCalledWith(url)
  })

  it('passes a SharedWorkerTransportOptions object to the fallback factory unchanged', () => {
    const fallback = vi.fn(() => createFallbackTransport())
    const options = { url: 'wss://example.com/worker.js' }

    createSharedWorkerTransport(options, fallback)

    expect(fallback).toHaveBeenCalledWith(options)
  })

  it('returns the transport produced by the fallback', () => {
    const fallbackTransport = createFallbackTransport()
    const fallback = vi.fn(() => fallbackTransport)

    const result = createSharedWorkerTransport('wss://example.com/worker.js', fallback)

    expect(result).toBe(fallbackTransport)
  })

  it('does not throw when a fallback is provided', () => {
    expect(() => {
      createSharedWorkerTransport(
        'wss://example.com/worker.js',
        () => createFallbackTransport(),
      )
    }).not.toThrow()
  })

  it('fallback transport is usable — has store and publish', async () => {
    const fallbackTransport = createFallbackTransport()
    const result = createSharedWorkerTransport(
      'wss://example.com/worker.js',
      () => fallbackTransport,
    )

    expect(result.store).toBeDefined()
    await expect(result.publish('ch', {})).resolves.not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// createSharedWorkerTransport — fallback is NOT called when SharedWorker is present
// ---------------------------------------------------------------------------

describe('createSharedWorkerTransport — fallback is not called when SharedWorker is supported', () => {
  it('fallback is not called when SharedWorker is available (even if transport setup fails)', () => {
    // Ensure SharedWorker is present by checking its current state.
    // sharedTransport.test.ts installs MockSharedWorker globally.
    if (!isSharedWorkerSupported()) {
      // If no mock is installed (e.g. test ordering change), install a minimal one.
      ;(globalThis as Record<string, unknown>)['SharedWorker'] = class {
        port = {
          start() {},
          addEventListener() {},
          postMessage() {},
        }
        addEventListener() {}
        constructor(_url: string) {}
      }
    }

    const fallback = vi.fn(() => createFallbackTransport())

    try {
      // May throw because the mock needs a server registration — that's fine.
      createSharedWorkerTransport('wss://not-registered.example.com/worker.js', fallback)
    } catch {
      // Expected: MockSharedWorker throws "No SharedWorker server registered".
      // The important thing is that the fallback was NOT called.
    }

    expect(fallback).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// isSharedWorkerSupported — used as a feature flag
// ---------------------------------------------------------------------------

describe('isSharedWorkerSupported — manual feature-detection pattern', () => {
  it('manual branch is equivalent to createSharedWorkerTransport fallback param', () => {
    const saved = removeSharedWorker()
    try {
      const fallback = vi.fn(() => createFallbackTransport())
      const fallback2 = vi.fn(() => createFallbackTransport())

      // Pattern A: use fallback param
      createSharedWorkerTransport('wss://example.com/worker.js', fallback)

      // Pattern B: manual branch
      if (!isSharedWorkerSupported()) {
        fallback2('wss://example.com/worker.js')
      }

      // Both patterns activated the fallback exactly once.
      expect(fallback).toHaveBeenCalledTimes(1)
      expect(fallback2).toHaveBeenCalledTimes(1)
    } finally {
      restoreSharedWorker(saved)
    }
  })
})
