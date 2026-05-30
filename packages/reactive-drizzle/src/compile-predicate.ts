import { parse } from 'pgsql-ast-parser'
import { serializeKey } from '@realtimejs/core'
import type { ColumnMap } from './reactive-db.js'

export class ReactivePredicateParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReactivePredicateParseError'
  }
}

// ---------------------------------------------------------------------------
// Internal AST node types (minimal subset of pgsql-ast-parser's AST)
// ---------------------------------------------------------------------------

interface AstRef {
  type: 'ref'
  name: string
  table?: { name: string }
}

interface AstParameter {
  type: 'parameter'
  name: number | string // pgsql-ast-parser returns "$1" style strings
}

interface AstInteger {
  type: 'integer'
  value: number
}

interface AstNumeric {
  type: 'numeric'
  value: number
}

interface AstString {
  type: 'string'
  value: string
}

interface AstBoolean {
  type: 'boolean'
  value: boolean
}

interface AstNull {
  type: 'null'
}

interface AstList {
  type: 'list'
  expressions: Array<AstNode>
}

interface AstBinary {
  type: 'binary'
  op: string
  left: AstNode
  right: AstNode
}

interface AstUnary {
  type: 'unary'
  op: string
  operand: AstNode
}

type AstNode =
  | AstRef
  | AstParameter
  | AstInteger
  | AstNumeric
  | AstString
  | AstBoolean
  | AstNull
  | AstList
  | AstBinary
  | AstUnary

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a reverse map: DB column name → JS field name.
 */
function buildReverseMap(columns: ColumnMap): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [jsField, col] of Object.entries(columns)) {
    result[col.name] = jsField
  }
  return result
}

/**
 * Validate that an AST node can be used as a value operand.
 * Throws ReactivePredicateParseError at compile time for unsupported types
 * (e.g. sub-selects, function calls) so callers get an error immediately
 * rather than at row-evaluation time.
 */
function validateValueNode(node: AstNode): void {
  switch (node.type) {
    case 'ref':
    case 'parameter':
    case 'integer':
    case 'numeric':
    case 'string':
    case 'boolean':
    case 'null':
      return
    case 'list':
      for (const expr of node.expressions) validateValueNode(expr)
      return
    default:
      throw new ReactivePredicateParseError(
        `Unsupported value node type "${(node as { type: string }).type}" in predicate. ` +
          'Use the `matches` escape hatch for complex predicates.',
      )
  }
}

/**
 * Resolve an AST node to a concrete value (not a matcher function).
 */
function resolveValue(
  node: AstNode,
  row: Record<string, unknown>,
  dbToJs: Record<string, string>,
  params: ReadonlyArray<unknown>,
): unknown {
  switch (node.type) {
    case 'ref':
      return row[dbToJs[node.name] ?? node.name]
    case 'parameter': {
      // pgsql-ast-parser v12 returns name as "$1" (string); handle both string and number
      const idx =
        typeof node.name === 'string'
          ? parseInt(node.name.replace('$', ''), 10) - 1
          : node.name - 1
      return params[idx]
    }
    case 'integer':
      return node.value
    case 'numeric':
      return node.value
    case 'string':
      return node.value
    case 'boolean':
      return node.value
    case 'null':
      return null
    default:
      throw new ReactivePredicateParseError(
        `Unsupported AST node type "${(node as AstNode).type}" in predicate. ` +
          'Use the `matches` escape hatch for complex predicates.',
      )
  }
}

/**
 * Recursively build a row-matching function from an AST node.
 */
