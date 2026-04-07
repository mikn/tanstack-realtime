/**
 * Tests for the reactive layer:
 * compilePredicate, extractEqualityConditions, deriveChannelKey,
 * wrapReactiveDb, runInReactiveContext, SubscriptionManager,
 * createReactiveLoader, createReactiveMutation, createStartHandler (integration)
 */

import { describe, expect, it, vi } from 'vitest'
import {
  ReactivePredicateParseError,
  compilePredicate,
  createReactiveLoader,
  createReactiveMutation,
  createStartHandler,
  createSubscriptionManager,
  deriveChannelKey,
  extractEqualityConditions,
  runInReactiveContext,
  wrapReactiveDb,
} from '@tanstack/realtime-preset-start'
import { serializeKey } from '@tanstack/realtime'
import type { SubscriptionEntry } from '@tanstack/realtime-preset-start'

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
      return await (wrappedDb.insert(fakeTable) as any).values({ teamId: 'A' })
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
      return await (wrappedDb.insert(fakeTable) as any)
        .values({ teamId: 'A' })
        .returning()
    })

    expect(ctx.writes).toHaveLength(1)
    expect(ctx.writes[0].table).toBe('todos')
    expect(ctx.writes[0].affectedRows).toEqual(insertedRows)
  })
})

// ---------------------------------------------------------------------------
// SubscriptionManager
// ---------------------------------------------------------------------------

function makeEntry(
  channel: string,
  table: string,
  matchFn: (row: any) => boolean,
): SubscriptionEntry {
  return {
    channel,
    predicate: {
      table,
      sql: '',
      params: [],
      columns: {},
      compiled: matchFn,
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

    await mgr.invalidate([{ table: 'todos', affectedRows: [{ teamId: 'A' }] }])

    expect(entry.requery).toHaveBeenCalledTimes(1)
    expect(publishFn).toHaveBeenCalledWith('ch-A', { data: 'fresh' })
  })

  it('invalidate with non-matching row: requery not called', async () => {
    const publishFn = vi.fn().mockResolvedValue(undefined)
    const mgr = createSubscriptionManager(publishFn)
    const entry = makeEntry('ch-A', 'todos', (row) => row.teamId === 'A')
    mgr.register(entry)

    await mgr.invalidate([{ table: 'todos', affectedRows: [{ teamId: 'B' }] }])

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

    await mgr.invalidate([{ table: 'todos', affectedRows: [] }])

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
      mgr.invalidate([{ table: 'todos', affectedRows: [] }]),
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
      { table: 'todos', affectedRows: [{ teamId: 'NEW' }] },
    ])

    expect(entryV2.requery).toHaveBeenCalledTimes(1)
    expect(entryV1.requery).not.toHaveBeenCalled()
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

  it('equality conditions → serializeKey([table, conditions])', () => {
    const key = deriveChannelKey(
      'todos',
      '"todos"."team_id" = $1',
      ['A'],
      dkCols,
    )
    expect(key).toBe(serializeKey(['todos', { teamId: 'A' }]))
  })

  it('no equality conditions → serializeKey([table])', () => {
    const key = deriveChannelKey(
      'todos',
      '"todos"."team_id" > $1',
      ['A'],
      dkCols,
    )
    expect(key).toBe(serializeKey(['todos']))
  })

  it('undefined whereSQL → serializeKey([table])', () => {
    const key = deriveChannelKey('todos', undefined, [], dkCols)
    expect(key).toBe(serializeKey(['todos']))
  })
})

// ---------------------------------------------------------------------------
// createReactiveLoader
// ---------------------------------------------------------------------------

