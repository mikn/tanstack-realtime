import { serializeKey } from '@tanstack/realtime'
import { runInReactiveContext } from './reactive-db.js'
import {
  ReactivePredicateParseError,
  compilePredicate,
  deriveChannelKey,
  extractReferencedColumns,
} from './compile-predicate.js'
import type {
  CapturedRead,
  QueryKey,
  ReactiveQueryEngine,
  WriteDescriptor,
} from '@tanstack/realtime'

/**
 * The Drizzle/Postgres implementation of the neutral {@link ReactiveQueryEngine}
 * seam.
 *
 * `captureReads` runs the query inside an AsyncLocalStorage reactive context
 * (via {@link runInReactiveContext}), takes the first captured read
 * (`ctx.reads[0]`), compiles its WHERE clause into a row predicate
 * (via `pgsql-ast-parser`), and derives the SSE channel — including the
 * no-WHERE table-level fallback and the explicit channel override. It returns
 * an array with a single {@link CapturedRead}; multi-table fan-out is future
 * work (WP-C).
 *
 * `captureWrites` runs the mutation in the same kind of context and returns the
 * captured write descriptors verbatim.
 *
 * This is the ONLY place the Drizzle/pgsql machinery is wired to the
 * orchestration; the orchestration itself depends only on the engine interface.
 */
export function createDrizzleEngine(): ReactiveQueryEngine {
  return {
    async captureReads<T>(
      queryFn: () => Promise<T>,
      channelOverride?: QueryKey | string,
    ): Promise<{ result: T; reads: ReadonlyArray<CapturedRead> }> {
      const { result, ctx } = await runInReactiveContext(queryFn)

      if (ctx.reads.length === 0) {
        throw new Error(
          'createDrizzleEngine: no read set captured — use wrapReactiveDb() for the query',
        )
      }
      const read = ctx.reads[0]

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
        channelOverride !== undefined
          ? typeof channelOverride === 'string'
            ? channelOverride
            : serializeKey(channelOverride)
          : (autoChannel ??
            deriveChannelKey(read.table, read.sql, read.params, read.columns))

      return {
        result,
        reads: [
          {
            table: read.table,
            compiled,
            referencedColumns,
            channel,
          },
        ],
      }
    },

    async captureWrites<T>(
      mutationFn: () => Promise<T>,
    ): Promise<{ result: T; writes: ReadonlyArray<WriteDescriptor> }> {
      const { result, ctx } = await runInReactiveContext(mutationFn)
      return { result, writes: ctx.writes }
    },
  }
}

/**
 * A ready-to-use Drizzle engine instance. Equivalent to calling
 * {@link createDrizzleEngine} once; the engine is stateless so a shared
 * instance is safe.
 */
export const drizzleEngine: ReactiveQueryEngine = createDrizzleEngine()
