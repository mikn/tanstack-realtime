# TanStack Realtime — Technical Specification v1

## Philosophy

TanStack Realtime extends TanStack Query with live updates and presence. It follows a single principle: **query keys are channels**. If you know TanStack Query, you already know TanStack Realtime.

The WebSocket is a notification bus, not a data bus. It carries invalidation signals and presence state. All data flows through server functions with full auth context. This eliminates the need for channel-level authorization — the gateway is a stateless message router that only verifies the user's session cookie.

The library is portable by design. No vendor-specific runtime, no proprietary protocol, no infrastructure dependency. The default deployment is a single-process Node/Bun server where the WebSocket runs alongside the application. Multi-instance scaling is supported through a pluggable adapter interface.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│ Browser                                             │
│                                                     │
│  useQuery({ queryKey, queryFn })                    │
│       ↕ cache read/write                            │
│  TanStack Query Cache                               │
│       ↑ invalidation signals                        │
│  TanStack Realtime Client                           │
│       ↕ single multiplexed WebSocket                │
└──────────────────────┬──────────────────────────────┘
                       │ cookie auth on upgrade
┌──────────────────────┴──────────────────────────────┐
│ Server (single process)                             │
│                                                     │
│  WebSocket handler (connection mgmt, fan-out)       │
│       ↑ publish()                                   │
│  TanStack Start server functions (mutations)        │
│       ↓                                             │
│  Drizzle → Postgres                                 │
└─────────────────────────────────────────────────────┘
```

## Core Concepts

### Query keys are channels

TanStack Query already uses structured keys to identify cached data: `['todos', { projectId: '123' }]`. Realtime reuses these as subscription channels. When a mutation publishes an invalidation for a key, all clients with active queries matching that key refetch through their authorized server function.

No channel names, no topic strings, no routing configuration. The structure you already use to organize your cache is the structure that drives realtime.

### The WebSocket carries signals, not data

The WebSocket delivers two kinds of messages:

1. **Invalidation signals** — a serialized query key indicating that data has changed
2. **Presence state** — ephemeral per-user state (cursors, online status, typing indicators)

Application data never travels over the WebSocket. When a client receives an invalidation signal, TanStack Query refetches through the normal `queryFn`, which calls an authorized server function. Authorization is enforced by the server function and database RLS, not by the WebSocket layer.

### Cookie-based auth with explicit lifecycle

The WebSocket connection authenticates using the existing session cookie, sent automatically on the HTTP upgrade request. The connection is not opened automatically — the application explicitly connects after a successful auth event and disconnects on logout.

Queries work normally without an active WebSocket connection. They simply aren't live. When the connection activates, existing queries become live retroactively.

## Client API

### Setup

```typescript
// realtime.ts
import { createRealtimeClient } from '@tanstack/realtime-client';

export const realtimeClient = createRealtimeClient({
  // Defaults to same origin. Override for multi-tenant gateway.
  url: import.meta.env.VITE_REALTIME_URL,
});
```

```typescript
// app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RealtimeProvider } from '@tanstack/realtime-react';
import { realtimeClient } from './realtime';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider client={realtimeClient}>
        <Router />
      </RealtimeProvider>
    </QueryClientProvider>
  );
}
```

### Connection Lifecycle

```typescript
import { useRealtime } from '@tanstack/realtime-react';

function AuthProvider({ children }) {
  const realtime = useRealtime();

  async function handleLogin(credentials) {
    await login(credentials); // sets session cookie
    realtime.connect();       // opens WebSocket with cookie
  }

  async function handleLogout() {
    realtime.disconnect();    // closes WebSocket
    await logout();           // clears session cookie
  }

  return <AuthContext.Provider value={{ handleLogin, handleLogout }}>
    {children}
  </AuthContext.Provider>;
}
```

**✅ CORRECT — connect after auth, disconnect before clearing session:**
```typescript
await login(credentials);
realtime.connect();
```

**❌ WRONG — connecting before auth exists:**
```typescript
realtime.connect();       // no cookie yet — connection will be rejected
await login(credentials);
```

**❌ WRONG — auto-connecting on mount:**
```typescript
// Do NOT configure the client to auto-connect.
// The connection must be explicitly opened after auth.
const realtimeClient = createRealtimeClient({
  autoConnect: true, // ← this option does not exist by design
});
```

### Reactive Queries

The primary API is `useRealtimeQuery` — a thin wrapper around `useQuery` that subscribes to its own query key over the WebSocket.

```typescript
import { useRealtimeQuery } from '@tanstack/realtime-react';

