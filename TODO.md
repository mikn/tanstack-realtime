# TanStack Realtime — Project TODO

Scoped tasks derived from the [Realtime Features Analysis](docs/REALTIME_FEATURES_ANALYSIS.md).
Each section is a self-contained project. Tasks are ordered by dependency within each project.

---

## Project 1 — Runnable Example Applications [E1]

> The #1 way developers evaluate a library. Zero examples exist today.

- [ ] Create `examples/` directory with shared workspace config (package.json, tsconfig)
- [ ] **examples/collaborative-todos** — `realtimeCollectionOptions` + `withRest` + CRDTs (`lww`, `pn-counter`)
  - [ ] Server: Express + SQLite (or in-memory) with REST endpoints
  - [ ] Client: React + `useRealtimeCollection` + `useSyncedFields`
  - [ ] Show optimistic updates with `optimistic: true`
  - [ ] Show conflict resolution with `onOptimisticError`
  - [ ] README with setup instructions and architecture diagram
- [ ] **examples/chat** — `liveChannelOptions` + presence + typing indicators
  - [ ] Server: Express + WebSocket transport
  - [ ] Client: React + `useLiveChannel` + `usePresence`
  - [ ] Typing indicator using `ephemeralLiveOptions`
  - [ ] Online user list with avatars
  - [ ] README with setup instructions
- [ ] **examples/ai-streaming** — `createStreamChannel` + `useStream`
  - [ ] Server: Express + `createServerStream` with mock token generator
  - [ ] Client: React + `useStream` showing pending → streaming → done/error states
  - [ ] Show HMAC signing and checkpoint persistence
  - [ ] README with setup instructions
- [ ] **examples/live-cursors** — `usePresence` on a shared canvas
  - [ ] Client: React + `usePresence` with cursor position + user color
  - [ ] Show `throttle()` for cursor position updates
  - [ ] Show `others.filter(u => u.data.cursor)` pattern
  - [ ] README with setup instructions
- [ ] **examples/offline-first** — offline queue + multi-tab coordination
  - [ ] Client: React + `createOfflineQueue` + `createCoordinatedTransport`
  - [ ] Show IndexedDB persistence, pending-count badge from `queueStore`
  - [ ] Demonstrate going offline, queueing mutations, reconnecting
  - [ ] README with setup instructions
- [ ] Add top-level README section linking to all examples
- [ ] Add CI job to build/typecheck all examples

---

## Project 2 — Authentication Guide [D1]

> Auth is the first production blocker after "hello world."

- [x] Create new doc page: `packages/docs/src/pages/docs/Authentication.tsx`
- [x] Add to sidebar under "Guides" section in `Sidebar.tsx`
- [x] Document `getUser(req)` — what it receives, what to return, what happens on null
- [x] Document per-channel authorization via `authorize` function
  - [x] Show `ChannelPermissions` return shape (`{ subscribe, publish, presence }`)
  - [x] Example: project membership check
- [x] Document token-based auth for WebSocket transport (`getToken` client option)
- [x] Document SSE Bearer token pattern with middleware example
- [x] Document Centrifugo subscription token flow
- [x] Document what happens when auth expires mid-session (must reconnect for WS)
- [x] Document `ValidatePublishFn` for server-side message validation
- [ ] Add interactive demo: authorized vs. denied subscription (show error state)

---

## Project 3 — Exported Test Utilities [E2]

> Professional teams can't adopt without a testing story.

- [x] Create `@tanstack/realtime/testing` entry point (or `@tanstack/realtime-testing` package)
- [x] Implement `createMockTransport()` — controllable fake transport
  - [x] Methods: `simulateMessage(channel, data)`, `simulateDisconnect()`, `simulateReconnect()`
  - [x] Observable message log for assertions
- [x] Implement `createMockPresenceTransport()` — extends mock with presence join/leave/update
- [ ] Implement `TestRealtimeProvider` for React — auto-connects with mock transport
- [ ] Add usage examples in JSDoc and README
- [x] Write tests for the test utilities themselves
- [x] Document testing patterns in a new doc page: `packages/docs/src/pages/docs/Testing.tsx`
  - [x] Add to sidebar under "Guides"
  - [x] Show: testing a collection hook, testing presence, testing optimistic rollback