describe('createReactiveLoader', () => {
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

    const loader = createReactiveLoader({
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

    const loader = createReactiveLoader({
      subscriptionManager: mockMgr,
      query: async () => await wrappedDb.select().from(fakeTable),
    })

    await loader.load()

    const registered = mockMgr.register.mock.calls[0][0]
    expect(registered.channel).toBe(serializeKey(['todos', { teamId: 'A' }]))
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

    const loader = createReactiveLoader({
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

    const loader = createReactiveLoader({
      subscriptionManager: mockMgr,
      channel: 'explicit-ch',
      query: async () => [{ id: 1 }],
      predicate: { table: 'todos', matches: matchesFn },
    })

    const result = await loader.load()
    expect(result).toEqual([{ id: 1 }])
    expect(mockMgr.register).toHaveBeenCalledTimes(1)
    const registered = mockMgr.register.mock.calls[0][0]
    expect(registered.predicate.compiled).toBe(matchesFn)
    expect(registered.channel).toBe('explicit-ch')
  })

  it('throws when no predicate available and query does not use reactive proxy', async () => {
    const mockMgr = makeMockMgr()

    const loader = createReactiveLoader({
      subscriptionManager: mockMgr,
      query: async () => [{ id: 1 }], // plain query, no wrapReactiveDb
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

    const loader = createReactiveLoader({
      subscriptionManager: mockMgr,
      query: async () => await wrappedDb.select().from(fakeTable),
    })

    const result = await loader.load()
    expect(result).toEqual(expectedResult)
  })
})

// ---------------------------------------------------------------------------
// createReactiveMutation
// ---------------------------------------------------------------------------

describe('createReactiveMutation', () => {
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

    const mutation = createReactiveMutation({
      subscriptionManager: mockMgr,
      mutation: async (_input: void) => {
        return await (wrappedDb.insert(fakeTable) as any)
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

    const explicitWrites = [{ table: 'projects', affectedRows: [{ id: 99 }] }]

    const mutation = createReactiveMutation({
      subscriptionManager: mockMgr,
      mutation: async (_input: void) => ({ success: true }),
      writes: (_result) => explicitWrites,
    })

    await mutation.mutate(undefined)

    expect(mockMgr.invalidate).toHaveBeenCalledWith(explicitWrites)
  })
})

// ---------------------------------------------------------------------------
// createStartHandler — integration
// ---------------------------------------------------------------------------

describe('createStartHandler — reactive integration', () => {
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

  it('query() + mutate() end-to-end: only matching channel invalidated', async () => {
    const realtime = createStartHandler({})
    const wrappedDb = makeReactiveDb(
      [{ id: 1, teamId: 'A' }],
      [{ id: 2, teamId: 'A' }],
    )

    // Register subscription
    await realtime.query(async () => await wrappedDb.select().from(fakeTable))

    const expectedChannel = serializeKey(['todos', { teamId: 'A' }])
    expect(
      realtime.subscriptionManager.activeChannels().has(expectedChannel),
    ).toBe(true)

    // Trigger mutation with matching row
    const invalidateSpy = vi.spyOn(realtime.subscriptionManager, 'invalidate')

    await realtime.mutate(
      async () =>
        await (wrappedDb.insert(fakeTable) as any)
          .values({ teamId: 'A' })
          .returning(),
    )

    expect(invalidateSpy).toHaveBeenCalledTimes(1)
    const writes = invalidateSpy.mock.calls[0][0]
    expect(writes[0].table).toBe('todos')
    expect(writes[0].affectedRows).toEqual([{ id: 2, teamId: 'A' }])
  })

  it('affectedRows:[] write invalidates all subscriptions on that table', async () => {
    const backend = {
      publish: vi.fn(async (_ch: string, _data: unknown) => {}),
    }
    const realtime2 = createStartHandler({ backend })
    const wrappedDb2 = makeReactiveDb([{ id: 1, teamId: 'A' }], [])
    await realtime2.query(async () => await wrappedDb2.select().from(fakeTable))

    await realtime2.invalidate([{ table: 'todos', affectedRows: [] }])

    // The channel should have been published
    expect(backend.publish).toHaveBeenCalledWith(
      expect.stringContaining('todos'),
      expect.anything(),
    )
  })

  it('realtime.invalidate([{ table, affectedRows }]) works directly', async () => {
    const realtime = createStartHandler({})
    const wrappedDb = makeReactiveDb([{ id: 1, teamId: 'A' }], [])

    await realtime.query(async () => await wrappedDb.select().from(fakeTable))

    // Direct invalidation with matching rows
    const invalidateSpy = vi.spyOn(realtime.subscriptionManager, 'invalidate')
    await realtime.invalidate([
      { table: 'todos', affectedRows: [{ teamId: 'A' }] },
    ])

    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('realtime.subscriptionManager is an instance of SubscriptionManager', () => {
    const realtime = createStartHandler({})
    // Check that subscriptionManager has the expected interface
    expect(realtime.subscriptionManager).toBeDefined()
    expect(typeof realtime.subscriptionManager.register).toBe('function')
    expect(typeof realtime.subscriptionManager.unregister).toBe('function')
    expect(typeof realtime.subscriptionManager.invalidate).toBe('function')
    expect(typeof realtime.subscriptionManager.activeChannels).toBe('function')
  })
})
