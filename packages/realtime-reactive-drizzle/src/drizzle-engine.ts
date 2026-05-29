import { runInReactiveContext } from './reactive-db.js'
import { deriveCapturedRead, resolveChannelOverride } from './derive-read.js'
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
 * (via {@link runInReactiveContext}), then compiles EVERY distinct read the
 * query performed — each separate `db.select().from(...)` call — into its own
 * {@link CapturedRead}. For each read it compiles the WHERE clause into a row
 * predicate (via `pgsql-ast-parser`) and derives the SSE channel, including the
 * no-WHERE table-level fallback. Reads that derive the same channel (the same
 * table + predicate read twice) are collapsed to one. This is what keeps a
 * query that reads multiple tables live to writes on ALL of them.
 *
 * **Channel override:** when `channelOverride` is supplied the user is taking
 * manual control, so a SINGLE {@link CapturedRead} is returned using the
 * override channel and the FIRST read's predicate. (Auto multi-table capture is
 * only used when no override is given.)
 *
 * **JOIN limitation:** multi-table capture works for SEPARATE
 * `select().from()` calls. A SQL JOIN (`.from(a).leftJoin(b)`) only captures
 * the primary table `a` — the joined table is not intercepted. For JOINs use
 * the explicit `channel` override / `predicate` escape hatch.
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

      const override = resolveChannelOverride(channelOverride)

      // Explicit override = manual control: collapse to a single read using the
      // override channel and the first read's predicate.
      if (override !== undefined) {
        return {
          result,
          reads: [deriveCapturedRead(ctx.reads[0], override)],
        }
      }

      // Auto path: one CapturedRead per DISTINCT read, deduped by derived
      // channel so the same table+predicate read twice collapses to one.
      const byChannel = new Map<string, CapturedRead>()
      for (const read of ctx.reads) {
        const captured = deriveCapturedRead(read)
        if (!byChannel.has(captured.channel)) {
          byChannel.set(captured.channel, captured)
        }
      }

      return { result, reads: Array.from(byChannel.values()) }
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
