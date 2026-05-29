import { createEffect, createSignal, onCleanup } from 'solid-js'
import {
  createStreamProcessor,
  withEnvelopeStripping,
  withHeartbeatFilter,
} from '@realtimejs/core'
import { useRealtimeClient } from './context.js'
import type { Accessor } from 'solid-js'
import type { StreamChannelDef, StreamStatus } from '@realtimejs/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseStreamOptions<
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Params forwarded to `channelDef.resolveChannel` to derive the channel string. */
  params: TParams
  /**
   * Override the channel definition's `staleAfter` for this primitive instance.
   * See `StreamChannelConfig.staleAfter` for details.
   */
  staleAfter?: number
}

export interface UseStreamResult<TState> {
  /** Reactive accessor for accumulated stream state, updated on every event via the channel's `reduce`. */
  state: Accessor<TState>
  /** Reactive accessor for the lifecycle status of the stream. */
  status: Accessor<StreamStatus>
  /** Reactive accessor for the error message when `status === 'error'`, otherwise undefined. */
  error: Accessor<string | undefined>
}

/**
 * Subscribes to a streaming channel and accumulates events into reactive state.
 *
 * On mount the primitive subscribes to the resolved channel and starts folding
 * incoming events into `state` via the channel definition's `reduce` function.
 * When `isDone` returns true the subscription is automatically closed and
 * `status` becomes `'done'`. If `isError` returns a string the subscription
 * is closed and `status` becomes `'error'`.
 *
 * Framework metadata (`_seq`, `_ts`, `_signature`) is stripped before events
 * reach `reduce`, `isDone`, or `isError`. Heartbeat events are consumed
 * internally (they reset the stale timer) and never reach user callbacks.
 *
 * When the channel changes (because `params` changes) the previous subscription
 * is torn down and a fresh one is started with the initial state.
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
 *   isDone:  (_, e) => e.type === 'done',
 *   isError: (_, e) => e.type === 'error' ? e.message : false,
 *   staleAfter: 15_000,
 * })
 *
 * function AiResponse(props) {
 *   const { state, status } = useStream(aiStream, { params: { messageId: props.messageId } })
 *   return (
 *     <Switch>
 *       <Match when={status() === 'pending'}>Waiting…</Match>
 *       <Match when={status() === 'stale'}>Stream may have disconnected…</Match>
 *       <Match when={true}>{state().content}</Match>
 *     </Switch>
 *   )
 * }
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

  const [state, setState] = createSignal<TState>(channelDef.initial)
  const [status, setStatus] = createSignal<StreamStatus>('pending')
  const [error, setError] = createSignal<string | undefined>(undefined)

  // Keep a stable ref to the latest channelDef so the event handler always
  // uses the latest def without the effect re-running when the object reference
  // changes.
  let latestDef = channelDef
  let latestStaleAfter = staleAfterOverride

  createEffect(() => {
    latestDef = channelDef
    latestStaleAfter = staleAfterOverride

    setState(() => latestDef.initial)
    setStatus('pending' as StreamStatus)
    setError(undefined)

    // Initialise to a no-op so the handler can safely call unsub() even if an
    // event fires synchronously before client.subscribe() has returned.
    let unsub: () => void = () => {}

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
      const threshold = latestStaleAfter ?? latestDef.staleAfter
      if (!threshold || staleStopped) return
      staleTimer = setTimeout(() => {
        if (staleStopped) return
        setStatus('stale' as StreamStatus)
      }, threshold)
    }

    // ----- Stream processor (shared immutable state machine) -----
    const processor = createStreamProcessor<TState, TEvent>(
      {
        reduce: (s: TState, event: TEvent) => latestDef.reduce(s, event),
        isDone: (s: TState, event: TEvent) =>
          latestDef.isDone?.(s, event) ?? false,
        isError: (s: TState, event: TEvent) =>
          latestDef.isError?.(s, event) ?? null,
      },
      latestDef.initial,
      (snapshot, stopped) => {
        setState(() => snapshot.state)
        setStatus(snapshot.status)
        setError(snapshot.error ?? undefined)

        if (stopped) {
          staleStopped = true
          clearStaleTimer()
          unsub()
        }
      },
    )

    // ----- Compose handler pipeline -----
    const handler = withEnvelopeStripping(
      withHeartbeatFilter(
        (userEvent) => {
          resetStaleTimer()
          processor.process(userEvent)
        },
        {
          onHeartbeat: resetStaleTimer,
        },
      ),
    )

    unsub = client.subscribe(channel, handler)

    onCleanup(() => {
      staleStopped = true
      clearStaleTimer()
      unsub()
    })
  })

  return { state, status, error }
}
