import { runInReactiveContext } from './reactive-db.js'
import type { WriteDescriptor } from './reactive-db.js'
import type { SubscriptionManager } from './subscription-manager.js'

export interface ReactiveMutationOptions<TInput, TResult> {
  subscriptionManager: SubscriptionManager
  /** Mutation function. Should use wrapReactiveDb() db for automatic write set capture. */
  mutation: (input: TInput) => Promise<TResult>
  /** Escape hatch: explicit write descriptors override auto-capture. */
  writes?: (result: TResult) => ReadonlyArray<WriteDescriptor>
}

export function createReactiveMutation<TInput, TResult>(
  options: ReactiveMutationOptions<TInput, TResult>,
): { mutate: (input: TInput) => Promise<TResult> } {
  return {
    async mutate(input: TInput): Promise<TResult> {
      const { result, ctx } = await runInReactiveContext(() =>
        options.mutation(input),
      )

      const writes = options.writes ? options.writes(result) : ctx.writes

      await options.subscriptionManager.invalidate(writes)

      return result
    },
  }
}
