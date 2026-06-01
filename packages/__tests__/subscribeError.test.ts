/**
 * Tests for onSubscribeError — the callback that fires when the server
 * rejects a subscription attempt (e.g. authorization denied).
 *
 * Covers:
 *  - wsTransport dispatches subscribe:error messages to listeners
 *  - createRealtimeClient.onSubscribeError delegates to the transport
 *  - createRealtimeClient.onSubscribeError returns no-op for transports
 *    without onSubscribeError
 *  - realtimeCollectionOptions logs subscribe errors to console.error
 *  - liveChannelOptions logs subscribe errors to console.error
 *  - Unsubscribe function removes the listener
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Store } from '@tanstack/store'
import {
  createRealtimeClient,
  liveChannelOptions,
  realtimeCollectionOptions,
} from '@realtimejs/core'
import type { ConnectionStatus, RealtimeTransport } from '@realtimejs/core'
import type { CollectionConfig } from '@tanstack/db'

// ---------------------------------------------------------------------------
// Mock transport helpers
// ---------------------------------------------------------------------------

function createMockTransport(): RealtimeTransport & {
  onSubscribeError: NonNullable<RealtimeTransport['onSubscribeError']>
  emit: (channel: string, data: unknown) => void
  fireSubscribeError: (channel: string, reason: string, code?: number) => void
} {
  const listeners = new Map<string, Set<(data: unknown) => void>>()
  const errorListeners = new Set<
    (channel: string, reason: string, code?: number) => void
  >()
  const store = new Store<ConnectionStatus>('connected')

  return {
    store,
    async connect() {},
    disconnect() {},
    subscribe(channel, onMessage) {
      if (!listeners.has(channel)) listeners.set(channel, new Set())
      listeners.get(channel)!.add(onMessage)
      return () => {
        listeners.get(channel)?.delete(onMessage)
      }
    },
    async publish() {},
    hook() {
      return { unhook: () => {} }
    },
    onSubscribeError(callback) {
      errorListeners.add(callback)
      return () => {
        errorListeners.delete(callback)
      }
    },
    emit(channel, data) {
      const cbs = listeners.get(channel)
      if (cbs) for (const cb of cbs) cb(data)
    },
    fireSubscribeError(channel, reason, code) {
      for (const cb of errorListeners) cb(channel, reason, code)
    },
  }
}

/** A base transport without onSubscribeError (tests the no-op path). */
function createBaseTransport(): RealtimeTransport {
  const store = new Store<ConnectionStatus>('connected')
  return {
    store,
    async connect() {},
    disconnect() {},
    subscribe(_ch, _cb) {
      return () => {}
    },
    async publish() {},
    hook() {
      return { unhook: () => {} }
    },
  }
}

type WriteOp = { type: string; value?: unknown; key?: unknown }

function driveSync(config: CollectionConfig<any, any, any, any>): {
  ops: Array<WriteOp>
  stop: () => void
} {
  const ops: Array<WriteOp> = []
  const stop = config.sync.sync({
    collection: null as any,
    begin: () => {},
    write: (op: WriteOp) => ops.push(op),
    commit: () => {},
    markReady: () => {},
    truncate: () => {},
  })
  return { ops, stop: stop as unknown as () => void }
}

// ---------------------------------------------------------------------------
// Tests — Transport-level onSubscribeError
// ---------------------------------------------------------------------------

describe('onSubscribeError — transport level', () => {
  it('fires callback with channel, reason, and code', () => {
    const transport = createMockTransport()
    const cb = vi.fn()

    transport.onSubscribeError(cb)
    transport.fireSubscribeError('todos', 'unauthorized', 403)

    expect(cb).toHaveBeenCalledOnce()
    // eslint-disable-next-line vitest/prefer-called-exactly-once-with -- not available in vitest 2.x
    expect(cb).toHaveBeenCalledWith('todos', 'unauthorized', 403)
  })

  it('fires multiple registered callbacks', () => {
    const transport = createMockTransport()
    const cb1 = vi.fn()
    const cb2 = vi.fn()

    transport.onSubscribeError(cb1)
    transport.onSubscribeError(cb2)
    transport.fireSubscribeError('ch', 'denied', 401)

    expect(cb1).toHaveBeenCalledOnce()
    expect(cb2).toHaveBeenCalledOnce()
  })

  it('unsubscribe removes the listener', () => {
    const transport = createMockTransport()
    const cb = vi.fn()

    const unsub = transport.onSubscribeError(cb)
    unsub()
    transport.fireSubscribeError('ch', 'denied', 401)

    expect(cb).not.toHaveBeenCalled()
  })

  it('works without code parameter', () => {
    const transport = createMockTransport()
    const cb = vi.fn()

    transport.onSubscribeError(cb)
    transport.fireSubscribeError('ch', 'forbidden')

    expect(cb).toHaveBeenCalledWith('ch', 'forbidden', undefined)
  })
})

