# Sync Engine Research: TanStack Realtime vs Sync Engines vs Convex

## What Problem Does a Sync Engine Solve?

A **sync engine** maintains a **consistent, bidirectional replica** of server-side data on the client. The core problem: making the client feel like it has a local database that magically stays in sync with the server, including when offline.

### Depth of a Full Sync Engine

#### 1. Persistent Client-Side Replica
Maintains a **durable, queryable local copy** in IndexedDB. The client reads from this local store, never waiting on the network for reads:
- **Instant reads** — no loading spinners for cached data
- **Offline reads** — the app works without a network connection
- **Reactive queries** — the local store notifies the UI when data changes

#### 2. Bidirectional Sync Protocol
Log-based or diff-based protocol to reconcile client and server:
- **Server → Client**: Stream of operations since client's last checkpoint
- **Client → Server**: Write-ahead log (WAL) of local mutations
- **Checkpoint tracking**: Reconnections only transfer the delta

#### 3. Conflict Resolution
When the same row is mutated on both client and server while offline:
- Last-write-wins (simplest)
- Per-field CRDTs (what TanStack Realtime does)
- Operational transforms (for text/sequences)
- Application-level conflict handlers

#### 4. Optimistic Mutations with Rollback
Client applies mutations instantly. If the server rejects, the sync engine **rolls back** optimistic state and replays subsequent mutations (transactional rebase).

#### 5. Offline Write Queue with Guaranteed Delivery
Mutations made offline are persisted and replayed in order on reconnect, with exactly-once or at-least-once delivery.

---

## Where TanStack Realtime Sits Today

### What We Already Have

| Capability | Implementation |
|---|---|
| Transport abstraction | `RealtimeTransport` with SSE + Centrifugo adapters |
| Pub/sub channels | `subscribe()` / `publish()` with channel key serialization |
| TanStack DB integration | `realtimeCollectionOptions` returns full `CollectionConfig` with `sync()` |
| Per-field CRDTs | LWW, PN-Counter, OR-Set with Lamport clocks |
| Optimistic mutations | Echo suppression via `_nonce` + `_clientId`, auto-publish on success |
| Offline queue | `useOfflineQueue` with storage persistence, FIFO flush on reconnect |
| Gap recovery | `useGapRecovery` fires `onGap` per channel on reconnect |
| Deduplication | Bounded FIFO dedup filter |
| Presence | Full presence with `PresenceCapable` transports |
| Server streaming | Checkpointed, heartbeated, HMAC-signed `ServerStream` |
| Multi-tab coordination | SharedWorker → BroadcastChannel → direct fallback |

### What a Full Sync Engine Adds

| Missing Piece | Impact |
|---|---|
| **Persistent local replica** | Collections live in memory only. No local cache means `queryFn()` runs on every mount. A sync engine boots instantly from IndexedDB cache. |
| **Checkpoint-based delta sync** | On reconnect, `useGapRecovery` triggers full refetch. A sync engine tracks a cursor and fetches only the delta. |
| **Transactional rollback** | If optimistic mutation fails, `onOptimisticError` notifies but doesn't auto-revert. A sync engine would rollback and rebase. |
| **Server-driven partial sync** | A sync engine defines which subset of server data the client replicates. Our channels do some of this but mapping is manual. |
| **Schema migrations** | Upgrading the local replica when server schema changes. |
| **Cross-collection consistency** | Atomic delivery of related rows across tables. Per-channel subscriptions are independent. |

---

## Comparison with Convex

### Feature Matrix

| Aspect | Convex | TanStack Realtime |
|---|---|---|
| **Backend** | Managed BaaS — functions, database, storage, scheduling | Bring your own backend, database, deploy target |
| **Reactivity** | Reactive queries with automatic dependency tracking and server-pushed invalidation | Channel-based pub/sub with manual message-to-data mapping |
| **Consistency** | Serializable ACID transactions; queries always see consistent snapshots | Eventually consistent; CRDTs converge but no cross-field atomicity |
| **Offline** | Limited — server-authoritative, ephemeral client cache | Better: offline queue with persistence, CRDTs handle concurrent edits |
| **Types** | Full TypeScript codegen from schema | Manual but good generics via `realtimeCollectionOptions<T>` |
| **Vendor lock-in** | Complete — data, functions, infra all on Convex | Zero — works with any stack |
| **Conflict resolution** | Server wins (serializable) — conflicts prevented | Client CRDTs — conflicts embraced and resolved locally |
| **Real-time primitives** | Only reactive queries/mutations | Rich: pub/sub, presence, typing, CRDT counters/sets, server streams |

### Where Convex Wins

1. **Zero-config reactivity**: `useQuery(api.todos.list)` just works — no channels, no message parsing, no manual subscriptions
2. **Consistency guarantees**: Serializable transactions mean no inconsistent state observations
3. **No infrastructure decisions**: No SSE vs WebSocket, no pub/sub server, no scaling decisions
4. **Instant backend**: Define functions, deploy, done

### Where TanStack Realtime Wins

1. **Keep your backend**: Additive layer for existing apps — most teams already have a backend. Add `channel` to one collection and it goes live. No rearchitecture.
2. **Richer real-time primitives**: Pub/sub, presence, typing indicators, CRDT counters — all first-class. Critical for collaborative apps.
3. **Client-side CRDTs**: Every write is accepted, always. No rejected writes, no server round-trips for convergence. Fundamentally better for offline/collaborative.
4. **Transport flexibility**: SSE → Centrifugo → custom, one import swap.
5. **No vendor lock-in**: Data stays in your database. Functions stay in your codebase.

---

## Recommendations: Closing the Gap

The highest-value improvements that close the sync engine gap without sacrificing "keep your backend":

### 1. Optional Persistence Layer
Let collections opt into IndexedDB caching. On mount, read from cache first, then sync delta. Eliminates loading states for returning users and enables true offline reads.

### 2. Cursor-Based Delta Sync
Instead of `refetchOnReconnect: true` (full refetch), support a `cursor` or `lastSeq` that the server sends only what changed since. The `onGap` callback already exists — make it smarter.

### 3. Automatic Optimistic Rollback
When `onOptimisticError` fires, the collection should automatically revert the row and rebase pending mutations, not just notify the developer.

### Assessment

These three additions would provide ~80% of sync engine value while preserving the current architecture. TanStack Realtime would become a **"realtime sync layer"** — more than a transport, less than a full sync engine, and far more practical than Convex for existing apps.

**Current position**: Realtime transport layer with smart collection bindings
**Target position**: Realtime sync layer with optional local persistence
**Anti-target**: Full sync engine (too opinionated) or BaaS (platform lock-in)
