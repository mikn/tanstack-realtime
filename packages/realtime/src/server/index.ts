import { parseChannel, serializeKey } from '../core/serializeKey.js'
import type { ParsedChannel, QueryKey } from '../core/types.js'

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------

/**
 * Per-channel permission set returned by the `authorize` function.
 * All three fields are required — be explicit about what each channel allows.
 */
export interface ChannelPermissions {
  /** Can the user receive messages from this channel? */
  subscribe: boolean
  /** Can the user publish messages to this channel? */
  publish: boolean
  /** Can the user participate in presence on this channel? */
  presence: boolean
}

/**
 * Application-supplied channel authorization function.
 * Called by the preset (subscribe proxy, token endpoint, or direct call)
 * to decide whether `userId` may access `channel`.
 *
 * One function. Granular permissions. No provider-specific types.
 *
 * @example
 * // server/realtime.auth.ts
 * export async function authorize(
 *   userId: string,
 *   channel: ParsedChannel,
 * ): Promise<ChannelPermissions> {
 *   switch (channel.namespace) {
 *     case 'todos': {
 *       const member = await db.query.projectMembers.findFirst({ ... })
 *       return member
 *         ? { subscribe: true, publish: true, presence: false }
 *         : { subscribe: false, publish: false, presence: false }
 *     }
 *     default:
 *       return { subscribe: false, publish: false, presence: false }
 *   }
 * }
 */
export type AuthorizeFn = (
  userId: string,
  channel: ParsedChannel,
) => Promise<ChannelPermissions>

// ---------------------------------------------------------------------------
// Server-side publish
// ---------------------------------------------------------------------------

/**
 * Publish data to a channel from the server (e.g. from a server function or
 * background job). The preset routes the message to all subscribed clients.
 *
 * In the Node preset this fans out directly over the in-process WebSocket
 * server. In Centrifugo/Ably presets this calls the provider's HTTP publish API.
 *
 * @example
 * // server/functions/ai.ts
 * // `publish` is provided by your preset — e.g. @tanstack/realtime-preset-node
 * import { publish } from '../realtime.server.js'
 *
 * for await (const chunk of stream) {
 *   await publish(['ai-stream', { sessionId }], { type: 'token', content: chunk })
 * }
 */
export type PublishFn = (
  channel: QueryKey | string,
  data: unknown,
) => Promise<void>

// ---------------------------------------------------------------------------
// Server-side validation
// ---------------------------------------------------------------------------

/**
 * Input passed to a `ValidatePublishFn`.
 */
export interface PublishValidation {
  /** The parsed channel being published to. */
  channel: ParsedChannel
  /** The raw serialized channel string. */
  rawChannel: string
  /** The data payload being published. */
  data: unknown
  /** The authenticated user ID (when available). */
  userId?: string
}

/**
 * Result of a `ValidatePublishFn`.
 *
 * Uses a discriminated union on `accepted` so that `reason` is only available
 * on rejections and `data` is only available on acceptances.
 */
export type PublishValidationResult =
  | { accepted: true; data?: unknown }
  | { accepted: false; reason?: string }

/**
 * Server-side validation hook called before a publish is fanned out.
 * Return `{ accepted: true }` to allow, `{ accepted: false, reason }` to reject.
 * Optionally return `{ accepted: true, data: transformed }` to modify the payload.
 *
 * @example
 * const validate: ValidatePublishFn = async ({ channel, data }) => {
 *   if (channel.namespace === 'todos') {
 *     const result = todoSchema.safeParse(data)
 *     if (!result.success) return { accepted: false, reason: result.error.message }
 *     return { accepted: true, data: result.data }
 *   }
 *   return { accepted: true }
 * }
 */
export type ValidatePublishFn = (
  params: PublishValidation,
) => PublishValidationResult | Promise<PublishValidationResult>

/**
 * Error thrown when a validated publish is rejected.
 */
export class PublishValidationError extends Error {
  readonly reason: string

  constructor(reason: string) {
    super(`Publish rejected: ${reason}`)
    this.name = 'PublishValidationError'
    this.reason = reason
  }
}

// ---------------------------------------------------------------------------
// Validated publish wrapper — TanStack Start compatible
// ---------------------------------------------------------------------------

export interface ValidatedPublishOptions {
  /** The underlying publish function from your transport/preset. */
  publish: PublishFn
  /** Validation function. Called before every publish. */
  validate: ValidatePublishFn
}

/**
 * Wrap a `PublishFn` with server-side validation.
 *
 * Designed for TanStack Start server functions where the "server" is an
 * ephemeral function call — no persistent server process. The validate
 * function runs synchronously within the server function's lifecycle.
 *
 * On validation failure, the returned publish function throws a
 * `PublishValidationError`. On success with data transformation, the
 * transformed data is published.
 *
 * @example
 * // server/realtime.ts
 * import { createValidatedPublish, PublishValidationError } from '@tanstack/realtime'
 * import { nodeServer } from './realtime.server'
 *
 * const validatedPublish = createValidatedPublish({
 *   publish: (channel, data) => {
 *     const ch = typeof channel === 'string' ? channel : serializeKey(channel)
 *     nodeServer.publish(ch, data)
 *     return Promise.resolve()
 *   },
 *   validate: async ({ channel, data, userId }) => {
 *     if (channel.namespace === 'todos') {
 *       const result = todoSchema.safeParse((data as any).data)
 *       if (!result.success) return { accepted: false, reason: result.error.message }
 *       return { accepted: true }
 *     }
 *     return { accepted: true }
 *   },
 * })
 *
 * // In a TanStack Start server function:
 * export const updateTodo = createServerFn()(async ({ id, data }) => {
 *   const updated = await db.todos.update(id, data)
 *   await validatedPublish(['todos', { projectId }], {
 *     action: 'update',
 *     data: updated,
 *   })
 *   return updated
 * })
 */
export function createValidatedPublish(
  options: ValidatedPublishOptions,
): PublishFn {
  const { publish, validate } = options

  return async (channel: QueryKey | string, data: unknown): Promise<void> => {
    const rawChannel =
      typeof channel === 'string' ? channel : serializeKey(channel)
    const parsed = parseChannel(rawChannel)

    const result = await validate({
      channel: parsed,
      rawChannel,
      data,
    })

    if (!result.accepted) {
      throw new PublishValidationError(result.reason ?? 'Validation failed')
    }

    const publishData = result.data !== undefined ? result.data : data
    await publish(channel, publishData)
  }
}

// ---------------------------------------------------------------------------
// Server-side streams — re-export
// ---------------------------------------------------------------------------

export {
  createServerStream,
  verifyEventSignature,
  STREAM_DONE,
  STREAM_ERROR,
  STREAM_HEARTBEAT,
} from './serverStream.js'
export type {
  ServerStream,
  CreateServerStreamOptions,
  StreamCheckpoint,
  CheckpointConfig,
  ExplicitCheckpointConfig,
  ChannelDefCheckpointConfig,
} from './serverStream.js'
