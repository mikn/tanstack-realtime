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

- [ ] Create new doc page: `packages/docs/src/pages/docs/Authentication.tsx`
- [ ] Add to sidebar under "Guides" section in `Sidebar.tsx`
- [ ] Document `getUser(req)` — what it receives, what to return, what happens on null
- [ ] Document per-channel authorization via `authorize` function
  - [ ] Show `ChannelPermissions` return shape (`{ subscribe, publish, presence }`)
  - [ ] Example: project membership check
- [ ] Document token-based auth for WebSocket transport (`getToken` client option)
- [ ] Document SSE Bearer token pattern with middleware example
- [ ] Document Centrifugo subscription token flow
- [ ] Document what happens when auth expires mid-session (must reconnect for WS)
- [ ] Document `ValidatePublishFn` for server-side message validation
- [ ] Add interactive demo: authorized vs. denied subscription (show error state)

---

## Project 3 — Exported Test Utilities [E2]

> Professional teams can't adopt without a testing story.

- [ ] Create `@tanstack/realtime/testing` entry point (or `@tanstack/realtime-testing` package)
- [ ] Implement `createMockTransport()` — controllable fake transport
  - [ ] Methods: `simulateMessage(channel, data)`, `simulateDisconnect()`, `simulateReconnect()`
  - [ ] Observable message log for assertions
- [ ] Implement `createMockPresenceTransport()` — extends mock with presence join/leave/update
- [ ] Implement `TestRealtimeProvider` for React — auto-connects with mock transport
- [ ] Add usage examples in JSDoc and README
- [ ] Write tests for the test utilities themselves
- [ ] Document testing patterns in a new doc page: `packages/docs/src/pages/docs/Testing.tsx`
  - [ ] Add to sidebar under "Guides"
  - [ ] Show: testing a collection hook, testing presence, testing optimistic rollback

---

## Project 4 — Surface Subscription Auth Errors [E5]

> Silent failures are the worst DX bug class.

- [ ] Add `onSubscribeError(channel, reason)` callback to transport interface
- [ ] Propagate subscribe errors in `wsTransport` (currently `console.warn` only)
- [ ] Propagate subscribe errors in `sseTransport`
- [ ] Propagate subscribe errors in `centrifugoTransport`
- [ ] Surface `subscribeError` state in `realtimeCollectionOptions`
- [ ] Surface `subscribeError` state in `liveChannelOptions`
- [ ] Surface `subscribeError` in React hooks (`useRealtimeCollection`, `useLiveChannel`, `useSubscribe`)
- [ ] Add dev-mode console error with actionable message ("Check your authorize function")
- [ ] Add test coverage for subscribe error propagation
- [ ] Document error handling in the Authentication guide (Project 2)

---

## Project 5 — Horizontal Scaling Guide [D2]

> Developers need confidence it works beyond a prototype.

- [ ] Create new doc page: `packages/docs/src/pages/docs/Scaling.tsx`
- [ ] Add to sidebar under "Infrastructure" section
- [ ] Explain why single-process breaks (each server only sees its own subscribers)
- [ ] Document the `PublishBackend` interface with full TypeScript signature
- [ ] Example: Redis PUBLISH/SUBSCRIBE implementation
- [ ] Example: Postgres LISTEN/NOTIFY implementation
- [ ] Example: Cloudflare Durable Objects approach
- [ ] Show how to pair `PublishBackend` with `createNodeServer` (not just TanStack Start)
- [ ] Show how to pair `PublishBackend` with `createSseHandler`
- [ ] Add "When you need this" decision criteria (> 1 server process, horizontal auto-scaling, etc.)

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
- [ ] Update Getting Started doc page to reflect auto-connect behavior
- [ ] Add test for auto-connect and manual-connect modes

---

## Project 8 — Document Missing Website Features [D6]

> Several implemented features are invisible on the website.

- [ ] **Ephemeral channels page** — `packages/docs/src/pages/docs/Ephemeral.tsx`
  - [ ] Document `ephemeralLiveOptions` with TTL-based expiry
  - [ ] Example: typing indicators
  - [ ] Example: emoji reactions
  - [ ] Example: "user is viewing" notifications
  - [ ] Add to sidebar under "Features"
- [ ] **Tick/game-state page** — `packages/docs/src/pages/docs/Tick.tsx`
  - [ ] Document `tickCollectionOptions` with delta compression
  - [ ] Document `tickTransport` at 60Hz
  - [ ] Example: multiplayer game state sync
  - [ ] Example: live dashboard gauge
  - [ ] Add to sidebar under "Features"
- [ ] **Add to existing Streaming page:**
  - [ ] Document `staleAfter` option and `'stale'` status in `useStream`
- [ ] **Add to existing Channels page:**
  - [ ] Document `useLiveChannel` hook (distinct from `liveChannelOptions`)
  - [ ] Document `createValidatedPublish` for stateless server validation
