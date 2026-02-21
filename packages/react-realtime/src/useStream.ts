import { use, useEffect, useRef, useState } from 'react'
import type { StreamChannelDef, StreamStatus } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'

export interface UseStreamOptions<
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Params forwarded to `channelDef.resolveChannel` to derive the channel string. */
  params: TParams
}

export interface UseStreamResult<TState> {
  /** Accumulated stream state, updated on every event via the channel's `reduce`. */
  state: TState
  /** Lifecycle status of the stream. */
  status: StreamStatus
  /** Error message when `status === 'error'`, otherwise undefined. */
  error?: string
}

/**
 * Subscribes to a streaming channel and accumulates events into reactive state.
 *
 * On mount the hook subscribes to the resolved channel and starts folding
 * incoming events into `state` via the channel definition's `reduce` function.
 * When `isDone` returns true the subscription is automatically closed and
 * `status` becomes `'done'`. If `isError` returns a string the subscription
 * is closed and `status` becomes `'error'`.
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
 * })
 *
 * function AiResponse({ messageId }: { messageId: string }) {
 *   const { state, status } = useStream(aiStream, { params: { messageId } })
 *   if (status === 'pending') return <p>Waiting…</p>
 *   return <p>{state.content}</p>
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
  const client = use(RealtimeContext)
  if (!client) {
    throw new Error(
      '[realtime] useStream must be used inside <RealtimeProvider>.',
    )
  }

  const { params } = options
  const channel = channelDef.resolveChannel(params)

  const [result, setResult] = useState<UseStreamResult<TState>>({
    state: channelDef.initial,
    status: 'pending',
  })

  // Keep a stable ref so the event handler always uses the latest def without
  // the effect re-running when the channelDef object reference changes.
  const defRef = useRef(channelDef)
  defRef.current = channelDef

  useEffect(() => {
    let stopped = false
    let currentState = defRef.current.initial

    setResult({ state: currentState, status: 'pending' })

    // Initialise to a no-op so the handler can safely call unsub() even if an
    // event fires synchronously before client.subscribe() has returned.
    let unsub: () => void = () => {}

    const handler = (rawEvent: unknown): void => {
      if (stopped) return
      const def = defRef.current
      const event = rawEvent as TEvent

      const errorMsg = def.isError?.(currentState, event)
      if (errorMsg) {
        stopped = true
        setResult({ state: currentState, status: 'error', error: errorMsg })
        unsub()
        return
      }

      const nextState = def.reduce(currentState, event)
      const done = def.isDone?.(nextState, event) ?? false
      currentState = nextState

      setResult({ state: currentState, status: done ? 'done' : 'streaming' })

      if (done) {
        stopped = true
        unsub()
      }
    }

    unsub = client.subscribe(channel, handler)

    return () => {
      stopped = true
      unsub()
    }
  }, [client, channel])

  return result
}