function buildMatcher(
  node: AstNode,
  params: ReadonlyArray<unknown>,
  dbToJs: Record<string, string>,
): (row: Record<string, unknown>) => boolean {
  if (node.type === 'binary') {
    const { op, left, right } = node
    switch (op) {
      case 'AND': {
        const leftFn = buildMatcher(left, params, dbToJs)
        const rightFn = buildMatcher(right, params, dbToJs)
        return (row) => leftFn(row) && rightFn(row)
      }
      case 'OR': {
        const leftFn = buildMatcher(left, params, dbToJs)
        const rightFn = buildMatcher(right, params, dbToJs)
        return (row) => leftFn(row) || rightFn(row)
      }
      case '=':
        validateValueNode(left)
        validateValueNode(right)
        return (row) => {
          const l = resolveValue(left, row, dbToJs, params)
          const r = resolveValue(right, row, dbToJs, params)
          if (l === null || r === null) return false
          return l === r
        }
      case '<>':
      case '!=':
        validateValueNode(left)
        validateValueNode(right)
        return (row) => {
          const l = resolveValue(left, row, dbToJs, params)
          const r = resolveValue(right, row, dbToJs, params)
          if (l === null || r === null) return false
          return l !== r
        }
      case '>':
        validateValueNode(left)
        validateValueNode(right)
        return (row) => {
          const l = resolveValue(left, row, dbToJs, params)
          const r = resolveValue(right, row, dbToJs, params)
          return (l as number) > (r as number)
        }
      case '>=':
        validateValueNode(left)
        validateValueNode(right)
        return (row) => {
          const l = resolveValue(left, row, dbToJs, params)
          const r = resolveValue(right, row, dbToJs, params)
          return (l as number) >= (r as number)
        }
      case '<':
        validateValueNode(left)
        validateValueNode(right)
        return (row) => {
          const l = resolveValue(left, row, dbToJs, params)
          const r = resolveValue(right, row, dbToJs, params)
          return (l as number) < (r as number)
        }
      case '<=':
        validateValueNode(left)
        validateValueNode(right)
        return (row) => {
          const l = resolveValue(left, row, dbToJs, params)
          const r = resolveValue(right, row, dbToJs, params)
          return (l as number) <= (r as number)
        }
      case 'IN': {
        validateValueNode(left)
        if (right.type !== 'list') {
          throw new ReactivePredicateParseError(
            'IN operator expects a list on the right side.',
          )
        }
        validateValueNode(right)
        return (row) => {
          const leftVal = resolveValue(left, row, dbToJs, params)
          const vals = right.expressions.map((e) =>
            resolveValue(e, row, dbToJs, params),
          )
          return vals.includes(leftVal)
        }
      }
      default:
        throw new ReactivePredicateParseError(
          `Unsupported binary operator "${op}". ` +
            'Use the `matches` escape hatch for complex predicates.',
        )
    }
  }

  if (node.type === 'unary') {
    const { op, operand } = node
    switch (op) {
      case 'IS NULL':
        return (row) => resolveValue(operand, row, dbToJs, params) == null
      case 'IS NOT NULL':
        return (row) => resolveValue(operand, row, dbToJs, params) != null
      case 'NOT': {
        const fn = buildMatcher(operand, params, dbToJs)
        return (row) => !fn(row)
      }
      default:
        throw new ReactivePredicateParseError(
          `Unsupported unary operator "${op}". ` +
            'Use the `matches` escape hatch for complex predicates.',
        )
    }
  }

  // For literal/ref nodes at top level (unusual but handle gracefully)
  if (
    node.type === 'ref' ||
    node.type === 'parameter' ||
    node.type === 'integer' ||
    node.type === 'numeric' ||
    node.type === 'string' ||
    node.type === 'boolean'
  ) {
    return (row) => Boolean(resolveValue(node, row, dbToJs, params))
  }

  throw new ReactivePredicateParseError(
    `Cannot build matcher for AST node type "${(node as AstNode).type}". ` +
      'Use the `matches` escape hatch for complex predicates.',
  )
}

/**
 * Parse the WHERE SQL and return the AST node for the WHERE clause.
 * Accepts either:
 *   - A bare WHERE condition expression: `"table"."col" = $1`
 *   - A full SQL statement: `SELECT ... FROM ... WHERE "table"."col" = $1`
 * In the latter case the WHERE clause is extracted from the full statement.
 */