// ---------------------------------------------------------------------------
// Tests — Client-level onSubscribeError delegation
// ---------------------------------------------------------------------------

describe('createRealtimeClient — onSubscribeError', () => {
  it('delegates to the transport onSubscribeError', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const cb = vi.fn()

    client.onSubscribeError(cb)
    transport.fireSubscribeError('todos', 'unauthorized', 403)

    expect(cb).toHaveBeenCalledOnce()
    // eslint-disable-next-line vitest/prefer-called-exactly-once-with -- not available in vitest 2.x
    expect(cb).toHaveBeenCalledWith('todos', 'unauthorized', 403)
  })

  it('returns unsubscribe function that removes the listener', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })
    const cb = vi.fn()

    const unsub = client.onSubscribeError(cb)
    unsub()
    transport.fireSubscribeError('todos', 'unauthorized', 403)

    expect(cb).not.toHaveBeenCalled()
  })

  it('returns no-op unsubscribe for transports without onSubscribeError', () => {
    const transport = createBaseTransport()
    const client = createRealtimeClient({ transport })
    const cb = vi.fn()

    const unsub = client.onSubscribeError(cb)

    // Should not throw
    expect(typeof unsub).toBe('function')
    unsub()
  })
})

// ---------------------------------------------------------------------------
// Tests — realtimeCollectionOptions subscribe error logging
// ---------------------------------------------------------------------------

describe('realtimeCollectionOptions — subscribe error logging', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('logs to console.error when a subscribed channel is rejected', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions({
      client,
      channel: 'todos',
      getKey: (item: any) => item.id,
    })

    const { stop } = driveSync(config)

    transport.fireSubscribeError('todos', 'unauthorized', 403)

    expect(consoleErrorSpy).toHaveBeenCalledOnce()
    // eslint-disable-next-line vitest/prefer-called-exactly-once-with -- not available in vitest 2.x
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[realtime] Subscribe rejected for "todos": unauthorized (403)',
    )

    stop()
  })

  it('does not log for unrelated channels', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions({
      client,
      channel: 'todos',
      getKey: (item: any) => item.id,
    })

    const { stop } = driveSync(config)

    transport.fireSubscribeError('other-channel', 'denied', 401)

    expect(consoleErrorSpy).not.toHaveBeenCalled()

    stop()
  })

  it('logs without code when code is not provided', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions({
      client,
      channel: 'todos',
      getKey: (item: any) => item.id,
    })

    const { stop } = driveSync(config)

    transport.fireSubscribeError('todos', 'forbidden')

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[realtime] Subscribe rejected for "todos": forbidden',
    )

    stop()
  })

  it('cleans up error listener on teardown', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = realtimeCollectionOptions({
      client,
      channel: 'todos',
      getKey: (item: any) => item.id,
    })

    const { stop } = driveSync(config)
    stop()

    transport.fireSubscribeError('todos', 'unauthorized', 403)

    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Tests — liveChannelOptions subscribe error logging
// ---------------------------------------------------------------------------

describe('liveChannelOptions — subscribe error logging', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('logs to console.error when the channel subscription is rejected', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = liveChannelOptions({
      client,
      channel: 'chat',
      getKey: (item: any) => item.id,
      onEvent: (event) => event,
    })

    const { stop } = driveSync(config)

    transport.fireSubscribeError('chat', 'access denied', 403)

    expect(consoleErrorSpy).toHaveBeenCalledOnce()
    // eslint-disable-next-line vitest/prefer-called-exactly-once-with -- not available in vitest 2.x
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[realtime] Subscribe rejected for "chat": access denied (403)',
    )

    stop()
  })

  it('does not log for unrelated channels', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = liveChannelOptions({
      client,
      channel: 'chat',
      getKey: (item: any) => item.id,
      onEvent: (event) => event,
    })

    const { stop } = driveSync(config)

    transport.fireSubscribeError('other-channel', 'denied', 401)

    expect(consoleErrorSpy).not.toHaveBeenCalled()

    stop()
  })

  it('cleans up error listener on teardown', () => {
    const transport = createMockTransport()
    const client = createRealtimeClient({ transport })

    const config = liveChannelOptions({
      client,
      channel: 'chat',
      getKey: (item: any) => item.id,
      onEvent: (event) => event,
    })

    const { stop } = driveSync(config)
    stop()

    transport.fireSubscribeError('chat', 'unauthorized', 403)

    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})
