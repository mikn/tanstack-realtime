import { createMockTransport, createRealtimeClient } from '@tanstack/realtime'
import { RealtimeProvider } from './RealtimeProvider.js'
import type { MockTransport, RealtimeClient } from '@tanstack/realtime'
import type { ReactNode } from 'react'

export interface TestRealtimeProviderProps {
  children: ReactNode
  /** Pre-built mock transport. One is created automatically if omitted. */
  transport?: MockTransport
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

/**
 * Create a test wrapper that provides a `RealtimeClient` backed by a
 * `MockTransport`. Use with `renderHook` or `render` from Testing Library.
 *
 * @example
 * const { wrapper, transport } = createTestRealtimeProvider()
 * const { result } = renderHook(() => useRealtime(), { wrapper })
 * transport.simulateMessage('ch', { hello: 'world' })
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
