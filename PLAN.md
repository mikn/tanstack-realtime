# TanStack Realtime

Live data, ephemeral channels, and presence for TanStack DB. No sync engine required.

---

## Where It Sits

```
@tanstack/store         Reactive state primitives (foundation)
@tanstack/query         Data fetching and caching
@tanstack/db            Reactive client store, live queries, differential dataflow
@tanstack/realtime      Live collections, ephemeral channels, presence
@tanstack/start         Server functions, deployment presets
@tanstack/router        Routing
@tanstack/form          Form state and validation
```

TanStack Realtime is a peer package. It provides TanStack DB collection sources backed by authorized WebSocket channels, plus presence and pub/sub primitives. It uses TanStack Store for framework-agnostic reactive connection state.

---

## The Problem

TanStack DB has collection sources for sync engines: Electric, PowerSync, TrailBase. These are powerful but require running dedicated infrastructure (WAL replication, Elixir services, persistent storage, direct database connections).

Most applications have a simpler setup: a database, server functions, and a managed pub/sub service. They want their UI to update when data changes. Today their options are vendor lock-in (Supabase, Firebase, Convex) or manually wiring WebSocket listeners to cache invalidation.

TanStack Realtime is the collection source for applications that don't run a sync engine.

---

## Three Primitives

### Realtime Collection

Database-backed data that stays live. The collection loads data via a server function and subscribes to a channel. When a mutation succeeds, the adapter publishes the result to the channel. Other clients receive it and apply it to their local collection. TanStack DB's differential dataflow updates all live queries.

### Live Channel

Ephemeral or high-frequency data that flows through the channel directly. Chat messages, AI token streams, typing indicators, game events. Optionally backed by initial historical data from a server function.

### Presence

Per-user ephemeral state broadcast to others on the same channel. Cursors, online status, typing indicators. Built on the connection holder's native presence support.

---

## Package Structure

```
@tanstack/realtime                     Core library
  /core                                Connection manager (on TanStack Store), key serialization,
                                       transport interface, collection source implementations
  /react                               RealtimeProvider, useRealtime, usePresence, usePublish, useSubscribe
  /server                              authorize hook, publish function for server-initiated events

@tanstack/realtime-preset-centrifugo   Centrifugo: subscribe proxy, HTTP publish, centrifuge-js
@tanstack/realtime-preset-ably         Ably: token endpoint, REST publish, ably-js
@tanstack/realtime-preset-node         Local dev / export: in-process WS, EventEmitter
```

---

## What The Agent Generates

### 1. Collections

**Realtime Collection — database-backed, live via channel:**

```typescript
// collections/todos.ts
import { createCollection } from '@tanstack/react-db';
import { realtimeCollectionOptions } from '@tanstack/realtime';
import { todoSchema } from '../schemas';
import { getTodos, addTodo, updateTodo, deleteTodo } from '../server/functions/todos';

export const todosCollection = createCollection(
  realtimeCollectionOptions({
    id: 'todos',
    schema: todoSchema,
    getKey: (item) => item.id,
    channel: (params: { projectId: string }) => ['todos', { projectId: params.projectId }],
    queryFn: (params: { projectId: string }) => getTodos({ data: params }),

    onInsert: async ({ transaction }) => {
      const item = transaction.mutations[0].modified;
      return await addTodo({ data: item });
      // Adapter publishes { action: 'insert', data: result } to channel after success.
      // Other clients receive it and apply it to their collection.
    },

    onUpdate: async ({ transaction }) => {
      const { original, changes } = transaction.mutations[0];
      return await updateTodo({ data: { id: original.id, ...changes } });
    },

    onDelete: async ({ transaction }) => {
      const item = transaction.mutations[0].original;
      await deleteTodo({ data: { id: item.id } });
    },
  })
);
```

`realtimeCollectionOptions` returns options compatible with `createCollection`. It implements TanStack DB's collection source interface — the same interface Electric and PowerSync implement. This means `useLiveQuery` works identically against realtime collections, Electric collections, and any other source. No special imports in components.

The collection handles:
- Initial data loading via `queryFn`
- Channel subscription on mount, unsubscription on unmount
- Publishing mutation results to the channel after `onInsert` / `onUpdate` / `onDelete` succeed
- Receiving published data from other clients and applying it to the local collection
- Optimistic state management via TanStack DB's `transact`

