import type { QueryKey } from './types.js'

/**
 * Serialize a query key to a stable, deterministic JSON string.
 *
 * Object keys are sorted at every level, mirroring TanStack Query's `hashKey`
 * semantics. This guarantees that `['todos', { b: 2, a: 1 }]` and
 * `['todos', { a: 1, b: 2 }]` produce the same wire string regardless of the
 * order in which the properties were defined.
 *
 * This is the single canonical implementation shared by both the client
 * (`@tanstack/realtime-client`) and the server (`@tanstack/realtime-server`)
 * to prevent silent divergence.
 */
export function serializeKey(key: QueryKey): string {
  return JSON.stringify(key, (_, val: unknown) => {
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      return Object.fromEntries(
        Object.entries(val as Record<string, unknown>).sort(([a], [b]) =>
          a.localeCompare(b),
        ),
      )
    }
    return val
  })
}
