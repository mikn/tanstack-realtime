import { AsyncLocalStorage } from 'node:async_hooks'
import { getTableColumns, getTableName } from 'drizzle-orm'

// ColumnMap: the shape returned by getTableColumns(table)
// Keys are JS field names, values have a `.name` property (DB column name)
export type ColumnMap = Record<string, { name: string }>

export interface ReadEntry {
  table: string // DB table name (from getTableName)
  sql: string // full SQL string from toSQL() including WHERE clause
  params: Array<unknown> // positional params $1, $2... from toSQL()
  columns: ColumnMap // from getTableColumns(table)
}

// WriteDescriptor is defined here and re-exported from subscription-manager.
export interface WriteDescriptor {
  table: string
  affectedRows: ReadonlyArray<Record<string, unknown>> // [] = table-level fallback
}

export interface ReactiveQueryContext {
  reads: Array<ReadEntry>
  writes: Array<WriteDescriptor>
}

const reactiveCtx = new AsyncLocalStorage<ReactiveQueryContext>()

export async function runInReactiveContext<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; ctx: ReactiveQueryContext }> {
  const ctx: ReactiveQueryContext = { reads: [], writes: [] }
  const result = await reactiveCtx.run(ctx, fn)
  return { result, ctx }
}

// ---------------------------------------------------------------------------
// Internal wrapper helpers
// ---------------------------------------------------------------------------

type AnyBuilder = Record<string, unknown> & {
  then?: unknown
  toSQL?: unknown
}

function hasPromiseLike(val: unknown): val is AnyBuilder {
  if (val === null || typeof val !== 'object') return false
  const obj = val as AnyBuilder
  return typeof obj['then'] === 'function' || typeof obj['toSQL'] === 'function'
}

/**
 * Wraps a query builder after `.from(table)` has been called.
 * Intercepts `.then()` to record the read and forward positional params.
 *
 * The store is captured at proxy-creation time because `.then()` is invoked
 * after AsyncLocalStorage.run() returns (the thenable is awaited in the outer
 * async function, outside the run context). Capturing here ensures the store
 * reference is still valid when `.then()` fires.
 */
function wrapQueryBuilder(
  builder: AnyBuilder,
  tableName: string,
  columns: ColumnMap,
): AnyBuilder {
  // Capture NOW — wrapQueryBuilder is called inside AsyncLocalStorage.run()
  const capturedStore = reactiveCtx.getStore()
  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (prop === 'then') {
        return (
          onFulfilled?: ((value: unknown) => unknown) | null,
          onRejected?: ((reason: unknown) => unknown) | null,
        ) => {
          if (capturedStore && typeof target['toSQL'] === 'function') {
            try {
              const { sql, params } = (
                target['toSQL'] as () => { sql: string; params: Array<unknown> }
              )()
              capturedStore.reads.push({
                table: tableName,
                sql,
                params,
                columns,
              })
            } catch {
              // If toSQL fails, skip recording — don't break execution
            }
          }
          const thenFn = Reflect.get(target, 'then', receiver) as
            | ((
                onFulfilled?: ((value: unknown) => unknown) | null,
                onRejected?: ((reason: unknown) => unknown) | null,
              ) => Promise<unknown>)
            | undefined
          if (typeof thenFn === 'function') {
            return thenFn.call(target, onFulfilled, onRejected)
          }
          return Promise.resolve(undefined).then(onFulfilled, onRejected)
        }
      }
      const val = Reflect.get(target, prop, receiver)
      if (typeof val === 'function') {
        return (...args: Array<unknown>) => {
          const result: unknown = (
            val as (...a: Array<unknown>) => unknown
          ).apply(target, args)
          if (hasPromiseLike(result)) {
            return wrapQueryBuilder(result, tableName, columns)
          }
          return result
        }
      }
      return val
    },
  })
}

/**
 * Wraps the select builder to intercept `.from(table)`.
 */