function parseWhereClause(whereSQL: string): AstNode {
  // If input looks like a full SQL statement, parse it directly to extract WHERE
  const trimmed = whereSQL.trimStart()
  const upperTrimmed = trimmed.toUpperCase()
  const isFullStatement =
    upperTrimmed.startsWith('SELECT ') ||
    upperTrimmed.startsWith('INSERT ') ||
    upperTrimmed.startsWith('UPDATE ') ||
    upperTrimmed.startsWith('DELETE ')

  let sqlToParse: string
  if (isFullStatement) {
    sqlToParse = trimmed
  } else {
    sqlToParse = 'SELECT 1 WHERE ' + whereSQL
  }

  const ast = parse(sqlToParse)
  if (ast.length === 0) {
    throw new ReactivePredicateParseError(
      `Failed to parse WHERE clause: "${whereSQL}"`,
    )
  }
  const stmt = ast[0] as { type: string; where?: AstNode }
  if (!stmt.where) {
    throw new ReactivePredicateParseError(
      `No WHERE clause found in parsed AST for: "${whereSQL}"`,
    )
  }
  return stmt.where
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Collect all column references (as JS field names) reachable in an AST subtree.
 */
function collectRefs(
  node: AstNode,
  dbToJs: Record<string, string>,
  refs: Set<string>,
): void {
  switch (node.type) {
    case 'ref':
      refs.add(dbToJs[node.name] ?? node.name)
      break
    case 'binary':
      collectRefs(node.left, dbToJs, refs)
      collectRefs(node.right, dbToJs, refs)
      break
    case 'unary':
      collectRefs(node.operand, dbToJs, refs)
      break
    case 'list':
      for (const expr of node.expressions) collectRefs(expr, dbToJs, refs)
      break
    default:
      break
  }
}

/**
 * Return the set of JS field names referenced in the WHERE clause.
 * Used by SubscriptionManager to conservatively invalidate subscriptions
 * when an UPDATE changes a column that is part of the predicate.
 * Returns an empty set when whereSQL is empty or cannot be parsed.
 */
export function extractReferencedColumns(
  whereSQL: string,
  columns: ColumnMap,
): Set<string> {
  if (!whereSQL) return new Set()
  try {
    const dbToJs = buildReverseMap(columns)
    const whereNode = parseWhereClause(whereSQL)
    const refs = new Set<string>()
    collectRefs(whereNode, dbToJs, refs)
    return refs
  } catch {
    return new Set()
  }
}

/**
 * Compile a WHERE SQL clause into a row-matching function.
 * The compiled function is cached — call once at register() time.
 */
export function compilePredicate(
  whereSQL: string,
  params: ReadonlyArray<unknown>,
  columns: ColumnMap,
): (row: Record<string, unknown>) => boolean {
  const dbToJs = buildReverseMap(columns)
  const whereNode = parseWhereClause(whereSQL)
  return buildMatcher(whereNode, params, dbToJs)
}

/**
 * Walk an AND chain collecting equality conditions (col = $N).
 * Conservative: stops at OR/NOT/other ops.
 */
function collectEqualities(
  node: AstNode,
  params: ReadonlyArray<unknown>,
  dbToJs: Record<string, string>,
  result: Record<string, unknown>,
): void {
  if (node.type !== 'binary') return

  const { op, left, right } = node

  if (op === 'AND') {
    collectEqualities(left, params, dbToJs, result)
    collectEqualities(right, params, dbToJs, result)
    return
  }

  if (op === '=') {
    // Helper to get parameter index from parameter node name ($1 → 0, etc.)
    const paramIdx = (paramNode: AstParameter): number =>
      typeof paramNode.name === 'string'
        ? parseInt(paramNode.name.replace('$', ''), 10) - 1
        : paramNode.name - 1

    // col = $N
    if (left.type === 'ref' && right.type === 'parameter') {
      const jsField = dbToJs[left.name] ?? left.name
      result[jsField] = params[paramIdx(right)]
      return
    }
    // $N = col
    if (right.type === 'ref' && left.type === 'parameter') {
      const jsField = dbToJs[right.name] ?? right.name
      result[jsField] = params[paramIdx(left)]
      return
    }
  }
  // All other ops are skipped (conservative)
}

/**
 * Extract top-level equality conditions (col = $N) reachable only through AND.
 * Returns JS-field-named keys with resolved param values.
 * Conservative: OR/NOT/ranges yield empty result.
 */
export function extractEqualityConditions(
  whereSQL: string,
  params: ReadonlyArray<unknown>,
  columns: ColumnMap,
): Record<string, unknown> {
  const dbToJs = buildReverseMap(columns)
  const whereNode = parseWhereClause(whereSQL)
  const result: Record<string, unknown> = {}
  collectEqualities(whereNode, params, dbToJs, result)
  return result
}

/**
 * A small, deterministic, non-cryptographic string hash (FNV-1a, 32-bit).
 *
 * Used to derive a stable discriminator from a query's full SQL + params so
 * that two queries which differ in anything that changes their RESULT SET
 * (SELECT columns, range predicates, ORDER BY, LIMIT, …) — not just their
 * top-level equality conditions — produce DIFFERENT channels, while
 * byte-identical queries produce the SAME channel.
 *
 * Deterministic across processes: the same input string always yields the
 * same hash. No dependency, no crypto — collision resistance is not a security
 * property here, only "distinct result-sets ⇒ distinct channels with
 * overwhelming probability".
 */
function fnv1a32(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    // hash * 16777619, kept in 32-bit unsigned range via Math.imul.
    hash = Math.imul(hash, 0x01000193)
  }
  // >>> 0 → unsigned; base36 for a short, stable, alphanumeric token.
  return (hash >>> 0).toString(36)
}

