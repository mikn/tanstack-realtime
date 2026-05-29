/**
 * @tanstack/realtime-reactive-drizzle
 *
 * Optional Drizzle/Postgres reactive-query engine for `@tanstack/realtime`.
 *
 * This package is intentionally separate from `@tanstack/realtime-preset-start`
 * so that the core install carries ZERO `drizzle-orm` / `pgsql-ast-parser`
 * dependencies. Install it only when you want auto-derived channels, predicate
 * matching, and automatic invalidation backed by Drizzle.
 *
 * It composes with `createStartHandler` from the preset: the handler owns the
 * transport (`publish`, `handle`, `createStream`), while this package owns the
 * reactive engine (`query`, `mutation`, `invalidate`, `subscriptionManager`).
 *
 * ## Quick start
 *
 * ```ts
 * // app/server/realtime.ts
 * import { createStartHandler } from '@tanstack/realtime-preset-start'
 * import { createReactiveQueries } from '@tanstack/realtime-reactive-drizzle'
 *
 * // Create the reactive engine first; its publish is wired in below.
 * const reactive = createReactiveQueries()
 *
 * export const realtime = createStartHandler({
 *   onChannelEmpty: reactive.onChannelEmpty,
 * })
 *
 * // Wire the handler's publish into the reactive engine so invalidations fan out.
 * reactive.bindPublish(realtime.publish)
 *
 * export const realtimePublish = realtime.publish
 * export const { query, mutation, invalidate } = reactive
 * ```
 */

export { createReactiveQueries } from './reactive-queries.js'
export type {
  CreateReactiveQueriesOptions,
  ReactiveQueries,
} from './reactive-queries.js'

export { wrapReactiveDb, runInReactiveContext } from './reactive-db.js'
export type { WriteDescriptor, ColumnMap } from './reactive-db.js'

export {
  REALTIME_BATCH_CHANNEL,
  createSubscriptionManager,
  SubscriptionManager,
} from './subscription-manager.js'
export type {
  QueryPredicate,
  SubscriptionEntry,
} from './subscription-manager.js'

export { createLoader } from './reactive-loader.js'
export { createMutationHandler } from './reactive-mutation.js'

export {
  ReactivePredicateParseError,
  compilePredicate,
  deriveChannelKey,
  extractEqualityConditions,
  extractReferencedColumns,
} from './compile-predicate.js'
