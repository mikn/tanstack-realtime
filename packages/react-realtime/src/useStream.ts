import { use, useEffect, useRef, useState } from 'react'
import { STREAM_HEARTBEAT } from '@tanstack/realtime'
import { RealtimeContext } from './context.js'
import type { StreamChannelDef, StreamStatus } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Framework metadata stripping — mirrors streamChannelOptions logic.
// ---------------------------------------------------------------------------

const FRAMEWORK_KEYS = new Set(['_seq', '_ts', '_signature'])

function stripEnvelope(raw: unknown): {
  userEvent: unknown
  seq: number | undefined
} {
  if (raw == null || typeof raw !== 'object')
    return { userEvent: raw, seq: undefined }
  const envelope = raw as Record<string, unknown>
  const seq = typeof envelope._seq === 'number' ? envelope._seq : undefined
  if (!('_seq' in envelope)) {
    return { userEvent: raw, seq }
  }
  const stripped: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(envelope)) {
    if (!FRAMEWORK_KEYS.has(k)) stripped[k] = v
  }
  return { userEvent: stripped, seq }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseStreamOptions<
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Params forwarded to `channelDef.resolveChannel` to derive the channel string. */
  params: TParams
  /**
   * Override the channel definition's `staleAfter` for this hook instance.
   * See `StreamChannelConfig.staleAfter` for details.
   */
  staleAfter?: number
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
 * function AiResponse({ messageId }: { messageId: string }) {
 *   const { state, status } = useStream(aiStream, { params: { messageId } })
 *   if (status === 'pending') return <p>Waiting…</p>
 *   if (status === 'stale') return <p>Stream may have disconnected…</p>
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

  const { params, staleAfter: staleAfterOverride } = options
  const channel = channelDef.resolveChannel(params)

  const [result, setResult] = useState<UseStreamResult<TState>>({
    state: channelDef.initial,
    status: 'pending',
  })

  // Keep a stable ref so the event handler always uses the latest def without
  // the effect re-running when the channelDef object reference changes.
  const defRef = useRef(channelDef)
  defRef.current = channelDef

  // Resolve staleAfter: option override > channel def > undefined.
  const staleAfterRef = useRef(staleAfterOverride)
  staleAfterRef.current = staleAfterOverride

  useEffect(() => {
    let stopped = false
    let currentState = defRef.current.initial

    setResult({ state: currentState, status: 'pending' })

    // Initialise to a no-op so the handler can safely call unsub() even if an
    // event fires synchronously before client.subscribe() has returned.
    let unsub: () => void = () => {}

    // ----- Stale detection timer -----
    let staleTimer: ReturnType<typeof setTimeout> | null = null

    function clearStaleTimer(): void {
      if (staleTimer != null) {
        clearTimeout(staleTimer)
        staleTimer = null
      }
    }

    function resetStaleTimer(): void {
      clearStaleTimer()
      const threshold = staleAfterRef.current ?? defRef.current.staleAfter
      if (!threshold || stopped) return
      staleTimer = setTimeout(() => {
        if (stopped) return
        setResult((prev) => ({ ...prev, status: 'stale' }))
      }, threshold)
    }

    // ----- Sequence dedup -----
    let lastSeenSeq = 0

    const handler = (rawEnvelope: unknown): void => {
      if (stopped) return
      const def = defRef.current

      // Strip framework metadata.
      const { userEvent, seq } = stripEnvelope(rawEnvelope)

      // Dedup: skip already-seen sequence numbers.
      if (seq != null) {
        if (seq <= lastSeenSeq) return
        lastSeenSeq = seq
      }

      // Every event (including heartbeats) resets the stale timer.
      resetStaleTimer()

      // Heartbeats are lifecycle-only — never reach user callbacks.
      const eventObj = userEvent as Record<string, unknown> | null
      if (eventObj && eventObj.type === STREAM_HEARTBEAT) return

      const event = userEvent as TEvent

      const errorMsg = def.isError?.(currentState, event)
      if (errorMsg) {
        stopped = true
        clearStaleTimer()
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
        clearStaleTimer()
        unsub()
      }
    }

    unsub = client.subscribe(channel, handler)

    return () => {
      stopped = true
      clearStaleTimer()
      unsub()
    }
  }, [client, channel])

  return result
}
