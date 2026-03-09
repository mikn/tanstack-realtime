import { onUnmounted, ref } from 'vue'
import {
  createStreamProcessor,
  withEnvelopeStripping,
  withHeartbeatFilter,
} from '@tanstack/realtime'
import { useRealtimeClient } from './context.js'
import type { Ref } from 'vue'
import type { StreamChannelDef, StreamStatus } from '@tanstack/realtime'

export interface UseStreamOptions<
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Params forwarded to `channelDef.resolveChannel` to derive the channel string. */
  params: TParams
  /**
   * Override the channel definition's `staleAfter` for this composable instance.
   */
  staleAfter?: number
}

export interface UseStreamResult<TState> {
  /** Accumulated stream state, updated on every event via the channel's `reduce`. */
  state: Ref<TState>
  /** Lifecycle status of the stream. */
  status: Ref<StreamStatus>
  /** Error message when `status === 'error'`, otherwise undefined. */
  error: Ref<string | undefined>
}

/**
 * Subscribes to a streaming channel and accumulates events into reactive state.
 *
 * On setup the composable subscribes to the resolved channel and starts folding
 * incoming events into `state` via the channel definition's `reduce` function.
 * When `isDone` returns true the subscription is automatically closed and
 * `status` becomes `'done'`. If `isError` returns a string the subscription
 * is closed and `status` becomes `'error'`.
 *
 * Framework metadata (`_seq`, `_ts`, `_signature`) is stripped before events
 * reach `reduce`, `isDone`, or `isError`. Heartbeat events are consumed
 * internally and never reach user callbacks.
 *
 * Must be used inside `<RealtimeProvider>`.
 *
 * @example
 * export const aiStream = createStreamChannel({
 *   id: 'ai-message',
 *   channel: (p: { messageId: string }) => ['ai', p],
 *   initial: { content: '' },
 *   reduce: (state, event: { type: string; content?: string }) =>
 *     event.type === 'token'
 *       ? { content: state.content + (event.content ?? '') }
 *       : state,
 *   isDone: (_, e) => e.type === 'done',
 *   staleAfter: 15_000,
 * })
 *
 * const { state, status } = useStream(aiStream, { params: { messageId } })
 */
export function useStream<
  TState,
  TEvent = unknown,
  TParams extends Record<string, unknown> = Record<string, unknown>,
>(
  channelDef: StreamChannelDef<TState, TEvent, TParams>,
  options: UseStreamOptions<TParams>,
): UseStreamResult<TState> {
  const client = useRealtimeClient('useStream')

  const { params, staleAfter: staleAfterOverride } = options
  const channel = channelDef.resolveChannel(params)

  const state = ref<TState>(channelDef.initial) as Ref<TState>
  const status = ref<StreamStatus>('pending')
  const error = ref<string | undefined>(undefined)

  // Keep the latest channel def so reduce/isDone/isError always see fresh closures.
  let latestDef = channelDef
  let staleAfterValue = staleAfterOverride

  // ----- Stale detection timer -----
  let staleTimer: ReturnType<typeof setTimeout> | null = null
  let staleStopped = false

  function clearStaleTimer(): void {
    if (staleTimer != null) {
      clearTimeout(staleTimer)
      staleTimer = null
    }
  }

  function resetStaleTimer(): void {
    clearStaleTimer()
    const threshold = staleAfterValue ?? latestDef.staleAfter
    if (!threshold || staleStopped) return
    staleTimer = setTimeout(() => {
      if (staleStopped) return
      status.value = 'stale'
    }, threshold)
  }

  // ----- Stream processor -----
  let unsub: () => void = () => {}

  const processor = createStreamProcessor<TState, TEvent>(
    {
      reduce: (s: TState, event: TEvent) => latestDef.reduce(s, event),
      isDone: (s: TState, event: TEvent) =>
        latestDef.isDone?.(s, event) ?? false,
      isError: (s: TState, event: TEvent) =>
        latestDef.isError?.(s, event) ?? null,
    },
    channelDef.initial,
    (snapshot, stopped) => {
      state.value = snapshot.state
      status.value = snapshot.status
      error.value = snapshot.error != null ? snapshot.error : undefined

      if (stopped) {
        staleStopped = true
        clearStaleTimer()
        unsub()
      }
    },
  )

  const handler = withEnvelopeStripping(
    withHeartbeatFilter(
      (userEvent) => {
        resetStaleTimer()
        processor.process(userEvent)
      },
      { onHeartbeat: resetStaleTimer },
    ),
  )

  unsub = client.subscribe(channel, handler)

  onUnmounted(() => {
    staleStopped = true
    clearStaleTimer()
    unsub()
  })

  // Suppress TS unused-var for mutation variables used via closure.
  void ((def: typeof channelDef, after: number | undefined) => {
    latestDef = def
    staleAfterValue = after
  })

  return { state, status, error }
}
