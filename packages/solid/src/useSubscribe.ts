import { createEffect, createSignal, onCleanup } from 'solid-js'
import { serializeKey } from '@realtimejs/core'
import { useRealtimeClient } from './context.js'
import type { Accessor } from 'solid-js'
import type { QueryKey, SubscribeError } from '@realtimejs/core'

/**
 * Return value of {@link useSubscribe}.
 */
export interface UseSubscribeResult {
  /**
   * Reactive accessor for the most recent subscribe error for this channel,
   * or `null` if the subscription is healthy.  Resets to `null` when
   * `channel` changes.
   */
  subscribeError: Accessor<SubscribeError | null>
}

/**
 * Subscribes to raw channel events for the lifetime of the component.
 *
 * The `onMessage` callback is called directly — in Solid, component functions
 * run once so there is no stale-closure problem. The subscription is torn
 * down and re-established only when `channel` changes.
 *
 * Returns `{ subscribeError }` — a reactive accessor that is populated when
 * the server rejects the subscription (e.g. authorization denied).
 *
 * @example
 * const { subscribeError } = useSubscribe(['typing', { roomId }], (event) => {
 *   setTypingUsers(event as string[])
 * })
 *
 * return (
 *   <Show when={subscribeError()}>
 *     <div>Access denied: {subscribeError()!.reason}</div>
 *   </Show>
 * )
 */
export function useSubscribe(
  channel: QueryKey | string,
  onMessage: (data: unknown) => void,
): UseSubscribeResult {
  const client = useRealtimeClient('useSubscribe')

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const [subscribeError, setSubscribeError] =
    createSignal<SubscribeError | null>(null)

  // Keep the latest callback in a plain variable so the subscription is not
  // torn down and re-established if the caller passes a new function reference.
  // In Solid, component setup runs once so this is rarely an issue, but
  // we still guard for primitives used inside effects or reactive scopes.
  let latestOnMessage = onMessage
  latestOnMessage = onMessage

  createEffect(() => {
    // Reset error state when channel changes.
    setSubscribeError(null)

    const unsubMessage = client.subscribe(serializedChannel, (data) =>
      latestOnMessage(data),
    )

    const unsubError = client.onSubscribeError((ch, reason, code) => {
      if (ch === serializedChannel) {
        setSubscribeError({ channel: ch, reason, code })
      }
    })

    onCleanup(() => {
      unsubMessage()
      unsubError()
    })
  })

  return { subscribeError }
}