**✅ CORRECT — the server functions are completely standard:**
```typescript
// server/functions/todos.ts
import { createServerFn } from '@tanstack/start';
import { db } from '../db';
import { todos } from '../db/schema';

export const getTodos = createServerFn({ method: 'GET' })
  .validator(z.object({ projectId: z.string() }))
  .handler(async ({ data }) => {
    return db.select().from(todos).where(eq(todos.projectId, data.projectId));
  });

export const addTodo = createServerFn({ method: 'POST' })
  .validator(z.object({ projectId: z.string(), text: z.string() }))
  .handler(async ({ data }) => {
    const [newTodo] = await db.insert(todos).values(data).returning();
    return newTodo;
  });

export const updateTodo = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string(), completedAt: z.string().nullable().optional() }))
  .handler(async ({ data }) => {
    const [updated] = await db.update(todos).set(data).where(eq(todos.id, data.id)).returning();
    return updated;
  });

export const deleteTodo = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const [deleted] = await db.delete(todos).where(eq(todos.id, data.id)).returning();
    return deleted;
  });
```

Plain Drizzle. Plain TanStack Start. No realtime imports. No publish calls. No wrappers.

**❌ WRONG — importing realtime in server functions:**
```typescript
import { publish } from '@tanstack/realtime/server'; // ← not needed for database-backed collections
```

**Live Channel — ephemeral data on the wire:**

```typescript
// collections/chat.ts
import { createCollection } from '@tanstack/react-db';
import { liveChannelOptions } from '@tanstack/realtime';
import { chatMessageSchema } from '../schemas';
import { getChatHistory } from '../server/functions/chat';

export const chatCollection = createCollection(
  liveChannelOptions({
    id: 'chat',
    schema: chatMessageSchema,
    getKey: (item) => item.id,
    channel: (params: { roomId: string }) => ['chat', { roomId: params.roomId }],

    // Optional: load historical messages on mount
    initialData: (params: { roomId: string }) => getChatHistory({ data: params }),

    onEvent: (event) => {
      // Return the item to insert into the collection, or null to ignore
      if (event.type === 'message') return event;
      return null;
    },
  })
);
```

Live channels populate the collection from channel events via `onEvent`. They support client-side publish (for authorized channels) and server-side publish (for server-initiated events like AI streaming).

**Presence:**

```typescript
// collections/presence.ts
import { createPresenceChannel } from '@tanstack/realtime';

export const editorPresence = createPresenceChannel({
  id: 'editor-presence',
  channel: (params: { documentId: string }) => ['editor', { documentId: params.documentId }],
});
```

### 2. Channel Authorization

```typescript
// server/realtime.auth.ts
import { db } from '../db';
import { projectMembers, roomMembers } from '../db/schema';
import type { ParsedChannel } from '@tanstack/realtime';

export async function authorize(
  userId: string,
  channel: ParsedChannel
): Promise<{ subscribe: boolean; publish: boolean; presence: boolean }> {

  switch (channel.namespace) {
    case 'todos':
    case 'comments': {
      const member = await db.query.projectMembers.findFirst({
        where: and(
          eq(projectMembers.userId, userId),
          eq(projectMembers.projectId, channel.params.projectId),
        ),
      });
      return member
        ? { subscribe: true, publish: true, presence: false }
        : { subscribe: false, publish: false, presence: false };
    }

    case 'chat': {
      const member = await isRoomMember(userId, channel.params.roomId);
      return member
        ? { subscribe: true, publish: true, presence: true }
        : { subscribe: false, publish: false, presence: false };
    }

    case 'editor': {
      const canEdit = await hasDocumentAccess(userId, channel.params.documentId);
      return canEdit
        ? { subscribe: true, publish: false, presence: true }
        : { subscribe: false, publish: false, presence: false };
    }

    default:
      return { subscribe: false, publish: false, presence: false };
  }
}
```

Single function. Granular permissions per channel. No provider-specific types.

Note: realtime collections need `publish: true` because the client-side adapter publishes mutation results to the channel after the server function succeeds.

**✅ CORRECT — scoped permissions by channel type:**
```typescript
case 'todos':
  return { subscribe: true, publish: true, presence: false };
  // subscribe: receive other clients' mutations
  // publish: adapter publishes this client's mutation results
  // presence: not needed for CRUD
```

