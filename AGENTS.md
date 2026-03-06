# AGENTS.md — TanStack Realtime

Guidelines for AI agents and contributors working on this codebase.

## Project Overview

TanStack Realtime is the realtime synchronization layer for the TanStack ecosystem.
It connects **TanStack DB** (client-side reactive collections) to live data sources
over pluggable transports, with optional CRDT convergence, presence, and offline
support.

### Relationship with TanStack DB

TanStack DB owns the client-side data model: collections, transactions, optimistic
mutations, and the `SyncConfig` protocol (`begin` / `write` / `commit` / `markReady`).
TanStack Realtime **does not duplicate** any of that. Instead, every collection
integration (`realtimeCollectionOptions`, `liveChannelOptions`, `tickCollectionOptions`,
`streamChannelOptions`, etc.) returns a `CollectionConfig` that TanStack DB consumes
directly via `createCollection()`.

- **Mutations** flow through TanStack DB's transaction system. Realtime's mutation
  wrappers (`onInsert`, `onUpdate`, `onDelete`) persist to the server and then
  publish the result to the channel for peer sync.
- **Optimistic rollback** is handled entirely by TanStack DB. Realtime's
  `optimistic: true` mode adds echo suppression (nonce + clientId) so the
  successful publish-back is not double-applied.
- **Reads** arrive as channel messages and are written into TanStack DB via the
  `SyncConfig.sync()` lifecycle.

Do not introduce state management that competes with TanStack DB. If you need
reactive client state, use `@tanstack/store` (the same store TanStack DB uses).

### Relationship with TanStack Start

TanStack Start provides server functions (via TanStack Router) that are
**ephemeral** — they spin up, handle one request, and die. There is no persistent
server process holding connections in memory.

This has critical architectural implications:

- **Server functions are the mutation endpoint.** A client calls a server function
  to write data; the server function validates, persists, and publishes to an
  external channel. The channel fans out to subscribers via a separate persistent
  connection (WebSocket or SSE).
- **Never assume server-side state persists between calls.** Anything that needs
  to survive across requests (pub/sub connections, signing key caches, session
  state) must be stored externally or scoped to the call.
- **`createValidatedPublish`** and **`createServerStream`** are designed for this
  model: stateless wrappers around a `PublishFn` that run within a single server
  function invocation.
- **`createSseHandler`** is for persistent server processes (local dev,
  self-hosted). It maintains in-memory connection state.
  Do not mix the two models.

## Architecture & Conventions

### Factory Functions, Not Classes

Every public API is a factory function returning a typed interface:

```typescript
// ✓ Correct
export function realtimeCollectionOptions<T, TKey, TSchema>(
  config: RealtimeCollectionConfig<T, TKey, TSchema>,
): CollectionConfig<T, TKey, TSchema>

// ✗ Wrong — no classes
export class RealtimeCollection { ... }
```

### Options Object Pattern

All factories accept a single options/config object. Never use positional
arguments beyond the first `inner` transport for middleware:

```typescript
// Hook factory: registers behavior on a transport via the hook pipeline
export function useOfflineQueue(
  transport: RealtimeTransport,
  options?: OfflineQueueOptions,
): OfflineQueueHandle

// Transport factory: single options object
export function sseTransport(options: SseTransportOptions): RealtimeTransport
```

### Naming Conventions

| Kind               | Pattern                                   | Example                                                |
| ------------------ | ----------------------------------------- | ------------------------------------------------------ |
| Transport factory  | `*Transport`                              | `sseTransport`                                         |
| Hook factory       | `use*`                                    | `useOfflineQueue`, `useGapRecovery`, `useTickBatching` |
| Collection factory | `*CollectionOptions` or `*ChannelOptions` | `realtimeCollectionOptions`, `streamChannelOptions`    |
| Server factory     | `create*`                                 | `createSseHandler`                                     |
| Options type       | `*Options`                                | `SseTransportOptions`                                  |
| Config type        | `*Config`                                 | `RealtimeCollectionConfig`                             |
| Type guard         | `has*` / `is*`                            | `hasPresence`                                          |

### Subscription Pattern

Subscriptions return an unsubscribe function, not a subscription object:

```typescript
subscribe(channel, onMessage) => () => void
```

### State Management

All observable state uses `@tanstack/store`. No bare EventEmitters, no
custom observable implementations:

