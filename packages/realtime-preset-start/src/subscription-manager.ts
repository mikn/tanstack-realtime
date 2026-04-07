import type { PublishFn } from '@tanstack/realtime'
import type { ColumnMap, WriteDescriptor } from './reactive-db.js'

export interface QueryPredicate {
  table: string
  sql: string
  params: ReadonlyArray<unknown>
  columns: ColumnMap
  compiled: (row: Record<string, unknown>) => boolean // pre-compiled at register()
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
          // Predicate-level match
          toInvalidate.set(channel, entry)
        }
      }
    }

    for (const [channel, entry] of toInvalidate) {
      try {
        const data = await entry.requery()
        await this.publishFn(channel, data)
      } catch (err) {
        console.error(
          '[realtime:reactive] channel invalidation error',
          channel,
          err,
        )
        // per-channel errors must never propagate
      }
    }
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