- [ ] **Wire protocol page** — `packages/docs/src/pages/docs/WireProtocol.tsx`
  - [ ] Document message format for custom transport authors
  - [ ] List all message types: subscribe, publish, presence:join, etc.
  - [ ] Add to sidebar under "Reference"

---

## Project 9 — Y.js Integration Guide [F1]

> Rich text collaboration is the most-asked-about use case.

- [ ] Research: confirm Y.js awareness protocol can run over TanStack Realtime's transport
- [ ] Build proof-of-concept: Y.js document synced via `wsTransport` channel
- [ ] Create doc page: `packages/docs/src/pages/docs/RichTextCRDTs.tsx`
  - [ ] Explain when to use field-level CRDTs vs. Y.js/Automerge
  - [ ] Step-by-step: wiring Y.js awareness + document sync through a TanStack Realtime channel
  - [ ] Show the split: TanStack Realtime for transport/presence, Y.js for text CRDT
  - [ ] Add to sidebar under "Guides"
- [ ] Consider: `withYjs(transport)` adapter that bridges Y.js provider protocol

---

## Project 10 — Consolidated Error Reference [D3]

> Scattered error docs = hours of debugging.

- [ ] Create doc page: `packages/docs/src/pages/docs/ErrorReference.tsx`
- [ ] Add to sidebar under "Reference"
- [ ] Document `ConflictError<T>` — when it fires, what `expected`/`received` contain, how to handle
- [ ] Document subscribe errors — authorization denied, channel not found, transport errors
- [ ] Document publish errors — validation rejected, unauthorized, transport errors
- [ ] Document offline queue flush errors — `onFlushError` callback, retry behavior
- [ ] Document gap recovery errors — `onGapError` callback, fallback strategies
- [ ] Document stream errors — `status: 'error'`, server-side `stream.error()`, HMAC failures
- [ ] Document connection errors — transport-level, reconnection behavior
- [ ] For each error: what triggers it, how to handle it, what the user sees if unhandled

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

- [ ] Create doc page: `packages/docs/src/pages/docs/Centrifugo.tsx`
- [ ] Add to sidebar under "Guides"
- [ ] Step-by-step: installing and configuring Centrifugo
- [ ] Document namespace configuration for TanStack Realtime channels
- [ ] Document token generation (connection token + subscription token)
- [ ] Document presence setup via Centrifugo
- [ ] Document server-assisted gap recovery (epoch/offset)
- [ ] Show production deployment topology diagram

---

## Project 15 — Auto-Generated API Reference [D5]

> JSDoc is already excellent — just needs a generator.

- [ ] Evaluate TypeDoc vs. API Extractor vs. custom TSDoc parser
- [ ] Configure chosen tool against `packages/realtime-core/`
- [ ] Generate API reference pages for all public exports
- [ ] Integrate into docs site (static pages or iframe)
- [ ] Add to sidebar under "Reference"
- [ ] Add CI step to regenerate on each commit

---

## Project 16 — Server Lifecycle Hooks [F6]

> `onChannelEmpty`, `onClientDisconnect` for cleanup and analytics.

- [ ] Design lifecycle callback interface: `onFirstSubscriber`, `onChannelEmpty`, `onClientConnect`, `onClientDisconnect`
- [ ] Implement in `createNodeServer` (WebSocket server)
- [ ] Implement in `createSseHandler`
- [ ] Add test coverage for each lifecycle event
- [ ] Document in Scaling guide (Project 5) and/or a dedicated server events section

---

## Project 17 — SharedWorker Bundler Guide [D8]

> Practical blocker for multi-tab coordination.

- [ ] Add section to Resilience doc page (or new "Multi-Tab" page)
- [ ] Document Vite SharedWorker entrypoint setup
- [ ] Document Webpack SharedWorker loader config
- [ ] Document what happens when SharedWorker is unavailable (BroadcastChannel fallback)
- [ ] Provide copy-paste worker file template

---

## Project 18 — Reactions / Ephemeral Broadcast Patterns [F5]

> Make ephemeral features discoverable.

- [ ] Add "Recipes" section to the Ephemeral channels page (Project 8)
- [ ] Recipe: emoji reactions (ephemeral event → animate → discard)
- [ ] Recipe: confetti / celebration animation
- [ ] Recipe: "user is viewing this record" indicator
- [ ] Recipe: toast notifications from server events

---

## Project 19 — CHANGELOG.md [D7]

> Needed before reaching 1.0.

- [ ] Create `CHANGELOG.md` at repository root
- [ ] Backfill notable changes from git history
- [ ] Adopt a changelog format (Keep a Changelog or Conventional Changelog)
- [ ] Add changelogger tooling to CI (e.g., changesets, or manual)
- [ ] Move relevant content from `NEW_FEATURES.md` into changelog entries

---

## Project 20 — SSE Transport Decision Guide [E6]

> "Which transport should I use?" is the first question.

- [ ] Add decision matrix to existing Transports doc page (`Transports.tsx`)
  - [ ] Criteria: bidirectional, presence, proxy-friendliness, scaling, infrastructure
  - [ ] Rows: WebSocket, SSE, Centrifugo
