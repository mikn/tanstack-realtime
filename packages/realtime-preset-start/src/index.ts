/**
 * @tanstack/realtime-preset-start
 *
 * TanStack Start / TanStack Router preset for @tanstack/realtime.
 *
 * Provides a transport-agnostic `publish` function for TanStack Start server
 * functions, a Fetch-API–compatible request handler to mount as an API route,
 * and a pluggable `PublishBackend` interface for connecting any pub/sub
 * storage without being opinionated about the underlying mechanism.
 *
 * ## Quick start
 *
 * ```ts
 * // app/server/realtime.ts
 * import { createStartHandler } from '@tanstack/realtime-preset-start'
 *
 * export const realtime = createStartHandler({
 *   getUser: async (req) => {
 *     const session = await getSession(req)
 *     return session ? { userId: session.userId } : null
 *   },
 * })
 *
 * export const realtimePublish = realtime.publish
 * ```
 *
 * ```ts
 * // app/routes/api/realtime.ts
 * import { createAPIFileRoute } from '@tanstack/start/api'
 * import { realtime } from '../../server/realtime'
 *
 * export const Route = createAPIFileRoute('/api/realtime')({
 *   GET: ({ request }) => realtime.handle(request),
 *   POST: ({ request }) => realtime.handle(request),
 *   OPTIONS: ({ request }) => realtime.handle(request),
 * })
 * ```
 *
 * For the client side, pair with `sseTransport` from
 * `@tanstack/realtime-adapter-sse`.
 */

export { createStartHandler } from './handler.js'
export type {
  PublishBackend,
  StartHandlerOptions,
  StartRealtimeHandler,
} from './handler.js'
export { wrapReactiveDb, runInReactiveContext } from './reactive-db.js'
export type {
  ColumnMap,
  ReadEntry,
  ReactiveQueryContext,
  WriteDescriptor,
} from './reactive-db.js'
export {
  compilePredicate,
  deriveChannelKey,
  extractEqualityConditions,
} from './compile-predicate.js'
export { createSubscriptionManager } from './subscription-manager.js'
export type {
  SubscriptionManager,
  QueryPredicate,
  SubscriptionEntry,
} from './subscription-manager.js'
export { createReactiveLoader } from './reactive-loader.js'
export type { ReactiveLoaderOptions } from './reactive-loader.js'
export { createReactiveMutation } from './reactive-mutation.js'
export type { ReactiveMutationOptions } from './reactive-mutation.js'
