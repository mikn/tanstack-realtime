/**
 * Tests for the reactive layer:
 * compilePredicate, extractEqualityConditions, deriveChannelKey,
 * wrapReactiveDb, runInReactiveContext, SubscriptionManager,
 * createLoader, createMutationHandler (internal helpers), createStartHandler (integration)
 */

import { describe, expect, it, vi } from 'vitest'
import { serializeKey } from '@realtimejs/core'
import { createStartHandler } from '@realtimejs/preset-start'
import {
  REALTIME_BATCH_CHANNEL,
  ReactivePredicateParseError,
  compilePredicate,
  createReactiveQueries,
  createSubscriptionManager,
  deriveChannelKey,
  extractEqualityConditions,
  extractReferencedColumns,
  runInReactiveContext,
  wrapReactiveDb,
} from '@realtimejs/reactive-drizzle'
import { createLoader } from '../reactive-drizzle/src/reactive-loader.js'
import { createMutationHandler } from '../reactive-drizzle/src/reactive-mutation.js'
import type {
  CapturedRead,
  ReactiveQueryEngine,
  SubscriptionEntry,
  WriteDescriptor,
} from '@realtimejs/reactive-drizzle'

// ---------------------------------------------------------------------------
// Drizzle-compatible fake table objects
// Drizzle's getTableName reads table[Symbol.for("drizzle:Name")]
// Drizzle's getTableColumns reads table[Table.Symbol.Columns]
//   where Table.Symbol.Columns = Symbol.for("drizzle:Columns")
// ---------------------------------------------------------------------------

const DRIZZLE_NAME_SYM = Symbol.for('drizzle:Name')
const DRIZZLE_COLUMNS_SYM = Symbol.for('drizzle:Columns')

function makeFakeTable(
  tableName: string,
  columns: Record<string, { name: string }>,
) {
  const t: any = {}
  t[DRIZZLE_NAME_SYM] = tableName
  t[DRIZZLE_COLUMNS_SYM] = columns
  return t
}

const todosColumns = {
  teamId: { name: 'team_id' },
  done: { name: 'done' },
  count: { name: 'count' },
}

const fakeTable = makeFakeTable('todos', todosColumns)

// ---------------------------------------------------------------------------
// Fake query builder factory
// ---------------------------------------------------------------------------

function makeFakeBuilder(
  sql: string,
  params: Array<unknown>,
  result: Array<any>,
) {
  const builder: any = {
    toSQL: () => ({ sql, params }),
    from: (_t: any) => builder,
    where: (_cond: any) => builder,
    orderBy: (..._args: Array<any>) => builder,
    then: (res: any, rej: any) => Promise.resolve(result).then(res, rej),
  }
  return builder
}

// ---------------------------------------------------------------------------
// Shared column map used in compilePredicate / extractEqualityConditions tests
// (These tests call the function directly, not through drizzle)
// ---------------------------------------------------------------------------

const columns = {
  teamId: { name: 'team_id' },
  done: { name: 'done' },
  count: { name: 'count' },
}

// ---------------------------------------------------------------------------
// compilePredicate
// ---------------------------------------------------------------------------