function TodoList({ projectId }) {
  const { data, isLoading } = useRealtimeQuery({
    queryKey: ['todos', { projectId }],
    queryFn: () => api.getTodos(projectId),
  });

  return /* render todos */;
}
```

This is the only change needed to make a query live. The hook:

1. Registers the query with TanStack Query (normal fetch + cache behavior)
2. Subscribes to the serialized query key over the WebSocket
3. When an invalidation signal arrives, calls `queryClient.invalidateQueries({ queryKey })`
4. TanStack Query refetches via `queryFn` (authorized server function)
5. Unsubscribes when the component unmounts

**✅ CORRECT — useRealtimeQuery has the same signature as useQuery:**
```typescript
// Everything you can do with useQuery works with useRealtimeQuery.
const { data, isLoading, error, refetch } = useRealtimeQuery({
  queryKey: ['todos', { projectId }],
  queryFn: () => api.getTodos(projectId),
  staleTime: 30_000,
  select: (data) => data.filter(t => !t.completed),
});
```

**✅ CORRECT — queries work without a WebSocket connection:**
```typescript
// If realtime is not connected (before auth, during reconnect),
// this behaves exactly like useQuery. No errors, no degradation.
// It simply isn't live until the connection activates.
const { data } = useRealtimeQuery({
  queryKey: ['todos', { projectId }],
  queryFn: () => api.getTodos(projectId),
});
```

**❌ WRONG — specifying channel names manually:**
```typescript
const { data } = useRealtimeQuery({
  queryKey: ['todos', { projectId }],
  queryFn: () => api.getTodos(projectId),
  channel: 'todos:123', // ← does not exist. The query key IS the channel.
});
```

**❌ WRONG — using useRealtimeQuery for data that doesn't need to be live:**
```typescript
// Static reference data that never changes at runtime.
// Just use useQuery. Don't subscribe to channels unnecessarily.
const { data } = useRealtimeQuery({
  queryKey: ['countries'],
  queryFn: () => api.getCountries(), // ← this table changes once a year
});
```

**❌ WRONG — expecting data payloads over the WebSocket:**
```typescript
// The WebSocket carries invalidation signals, not data.
// There is no onMessage callback with the new data.
const { data } = useRealtimeQuery({
  queryKey: ['todos', { projectId }],
  queryFn: () => api.getTodos(projectId),
  onRealtimeEvent: (newTodo) => { /* ← does not exist */ },
});
```

### Granular Invalidation and Key Matching

TanStack Query's key matching semantics apply to invalidation. Publishing to a prefix key invalidates all queries that start with that prefix.

```typescript
// Server publishes:
realtime.publish(['todos', { projectId: '123' }]);

// These queries are ALL invalidated (prefix match):
useRealtimeQuery({ queryKey: ['todos', { projectId: '123' }], ... });
useRealtimeQuery({ queryKey: ['todos', { projectId: '123', status: 'active' }], ... });

