import { REALTIME_BATCH_CHANNEL } from '@realtimejs/core'
import type {
  PublishFn,
  QueryPredicate,
  SubscriptionEntry,
  WriteDescriptor,
} from '@realtimejs/core'

// REALTIME_BATCH_CHANNEL, QueryPredicate and SubscriptionEntry are ORM-neutral
// and now live in `@realtimejs/core`. Re-export for convenience / back-compat.
export { REALTIME_BATCH_CHANNEL }
export type { QueryPredicate, SubscriptionEntry }

/**
 * Decide whether two subscription entries on the same channel are the SAME
 * logical query (so re-registration is a no-op overwrite) or DISTINCT (so an
 * overwrite would drop one query — a residual collision worth warning about).
 *
 * Compared by predicate identity: the full SQL, the bound params, and the
 * compiled matcher's source. This deliberately treats a re-run of the same
 * query (fresh closures, same source) as identical, while two genuinely
 * different queries (different SQL/params/matcher) as distinct.
 */
function sameSubscription(a: SubscriptionEntry, b: SubscriptionEntry): boolean {
  const pa = a.predicate
  const pb = b.predicate
  if (pa.table !== pb.table) return false
  if ((pa.sql ?? '') !== (pb.sql ?? '')) return false
  if (
    JSON.stringify(pa.params ?? [], bigintReplacer) !==
    JSON.stringify(pb.params ?? [], bigintReplacer)
  ) {
    return false
  }
  return pa.compiled.toString() === pb.compiled.toString()
}

/** bigint-safe JSON replacer (mirrors the channel-derivation replacer). */
function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() + 'n' : value
}

export class SubscriptionManager {
  // Inverted index: tableName → (channel → SubscriptionEntry)
  private index = new Map<string, Map<string, SubscriptionEntry>>()

  // Mutable publish ref so the publish/onChannelEmpty circular dependency with
  // the SSE handler can be resolved: a manager may be created before its
  // publish function is known, then have it injected via `setPublish`.
  private publishFn: PublishFn

  constructor(publishFn?: PublishFn) {
    this.publishFn =
      publishFn ??
      (() => {
        throw new Error(
          '[realtime:reactive] SubscriptionManager has no publish function. ' +
            'Pass one to createReactiveQueries({ publish }) or call bindPublish().',
        )
      })
  }

  /**
   * Inject (or replace) the publish function after construction. Used to wire
   * a handler's publish into a manager created up front.
   */
  setPublish(publishFn: PublishFn): void {
    this.publishFn = publishFn
  }

  /**
   * Register a subscription. Overwrites any existing entry for the same channel.
   *
   * Channels are derived from the full query SQL (see `deriveChannelKey`), so
   * two registrations share a channel ONLY when their queries are byte-identical
   * — in which case they have identical `requery` semantics and overwriting is
   * harmless. DISTINCT queries (different result sets) always get DISTINCT
   * channels and therefore distinct entries; none is silently dropped.
   *
   * Belt-and-suspenders: if a DISTINCT entry would overwrite an existing entry
   * on the same channel (a residual discriminator collision), we `console.warn`
   * once with an actionable message so the collision is LOUD, not silent. We do
   * NOT throw (back-compat), and we do NOT warn on identical re-registration.
   */
  register(entry: SubscriptionEntry): void {
    const tableMap =
      this.index.get(entry.predicate.table) ??
      new Map<string, SubscriptionEntry>()
    this.index.set(entry.predicate.table, tableMap)

    const existing = tableMap.get(entry.channel)
    if (existing && !sameSubscription(existing, entry)) {
      console.warn(
        `[realtime:reactive] channel collision on "${entry.channel}": a different ` +
          'query is overwriting an existing subscription on the same channel. ' +
          'This indicates a discriminator collision (two distinct queries hashed to ' +
          'the same channel); pass an explicit `channel` to disambiguate. The ' +
          'previous subscription will be dropped.',
      )
    }

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
  publishFn?: PublishFn,
): SubscriptionManager {
  return new SubscriptionManager(publishFn)
}
