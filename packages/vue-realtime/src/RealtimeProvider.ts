import { defineComponent, onMounted, onUnmounted, provide, watch } from 'vue'
import { subscribeToRealtimeBatch } from '@tanstack/realtime'
import { REALTIME_CONTEXT_KEY } from './context.js'
import { useStoreRef } from './useStoreRef.js'
import type { PropType } from 'vue'
import type { RealtimeClient } from '@tanstack/realtime'

export interface RealtimeProviderProps {
  /** The realtime client created with `createRealtimeClient`. */
  client: RealtimeClient
  /**
   * Automatically call `client.connect()` on mount.
   *
   * When `true` (the default), the provider connects on mount and
   * disconnects + destroys on unmount. Set to `false` to manage
   * the connection lifecycle yourself.
   *
   * @default true
   */
  autoConnect?: boolean
}

/**
 * Provides a `RealtimeClient` to the component tree via Vue's `provide`/`inject`.
 * All composables from `@tanstack/vue-realtime` (`useRealtime`, `usePresence`,
 * `useSubscribe`, `usePublish`, `useStream`) must be descendants of this provider.
 *
 * **Lifecycle**: by default (`autoConnect={true}`), the provider calls
 * `client.connect()` on mount and `client.destroy()` on unmount.
 * Set `autoConnect={false}` to manage the connection yourself.
 *
 * @example
 * const realtimeClient = createRealtimeClient({ transport: sseTransport({ url: '/api/realtime/sse' }) })
 *
 * // In your root component:
 * <RealtimeProvider :client="realtimeClient">
 *   <App />
 * </RealtimeProvider>
 */
export const RealtimeProvider = defineComponent({
  name: 'RealtimeProvider',

  props: {
    client: {
      type: Object as PropType<RealtimeClient>,
      required: true,
    },
    autoConnect: {
      type: Boolean,
      default: true,
    },
  },

  setup(props, { slots }) {
    provide(REALTIME_CONTEXT_KEY, props.client)

    onMounted(() => {
      if (props.autoConnect) {
        void props.client.connect()
      }
    })

    // Subscribe to the batch channel for consistent cross-query snapshots.
    let unsubBatch: (() => void) | null = null
    onMounted(() => {
      unsubBatch = subscribeToRealtimeBatch(props.client)
    })

    onUnmounted(() => {
      unsubBatch?.()
      props.client.destroy()
    })

    // Dev-mode warning: if the client remains disconnected for more than 2 seconds
    // after mount and autoConnect is false, surface a helpful message.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const status = useStoreRef(props.client.store, (s) => s.status)
      let timer: ReturnType<typeof setTimeout> | null = null

      watch(
        () => ({ status: status.value, autoConnect: props.autoConnect }),
        ({ status: s, autoConnect }) => {
          if (timer) {
            clearTimeout(timer)
            timer = null
          }
          if (autoConnect) return
          if (s !== 'disconnected') return

          timer = setTimeout(() => {
            console.warn(
              '[realtime] RealtimeProvider: the client has been disconnected for > 2 seconds ' +
                'and autoConnect is false. Call client.connect() or useRealtime().connect() ' +
                'to establish the connection, or set autoConnect={true} on <RealtimeProvider>.',
            )
          }, 2000)
        },
        { immediate: true },
      )

      onUnmounted(() => {
        if (timer) clearTimeout(timer)
      })
    }

    return () => slots.default?.()
  },
})