// This query is NOT invalidated (different projectId):
useRealtimeQuery({ queryKey: ['todos', { projectId: '456' }], ... });
```

**✅ CORRECT — publish at the right granularity:**
```typescript
// Mutation affects one project's todos. Publish at the project level.
await db.insert(todos).values(newTodo);
await realtime.publish(['todos', { projectId }]);
```

**❌ WRONG — publishing too broadly:**
```typescript
// This invalidates ALL todo queries for ALL projects.
// Every connected user refetches. Wasteful.
await db.insert(todos).values(newTodo);
await realtime.publish(['todos']);
```

**❌ WRONG — publishing too narrowly when multiple views need updating:**
```typescript
// A dashboard and a list view both show todos for this project.
// Publishing only the specific item misses the list view.
await db.insert(todos).values(newTodo);
await realtime.publish(['todos', { projectId, id: newTodo.id }]);
// ← the list query ['todos', { projectId }] is NOT invalidated
```

### Presence

Presence is ephemeral per-user state broadcast to others on the same channel. It's opt-in per component.

```typescript
import { usePresence } from '@tanstack/realtime-react';

function CollaborativeEditor({ documentId }) {
  const { others, updatePresence } = usePresence({
    key: ['document', { documentId }],
    initial: { cursor: null, name: userName },
  });

  function handleMouseMove(e) {
    updatePresence({ cursor: { x: e.clientX, y: e.clientY } });
  }

  return (
    <div onMouseMove={handleMouseMove}>
      {others.map(user => (
        <Cursor key={user.connectionId} position={user.cursor} name={user.name} />
      ))}
    </div>
  );
}
```

The `key` follows the same convention — it's a query key shape that identifies the channel. Presence channels and query channels are independent; subscribing to presence on `['document', { documentId }]` doesn't affect query invalidation for that key.

**✅ CORRECT — presence for ephemeral, high-frequency state:**
```typescript
const { others, updatePresence } = usePresence({
  key: ['document', { documentId }],
  initial: { cursor: null, status: 'viewing' },
});
// Update on user action
updatePresence({ status: 'editing' });
```

**✅ CORRECT — throttled updates for continuous state:**
```typescript
// updatePresence is automatically throttled (default: 50ms).
// Safe to call on every mousemove.
function handleMouseMove(e) {
  updatePresence({ cursor: { x: e.clientX, y: e.clientY } });
}
```

**❌ WRONG — storing persistent data in presence:**
```typescript
// Presence is ephemeral. It disappears when the user disconnects.
// Don't use it for data that should survive a page refresh.
const { updatePresence } = usePresence({
  key: ['todos', { projectId }],
  initial: { newTodoText: '' }, // ← this is form state, not presence
});
```

**❌ WRONG — using presence without a corresponding data query:**
```typescript
// Presence tells you who else is HERE. "Here" should be defined
// by a resource the user has authorized access to.
// If there's no query establishing access, presence alone is
// a potential information leak (reveals who's looking at what).
const { others } = usePresence({
  key: ['secret-project', { id: '123' }],
  initial: { name: 'spy' },
  // ← no useRealtimeQuery for this key means no server-side auth check
});
```

### Presence Lifecycle and Cleanup

When a connection drops, the server removes that user from all presence channels and broadcasts the departure to remaining participants. On reconnect, the client re-joins presence channels with its last known state.

`others` is a reactive array. Entries appear when users join, update when they call `updatePresence`, and disappear when they leave or disconnect. Each entry includes a stable `connectionId` for keying React elements.

```typescript
type PresenceUser<T> = {
  connectionId: string;
  data: T;
};

const { others } = usePresence<{ cursor: { x: number, y: number } | null }>({
  key: ['document', { documentId }],
  initial: { cursor: null },
});

// others: PresenceUser<{ cursor: { x: number, y: number } | null }>[]
```

## Server API

### Publish (TanStack Start server functions)

```typescript
import { createServerFn } from '@tanstack/start';
import { realtime } from './realtime.server';
import { db } from './db';
import { todos } from './schema';

export const addTodo = createServerFn({ method: 'POST' })
  .validator(z.object({ projectId: z.string(), text: z.string() }))
  .handler(async ({ data }) => {
    const newTodo = await db.insert(todos).values({
      projectId: data.projectId,
      text: data.text,
    }).returning();

    await realtime.publish(['todos', { projectId: data.projectId }]);

    return newTodo;
  });
