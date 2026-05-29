import { runInReactiveContext } from './reactive-db.js'
import {
  compilePredicate,
  deriveChannelKey,
  extractReferencedColumns,
} from './compile-predicate.js'
import { deriveCapturedRead, resolveChannelOverride } from './derive-read.js'
import type { ColumnMap } from './reactive-db.js'
import type { QueryKey } from '@realtimejs/core'
import type { SubscriptionManager } from './subscription-manager.js'

interface ReactiveLoaderOptions<TResult> {
  subscriptionManager: SubscriptionManager
  /**
   * Optional channel key. When omitted, auto-derived from WHERE equality conditions.
   * Provide explicitly as escape hatch for complex queries.
   */
  channel?: QueryKey | string
  /**
   * Query function. Should use wrapReactiveDb() db for automatic predicate extraction.
   */
  query: () => Promise<TResult>
  /**
   * Escape hatch for queries not using the reactive proxy.
   */
  predicate?:
    | {
        table: string
        where: { toSQL: () => { sql: string; params: Array<unknown> } }
        columns: ColumnMap
      }
    | { table: string; matches: (row: Record<string, unknown>) => boolean }
}

export function createLoader<TResult>(
  options: ReactiveLoaderOptions<TResult>,
): {
  load: () => Promise<TResult>
  loadWithChannel: () => Promise<{ data: TResult; channel: string }>
} {
  async function loadInternal(): Promise<{ data: TResult; channel: string }> {
    const { result, ctx } = await runInReactiveContext(options.query)

    let channel: string
    let queryPredicate: {
      table: string
      sql: string
      params: ReadonlyArray<unknown>
      columns: ColumnMap
      compiled: (row: Record<string, unknown>) => boolean
      referencedColumns: ReadonlySet<string>
    }

    if (ctx.reads[0]) {
      // Auto path: predicate + channel extracted from the reactive context via
      // the shared derivation helper (single source of truth with the engine).
      const read = ctx.reads[0]
      const captured = deriveCapturedRead(
        read,
        resolveChannelOverride(options.channel),
      )

      queryPredicate = {
        table: read.table,
        sql: read.sql,
        params: read.params,
        columns: read.columns,
        compiled: captured.compiled,
        referencedColumns: captured.referencedColumns,
      }
      channel = captured.channel
    } else if (options.predicate && 'where' in options.predicate) {
      // Explicit where path
      const pred = options.predicate
      const { sql, params } = pred.where.toSQL()
      const compiled = compilePredicate(sql, params, pred.columns)
      queryPredicate = {
        table: pred.table,
        sql,
        params,
        columns: pred.columns,
        compiled,
        referencedColumns: extractReferencedColumns(sql, pred.columns),
      }
      channel =
        resolveChannelOverride(options.channel) ??
        deriveChannelKey(pred.table, sql, params, pred.columns)
    } else if (options.predicate && 'matches' in options.predicate) {
      // Explicit matches path — no SQL to parse, so referencedColumns is unknown
      const pred = options.predicate
      queryPredicate = {
        table: pred.table,
        sql: '',
        params: [],
        columns: {},
        compiled: pred.matches,
        referencedColumns: new Set(),
      }
      channel =
        resolveChannelOverride(options.channel) ??
        deriveChannelKey(pred.table, undefined, [], {})
    } else {
      throw new Error(
        "createLoader: no read set captured — use wrapReactiveDb() or provide 'predicate'",
      )
    }

    options.subscriptionManager.register({
      channel,
      predicate: queryPredicate,
      requery: options.query,
    })

    return { data: result, channel }
  }

  return {
    async load(): Promise<TResult> {
      const { data } = await loadInternal()
      return data
    },
    async loadWithChannel(): Promise<{ data: TResult; channel: string }> {
      return loadInternal()
    },
  }
}
