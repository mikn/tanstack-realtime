import type { QueryKey } from '../core/types.js'

/**
 * The SSE channel name used to deliver all invalidation updates as a single
 * atomic message. The client fans them out synchronously to guarantee that
 * all affected queries update in the same React/Vue/Solid render pass.
 *
 * This is the SINGLE source of truth for the batch channel string. Both the
 * client-side query collection registry and any server-side reactive engine
 * (e.g. `@realtimejs/reactive-drizzle`) import it from here so the two
 * sides can never drift apart.
 */
export const REALTIME_BATCH_CHANNEL = '__realtime_batch__'

/**
 * Describes a single DML write captured by a reactive engine (or supplied
 * manually via an engine's `writes` escape hatch).
 *
 * The discriminated union enforces that UPDATE descriptors always carry
 * `updatedColumns` — the field names that were written — which a subscription
 * manager uses for conservative invalidation of subscriptions whose predicate
 * references a column that was mutated.
 *
 * `affectedRows: []` triggers table-level invalidation for any operation
 * (i.e. when the engine could not capture the specific rows that changed).
 *
 * This type is ORM-neutral: it carries only field/table names and plain row
 * objects, so any engine (Drizzle, Kysely, Prisma, raw SQL) can produce it.
 */
export type WriteDescriptor =
  | {
      table: string
      operation: 'insert' | 'delete'
      affectedRows: ReadonlyArray<Record<string, unknown>>
    }
  | {
      table: string
      operation: 'update'
      /** Field names that were written. Empty array = conservatively invalidate all subscriptions on the table. */
      updatedColumns: ReadonlyArray<string>
      affectedRows: ReadonlyArray<Record<string, unknown>>
    }

/**
 * A compiled query predicate registered against a subscription manager.
 *
 * `compiled(row)` answers "does this post-write row belong to the query's
 * result set?". `referencedColumns` lists the field names referenced by the
 * predicate, used for conservative UPDATE invalidation: if a mutation touched
 * one of these columns but the post-update row no longer matches, the
 * subscription is still invalidated (the row was *removed* from the result
 * set and subscribers must see it disappear).
 *
 * The optional `sql`/`params`/`columns` are engine-specific metadata that a
 * particular engine may attach; the neutral orchestration ignores them.
 */
export interface QueryPredicate {
  table: string
  compiled: (row: Record<string, unknown>) => boolean
  /**
   * Field names referenced in the predicate (e.g. the WHERE clause).
   * Used for conservative UPDATE invalidation.
   */
  referencedColumns: ReadonlySet<string>
  /** Optional engine-specific metadata. */
  sql?: string
  /** Optional engine-specific metadata. */
  params?: ReadonlyArray<unknown>
  /** Optional engine-specific metadata. */
  columns?: Record<string, { name: string }>
}

/**
 * A subscription registered with a subscription manager: a predicate plus the
 * channel its updates are delivered on and a `requery` thunk to refresh data.
 */
export interface SubscriptionEntry {
  channel: string
  predicate: QueryPredicate
  requery: () => Promise<unknown>
}

/**
 * One captured read: how to tell if a post-write row belongs to a query's
 * result set, and which channel carries its updates.
 */
export interface CapturedRead {
  table: string
  compiled: (row: Record<string, unknown>) => boolean
  referencedColumns: ReadonlySet<string>
  channel: string
}

/**
 * Pluggable capture/compile seam for reactive queries.
 *
 * A Drizzle adapter (`createDrizzleEngine` in
 * `@realtimejs/reactive-drizzle`) is the first implementation; others
 * (Kysely, Prisma, raw SQL) implement the same interface. The reactive
 * orchestration (`createReactiveQueries`) depends ONLY on this interface, so it
 * carries no ORM or SQL-parser dependency.
 */
export interface ReactiveQueryEngine {
  /**
   * Run `queryFn` capturing its read(s); return the result plus how to
   * invalidate. `channelOverride` forces the channel when provided.
   *
   * Returns an ARRAY with one {@link CapturedRead} per DISTINCT table read, so
   * a query that reads multiple tables (several separate `select().from(...)`
   * calls) stays live to writes on ALL of them. Each read carries its own
   * predicate and channel; the caller registers a subscription per read and
   * propagates every channel to the client.
   *
   * **JOIN limitation:** auto-capture only covers SEPARATE `select().from()`
   * calls. A SQL JOIN captures only the primary table; for JOINs (or other
   * unsupported shapes) use the engine's `channelOverride` / predicate escape
   * hatch to take manual control.
   */
  captureReads: <T>(
    queryFn: () => Promise<T>,
    channelOverride?: QueryKey | string,
  ) => Promise<{ result: T; reads: ReadonlyArray<CapturedRead> }>

  /**
   * Run `mutationFn` capturing its write descriptors.
   */
  captureWrites: <T>(
    mutationFn: () => Promise<T>,
  ) => Promise<{ result: T; writes: ReadonlyArray<WriteDescriptor> }>
}