```

**✅ CORRECT — publish after successful mutation:**
```typescript
.handler(async ({ data }) => {
  const result = await db.insert(todos).values(data).returning();
  await realtime.publish(['todos', { projectId: data.projectId }]);
  return result;
});
```

**❌ WRONG — publishing before the mutation commits:**
```typescript
.handler(async ({ data }) => {
  await realtime.publish(['todos', { projectId: data.projectId }]);
  // ← if this throws, clients refetch and get stale data
  const result = await db.insert(todos).values(data).returning();
  return result;
});
```

**❌ WRONG — publishing inside a transaction before commit:**
```typescript
.handler(async ({ data }) => {
  await db.transaction(async (tx) => {
    const result = await tx.insert(todos).values(data).returning();
    await realtime.publish(['todos', { projectId: data.projectId }]);
    // ← transaction hasn't committed yet.
    // Subscribers refetch and don't see the new row.
  });
});
```

**✅ CORRECT — publishing after transaction commits:**
```typescript
.handler(async ({ data }) => {
  const result = await db.transaction(async (tx) => {
    return await tx.insert(todos).values(data).returning();
  });
  // Transaction committed. Safe to notify subscribers.
  await realtime.publish(['todos', { projectId: data.projectId }]);
  return result;
});
```

**❌ WRONG — sending data payloads through publish:**
```typescript
// publish() sends invalidation signals, not data.
// There is no payload parameter.
await realtime.publish(['todos', { projectId }], { action: 'insert', data: newTodo });
// ← second argument does not exist
```

### Server-Side Realtime Setup

```typescript
// realtime.server.ts
import { createRealtimeServer } from '@tanstack/realtime-server';

export const realtime = createRealtimeServer({
  // Default: in-process EventEmitter (single instance)
  // Override for multi-instance deployments
  adapter: process.env.NATS_URL
    ? natsAdapter({ url: process.env.NATS_URL })
    : undefined,
});
```

The realtime server attaches to the application's HTTP server to handle WebSocket upgrades. In TanStack Start / Nitro, this is automatic via a server plugin:

```typescript
// server/plugins/realtime.ts
import { realtime } from '../realtime.server';