**❌ WRONG — always allowing everything:**
```typescript
return { subscribe: true, publish: true, presence: true };
```

### 3. Components with Live Queries

Components use standard TanStack DB. No realtime-specific imports.

```typescript
// components/TodoList.tsx
import { useLiveQuery } from '@tanstack/react-db';
import { todosCollection } from '../collections/todos';

function TodoList({ projectId }: { projectId: string }) {
  const todos = useLiveQuery((q) =>
    q.from({ todos: todosCollection })
     .where('projectId', '=', projectId)
     .orderBy('createdAt', 'desc')
  );

  return <ul>{todos.map(todo => <TodoItem key={todo.id} todo={todo} />)}</ul>;
}
```

```typescript
// Reactive join — updates when either collection receives channel data
function TodoWithComments({ projectId }: { projectId: string }) {
  const data = useLiveQuery((q) =>
    q.from({ todos: todosCollection })
     .join({ comments: commentsCollection }, 'todos.id', '=', 'comments.todoId')
     .where('todos.projectId', '=', projectId)
  );
  return /* render */;
}
```

```typescript
// Reactive aggregation — updates incrementally from a single insert
function TodoStats({ projectId }: { projectId: string }) {
  const stats = useLiveQuery((q) =>
    q.from({ todos: todosCollection })
     .where('projectId', '=', projectId)
     .select({
       total: (rows) => rows.length,
       completed: (rows) => rows.filter(r => r.completedAt).length,
     })
  );
  return <div>{stats.completed} / {stats.total}</div>;
}
```

```typescript
// Chat messages from live channel — same query API
function ChatRoom({ roomId }: { roomId: string }) {
  const messages = useLiveQuery((q) =>
    q.from({ messages: chatCollection })
     .where('roomId', '=', roomId)
     .orderBy('timestamp', 'asc')
  );
  return <div>{messages.map(msg => <Message key={msg.id} message={msg} />)}</div>;
}
```

### 4. Optimistic Mutations

```typescript
import { useTransact } from '@tanstack/react-db';
import { todosCollection } from '../collections/todos';

function AddTodoButton({ projectId }: { projectId: string }) {
  const transact = useTransact();

  async function handleAdd() {
    const optimistic = { id: crypto.randomUUID(), projectId, text: 'new todo', completedAt: null };

    transact(
      (tx) => tx.insert(todosCollection, optimistic),
      async () => { await addTodo({ data: { projectId, text: 'new todo' } }); },
    );
    // 1. Optimistic update applied locally (instant)
    // 2. Server function writes to Postgres, returns row
    // 3. Adapter publishes result to channel
    // 4. Other clients receive and apply to their collections
    // 5. TanStack DB reconciles optimistic state with server result
    // 6. If server fails, optimistic state rolls back, nothing published
  }

  return <button onClick={handleAdd}>Add Todo</button>;
}
```

### 5. Presence

```typescript
import { usePresence } from '@tanstack/realtime/react';
import { editorPresence } from '../collections/presence';

function CollaborativeEditor({ documentId }: { documentId: string }) {
  const { others, updatePresence } = usePresence(editorPresence, {
    params: { documentId },
    initial: { cursor: null as { x: number; y: number } | null, name: userName },
  });

  return (
    <div onMouseMove={(e) => updatePresence({ cursor: { x: e.clientX, y: e.clientY } })}>
      {others.map(user => (
        <Cursor key={user.connectionId} position={user.cursor} name={user.name} />
      ))}
      <Editor />
    </div>
  );
}
```

### 6. Client-Side Publish and Raw Subscribe

For ephemeral data that doesn't need a collection:

```typescript
import { usePublish, useSubscribe } from '@tanstack/realtime/react';

function TypingIndicator({ roomId }: { roomId: string }) {
  const publish = usePublish(['chat:typing', { roomId }]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useSubscribe(['chat:typing', { roomId }], (event) => {
    // manage typing user list
  });

  function handleKeyDown() {
    publish({ userId: currentUser.id, isTyping: true });
  }

  return typingUsers.length > 0 ? <div>{typingUsers.join(', ')} typing...</div> : null;
}
```

### 7. Server-Side Publish for Live Channels

For server-initiated events (AI streaming, system notifications):