function wrapSelectFrom(builder: AnyBuilder): AnyBuilder {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (prop === 'from') {
        return (table: unknown, ...rest: Array<unknown>) => {
          const tableName = getTableName(
            table as Parameters<typeof getTableName>[0],
          )
          const columns = getTableColumns(
            table as Parameters<typeof getTableColumns>[0],
          )
          const fromFn = Reflect.get(target, 'from', receiver) as (
            ...a: Array<unknown>
          ) => AnyBuilder
          const inner = fromFn.apply(target, [table, ...rest])
          return wrapQueryBuilder(inner, tableName, columns as ColumnMap)
        }
      }
      const val = Reflect.get(target, prop, receiver)
      if (typeof val === 'function') {
        return (...args: Array<unknown>) => {
          const result: unknown = (
            val as (...a: Array<unknown>) => unknown
          ).apply(target, args)
          if (hasPromiseLike(result)) {
            return wrapSelectFrom(result)
          }
          return result
        }
      }
      return val
    },
  })
}

/**
 * Wraps a write (insert/update/delete) builder to intercept `.then()`.
 *
 * Same store-capture rationale as wrapQueryBuilder.
 */
function wrapWrite(builder: AnyBuilder, tableName: string): AnyBuilder {
  // Capture NOW — wrapWrite is called inside AsyncLocalStorage.run()
  const capturedStore = reactiveCtx.getStore()
  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (prop === 'then') {
        return (
          onFulfilled?: ((value: unknown) => unknown) | null,
          onRejected?: ((reason: unknown) => unknown) | null,
        ) => {
          const thenFn = Reflect.get(target, 'then', receiver) as
            | ((
                onFulfilled?: ((value: unknown) => unknown) | null,
                onRejected?: ((reason: unknown) => unknown) | null,
              ) => Promise<unknown>)
            | undefined
          const wrappedFulfilled = (result: unknown) => {
            if (capturedStore) {
              const rows = Array.isArray(result)
                ? (result as Array<Record<string, unknown>>)
                : []
              capturedStore.writes.push({
                table: tableName,
                affectedRows: rows,
              })
            }
            return onFulfilled ? onFulfilled(result) : result
          }
          if (typeof thenFn === 'function') {
            return thenFn.call(target, wrappedFulfilled, onRejected)
          }
          return Promise.resolve(undefined).then(wrappedFulfilled, onRejected)
        }
      }
      const val = Reflect.get(target, prop, receiver)
      if (typeof val === 'function') {
        return (...args: Array<unknown>) => {
          const result: unknown = (
            val as (...a: Array<unknown>) => unknown
          ).apply(target, args)
          // Always re-wrap object results so intermediate builders
          // (e.g. .values() → .returning()) stay within the proxy chain.
          if (result !== null && typeof result === 'object') {
            return wrapWrite(result as AnyBuilder, tableName)
          }
          return result
        }
      }
      return val
    },
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function wrapReactiveDb<TDb extends object>(rawDb: TDb): TDb {
  return new Proxy(rawDb, {
    get(target, prop, receiver) {
      // Only intercept when inside a reactive context
      const store = reactiveCtx.getStore()

      if (prop === 'select') {
        const val = Reflect.get(target, prop, receiver) as (
          ...args: Array<unknown>
        ) => AnyBuilder
        return (...args: Array<unknown>) => {
          const builder = val.apply(target, args)
          if (store) {
            return wrapSelectFrom(builder)
          }
          return builder
        }
      }

      if (prop === 'insert' || prop === 'update' || prop === 'delete') {
        const val = Reflect.get(target, prop, receiver) as (
          table: unknown,
          ...args: Array<unknown>
        ) => AnyBuilder
        return (table: unknown, ...args: Array<unknown>) => {
          const builder = val.apply(target, [table, ...args])
          if (store) {
            const tableName = getTableName(
              table as Parameters<typeof getTableName>[0],
            )
            return wrapWrite(builder, tableName)
          }
          return builder
        }
      }

      return Reflect.get(target, prop, receiver)
    },
  })
}