export default defineNitroPlugin((nitro) => {
  realtime.attach(nitro);
});
```

### Cookie Verification

The server must verify the session cookie on WebSocket upgrade. The library calls a user-provided `authenticate` function:

```typescript
export const realtime = createRealtimeServer({
  authenticate: async (request) => {
    // Extract and verify session from cookie.
    // Return a user identifier or null to reject.
    const session = await getSession(request);
    if (!session) return null;
    return { userId: session.userId };
  },
});
```

**✅ CORRECT — authenticate returns user context:**
```typescript
authenticate: async (request) => {
  const session = await auth.getSession(request);
  if (!session) return null;
  return { userId: session.userId };
}
```

**❌ WRONG — skipping authentication:**
```typescript
// Every WebSocket connection must be authenticated.
// An unauthenticated connection can subscribe to any key
// and receive invalidation signals, which leak information
// about when data changes even if the data itself isn't sent.
authenticate: async () => {
  return { userId: 'anonymous' }; // ← don't do this
}
```

## Wire Protocol

A single multiplexed WebSocket connection carries all messages. Messages are JSON-encoded.

### Client → Server

**Subscribe to query invalidation:**
```json
{ "type": "subscribe", "key": "[\"todos\",{\"projectId\":\"123\"}]" }
```

**Unsubscribe from query invalidation:**
```json
{ "type": "unsubscribe", "key": "[\"todos\",{\"projectId\":\"123\"}]" }
```

**Join presence channel:**
```json
{ "type": "presence:join", "key": "[\"document\",{\"documentId\":\"456\"}]", "data": { "cursor": null, "name": "Alice" } }
```

**Update presence:**
```json
{ "type": "presence:update", "key": "[\"document\",{\"documentId\":\"456\"}]", "data": { "cursor": { "x": 100, "y": 200 } } }
```

**Leave presence channel:**
```json
{ "type": "presence:leave", "key": "[\"document\",{\"documentId\":\"456\"}]" }
```

### Server → Client

**Invalidation signal:**
```json
{ "type": "invalidate", "key": "[\"todos\",{\"projectId\":\"123\"}]" }
```

**Presence: user joined:**
```json
{ "type": "presence:join", "key": "[\"document\",{\"documentId\":\"456\"}]", "connectionId": "abc", "data": { "cursor": null, "name": "Bob" } }
```

**Presence: user updated:**
```json
{ "type": "presence:update", "key": "[\"document\",{\"documentId\":\"456\"}]", "connectionId": "abc", "data": { "cursor": { "x": 150, "y": 250 } } }
```

**Presence: user left:**
```json
{ "type": "presence:leave", "key": "[\"document\",{\"documentId\":\"456\"}]", "connectionId": "abc" }
```

**Presence: full sync (sent on join to provide current state):**
```json
{ "type": "presence:sync", "key": "[\"document\",{\"documentId\":\"456\"}]", "users": [
  { "connectionId": "abc", "data": { "cursor": { "x": 150, "y": 250 }, "name": "Bob" } },
  { "connectionId": "def", "data": { "cursor": null, "name": "Carol" } }
] }
```

### Key Serialization

Query keys are serialized using TanStack Query's `hashKey` function, which produces deterministic JSON strings with sorted object keys. `['todos', { b: 2, a: 1 }]` and `['todos', { a: 1, b: 2 }]` produce the same wire string.

The library imports and reuses `hashKey` directly from `@tanstack/query-core`. No custom serialization.

## Connection Management

### Reconnection

When the WebSocket disconnects unexpectedly:

1. The client attempts reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s) with jitter
2. On successful reconnection, the client resubscribes to all active query keys and presence channels
3. All active realtime queries are invalidated and refetched in batches (max 5 concurrent refetches, 50ms stagger) to avoid thundering herd
4. Presence channels receive a full `presence:sync` on rejoin

**✅ CORRECT — the library handles reconnection automatically:**
```typescript
// No reconnection logic needed in application code.
// useRealtimeQuery hooks remain mounted, the library handles
// disconnect → reconnect → resubscribe → refetch transparently.
```

**❌ WRONG — manually managing reconnection:**
```typescript
// Don't do this. The library manages the connection.
realtimeClient.on('disconnect', () => {
  setTimeout(() => realtimeClient.connect(), 1000);
});
```

### Window Focus

When the window regains focus after being backgrounded:

1. The library checks if the WebSocket is still alive (ping/pong)
When the window regains focus after being backgrounded:
The library checks if the WebSocket is still alive (ping/pong)
If dead, triggers reconnection flow above
If alive, invalidates all active realtime queries (since events may have been missed while throttled in background)
This integrates with TanStack Query's existing refetchOnWindowFocus behavior. When both are enabled, Realtime defers to Query's focus handler to avoid double-refetching.
Explicit Lifecycle
const realtime = useRealtime();

realtime.connect();          // open WebSocket
realtime.disconnect();       // close WebSocket, clear subscriptions
realtime.status;             // 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
State transitions:
disconnected → connect() → connecting → connected
connected → disconnect() → disconnected
connected → unexpected close → reconnecting → connected
connected → disconnect() during reconnecting → disconnected
Hooks observe status reactively:
function ConnectionStatus() {
  const { status } = useRealtime();
  if (status === 'connected') return null;
  return <Banner>Reconnecting...</Banner>;
}
Adapter Interface
The default adapter is an in-process EventEmitter. For multi-instance deployments, a pluggable adapter distributes messages across processes.
interface RealtimeAdapter {
  // Publish an invalidation signal to all instances
  publish(serializedKey: string): Promise<void>;

  // Subscribe to invalidation signals from other instances
  subscribe(callback: (serializedKey: string) => void): Promise<void>;

  // Publish presence update to all instances
  publishPresence(channel: string, event: PresenceEvent): Promise<void>;

  // Subscribe to presence events from other instances
  subscribePresence(callback: (channel: string, event: PresenceEvent) => void): Promise<void>;

  // Cleanup
  close(): Promise<void>;
}
Built-in adapters:
memoryAdapter() — default, in-process, single instance
natsAdapter({ url }) — NATS pub/sub for multi-instance
✅ CORRECT — single instance (local dev, small deploy):
// No adapter config needed. In-memory is the default.
const realtime = createRealtimeServer();
✅ CORRECT — multi-instance (production):
const realtime = createRealtimeServer({
  adapter: natsAdapter({ url: process.env.NATS_URL }),
});
❌ WRONG — using memory adapter with multiple instances:
// Two app instances behind a load balancer.
// User A connects to instance 1, user B to instance 2.
// User A mutates and publishes — only instance 1's clients are notified.
// User B never sees the update.
// Use a NATS or Redis adapter for multi-instance.
Deployment Models
Single process (export / self-host)
┌─────────────────────────────────┐
│ Node/Bun process                │
│  HTTP server + WebSocket server │
│  TanStack Start (server fns)    │
│  In-memory adapter              │
└──────────────┬──────────────────┘
               │
          ┌────┴────┐
          │ Postgres │
          └─────────┘
Everything runs in one process. No external dependencies beyond Postgres. The docker-compose file has no realtime service — it's the app.
Multi-tenant platform (Lovable)
┌──────────────┐    ┌──────────────┐
│ WS Gateway 1 │    │ WS Gateway 2 │   (stateless, holds connections)
└──────┬───────┘    └──────┬───────┘
       │                   │
       └─────────┬─────────┘
                 │
            ┌────┴────┐
            │  NATS    │                (fan-out across gateways)
            └────┬────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───┴───┐  ┌───┴───┐  ┌───┴───┐
│Worker1│  │Worker2│  │Worker3│     (server fns, publish to NATS)
└───────┘  └───────┘  └───────┘
Workers (server functions) publish to NATS. Gateways subscribe to NATS and fan out to connected WebSocket clients. The generated application code is identical in both models — the adapter config is the only difference.
What This Library Is Not
Not a database change stream. It doesn't watch the Postgres WAL. Invalidation happens explicitly in server functions. If data changes through a direct SQL session or migration, connected clients won't know. This is a deliberate tradeoff for simplicity and portability.
Not a data transport. The WebSocket never carries application data. This keeps the security model simple — auth happens in server functions, not in the WebSocket layer.
Not a CRDT or conflict resolution system. For collaborative editing (e.g., multiplayer text documents), use a dedicated library like Yjs or Automerge. TanStack Realtime's presence feature complements these tools (showing cursors, online users) but doesn't replace them.
Not a message queue. Messages are fire-and-forget. If a client is disconnected, it misses invalidation signals and catches up by refetching on reconnect. There is no guaranteed delivery, no ordering, no replay.
Implementation Checklist
Phase 1: Core
[ ] @tanstack/realtime-client — createRealtimeClient, WebSocket management, reconnection with backoff + jitter
[ ] @tanstack/realtime-react — RealtimeProvider, useRealtimeQuery, useRealtime
[ ] @tanstack/realtime-server — createRealtimeServer, publish(), WebSocket upgrade handler, cookie auth hook
[ ] Wire protocol implementation (JSON messages, key serialization via hashKey)
[ ] Memory adapter (default)
[ ] Batched refetch on reconnect (max concurrency + stagger)
[ ] Window focus integration with TanStack Query
Phase 2: Presence
[ ] usePresence hook — join, update (with throttle), leave, others array
[ ] Server-side presence state tracking per connection
[ ] presence:sync on join
[ ] Cleanup on disconnect (broadcast leave to remaining participants)
[ ] Presence wire protocol messages
Phase 3: Scaling
[ ] Adapter interface
[ ] NATS adapter
[ ] Redis adapter (community contribution target)
[ ] Documentation for multi-instance deployment