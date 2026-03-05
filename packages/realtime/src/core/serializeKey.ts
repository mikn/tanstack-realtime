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
/**
 * Derives a channel name from a REST URL by extracting the last meaningful
 * path segment as the namespace and query parameters as channel params.
 *
 * This is used behind the scenes by `useRealtimeCollection` and
 * `realtimeCollectionOptions` so that when a `url` is provided but `channel`
 * is omitted, a sensible channel name is derived automatically.
 *
 * **Derivation rules:**
 * - Leading `/api` or `/api/v1` (any version) path prefixes are stripped.
 * - The last non-empty path segment becomes the namespace.
 * - Query parameters become sorted channel params (same format as `serializeKey`).
 *
 * @example
 * deriveChannelFromUrl('/api/todos?projectId=123')
 * // → 'todos:projectId=123'
 *
 * deriveChannelFromUrl('/api/v2/projects/abc/tasks?status=active')
 * // → 'tasks:status=active'
 *
 * deriveChannelFromUrl('https://example.com/api/todos')
 * // → 'todos'
 *
 * deriveChannelFromUrl('/api/todos?status=active&projectId=123')
 * // → 'todos:projectId=123,status=active'   (keys sorted)
 */
export function deriveChannelFromUrl(url: string): string {
  // Strip origin (protocol + host) if present
  let path: string
  let search: string
  try {
    // Handle both absolute and relative URLs
    const parsed = new URL(url, 'http://localhost')
    path = parsed.pathname
    search = parsed.search
  } catch {
    // Fallback: split on '?'
    const qIdx = url.indexOf('?')
    if (qIdx === -1) {
      path = url
      search = ''
    } else {
      path = url.slice(0, qIdx)
      search = url.slice(qIdx)
    }
  }

  // Strip leading /api or /api/v<N> prefix
  path = path.replace(/^\/api(?:\/v\d+)?/, '')

  // Extract last non-empty segment as namespace
  const segments = path.split('/').filter(Boolean)
  const namespace = segments[segments.length - 1] ?? 'unknown'

  // Parse query params into sorted key=value pairs (same format as serializeKey)
  if (!search || search === '?') return namespace

  const params = new URLSearchParams(search)
  const pairs: Array<string> = []
  const sortedKeys = [...params.keys()].sort()
  for (const key of sortedKeys) {
    // Guard against prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue
    }
    pairs.push(`${key}=${encodeURIComponent(params.get(key)!)}`)
  }

  return pairs.length > 0 ? `${namespace}:${pairs.join(',')}` : namespace
}

export function parseChannel(channel: string): ParsedChannel {
  const colonIdx = channel.indexOf(':')
  if (colonIdx === -1) {
    return { namespace: channel, params: {}, raw: channel }
  }

  const namespace = channel.slice(0, colonIdx)
  const paramStr = channel.slice(colonIdx + 1)

  const params: Record<string, string> = Object.create(null)
  for (const part of paramStr.split(',')) {
    const eqIdx = part.indexOf('=')
    if (eqIdx === -1) continue
    const k = part.slice(0, eqIdx)
    // Guard against prototype pollution: reject keys that could modify the
    // prototype chain when assigned to a plain object.
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue
    const v = decodeURIComponent(part.slice(eqIdx + 1))
    params[k] = v
  }

  return { namespace, params, raw: channel }
}