describe('compilePredicate', () => {
  it('= comparison: matches equal value, rejects others', () => {
    const pred = compilePredicate('"todos"."team_id" = $1', ['A'], columns)
    expect(pred({ teamId: 'A' })).toBe(true)
    expect(pred({ teamId: 'B' })).toBe(false)
  })

  it('<> comparison: matches different value, rejects equal', () => {
    const pred = compilePredicate('"todos"."team_id" <> $1', ['A'], columns)
    expect(pred({ teamId: 'B' })).toBe(true)
    expect(pred({ teamId: 'A' })).toBe(false)
  })

  it('> comparison: matches strictly greater', () => {
    const pred = compilePredicate('"todos"."count" > $1', [5], columns)
    expect(pred({ count: 6 })).toBe(true)
    expect(pred({ count: 5 })).toBe(false)
    expect(pred({ count: 4 })).toBe(false)
  })

  it('>= comparison: matches equal and greater', () => {
    const pred = compilePredicate('"todos"."count" >= $1', [5], columns)
    expect(pred({ count: 5 })).toBe(true)
    expect(pred({ count: 6 })).toBe(true)
    expect(pred({ count: 4 })).toBe(false)
  })

  it('< comparison: matches strictly lesser', () => {
    const pred = compilePredicate('"todos"."count" < $1', [5], columns)
    expect(pred({ count: 4 })).toBe(true)
    expect(pred({ count: 5 })).toBe(false)
    expect(pred({ count: 6 })).toBe(false)
  })

  it('<= comparison: matches equal and lesser', () => {
    const pred = compilePredicate('"todos"."count" <= $1', [5], columns)
    expect(pred({ count: 5 })).toBe(true)
    expect(pred({ count: 4 })).toBe(true)
    expect(pred({ count: 6 })).toBe(false)
  })

  it('IS NULL: matches null value, rejects non-null', () => {
    const pred = compilePredicate('"todos"."team_id" IS NULL', [], columns)
    expect(pred({ teamId: null })).toBe(true)
    expect(pred({ teamId: undefined })).toBe(true)
    expect(pred({ teamId: 'A' })).toBe(false)
  })

  it('IS NOT NULL: matches non-null, rejects null', () => {
    const pred = compilePredicate('"todos"."team_id" IS NOT NULL', [], columns)
    expect(pred({ teamId: 'A' })).toBe(true)
    expect(pred({ teamId: null })).toBe(false)
    expect(pred({ teamId: undefined })).toBe(false)
  })

  it('IN ($1, $2, $3): matches listed values, rejects others', () => {
    const pred = compilePredicate(
      '"todos"."team_id" IN ($1, $2, $3)',
      ['A', 'B', 'C'],
      columns,
    )
    expect(pred({ teamId: 'A' })).toBe(true)
    expect(pred({ teamId: 'B' })).toBe(true)
    expect(pred({ teamId: 'C' })).toBe(true)
    expect(pred({ teamId: 'D' })).toBe(false)
  })

  it('AND combination: requires both conditions', () => {
    const pred = compilePredicate(
      '"todos"."team_id" = $1 AND "todos"."done" = $2',
      ['A', true],
      columns,
    )
    expect(pred({ teamId: 'A', done: true })).toBe(true)
    expect(pred({ teamId: 'A', done: false })).toBe(false)
    expect(pred({ teamId: 'B', done: true })).toBe(false)
    expect(pred({ teamId: 'B', done: false })).toBe(false)
  })

  it('OR combination: matches either condition', () => {
    const pred = compilePredicate(
      '"todos"."team_id" = $1 OR "todos"."team_id" = $2',
      ['A', 'B'],
      columns,
    )
    expect(pred({ teamId: 'A' })).toBe(true)
    expect(pred({ teamId: 'B' })).toBe(true)
    expect(pred({ teamId: 'C' })).toBe(false)
  })

  it('DB→JS column name mapping: row uses JS key teamId not team_id', () => {
    const pred = compilePredicate('"todos"."team_id" = $1', ['A'], columns)
    // Row with JS key (teamId) should match
    expect(pred({ teamId: 'A' })).toBe(true)
    // Row with DB key (team_id) should NOT match since mapping uses JS key
    expect(pred({ team_id: 'A' })).toBe(false)
  })

  it('Unsupported SQL operator (LIKE) throws ReactivePredicateParseError at compile time', () => {
    // LIKE is parsed as binary op "LIKE" which hits the default case
    expect(() =>
      compilePredicate('"todos"."team_id" LIKE $1', ['A%'], columns),
    ).toThrow(ReactivePredicateParseError)
  })

  it('!= operator: matches different value, rejects equal (same as <>)', () => {
    const pred = compilePredicate('"todos"."team_id" != $1', ['A'], columns)
    expect(pred({ teamId: 'B' })).toBe(true)
    expect(pred({ teamId: 'A' })).toBe(false)
  })

  it('falsy param value 0: col = $1 with params [0] correctly matches row where col === 0', () => {
    const pred = compilePredicate('"todos"."count" = $1', [0], columns)
    expect(pred({ count: 0 })).toBe(true)
    expect(pred({ count: 1 })).toBe(false)
    expect(pred({ count: false })).toBe(false)
  })

  it('falsy param value false: col = $1 with params [false] correctly matches row where col === false', () => {
    const pred = compilePredicate('"todos"."done" = $1', [false], columns)
    expect(pred({ done: false })).toBe(true)
    expect(pred({ done: true })).toBe(false)
    expect(pred({ done: 0 })).toBe(false)
  })

  it('falsy param value empty string: col = $1 with params [""] correctly matches row where col === ""', () => {
    const pred = compilePredicate('"todos"."team_id" = $1', [''], columns)
    expect(pred({ teamId: '' })).toBe(true)
    expect(pred({ teamId: 'A' })).toBe(false)
    expect(pred({ teamId: null })).toBe(false)
  })

  it('full SELECT SQL statement: compilePredicate parses WHERE from full SQL correctly', () => {
    const pred = compilePredicate(
      'SELECT * FROM "todos" WHERE "todos"."team_id" = $1',
      ['A'],
      columns,
    )
    expect(pred({ teamId: 'A' })).toBe(true)
    expect(pred({ teamId: 'B' })).toBe(false)
  })

  it('NULL param equality: col = $1 with params [null] returns false even when col === null (SQL NULL semantics)', () => {
    const pred = compilePredicate('"todos"."team_id" = $1', [null], columns)
    expect(pred({ teamId: null })).toBe(false)
    expect(pred({ teamId: 'A' })).toBe(false)
  })

  it('IS NULL: correctly matches null rows (proper SQL way to test for NULL)', () => {
    const pred = compilePredicate('"todos"."team_id" IS NULL', [], columns)
    expect(pred({ teamId: null })).toBe(true)
    expect(pred({ teamId: undefined })).toBe(true)
    expect(pred({ teamId: 'A' })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// wrapReactiveDb
// ---------------------------------------------------------------------------

describe('wrapReactiveDb', () => {
  it('passes through calls when no reactive context active', () => {
    const rawDb = { select: vi.fn().mockReturnValue({ from: vi.fn() }) }
    const wrapped = wrapReactiveDb(rawDb as any)
    wrapped.select()
    expect(rawDb.select).toHaveBeenCalled()
  })

  it('passes through insert calls when no reactive context active', () => {
    const rawDb = { insert: vi.fn().mockReturnValue({ values: vi.fn() }) }
    const wrapped = wrapReactiveDb(rawDb as any)
    wrapped.insert(fakeTable)
    expect(rawDb.insert).toHaveBeenCalledWith(fakeTable)
  })

  it('runInReactiveContext: captures reads when select query is awaited', async () => {
    const fakeResult = [{ id: 1, teamId: 'A' }]
    const fakeBuilder = makeFakeBuilder(
      'SELECT * FROM "todos" WHERE "todos"."team_id" = $1',
      ['A'],
      fakeResult,
    )

    const rawDb: any = {
      select: () => ({
        from: (_t: any) => fakeBuilder,
      }),
    }
    const wrappedDb = wrapReactiveDb(rawDb)

    const { ctx } = await runInReactiveContext(async () => {
      return await wrappedDb.select().from(fakeTable)
    })

    expect(ctx.reads).toHaveLength(1)
    expect(ctx.reads[0].table).toBe('todos')
    expect(ctx.reads[0].sql).toContain('team_id')
    expect(ctx.reads[0].params).toEqual(['A'])
  })

  it('WHERE SQL is captured after .where() and .orderBy() calls', async () => {
    const fakeResult = [{ id: 1 }]
    const fakeBuilder = makeFakeBuilder(
      'SELECT * FROM "todos" WHERE "todos"."team_id" = $1',
      ['A'],
      fakeResult,
    )

    const rawDb: any = {
      select: () => ({
        from: (_t: any) => fakeBuilder,
      }),
    }
    const wrappedDb = wrapReactiveDb(rawDb)

    const { ctx } = await runInReactiveContext(async () => {
      return await wrappedDb
        .select()
        .from(fakeTable)
        .where('cond')
        .orderBy('id')
    })

    expect(ctx.reads).toHaveLength(1)
    expect(ctx.reads[0].params).toEqual(['A'])
  })

  it('write captured with empty affectedRows when result is not an array', async () => {
    const rawDb: any = {
      insert: (_t: any) => ({
        values: (_vals: any) => ({
          toSQL: () => ({ sql: 'INSERT INTO todos', params: [] }),
          then: (res: any, _rej: any) =>
            Promise.resolve({ rowCount: 1 }).then(res, _rej),
        }),
      }),
    }
    const wrappedDb = wrapReactiveDb(rawDb)

    const { ctx } = await runInReactiveContext(async () => {
      return await wrappedDb.insert(fakeTable).values({ teamId: 'A' })
    })

    expect(ctx.writes).toHaveLength(1)
    expect(ctx.writes[0].table).toBe('todos')
    expect(ctx.writes[0].affectedRows).toEqual([])
  })

  it('write captured with rows when result is an array', async () => {
    const insertedRows = [{ id: 1, teamId: 'A' }]
    // The intermediate values() builder must be thenable (or have toSQL) so
    // wrapWrite can propagate through the chain to .returning().
    const returningBuilder: any = {
      toSQL: () => ({ sql: 'INSERT INTO todos RETURNING *', params: [] }),
      then: (res: any, _rej: any) =>
        Promise.resolve(insertedRows).then(res, _rej),
    }
    const valuesBuilder: any = {
      // Must be thenable so wrapWrite wraps it and can intercept .returning()
      then: (res: any, _rej: any) => Promise.resolve([]).then(res, _rej),
      returning: () => returningBuilder,
    }
    const rawDb: any = {
      insert: (_t: any) => ({
        values: (_vals: any) => valuesBuilder,
      }),
    }
    const wrappedDb = wrapReactiveDb(rawDb)

    const { ctx } = await runInReactiveContext(async () => {
      return await wrappedDb
        .insert(fakeTable)
        .values({ teamId: 'A' })
        .returning()
    })

    expect(ctx.writes).toHaveLength(1)
    expect(ctx.writes[0].table).toBe('todos')
    expect(ctx.writes[0].operation).toBe('insert')
    expect(ctx.writes[0].affectedRows).toEqual(insertedRows)
  })

  it('UPDATE: operation=update and updatedColumns captured from .set()', async () => {
    const updatedRows = [{ id: 1, done: true, teamId: 'A' }]
    const returningBuilder: any = {
      toSQL: () => ({
        sql: 'UPDATE todos SET done=$1 WHERE id=$2 RETURNING *',
        params: [],
      }),
      then: (res: any, _rej: any) =>
        Promise.resolve(updatedRows).then(res, _rej),
    }
    const whereBuilder: any = {
      then: (res: any, _rej: any) => Promise.resolve([]).then(res, _rej),
      returning: () => returningBuilder,
    }
    const setBuilder: any = {
      then: (res: any, _rej: any) => Promise.resolve([]).then(res, _rej),
      where: () => whereBuilder,
    }
    const rawDb: any = {
      update: (_t: any) => ({
        set: (_vals: any) => setBuilder,
      }),
    }
    const wrappedDb = wrapReactiveDb(rawDb)

    const { ctx } = await runInReactiveContext(async () => {
      return await wrappedDb
        .update(fakeTable)
        .set({ done: true })
        .where('id = $1')
        .returning()
    })

    expect(ctx.writes).toHaveLength(1)
    const write = ctx.writes[0]
    expect(write.table).toBe('todos')
    expect(write.operation).toBe('update')
    expect(
      write.operation === 'update' ? write.updatedColumns : undefined,
    ).toEqual(['done'])
    expect(write.affectedRows).toEqual(updatedRows)
  })
})

// ---------------------------------------------------------------------------
// SubscriptionManager
// ---------------------------------------------------------------------------

function makeEntry(
  channel: string,
  table: string,
  matchFn: (row: any) => boolean,
  referencedColumns: ReadonlySet<string> = new Set(),
): SubscriptionEntry {
  return {
    channel,
    predicate: {
      table,
      sql: '',
      params: [],
      columns: {},
      compiled: matchFn,
      referencedColumns,
    },
    requery: vi.fn().mockResolvedValue({ data: 'fresh' }),
  }
}

describe('SubscriptionManager', () => {
  it('register + activeChannels returns registered channels', () => {
    const publishFn = vi.fn().mockResolvedValue(undefined)
    const mgr = createSubscriptionManager(publishFn)
    mgr.register(makeEntry('ch-A', 'todos', () => true))
    mgr.register(makeEntry('ch-B', 'todos', () => true))
    const channels = mgr.activeChannels()
    expect(channels.has('ch-A')).toBe(true)
    expect(channels.has('ch-B')).toBe(true)
  })

  it('unregister removes the channel', () => {
    const publishFn = vi.fn().mockResolvedValue(undefined)
    const mgr = createSubscriptionManager(publishFn)
    mgr.register(makeEntry('ch-A', 'todos', () => true))
    mgr.unregister('ch-A')
    expect(mgr.activeChannels().has('ch-A')).toBe(false)
  })

  it('invalidate with matching row: requery and publish called', async () => {
    const publishFn = vi.fn().mockResolvedValue(undefined)
    const mgr = createSubscriptionManager(publishFn)
    const entry = makeEntry('ch-A', 'todos', (row) => row.teamId === 'A')
    mgr.register(entry)

    await mgr.invalidate([
      { table: 'todos', operation: 'insert', affectedRows: [{ teamId: 'A' }] },
    ])

    expect(entry.requery).toHaveBeenCalledTimes(1)
    // Server now publishes a single batch message to __realtime_batch__
    // data is the raw result of entry.requery() = { data: 'fresh' }
    expect(publishFn).toHaveBeenCalledWith(REALTIME_BATCH_CHANNEL, {
      type: 'realtime_batch',
      updates: [{ channel: 'ch-A', data: { data: 'fresh' } }],
    })
  })

  it('invalidate with non-matching row: requery not called', async () => {
    const publishFn = vi.fn().mockResolvedValue(undefined)
    const mgr = createSubscriptionManager(publishFn)
    const entry = makeEntry('ch-A', 'todos', (row) => row.teamId === 'A')
    mgr.register(entry)

    await mgr.invalidate([
      { table: 'todos', operation: 'insert', affectedRows: [{ teamId: 'B' }] },
    ])

    expect(entry.requery).not.toHaveBeenCalled()
    expect(publishFn).not.toHaveBeenCalled()
  })

  it('invalidate with affectedRows:[]: ALL channels on that table called (table-level fallback)', async () => {
    const publishFn = vi.fn().mockResolvedValue(undefined)
    const mgr = createSubscriptionManager(publishFn)
    const entryA = makeEntry('ch-A', 'todos', () => false)
    const entryB = makeEntry('ch-B', 'todos', () => false)
    mgr.register(entryA)
    mgr.register(entryB)

    await mgr.invalidate([
      { table: 'todos', operation: 'insert', affectedRows: [] },
    ])

    expect(entryA.requery).toHaveBeenCalledTimes(1)
    expect(entryB.requery).toHaveBeenCalledTimes(1)
  })

  it('per-channel requery errors are caught and other channels still processed', async () => {
    const publishFn = vi.fn().mockResolvedValue(undefined)
    const mgr = createSubscriptionManager(publishFn)

    const failingEntry = makeEntry('ch-fail', 'todos', () => true)
    ;(failingEntry.requery as any).mockRejectedValue(new Error('DB exploded'))
    const successEntry = makeEntry('ch-ok', 'todos', () => true)

    mgr.register(failingEntry)
    mgr.register(successEntry)

    // Should not throw
    await expect(
      mgr.invalidate([
        { table: 'todos', operation: 'insert', affectedRows: [] },
      ]),
    ).resolves.toBeUndefined()

    // Success entry still processed
    expect(successEntry.requery).toHaveBeenCalledTimes(1)
  })

  it('second register for same channel overwrites the entry', async () => {
    const publishFn = vi.fn().mockResolvedValue(undefined)
    const mgr = createSubscriptionManager(publishFn)

    const entryV1 = makeEntry('ch-A', 'todos', (row) => row.teamId === 'OLD')
    const entryV2 = makeEntry('ch-A', 'todos', (row) => row.teamId === 'NEW')

    mgr.register(entryV1)
    mgr.register(entryV2)

    // V2 matches NEW, V1 matched OLD
    await mgr.invalidate([
      {
        table: 'todos',
        operation: 'insert',
        affectedRows: [{ teamId: 'NEW' }],
      },
    ])

    expect(entryV2.requery).toHaveBeenCalledTimes(1)
    expect(entryV1.requery).not.toHaveBeenCalled()
  })

  // ------- Conservative UPDATE invalidation -----------------------------------

  it('UPDATE: non-matching post-update row still invalidates if predicate column was set', async () => {
    // Scenario: toggling a todo from done=false to done=true.
    // ch-active filters done=false; post-update row has done=true → predicate doesn't match.
    // But because 'done' is in both updatedColumns and referencedColumns, we
    // conservatively re-run to let subscribers see the item disappear.
    const publishFn = vi.fn().mockResolvedValue(undefined)
    const mgr = createSubscriptionManager(publishFn)

    const activeEntry = makeEntry(
      'ch-active',
      'todos',
      (row) => row.done === false,
      new Set(['done']),
    )
    mgr.register(activeEntry)

    await mgr.invalidate([
      {
        table: 'todos',
        operation: 'update',
        updatedColumns: ['done'],
        affectedRows: [{ id: '1', done: true }], // post-update: done is now true
      },
    ])

    expect(activeEntry.requery).toHaveBeenCalledTimes(1)
  })

  it('UPDATE: non-matching post-update row does NOT invalidate if predicate column was not set', async () => {
    // Scenario: updating 'title' on a todo that is done=true.
    // ch-active filters done=false; the row doesn't match. 'title' is NOT in referencedColumns.
    // → no invalidation.
    const publishFn = vi.fn().mockResolvedValue(undefined)
    const mgr = createSubscriptionManager(publishFn)

    const activeEntry = makeEntry(
      'ch-active',
      'todos',
      (row) => row.done === false,
      new Set(['done']),
    )
    mgr.register(activeEntry)

    await mgr.invalidate([
      {
        table: 'todos',
        operation: 'update',
        updatedColumns: ['title'], // 'done' not changed
        affectedRows: [{ id: '1', done: true, title: 'New title' }],
      },
    ])

    expect(activeEntry.requery).not.toHaveBeenCalled()
    expect(publishFn).not.toHaveBeenCalled()
  })

  it('INSERT: non-matching new row does NOT trigger conservative invalidation', async () => {
    // Conservative check only applies to UPDATEs — a new insert with done=true
    // should not invalidate the done=false subscription.
    const publishFn = vi.fn().mockResolvedValue(undefined)
    const mgr = createSubscriptionManager(publishFn)

    const activeEntry = makeEntry(
      'ch-active',
      'todos',
      (row) => row.done === false,
      new Set(['done']),
    )
    mgr.register(activeEntry)

    await mgr.invalidate([
      {
        table: 'todos',
        operation: 'insert',
        affectedRows: [{ id: '2', done: true }], // new row, done=true
      },
    ])

    expect(activeEntry.requery).not.toHaveBeenCalled()
    expect(publishFn).not.toHaveBeenCalled()
  })

  it('UPDATE with empty updatedColumns: conservative check does not fire', async () => {
    // updatedColumns: [] means we could not determine which columns changed
    // (e.g. escape-hatch manual write). Conservative check is skipped because
    // [].some(...) is always false — falls through to predicate-only matching.
    const publishFn = vi.fn().mockResolvedValue(undefined)
    const mgr = createSubscriptionManager(publishFn)

    const activeEntry = makeEntry(
      'ch-active',
      'todos',
      (row) => row.done === false,
      new Set(['done']),
    )
    mgr.register(activeEntry)

    await mgr.invalidate([
      {
        table: 'todos',
        operation: 'update',
        updatedColumns: [],
        affectedRows: [{ id: '1', done: true }],
      },
    ])

    expect(activeEntry.requery).not.toHaveBeenCalled()
    expect(publishFn).not.toHaveBeenCalled()
  })

  it('two queries differing only in a RANGE predicate get distinct channels; a write matching one invalidates only it', async () => {
    const dkCols = {
      teamId: { name: 'team_id' },
      priority: { name: 'priority' },
    }
    const publishFn = vi.fn().mockResolvedValue(undefined)
    const mgr = createSubscriptionManager(publishFn)

    // Both queries share the same top-level equality (team_id = $1) so the OLD
    // lossy derivation collided them onto one channel; the full-SQL discriminator
    // now separates them.
    const allChannel = deriveChannelKey(
      'todos',
      'SELECT * FROM "todos" WHERE "todos"."team_id" = $1',
      ['A'],
      dkCols,
    )
    const highChannel = deriveChannelKey(
      'todos',
      'SELECT * FROM "todos" WHERE "todos"."team_id" = $1 AND "todos"."priority" > $2',
      ['A', 5],
      dkCols,
    )
    expect(allChannel).not.toBe(highChannel)

    // "all team A" matches any team-A row; "high priority" needs priority > 5.
    const allEntry = makeEntry(allChannel, 'todos', (row) => row.teamId === 'A')
    const highEntry = makeEntry(
      highChannel,
      'todos',
      (row) => row.teamId === 'A' && (row.priority as number) > 5,
    )
    mgr.register(allEntry)
    mgr.register(highEntry)

    // Both entries survive — distinct channels, neither overwrote the other.
    expect(mgr.activeChannels().has(allChannel)).toBe(true)
    expect(mgr.activeChannels().has(highChannel)).toBe(true)

    // Insert a LOW-priority team-A row: matches "all" but not "high priority".
    await mgr.invalidate([
      {
        table: 'todos',
        operation: 'insert',
        affectedRows: [{ teamId: 'A', priority: 1 }],
      },
    ])

    expect(allEntry.requery).toHaveBeenCalledTimes(1)
    expect(highEntry.requery).not.toHaveBeenCalled()
  })

  it('two byte-identical queries derive the same channel (last register wins, identical requery semantics)', () => {
    const dkCols = { teamId: { name: 'team_id' } }
    const sql = 'SELECT * FROM "todos" WHERE "todos"."team_id" = $1'
    const chA = deriveChannelKey('todos', sql, ['A'], dkCols)
    const chB = deriveChannelKey('todos', sql, ['A'], dkCols)
    expect(chA).toBe(chB)
  })
})

// ---------------------------------------------------------------------------
// extractEqualityConditions
// ---------------------------------------------------------------------------

describe('extractEqualityConditions', () => {
  const eqCols = { teamId: { name: 'team_id' }, done: { name: 'done' } }

  it('simple col = $1 extracts the equality', () => {
    const result = extractEqualityConditions(
      '"todos"."team_id" = $1',
      ['A'],
      eqCols,
    )
    expect(result).toEqual({ teamId: 'A' })
  })

  it('col1 = $1 AND col2 = $2 extracts both', () => {
    const result = extractEqualityConditions(
      '"todos"."team_id" = $1 AND "todos"."done" = $2',
      ['A', true],
      eqCols,
    )
    expect(result).toEqual({ teamId: 'A', done: true })
  })

  it('col1 = $1 OR col2 = $2 returns {} (not safe to extract)', () => {
    const result = extractEqualityConditions(
      '"todos"."team_id" = $1 OR "todos"."done" = $2',
      ['A', true],
      eqCols,
    )
    expect(result).toEqual({})
  })

  it('range col > $1 returns {}', () => {
    const result = extractEqualityConditions(
      '"todos"."team_id" > $1',
      ['A'],
      eqCols,
    )
    expect(result).toEqual({})
  })

  it('mixed AND+OR at top-level returns {}', () => {
    // This parses as OR at top level: (A AND B) OR C
    const result = extractEqualityConditions(
      '"todos"."team_id" = $1 AND "todos"."done" = $2 OR "todos"."team_id" = $3',
      ['A', true, 'B'],
      eqCols,
    )
    // Top-level is OR, so result should be empty
    expect(result).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// deriveChannelKey
// ---------------------------------------------------------------------------

describe('deriveChannelKey', () => {
  const dkCols = { teamId: { name: 'team_id' } }

  it('equality conditions → serializeKey([table, conditions]) prefix + :q=<hash> discriminator', () => {
    const key = deriveChannelKey(
      'todos',
      '"todos"."team_id" = $1',
      ['A'],
      dkCols,
    )
    // Human-readable prefix preserved for debuggability.
    expect(
      key.startsWith(serializeKey(['todos', { teamId: 'A' }]) + ':q='),
    ).toBe(true)
  })

  it('no equality conditions → serializeKey([table]) prefix + :q=<hash> discriminator', () => {
    const key = deriveChannelKey(
      'todos',
      '"todos"."team_id" > $1',
      ['A'],
      dkCols,
    )
    expect(key.startsWith(serializeKey(['todos']) + ':q=')).toBe(true)
  })

  it('undefined whereSQL (matches escape hatch) → bare serializeKey([table]), no discriminator', () => {
    const key = deriveChannelKey('todos', undefined, [], dkCols)
    expect(key).toBe(serializeKey(['todos']))
  })

  it('byte-identical queries derive the SAME channel (deterministic)', () => {
    const a = deriveChannelKey('todos', '"todos"."team_id" = $1', ['A'], dkCols)
    const b = deriveChannelKey('todos', '"todos"."team_id" = $1', ['A'], dkCols)
    expect(a).toBe(b)
  })

  it('a range predicate added to an equality query yields a DIFFERENT channel (lossy-collision fixed)', () => {
    // Both share the same top-level equality prefix (team_id = $1), so the OLD
    // derivation collided them. The full-SQL discriminator now separates them.
    const eqOnly = deriveChannelKey(
      'todos',
      'SELECT * FROM "todos" WHERE "todos"."team_id" = $1',
      ['A'],
      dkCols,
    )
    const eqPlusRange = deriveChannelKey(
      'todos',
      'SELECT * FROM "todos" WHERE "todos"."team_id" = $1 AND "todos"."priority" > $2',
      ['A', 5],
      dkCols,
    )
    expect(eqOnly).not.toBe(eqPlusRange)
    // Both still carry the shared human-readable prefix.
    expect(
      eqOnly.startsWith(serializeKey(['todos', { teamId: 'A' }]) + ':q='),
    ).toBe(true)
    expect(
      eqPlusRange.startsWith(serializeKey(['todos', { teamId: 'A' }]) + ':q='),
    ).toBe(true)
  })

  it('differing SELECT columns (same WHERE) yield DIFFERENT channels (shape difference)', () => {
    const star = deriveChannelKey(
      'todos',
      'SELECT * FROM "todos" WHERE "todos"."team_id" = $1',
      ['A'],
      dkCols,
    )
    const projected = deriveChannelKey(
      'todos',
      'SELECT "todos"."id", "todos"."title" FROM "todos" WHERE "todos"."team_id" = $1',
      ['A'],
      dkCols,
    )
    expect(star).not.toBe(projected)
  })

  it('differing bound params yield DIFFERENT channels', () => {
    const a = deriveChannelKey('todos', '"todos"."team_id" = $1', ['A'], dkCols)
    const b = deriveChannelKey('todos', '"todos"."team_id" = $1', ['B'], dkCols)
    expect(a).not.toBe(b)
  })
})

// ---------------------------------------------------------------------------
// extractReferencedColumns
// ---------------------------------------------------------------------------

describe('extractReferencedColumns', () => {
  const cols = {
    teamId: { name: 'team_id' },
    done: { name: 'done' },
    title: { name: 'title' },
  }

  it('single equality → returns that column', () => {
    const refs = extractReferencedColumns('"todos"."team_id" = $1', cols)
    expect(refs).toEqual(new Set(['teamId']))
  })

  it('AND condition → returns both columns', () => {
    const refs = extractReferencedColumns(
      '"todos"."team_id" = $1 AND "todos"."done" = $2',
      cols,
    )
    expect(refs).toEqual(new Set(['teamId', 'done']))
  })

  it('empty sql → returns empty set', () => {
    const refs = extractReferencedColumns('', cols)
    expect(refs).toEqual(new Set())
  })

  it('full SELECT sql → extracts refs from WHERE clause only', () => {
    const refs = extractReferencedColumns(
      'SELECT * FROM "todos" WHERE "todos"."done" = $1',
      cols,
    )
    expect(refs).toEqual(new Set(['done']))
  })
})

// ---------------------------------------------------------------------------
// createLoader
// ---------------------------------------------------------------------------

describe('createLoader', () => {
  function makeMockMgr() {
    return {
      register: vi.fn(),
      unregister: vi.fn(),
      invalidate: vi.fn().mockResolvedValue(undefined),
      activeChannels: vi.fn().mockReturnValue(new Set()),
    } as any
  }

  it('auto-captures predicate + channel from reactive proxy and registers', async () => {
    const mockMgr = makeMockMgr()
    const fakeResult = [{ id: 1, teamId: 'A' }]
    const fakeBuilder = makeFakeBuilder(
      'SELECT * FROM "todos" WHERE "todos"."team_id" = $1',
      ['A'],
      fakeResult,
    )

    const rawDb: any = { select: () => ({ from: (_t: any) => fakeBuilder }) }
    const wrappedDb = wrapReactiveDb(rawDb)

    const loader = createLoader({
      subscriptionManager: mockMgr,
      query: async () => await wrappedDb.select().from(fakeTable),
    })

    const result = await loader.load()

    expect(result).toEqual(fakeResult)
    expect(mockMgr.register).toHaveBeenCalledTimes(1)
    const registered = mockMgr.register.mock.calls[0][0]
    expect(registered.predicate.table).toBe('todos')
  })

  it('channel key auto-derived as serializeKey([table, {teamId}]) from WHERE', async () => {
    const mockMgr = makeMockMgr()
    const fakeBuilder = makeFakeBuilder(
      'SELECT * FROM "todos" WHERE "todos"."team_id" = $1',
      ['A'],
      [],
    )

    const rawDb: any = { select: () => ({ from: (_t: any) => fakeBuilder }) }
    const wrappedDb = wrapReactiveDb(rawDb)

    const loader = createLoader({
      subscriptionManager: mockMgr,
      query: async () => await wrappedDb.select().from(fakeTable),
    })

    await loader.load()

    const registered = mockMgr.register.mock.calls[0][0]
    // Prefix is the human-readable equality key; the :q=<hash> discriminator
    // (derived from the full SQL) is appended to keep distinct queries distinct.
    expect(
      registered.channel.startsWith(
        serializeKey(['todos', { teamId: 'A' }]) + ':q=',
      ),
    ).toBe(true)
  })

  it('explicit channel override overrides auto-derivation', async () => {
    const mockMgr = makeMockMgr()
    const fakeBuilder = makeFakeBuilder(
      'SELECT * FROM "todos" WHERE "todos"."team_id" = $1',
      ['A'],
      [],
    )

    const rawDb: any = { select: () => ({ from: (_t: any) => fakeBuilder }) }
    const wrappedDb = wrapReactiveDb(rawDb)

    const loader = createLoader({
      subscriptionManager: mockMgr,
      channel: 'my-explicit-channel',
      query: async () => await wrappedDb.select().from(fakeTable),
    })

    await loader.load()

    const registered = mockMgr.register.mock.calls[0][0]
    expect(registered.channel).toBe('my-explicit-channel')
  })

  it('explicit predicate.matches escape hatch registers correctly', async () => {
    const mockMgr = makeMockMgr()
    const matchesFn = vi.fn().mockReturnValue(true)

    const loader = createLoader({
      subscriptionManager: mockMgr,
      channel: 'explicit-ch',
      query: () => Promise.resolve([{ id: 1 }]),
      predicate: { table: 'todos', matches: matchesFn },
    })

    const result = await loader.load()
    expect(result).toEqual([{ id: 1 }])
    expect(mockMgr.register).toHaveBeenCalledTimes(1)
    const registered = mockMgr.register.mock.calls[0][0]
    expect(registered.predicate.compiled).toBe(matchesFn)
    expect(registered.channel).toBe('explicit-ch')
  })

  it('predicate.where escape hatch: uses toSQL() to build predicate without wrappedDb', async () => {
    const mockMgr = makeMockMgr()

    const fakeWhere = {
      toSQL: () => ({
        sql: '"todos"."team_id" = $1',
        params: ['team-42'] as Array<unknown>,
      }),
    }

    const loader = createLoader({
      subscriptionManager: mockMgr,
      channel: 'explicit-where-ch',
      query: () => Promise.resolve([{ id: 1 }]),
      predicate: {
        table: 'todos',
        where: fakeWhere,
        columns: todosColumns,
      },
    })

    const result = await loader.load()
    expect(result).toEqual([{ id: 1 }])
    expect(mockMgr.register).toHaveBeenCalledTimes(1)
    const registered = mockMgr.register.mock.calls[0][0]
    expect(registered.channel).toBe('explicit-where-ch')
    expect(registered.predicate.table).toBe('todos')
    // Compiled predicate should work correctly based on the toSQL output
    expect(registered.predicate.compiled({ teamId: 'team-42' })).toBe(true)
    expect(registered.predicate.compiled({ teamId: 'other' })).toBe(false)
  })

  it('predicate.where escape hatch: auto-derives channel from WHERE equality conditions', async () => {
    const mockMgr = makeMockMgr()

    const fakeWhere = {
      toSQL: () => ({
        sql: '"todos"."team_id" = $1',
        params: ['team-42'] as Array<unknown>,
      }),
    }

    const loader = createLoader({
      subscriptionManager: mockMgr,
      query: () => Promise.resolve([{ id: 1 }]),
      predicate: {
        table: 'todos',
        where: fakeWhere,
        columns: todosColumns,
      },
    })

    await loader.load()

    const registered = mockMgr.register.mock.calls[0][0]
    expect(
      registered.channel.startsWith(
        serializeKey(['todos', { teamId: 'team-42' }]) + ':q=',
      ),
    ).toBe(true)
  })

  it('no-WHERE auto path: query without .where() registers table-level subscription with match-all predicate', async () => {
    const mockMgr = makeMockMgr()
    const fakeResult = [{ id: 1 }]
    // Builder with no WHERE clause in SQL
    const fakeBuilder = makeFakeBuilder('SELECT * FROM "todos"', [], fakeResult)

    const rawDb: any = { select: () => ({ from: (_t: any) => fakeBuilder }) }
    const wrappedDb = wrapReactiveDb(rawDb)

    const loader = createLoader({
      subscriptionManager: mockMgr,
      query: async () => await wrappedDb.select().from(fakeTable),
    })

    const result = await loader.load()

    expect(result).toEqual(fakeResult)
    expect(mockMgr.register).toHaveBeenCalledTimes(1)
    const registered = mockMgr.register.mock.calls[0][0]
    expect(registered.predicate.table).toBe('todos')
    // channel is table-level prefix + full-SQL discriminator: two whole-table
    // reads that differ in SELECT/ORDER BY get distinct channels.
    expect(registered.channel.startsWith(serializeKey(['todos']) + ':q=')).toBe(
      true,
    )
    // predicate should match any row (match-all)
    expect(registered.predicate.compiled({ teamId: 'anything' })).toBe(true)
    expect(registered.predicate.compiled({})).toBe(true)
  })

  it('throws when no predicate available and query does not use reactive proxy', async () => {
    const mockMgr = makeMockMgr()

    const loader = createLoader({
      subscriptionManager: mockMgr,
      query: () => Promise.resolve([{ id: 1 }]), // plain query, no wrapReactiveDb
    })

    await expect(loader.load()).rejects.toThrow(/no read set captured/)
  })

  it('returns the query result', async () => {
    const mockMgr = makeMockMgr()
    const expectedResult = [{ id: 42, teamId: 'Z' }]
    const fakeBuilder = makeFakeBuilder(
      'SELECT * FROM "todos" WHERE "todos"."team_id" = $1',
      ['Z'],
      expectedResult,
    )

    const rawDb: any = { select: () => ({ from: (_t: any) => fakeBuilder }) }
    const wrappedDb = wrapReactiveDb(rawDb)

    const loader = createLoader({
      subscriptionManager: mockMgr,
      query: async () => await wrappedDb.select().from(fakeTable),
    })

    const result = await loader.load()
    expect(result).toEqual(expectedResult)
  })
})

// ---------------------------------------------------------------------------
// createMutationHandler
// ---------------------------------------------------------------------------

describe('createMutationHandler', () => {
  function makeMockMgr() {
    return {
      register: vi.fn(),
      unregister: vi.fn(),
      invalidate: vi.fn().mockResolvedValue(undefined),
      activeChannels: vi.fn().mockReturnValue(new Set()),
    } as any
  }

  it('auto-captures writes from reactive proxy and invalidates', async () => {
    const mockMgr = makeMockMgr()
    const insertedRows = [{ id: 1, teamId: 'A' }]

    const returningBuilder: any = {
      toSQL: () => ({ sql: 'INSERT INTO todos RETURNING *', params: [] }),
      then: (res: any, _rej: any) =>
        Promise.resolve(insertedRows).then(res, _rej),
    }
    const valuesBuilder: any = {
      then: (res: any, _rej: any) => Promise.resolve([]).then(res, _rej),
      returning: () => returningBuilder,
    }
    const rawDb: any = {
      insert: (_t: any) => ({
        values: (_vals: any) => valuesBuilder,
      }),
    }
    const wrappedDb = wrapReactiveDb(rawDb)

    const mutation = createMutationHandler({
      subscriptionManager: mockMgr,
      mutation: async (_input: void) => {
        return await wrappedDb
          .insert(fakeTable)
          .values({ teamId: 'A' })
          .returning()
      },
    })

    await mutation.mutate(undefined)

    expect(mockMgr.invalidate).toHaveBeenCalledTimes(1)
    const writes = mockMgr.invalidate.mock.calls[0][0]
    expect(writes).toHaveLength(1)
    expect(writes[0].table).toBe('todos')
    expect(writes[0].affectedRows).toEqual(insertedRows)
  })

  it('options.writes override auto-captured writes', async () => {
    const mockMgr = makeMockMgr()

    const explicitWrites = [
      {
        table: 'projects',
        operation: 'insert' as const,
        affectedRows: [{ id: 99 }],
      },
    ]

    const mutation = createMutationHandler({
      subscriptionManager: mockMgr,
      mutation: (_input: void) => Promise.resolve({ success: true }),
      writes: (_result) => explicitWrites,
    })

    await mutation.mutate(undefined)

    expect(mockMgr.invalidate).toHaveBeenCalledWith(explicitWrites)
  })
})

// ---------------------------------------------------------------------------
// createReactiveQueries + createStartHandler — integration
//
// The reactive engine now lives in @realtimejs/reactive-drizzle and
// composes with the transport handler from @realtimejs/preset-start.
// These tests preserve the original end-to-end coverage of query/mutation/
// invalidate/subscriptionManager, now exercised through createReactiveQueries.
// ---------------------------------------------------------------------------

describe('createReactiveQueries — reactive integration', () => {
  function makeReactiveDb(queryResult: Array<any>, insertResult: Array<any>) {
    const returningBuilder: any = {
      toSQL: () => ({ sql: 'INSERT INTO todos RETURNING *', params: [] }),
      then: (res: any, _rej: any) =>
        Promise.resolve(insertResult).then(res, _rej),
    }
    const valuesBuilder: any = {
      then: (res: any, _rej: any) => Promise.resolve([]).then(res, _rej),
      returning: () => returningBuilder,
    }
    const rawDb: any = {
      select: () => ({
        from: (_t: any) =>
          makeFakeBuilder(
            'SELECT * FROM "todos" WHERE "todos"."team_id" = $1',
            ['A'],
            queryResult,
          ),
      }),
      insert: (_t: any) => ({
        values: (_vals: any) => valuesBuilder,
      }),
    }
    return wrapReactiveDb(rawDb)
  }

  it('query() + mutation() end-to-end: only matching channel invalidated', async () => {
    const handler = createStartHandler({})
    const reactive = createReactiveQueries({ publish: handler.publish })
    const wrappedDb = makeReactiveDb(
      [{ id: 1, teamId: 'A' }],
      [{ id: 2, teamId: 'A' }],
    )

    // Register subscription via the new factory API
    const getRows = reactive.query(
      async () => await wrappedDb.select().from(fakeTable),
    )
    await getRows(undefined)

    const expectedPrefix = serializeKey(['todos', { teamId: 'A' }]) + ':q='
    expect(
      Array.from(reactive.subscriptionManager.activeChannels()).some((c) =>
        c.startsWith(expectedPrefix),
      ),
    ).toBe(true)

    // Trigger mutation via the new factory API
    const invalidateSpy = vi.spyOn(reactive.subscriptionManager, 'invalidate')

    const doInsert = reactive.mutation(
      async () =>
        await wrappedDb.insert(fakeTable).values({ teamId: 'A' }).returning(),
    )
    await doInsert(undefined)

    expect(invalidateSpy).toHaveBeenCalledTimes(1)
    const writes = invalidateSpy.mock.calls[0][0]
    expect(writes[0].table).toBe('todos')
    expect(writes[0].affectedRows).toEqual([{ id: 2, teamId: 'A' }])
  })

  it('affectedRows:[] write invalidates all subscriptions on that table', async () => {
    const published: Array<{ ch: string; data: unknown }> = []
    const backend = {
      publish: vi.fn((ch: string, data: unknown) => {
        published.push({ ch, data })
        return Promise.resolve()
      }),
    }
    const handler2 = createStartHandler({ backend })
    const reactive2 = createReactiveQueries({ publish: handler2.publish })
    const wrappedDb2 = makeReactiveDb([{ id: 1, teamId: 'A' }], [])
    const getRows2 = reactive2.query(
      async () => await wrappedDb2.select().from(fakeTable),
    )
    await getRows2(undefined)

    await reactive2.invalidate([
      { table: 'todos', operation: 'insert', affectedRows: [] },
    ])

    // Server now publishes a single batch message to __realtime_batch__
    const batchMsg = published.find((p) => p.ch === REALTIME_BATCH_CHANNEL)
    expect(batchMsg).toBeDefined()
    const updates = (
      batchMsg!.data as { type: string; updates: Array<{ channel: string }> }
    ).updates
    // The update channel should contain 'todos'
    expect(updates.some((u) => u.channel.includes('todos'))).toBe(true)
  })

  it('reactive.invalidate([{ table, affectedRows }]) works directly', async () => {
    const handler = createStartHandler({})
    const reactive = createReactiveQueries({ publish: handler.publish })
    const wrappedDb = makeReactiveDb([{ id: 1, teamId: 'A' }], [])

    const getRows = reactive.query(
      async () => await wrappedDb.select().from(fakeTable),
    )
    await getRows(undefined)

    // Direct invalidation with matching rows
    const invalidateSpy = vi.spyOn(reactive.subscriptionManager, 'invalidate')
    await reactive.invalidate([
      { table: 'todos', operation: 'insert', affectedRows: [{ teamId: 'A' }] },
    ])

    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('reactive.subscriptionManager is an instance of SubscriptionManager', () => {
    const reactive = createReactiveQueries({})
    // Check that subscriptionManager has the expected interface
    expect(reactive.subscriptionManager).toBeDefined()
    expect(typeof reactive.subscriptionManager.register).toBe('function')
    expect(typeof reactive.subscriptionManager.unregister).toBe('function')
    expect(typeof reactive.subscriptionManager.invalidate).toBe('function')
    expect(typeof reactive.subscriptionManager.activeChannels).toBe('function')
  })

  it('onChannelEmpty unregisters channels but never the batch channel', () => {
    const reactive = createReactiveQueries({})
    reactive.subscriptionManager.register(
      makeEntry('ch-A', 'todos', () => true),
    )
    reactive.subscriptionManager.register(
      makeEntry(REALTIME_BATCH_CHANNEL, 'todos', () => true),
    )

    reactive.onChannelEmpty('ch-A')
    expect(reactive.subscriptionManager.activeChannels().has('ch-A')).toBe(
      false,
    )

    // The batch channel must survive — it's always needed for invalidation.
    reactive.onChannelEmpty(REALTIME_BATCH_CHANNEL)
    expect(
      reactive.subscriptionManager.activeChannels().has(REALTIME_BATCH_CHANNEL),
    ).toBe(true)
  })

  it('bindPublish injects publish after construction', async () => {
    const published: Array<{ ch: string; data: unknown }> = []
    const handler = createStartHandler({
      backend: {
        publish: (ch: string, data: unknown) => {
          published.push({ ch, data })
          return Promise.resolve()
        },
      },
    })
    // Construct the reactive engine BEFORE the handler's publish is wired in.
    const reactive = createReactiveQueries({})
    const wrappedDb = makeReactiveDb([{ id: 1, teamId: 'A' }], [])
    const getRows = reactive.query(
      async () => await wrappedDb.select().from(fakeTable),
    )
    await getRows(undefined)

    // Inject publish, then invalidate — the batch message should fan out.
    reactive.bindPublish(handler.publish)
    await reactive.invalidate([
      { table: 'todos', operation: 'insert', affectedRows: [] },
    ])

    expect(published.some((p) => p.ch === REALTIME_BATCH_CHANNEL)).toBe(true)
  })

  it('query without .where() registers table-level subscription and does not throw', async () => {
    const reactive = createReactiveQueries({})
    const fakeResult = [{ id: 1 }]
    const fakeBuilder = makeFakeBuilder('SELECT * FROM "todos"', [], fakeResult)

    const rawDb: any = {
      select: () => ({
        from: (_t: any) => fakeBuilder,
      }),
    }
    const wrappedDb = wrapReactiveDb(rawDb)

    // Should not throw even though there is no WHERE clause
    const getRows = reactive.query(
      async () => await wrappedDb.select().from(fakeTable),
    )
    const { data } = await getRows(undefined)

    expect(data).toEqual(fakeResult)
    const expectedPrefix = serializeKey(['todos']) + ':q='
    expect(
      Array.from(reactive.subscriptionManager.activeChannels()).some((c) =>
        c.startsWith(expectedPrefix),
      ),
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Pluggable engine seam: a custom ReactiveQueryEngine (no Drizzle/pgsql at all)
// drives createReactiveQueries' query/mutation/invalidate orchestration.
// ---------------------------------------------------------------------------

describe('createReactiveQueries — custom engine seam', () => {
  // A trivial engine with ZERO Drizzle/pgsql involvement: it derives the read
  // metadata from a plain object the queryFn returns, and captures writes from
  // a plain object the mutationFn returns. This proves the orchestration is
  // vendor-neutral and depends only on the ReactiveQueryEngine interface.
  function makeFakeEngine(): ReactiveQueryEngine {
    return {
      async captureReads<T>(
        queryFn: () => Promise<T>,
        channelOverride?: any,
      ): Promise<{ result: T; reads: ReadonlyArray<CapturedRead> }> {
        const result = (await queryFn()) as any
        const channel =
          channelOverride !== undefined
            ? typeof channelOverride === 'string'
              ? channelOverride
              : serializeKey(channelOverride)
            : `fake:${result.table}:${result.teamId}`
        return {
          result: result.rows as T,
          reads: [
            {
              table: result.table,
              compiled: (row: Record<string, unknown>) =>
                row['teamId'] === result.teamId,
              referencedColumns: new Set(['teamId']),
              channel,
            },
          ],
        }
      },
      async captureWrites<T>(
        mutationFn: () => Promise<T>,
      ): Promise<{ result: T; writes: ReadonlyArray<WriteDescriptor> }> {
        const result = (await mutationFn()) as any
        return {
          result: result.result as T,
          writes: result.writes as ReadonlyArray<WriteDescriptor>,
        }
      },
    }
  }

  it('drives query/mutation/invalidate without any Drizzle involvement', async () => {
    const published: Array<{ ch: string; data: unknown }> = []
    const handler = createStartHandler({
      backend: {
        publish: (ch: string, data: unknown) => {
          published.push({ ch, data })
          return Promise.resolve()
        },
      },
    })

    const reactive = createReactiveQueries({
      engine: makeFakeEngine(),
      publish: handler.publish,
    })

    // query() registers a subscription whose channel comes from the fake engine.
    const getRows = reactive.query((args: { teamId: string }) =>
      Promise.resolve({
        table: 'widgets',
        teamId: args.teamId,
        rows: [{ id: 1, teamId: args.teamId }],
      }),
    )
    const { data, channel } = await getRows({ teamId: 'A' })

    expect(data).toEqual([{ id: 1, teamId: 'A' }])
    expect(channel).toBe('fake:widgets:A')
    expect(reactive.subscriptionManager.activeChannels().has(channel)).toBe(
      true,
    )

    // mutation() captures writes via the engine and invalidates the matching sub.
    const doInsert = reactive.mutation(() =>
      Promise.resolve({
        result: 'ok',
        writes: [
          {
            table: 'widgets',
            operation: 'insert' as const,
            affectedRows: [{ id: 2, teamId: 'A' }],
          },
        ],
      }),
    )
    const mutationResult = await doInsert(undefined)
    expect(mutationResult).toBe('ok')

    // The matching channel was re-queried and a batch message published.
    const batchMsg = published.find((p) => p.ch === REALTIME_BATCH_CHANNEL)
    expect(batchMsg).toBeDefined()
    const updates = (batchMsg!.data as { updates: Array<{ channel: string }> })
      .updates
    expect(updates.some((u) => u.channel === 'fake:widgets:A')).toBe(true)
  })

  it('a non-matching write does not invalidate the subscription', async () => {
    const published: Array<{ ch: string; data: unknown }> = []
    const handler = createStartHandler({
      backend: {
        publish: (ch: string, data: unknown) => {
          published.push({ ch, data })
          return Promise.resolve()
        },
      },
    })
    const reactive = createReactiveQueries({
      engine: makeFakeEngine(),
      publish: handler.publish,
    })
    const getRows = reactive.query((args: { teamId: string }) =>
      Promise.resolve({
        table: 'widgets',
        teamId: args.teamId,
        rows: [],
      }),
    )
    const { channel } = await getRows({ teamId: 'A' })

    const invalidateSpy = vi.spyOn(reactive.subscriptionManager, 'invalidate')
    const doInsert = reactive.mutation(() =>
      Promise.resolve({
        result: undefined,
        writes: [
          {
            table: 'widgets',
            operation: 'insert' as const,
            affectedRows: [{ id: 9, teamId: 'B' }], // different team — no match
          },
        ],
      }),
    )
    await doInsert(undefined)

    // invalidate is always called with the writes; but no channel matched, so
    // nothing should be re-queried for team A.
    expect(invalidateSpy).toHaveBeenCalledTimes(1)

    // Crucially: NO batch message must be published on a non-matching write.
    // Capturing published messages (like the matching seam test) means this
    // would actually catch an erroneous invalidation, not just a spy count.
    expect(published.some((p) => p.ch === REALTIME_BATCH_CHANNEL)).toBe(false)
    const allPublishedChannels = published.flatMap((p) => {
      if (p.ch !== REALTIME_BATCH_CHANNEL) return [p.ch]
      const msg = p.data as { updates: Array<{ channel: string }> }
      return msg.updates.map((u) => u.channel)
    })
    expect(allPublishedChannels).not.toContain(channel)
  })
})

// ---------------------------------------------------------------------------
// Multi-table reactive query (WP-C): a query that reads TWO tables in separate
// select().from() calls must register/return BOTH channels and stay live to
// writes on either table — but not to writes on an unrelated table.
// ---------------------------------------------------------------------------

describe('createReactiveQueries — multi-table query (WP-C)', () => {
  const projectsColumns = { teamId: { name: 'team_id' } }
  const fakeProjects = makeFakeTable('projects', projectsColumns)

  // A wrapped db whose select().from(table) returns a builder whose SQL
  // matches the table passed in. The reactive proxy reads the table name from
  // the table object (getTableName), and the WHERE SQL from toSQL().
  function makeMultiTableDb() {
    const rawDb: any = {
      select: () => ({
        from: (t: any) => {
          const name = t[DRIZZLE_NAME_SYM] as string
          return makeFakeBuilder(
            `SELECT * FROM "${name}" WHERE "${name}"."team_id" = $1`,
            ['A'],
            [{ id: 1, teamId: 'A', _from: name }],
          )
        },
      }),
    }
    return wrapReactiveDb(rawDb)
  }

  function makeMultiTableQuery(
    reactive: ReturnType<typeof createReactiveQueries>,
  ) {
    const db = makeMultiTableDb()
    return reactive.query(async () => {
      const todos = await db.select().from(fakeTable)
      const projects = await db.select().from(fakeProjects)
      return { todos, projects }
    })
  }

  it('returns and registers BOTH channels', async () => {
    const reactive = createReactiveQueries({})
    const { channel, channels } = await makeMultiTableQuery(reactive)(undefined)

    const todosPrefix = serializeKey(['todos', { teamId: 'A' }]) + ':q='
    const projectsPrefix = serializeKey(['projects', { teamId: 'A' }]) + ':q='

    // channel is back-compat (channels[0]); channels lists every read. Each now
    // carries the full-SQL discriminator suffix appended to its prefix.
    expect(channel.startsWith(todosPrefix)).toBe(true)
    expect(channels).toHaveLength(2)
    expect(channels![0].startsWith(todosPrefix)).toBe(true)
    expect(channels![1].startsWith(projectsPrefix)).toBe(true)

    const active = reactive.subscriptionManager.activeChannels()
    expect(Array.from(active).some((c) => c.startsWith(todosPrefix))).toBe(true)
    expect(Array.from(active).some((c) => c.startsWith(projectsPrefix))).toBe(
      true,
    )
  })

  it('a write to the FIRST table invalidates the query', async () => {
    const handler = createStartHandler({})
    const reactive = createReactiveQueries({ publish: handler.publish })
    await makeMultiTableQuery(reactive)(undefined)

    const invalidateSpy = vi.spyOn(reactive.subscriptionManager, 'invalidate')
    await reactive.invalidate([
      { table: 'todos', operation: 'insert', affectedRows: [{ teamId: 'A' }] },
    ])
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('a write to the SECOND table ALSO invalidates the query (the bug WP-C fixes)', async () => {
    const published: Array<{ ch: string; data: unknown }> = []
    const handler = createStartHandler({
      backend: {
        publish: (ch: string, data: unknown) => {
          published.push({ ch, data })
          return Promise.resolve()
        },
      },
    })
    const reactive = createReactiveQueries({ publish: handler.publish })
    await makeMultiTableQuery(reactive)(undefined)

    await reactive.invalidate([
      {
        table: 'projects',
        operation: 'insert',
        affectedRows: [{ teamId: 'A' }],
      },
    ])

    const batchMsg = published.find((p) => p.ch === REALTIME_BATCH_CHANNEL)
    expect(batchMsg).toBeDefined()
    const updates = (batchMsg!.data as { updates: Array<{ channel: string }> })
      .updates
    expect(
      updates.some((u) =>
        u.channel.startsWith(
          serializeKey(['projects', { teamId: 'A' }]) + ':q=',
        ),
      ),
    ).toBe(true)
  })

  it('a write to an UNRELATED table does not invalidate the query', async () => {
    const published: Array<{ ch: string; data: unknown }> = []
    const handler = createStartHandler({
      backend: {
        publish: (ch: string, data: unknown) => {
          published.push({ ch, data })
          return Promise.resolve()
        },
      },
    })
    const reactive = createReactiveQueries({ publish: handler.publish })
    await makeMultiTableQuery(reactive)(undefined)

    await reactive.invalidate([
      {
        table: 'widgets',
        operation: 'insert',
        affectedRows: [{ teamId: 'A' }],
      },
    ])

    expect(published.some((p) => p.ch === REALTIME_BATCH_CHANNEL)).toBe(false)
  })
})
