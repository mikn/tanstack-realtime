# TanStack Realtime

> Add realtime to your existing app — keep your server, your database, your deploy target. Live collections, pub/sub, presence, and CRDTs as a transport layer, not a platform. Built for [TanStack DB](https://github.com/TanStack/db).

[![npm version](https://img.shields.io/npm/v/@tanstack/realtime)](https://www.npmjs.com/package/@tanstack/realtime)
[![License](https://img.shields.io/github/license/mikn/tanstack-realtime)](LICENSE)
[![CI](https://github.com/mikn/tanstack-realtime/actions/workflows/ci.yml/badge.svg)](https://github.com/mikn/tanstack-realtime/actions/workflows/ci.yml)

> [!WARNING]
> This is **not** an official [TanStack](https://tanstack.com) project. It is a
> vibe-coded library that explores an architecture and structure for what a
> TanStack Realtime library could look like. Use it to experiment, get inspired,
> or contribute ideas — but do not rely on it in production.

- **Keep your backend** — not a platform. Your Express routes, your Postgres, your deploy target stay exactly where they are. Add a `channel` to one collection and it goes live.
- **One feature at a time** — start with `queryFn`. Add `channel` when ready. Add `fields` for CRDTs when you need conflict resolution. Each step is one config key — stop at any point.
- **Pub/sub + presence** — chat, typing indicators, live cursors, and activity feeds are first-class. These aren't database rows — they need channels and presence, not table sync.
- **Client-side CRDTs** — `{ votes: 'pn-counter', tags: 'or-set' }`. Merging happens on the client. Your server just stores and relays — no CRDT logic server-side.
- **Swap transports, not code** — `sseTransport` → `centrifugoTransport`. One import swap. Your collections and hooks don't change.
- **Resilient by default** — offline queue, gap recovery, deduplication, and automatic multi-tab coordination (SharedWorker → BroadcastChannel → direct)

## Packages

| Package                                                                         | Description                                                            |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`@tanstack/realtime`](#tanstackrealtime)                                       | Core client, collection helpers, CRDT primitives, and type definitions |
| [`@tanstack/react-realtime`](#tanstackreact-realtime)                           | React hooks and provider                                               |
| [`@tanstack/solid-realtime`](#tanstacksolid-realtime)                           | Solid primitives and provider                                          |
| [`@tanstack/vue-realtime`](#tanstackvue-realtime)                               | Vue composables and provider                                           |
| [`@tanstack/realtime-adapter-centrifugo`](#tanstackrealtime-adapter-centrifugo) | Transport adapter for [Centrifugo](https://centrifugal.dev)            |
| [`@tanstack/realtime-adapter-sse`](#tanstackrealtime-adapter-sse)               | Server-Sent Events transport adapter                                   |
| [`@tanstack/realtime-preset-start`](#tanstackrealtime-preset-start)             | TanStack Start preset with SSE handler and publish backend             |
| [`@tanstack/react-realtime-devtools`](#devtools)                                | React developer tools panel                                            |
| [`@tanstack/solid-realtime-devtools`](#devtools)                                | Solid developer tools panel                                            |
| [`@tanstack/vue-realtime-devtools`](#devtools)                                  | Vue developer tools panel                                              |

---

## `@tanstack/realtime`

Framework-agnostic core. Exposes `createRealtimeClient`, collection helpers (`realtimeCollectionOptions`, `liveChannelOptions`, `presenceChannelOptions`, `streamChannelOptions`), CRDT primitives, channel-key serialization, and all shared types.

### Installation

```bash
npm install @tanstack/realtime
```

### Creating a client

```ts
import {
  createCoordinatedTransport,
  createRealtimeClient,
} from '@tanstack/realtime'
import { sseTransport } from '@tanstack/realtime-adapter-sse'

// Recommended: automatic multi-tab coordination
export const client = createRealtimeClient({
  transport: createCoordinatedTransport({
    transport: () => sseTransport({ url: '/api/realtime/sse' }),
  }),
})

await client.connect()
```

### Multi-Tab Coordination

When a user opens your app in multiple browser tabs, each tab would normally open its own connection — multiplying server load, bandwidth, and the potential for state conflicts. `createCoordinatedTransport` solves this by sharing a single connection across all tabs. It picks the best available strategy automatically:

| Strategy             | When used                                                                              | How it works                                                                                                                                                                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SharedWorker**     | `workerUrl` is provided and `SharedWorker` API is available                            | The browser spawns a **separate worker process** from the URL you provide. This worker lives independently of any tab — it survives tab close, sleep, and crashes. All tabs connect to it via `MessagePort`. No election, no heartbeat.                                            |
| **BroadcastChannel** | No `workerUrl` (or `SharedWorker` unavailable) and `BroadcastChannel` API is available | One tab is elected **leader** and holds the real connection. Other tabs proxy through `BroadcastChannel` messages. Includes heartbeat-based failure detection — if the leader tab closes or crashes, a new leader is elected automatically. **Zero config — this is the default.** |
| **Direct**           | Neither API is available                                                               | Each tab opens its own connection. No coordination.                                                                                                                                                                                                                                |

**Why does SharedWorker need a `workerUrl`?** SharedWorker is a browser API that runs code in a separate thread, shared across tabs. Unlike BroadcastChannel (which is just a messaging API you use inline), the browser needs to **load a separate JavaScript file** to run the worker. That file sets up the coordinator with your transport config:

```ts
// realtime.worker.ts — a separate file your bundler produces
import { createSharedWorkerCoordinator } from '@tanstack/realtime'
import { centrifugoTransport } from '@tanstack/realtime-adapter-centrifugo'

// createSharedWorkerCoordinator requires a PresenceCapable transport.
// The Centrifugo adapter implements PresenceCapable; sseTransport does not.
const coordinator = createSharedWorkerCoordinator(
  centrifugoTransport({
    url: 'wss://your-centrifugo.example.com/connection/websocket',
    token: () => fetchAuthToken(),
  }),
)

self.addEventListener('connect', (e) => {
  coordinator.connect((e as MessageEvent).ports[0]!)
})
```

Then in your app code you point to it:

```ts
const transport = createCoordinatedTransport({
  transport: () =>
    centrifugoTransport({
      url: 'wss://your-centrifugo.example.com/connection/websocket',
      token: () => fetchAuthToken(),
    }),
  workerUrl: new URL('./realtime.worker.ts', import.meta.url),
})
```

**For most apps, you don't need this.** The BroadcastChannel default works great with zero setup. SharedWorker is the premium option for apps that need maximum robustness (no election delay, survives tab crashes instantly, no heartbeat overhead).

---

## `@tanstack/react-realtime`

React adapter. Provides a context provider and hooks that integrate with the core client.

### Installation

```bash
npm install @tanstack/realtime @tanstack/react-realtime
```

### Quick start

```tsx
// 1. Wrap your app
import { RealtimeProvider } from '@tanstack/react-realtime'
import { client } from './client'

export function App() {
  return (
    <RealtimeProvider client={client}>
      <MyApp />
    </RealtimeProvider>
  )
}
```

```tsx
// 2. Subscribe to a channel
import { useSubscribe } from '@tanstack/react-realtime'

function Chat({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<string[]>([])

  useSubscribe(['chat', { roomId }], (msg) => {
    setMessages((prev) => [...prev, String(msg)])
  })

  return (
    <ul>
      {messages.map((m, i) => (
        <li key={i}>{m}</li>
      ))}
    </ul>
  )
}
```

```tsx
// 3. Publish to a channel
import { usePublish } from '@tanstack/react-realtime'

function ChatInput({ roomId }: { roomId: string }) {
  const publish = usePublish(['chat', { roomId }])
  return <button onClick={() => publish('Hello!')}>Send</button>
}
```

```tsx
// 4. Presence — track other connected users
import { createPresenceChannel, usePresence } from '@tanstack/react-realtime'

const editorPresence = createPresenceChannel<{ documentId: string }>({
  id: 'editor',
  channel: ({ documentId }) => ['editor', { documentId }],
})

function Editor({
  documentId,
  userName,
}: {
  documentId: string
  userName: string
}) {
  const { others, updatePresence } = usePresence(editorPresence, {
    params: { documentId },
    initial: { cursor: null, name: userName },
  })

  return (
    <div
      onMouseMove={(e) =>
        updatePresence({ cursor: { x: e.clientX, y: e.clientY } })
      }
    >
      {others.map((u) => (
        <Cursor key={u.connectionId} user={u} />
      ))}
    </div>
  )
}
```

```tsx
// 5. Connection status
import { useRealtime } from '@tanstack/react-realtime'

function StatusBar() {
  const { status, connect, disconnect } = useRealtime()
  return <span>{status}</span>
}
```

### Hooks

| Hook                                               | Description                                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `useRealtime()`                                    | Returns `{ status, connect, disconnect, client }`                                                                               |
| `useSubscribe(channel, onMessage)`                 | Subscribe to raw channel messages for the component lifetime                                                                    |
| `usePublish(channel)`                              | Returns a stable publish function for a channel                                                                                 |
| `useChannel(channel, onMessage?)`                  | Combined subscribe + publish; returns `{ publish }`                                                                             |
| `usePresence(channelDef, options)`                 | Join a presence channel; returns `{ others, updatePresence }`                                                                   |
| `useStream(channelDef, options)`                   | Subscribe to a reduce-based stream; returns `{ state, status, error }`                                                          |
| `useRealtimeCollection(config)`                    | Returns a TanStack DB `Collection` backed by a realtime channel                                                                 |
| `useLiveChannel(config)`                           | Returns a TanStack DB `Collection` for append-only event streams                                                                |
| `useConnectionStatus()`                            | Returns reactive `ConnectionStatus` value                                                                                       |
| `useIsConnected()`                                 | Returns `boolean` — `true` when connected                                                                                       |
| `useLatestMessage(channel)`                        | Returns the most recent message on a channel                                                                                    |
| `useChannelHistory(channel, opts)`                 | Accumulates channel messages into an array with configurable max length                                                         |
| `useTypingIndicator(channel, opts)`                | Typing indicator with auto-expire; returns `{ typing, startTyping, stopTyping }`                                                |
| `useChannelStats(channel)`                         | Returns `{ messageCount, lastMessageAt }` for a channel                                                                         |
| `useOnReconnect(callback)`                         | Fires a callback whenever the client reconnects                                                                                 |
| `useSyncedCounter(def, options)`                   | Standalone CRDT counter; returns `{ value, increment, decrement }`                                                              |
| `useSyncedValue(def, options)`                     | Standalone CRDT LWW value; returns `{ value, set }`                                                                             |
| `useSyncedSet(def, options)`                       | Standalone CRDT OR-set; returns `{ values, add, remove, has }`                                                                  |
| `useReactiveQuery(serverFn, args, opts?)`          | Fetches + subscribes to a `queryWithChannel` server function; auto-refetches on reconnect; shared query cache across components |
| `useReactiveMutation(mutateFn, opts?)`             | Wraps a server mutation with `isPending`/`error`/`data` state                                                                   |
| `useReactivePaginatedQuery(serverFn, args, opts?)` | Paginated variant of `useReactiveQuery`; `fetchNextPage`, `hasNextPage`, live first-page updates                                |

> **Vue** (`@tanstack/vue-realtime`) exports the same composables with identical names and signatures. Args may be `MaybeRef<T>` — pass reactive refs and the composable will watch them.
>
> **Solid** (`@tanstack/solid-realtime`) exports the same primitives, with `createReactiveQuery`, `createReactiveMutation`, and `createReactivePaginatedQuery` named as `create*` (Solid convention). Remaining hooks keep the `use*` name.

---

## `@tanstack/solid-realtime`

Solid adapter. Exports the same primitives as the React adapter, backed by Solid signals and `createEffect`.

### Installation

```bash
npm install @tanstack/realtime @tanstack/solid-realtime
```

### Quick start

```tsx
import {
  RealtimeProvider,
  useRealtime,
  useSubscribe,
} from '@tanstack/solid-realtime'
import { client } from './client'

function App() {
  return (
    <RealtimeProvider client={client}>
      <MyApp />
    </RealtimeProvider>
  )
}
```

All hooks from the React adapter are available: `useSubscribe`, `usePublish`, `useChannel`, `usePresence`, `useStream`, `useRealtimeCollection`, `useLiveChannel`, `useConnectionStatus`, `useIsConnected`, `useLatestMessage`, `useChannelHistory`, `useTypingIndicator`, `useChannelStats`, `useOnReconnect`, `useSyncedCounter`, `useSyncedValue`, `useSyncedSet`.

Testing utilities (`createTestRealtimeProvider`, `createTestRealtimeProviderWithPresence`) are also exported.

---

## `@tanstack/vue-realtime`

Vue adapter. Exports composables that return Vue `ref`/`computed` values.

### Installation

```bash
npm install @tanstack/realtime @tanstack/vue-realtime
```

### Quick start

```vue
<script setup lang="ts">
import {
  RealtimeProvider,
  useRealtime,
  useSubscribe,
} from '@tanstack/vue-realtime'
import { client } from './client'
</script>

<template>
  <RealtimeProvider :client="client">
    <MyApp />
  </RealtimeProvider>
</template>
```

All hooks from the React adapter are available as Vue composables with the same names and signatures.

Testing utilities (`createTestRealtimeProvider`, `createTestRealtimeProviderWithPresence`) are also exported.

---

## `@tanstack/realtime-adapter-centrifugo`

Transport adapter for [Centrifugo](https://centrifugal.dev). Supports token-based auth, server-assisted gap recovery, and presence.

### Installation

```bash
npm install @tanstack/realtime @tanstack/realtime-adapter-centrifugo
```

### Usage

```ts
import { createRealtimeClient } from '@tanstack/realtime'
import { centrifugoTransport } from '@tanstack/realtime-adapter-centrifugo'

export const client = createRealtimeClient({
  transport: centrifugoTransport({
    url: 'wss://your-centrifugo.example.com/connection/websocket',

    // Static token or async function called on every (re)connect
    token: () => fetchAuthToken(),
  }),
})
```

### Options

| Option           | Type                                          | Default                | Description                                       |
| ---------------- | --------------------------------------------- | ---------------------- | ------------------------------------------------- |
| `url`            | `string`                                      | —                      | Centrifugo WebSocket endpoint (required)          |
| `token`          | `string \| (() => string \| Promise<string>)` | —                      | Connection JWT or async provider                  |
| `data`           | `Record<string, unknown>`                     | —                      | Arbitrary data sent with the connect command      |
| `presencePrefix` | `string`                                      | `'$prs:'`              | Prefix Centrifugo uses for presence channel names |
| `initialDelay`   | `number`                                      | `1000`                 | First reconnect delay in ms                       |
| `maxDelay`       | `number`                                      | `30000`                | Maximum reconnect delay in ms                     |
| `jitter`         | `number`                                      | `0.25`                 | Reconnect jitter factor (0–1)                     |
| `WebSocket`      | `typeof WebSocket`                            | `globalThis.WebSocket` | Override for Node.js environments                 |

---

## `@tanstack/realtime-adapter-sse`

Server-Sent Events transport. Ideal for environments where WebSockets are unavailable. Publishes over HTTP POST; receives over a persistent SSE stream. No presence support.

### Installation

```bash
npm install @tanstack/realtime @tanstack/realtime-adapter-sse
```

### Server

```ts
import { createSseHandler } from '@tanstack/realtime-adapter-sse'

const handler = createSseHandler({
  // Identify the user from the request (return null to reject)
  async getUser(req) {
    const userId = await getUserIdFromRequest(req)
    return userId ? { userId } : null
  },

  // Authorize per-channel access (subscribe and publish permissions)
  async authorize(userId, channel) {
    return true // allow all authenticated users; add channel.namespace checks here
  },

  pingInterval: 30_000, // default; set to 0 to disable keepalive pings
})

// In your framework's route handler (e.g. Hono, Express, Next.js)
// GET  /_realtime  → SSE stream
// POST /_realtime  → publish action
app.all('/_realtime', (req) => handler.handle(req))

// Server-side broadcast
handler.broadcast('todos:teamId=123', { type: 'created', todo })

// Server-side streaming (e.g. AI token generation)
const stream = handler.createStream({ channel: ['ai', { sessionId }] })
for await (const chunk of llmResponse) {
  await stream.push({ type: 'token', content: chunk })
}
await stream.done()
```

The handler also supports **lifecycle hooks** for observing connections and subscriptions:

```ts
const handler = createSseHandler({
  getUser,
  authorize,
  onClientConnect: ({ connectionId, userId }) => {
    console.log(`${userId} connected`)
  },
  onClientDisconnect: ({ connectionId, userId }) => {
    console.log(`${userId} disconnected`)
  },
  onFirstSubscriber: (channel) => startLiveQuery(channel),
  onChannelEmpty: (channel) => stopLiveQuery(channel),
})
```

### Client transport

```ts
import { createRealtimeClient } from '@tanstack/realtime'
import { sseTransport } from '@tanstack/realtime-adapter-sse'

export const client = createRealtimeClient({
  transport: sseTransport({
    url: 'https://my-app.example.com/_realtime',
    getToken: () => authStore.token,
  }),
})
```

---

## `@tanstack/realtime-preset-start`

TanStack Start preset. Provides an SSE-based request handler for TanStack Router API routes and a pluggable `PublishBackend` interface for horizontal scaling.

### Installation

```bash
npm install @tanstack/realtime @tanstack/realtime-preset-start
```

### Usage

```ts
// app/server/realtime.ts
import { createStartHandler } from '@tanstack/realtime-preset-start'

export const realtime = createStartHandler({
  getUser: async (req) => {
    const session = await getSession(req)
    return session ? { userId: session.userId } : null
  },
})

export const realtimePublish = realtime.publish
```

```ts
// app/routes/api/realtime.ts
import { createAPIFileRoute } from '@tanstack/start/api'
import { realtime } from '../../server/realtime'

export const Route = createAPIFileRoute('/api/realtime')({
  GET: ({ request }) => realtime.handle(request),
  POST: ({ request }) => realtime.handle(request),
  OPTIONS: ({ request }) => realtime.handle(request),
})
```

For the client side, pair with `sseTransport` from `@tanstack/realtime-adapter-sse`.

### `queryWithChannel`

Wraps a server query to return `{ data, channel }` — the channel is auto-derived from the SQL `WHERE` clause so the client can subscribe to live updates:

```ts
export const getTodos = realtime.queryWithChannel(
  async (db, { teamId }: { teamId: string }) => {
    return db.select().from(todos).where(eq(todos.teamId, teamId))
  },
)
```

Return type: `ReactiveQueryResult<T> = { data: T; channel: string }`. Pair with `useReactiveQuery` on the client.

---

## DevTools

Developer tools panels for inspecting channels, messages, presence, connection state, and the offline queue. Available for all three frameworks.

### Installation

```bash
# React
npm install @tanstack/react-realtime-devtools

# Solid
npm install @tanstack/solid-realtime-devtools

# Vue
npm install @tanstack/vue-realtime-devtools
```

### Usage (React)

```tsx
import { RealtimeDevtools } from '@tanstack/react-realtime-devtools'

function App() {
  return (
    <RealtimeProvider client={client}>
      <MyApp />
      <RealtimeDevtools />
    </RealtimeProvider>
  )
}
```

The `RealtimeDevtools` component renders a floating panel (toggleable) that shows active subscriptions, a message log, connection state timeline, and offline queue status. Solid and Vue versions use the same `<RealtimeDevtools />` component from their respective packages.

---

## Live Collections (TanStack DB integration)

`@tanstack/realtime` ships helpers that wire [TanStack DB](https://github.com/TanStack/db) collections to live channels so server-pushed mutations are reflected instantly in your UI.

### `realtimeCollectionOptions` — server-managed rows

Use this when your server owns the source of truth and pushes `insert` / `update` / `delete` events.

```ts
import { createCollection } from '@tanstack/db'
import { realtimeCollectionOptions } from '@tanstack/realtime'
import { client } from './client'

interface Todo {
  id: string
  title: string
  done: boolean
}

export const todosCollection = createCollection(
  realtimeCollectionOptions<Todo, string>({
    client,
    channel: ['todos', { teamId: '123' }],
    getKey: (todo) => todo.id,

    // Optional: load initial rows from the server
    queryFn: () => fetch('/api/todos').then((r) => r.json()),

    // Optimistic mutations — publish-back is automatic on the primary channel
    onInsert: async ({ transaction }) => {
      const todo = transaction.mutations[0]!.changes as Todo
      await fetch('/api/todos', { method: 'POST', body: JSON.stringify(todo) })
    },
    onUpdate: async ({ transaction }) => {
      /* ... */
    },
    onDelete: async ({ transaction }) => {
      /* ... */
    },
  }),
)
```

The message shape the server should publish:

```json
{ "action": "insert", "data": { "id": "abc", "title": "Buy milk", "done": false } }
{ "action": "update", "data": { "id": "abc", "done": true } }
{ "action": "delete", "data": { "id": "abc" } }
```

### `liveChannelOptions` — append-only event streams

Use this for chat, activity feeds, or any stream where events are appended rather than mutated.

```ts
import { createCollection } from '@tanstack/db'
import { liveChannelOptions } from '@tanstack/realtime'
import { client } from './client'

interface ChatMessage {
  id: string
  text: string
  author: string
}

export const messagesCollection = createCollection(
  liveChannelOptions<ChatMessage, string>({
    client,
    channel: ['chat', { roomId: '42' }],
    getKey: (msg) => msg.id,
    onEvent: (raw) => raw as ChatMessage,

    // Load message history on first mount
    initialData: () => fetch('/api/chat/42/history').then((r) => r.json()),
  }),
)
```

### `presenceChannelOptions` — live presence list

Observe who is currently connected to a channel as a TanStack DB collection. Each row is a `PresenceUser<TData>` (`{ connectionId: string; data: TData }`). The current user is always excluded.

```ts
import { createCollection } from '@tanstack/db'
import { presenceChannelOptions } from '@tanstack/realtime'
import { client } from './client'

export const viewersCollection = createCollection(
  presenceChannelOptions<{ name: string; avatar: string }>({
    client,
    channel: ['document', { id: 'doc-1' }],
    id: 'viewers',
  }),
)
```

### `streamChannelOptions` / `createStreamChannel` — reduce-based streams

Use this for long-running server operations (AI generation, progress tracking) where the client reduces a stream of events into a single accumulated state.

The recommended pattern: define the channel shape once with `createStreamChannel`, then consume with the `useStream` React hook or `streamChannelOptions` for direct TanStack DB use.

```ts
// features/ai/stream.ts — define once, share everywhere
import { createStreamChannel, serverStreamCallbacks } from '@tanstack/realtime'

export const aiStream = createStreamChannel({
  id: 'ai-response',
  channel: (params: { requestId: string }) => ['ai', params],
  initial: { content: '' },
  reduce: (state, event: { type: string; token?: string }) =>
    event.type === 'token'
      ? { content: state.content + (event.token ?? '') }
      : state,
  ...serverStreamCallbacks,
  staleAfter: 15_000,
})
```

```tsx
// features/ai/AIResponse.tsx — consume in React
import { useStream } from '@tanstack/react-realtime'
import { aiStream } from './stream'

function AIResponse({ requestId }: { requestId: string }) {
  const { state, status, error } = useStream(aiStream, {
    params: { requestId },
  })
  if (status === 'pending') return <p>Thinking…</p>
  if (status === 'error') return <p>Error: {error}</p>
  return <p>{state.content}</p>
}
```

For direct TanStack DB collection use (without the React hook):

```ts
import { createCollection } from '@tanstack/db'
import { streamChannelOptions, serverStreamCallbacks } from '@tanstack/realtime'
import { client } from './client'

export const generationCollection = createCollection(
  streamChannelOptions({
    client,
    channel: ['generation', { id: 'run-1' }],
    initial: '',
    reduce: (state, event: { type: string; token?: string }) =>
      event.type === 'token' ? state + (event.token ?? '') : state,
    ...serverStreamCallbacks,
  }),
)
```

---

## Reactive Server Queries

`queryWithChannel` + `useReactiveQuery` close the gap between write-time invalidation and read-time reactivity without introducing a new query layer. The server wraps an existing query in `queryWithChannel`; the client hooks subscribe to the SSE channel returned alongside the data.

### Server: `queryWithChannel`

```ts
import { realtime } from './realtime' // createStartHandler result

export const getTodos = realtime.queryWithChannel(
  async (db, { teamId }: { teamId: string }) => {
    return db.select().from(todos).where(eq(todos.teamId, teamId))
  },
)
```

`getTodos` is a regular async function that returns `ReactiveQueryResult<Todo[]>` — the query result plus the channel name the client should subscribe to.

### Client: `useReactiveQuery`

```tsx
import { useReactiveQuery } from '@tanstack/react-realtime'
import { getTodos } from '../server/todos'

function TodoList({ teamId }: { teamId: string }) {
  const { data, isPending, error, optimisticUpdate, refetch } =
    useReactiveQuery(getTodos, { teamId })

  if (isPending) return <Spinner />
  if (error) return <Error error={error} />
  return <List items={data} />
}
```

### Optimistic updates

`optimisticUpdate(transform)` applies an immediate local change and returns a `rollback` function:

```tsx
const { optimisticUpdate } = useReactiveQuery(getTodos, { teamId })

async function handleAdd(title: string) {
  const rollback = optimisticUpdate((prev) => [
    ...(prev ?? []),
    { id: 'temp', title, done: false },
  ])
  try {
    await createTodo({ teamId, title })
  } catch {
    rollback()
  }
}
```

### Shared query cache

Multiple components using the same `(serverFn, args)` share one TanStack DB `Collection` — one fetch, one SSE subscription, and automatically propagated optimistic updates. The cache is keyed by function identity + `JSON.stringify(args)`.

**Arg serialisation note:** args must be JSON-serialisable. Property insertion order matters for the cache key (`{a:1,b:2}` ≠ `{b:2,a:1}`), so use a consistent arg shape.

---

## CRDT Primitives

`@tanstack/realtime` ships conflict-free data type helpers for collaborative state. Annotate collection fields with a CRDT strategy via the `fields` option on `realtimeCollectionOptions`:

```ts
realtimeCollectionOptions<Counter, string>({
  // ...
  fields: {
    count: 'pn-counter', // concurrent increments always sum correctly
    tags: 'or-set', // concurrent add/remove never conflicts
    title: 'lww', // last-write-wins (Lamport clock tiebreak)
    draft: 'local', // client-only; never synced
  },
})
```

| Strategy       | Export                                    | Description                                                         |
| -------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| `'lww'`        | `lwwWins`                                 | Last-write-wins using Lamport clocks with clientId tiebreak         |
| `'pn-counter'` | `pnIncrement` / `pnDecrement` / `pnValue` | Concurrent counter increments and decrements always converge        |
| `'or-set'`     | `orAdd` / `orRemove` / `orValues`         | Observed-remove set; concurrent add/remove never produces conflicts |
| `'local'`      | —                                         | Field is never sent to the server; used for local UI state          |

---

## License

[MIT](LICENSE) © [mikn](https://github.com/mikn) — Not affiliated with or endorsed by TanStack.
