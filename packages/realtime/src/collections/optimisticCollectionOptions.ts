/**
 * Optimistic collection options — extends `realtimeCollectionOptions` with
 * optimistic mutations and conflict resolution.
 *
 * When a mutation is initiated:
 * 1. The optimistic value is applied locally *immediately* (before the server
 *    round-trip) so the UI is responsive.
 * 2. The mutation is sent to the server via `onInsert`/`onUpdate`/`onDelete`.
 * 3. On success, the server-confirmed value replaces the optimistic one and
 *    is published to other clients.
 * 4. On failure, the optimistic value is **rolled back** and an optional
 *    `onRollback` callback is invoked.
 *
 * When two clients edit the same row concurrently, the `merge` function
 * resolves conflicts by combining the local pending state with the incoming
 * server value.
 */

import type { Store } from '@tanstack/store'
import type {
  CollectionConfig,
  InsertMutationFn,
  UpdateMutationFn,
  DeleteMutationFn,
  SyncConfig,
} from '@tanstack/db'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { RealtimeClient, QueryKey } from '../core/types.js'
import { serializeKey } from '../core/serializeKey.js'
import type { RealtimeChannelMessage } from './realtimeCollectionOptions.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PendingMutation<T, TKey> {
  /** Unique id for this pending mutation. */
  readonly id: number
  readonly type: 'insert' | 'update' | 'delete'
  readonly key: TKey
  /** The optimistic value applied locally. `undefined` for deletes. */
  readonly optimisticValue?: T
  /** The value before the optimistic change. `undefined` for inserts. */
  readonly previousValue?: T
  /** ISO timestamp of when the mutation was initiated. */
  readonly startedAt: string
}

export interface OptimisticState<T, TKey> {
  /** Mutations that have been applied optimistically but not yet confirmed. */
  readonly pending: ReadonlyArray<PendingMutation<T, TKey>>
}