---

## Project 4 — Surface Subscription Auth Errors [E5]

> Silent failures are the worst DX bug class.

- [x] Add `onSubscribeError(channel, reason)` callback to transport interface
- [x] Propagate subscribe errors in `wsTransport` (currently `console.warn` only)
- [x] Propagate subscribe errors in `sseTransport`
- [x] Propagate subscribe errors in `centrifugoTransport`
- [x] Surface `subscribeError` state in `realtimeCollectionOptions`
- [x] Surface `subscribeError` state in `liveChannelOptions`
- [ ] Surface `subscribeError` in React hooks (`useRealtimeCollection`, `useLiveChannel`, `useSubscribe`)
- [x] Add dev-mode console error with actionable message ("Check your authorize function")
- [x] Add test coverage for subscribe error propagation
- [ ] Document error handling in the Authentication guide (Project 2)

---

## Project 5 — Horizontal Scaling Guide [D2]

> Developers need confidence it works beyond a prototype.

- [x] Create new doc page: `packages/docs/src/pages/docs/Scaling.tsx`
- [x] Add to sidebar under "Infrastructure" section
- [x] Explain why single-process breaks (each server only sees its own subscribers)
- [x] Document the `PublishBackend` interface with full TypeScript signature
- [x] Example: Redis PUBLISH/SUBSCRIBE implementation
- [x] Example: Postgres LISTEN/NOTIFY implementation
- [x] Example: Cloudflare Durable Objects approach
- [x] Show how to pair `PublishBackend` with `createNodeServer` (not just TanStack Start)
- [x] Show how to pair `PublishBackend` with `createSseHandler`
- [x] Add "When you need this" decision criteria (> 1 server process, horizontal auto-scaling, etc.)

---

## Project 6 — Framework Adapters [FW1]

> TanStack brand promise: framework-agnostic.

- [ ] **`@tanstack/vue-realtime`** — Vue composables
  - [ ] `useRealtimeCollection` composable
  - [ ] `useLiveChannel` composable
  - [ ] `usePresence` composable
  - [ ] `useStream` composable
  - [ ] `useSubscribe` composable
  - [ ] `RealtimeProvider` as provide/inject
  - [ ] Tests mirroring React adapter test coverage
- [ ] **`@tanstack/solid-realtime`** — Solid signals
  - [ ] `createRealtimeCollection` signal
  - [ ] `createLiveChannel` signal
  - [ ] `createPresence` signal
  - [ ] `createStream` signal
  - [ ] `createSubscribe` signal
  - [ ] `RealtimeProvider` as context
  - [ ] Tests mirroring React adapter test coverage
- [ ] Update docs home page to list supported frameworks
- [ ] Add framework tabs to code examples on doc pages (React / Vue / Solid)

---

## Project 7 — RealtimeProvider Auto-Connect [E3]

> Every new user will hit this footgun.

- [ ] Add `autoConnect` prop to `RealtimeProvider` (default: `true`)
- [ ] When `autoConnect` is true, call `client.connect()` in provider mount effect
- [ ] Add dev-mode console warning when hooks detect `status === 'disconnected'` for > 2 seconds
- [x] Update Getting Started doc page to reflect auto-connect behavior
- [ ] Add test for auto-connect and manual-connect modes

---

## Project 8 — Document Missing Website Features [D6]

> Several implemented features are invisible on the website.

- [x] **Ephemeral channels page** — `packages/docs/src/pages/docs/Ephemeral.tsx`
  - [x] Document `ephemeralLiveOptions` with TTL-based expiry
  - [x] Example: typing indicators
  - [x] Example: emoji reactions
  - [x] Example: "user is viewing" notifications
  - [x] Add to sidebar under "Features"
- [x] **Tick/game-state page** — `packages/docs/src/pages/docs/Tick.tsx`
  - [x] Document `tickCollectionOptions` with delta compression
  - [x] Document `tickTransport` at 60Hz
  - [x] Example: multiplayer game state sync
  - [x] Example: live dashboard gauge
  - [x] Add to sidebar under "Features"
