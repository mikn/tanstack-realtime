import {
  createMockPresenceTransport,
  createMockTransport,
  createRealtimeClient,
} from '@realtimejs/core'
import { RealtimeProvider } from './RealtimeProvider.js'
import type { ParentComponent } from 'solid-js'
import type {
  MockPresenceTransport,
  MockTransport,
  RealtimeClient,
} from '@realtimejs/core'

export interface TestRealtimeProviderProps {
  /** Pre-built mock transport. One is created automatically if omitted. */
  transport?: MockTransport | MockPresenceTransport
  /** Pre-built realtime client. One is created automatically if omitted. */
  client?: RealtimeClient
}

export interface TestRealtimeProviderResult {
  /** Solid wrapper component for use with `@solidjs/testing-library`. */
  wrapper: ParentComponent
  /** The mock transport — call `simulateMessage`, inspect `publishLog`, etc. */
  transport: MockTransport
  /** The realtime client wired to the mock transport. */
  client: RealtimeClient
}

export interface TestRealtimeProviderWithPresenceResult {
  /** Solid wrapper component for use with `@solidjs/testing-library`. */
  wrapper: ParentComponent
  /** The mock presence transport — includes `simulatePresenceJoin`, `simulatePresenceLeave`, etc. */
  transport: MockPresenceTransport
  /** The realtime client wired to the mock presence transport. */
  client: RealtimeClient
}

/**
 * Create a test wrapper that provides a `RealtimeClient` backed by a
 * `MockTransport`. Use with `render` from `@solidjs/testing-library`.
 *
 * The client starts in `'connected'` state and does NOT auto-connect on mount
 * (`autoConnect={false}`), so tests control connection lifecycle explicitly
 * via `transport.simulateDisconnect()` / `transport.simulateReconnect()`.
 *
 * @example
 * import { createTestRealtimeProvider } from '@realtimejs/solid'
 * import { renderHook } from '@solidjs/testing-library'
 *
 * const { wrapper, transport } = createTestRealtimeProvider()
 *
 * const { result } = renderHook(() => useSubscribe('my-channel', handler), { wrapper })
 *
 * transport.simulateMessage('my-channel', { hello: 'world' })
 * // → handler called with { hello: 'world' }
 *
 * @example
 * // Assert published messages
 * const { wrapper, transport } = createTestRealtimeProvider()
 * const { result } = renderHook(() => usePublish('votes'), { wrapper })
 * result()({ _crdt: 'pn', inc: {}, dec: {} })
 * expect(transport.publishLog).toContainEqual(
 *   expect.objectContaining({ channel: 'votes' })
 * )
 *
 * @example
 * // Test subscribe errors
 * const { wrapper, transport } = createTestRealtimeProvider()
 * const { result } = renderHook(
 *   () => useSubscribe('private-channel', () => {}),
 *   { wrapper }
 * )
 * transport.simulateSubscribeError('private-channel', 'unauthorized', 4403)
 * expect(result().subscribeError()).toEqual({
 *   channel: 'private-channel',
 *   reason: 'unauthorized',
 *   code: 4403,
 * })
 */
export function createTestRealtimeProvider(
  props: TestRealtimeProviderProps = {},
): TestRealtimeProviderResult {
  const transport = props.transport ?? createMockTransport()
  const client = props.client ?? createRealtimeClient({ transport })

  const wrapper: ParentComponent = (wrapperProps) => (
    <RealtimeProvider client={client} autoConnect={false}>
      {wrapperProps.children}
    </RealtimeProvider>
  )

  return { wrapper, transport, client }
}

/**
 * Create a test wrapper backed by a `MockPresenceTransport`.
 *
 * Use this variant when testing presence-related primitives (`usePresence`).
 * The transport exposes `simulatePresenceJoin`, `simulatePresenceLeave`,
 * and `getPresenceState` in addition to all standard `MockTransport` methods.
 *
 * @example
 * import { createTestRealtimeProviderWithPresence } from '@realtimejs/solid'
 * import { renderHook } from '@solidjs/testing-library'
 *
 * const { wrapper, transport } = createTestRealtimeProviderWithPresence()
 *
 * const { result } = renderHook(
 *   () => usePresence(roomPresence, { params: { roomId: 'r1' }, initial: { name: 'Alice' } }),
 *   { wrapper }
 * )
 *
 * transport.simulatePresenceJoin('room:roomId=r1', { connectionId: 'peer-1', data: { name: 'Bob' } })
 *
 * expect(result().others()).toHaveLength(1)
 * expect(result().others()[0].data.name).toBe('Bob')
 * expect(result().self().name).toBe('Alice')
 */
export function createTestRealtimeProviderWithPresence(
  props: Omit<TestRealtimeProviderProps, 'transport'> & {
    transport?: MockPresenceTransport
  } = {},
): TestRealtimeProviderWithPresenceResult {
  const transport = props.transport ?? createMockPresenceTransport()
  const client = props.client ?? createRealtimeClient({ transport })

  const wrapper: ParentComponent = (wrapperProps) => (
    <RealtimeProvider client={client} autoConnect={false}>
      {wrapperProps.children}
    </RealtimeProvider>
  )

  return { wrapper, transport, client }
}
