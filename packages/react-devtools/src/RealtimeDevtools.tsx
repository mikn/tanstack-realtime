/**
 * RealtimeDevtools — the main entrypoint component.
 *
 * Drop this anywhere inside a `<RealtimeProvider>` tree. It renders a
 * floating toggle button that opens the devtools panel.
 *
 * In production builds (`process.env.NODE_ENV === 'production'`), this
 * component renders nothing unless `force` is set to `true`.
 *
 * @example
 * import { RealtimeDevtools } from '@realtimejs/react-devtools'
 *
 * function App() {
 *   return (
 *     <RealtimeProvider client={client}>
 *       <MyApp />
 *       <RealtimeDevtools />
 *     </RealtimeProvider>
 *   )
 * }
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRealtime } from '@realtimejs/react'
import { createDevtoolsStore } from './devtoolsStore.js'
import { DevtoolsPanel } from './DevtoolsPanel.js'
import { styles } from './styles.js'
import type {
  DevtoolsStoreHandle,
  DevtoolsStoreOptions,
} from './devtoolsStore.js'
import type { CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DevtoolsPosition =
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left'
  | 'top-right'

export interface RealtimeDevtoolsProps {
  /**
   * Initial open state.
   * @default false
   */
  initialIsOpen?: boolean

  /**
   * Position of the floating toggle button.
   * @default 'bottom-left'
   */
  position?: DevtoolsPosition

  /**
   * Force rendering in production builds.
   * @default false
   */
  force?: boolean

  /**
   * Custom inline styles for the toggle button.
   */
  toggleButtonStyle?: CSSProperties

  /**
   * Custom inline styles for the panel container.
   */
  panelStyle?: CSSProperties

  /**
   * Optional offline queue handle to display queue state in the panel.
   * Pass the result of `useOfflineQueue()` here.
   */
  offlineQueue?: DevtoolsStoreOptions['offlineQueue']

  /**
   * Automatically track presence on channels when the transport supports it.
   * @default true
   */
  trackPresence?: boolean
}

// ---------------------------------------------------------------------------
// Position helpers
// ---------------------------------------------------------------------------

function getTogglePosition(position: DevtoolsPosition): CSSProperties {
  switch (position) {
    case 'bottom-left':
      return { bottom: '12px', left: '12px' }
    case 'bottom-right':
      return { bottom: '12px', right: '12px' }
    case 'top-left':
      return { top: '12px', left: '12px' }
    case 'top-right':
      return { top: '12px', right: '12px' }
  }
}

// ---------------------------------------------------------------------------
// TanStack logo SVG (compact inline)
// ---------------------------------------------------------------------------

function TanStackLogo() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 633 633"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M316.5 570.5C456.75 570.5 570.5 456.75 570.5 316.5C570.5 176.25 456.75 62.5 316.5 62.5C176.25 62.5 62.5 176.25 62.5 316.5C62.5 456.75 176.25 570.5 316.5 570.5Z"
        stroke="currentColor"
        strokeWidth="40"
      />
      <path
        d="M316.5 443.5C386.45 443.5 443.5 386.45 443.5 316.5C443.5 246.55 386.45 189.5 316.5 189.5C246.55 189.5 189.5 246.55 189.5 316.5C189.5 386.45 246.55 443.5 316.5 443.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RealtimeDevtools({
  initialIsOpen = false,
  position = 'bottom-left',
  force = false,
  toggleButtonStyle,
  panelStyle,
  offlineQueue,
  trackPresence,
}: RealtimeDevtoolsProps) {
  // In production, render nothing unless forced.
  if (process.env.NODE_ENV === 'production' && !force) {
    return null
  }

  return (
    <RealtimeDevtoolsInner
      initialIsOpen={initialIsOpen}
      position={position}
      toggleButtonStyle={toggleButtonStyle}
      panelStyle={panelStyle}
      offlineQueue={offlineQueue}
      trackPresence={trackPresence}
    />
  )
}

function RealtimeDevtoolsInner({
  initialIsOpen,
  position,
  toggleButtonStyle,
  panelStyle,
  offlineQueue,
  trackPresence,
}: Omit<RealtimeDevtoolsProps, 'force'>) {
  const [isOpen, setIsOpen] = useState(initialIsOpen ?? false)
  const { client } = useRealtime()
  const storeRef = useRef<DevtoolsStoreHandle | null>(null)

  // Create devtools store once per client.
  if (storeRef.current === null) {
    storeRef.current = createDevtoolsStore(client, {
      offlineQueue,
      trackPresence,
    })
  }

  // Recreate if client changes.
  useEffect(() => {
    const handle = createDevtoolsStore(client, {
      offlineQueue,
      trackPresence,
    })
    storeRef.current = handle
    return () => handle.destroy()
  }, [client, offlineQueue, trackPresence])

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  const togglePos = getTogglePosition(position ?? 'bottom-left')

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        aria-label={
          isOpen
            ? 'Close TanStack Realtime Devtools'
            : 'Open TanStack Realtime Devtools'
        }
        data-testid="realtime-devtools-toggle"
        onClick={handleToggle}
        style={{
          ...styles.toggleButton,
          ...togglePos,
          ...toggleButtonStyle,
        }}
      >
        <TanStackLogo />
      </button>

      {/* Panel */}
      {isOpen && (
        <div style={panelStyle}>
          <DevtoolsPanel
            devtoolsStore={storeRef.current}
            onClose={handleClose}
          />
        </div>
      )}
    </>
  )
}