/**
 * Normalise a query SQL + params into a single stable string for hashing.
 *
 * Collapses runs of whitespace so cosmetically-different-but-identical SQL
 * (extra spaces/newlines from a query builder) still hashes the same, then
 * appends the JSON-serialised params so two queries with the same SQL text but
 * different bound values (and thus different result sets) hash differently.
 */
function normalizeQueryForHash(
  sql: string,
  params: ReadonlyArray<unknown>,
): string {
  const normalizedSql = sql.replace(/\s+/g, ' ').trim()
  return `${normalizedSql}|${JSON.stringify(params)}`
}

/**
 * Compute the short, stable SQL discriminator suffix (`q=<hash>`) for a query.
 *
 * Exported so other derivation sites (e.g. the no-WHERE table-level fallback)
 * can append the SAME discriminator and stay consistent with
 * {@link deriveChannelKey}.
 */
export function queryDiscriminator(
  sql: string,
  params: ReadonlyArray<unknown>,
): string {
  return `q=${fnv1a32(normalizeQueryForHash(sql, params))}`
}

/**
 * Derive a stable serialized channel key from table + (full query) SQL.
 *
 * The channel has two parts:
 *  - A human-readable PREFIX `serializeKey([table, equalityConditions])` (or
 *    `serializeKey([table])` when there are no top-level equalities) — kept for
 *    debuggability.
 *  - A stable DISCRIMINATOR `:q=<hash>` derived from the NORMALISED full query
 *    `sql` + `params`. Because the prefix is built only from top-level equality
 *    conditions, two genuinely different queries (e.g. one with an extra range
 *    predicate, or a different SELECT column list) can share a prefix; the
 *    discriminator makes their channels DIFFERENT, so a result-set difference
 *    never collides onto the same channel. Byte-identical queries hash the same
 *    and therefore still share one channel.
 *
 * `whereSQL === undefined` (the `matches` escape hatch, which has no SQL to
 * hash) keeps the legacy behaviour and returns the bare `serializeKey([table])`
 * with NO discriminator — distinct `matches`-based queries should pass an
 * explicit `channel` to disambiguate.
 */
export function deriveChannelKey(
  tableName: string,
  whereSQL: string | undefined,
  params: ReadonlyArray<unknown>,
  columns: ColumnMap,
): string {
  // No SQL to discriminate on (matches escape hatch): legacy table-level key.
  if (whereSQL === undefined) {
    return serializeKey([tableName])
  }

  const conditions = extractEqualityConditions(whereSQL, params, columns)

  const prefix =
    Object.keys(conditions).length === 0
      ? serializeKey([tableName])
      : serializeKey([tableName, conditions])

  return `${prefix}:${queryDiscriminator(whereSQL, params)}`
}
