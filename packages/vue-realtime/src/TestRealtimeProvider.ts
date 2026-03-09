import { defineComponent, h, provide } from 'vue'
import {
  createMockPresenceTransport,
  createMockTransport,
  createRealtimeClient,
} from '@tanstack/realtime'
import { REALTIME_CONTEXT_KEY } from './context.js'
import type { Component } from 'vue'
import type {
  MockPresenceTransport,
  MockTransport,
  RealtimeClient,
} from '@tanstack/realtime'

export interface TestRealtimeProviderProps {
  /** Pre-built mock transport. One is created automatically if omitted. */
  transport?: MockTransport | MockPresenceTransport
  /** Pre-built realtime client. One is created automatically if omitted. */
  client?: RealtimeClient
}

export interface TestRealtimeProviderResult {
  /** Vue wrapper component for use with testing utilities. */
  wrapper: Component
  /** The mock transport — call `simulateMessage`, inspect `publishLog`, etc. */
  transport: MockTransport
  /** The realtime client wired to the mock transport. */
  client: RealtimeClient
}

export interface TestRealtimeProviderWithPresenceResult {
  /** Vue wrapper component for use with testing utilities. */
  wrapper: Component
  /** The mock presence transport — includes `simulatePresenceJoin`, `simulatePresenceLeave`, etc. */
  transport: MockPresenceTransport
  /** The realtime client wired to the mock presence transport. */
  client: RealtimeClient
}

/**
 * Create a test wrapper that provides a `RealtimeClient` backed by a
 * `MockTransport`. Use with `mount` from Vue Test Utils.
 *
 * The client starts in `'connected'` state and does NOT auto-connect on mount,
 * so tests control connection lifecycle explicitly via
 * `transport.simulateDisconnect()` / `transport.simulateReconnect()`.
 *
 * @example
 * import { createTestRealtimeProvider } from '@tanstack/vue-realtime'
 * import { mount } from '@vue/test-utils'
 *
 * const { wrapper, transport, client } = createTestRealtimeProvider()
 *
 * const MyComponent = defineComponent({
 *   setup() {
 *     const { subscribeError } = useSubscribe('my-channel', handler)
 *     return { subscribeError }
 *   }
 * })
 *
 * const mounted = mount(MyComponent, {
 *   global: { components: { wrapper } }
 * })
 *
 * transport.simulateMessage('my-channel', { hello: 'world' })
 * // → handler called with { hello: 'world' }
 *
 * @example
 * // Assert published messages
 * const { wrapper, transport } = createTestRealtimeProvider()
 * // ... use with your test setup
 * expect(transport.publishLog).toContainEqual(
 *   expect.objectContaining({ channel: 'votes' })
 * )
 */
export function createTestRealtimeProvider(
  props: TestRealtimeProviderProps = {},
): TestRealtimeProviderResult {
  const transport =
    (props.transport as MockTransport | undefined) ?? createMockTransport()
  const client = props.client ?? createRealtimeClient({ transport })

  const wrapper = defineComponent({
    name: 'TestRealtimeProvider',
    setup(_, { slots }) {
      provide(REALTIME_CONTEXT_KEY, client)
      return () => h('template', {}, slots.default?.())
    },
  })

  return { wrapper, transport, client }
}

/**
 * Create a test wrapper backed by a `MockPresenceTransport`.
 *
 * Use this variant when testing presence-related composables (`usePresence`).
 * The transport exposes `simulatePresenceJoin`, `simulatePresenceLeave`,
 * and `getPresenceState` in addition to all standard `MockTransport` methods.
 *
 * @example
 * const { wrapper, transport } = createTestRealtimeProviderWithPresence()
 *
 * transport.simulatePresenceJoin('room:roomId=r1', {
 *   connectionId: 'peer-1',
 *   data: { name: 'Bob' },
 * })
 */
export function createTestRealtimeProviderWithPresence(
  props: Omit<TestRealtimeProviderProps, 'transport'> & {
    transport?: MockPresenceTransport
  } = {},
): TestRealtimeProviderWithPresenceResult {
  const transport = props.transport ?? createMockPresenceTransport()
  const client = props.client ?? createRealtimeClient({ transport })

  const wrapper = defineComponent({
    name: 'TestRealtimeProvider',
    setup(_, { slots }) {
      provide(REALTIME_CONTEXT_KEY, client)
      return () => h('template', {}, slots.default?.())
    },
  })

  return { wrapper, transport, client }
}
