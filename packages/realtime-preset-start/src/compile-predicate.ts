import { parse } from 'pgsql-ast-parser'
import { serializeKey } from '@tanstack/realtime'
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
  name: number
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
    case 'parameter':
      return params[node.name - 1]
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
      case 'AND':
        return (row) =>
          buildMatcher(left, params, dbToJs)(row) &&
          buildMatcher(right, params, dbToJs)(row)
      case 'OR':
        return (row) =>
          buildMatcher(left, params, dbToJs)(row) ||
          buildMatcher(right, params, dbToJs)(row)
      case '=':
        return (row) =>
          resolveValue(left, row, dbToJs, params) ===
          resolveValue(right, row, dbToJs, params)
      case '<>':
      case '!=':
        return (row) =>
          resolveValue(left, row, dbToJs, params) !==
          resolveValue(right, row, dbToJs, params)
      case '>':
        return (row) => {
          const l = resolveValue(left, row, dbToJs, params)
          const r = resolveValue(right, row, dbToJs, params)
          return (l as number) > (r as number)
        }
      case '>=':
        return (row) => {
          const l = resolveValue(left, row, dbToJs, params)
          const r = resolveValue(right, row, dbToJs, params)
          return (l as number) >= (r as number)
        }
      case '<':
        return (row) => {
          const l = resolveValue(left, row, dbToJs, params)
          const r = resolveValue(right, row, dbToJs, params)
          return (l as number) < (r as number)
        }
      case '<=':
        return (row) => {
          const l = resolveValue(left, row, dbToJs, params)
          const r = resolveValue(right, row, dbToJs, params)
          return (l as number) <= (r as number)
        }
      case 'IN': {
        if (right.type !== 'list') {
          throw new ReactivePredicateParseError(
            'IN operator expects a list on the right side.',
          )
        }
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
      case 'NOT':
        return (row) => !buildMatcher(operand, params, dbToJs)(row)
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
 */
function parseWhereClause(whereSQL: string): AstNode {
  const ast = parse('SELECT 1 WHERE ' + whereSQL)
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
    // col = $N
    if (left.type === 'ref' && right.type === 'parameter') {
      const jsField = dbToJs[left.name] ?? left.name
      result[jsField] = params[right.name - 1]
      return
    }
    // $N = col
    if (right.type === 'ref' && left.type === 'parameter') {
      const jsField = dbToJs[right.name] ?? right.name
      result[jsField] = params[left.name - 1]
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
 * Derive a stable serialized channel key from table + WHERE clause.
 * Returns serializeKey([tableName, conditions]) if equalities found,
 * or serializeKey([tableName]) if no equalities.
 * whereSQL undefined (no .where() call) → serializeKey([tableName]).
 */
export function deriveChannelKey(
  tableName: string,
  whereSQL: string | undefined,
  params: ReadonlyArray<unknown>,
  columns: ColumnMap,
): string {
  if (whereSQL === undefined) {
    return serializeKey([tableName])
  }

  const conditions = extractEqualityConditions(whereSQL, params, columns)

  if (Object.keys(conditions).length === 0) {
    return serializeKey([tableName])
  }

  return serializeKey([tableName, conditions])
}
