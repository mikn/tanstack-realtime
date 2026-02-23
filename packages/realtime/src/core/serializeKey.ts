import type { ParsedChannel, QueryKey } from './types.js'

/**
 * Serializes a structured query key into a flat channel string compatible
 * with Centrifugo and Ably channel naming conventions.
 *
 * Rules:
 * - The first array element becomes the namespace.
 * - An optional second object element is encoded as sorted `key=value` pairs.
 * - Object values are URI-encoded so they survive channel name restrictions.
 *
 * @example
 * serializeKey(['todos', { projectId: '123' }])
 * // → 'todos:projectId=123'
 *
 * serializeKey(['todos', { status: 'active', projectId: '123' }])
 * // → 'todos:projectId=123,status=active'   (keys sorted)
 *
 * serializeKey(['todos'])
 * // → 'todos'
 */
export function serializeKey(key: QueryKey): string {
  if (key.length === 0) return ''

  const namespace = String(key[0])
  if (key.length === 1) return namespace

  const params = key[1]
  if (typeof params !== 'object' || params === null || Array.isArray(params)) {
    // Non-object second segment: append as-is after a colon
    return `${namespace}:${String(params)}`
  }

  const paramPairs = Object.entries(params as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join(',')

  return paramPairs ? `${namespace}:${paramPairs}` : namespace
}

/**
 * Parses a serialized channel string back into a structured object.
 * This is the inverse of `serializeKey` for single-namespace channels.
 *
 * @example
 * parseChannel('todos:projectId=123')
 * // → { namespace: 'todos', params: { projectId: '123' }, raw: 'todos:projectId=123' }
 *
 * parseChannel('todos')
 * // → { namespace: 'todos', params: {}, raw: 'todos' }
 */
export function parseChannel(channel: string): ParsedChannel {
  const colonIdx = channel.indexOf(':')
  if (colonIdx === -1) {
    return { namespace: channel, params: {}, raw: channel }
  }

  const namespace = channel.slice(0, colonIdx)
  const paramStr = channel.slice(colonIdx + 1)

  const params: Record<string, string> = {}
  for (const part of paramStr.split(',')) {
    const eqIdx = part.indexOf('=')
    if (eqIdx === -1) continue
    const k = part.slice(0, eqIdx)
    const v = decodeURIComponent(part.slice(eqIdx + 1))
    params[k] = v
  }

  return { namespace, params, raw: channel }
}