```typescript
readonly store: Store<ConnectionStatus>
readonly queueStore: Store<OfflineQueueState>
readonly tickStore: Store<{ tick: number; serverTick: number }>
```

### Transport Hooks Contract

Hook factories register behavior on a transport's hook pipeline. They
do **not** wrap or replace the transport. Each hook can intercept lifecycle
events and publish calls via priority-ordered callbacks:

1. Call `transport.hook({ name, priority, hooks })` to register.
2. Return an `{ unhook }` handle so consumers can remove the hook.
3. Use `beforePublish` to intercept/buffer publishes, `onConnect`/`onDisconnect`/`onReconnect` for lifecycle.

See `useOfflineQueue` and `useGapRecovery` for the canonical pattern.

### Wire Protocol

All wire messages use **discriminated unions** keyed by a `type` field:

```typescript
type ServerMsg =
  | { type: 'connected'; connectionId: string }
  | { type: 'message'; channel: string; data: unknown }
  | { type: 'subscribe:ok'; channel: string }
  | { type: 'subscribe:error'; channel: string; code: number; reason: string }
```

When adding new message types, extend the union — do not add boolean flags.

### Error Handling

| Context               | Pattern                                  |
| --------------------- | ---------------------------------------- |
| Invalid config        | `throw new Error('[module] message')`    |
| Business logic result | Discriminated union result type          |
| Callback errors       | `onFlushError`, `onOptimisticError`      |
| Background failures   | Silent catch with comment explaining why |

Prefix throw messages with `[module]` for debuggability.

### Type Safety

- Use bounded generics: `<T extends object, TKey extends string | number, TSchema extends StandardSchemaV1>`
- Use `satisfies` for structural validation of object literals.
- Use discriminated unions over boolean flags for result types.
- Use `ReadonlyArray<T>` instead of `readonly T[]` (eslint enforced).
- Use function property syntax in interfaces, not method shorthand (eslint enforced):
  ```typescript
  // ✓
  load: () => Promise<Array<QueuedMessage>>
  // ✗
  load(): Promise<Array<QueuedMessage>>
  ```

## Code Quality

### Linting & Formatting

- ESLint with `@tanstack/eslint-config`, `eslint-plugin-unused-imports`, and
  `@vitest/eslint-plugin`.
- Prettier for formatting.
- Pre-commit hook runs `pnpm lint` — code must pass with zero errors.
- Warnings are acceptable only for `@typescript-eslint/require-await` in test
  mocks (async interface compliance).

### Testing

- All tests live in `packages/__tests__/`.
- Test files must be added to the `include` array in `vitest.workspace.ts`.
- Use the mock transport pattern: minimal objects implementing `RealtimeTransport`
  with an `emit()` helper for simulating incoming messages.
- Use `deferred<T>()` for controlling async timing in tests.
- Use `vi.useFakeTimers()` for time-dependent behavior.
- No real network calls in unit tests. Integration tests that need a real server
  use `createSseHandler` with `node:http`.

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add reconnect limit option to sseTransport
fix: prevent stale closure in useSubscribe
```

### Security

- HMAC signatures use constant-time comparison (`crypto.subtle.verify` or
  equivalent), never `===` on hex strings.
- Signing keys are scoped per-instance, never cached in module-level globals.
- HMAC is symmetric — the same key signs and verifies. Do not expose signing
  keys to untrusted clients. Document this clearly in JSDoc.
- Validate all external input at system boundaries (wire messages, storage
  deserialization). Trust internal interfaces.

## Workflow

1. Read existing code before modifying. Understand the pattern a module follows.
2. Check the spectrum table in `realtimeCollectionOptions` — new features should
   extend the spectrum, not fork it.
3. Keep changes additive and backward-compatible unless explicitly breaking.

## Pre-Commit Checks (Required)

**You MUST run all of the following checks before every commit and fix any errors:**

1. **Lint** — `pnpm lint` — zero errors required (warnings are acceptable).
2. **Typecheck** — `pnpm typecheck` — must pass with no errors.
3. **Tests** — `pnpm vitest run --project node` — all tests must pass.
4. **Docs build** (if docs were changed) — `cd packages/docs && npx vite build`.

Do not commit until all applicable checks pass. If a pre-commit hook rejects
your commit, fix the issues and create a **new** commit (do not amend).