```typescript
// server/functions/ai.ts
import { publish } from '@tanstack/realtime/server';

export const startAIStream = createServerFn({ method: 'POST' })
  .handler(async ({ data }) => {
    const stream = await openai.chat.completions.create({ stream: true, ... });

    for await (const chunk of stream) {
      await publish(['ai-stream', { sessionId: data.sessionId }], {
        type: 'token',
        content: chunk.choices[0]?.delta?.content ?? '',
      });
    }
  });
```

### 8. Connection Lifecycle

```typescript
import { useRealtime } from '@tanstack/realtime/react';

function AuthProvider({ children }: { children: React.ReactNode }) {
  const realtime = useRealtime();

  async function handleLogin(credentials: Credentials) {
    await login(credentials);
    realtime.connect();
  }

  async function handleLogout() {
    realtime.disconnect();
    await logout();
  }

  return /* render */;
}
```

Before `connect()`: collections load data via `queryFn` / `initialData`. App works, just not live.
After `connect()`: collections subscribe to channels, data flows.

### 9. App Setup

```typescript
// app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DBProvider } from '@tanstack/react-db';
import { RealtimeProvider, createRealtimeClient } from '@tanstack/realtime/react';

const queryClient = new QueryClient();
const realtimeClient = createRealtimeClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DBProvider>
        <RealtimeProvider client={realtimeClient}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </RealtimeProvider>
      </DBProvider>
    </QueryClientProvider>
  );
}
```

### 10. Build Configuration

```typescript
// app.config.ts
import { defineConfig } from '@tanstack/start/config';

export default defineConfig({
  server: { preset: 'cloudflare-workers' },
  realtime: { preset: 'centrifugo' },
});
```

Only file that references a provider. Changing providers: swap one string. Zero app code changes.

---

## Core Internals

### Connection Manager (TanStack Store)

```typescript
import { Store } from '@tanstack/store';

const realtimeStore = new Store({
  status: 'disconnected' as 'disconnected' | 'connecting' | 'connected' | 'reconnecting',
  subscriptions: new Map<string, Set<callback>>(),
  presenceChannels: new Map<string, PresenceState>(),
});
```

Framework adapters observe the store reactively:
```typescript
// React
const { status } = useRealtime(); // reads from store

// Vue, Solid, Svelte — same store, different observer
```

### Transport Interface

Each preset provides a transport:

```typescript
interface RealtimeTransport {
  connect(config: ConnectionConfig): Promise<void>;
  disconnect(): void;

  subscribe(channel: string, onMessage: (data: any) => void): () => void;
  publish(channel: string, data: any): Promise<void>;

  joinPresence(channel: string, data: any): void;
  updatePresence(channel: string, data: any): void;
  leavePresence(channel: string): void;
  onPresenceChange(channel: string, callback: (users: PresenceUser[]) => void): () => void;

  status: Store<ConnectionStatus>;
}
```

### Key Serialization

```typescript
import { serializeKey, parseChannel } from '@tanstack/realtime';

serializeKey(['todos', { projectId: '123' }])
// → 'todos:projectId=123'

parseChannel('todos:projectId=123')
// → { namespace: 'todos', params: { projectId: '123' } }
```

Flat strings. Sorted object keys. Compatible with Centrifugo and Ably channel naming.

### Collection Source — how `realtimeCollectionOptions` integrates with TanStack DB

`realtimeCollectionOptions` returns an object conforming to TanStack DB's collection source interface. This is the same interface that Electric and PowerSync implement. The key methods:

**Data loading:** Calls `queryFn(params)` to populate the collection initially.

**Subscription:** When the collection is active (has live queries), subscribes to the channel via the transport. When no live queries reference it, unsubscribes.

**Incoming data:** When data arrives on the channel from another client:
- `action: 'insert'` → insert row into collection
- `action: 'update'` → update matching row by key
- `action: 'delete'` → remove matching row by key
TanStack DB's differential dataflow handles the rest.

**Outgoing mutations:** When `onInsert` / `onUpdate` / `onDelete` complete successfully:
- The adapter calls `transport.publish(channel, { action, data: result })`
- This reaches the connection holder (Centrifugo/Ably) via the preset-generated `/_realtime/publish` server endpoint
- The connection holder fans out to other subscribed clients
- The originating client already has the data (from the optimistic update + server response)

**Publish flow detail:**

The adapter can't publish directly to Centrifugo/Ably from the browser (no API keys). So:

