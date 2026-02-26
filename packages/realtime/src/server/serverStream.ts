/**
 * Server-side stream abstraction for pushing events to a channel.
 *
 * Designed for TanStack Start server functions: the stream handle is created
 * within a server function, pushes events via a `PublishFn`, and cleans up
 * when the function returns. No persistent server process is assumed.
 *
 * @example
 * // In a TanStack Start server function
 * import { createServerStream } from '@tanstack/realtime'
 *
 * export const generateAI = createServerFn()(async ({ sessionId }) => {
 *   const stream = createServerStream({
 *     publish: realtimePublish,
 *     channel: ['ai', { sessionId }],
 *   })
 *
 *   for await (const chunk of llmResponse) {
 *     stream.push({ type: 'token', content: chunk })
 *   }
 *   stream.done()
 * })
 */

import { serializeKey } from '../core/serializeKey.js'
import type { QueryKey } from '../core/types.js'
import type { PublishFn } from './index.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A server-side stream handle for pushing events to a channel.
 */
export interface ServerStream<TEvent = unknown> {
  /** Push an event to all subscribers of the stream's channel. */
  push: (event: TEvent) => Promise<void>
  /** Signal completion. Pushes a `{ type: '__stream:done' }` sentinel. */
  done: () => Promise<void>
  /** Signal error. Pushes a `{ type: '__stream:error', message }` sentinel. */
  error: (message: string) => Promise<void>
  /** The serialized channel string this stream publishes to. */
  readonly channel: string
}

export interface CreateServerStreamOptions {
  /**
   * The publish function from your transport/preset.
   * In a TanStack Start context, this typically wraps `nodeServer.publish()`
   * or calls an external pub/sub service.
   */
  publish: PublishFn

  /**
   * Channel key for the stream. Accepts QueryKey or string.
   */
  channel: QueryKey | string

  /**
   * Optional HMAC signing key. When provided, each pushed event includes
   * a `_signature` field computed as HMAC-SHA256 of the JSON-stringified
   * event. Clients can verify to ensure the message came from the server.
   *
   * Uses the Web Crypto API (`crypto.subtle`) where available.
   */
  signingKey?: string
}

// ---------------------------------------------------------------------------
// Signature helpers
// ---------------------------------------------------------------------------

let signingKeyCache: Map<string, CryptoKey> | undefined

async function getSigningKey(key: string): Promise<CryptoKey> {
  if (!signingKeyCache) signingKeyCache = new Map()
  let cryptoKey = signingKeyCache.get(key)
  if (!cryptoKey) {
    const enc = new TextEncoder()
    cryptoKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    signingKeyCache.set(key, cryptoKey)
  }
  return cryptoKey
}

async function signEvent(
  event: unknown,
  signingKey: string,
): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await getSigningKey(signingKey)
  const data = enc.encode(JSON.stringify(event))
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, data)
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ---------------------------------------------------------------------------
// Client-side signature verification
// ---------------------------------------------------------------------------

/**
 * Verify an HMAC-SHA256 signature on a received event.
 *
 * Use this in a `streamChannelOptions.reduce` or as a pre-filter to ensure
 * events genuinely came from the server.
 *
 * @example
 * const isValid = await verifyEventSignature(event, event._signature, VERIFY_KEY)
 * if (!isValid) return currentState // skip untrusted event
 */
export async function verifyEventSignature(
  event: unknown,
  signature: string | undefined,
  verifyKey: string,
): Promise<boolean> {
  if (!signature) return false
  const expected = await signEvent(event, verifyKey)
  return expected === signature
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a server-side stream for pushing events to a channel.
 *
 * This is compatible with TanStack Start server functions — it does not
 * require a persistent server process. The stream pushes events via the
 * provided `publish` function and signals completion via sentinel events.
 *
 * Clients consume these streams using `streamChannelOptions` with
 * `isDone` and `isError` configured to detect the sentinel events.
 *
 * @example
 * const stream = createServerStream({
 *   publish: (ch, data) => nodeServer.publish(serializeKey(ch), data),
 *   channel: ['ai', { sessionId }],
 * })
 *
 * for await (const chunk of llmResponse) {
 *   await stream.push({ type: 'token', content: chunk.text })
 * }
 * await stream.done()
 */
export function createServerStream<TEvent = unknown>(
  options: CreateServerStreamOptions,
): ServerStream<TEvent> {
  const { publish, signingKey } = options
  const channel =
    typeof options.channel === 'string'
      ? options.channel
      : serializeKey(options.channel)

  async function publishEvent(event: unknown): Promise<void> {
    if (signingKey) {
      const payload = event as Record<string, unknown>
      // Strip _signature from the event before signing to avoid circular deps
      const { _signature: _, ...eventWithoutSig } = payload
      const signature = await signEvent(eventWithoutSig, signingKey)
      await publish(channel, { ...eventWithoutSig, _signature: signature })
    } else {
      await publish(channel, event)
    }
  }

  return {
    channel,

    async push(event: TEvent): Promise<void> {
      await publishEvent(event)
    },

    async done(): Promise<void> {
      await publishEvent({ type: '__stream:done' })
    },

    async error(message: string): Promise<void> {
      await publishEvent({ type: '__stream:error', message })
    },
  }
}
