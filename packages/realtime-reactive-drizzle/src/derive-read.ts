import { serializeKey } from '@tanstack/realtime'
import {
  ReactivePredicateParseError,
  compilePredicate,
  deriveChannelKey,
  extractReferencedColumns,
} from './compile-predicate.js'
import type { ColumnMap } from './reactive-db.js'
import type { CapturedRead, QueryKey } from '@tanstack/realtime'

/**
 * The raw shape captured by the reactive proxy for a single `select().from()`
 * read: the table name, the full SQL (including WHERE), positional params, and
 * the table's column map.
 */
interface RawRead {
  table: string
  sql: string
  params: ReadonlyArray<unknown>
  columns: ColumnMap
}

/**
 * Normalises an explicit channel override (a {@link QueryKey} tuple or a raw
 * string) into a flat channel string. Returns `undefined` when no override was
 * supplied so callers fall back to auto-derivation.
 */
export function resolveChannelOverride(
  override: QueryKey | string | undefined,
): string | undefined {
  if (override === undefined) return undefined
  return typeof override === 'string' ? override : serializeKey(override)
}

/**
 * Compiles a single raw read into a neutral {@link CapturedRead}: it compiles
 * the WHERE clause into a row predicate, extracts the referenced columns, and
 * derives the SSE channel — including the no-WHERE table-level fallback.
 *
 * This is the SINGLE source of truth for read → predicate/channel derivation,
 * shared by both `createDrizzleEngine().captureReads` and `createLoader` so the
 * two can never drift apart.
 *
 * When `channelOverride` is provided it forces the derived channel; otherwise
 * the channel is auto-derived from the WHERE equality conditions (or the
 * table name when there is no WHERE clause).
 */
export function deriveCapturedRead(
  read: RawRead,
  channelOverride?: string,
): CapturedRead {
  let compiled: (row: Record<string, unknown>) => boolean
  let referencedColumns: ReadonlySet<string>
  let autoChannel: string | undefined

  try {
    compiled = compilePredicate(read.sql, read.params, read.columns)
    referencedColumns = extractReferencedColumns(read.sql, read.columns)
  } catch (err) {
    if (
      err instanceof ReactivePredicateParseError &&
      err.message.includes('No WHERE clause')
    ) {
      // Table-level subscription: query has no WHERE clause
      compiled = () => true
      referencedColumns = new Set<string>()
      autoChannel = serializeKey([read.table])
    } else {
      throw err
    }
  }

  const channel =
    channelOverride ??
    autoChannel ??
    deriveChannelKey(read.table, read.sql, read.params, read.columns)

  return {
    table: read.table,
    compiled,
    referencedColumns,
    channel,
  }
}
