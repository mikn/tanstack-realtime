# realtime.js

> **Bring your own backend.**
>
> _The kitchen sink you actually need for proper realtime — sync, presence, CRDTs, and offline — with no platform and no per-seat bill._

[![npm version](https://img.shields.io/npm/v/realtime.js)](https://www.npmjs.com/package/realtime.js)
[![License](https://img.shields.io/github/license/mikn/tanstack-realtime)](LICENSE)
[![CI](https://github.com/mikn/tanstack-realtime/actions/workflows/ci.yml/badge.svg)](https://github.com/mikn/tanstack-realtime/actions/workflows/ci.yml)

> [!WARNING]
> **Project status:** `realtime.js` is **experimental and pre-1.0**. The API
> still moves, and it has not been hardened in production. Use it to experiment,
> build prototypes, and contribute ideas — but pin your versions and expect
> breaking changes before 1.0.

- **Bring your own backend** — `realtime.js` is a library, not a platform. Your Express/Hono routes, your Postgres, your deploy target stay exactly where they are. Add a `channel` to one collection and it goes live.
- **No platform, no lock-in** — no proprietary database, no required hosting, no SDK that owns your data. Self-host the transport you already run, or point it at Centrifugo.
- **No per-seat / per-connection bill** — you pay your own infra, not a usage meter. Scaling is your server's problem, not a pricing tier.
- **One feature at a time** — start with `queryFn`. Add `channel` when ready. Add `fields` for CRDTs when you need conflict resolution. Each step is one config key — stop at any point.
- **The kitchen sink, when you need it** — pub/sub, presence, typing indicators, field-level CRDTs (LWW / PN-counter / OR-set), AI/stream channels, offline queue, multi-tab coordination, and devtools. Reach for what you need; ignore the rest.
- **Swap transports, not code** — `sseTransport` → `centrifugoTransport`. One import swap. Your collections and hooks don't change.

> [TanStack DB](https://github.com/TanStack/db) and [TanStack Start](https://tanstack.com/start) are **supported integrations**, not the identity. `realtime.js` is freestanding and vendor-neutral — use it with them, or without them.

## Packages

| Package                                                             | Description                                                                                                                             |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [`@realtimejs/core`](#realtimejscore)                               | Core client, collection helpers, CRDT primitives, and type definitions                                                                  |
| [`@realtimejs/react`](#realtimejsreact)                             | React hooks and provider                                                                                                                |
| [`@realtimejs/solid`](#realtimejssolid)                             | Solid primitives and provider                                                                                                           |
| [`@realtimejs/vue`](#realtimejsvue)                                 | Vue composables and provider                                                                                                            |
| [`@realtimejs/adapter-centrifugo`](#realtimejsadapter-centrifugo)   | Transport adapter for [Centrifugo](https://centrifugal.dev)                                                                             |
| [`@realtimejs/adapter-sse`](#realtimejsadapter-sse)                 | Server-Sent Events transport adapter (receive-only stream + HTTP POST publish; no presence)                                             |
| [`@realtimejs/adapter-pusher`](#realtimejsadapter-pusher)           | Transport adapter for [Pusher Channels](https://pusher.com/channels) and self-hosted [Soketi](https://soketi.app) (presence; no replay) |
| [`@realtimejs/adapter-partykit`](#realtimejsadapter-partykit)       | Transport adapter for [PartyKit](https://www.partykit.io) / Cloudflare Durable Objects (edge presence; no replay)                       |
| [`@realtimejs/adapter-conformance`](#realtimejsadapter-conformance) | Conformance test kit — validate any transport adapter against the `RealtimeTransport` contract                                          |
| [`@realtimejs/preset-start`](#realtimejspreset-start)               | TanStack Start preset with SSE handler and publish backend                                                                              |
| [`@realtimejs/react-devtools`](#devtools)                           | React developer tools panel                                                                                                             |
| [`@realtimejs/solid-devtools`](#devtools)                           | Solid developer tools panel                                                                                                             |
| [`@realtimejs/vue-devtools`](#devtools)                             | Vue developer tools panel                                                                                                               |

---

## Examples

Runnable React + Vite example apps live in [`examples/`](./examples). Each pairs a
Vite client with a minimal in-memory SSE server (run as Vite dev middleware — no
database, no ORM, "bring your own backend"). Run any with
`pnpm --filter @realtimejs-example/<name> dev`.

| Example                                                 | What it shows                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [`collaborative-todos`](./examples/collaborative-todos) | Optimistic updates + CRDT convergence with `useRealtimeCollection` and `fields` (`lww`, `pn-counter`) |
| [`chat`](./examples/chat)                               | Append-only `useLiveChannel` with `usePresence` (online users) and `useTypingIndicator`               |
| [`ai-streaming`](./examples/ai-streaming)               | Server-pushed mock LLM tokens via `createStreamChannel` + `useStream` (pending → streaming → done)    |

---

## `@realtimejs/core`

Framework-agnostic core. Exposes `createRealtimeClient`, collection helpers (`realtimeCollectionOptions`, `liveChannelOptions`, `presenceChannelOptions`, `streamChannelOptions`), CRDT primitives, channel-key serialization, and all shared types.

### Installation

```bash
npm install @realtimejs/core
```

### Creating a client

```ts
import {
  createCoordinatedTransport,
  createRealtimeClient,
} from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

// Recommended: automatic multi-tab coordination
export const client = createRealtimeClient({
  transport: createCoordinatedTransport({
    transport: () => sseTransport({ url: '/api/core/sse' }),
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
import { createSharedWorkerCoordinator } from '@realtimejs/core'
import { centrifugoTransport } from '@realtimejs/adapter-centrifugo'

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

## `@realtimejs/react`

React adapter. Provides a context provider and hooks that integrate with the core client.

### Installation

```bash
npm install @realtimejs/core @realtimejs/react
```

### Quick start — reactive queries

The fastest path to live data: wrap a server function, call `useQuery` on the client.

```ts
// Server — realtime.query() derives channels automatically
export const getTodos = realtime.query(async ({ teamId }: { teamId: string }) =>
  db.select().from(todos).where(eq(todos.teamId, teamId)),
)
```

```tsx
// Client — data stays live, shared across components
import { useQuery, useMutation } from '@realtimejs/react'
import { getTodos, createTodo } from '../server/todos'

function TodoList({ teamId }: { teamId: string }) {
  const { data, isPending } = useQuery(getTodos, { teamId })
  const { mutate } = useMutation(createTodo, {
    optimistic: (cache, args) => {
      cache.update(getTodos, { teamId: args.teamId }, (prev) => [
        ...(prev ?? []),
        { id: crypto.randomUUID(), title: args.title, done: false },
      ])
    },
  })

  if (isPending) return <Spinner />
  return (
    <>
      <ul>
        {data?.map((t) => (
          <li key={t.id}>{t.title}</li>
        ))}
      </ul>
      <button onClick={() => mutate({ teamId, title: 'New todo' })}>Add</button>
    </>
  )
}
```

### Pub/sub, presence & more

For use cases beyond server queries (chat, cursors, typing indicators):

```tsx
// Subscribe to a channel
import { useSubscribe } from '@realtimejs/react'

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
// Publish to a channel
import { usePublish } from '@realtimejs/react'

function ChatInput({ roomId }: { roomId: string }) {
  const publish = usePublish(['chat', { roomId }])
  return <button onClick={() => publish('Hello!')}>Send</button>
}
```

```tsx
// 4. Presence — track other connected users
import { createPresenceChannel, usePresence } from '@realtimejs/react'

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
import { useRealtime } from '@realtimejs/react'

function StatusBar() {
  const { status, connect, disconnect } = useRealtime()
  return <span>{status}</span>
}
```

### Hooks

| Hook                                       | Description                                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `useRealtime()`                            | Returns `{ status, connect, disconnect, client }`                                                                  |
| `useSubscribe(channel, onMessage)`         | Subscribe to raw channel messages for the component lifetime                                                       |
| `usePublish(channel)`                      | Returns a stable publish function for a channel                                                                    |
| `useChannel(channel, onMessage?)`          | Combined subscribe + publish; returns `{ publish }`                                                                |
| `usePresence(channelDef, options)`         | Join a presence channel; returns `{ others, updatePresence }`                                                      |
| `useStream(channelDef, options)`           | Subscribe to a reduce-based stream; returns `{ state, status, error }`                                             |
| `useRealtimeCollection(config)`            | Returns a TanStack DB `Collection` backed by a realtime channel                                                    |
| `useLiveChannel(config)`                   | Returns a TanStack DB `Collection` for append-only event streams                                                   |
| `useConnectionStatus()`                    | Returns reactive `ConnectionStatus` value                                                                          |
| `useIsConnected()`                         | Returns `boolean` — `true` when connected                                                                          |
| `useLatestMessage(channel)`                | Returns the most recent message on a channel                                                                       |
| `useChannelHistory(channel, opts)`         | Accumulates channel messages into an array with configurable max length                                            |
| `useTypingIndicator(channel, opts)`        | Typing indicator with auto-expire; returns `{ typing, startTyping, stopTyping }`                                   |
| `useChannelStats(channel)`                 | Returns `{ messageCount, lastMessageAt }` for a channel                                                            |
| `useOnReconnect(callback)`                 | Fires a callback whenever the client reconnects                                                                    |
| `useSyncedCounter(def, options)`           | Standalone CRDT counter; returns `{ value, increment, decrement }`                                                 |
| `useSyncedValue(def, options)`             | Standalone CRDT LWW value; returns `{ value, set }`                                                                |
| `useSyncedSet(def, options)`               | Standalone CRDT OR-set; returns `{ values, add, remove, has }`                                                     |
| `useQuery(serverFn, args, opts?)`          | Fetches + subscribes to a reactive server query; auto-refetches on reconnect; shared query cache across components |
| `useMutation(serverFn, opts?)`             | Wraps a reactive server mutation with `isPending`/`error`/`data` state and declarative `optimistic` updates        |
| `usePaginatedQuery(serverFn, args, opts?)` | Paginated variant of `useQuery`; `fetchNextPage`, `hasNextPage`, live first-page updates                           |

> **Vue** (`@realtimejs/vue`) exports the same composables with identical names and signatures. Args may be `MaybeRef<T>` — pass reactive refs and the composable will watch them.
>
> **Solid** (`@realtimejs/solid`) exports the same primitives as `createQuery`, `createMutation`, and `createPaginatedQuery` (Solid `create*` convention). Remaining hooks keep the `use*` name.

---

## `@realtimejs/solid`

Solid adapter. Exports the same primitives as the React adapter, backed by Solid signals and `createEffect`.

### Installation

```bash
npm install @realtimejs/core @realtimejs/solid
```

### Quick start

```tsx
import { RealtimeProvider, useRealtime, useSubscribe } from '@realtimejs/solid'
import { client } from './client'

function App() {
  return (
    <RealtimeProvider client={client}>
      <MyApp />
    </RealtimeProvider>
  )
}
```

All hooks from the React adapter are available: `useSubscribe`, `usePublish`, `useChannel`, `usePresence`, `useStream`, `useRealtimeCollection`, `useLiveChannel`, `useConnectionStatus`, `useIsConnected`, `useLatestMessage`, `useChannelHistory`, `useTypingIndicator`, `useChannelStats`, `useOnReconnect`, `useSyncedCounter`, `useSyncedValue`, `useSyncedSet`, `createQuery`, `createMutation`, `createPaginatedQuery`.

Testing utilities (`createTestRealtimeProvider`, `createTestRealtimeProviderWithPresence`) are also exported.

---

## `@realtimejs/vue`

Vue adapter. Exports composables that return Vue `ref`/`computed` values.

### Installation

```bash
npm install @realtimejs/core @realtimejs/vue
```

### Quick start

```vue
<script setup lang="ts">
import { RealtimeProvider, useRealtime, useSubscribe } from '@realtimejs/vue'
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

## `@realtimejs/adapter-centrifugo`

Transport adapter for [Centrifugo](https://centrifugal.dev). Supports token-based auth, server-assisted gap recovery, and presence.

### Installation

```bash
npm install @realtimejs/core @realtimejs/adapter-centrifugo
```

### Usage

```ts
import { createRealtimeClient } from '@realtimejs/core'
import { centrifugoTransport } from '@realtimejs/adapter-centrifugo'

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

## `@realtimejs/adapter-sse`

Server-Sent Events transport. Ideal for environments where WebSockets are unavailable. Publishes over HTTP POST; receives over a persistent SSE stream. No presence support.

### Installation

```bash
npm install @realtimejs/core @realtimejs/adapter-sse
```

### Server

```ts
import { createSseHandler } from '@realtimejs/adapter-sse'

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
import { createRealtimeClient } from '@realtimejs/core'
import { sseTransport } from '@realtimejs/adapter-sse'

export const client = createRealtimeClient({
  transport: sseTransport({
    url: 'https://my-app.example.com/_realtime',
    getToken: () => authStore.token,
  }),
})
```

---

## `@realtimejs/adapter-pusher`

Transport adapter for [Pusher Channels](https://pusher.com/channels) (managed SaaS) and the self-hostable, protocol-compatible [Soketi](https://soketi.app) server. Presence is mapped onto Pusher **presence channels**. There is no offset/epoch gap replay — delivery is **at-most-once** across disconnects (`serverAssistedRecovery: false`); the adapter re-subscribes its active channels on reconnect. Client publish is a Pusher **client event** and only works on **private or presence** channels (and only when client events are enabled for the app); public-channel fan-out is server-published via Pusher's HTTP API.

### Installation

```bash
npm install @realtimejs/core @realtimejs/adapter-pusher pusher-js
```

### Usage

```ts
import { createRealtimeClient } from '@realtimejs/core'
import { pusherTransport } from '@realtimejs/adapter-pusher'

export const client = createRealtimeClient({
  transport: pusherTransport({
    key: 'app-key',
    cluster: 'eu',
    // Presence/private channels require auth:
    authEndpoint: '/api/pusher/auth',
  }),
})
```

For self-hosted Soketi, point the adapter at your server with `wsHost` / `wsPort` instead of `cluster`.

---

## `@realtimejs/adapter-partykit`

Transport adapter for [PartyKit](https://www.partykit.io) and Cloudflare Durable Objects. Presence works because the Durable Object holds connection membership server-side (`presence: true`). PartySocket is a reconnecting WebSocket with no built-in offset/epoch gap replay, so `serverAssistedRecovery` is **false** — the adapter re-asserts subscriptions and presence intent on every reconnect. You deploy a PartyKit server (the edge fan-out tier).

### Installation

```bash
npm install @realtimejs/core @realtimejs/adapter-partykit partysocket
```

### Usage

```ts
import { createRealtimeClient } from '@realtimejs/core'
import { partykitTransport } from '@realtimejs/adapter-partykit'

export const client = createRealtimeClient({
  transport: partykitTransport({
    host: 'my-app.username.partykit.dev',
    room: 'hub',
  }),
})
```

---

## `@realtimejs/adapter-conformance`

Conformance test kit that proves a transport adapter satisfies the `@realtimejs/core` `RealtimeTransport` (and optional `PresenceCapable`) contract and declares **honest** capabilities. This is the public extension point: any WebSocket-style provider can be wrapped as an adapter and validated against the same battery every first-party adapter passes — including a real reconnect / re-subscribe check.

### Installation

```bash
npm install -D @realtimejs/adapter-conformance
```

### Usage

```ts
import { runAdapterConformance } from '@realtimejs/adapter-conformance'
import { myTransport } from './my-transport'

runAdapterConformance({
  name: 'my-transport',
  createTransport: () => myTransport({ socket: fakeProvider }),
  capabilities: {
    presence: true,
    serverAssistedRecovery: false,
    history: false,
    ephemeral: true,
  },
  emitMessage: (channel, data) => fakeProvider.deliver(channel, data),
  simulateDisconnect: () => fakeProvider.drop(),
  simulateReconnect: () => fakeProvider.reconnect(),
})
```

The presence sub-battery runs only when `capabilities.presence` is `true`, and the kit asserts `hasPresence(transport)` agrees with the declared flag — no half-implemented presence.

---

## `@realtimejs/preset-start`

TanStack Start preset. Provides an SSE-based request handler for TanStack Router API routes and a pluggable `PublishBackend` interface for horizontal scaling.

### Installation

```bash
npm install @realtimejs/core @realtimejs/preset-start
```

### Usage

```ts
// app/server/realtime.ts
import { createStartHandler } from '@realtimejs/preset-start'

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
import { realtime } from '../../server/core'

export const Route = createAPIFileRoute('/api/core')({
  GET: ({ request }) => realtime.handle(request),
  POST: ({ request }) => realtime.handle(request),
  OPTIONS: ({ request }) => realtime.handle(request),
})
```

For the client side, pair with `sseTransport` from `@realtimejs/adapter-sse`.

### `realtime.query()` and `realtime.mutation()`

Wrap server functions to make them reactive. Channels are derived automatically — no manual channel wiring required.

```ts
import { realtime } from './core'

// Reactive query — channel derived from args
export const getTodos = realtime.query(async ({ teamId }: { teamId: string }) =>
  db.select().from(todos).where(eq(todos.teamId, teamId)),
)

// Reactive mutation — invalidates affected queries automatically
export const createTodo = realtime.mutation(
  async ({ teamId, title }: { teamId: string; title: string }) => {
    const [todo] = await db
      .insert(todos)
      .values({ teamId, title, done: false })
      .returning()
    return todo
  },
)
```

Pair with `useQuery` / `useMutation` on the client.

---

## DevTools

Developer tools panels for inspecting channels, messages, presence, connection state, and the offline queue. Available for all three frameworks.

### Installation

```bash
# React
npm install @realtimejs/react-devtools

# Solid
npm install @realtimejs/solid-devtools

# Vue
npm install @realtimejs/vue-devtools
```

### Usage (React)

```tsx
import { RealtimeDevtools } from '@realtimejs/react-devtools'

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

`@realtimejs/core` ships helpers that wire [TanStack DB](https://github.com/TanStack/db) collections to live channels so server-pushed mutations are reflected instantly in your UI.

### `realtimeCollectionOptions` — server-managed rows

Use this when your server owns the source of truth and pushes `insert` / `update` / `delete` events.

```ts
import { createCollection } from '@tanstack/db'
import { realtimeCollectionOptions } from '@realtimejs/core'
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
import { liveChannelOptions } from '@realtimejs/core'
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
import { presenceChannelOptions } from '@realtimejs/core'
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
import { createStreamChannel, serverStreamCallbacks } from '@realtimejs/core'

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
import { useStream } from '@realtimejs/react'
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
import { streamChannelOptions, serverStreamCallbacks } from '@realtimejs/core'
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

`realtime.query()` + `useQuery` make server data live with zero channel wiring. Wrap your server function once; every component that calls it shares one fetch, one SSE subscription, and propagated optimistic updates.

### Server: `realtime.query()` and `realtime.mutation()`

```ts
import { realtime } from './core' // createStartHandler result
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { todos } from '../../db/schema'

// realtime.query() — channels derived automatically from args
export const getTodos = realtime.query(async ({ teamId }: { teamId: string }) =>
  db.select().from(todos).where(eq(todos.teamId, teamId)),
)

// realtime.mutation() — invalidates affected query subscribers automatically
export const createTodo = realtime.mutation(
  async ({ teamId, title }: { teamId: string; title: string }) => {
    const [todo] = await db
      .insert(todos)
      .values({ teamId, title, done: false })
      .returning()
    return todo
  },
)
```

### Client: `useQuery` and `useMutation`

```tsx
import { useQuery, useMutation } from '@realtimejs/react'
import { getTodos, createTodo } from '../server/todos'

function TodoList({ teamId }: { teamId: string }) {
  const { data, isPending, error } = useQuery(getTodos, { teamId })

  if (isPending) return <Spinner />
  if (error) return <Error error={error} />
  return <List items={data} />
}

function AddTodoForm({ teamId }: { teamId: string }) {
  const { mutate, isPending } = useMutation(createTodo, {
    // Declarative optimistic update — rolled back automatically on error
    optimistic: (cache, args) => {
      cache.update(getTodos, { teamId: args.teamId }, (prev) => [
        ...(prev ?? []),
        { id: crypto.randomUUID(), title: args.title, done: false },
      ])
    },
  })

  return (
    <button
      disabled={isPending}
      onClick={() => mutate({ teamId, title: 'New todo' })}
    >
      {isPending ? 'Saving…' : 'Add'}
    </button>
  )
}
```

### Shared query cache

Multiple components using the same `(serverFn, args)` share one TanStack DB `Collection` — one fetch, one SSE subscription, and automatically propagated optimistic updates. The cache is keyed by function identity + `JSON.stringify(args)`.

**Batched consistency:** when a mutation invalidates multiple queries, the server publishes a single SSE message with all updates. React 18 automatic batching merges all resulting state changes into one render — no torn state.

**Arg serialisation note:** args must be JSON-serialisable. Property insertion order matters for the cache key (`{a:1,b:2}` ≠ `{b:2,a:1}`), so use a consistent arg shape.

---

## CRDT Primitives

`@realtimejs/core` ships conflict-free data type helpers for collaborative state. Annotate collection fields with a CRDT strategy via the `fields` option on `realtimeCollectionOptions`:

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

[MIT](LICENSE) © [mikn](https://github.com/mikn). `realtime.js` is an independent, vendor-neutral project — not affiliated with or endorsed by TanStack.