- [x] **Add to existing Streaming page:**
  - [x] Document `staleAfter` option and `'stale'` status in `useStream`
- [x] **Add to existing Channels page:**
  - [x] Document `useLiveChannel` hook (distinct from `liveChannelOptions`)
  - [x] Document `createValidatedPublish` for stateless server validation
- [x] **Wire protocol page** — `packages/docs/src/pages/docs/WireProtocol.tsx`
  - [x] Document message format for custom transport authors
  - [x] List all message types: subscribe, publish, presence:join, etc.
  - [x] Add to sidebar under "Reference"

---

## Project 9 — Y.js Integration Guide [F1]

> Rich text collaboration is the most-asked-about use case.

- [ ] Research: confirm Y.js awareness protocol can run over TanStack Realtime's transport
- [ ] Build proof-of-concept: Y.js document synced via `wsTransport` channel
- [x] Create doc page: `packages/docs/src/pages/docs/RichTextCRDTs.tsx`
  - [x] Explain when to use field-level CRDTs vs. Y.js/Automerge
  - [x] Step-by-step: wiring Y.js awareness + document sync through a TanStack Realtime channel
  - [x] Show the split: TanStack Realtime for transport/presence, Y.js for text CRDT
  - [x] Add to sidebar under "Guides"
- [ ] Consider: `withYjs(transport)` adapter that bridges Y.js provider protocol

---

## Project 10 — Consolidated Error Reference [D3]

> Scattered error docs = hours of debugging.

- [x] Create doc page: `packages/docs/src/pages/docs/ErrorReference.tsx`
- [x] Add to sidebar under "Reference"
- [x] Document `ConflictError<T>` — when it fires, what `expected`/`received` contain, how to handle
- [x] Document subscribe errors — authorization denied, channel not found, transport errors
- [x] Document publish errors — validation rejected, unauthorized, transport errors
- [x] Document offline queue flush errors — `onFlushError` callback, retry behavior
- [x] Document gap recovery errors — `onGapError` callback, fallback strategies
- [x] Document stream errors — `status: 'error'`, server-side `stream.error()`, HMAC failures
- [x] Document connection errors — transport-level, reconnection behavior
- [x] For each error: what triggers it, how to handle it, what the user sees if unhandled

---

## Project 11 — DevTools Panel [F7]

> TanStack Query set the precedent.

- [ ] Create `packages/realtime-devtools/` package
- [ ] Implement subscription inspector — list active channels, subscriber count
- [ ] Implement message log — timestamped incoming/outgoing messages, filterable by channel
- [ ] Implement connection state timeline — visual transitions between connected/reconnecting/disconnected
- [ ] Implement presence inspector — per-channel membership with user data
- [ ] Implement offline queue viewer — pending mutations, flush status
- [ ] Implement CRDT state viewer — per-field current state, merge history
- [ ] Build React panel component (`RealtimeDevtools`)
- [ ] Support floating panel and embedded panel modes (match TanStack Query DevTools UX)
- [ ] Add to docs home page feature list
- [ ] Document installation and usage

---

## Project 12 — Message History / Pagination [F2]

> Completes the chat use case.

- [ ] Design `fetchPrevious` / `loadMore` API for `liveChannelOptions`
- [ ] Implement cursor-based pagination (accept a loader function returning `{ items, nextCursor }`)
- [ ] Integrate with TanStack Query's infinite query pattern where applicable
- [ ] Prepend historical messages to the live list without duplicates
- [ ] Add test coverage for pagination + live append interaction
- [ ] Document in the Channels doc page
- [ ] Update chat example (Project 1) to demonstrate "load more" scrollback

---

## Project 13 — Unify Authorize Signatures [E4]

> Reduces cognitive load when switching server presets.

- [ ] Define canonical `AuthorizeFn` type: `(userId, parsedChannel) → ChannelPermissions | boolean`
- [ ] Update `createSseHandler` to accept the `ChannelPermissions` return shape
- [ ] Update `createStartHandler` to match
- [ ] Keep backward compatibility: `boolean` return still works (maps to all-or-nothing permissions)
- [ ] Add migration note in docs
- [ ] Update Authentication guide (Project 2) to show unified signature

