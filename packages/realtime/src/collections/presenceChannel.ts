import type { QueryKey } from '../core/types.js'
import { serializeKey } from '../core/serializeKey.js'

export interface PresenceChannelConfig<
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Unique identifier for this presence channel definition. */
  id: string
  /**
   * Function that derives the serialized channel key from runtime params.
   * @example
   * channel: (params: { documentId: string }) => ['editor', { documentId: params.documentId }]
   */
  channel: (params: TParams) => QueryKey | string
}

/**
 * A presence channel definition — a typed descriptor used by `usePresence`.
 * Created at module level and shared across components.
 */
export interface PresenceChannelDef<
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly id: string
  /** Resolve the serialized channel key for a given set of params. */
  resolveChannel(params: TParams): string
}

/**
 * Define a typed presence channel.
 *
 * @example
 * export const editorPresence = createPresenceChannel({
 *   id: 'editor-presence',
 *   channel: (params: { documentId: string }) =>
 *     ['editor', { documentId: params.documentId }],
 * })
 *
 * // Then in a component:
 * const { others, updatePresence } = usePresence(editorPresence, {
 *   params: { documentId },
 *   initial: { cursor: null, name: userName },
 * })
 */
export function createPresenceChannel<
  TParams extends Record<string, unknown> = Record<string, unknown>,
>(config: PresenceChannelConfig<TParams>): PresenceChannelDef<TParams> {
  return {
    id: config.id,
    resolveChannel(params: TParams): string {
      const key = config.channel(params)
      return typeof key === 'string' ? key : serializeKey(key)
    },
  }
}
