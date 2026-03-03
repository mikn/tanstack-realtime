# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Progressive spectrum architecture** enabling incremental adoption from local-only
  state through live channels to full CRDT-based collaboration, all via a single
  `realtimeCollectionOptions` API that works with or without channels.
- **CRDT primitives** as first-class citizens: Last-Writer-Wins (LWW) registers,
  PN-Counters, and OR-Sets with dedicated React hooks (`useSyncedValue`, `useSyncedCounter`,
  `useSyncedSet`) and interactive documentation demos.
- **Presence system** for tracking online users and ephemeral shared state across
  connected clients.
- **Streaming support** via `streamChannelOptions` and `useStream` hook for ordered,
  resumable event streams with heartbeats, sequence deduplication, stale detection,
  and checkpointing.
- **SSE transport adapter** (`@tanstack/realtime-adapter-sse`) with `createSseHandler`
  server utility, auth middleware, and token refresh support.
- **Centrifugo transport adapter** (`@tanstack/realtime-adapter-centrifugo`) with
  `centrifugoTransport` supporting WebSocket connections to Centrifugo v4+, including
  optional `WebSocket` constructor injection for Node < 21.
- **TanStack Start preset** (`@tanstack/realtime-preset-start`) for
  transport-agnostic publishing with `withServerFns` helper for server-function
  CRUD wiring and `withRest` for REST-based mutation patterns.
- **React bindings** (`@tanstack/react-realtime`) with hooks: `useRealtimeCollection`,
  `useChannel`, `usePublish`, `usePresence`, `useStream`, `useLiveChannel`,
  `useSubscribe`, `useRealtime`, and CRDT-specific hooks.
- **TanStack DB integration** via `realtimeCollectionOptions` bridging realtime
  channels to TanStack DB collections with optimistic updates and conflict
  resolution.
- **Multi-tab coordination** using BroadcastChannel-based leader election and
  SharedWorker transport with auto-connect on port registration, presence replay,
  and reconnect handling.
- **Offline queue** for buffering mutations while disconnected with automatic replay
  on reconnect.
- **`serverAuthoritative` option** on `realtimeCollectionOptions` for server-driven
  state patterns.
- **`refetchOnReconnect` option** on `realtimeCollectionOptions` to automatically
  refresh data after transport reconnection.
- **Gap recovery** with `onGapError` callback and sequence-aware event buffering to
  handle missed messages during transient disconnections.
- **8 realtime utility modules** covering common patterns with comprehensive test
  suites.
- **Centrifugo E2E test suite** running against a real Centrifugo binary with
  auto-download in `globalSetup`.
- **Documentation site** with interactive demos, syntax highlighting, TanStack Start
  - Drizzle end-to-end guide, and mobile-friendly formatting.
- **CI pipeline** with GitHub Actions for lint, typecheck, tests, GitHub Pages
  deployment, and size-limit checks.
- **Size-limit checks** keeping `@tanstack/realtime` under 15 kB and
  `@tanstack/react-realtime` under 20 kB.
- **Changesets workflow** (`@changesets/cli`) for versioning and release management.
- **Schema validation** via StandardSchema for runtime message validation.
- **Message adapters** for Supabase Realtime and Debezium CDC wire formats
  (`onMessage` pattern).
- **Tick transport** and `tickCollectionOptions` for high-frequency game state
  (60 Hz delta compression).
- **`ephemeralLiveOptions`** for typing indicators and transient events.
- **`liveChannelOptions`** for append-only live feeds (chat, activity).

### Changed

- Renamed `BaseTransport` to `RealtimeTransport` and enforced interface segregation
  across the transport layer.
- Replaced `optimistic/derived/sharedTransport` modules with cleaner integration
  points.
- Migrated store access from `store.state` to `store.get()` across all adapters for
  TanStack Store compatibility.
- Aligned project architecture and tooling with TanStack ecosystem standards (pnpm,
  Nx, ESLint, Prettier).
- Extracted shared stream processor and envelope middleware into dedicated modules.
- Simplified documentation site to match TanStack project conventions.

### Removed

- Stale tests for removed `merge`/`retainMergeState` APIs.
- `PLAN.md` internal planning document.

### Fixed

- Buffered live events until `initialData` resolves in `liveChannelOptions`,
  preventing race conditions on initial load.
- `usePublish` now returns a promise for proper async error handling.
- React Strict Mode compatibility across all hooks.
- TypeScript excess-property errors in transport middleware.
- WebSocket polyfill setup for Node 20 CI environments.
- Bundle size regression in `@tanstack/react-realtime`.
- 65 `require-await` and `unused-var` ESLint warnings resolved.
- 17 architectural review issues and 14 security/bug review findings addressed.
- Centrifugo adapter uses `WebSocketImpl.OPEN` instead of global `WebSocket.OPEN`
  for broader runtime compatibility.
- CI deploy workflow for documentation site.
- Knip configuration and unused export cleanup.

### Security

- Added authentication middleware to `createSseHandler` to enforce authorization on
  SSE event streams.
- Reconnect regression tests to verify token refresh does not bypass auth checks.
- Correctness fixes from stream security review (sequence validation, stale
  detection).

## [0.0.1] - 2026-02-18

### Added

- Initial commit with `.gitignore` and `LICENSE`.

[Unreleased]: https://github.com/mikn/tanstack-realtime/compare/2d5cc08...HEAD
[0.0.1]: https://github.com/mikn/tanstack-realtime/commit/2d5cc08