export interface OptimisticCollectionConfig<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
> {
  client: RealtimeClient
  id?: string
  schema?: TSchema
  getKey: (item: T) => TKey
  channel: QueryKey | string
  queryFn?: () => Promise<T[]>

  onInsert?: InsertMutationFn<T, TKey>
  onUpdate?: UpdateMutationFn<T, TKey>
  onDelete?: DeleteMutationFn<T, TKey>

  /**
   * Resolve conflicts when an incoming server update targets a row that
   * has a pending optimistic mutation.
   *
   * - `local`: the local optimistic value from the in-flight mutation.
   * - `remote`: the incoming value from the server/channel.
   *
   * Return the merged value to apply. If not provided, the remote value
   * always wins (last-write-wins).
   */
  merge?: (local: T, remote: T) => T

  /**
   * Called when a mutation fails and its optimistic value is rolled back.
   */
  onRollback?: (mutation: PendingMutation<T, TKey>, error: unknown) => void

  /**
   * TanStack Store to expose pending mutation state to the UI.
   * Optional — if not provided, a store is created internally.
   */
  optimisticStore?: Store<OptimisticState<T, TKey>>
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Creates a TanStack DB `CollectionConfig` with optimistic mutations and
 * conflict resolution.
 *
 * @example
 * const todos = createCollection(
 *   optimisticCollectionOptions({
 *     client,
 *     id: 'todos',
 *     getKey: (t) => t.id,
 *     channel: 'todos',
 *     queryFn: () => api.listTodos(),
 *     onUpdate: async ({ transaction }) => {
 *       const item = transaction.mutations[0].modified
 *       return await api.updateTodo(item)
 *     },
 *     merge: (local, remote) => ({
 *       ...remote,
 *       // Preserve local edits for fields the server didn't touch
 *       ...local,
 *       // But always take the server's updatedAt
 *       updatedAt: remote.updatedAt,
 *     }),
 *     onRollback: (mutation, error) => {
 *       toast.error(`Failed to save: ${error}`)
 *     },
 *   })
 * )
 */
export function optimisticCollectionOptions<
  T extends object = Record<string, unknown>,
  TKey extends string | number = string,
  TSchema extends StandardSchemaV1 = StandardSchemaV1,
>(
  config: OptimisticCollectionConfig<T, TKey, TSchema>,
): CollectionConfig<T, TKey, TSchema> {
  const {
    client,
    channel,
    queryFn,
    onInsert,
    onUpdate,
    onDelete,
    merge,
    onRollback,
    ...collectionConfig
  } = config

  const serializedChannel =
    typeof channel === 'string' ? channel : serializeKey(channel)

  let nextMutationId = 1
  const pendingMutations: PendingMutation<T, TKey>[] = []

  // Track the last known value for each key so we can rollback.
  const knownValues = new Map<TKey, T>()

  // Sync hooks are captured when sync() is called.
  let syncBegin: ((opts?: { immediate?: boolean }) => void) | null = null
  let syncWrite:
    | ((op: { type: 'insert' | 'update' | 'delete'; value?: T; key?: TKey }) => void)
    | null = null
  let syncCommit: (() => void) | null = null

  function addPending(mutation: PendingMutation<T, TKey>): void {
    pendingMutations.push(mutation)
  }

  function removePending(id: number): PendingMutation<T, TKey> | undefined {
    const idx = pendingMutations.findIndex((m) => m.id === id)
    if (idx === -1) return undefined
    return pendingMutations.splice(idx, 1)[0]
  }

  function findPendingByKey(key: TKey): PendingMutation<T, TKey> | undefined {
    return pendingMutations.find((m) => m.key === key)
  }

  function rollback(mutation: PendingMutation<T, TKey>, error: unknown): void {
    removePending(mutation.id)

    if (syncBegin && syncWrite && syncCommit) {
      syncBegin({ immediate: true })
      if (mutation.type === 'insert') {
        // Rollback an insert = delete the optimistic row.
        syncWrite({ type: 'delete', key: mutation.key })
      } else if (mutation.type === 'delete') {
        // Rollback a delete = re-insert the previous value.
        if (mutation.previousValue) {
          syncWrite({ type: 'insert', value: mutation.previousValue })
        }
      } else {
        // Rollback an update = restore previous value.
        if (mutation.previousValue) {
          syncWrite({ type: 'update', value: mutation.previousValue })
        }
      }
      syncCommit()
    }

    onRollback?.(mutation, error)
  }

  const sync: SyncConfig<T, TKey> = {
    rowUpdateMode: 'full',

    sync({ begin, write, commit, markReady }) {
      let stopped = false
      syncBegin = begin
      syncWrite = write
      syncCommit = commit

      const unsub = client.subscribe(serializedChannel, (raw) => {
        if (stopped) return
        const msg = raw as RealtimeChannelMessage<T>
        if (!msg || typeof msg.action !== 'string') return

        const incomingKey = config.getKey(msg.data as T)
        const pending = findPendingByKey(incomingKey)

        begin({ immediate: true })
        if (msg.action === 'delete') {
          write({ type: 'delete', key: incomingKey })
          knownValues.delete(incomingKey)
        } else {
          let value = msg.data as T

          // Conflict resolution: if we have a pending optimistic mutation
          // for this key, merge local and remote values.
          if (pending && merge && pending.optimisticValue) {
            value = merge(pending.optimisticValue, value)
          }

          write({
            type: msg.action === 'insert' ? 'insert' : 'update',
            value,
          })
          knownValues.set(incomingKey, value)
        }
        commit()
      })

      if (queryFn) {
        queryFn()
          .then((rows) => {
            if (stopped) return
            begin()
            for (const row of rows) {
              write({ type: 'insert', value: row })
              knownValues.set(config.getKey(row), row)
            }
            commit()
            markReady()
          })
          .catch((err) => {
            console.error('[realtime] queryFn error', err)
            markReady()
          })
      } else {
        markReady()
      }

      return () => {
        stopped = true
        syncBegin = null
        syncWrite = null
        syncCommit = null
        unsub()
      }
    },
  }

  // Wrap mutation handlers with optimistic apply + rollback on failure.
  const wrappedOnInsert: InsertMutationFn<T, TKey> | undefined = onInsert
    ? async (params) => {
        const optimisticValue = params.transaction.mutations[0]?.modified as
          | T
          | undefined
        const key = optimisticValue
          ? config.getKey(optimisticValue)
          : ('' as TKey)

        const mutation: PendingMutation<T, TKey> = {
          id: nextMutationId++,
          type: 'insert',
          key,
          optimisticValue,
          startedAt: new Date().toISOString(),
        }
        addPending(mutation)

        try {
          const result = await onInsert(params)
          removePending(mutation.id)
          if (result != null) {
            knownValues.set(config.getKey(result), result)
            await client.publish(serializedChannel, {
              action: 'insert',
              data: result,
            } satisfies RealtimeChannelMessage)
          }
          return result
        } catch (error) {
          rollback(mutation, error)
          throw error
        }
      }
    : undefined

  const wrappedOnUpdate: UpdateMutationFn<T, TKey> | undefined = onUpdate
    ? async (params) => {
        const optimisticValue = params.transaction.mutations[0]?.modified as
          | T
          | undefined
        const key = optimisticValue
          ? config.getKey(optimisticValue)
          : ('' as TKey)
        const previousValue = knownValues.get(key)

        const mutation: PendingMutation<T, TKey> = {
          id: nextMutationId++,
          type: 'update',
          key,
          optimisticValue,
          previousValue,
          startedAt: new Date().toISOString(),
        }
        addPending(mutation)

        try {
          const result = await onUpdate(params)
          removePending(mutation.id)
          if (result != null) {
            knownValues.set(config.getKey(result), result)
            await client.publish(serializedChannel, {
              action: 'update',
              data: result,
            } satisfies RealtimeChannelMessage)
          }
          return result
        } catch (error) {
          rollback(mutation, error)
          throw error
        }
      }
    : undefined

  const wrappedOnDelete: DeleteMutationFn<T, TKey> | undefined = onDelete
    ? async (params) => {
        const key = params.transaction.mutations[0]?.key as TKey | undefined
        const previousValue = key !== undefined ? knownValues.get(key) : undefined

        const mutation: PendingMutation<T, TKey> = {
          id: nextMutationId++,
          type: 'delete',
          key: key ?? ('' as TKey),
          previousValue,
          startedAt: new Date().toISOString(),
        }
        addPending(mutation)

        try {
          const result = await onDelete(params)
          removePending(mutation.id)
          if (result != null) {
            knownValues.delete(config.getKey(result))
            await client.publish(serializedChannel, {
              action: 'delete',
              data: result,
            } satisfies RealtimeChannelMessage)
          }
          return result
        } catch (error) {
          rollback(mutation, error)
          throw error
        }
      }
    : undefined

  return {
    ...collectionConfig,
    sync,
    ...(wrappedOnInsert && { onInsert: wrappedOnInsert }),
    ...(wrappedOnUpdate && { onUpdate: wrappedOnUpdate }),
    ...(wrappedOnDelete && { onDelete: wrappedOnDelete }),
  }
}