1. Mutation handler (`onInsert`) calls server function → returns result
2. Adapter calls a preset-generated `/_realtime/publish` endpoint with the channel and result
3. That endpoint POSTs to Centrifugo API / Ably REST API
4. Connection holder broadcasts to subscribers

This is two server calls per mutation: the mutation itself and the publish. They could be combined into one by having the server function call `publish` internally — but that couples server functions to realtime. Keeping them separate means server functions stay pure.

For latency-sensitive use cases (live channels), client-side publish goes directly through the WebSocket (authorized via subscribe proxy / token). No extra server call.

---

## How Presets Work

### Preset: `centrifugo`

**Publish endpoint:** Preset generates `server/routes/_realtime/publish.ts`:
```typescript
export default defineEventHandler(async (event) => {
  const { channel, data } = await readBody(event);
  await fetch(`${process.env.REALTIME_API_URL}/api/publish`, {
    method: 'POST',
    headers: { 'X-API-Key': process.env.REALTIME_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, data }),
  });
  return { ok: true };
});
```

**Authorization:** Subscribe proxy. Preset generates `server/routes/_realtime/subscribe-proxy.ts`:
```typescript
import { authorize } from '../../realtime.auth';
import { parseChannel } from '@tanstack/realtime';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = parseChannel(body.channel);
  const perms = await authorize(body.user, parsed);

  if (!perms.subscribe) {
    return { result: { disconnect: { code: 4403, reason: 'unauthorized' } } };
  }
  return { result: { data: { publish: perms.publish, presence: perms.presence } } };
});
```

**Client transport:** `centrifuge-js`

**Env vars:** `REALTIME_API_URL`, `REALTIME_API_KEY`, `VITE_REALTIME_URL`

**Docker-compose:**
```yaml
centrifugo:
  image: centrifugal/centrifugo:v6
  command: centrifugo -c config.json
  x-lovable:
    provides: [REALTIME_API_URL, REALTIME_API_KEY, VITE_REALTIME_URL]
```

### Preset: `ably`

**Publish endpoint:** Preset generates `server/routes/_realtime/publish.ts`:
```typescript
export default defineEventHandler(async (event) => {
  const { channel, data } = await readBody(event);
  await fetch(`https://rest.ably.io/channels/${encodeURIComponent(channel)}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${btoa(process.env.ABLY_API_KEY)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: data.action || 'event', data }),
  });
  return { ok: true };
});
```

**Authorization:** Token endpoint. Preset generates `server/routes/_realtime/token.ts`:
```typescript
import { authorize } from '../../realtime.auth';
import { parseChannel } from '@tanstack/realtime';
import Ably from 'ably';

