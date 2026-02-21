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
 * import { publish } from '@tanstack/realtime'
 *
 * for await (const chunk of stream) {
 *   await publish(['ai-stream', { sessionId }], { type: 'token', content: chunk })
 * }
 */
export type PublishFn = (
  channel: QueryKey | string,
  data: unknown,
) => Promise<void>