- [ ] Add "When to use each" narrative section with recommendations per app type
- [ ] Link to Centrifugo walkthrough (Project 14) for the Centrifugo row

---

## Project 21 — Read Receipts / Delivery Confirmation Pattern [F3]

> Too app-specific for a generic primitive, but guidance is needed.

- [ ] Add recipe to Channels or Ephemeral doc page
- [ ] Pattern: using presence to track "last read message ID" per user
- [ ] Pattern: using ephemeral channel for delivery acknowledgments
- [ ] Discuss trade-offs (presence-based vs. persistent storage-based)

---

## Project 22 — Undo/Redo Across Collaborators [F4]

> Document the limitation and available workarounds.

- [ ] Add section to CRDTs doc page
- [ ] Explain why CRDT convergence !== undo (no causal ordering per-author)
- [ ] Pattern: per-field LWW snapshots for lightweight undo
- [ ] Reference Y.js UndoManager for rich text use cases (link to Project 9)

---

## Project 23 — Documentation Site Revision

> Revise the overall docs site to better surface all of the above and improve first-impression quality.

### Navigation & Information Architecture

- [ ] Restructure sidebar into clearer sections:
  - **Getting Started**: Getting Started, Quick Examples
  - **Core Concepts**: Collections, Channels & Pub/Sub, Streaming, Presence
  - **Advanced Features**: CRDTs, Ephemeral Channels, Tick/Game State, Rich Text (Y.js)
  - **Guides**: Authentication, TanStack Start + Drizzle, Centrifugo, Scaling to Production, Testing, Multi-Tab / SharedWorker
  - **Infrastructure**: Transports (with decision matrix), Resilience
  - **Reference**: React Hooks, API Reference, Error Reference, Wire Protocol
- [ ] Add breadcrumbs or "You are here" indicator
- [ ] Add previous/next page navigation at the bottom of each doc page
- [ ] Add "Edit this page on GitHub" links

### Home Page

- [ ] Update feature cards to include: Ephemeral Channels, Tick/Game State, AI Streaming, DevTools (when ready)
- [ ] Add "Examples" section linking to runnable example apps (Project 1)
- [ ] Add "Framework Support" badges (React + Vue/Solid when Project 6 ships)
- [ ] Refresh the "When to use" section to reference competitive landscape from analysis doc
- [ ] Add testimonials/social proof section (when available)

### Getting Started Page

- [ ] Add transport selection guidance (link to decision matrix, Project 20)
- [ ] Add "Next steps" section at the bottom linking to the progressive spectrum
- [ ] Show the 3-step path: (1) basic query, (2) add realtime, (3) add CRDTs — with working code
- [ ] Add note about `autoConnect` behavior (Project 7)

### Collections Page

- [ ] Add section on subscribe error handling (link to Error Reference, Project 10)
- [ ] Add note about offline queue integration
- [ ] Add "See also" links to related pages (CRDTs, Resilience, Scaling)

### Channels Page

- [ ] Document `useLiveChannel` hook (Project 8)
- [ ] Document `createValidatedPublish` (Project 8)
- [ ] Add pagination/history section when Project 12 ships
- [ ] Add "Recipes" linking to read receipts (Project 21) and reactions (Project 18)

### CRDTs Page

- [ ] Add undo/redo limitations section (Project 22)
- [ ] Add "When to use Y.js instead" callout linking to Rich Text guide (Project 9)
- [ ] Add visual diagram showing field-level merge behavior

### Presence Page

- [ ] Add "contextual presence" pattern (presence data scoped to a specific entity/cell)
- [ ] Add throttling guidance for high-frequency cursor updates
- [ ] Link to live-cursors example (Project 1)

### Streaming Page

- [ ] Document `staleAfter` and `'stale'` status (Project 8)
- [ ] Link to AI streaming example (Project 1)
- [ ] Add server-side checkpoint persistence patterns

### Transports Page

- [ ] Add decision matrix (Project 20)
- [ ] Link to Centrifugo guide (Project 14)
- [ ] Link to Scaling guide (Project 5)

### Resilience Page

- [ ] Add SharedWorker bundler setup section (Project 17)
- [ ] Add "what happens when..." FAQ: offline, tab closed, token expired, server restart

### Hooks Reference Page

- [ ] Add all hooks (ensure `useLiveChannel`, `useEphemeral`, `useSyncedFields`, `useSyncedCounter` are listed)
- [ ] For each hook: signature, return type, options, example, "See also" link to concept page
- [ ] Add framework tabs when Project 6 ships (React / Vue / Solid equivalents)

### Cross-Cutting Docs Quality

- [ ] Add search functionality to the docs site (e.g., Algolia DocSearch or local Fuse.js)
- [ ] Add syntax highlighting theme consistent with TanStack brand
- [ ] Ensure all `<CodeBlock>` examples have file path titles for context
- [ ] Add copy-to-clipboard button on all code blocks
- [ ] Review all existing pages for broken internal links after restructure
- [ ] Add OpenGraph meta tags for social sharing previews
