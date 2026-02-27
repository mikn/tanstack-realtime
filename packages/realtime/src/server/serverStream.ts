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
// Sentinel constants — shared between server (createServerStream) and client
// (streamChannelOptions). Import these in isDone / isError callbacks so the
// sentinel strings are never duplicated.
// ---------------------------------------------------------------------------

/**
 * Sentinel `type` value pushed by `ServerStream.done()`.
 * Use in `streamChannelOptions({ isDone })` to detect stream completion:
 *
 * ```ts
 * isDone: (_state, event) => (event as any).type === STREAM_DONE
 * ```
 */
export const STREAM_DONE = '__stream:done' as const

/**
 * Sentinel `type` value pushed by `ServerStream.error()`.
 * Use in `streamChannelOptions({ isError })` to detect stream errors:
 *
 * ```ts
 * isError: (_state, event) => {
 *   const e = event as any
 *   return e.type === STREAM_ERROR ? (e.message ?? 'Stream error') : false
 * }
 * ```
 */
export const STREAM_ERROR = '__stream:error' as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A server-side stream handle for pushing events to a channel.
 */
export interface ServerStream<TEvent = unknown> {
  /** Push an event to all subscribers of the stream's channel. */
  push: (event: TEvent) => Promise<void>
  /** Signal completion. Pushes a `{ type: STREAM_DONE }` sentinel. */
  done: () => Promise<void>
  /** Signal error. Pushes a `{ type: STREAM_ERROR, message }` sentinel. */
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
   * Optional HMAC-SHA256 key for signing events.
   *
   * **HMAC is symmetric** — the same key is used for signing (server) and
   * verification (consumer). Only share this key with trusted server-side
   * code. Never ship it to the browser unless the verification is purely
   * server-to-server.
   *
   * When provided, each pushed event includes a `_signature` field.
   * Verify with `verifyEventSignature(event, signature, key)`.
   *
   * Uses the Web Crypto API (`crypto.subtle`).
   */
  hmacKey?: string
}

// ---------------------------------------------------------------------------
// Signature helpers
// ---------------------------------------------------------------------------

async function importHmacKey(
  key: string,
  usages: ReadonlyArray<KeyUsage>,
): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages as Array<KeyUsage>,
  )
}

async function signEvent(
  event: unknown,
  cryptoKey: CryptoKey,
): Promise<string> {
  const enc = new TextEncoder()
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
 * Uses constant-time comparison via `crypto.subtle.verify` to prevent
 * timing side-channel attacks.
 *
 * **Important:** HMAC is symmetric — the `hmacKey` used here must be the
 * same key used to sign the event. Only call this in trusted server-side
 * code or in environments where the key is not exposed to end users.
 *
 * @example
 * const isValid = await verifyEventSignature(event, event._signature, HMAC_KEY)
 * if (!isValid) return currentState // skip untrusted event
 */
export async function verifyEventSignature(
  event: unknown,
  signature: string | undefined,
  hmacKey: string,
): Promise<boolean> {
  if (!signature) return false
  const enc = new TextEncoder()
  const cryptoKey = await importHmacKey(hmacKey, ['verify'])
  const data = enc.encode(JSON.stringify(event))
  // Convert hex signature back to Uint8Array for constant-time verify
  const sigBytes = new Uint8Array(
    signature.match(/.{2}/g)?.map((h) => parseInt(h, 16)) ?? [],
  )
  return crypto.subtle.verify('HMAC', cryptoKey, sigBytes, data)
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
 * Clients consume these streams using `streamChannelOptions` with `isDone`
 * and `isError` configured to detect the sentinel constants:
 *
 * ```ts
 * import { STREAM_DONE, STREAM_ERROR } from '@tanstack/realtime'
 *
 * streamChannelOptions({
 *   client,
 *   channel: ['ai', { sessionId }],
 *   initial: '',
 *   reduce: (s, e) => s + e.token,
 *   isDone:  (_, e) => e.type === STREAM_DONE,
 *   isError: (_, e) => e.type === STREAM_ERROR ? e.message : false,
 * })
 * ```
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
  const { publish, hmacKey } = options
  const channel =
    typeof options.channel === 'string'
      ? options.channel
      : serializeKey(options.channel)

  // Per-instance key cache — imported once per stream, not shared globally.
  let cachedKey: CryptoKey | undefined

  async function getKey(): Promise<CryptoKey> {
    if (!cachedKey) {
      cachedKey = await importHmacKey(hmacKey!, ['sign'])
    }
    return cachedKey
  }

  async function publishEvent(event: unknown): Promise<void> {
    if (hmacKey) {
      const payload = event as Record<string, unknown>
      // Strip _signature from the event before signing to avoid circular deps
      const { _signature: _, ...eventWithoutSig } = payload
      const cryptoKey = await getKey()
      const signature = await signEvent(eventWithoutSig, cryptoKey)
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
      await publishEvent({ type: STREAM_DONE })
    },

    async error(message: string): Promise<void> {
      await publishEvent({ type: STREAM_ERROR, message })
    },
  }
}
