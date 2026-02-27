# TanStack Realtime — New Features

Five new features designed for TanStack Start integration, where server
functions are ephemeral (stateless, single-call lifetime). All features are
additive and backward-compatible.

---

## Table of Contents

1. [Optimistic Updates](#1-optimistic-updates)
2. [Pluggable Offline Queue Storage](#2-pluggable-offline-queue-storage)
3. [Server-Authoritative Validation](#3-server-authoritative-validation)
4. [Server-Initiated Streams](#4-server-initiated-streams)
5. [Tick-Based Update Model](#5-tick-based-update-model)

---

## 1. Optimistic Updates

Echo suppression for `realtimeCollectionOptions` — mutations include a nonce
so that when the message is echoed back from the channel, it is silently
dropped instead of being applied twice.

### Config

```ts
realtimeCollectionOptions({
  client,
  channel: ['todos', { projectId }],
  getKey: (t) => t.id,
  optimistic: true,  // NEW
  onOptimisticError: ({ action, key, error }) => {
    toast.error(`Failed to ${action} item ${key}`)
  },
  onInsert: async ({ transaction }) => {
    return await createTodo(transaction.mutations[0].modified)
  },
})
```

### How it works

1. When `optimistic: true`, each mutation publish includes `_nonce` and
   `_clientId` fields in the `RealtimeChannelMessage`.
2. The nonce is added to a pending set before the mutation callback runs.
3. When the server echoes back the message to all subscribers (including the
   sender), the receiving `applyMessage` checks `_clientId` + `_nonce`
   against the pending set and skips it if matched.
4. If the mutation callback throws, the nonce is cleaned up and
   `onOptimisticError` is called. TanStack DB handles the actual rollback.

### Wire protocol addition

```ts
interface RealtimeChannelMessage<T> {
  action: 'insert' | 'update' | 'delete'
  data: T
  _crdt?: CrdtMessageHeader
  _nonce?: string     // NEW: echo suppression nonce
  _clientId?: string  // NEW: originator client ID
}
```

### Breaking changes

None. `optimistic` defaults to `false`.

---

## 2. Pluggable Offline Queue Storage

Persist queued messages across page refreshes via a storage adapter.

### Usage

```ts
import {
  createOfflineQueue,
  createIndexedDBStorage,
  createLocalStorageAdapter,
} from '@tanstack/realtime'

// IndexedDB (recommended — no size limit)
const queue = createOfflineQueue(transport, {
  storage: createIndexedDBStorage(),
})

// localStorage (fallback — 5 MB limit)
const queue = createOfflineQueue(transport, {
  storage: createLocalStorageAdapter(),
})

// Memory-only (existing behavior — omit storage)
const queue = createOfflineQueue(transport)
```

### Custom storage adapter

Implement `OfflineQueueStorage` for custom backends:

```ts
interface OfflineQueueStorage {
  load(): Promise<Array<QueuedMessage>>
  save(messages: ReadonlyArray<QueuedMessage>): Promise<void>
  clear(): Promise<void>
}
```

### Behavior

- On creation, `storage.load()` is called and persisted messages are merged
  with any messages enqueued during initialization.
- After every enqueue and flush, `storage.save()` is called.
- `clearQueue()` calls `storage.clear()`.
- Queue IDs continue from the highest persisted ID to prevent collisions.

### Breaking changes

None. `storage` is optional; omitting it preserves existing memory-only
behavior.

---

## 3. Server-Authoritative Validation

Two mechanisms for server-side publish validation:

### A. `createValidatedPublish` — TanStack Start compatible

A stateless wrapper around `PublishFn`. Runs validation within the ephemeral
server function — no persistent server required.

```ts
import { createValidatedPublish, PublishValidationError } from '@tanstack/realtime'

const validatedPublish = createValidatedPublish({
  publish: async (channel, data) => {
    const ch = typeof channel === 'string' ? channel : serializeKey(channel)
    nodeServer.publish(ch, data)
  },
  validate: async ({ channel, data, userId }) => {
    if (channel.namespace === 'todos') {
      const result = todoSchema.safeParse((data as any).data)
      if (!result.success) {
        return { accepted: false, reason: result.error.message }
      }
      return { accepted: true, data: result.data }
    }
    return { accepted: true }
  },
})

// In a TanStack Start server function:
export const updateTodo = createServerFn()(async ({ id, data }) => {
  const updated = await db.todos.update(id, data)
  await validatedPublish(['todos', { projectId }], {
    action: 'update',
    data: updated,
  })
  return updated
})
```

On rejection, throws `PublishValidationError` with the reason string. On
acceptance with data transformation, the transformed data is published.

### B. `onPublish` hook in `createNodeServer`

For deployments with a persistent Node.js server:

```ts
const nodeServer = createNodeServer({
  getUser,
  authorize,
  onPublish: async ({ channel, data, userId }) => {
    if (channel.namespace === 'todos') {
      const result = todoSchema.safeParse(data)
      if (!result.success) return { accepted: false, reason: result.error.message }
      return { accepted: true, data: result.data }
    }
    return { accepted: true }
  },
})
```

When a client publishes with a `requestId`, the server sends back
`publish:ack` or `publish:error` so the client can await confirmation.

### Type signatures

```ts
interface PublishValidation {
  channel: ParsedChannel
  rawChannel: string
  data: unknown
  userId?: string
}

interface PublishValidationResult {
  accepted: boolean
  reason?: string
  data?: unknown  // transformed data
}

type ValidatePublishFn = (
  params: PublishValidation,
) => PublishValidationResult | Promise<PublishValidationResult>
```

### Breaking changes

None. `onPublish` is optional on `NodeServerOptions`; `createValidatedPublish`
is a new API.

---

## 4. Server-Initiated Streams (Server Push)

A structured API for pushing server-side events to channels. Designed for
TanStack Start server functions — no persistent server process assumed.

### `createServerStream`

```ts
import { createServerStream } from '@tanstack/realtime'

// In a TanStack Start server function
export const generateAI = createServerFn()(async ({ sessionId }) => {
  const stream = createServerStream({
    publish: realtimePublish,  // your PublishFn
    channel: ['ai', { sessionId }],
  })

  for await (const chunk of llmResponse) {
    await stream.push({ type: 'token', content: chunk })
  }
  await stream.done()  // sends { type: '__stream:done' }
})
```

### Sentinel events

- `stream.done()` → publishes `{ type: '__stream:done' }`
- `stream.error(message)` → publishes `{ type: '__stream:error', message }`

### Client consumption

Use `streamChannelOptions` with `isDone` and `isError`:

```ts
streamChannelOptions({
  client,
  channel: ['ai', { sessionId }],
  initial: '',
  reduce: (state, event) =>
    event.type === 'token' ? state + event.content : state,
  isDone: (_s, e) => e.type === '__stream:done',
  isError: (_s, e) =>
    e.type === '__stream:error' ? e.message : false,
})
```

### NodeServer / SseHandler convenience

Both `NodeServer` and `SseHandler` expose a `createStream()` method:

```ts
const stream = nodeServer.createStream({ channel: ['ai', { sessionId }] })
const stream = sseHandler.createStream({ channel: ['ai', { sessionId }] })
```

### HMAC signing (optional)

```ts
const stream = createServerStream({
  publish,
  channel: 'ai:session=abc',
  hmacKey: process.env.STREAM_HMAC_KEY,
})
```

Each event includes a `_signature` field. Clients can verify with
`verifyEventSignature()`.

### Breaking changes

None. `createServerStream` is a new API. `createStream` is a new method on
existing server objects.

---

## 5. Tick-Based Update Model

For high-frequency game state updates (60Hz+). Batches state updates per
tick interval and sends them as a single frame.

### Transport wrapper

```ts
import { tickTransport, wsTransport } from '@tanstack/realtime'

const tick = tickTransport(
  wsTransport({ url: 'ws://localhost:3001' }),
  { tickMs: 16, deltaCompression: true },
)

// Set entity state each frame
tick.setState('game:room-1', myPlayerId, { x: 100, y: 200 })

// Receive batched frames from all players
tick.onTick('game:room-1', (frame) => {
  for (const [entityId, state] of Object.entries(frame.entities)) {
    updateEntity(entityId, state)
  }
  for (const entityId of frame.removed) {
    removeEntity(entityId)
  }
})
```

### Tick frame structure

```ts
interface TickFrame {
  tick: number                       // monotonic tick counter
  timestamp: number                  // ms since epoch
  entities: Record<string, unknown>  // entityId → state (or delta)
  removed: Array<string>             // removed entity IDs
}
```

### Delta compression

When `deltaCompression: true`, only changed fields are sent after the first
frame. Use `computeDelta()` and `applyDelta()` for manual delta handling:

```ts
import { computeDelta, applyDelta } from '@tanstack/realtime'

const delta = computeDelta(prev, next)   // null if identical
const full = applyDelta(base, delta)     // reconstruct from base + delta
```

### Collection integration

```ts
import { tickCollectionOptions } from '@tanstack/realtime'

const playerCollection = createCollection(tickCollectionOptions({
  transport: tickTransport,
  channel: 'game:room-1',
  getKey: (p) => p.id,
  keyToEntityId: (key) => key,
  fromEntity: (entityId, state) => ({
    id: entityId,
    ...(state as { x: number; y: number }),
  }),
  interpolate: (prev, next, alpha) => ({
    ...prev,
    x: prev.x + (next.x - prev.x) * alpha,
    y: prev.y + (next.y - prev.y) * alpha,
  }),
}))
```

### Breaking changes

None. Tick-based APIs are entirely new; existing event-driven patterns are
unchanged.

---

## Architecture: TanStack Start Integration

All server-side features are designed for the TanStack Start constraint:
**server functions are ephemeral**. There is no persistent server process
holding WebSocket connections.

### Pattern

```
Client → Server Function → External Pub/Sub → Subscribers
```

1. **Client** calls a TanStack Start server function (mutation, AI request).
2. **Server function** validates, persists, then publishes to an external
   channel via `PublishFn`.
3. **External pub/sub** (Centrifugo, managed WS service, or the Node preset
   for single-process deployments) fans out to all subscribers.
4. **Subscribers** receive via their WebSocket/SSE connection.

The server function never holds a reference to connected clients — it
publishes via a `PublishFn` that routes to the external service.