---

## Project 14 — Centrifugo Walkthrough [D4]

> Unlocks a powerful, battle-tested scaling path.

- [x] Create doc page: `packages/docs/src/pages/docs/Centrifugo.tsx`
- [x] Add to sidebar under "Guides"
- [x] Step-by-step: installing and configuring Centrifugo
- [x] Document namespace configuration for TanStack Realtime channels
- [x] Document token generation (connection token + subscription token)
- [x] Document presence setup via Centrifugo
- [x] Document server-assisted gap recovery (epoch/offset)
- [x] Show production deployment topology diagram

---

## Project 15 — Auto-Generated API Reference [D5]

> JSDoc is already excellent — just needs a generator.

- [ ] Evaluate TypeDoc vs. API Extractor vs. custom TSDoc parser
- [ ] Configure chosen tool against `packages/realtime-core/`
- [ ] Generate API reference pages for all public exports
- [x] Integrate into docs site (static pages or iframe)
- [x] Add to sidebar under "Reference"
- [ ] Add CI step to regenerate on each commit

---

## Project 16 — Server Lifecycle Hooks [F6]

> `onChannelEmpty`, `onClientDisconnect` for cleanup and analytics.

- [ ] Design lifecycle callback interface: `onFirstSubscriber`, `onChannelEmpty`, `onClientConnect`, `onClientDisconnect`
- [ ] Implement in `createNodeServer` (WebSocket server)
- [ ] Implement in `createSseHandler`
- [ ] Add test coverage for each lifecycle event
- [x] Document in Scaling guide (Project 5) and/or a dedicated server events section

---

## Project 17 — SharedWorker Bundler Guide [D8]

> Practical blocker for multi-tab coordination.

- [x] Add section to Resilience doc page (or new "Multi-Tab" page)
- [x] Document Vite SharedWorker entrypoint setup
- [x] Document Webpack SharedWorker loader config
- [x] Document what happens when SharedWorker is unavailable (BroadcastChannel fallback)
- [x] Provide copy-paste worker file template

---

## Project 18 — Reactions / Ephemeral Broadcast Patterns [F5]

> Make ephemeral features discoverable.

- [x] Add "Recipes" section to the Ephemeral channels page (Project 8)
- [x] Recipe: emoji reactions (ephemeral event → animate → discard)
- [x] Recipe: confetti / celebration animation
- [x] Recipe: "user is viewing this record" indicator
- [x] Recipe: toast notifications from server events

---

## Project 19 — CHANGELOG.md [D7]

> Needed before reaching 1.0.

- [x] Create `CHANGELOG.md` at repository root
- [x] Backfill notable changes from git history
- [x] Adopt a changelog format (Keep a Changelog or Conventional Changelog)
- [ ] Add changelogger tooling to CI (e.g., changesets, or manual)
- [ ] Move relevant content from `NEW_FEATURES.md` into changelog entries

---

## Project 20 — SSE Transport Decision Guide [E6]

> "Which transport should I use?" is the first question.

- [x] Add decision matrix to existing Transports doc page (`Transports.tsx`)
  - [x] Criteria: bidirectional, presence, proxy-friendliness, scaling, infrastructure
  - [x] Rows: WebSocket, SSE, Centrifugo
- [x] Add "When to use each" narrative section with recommendations per app type
- [x] Link to Centrifugo walkthrough (Project 14) for the Centrifugo row

---

## Project 21 — Read Receipts / Delivery Confirmation Pattern [F3]

> Too app-specific for a generic primitive, but guidance is needed.

- [x] Add recipe to Channels or Ephemeral doc page
- [x] Pattern: using presence to track "last read message ID" per user
- [x] Pattern: using ephemeral channel for delivery acknowledgments
- [x] Discuss trade-offs (presence-based vs. persistent storage-based)

---

## Project 22 — Undo/Redo Across Collaborators [F4]

> Document the limitation and available workarounds.

