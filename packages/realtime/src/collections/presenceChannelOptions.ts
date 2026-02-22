import type { CollectionConfig, SyncConfig } from '@tanstack/db'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { RealtimeClient, PresenceUser, QueryKey } from '../core/types.js'
import { serializeKey } from '../core/serializeKey.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PresenceCollectionConfig<
  TData extends object = Record<string, unknown>,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
> {
  /** The realtime client that manages the underlying transport. */
  client: RealtimeClient
  /**
   * The channel to track presence on.
   * Accepts a QueryKey array or a pre-serialized channel string.
   */
  channel: QueryKey | string
  /** Collection id — must be unique across all collections. */
  id?: string
  /** Zod / Standard Schema for type validation. */
  schema?: TSchema
}

// ---------------------------------------------------------------------------
// presenceChannelOptions
// ---------------------------------------------------------------------------

/**
 * Creates a TanStack DB `CollectionConfig` whose rows are the currently
 * connected users in a presence channel.
 *
 * Each row is a `PresenceUser<TData>` — `{ connectionId: string; data: TData }`.
 * The collection is updated reactively whenever the presence set changes
 * (members join, update their data, or leave). The **current user is always
 * excluded** from the collection — the list reflects only *others*.
 *
 * **Requires presence support**: the underlying transport must implement
 * `PresenceCapable`. All built-in transports satisfy this. If you call
 * presence methods on a transport that does not implement `PresenceCapable`,
 * the collection throws at sync time.
 *
 * **Joining the channel**: `presenceChannelOptions` only *observes* presence
 * — it does not join the presence set on behalf of the current user. To
 * announce the current user's presence call `client.joinPresence()` (or use
 * the `usePresence` hook), independently of this collection.
 *
 * @example
 * // Observe who is currently viewing a document
 * export const viewersCollection = createCollection(
 *   presenceChannelOptions<{ name: string; avatar: string }>({
 *     client,
 *     channel: ['document', { id: documentId }],
 *     id: 'viewers',
 *   })
 * )
 *
 * // In a component — announce own presence and query the collection:
 * function DocumentViewers({ documentId }: { documentId: string }) {
 *   const { others } = usePresence(documentPresence, {
 *     params: { documentId },
 *     initial: { name: currentUser.name, avatar: currentUser.avatar },
 *   })
 *   // Or use the TanStack DB collection directly:
 *   const viewers = useLiveQuery(viewersCollection, (q) => q)
 *   return <AvatarGroup users={viewers} />
 * }
 */
export function presenceChannelOptions<
  TData extends object = Record<string, unknown>,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
>(
  config: PresenceCollectionConfig<TData, TSchema>,
): CollectionConfig<PresenceUser<TData>, string, TSchema> {
  const { client, channel, id, schema } = config

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  const sync: SyncConfig<PresenceUser<TData>, string> = {
    rowUpdateMode: 'full',

    sync({ begin, write, commit, markReady }) {
      let stopped = false
      // Track current rows so we can emit insert / update / delete diffs.
      let currentUsers = new Map<string, PresenceUser<TData>>()

      const unsub = client.onPresenceChange(serializedChannel, (incoming) => {
        if (stopped) return

        const nextUsers = new Map<string, PresenceUser<TData>>(
          (incoming as ReadonlyArray<PresenceUser<TData>>).map((u) => [
            u.connectionId,
            u,
          ]),
        )

        begin({ immediate: true })

        // Emit delete for users that have left.
        for (const connectionId of currentUsers.keys()) {
          if (!nextUsers.has(connectionId)) {
            write({ type: 'delete', key: connectionId })
          }
        }

        // Emit insert / update for new or changed users.
        for (const [connectionId, user] of nextUsers) {
          write({
            type: currentUsers.has(connectionId) ? 'update' : 'insert',
            value: user,
          })
        }

        commit()
        currentUsers = nextUsers
      })

      markReady()

      return () => {
        stopped = true
        unsub()
        currentUsers.clear()
      }
    },
  }

  return {
    id: id ?? `presence:${serializedChannel}`,
    schema,
    getKey: (item) => item.connectionId,
    sync,
  }
}
