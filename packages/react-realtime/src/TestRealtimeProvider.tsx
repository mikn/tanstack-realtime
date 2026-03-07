import {
  createMockPresenceTransport,
  createMockTransport,
  createRealtimeClient,
} from '@tanstack/realtime'
import { RealtimeProvider } from './RealtimeProvider.js'
import type {
  MockPresenceTransport,
  MockTransport,
  RealtimeClient,
} from '@tanstack/realtime'
import type { ReactNode } from 'react'

export interface TestRealtimeProviderProps {
  children: ReactNode
  /** Pre-built mock transport. One is created automatically if omitted. */
  transport?: MockTransport | MockPresenceTransport
  /** Pre-built realtime client. One is created automatically if omitted. */
  client?: RealtimeClient
}

export interface TestRealtimeProviderResult {
  /** React wrapper component for `renderHook` / `render`. */
  wrapper: (props: { children: ReactNode }) => ReactNode
  /** The mock transport — call `simulateMessage`, inspect `publishLog`, etc. */
  transport: MockTransport
  /** The realtime client wired to the mock transport. */
  client: RealtimeClient
}

export interface TestRealtimeProviderWithPresenceResult {
  /** React wrapper component for `renderHook` / `render`. */
  wrapper: (props: { children: ReactNode }) => ReactNode
  /** The mock presence transport — includes `simulatePresenceJoin`, `simulatePresenceLeave`, etc. */
  transport: MockPresenceTransport
  /** The realtime client wired to the mock presence transport. */
  client: RealtimeClient
}

/**
 * Create a test wrapper that provides a `RealtimeClient` backed by a
 * `MockTransport`. Use with `renderHook` or `render` from Testing Library.
 *
 * The client starts in `'connected'` state and does NOT auto-connect on mount
 * (`autoConnect={false}`), so tests control connection lifecycle explicitly
 * via `transport.simulateDisconnect()` / `transport.simulateReconnect()`.
 *
 * @example
 * import { createTestRealtimeProvider } from '@tanstack/react-realtime'
 * import { renderHook } from '@testing-library/react'
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
 * await act(() => result.current({ _crdt: 'pn', inc: {}, dec: {} }))
 * expect(transport.publishLog).toContainEqual(
 *   expect.objectContaining({ channel: 'votes' })
 * )
 *
 * @example
 * // Test subscribe errors
 * const { wrapper, transport } = createTestRealtimeProvider()
 * const { result } = renderHook(() => useSubscribe('private-channel', () => {}), { wrapper })
 * act(() => transport.simulateSubscribeError('private-channel', 'unauthorized', 4403))
 * expect(result.current.subscribeError).toEqual({
 *   channel: 'private-channel',
 *   reason: 'unauthorized',
 *   code: 4403,
 * })
 */
export function createTestRealtimeProvider(
  props: Omit<TestRealtimeProviderProps, 'children'> = {},
): TestRealtimeProviderResult {
  const transport = props.transport ?? createMockTransport()
  const client = props.client ?? createRealtimeClient({ transport })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <RealtimeProvider client={client} autoConnect={false}>
      {children}
    </RealtimeProvider>
  )

  return { wrapper, transport, client }
}

/**
 * Create a test wrapper backed by a `MockPresenceTransport`.
 *
 * Use this variant when testing presence-related hooks (`usePresence`).
 * The transport exposes `simulatePresenceJoin`, `simulatePresenceLeave`,
 * and `getPresenceState` in addition to all standard `MockTransport` methods.
 *
 * @example
 * import { createTestRealtimeProviderWithPresence } from '@tanstack/react-realtime'
 * import { renderHook, act } from '@testing-library/react'
 *
 * const { wrapper, transport } = createTestRealtimeProviderWithPresence()
 *
 * const { result } = renderHook(
 *   () => usePresence(roomPresence, { params: { roomId: 'r1' }, initial: { name: 'Alice' } }),
 *   { wrapper }
 * )
 *
 * act(() => {
 *   transport.simulatePresenceJoin('room:roomId=r1', { connectionId: 'peer-1', data: { name: 'Bob' } })
 * })
 *
 * expect(result.current.others).toHaveLength(1)
 * expect(result.current.others[0].data.name).toBe('Bob')
 * expect(result.current.self.name).toBe('Alice')
 */
export function createTestRealtimeProviderWithPresence(
  props: Omit<TestRealtimeProviderProps, 'children' | 'transport'> & {
    transport?: MockPresenceTransport
  } = {},
): TestRealtimeProviderWithPresenceResult {
  const transport = props.transport ?? createMockPresenceTransport()
  const client = props.client ?? createRealtimeClient({ transport })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <RealtimeProvider client={client} autoConnect={false}>
      {children}
    </RealtimeProvider>
  )

  return { wrapper, transport, client }
}