- [x] Add section to CRDTs doc page
- [x] Explain why CRDT convergence !== undo (no causal ordering per-author)
- [x] Pattern: per-field LWW snapshots for lightweight undo
- [x] Reference Y.js UndoManager for rich text use cases (link to Project 9)

---

## Project 23 — Documentation Site Revision

> Revise the overall docs site to better surface all of the above and improve first-impression quality.

### Navigation & Information Architecture

- [x] Restructure sidebar into clearer sections:
  - **Getting Started**: Getting Started, Quick Examples
  - **Core Concepts**: Collections, Channels & Pub/Sub, Streaming, Presence
  - **Advanced Features**: CRDTs, Ephemeral Channels, Tick/Game State, Rich Text (Y.js)
  - **Guides**: Authentication, TanStack Start + Drizzle, Centrifugo, Scaling to Production, Testing, Multi-Tab / SharedWorker
  - **Infrastructure**: Transports (with decision matrix), Resilience
  - **Reference**: React Hooks, API Reference, Error Reference, Wire Protocol
- [x] Add breadcrumbs or "You are here" indicator
- [x] Add previous/next page navigation at the bottom of each doc page
- [x] Add "Edit this page on GitHub" links

### Home Page

- [x] Update feature cards to include: Ephemeral Channels, Tick/Game State, AI Streaming, DevTools (when ready)
- [ ] Add "Examples" section linking to runnable example apps (Project 1)
- [ ] Add "Framework Support" badges (React + Vue/Solid when Project 6 ships)
- [x] Refresh the "When to use" section to reference competitive landscape from analysis doc
- [ ] Add testimonials/social proof section (when available)

### Getting Started Page

- [x] Add transport selection guidance (link to decision matrix, Project 20)
- [x] Add "Next steps" section at the bottom linking to the progressive spectrum
- [x] Show the 3-step path: (1) basic query, (2) add realtime, (3) add CRDTs — with working code
- [x] Add note about `autoConnect` behavior (Project 7)

### Collections Page

- [x] Add section on subscribe error handling (link to Error Reference, Project 10)
- [x] Add note about offline queue integration
- [x] Add "See also" links to related pages (CRDTs, Resilience, Scaling)

### Channels Page

- [x] Document `useLiveChannel` hook (Project 8)
- [x] Document `createValidatedPublish` (Project 8)
- [ ] Add pagination/history section when Project 12 ships
- [x] Add "Recipes" linking to read receipts (Project 21) and reactions (Project 18)

### CRDTs Page

- [x] Add undo/redo limitations section (Project 22)
- [x] Add "When to use Y.js instead" callout linking to Rich Text guide (Project 9)
- [x] Add visual diagram showing field-level merge behavior

### Presence Page

- [x] Add "contextual presence" pattern (presence data scoped to a specific entity/cell)
- [x] Add throttling guidance for high-frequency cursor updates
- [x] Link to live-cursors example (Project 1)

### Streaming Page

- [x] Document `staleAfter` and `'stale'` status (Project 8)
- [ ] Link to AI streaming example (Project 1)
- [x] Add server-side checkpoint persistence patterns

### Transports Page

- [x] Add decision matrix (Project 20)
- [x] Link to Centrifugo guide (Project 14)
- [x] Link to Scaling guide (Project 5)

### Resilience Page

- [x] Add SharedWorker bundler setup section (Project 17)
- [x] Add "what happens when..." FAQ: offline, tab closed, token expired, server restart

### Hooks Reference Page

- [x] Add all hooks (ensure `useLiveChannel`, `useEphemeral`, `useSyncedFields`, `useSyncedCounter` are listed)
- [x] For each hook: signature, return type, options, example, "See also" link to concept page
- [ ] Add framework tabs when Project 6 ships (React / Vue / Solid equivalents)

### Cross-Cutting Docs Quality

- [ ] Add search functionality to the docs site (e.g., Algolia DocSearch or local Fuse.js)
- [ ] Add syntax highlighting theme consistent with TanStack brand
- [x] Ensure all `<CodeBlock>` examples have file path titles for context
- [x] Add copy-to-clipboard button on all code blocks
- [x] Review all existing pages for broken internal links after restructure
- [x] Add OpenGraph meta tags for social sharing previews
