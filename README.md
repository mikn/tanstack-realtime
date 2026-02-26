# TanStack Realtime

> Framework-agnostic realtime primitives — live collections, pub/sub messaging, presence, and CRDT state — built for [TanStack DB](https://github.com/TanStack/db).

[![npm version](https://img.shields.io/npm/v/@tanstack/realtime)](https://www.npmjs.com/package/@tanstack/realtime)
[![License](https://img.shields.io/github/license/mikn/tanstack-realtime)](LICENSE)
[![CI](https://github.com/mikn/tanstack-realtime/actions/workflows/ci.yml/badge.svg)](https://github.com/mikn/tanstack-realtime/actions/workflows/ci.yml)

> [!WARNING]
> This is **not** an official [TanStack](https://tanstack.com) project. It is a
> vibe-coded library that explores an architecture and structure for what a
> TanStack Realtime library could look like. Use it to experiment, get inspired,
> or contribute ideas — but do not rely on it in production.

- **Transport-agnostic** — works with WebSockets (Node.js), Server-Sent Events, or Centrifugo out of the box; bring your own transport for anything else
- **Live collections** — wire TanStack DB collections to realtime channels with a single config object
- **Presence** — track who is connected to a channel; current user always excluded from the list
- **CRDT primitives** — conflict-free last-write-wins, PN-counters, and OR-sets for collaborative state
- **Resilient by default** — exponential back-off reconnection, offline queue, deduplication, gap recovery, and SharedWorker transport for multi-tab apps

## Packages

| Package                                                                         | Description                                                                    |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`@tanstack/realtime`](#tanstackrealtime)                                       | Core client, collection helpers, CRDT primitives, and type definitions         |
| [`@tanstack/react-realtime`](#tanstackreact-realtime)                           | React hooks and provider                                                       |
| [`@tanstack/realtime-preset-node`](#tanstackrealtime-preset-node)               | WebSocket transport + Node.js server for local dev and self-hosted deployments |
| [`@tanstack/realtime-adapter-centrifugo`](#tanstackrealtime-adapter-centrifugo) | Transport adapter for [Centrifugo](https://centrifugal.dev)                    |
| [`@tanstack/realtime-adapter-sse`](#tanstackrealtime-adapter-sse)               | Server-Sent Events transport adapter                                           |

---

## `@tanstack/realtime`

Framework-agnostic core. Exposes `createRealtimeClient`, collection helpers (`realtimeCollectionOptions`, `liveChannelOptions`, `presenceChannelOptions`, `streamChannelOptions`), CRDT primitives, channel-key serialization, and all shared types.

### Installation

```bash
npm install @tanstack/realtime
```

### Creating a client

```ts
import { createRealtimeClient, wsTransport } from '@tanstack/realtime'

export const client = createRealtimeClient({
  transport: wsTransport({ url: 'ws://localhost:3000' }),
})

await client.connect()
```

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

const editorPresence = createPresenceChannel<
  { documentId: string },
  { cursor: { x: number; y: number } | null; name: string }
>({
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

| Hook                               | Description                                                            |
| ---------------------------------- | ---------------------------------------------------------------------- |
| `useSubscribe(channel, onMessage)` | Subscribe to raw channel messages for the component lifetime           |
| `usePublish(channel)`              | Returns a stable publish function for a channel                        |
| `useChannel(channel, onMessage?)`  | Combined subscribe + publish; returns `{ publish }`                    |
| `usePresence(channelDef, options)` | Join a presence channel; returns `{ others, updatePresence }`          |
| `useStream(channelDef, options)`   | Subscribe to a reduce-based stream; returns `{ state, status, error }` |
| `useRealtimeCollection(config)`    | Returns a TanStack DB `Collection` backed by a realtime channel        |
| `useLiveChannel(config)`           | Returns a TanStack DB `Collection` for append-only event streams       |
| `useRealtime()`                    | Returns `{ status, connect, disconnect, client }`                      |

---

## `@tanstack/realtime-preset-node`

Self-contained WebSocket server and matching client transport. Suitable for local development, self-hosted deployments, and server-side tests.

### Installation

```bash
npm install @tanstack/realtime-preset-node
```

### Server

```ts
import http from 'node:http'
import { createNodeServer } from '@tanstack/realtime-preset-node'

const realtime = createNodeServer({
  // Identify the user from the upgrade request (cookie, header, etc.).
  // Return null to reject the connection.
  async getUser(req) {
    const userId = await getUserIdFromRequest(req)
    return userId ? { userId } : null
  },

  // Return per-channel permissions for this user.
  async authorize(userId, channel) {
    return { subscribe: true, publish: false, presence: true }
  },

  path: '/_realtime', // default
})

const httpServer = http.createServer(myApp)
realtime.attach(httpServer)
httpServer.listen(3000)

// Server-side publish from a background job or API route
realtime.publish('todos:teamId=123', { type: 'created', todo })
```

### Client transport

```ts
import { createRealtimeClient, wsTransport } from '@tanstack/realtime'

export const client = createRealtimeClient({
  transport: wsTransport({
    url: 'ws://localhost:3000', // omit in the browser — derived from window.location
    path: '/_realtime', // default
  }),
})
```

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

  // Authorize subscribe and publish actions per channel
  async authorize({ userId, action, channel }) {
    return true
  },

  pingInterval: 30_000, // default; set to 0 to disable keepalive pings
})

// In your framework's route handler (e.g. Hono, Express, Next.js)
// GET  /_realtime  → SSE stream
// POST /_realtime  → publish action
app.all('/_realtime', (req) => handler.handle(req))

// Server-side broadcast
handler.broadcast('todos:teamId=123', { type: 'created', todo })
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

### `streamChannelOptions` — reduce-based streams

Use this for long-running server operations (AI generation, progress tracking) where the client reduces a stream of events into a single accumulated state.

```ts
import { createCollection } from '@tanstack/db'
import { streamChannelOptions } from '@tanstack/realtime'
import { client } from './client'

export const generationCollection = createCollection(
  streamChannelOptions<string, { token: string }>({
    client,
    channel: ['generation', { id: 'run-1' }],
    initial: '',
    reduce: (state, event) => state + event.token,
    isDone: (_state, event) => (event as any).done === true,
  }),
)
```

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
