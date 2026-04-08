import { serializeKey } from '@tanstack/realtime'
import { runInReactiveContext } from './reactive-db.js'
import {
  ReactivePredicateParseError,
  compilePredicate,
  deriveChannelKey,
} from './compile-predicate.js'
import type { ColumnMap } from './reactive-db.js'
import type { QueryKey } from '@tanstack/realtime'
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

export function createReactiveLoader<TResult>(
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
    }

    if (ctx.reads[0]) {
      // Auto path: predicate extracted from reactive context
      const read = ctx.reads[0]
      let compiled: (row: Record<string, unknown>) => boolean
      let autoChannel: string | undefined

      try {
        compiled = compilePredicate(read.sql, read.params, read.columns)
      } catch (err) {
        if (
          err instanceof ReactivePredicateParseError &&
          err.message.includes('No WHERE clause')
        ) {
          // Table-level subscription: query has no WHERE clause
          compiled = () => true
          autoChannel = serializeKey([read.table])
        } else {
          throw err
        }
      }

      queryPredicate = {
        table: read.table,
        sql: read.sql,
        params: read.params,
        columns: read.columns,
        compiled,
      }
      channel =
        options.channel !== undefined
          ? typeof options.channel === 'string'
            ? options.channel
            : serializeKey(options.channel)
          : (autoChannel ??
            deriveChannelKey(read.table, read.sql, read.params, read.columns))
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
      }
      channel =
        options.channel !== undefined
          ? typeof options.channel === 'string'
            ? options.channel
            : serializeKey(options.channel)
          : deriveChannelKey(pred.table, sql, params, pred.columns)
    } else if (options.predicate && 'matches' in options.predicate) {
      // Explicit matches path
      const pred = options.predicate
      queryPredicate = {
        table: pred.table,
        sql: '',
        params: [],
        columns: {},
        compiled: pred.matches,
      }
      channel =
        options.channel !== undefined
          ? typeof options.channel === 'string'
            ? options.channel
            : serializeKey(options.channel)
          : deriveChannelKey(pred.table, undefined, [], {})
    } else {
      throw new Error(
        "createReactiveLoader: no read set captured — use wrapReactiveDb() or provide 'predicate'",
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
