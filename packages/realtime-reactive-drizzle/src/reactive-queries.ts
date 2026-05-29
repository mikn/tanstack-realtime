import {
  REALTIME_BATCH_CHANNEL,
  createSubscriptionManager,
} from './subscription-manager.js'
import { createLoader } from './reactive-loader.js'
import { createMutationHandler } from './reactive-mutation.js'
import type { SubscriptionManager } from './subscription-manager.js'
import type { WriteDescriptor } from './reactive-db.js'
import type {
  PublishFn,
  ReactiveMutationFn,
  ReactiveQueryFn,
  ReactiveQueryResult,
} from '@tanstack/realtime'

/**
 * Options for {@link createReactiveQueries}.
 */
export interface CreateReactiveQueriesOptions {
  /**
   * The publish function used to fan out invalidation batches to clients.
   *
   * Usually `createStartHandler(...).publish`. May be omitted at construction
   * time and injected later via {@link ReactiveQueries.bindPublish} — this
   * resolves the circular dependency where the handler's `onChannelEmpty`
   * (which lives on this engine) must exist before the handler is created,
   * but the handler's `publish` does not exist until after.
   */
  publish?: PublishFn

  /**
   * An existing subscription manager to use instead of creating a new one.
   * When omitted, a new subscription manager is created automatically.
   */
  subscriptionManager?: SubscriptionManager
}

/**
 * The reactive query engine produced by {@link createReactiveQueries}.
 *
 * Bundles everything `createStartHandler` used to expose for reactivity, kept
 * separate so the preset (and core install) carries no Drizzle dependencies.
 */
export interface ReactiveQueries {
  /**
   * Wraps an async server function to make it reactive. The returned function,
   * when called, fetches data AND registers an SSE subscription so the client
   * receives live updates whenever the underlying data changes.
   *
   * Use with `useQuery` on the client:
   * ```ts
   * export const getTodos = createServerFn().handler(
   *   reactive.query(async (args: { teamId: string }) =>
   *     db.select().from(todos).where(eq(todos.teamId, args.teamId))
   *   )
   * )
   * ```
   */
  query: <TArgs, TResult>(
    fn: (args: TArgs) => Promise<TResult>,
  ) => ReactiveQueryFn<TArgs, TResult>

  /**
   * Wraps an async mutation function to run in a reactive context.
   * After the mutation runs, any subscriptions whose predicates match the
   * affected rows are automatically invalidated and clients receive fresh data.
   *
   * Use with `useMutation` on the client:
   * ```ts
   * export const createTodo = createServerFn().handler(
   *   reactive.mutation(async (args: { teamId: string; title: string }) => {
   *     await db.insert(todos).values(args)
   *   })
   * )
   * ```
   */
  mutation: <TArgs, TResult>(
    fn: (args: TArgs) => Promise<TResult>,
  ) => ReactiveMutationFn<TArgs, TResult>

  /**
   * Directly invalidate channels by write descriptors.
   * Use `affectedRows: []` for table-level invalidation.
   */
  invalidate: (writes: ReadonlyArray<WriteDescriptor>) => Promise<void>

  /**
   * The subscription manager. Auto-created if not passed in options.
   */
  subscriptionManager: SubscriptionManager

  /**
   * Unregisters a channel when its last SSE subscriber disconnects.
   *
   * Wire this into `createStartHandler({ onChannelEmpty })`. The batch channel
   * ({@link REALTIME_BATCH_CHANNEL}) is never unregistered — it is always
   * needed to deliver invalidation updates.
   */
  onChannelEmpty: (channel: string) => void

  /**
   * Inject (or replace) the publish function after construction.
   *
   * Use this to wire `createStartHandler(...).publish` into a reactive engine
   * created up front (so its `onChannelEmpty` was available to the handler).
   */
  bindPublish: (publish: PublishFn) => void
}

/**
 * Create the Drizzle-backed reactive query engine.
 *
 * Composes with `createStartHandler` from `@tanstack/realtime-preset-start`:
 * the handler owns the transport, this engine owns reactivity. See the package
 * README / module docs for the canonical wiring snippet.
 */
export function createReactiveQueries(
  options: CreateReactiveQueriesOptions = {},
): ReactiveQueries {
  const mgr = options.subscriptionManager ?? createSubscriptionManager()

  if (options.publish) {
    mgr.setPublish(options.publish)
  }

  return {
    query<TArgs, TResult>(
      fn: (args: TArgs) => Promise<TResult>,
    ): ReactiveQueryFn<TArgs, TResult> {
      const callable = (args: TArgs): Promise<ReactiveQueryResult<TResult>> =>
        createLoader<TResult>({
          subscriptionManager: mgr,
          query: () => fn(args),
        }).loadWithChannel()
      return callable as unknown as ReactiveQueryFn<TArgs, TResult>
    },

    mutation<TArgs, TResult>(
      fn: (args: TArgs) => Promise<TResult>,
    ): ReactiveMutationFn<TArgs, TResult> {
      const callable = (args: TArgs): Promise<TResult> =>
        createMutationHandler<TArgs, TResult>({
          subscriptionManager: mgr,
          mutation: fn,
        }).mutate(args)
      return callable as unknown as ReactiveMutationFn<TArgs, TResult>
    },

    invalidate(writes: ReadonlyArray<WriteDescriptor>): Promise<void> {
      return mgr.invalidate(writes)
    },

    subscriptionManager: mgr,

    onChannelEmpty(channel: string): void {
      // Never unregister the batch channel — it's always needed for invalidation.
      if (channel !== REALTIME_BATCH_CHANNEL) {
        mgr.unregister(channel)
      }
    },

    bindPublish(publish: PublishFn): void {
      mgr.setPublish(publish)
    },
  }
}
