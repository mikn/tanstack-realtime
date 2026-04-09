import type { PublishFn } from '@tanstack/realtime'
import type { ColumnMap, WriteDescriptor } from './reactive-db.js'

/**
 * The SSE channel name used to deliver all invalidation updates as a single
 * atomic message. The client fans them out synchronously to guarantee that
 * all affected queries update in the same React/Vue/Solid render pass.
 */
export const REALTIME_BATCH_CHANNEL = '__realtime_batch__'

export interface QueryPredicate {
  table: string
  sql: string
  params: ReadonlyArray<unknown>
  columns: ColumnMap
  compiled: (row: Record<string, unknown>) => boolean // pre-compiled at register()
  /**
   * JS field names referenced in the WHERE clause.
   * Used for conservative UPDATE invalidation: if the mutation's .set({…})
   * touched a column listed here but the post-update row no longer matches the
   * predicate, the subscription is still invalidated (the row was *removed*
   * from this result set and subscribers must see it disappear).
   */
  referencedColumns: ReadonlySet<string>
}

export interface SubscriptionEntry {
  channel: string
  predicate: QueryPredicate
  requery: () => Promise<unknown>
}

export class SubscriptionManager {
  // Inverted index: tableName → (channel → SubscriptionEntry)
  private index = new Map<string, Map<string, SubscriptionEntry>>()

  constructor(private readonly publishFn: PublishFn) {}

  /**
   * Register a subscription. Overwrites any existing entry for the same channel.
   */
  register(entry: SubscriptionEntry): void {
    const tableMap =
      this.index.get(entry.predicate.table) ??
      new Map<string, SubscriptionEntry>()
    this.index.set(entry.predicate.table, tableMap)
    tableMap.set(entry.channel, entry)
  }

  /**
   * Remove a subscription by channel. Called when the last SSE subscriber disconnects.
   */
  unregister(channel: string): void {
    for (const [table, tableMap] of this.index) {
      if (tableMap.has(channel)) {
        tableMap.delete(channel)
        if (tableMap.size === 0) {
          this.index.delete(table)
        }
      }
    }
  }

  /**
   * For each write descriptor, find subscriptions whose predicate matches
   * the affected rows, re-run their query, and publish the result.
   * Per-channel errors are caught and logged — never propagated.
   */
  async invalidate(writes: ReadonlyArray<WriteDescriptor>): Promise<void> {
    const toInvalidate = new Map<string, SubscriptionEntry>()

    for (const write of writes) {
      const tableMap = this.index.get(write.table)
      if (!tableMap) continue
      for (const [channel, entry] of tableMap) {
        if (write.affectedRows.length === 0) {
          // Table-level fallback: no .returning() used
          toInvalidate.set(channel, entry)
        } else if (
          write.affectedRows.some((row: Record<string, unknown>) =>
            entry.predicate.compiled(row),
          )
        ) {
          // Predicate-level match on post-write row values
          toInvalidate.set(channel, entry)
        } else if (
          write.operation === 'update' &&
          entry.predicate.referencedColumns.size > 0 &&
          write.updatedColumns.some((col) =>
            entry.predicate.referencedColumns.has(col),
          )
        ) {
          // Conservative UPDATE invalidation: the mutation changed a column
          // that this subscription's predicate references, but the post-update
          // row no longer matches. This means the row was *removed* from this
          // subscription's result set — re-run so subscribers see it disappear.
          toInvalidate.set(channel, entry)
        }
      }
    }

    // Run all re-queries in parallel, collect results
    const results = await Promise.allSettled(
      Array.from(toInvalidate.entries()).map(async ([channel, entry]) => ({
        channel,
        data: await entry.requery(),
      })),
    )

    const updates: Array<{ channel: string; data: unknown }> = []
    for (const result of results) {
      if (result.status === 'fulfilled') {
        updates.push(result.value)
      } else {
        console.error(
          '[realtime:reactive] channel invalidation error',
          result.reason,
        )
      }
    }

    if (updates.length === 0) return

    // Publish ONE atomic batch message so the client can fan out synchronously.
    // React 18 / Vue / Solid will batch the resulting state updates into one render.
    await this.publishFn(REALTIME_BATCH_CHANNEL, {
      type: 'realtime_batch',
      updates,
    })
  }

  /**
   * Return all currently registered channel keys.
   */
  activeChannels(): ReadonlySet<string> {
    const channels = new Set<string>()
    for (const tableMap of this.index.values()) {
      for (const channel of tableMap.keys()) {
        channels.add(channel)
      }
    }
    return channels
  }
}

export function createSubscriptionManager(
  publishFn: PublishFn,
): SubscriptionManager {
  return new SubscriptionManager(publishFn)
}
