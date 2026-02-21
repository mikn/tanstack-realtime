# TanStack Realtime

> Framework-agnostic realtime primitives — live collections, pub/sub messaging, and presence — built for [TanStack DB](https://github.com/TanStack/db).

[![npm version](https://img.shields.io/npm/v/@tanstack/realtime)](https://www.npmjs.com/package/@tanstack/realtime)
[![License](https://img.shields.io/github/license/TanStack/realtime)](LICENSE)
[![CI](https://github.com/TanStack/realtime/actions/workflows/ci.yml/badge.svg)](https://github.com/TanStack/realtime/actions/workflows/ci.yml)

## Packages

| Package | Description |
|---|---|
| [`@tanstack/realtime`](#tanstackrealtime) | Core client, live collection helpers, and type definitions |
| [`@tanstack/react-realtime`](#tanstackreact-realtime) | React hooks and provider (`useSubscribe`, `usePresence`, `usePublish`, `useRealtime`) |
| [`@tanstack/realtime-preset-node`](#tanstackrealtime-preset-node) | WebSocket transport + Node.js server for local dev and self-hosted deployments |

---

## `@tanstack/realtime`

Framework-agnostic core. Exposes `createRealtimeClient`, live collection wiring (`liveQueryOptions`, `liveCollectionOptions`), channel-key serialization, and all shared types.

### Installation

```bash
npm install @tanstack/realtime
```

### Usage

```ts
import { createRealtimeClient } from '@tanstack/realtime'
import { nodeTransport } from '@tanstack/realtime-preset-node'

export const client = createRealtimeClient({
  transport: nodeTransport({ url: 'ws://localhost:3000' }),
})
```

---

## `@tanstack/react-realtime`

React adapter. Provides a context provider and four hooks that integrate with the core client.

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

  return <ul>{messages.map((m, i) => <li key={i}>{m}</li>)}</ul>
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
// 4. Presence
import { presenceChannel, usePresence } from '@tanstack/react-realtime'

const editorPresence = presenceChannel<{ documentId: string }>()

function Editor({ documentId, userName }: { documentId: string; userName: string }) {
  const { others, updatePresence } = usePresence(editorPresence, {
    params: { documentId },
    initial: { cursor: null, name: userName },
  })

  return (
    <div onMouseMove={(e) => updatePresence({ cursor: { x: e.clientX, y: e.clientY } })}>
      {others.map((u) => <Cursor key={u.connectionId} user={u} />)}
    </div>
  )
}
```

```tsx
// 5. Connection control
import { useRealtime } from '@tanstack/react-realtime'

function StatusBar() {
  const { status, connect, disconnect } = useRealtime()
  return <span>{status}</span>
}
```

### Hooks

| Hook | Description |
|---|---|
| `useSubscribe(channel, onMessage)` | Subscribe to a channel; callback fires on every message |
| `usePublish(channel)` | Returns a stable publish function for a channel |
| `usePresence(channelDef, options)` | Join a presence channel; returns `others` + `updatePresence` |
| `useRealtime()` | Returns `{ status, connect, disconnect, client }` |

---

## `@tanstack/realtime-preset-node`

Self-contained WebSocket server and matching client transport. Suitable for local development, self-hosted deployments, and server-side tests.

### Installation

```bash
npm install @tanstack/realtime-preset-node ws
```

### Server

```ts
// server/realtime.ts
import { createNodeServer } from '@tanstack/realtime-preset-node'

const { server, publish } = createNodeServer({
  path: '/_realtime',

  async getAuthToken(req) {
    // Extract the user's identity from the request (cookie, header, etc.)
    return getUserIdFromRequest(req)
  },

  async authorize(userId, channel) {
    // Return per-channel permissions for this user.
    return { subscribe: true, publish: false, presence: true }
  },
})

// Attach to your existing HTTP server
httpServer.on('upgrade', (req, socket, head) => {
  server.handleUpgrade(req, socket, head)
})

// Server-side publish (e.g. from a background job or API route)
await publish(['todos', { teamId: '123' }], { type: 'created', todo })
```

### Client transport

```ts
// client/realtime.ts
import { createRealtimeClient } from '@tanstack/realtime'
import { nodeTransport } from '@tanstack/realtime-preset-node'

export const client = createRealtimeClient({
  transport: nodeTransport({
    url: 'ws://localhost:3000',  // Omit in a browser — derived from window.location
    path: '/_realtime',
  }),
})
```

---

## Live Collections (TanStack DB integration)

`@tanstack/realtime` ships utilities for wiring TanStack DB collections to live channels so that server-pushed mutations are reflected instantly in your UI.

```ts
import { useCollection } from '@tanstack/react-db'
import { liveCollectionOptions, defineChannel } from '@tanstack/realtime'
import { client } from './client'

const todosChannel = defineChannel<{ teamId: string }>()

function Todos({ teamId }: { teamId: string }) {
  const todos = useCollection(
    liveCollectionOptions({
      client,
      channel: todosChannel,
      params: { teamId },
      getId: (todo) => todo.id,
    }),
  )
  return <ul>{todos.map((t) => <li key={t.id}>{t.title}</li>)}</ul>
}
```

---

## License

[MIT](LICENSE) © [TanStack](https://tanstack.com)