export default defineEventHandler(async (event) => {
  const session = await getSession(event);
  if (!session) throw createError({ statusCode: 401 });
  const { channels } = await readBody(event);

  const capability: Record<string, string[]> = {};
  for (const ch of channels) {
    const parsed = parseChannel(ch);
    const perms = await authorize(session.userId, parsed);
    const ops: string[] = [];
    if (perms.subscribe) ops.push('subscribe');
    if (perms.publish) ops.push('publish');
    if (perms.presence) ops.push('presence');
    if (ops.length > 0) capability[ch] = ops;
  }

  const ably = new Ably.Rest(process.env.ABLY_API_KEY);
  return ably.auth.createTokenRequest({ clientId: session.userId, capability });
});
```

**Client transport:** `ably-js` with `authCallback`

**Env vars:** `ABLY_API_KEY`

### Preset: `node`

**Publish:** In-process EventEmitter. No server endpoint needed.

**Authorization:** Calls `authorize` directly on WebSocket subscribe.

**Client transport:** Native `WebSocket` to same origin.

**No external dependencies.** Single process.

---

## Connection Management

**Reconnection:** Exponential backoff (1s → 30s, ±25% jitter). Both `centrifuge-js` and `ably-js` handle reconnection natively. On reconnect:
- Resubscribe all active channels
- Realtime collections refetch `queryFn` to catch missed updates
- Live channels resume (history replay if supported, otherwise just resume receiving)
- Presence channels resync

**Window focus:** Check liveness. If alive, realtime collections refetch. Integrates with TanStack Query's `refetchOnWindowFocus`.

**Status observable via Store:**
```typescript
// Any framework
const status = realtimeStore.state.status;
// 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
```

---

## Authorization Model

All channels are authorized. One `authorize` function. Granular permissions: subscribe, publish, presence.

**Centrifugo:** just-in-time per subscribe (proxy call).
**Ably:** upfront per token (batch call on connect + refresh).
**Node:** direct call on subscribe.

Differences contained within presets. `authorize` function is identical across providers.

---

## Provider Feature Mapping

| Feature | Centrifugo | Ably | Node (local) |
|---|---|---|---|
| Publish | HTTP API | REST API | In-memory |
| Subscribe auth | Subscribe proxy | Token capabilities | Direct call |
| Client publish | Supported | Supported | In-process |
| Presence | Native | Native | In-memory |
| Client SDK | centrifuge-js | ably-js | Native WebSocket |
| Scaling | Redis / NATS | Managed | Single instance |
| Docker-compose | Container | None needed | None needed |

---

## What This Library Is Not

**Not a sync engine.** No WAL replication, no conflict resolution. For offline-first or full dataset sync, use Electric or PowerSync collections alongside realtime collections in the same TanStack DB instance. They coexist naturally — different collections, same `useLiveQuery`.

**Not a database change stream.** Realtime collections publish mutation results from the client-side adapter after server functions succeed. Direct SQL writes don't trigger updates. For agent-generated apps where all writes go through server functions, this covers all cases.

**Not a CRDT system.** For collaborative text editing, use Yjs or Automerge. Presence complements these but doesn't replace them.

---

## Export / Portability

Exported app:
- TanStack Start app with standard Drizzle, standard server functions
- Collections, components, authorize function
- `app.config.ts` with `realtime: { preset: 'node' }`
- `docker-compose.yml` with Postgres
- `.env.example` with `DATABASE_URL`

`docker compose up` → working realtime app. Single process.

To scale: swap preset to `centrifugo` + add container. Or `ably` + set key. Zero app code changes.

---

## What The Agent Generates Per App

| File | Contains | Realtime-specific |
|---|---|---|
| `db/schema.ts` | Drizzle tables | No |
| `server/functions/*.ts` | Standard server functions | No |
| `server/realtime.auth.ts` | `authorize` function | Yes |
| `collections/*.ts` | Collection definitions | Yes — collection type choice |
| `components/*.tsx` | UI with `useLiveQuery` | No — standard TanStack DB |
| `app.config.ts` | Build preset | One line |
| `app.tsx` | Provider wrappers | `RealtimeProvider` |

Server functions are plain Drizzle + TanStack Start. Components are plain TanStack DB. The realtime-specific code is the authorize function, the collection definitions (choosing `realtimeCollectionOptions` vs `liveChannelOptions`), and one line of config.

---

## Implementation Phases

### Phase 1: Realtime Collections + Node Preset
- [ ] `@tanstack/realtime/core` — connection manager on TanStack Store, key serialization, transport interface
- [ ] `realtimeCollectionOptions` — TanStack DB collection source with channel subscription, mutation publish, incoming data application
- [ ] `@tanstack/realtime/react` — `RealtimeProvider`, `useRealtime`, `createRealtimeClient`
- [ ] `@tanstack/realtime/server` — `authorize` hook
- [ ] `@tanstack/realtime-preset-node` — in-process WebSocket, EventEmitter, direct authorize
- [ ] Preset-generated `/_realtime/publish` endpoint
- [ ] Reconnection with collection refetch, window focus integration

### Phase 2: Live Channels + Presence + Pub/Sub
- [ ] `liveChannelOptions` — channel-backed collection source with `onEvent`
- [ ] `createPresenceChannel` + `usePresence`
- [ ] `usePublish` for client-side publish
- [ ] `useSubscribe` for raw channel events
- [ ] `@tanstack/realtime/server` `publish` function for server-initiated events

### Phase 3: Provider Presets
- [ ] `@tanstack/realtime-preset-centrifugo` — subscribe proxy, HTTP publish, centrifuge-js transport
- [ ] `@tanstack/realtime-preset-ably` — token endpoint, REST publish, ably-js transport
- [ ] Centrifugo config generation, docker-compose integration
- [ ] Token lifecycle for Ably
- [ ] Nitro / TanStack Start build integration for preset resolution

### Phase 4: Ecosystem
- [ ] Vue, Solid, Svelte adapters (via TanStack Store)
- [ ] Documentation for custom presets
- [ ] Metrics / observability hooks
- [ ] Interop testing: realtime + Electric collections in same app

