/**
 * RealtimeDevtools — the main entrypoint component for Vue.
 *
 * Drop this anywhere inside a `<RealtimeProvider>` tree. It renders a
 * floating toggle button that opens the devtools panel.
 *
 * In production builds (`process.env.NODE_ENV === 'production'`), this
 * component renders nothing unless `force` is set to `true`.
 *
 * @example
 * import { RealtimeDevtools } from '@tanstack/vue-realtime-devtools'
 *
 * // In your root component template:
 * <RealtimeProvider :client="client">
 *   <MyApp />
 *   <RealtimeDevtools />
 * </RealtimeProvider>
 */

import { defineComponent, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useRealtime } from '@tanstack/vue-realtime'
import { createDevtoolsStore } from './devtoolsStore.js'
import { DevtoolsPanel } from './DevtoolsPanel.js'
import { styles } from './styles.js'
import type { CSSProperties, PropType } from 'vue'
import type {
  DevtoolsStoreHandle,
  DevtoolsStoreOptions,
} from './devtoolsStore.js'

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
// TanStack logo SVG
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
        stroke-width="40"
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

/**
 * Floating devtools toggle + panel for TanStack Realtime.
 *
 * Renders nothing in production unless `force` is `true`.
 * Must be placed inside a `<RealtimeProvider>`.
 */
export const RealtimeDevtools = defineComponent({
  name: 'RealtimeDevtools',

  props: {
    initialIsOpen: { type: Boolean, default: false },
    position: {
      type: String as PropType<DevtoolsPosition>,
      default: 'bottom-left',
    },
    force: { type: Boolean, default: false },
    toggleButtonStyle: {
      type: Object as PropType<CSSProperties>,
      default: undefined,
    },
    panelStyle: {
      type: Object as PropType<CSSProperties>,
      default: undefined,
    },
    offlineQueue: {
      type: Object as PropType<DevtoolsStoreOptions['offlineQueue']>,
      default: undefined,
    },
    trackPresence: { type: Boolean, default: true },
  },

  setup(props) {
    // In production, render nothing unless forced.
    if (process.env.NODE_ENV === 'production' && !props.force) {
      return () => null
    }

    const isOpen = ref(props.initialIsOpen)
    const { client } = useRealtime()

    // Create the devtools store and recreate it if the client changes.
    // shallowRef avoids Vue deeply unwrapping the Store<DevtoolsState> internals.
    const storeHandle = shallowRef<DevtoolsStoreHandle>(
      createDevtoolsStore(client, {
        offlineQueue: props.offlineQueue,
        trackPresence: props.trackPresence,
      }),
    )

    // Watch for client identity changes (edge case: client prop swapped).
    watch(
      () => client,
      (newClient) => {
        storeHandle.value.destroy()
        storeHandle.value = createDevtoolsStore(newClient, {
          offlineQueue: props.offlineQueue,
          trackPresence: props.trackPresence,
        })
      },
    )

    onUnmounted(() => {
      storeHandle.value.destroy()
    })

    const togglePos = () => getTogglePosition(props.position)

    return () => (
      <>
        {/* Floating toggle button */}
        <button
          type="button"
          aria-label={
            isOpen.value
              ? 'Close TanStack Realtime Devtools'
              : 'Open TanStack Realtime Devtools'
          }
          data-testid="realtime-devtools-toggle"
          onClick={() => {
            isOpen.value = !isOpen.value
          }}
          style={{
            ...styles.toggleButton,
            ...togglePos(),
            ...props.toggleButtonStyle,
          }}
        >
          <TanStackLogo />
        </button>

        {/* Panel */}
        {isOpen.value && (
          <div style={props.panelStyle}>
            <DevtoolsPanel
              devtoolsStore={storeHandle.value}
              onClose={() => {
                isOpen.value = false
              }}
            />
          </div>
        )}
      </>
    )
  },
})
