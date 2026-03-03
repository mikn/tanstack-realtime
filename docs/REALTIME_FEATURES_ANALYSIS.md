# Realtime Features Analysis: End-User Expectations vs. Developer Ergonomics vs. TanStack Realtime

## Purpose

This document maps what end users now **expect** from realtime apps (table stakes), what genuinely **delights** them (WOW features), what **developers need** to ship those features ergonomically, and where **TanStack Realtime** currently sits against that landscape — highlighting ergonomic, documentation, and feature gaps.

---

## Part 1 — The End-User Perspective

### What does "realtime" mean to a non-technical user?

A non-technical user doesn't think about WebSockets, CRDTs, or transport protocols. They think:

> "Why am I seeing stale data? Every other app updates instantly."

Their mental model was permanently reset by apps like Google Docs (2010s), Figma (mid-2010s), Slack/Discord, and Linear. **Instant is the baseline. Anything less feels broken.**

---

### 1.1 Table Stakes — "I'd be annoyed if this was missing"

These are features users now take for granted. They don't notice them when present, but they **notice immediately** when absent.

| Feature                            | User Expectation                                                                    | Reference Apps                        |
| ---------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------- |
| **Live data updates**              | "When someone changes something, I see it immediately — without refreshing."        | Google Docs, Notion, Linear, Slack    |
| **Optimistic UI**                  | "When I click Save, it feels instant. No spinner, no delay."                        | Every modern SaaS app, Gmail          |
| **Presence awareness**             | "I can see who's online and who's looking at the same thing I'm looking at."        | Google Docs, Figma, Notion, Slack     |
| **Typing indicators**              | "I can see when someone is typing a message."                                       | iMessage, WhatsApp, Slack, Discord    |
| **Offline resilience**             | "If I lose wifi on the train, my edits don't vanish. They sync when I'm back."      | Google Docs, Notion, Linear, iMessage |
| **Reconnection transparency**      | "If my connection drops, the app recovers on its own. I shouldn't have to refresh." | Every chat app, Figma                 |
| **Cross-device consistency**       | "If I edit on my phone, my laptop shows the same state when I open it."             | Notion, iCloud, Google Workspace      |
| **Notifications / activity feeds** | "I see what changed while I was away — who commented, what was updated."            | GitHub, Linear, Slack                 |
| **Live counters / badges**         | "Unread counts update in real time. Like/vote counts feel alive."                   | Reddit, Twitter/X, YouTube            |
| **Chat / messaging**               | "Messages appear instantly, in order, and I don't miss any."                        | Every messaging app                   |

### 1.2 WOW Features — "This is genuinely impressive"

These differentiate an app. Users remember them, talk about them, and pick products partly because of them.

| Feature                                   | Why It Delights                                                                                                                             | Reference Apps                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Multiplayer cursors**                   | "I can literally see where other people are working in real time." Creates a visceral sense of collaboration.                               | Figma, Google Docs, Miro, Linear                  |
| **Conflict-free concurrent editing**      | "Two people edited the same paragraph at the same time and nothing broke. No conflict dialog."                                              | Google Docs, Notion, Figma                        |
| **AI streaming responses**                | "The AI's response types out word by word, like a person thinking." Now table stakes for AI products, still delightful in traditional apps. | ChatGPT, Cursor, Notion AI, Copilot               |
| **Live collaboration on structured data** | "We both edited the same Kanban board/spreadsheet simultaneously and it just worked."                                                       | Notion databases, Linear, Airtable, Google Sheets |
| **Instant reactions / emoji responses**   | "I reacted with an emoji and everyone saw it pop up in real time." Ephemeral, social, fun.                                                  | Slack, Discord, Zoom, Google Meet                 |
| **Live location / spatial awareness**     | "I can see where my delivery driver is in real time."                                                                                       | Uber, Google Maps sharing, Find My                |
| **Smooth high-frequency updates**         | "The game/animation/dashboard updates at 60fps without any jank."                                                                           | Multiplayer games, trading platforms, live sports |
| **Undo across collaborators**             | "I can undo my change without undoing what someone else just did."                                                                          | Google Docs, Figma                                |
| **Comments / annotations on live data**   | "I left a comment on row 42 and my teammate saw it instantly, with a highlight on the exact row."                                           | Google Sheets, Figma, Linear                      |
| **Presence in context**                   | "I see Alice's avatar on the exact cell she's editing, not just 'Alice is online'."                                                         | Google Sheets, Figma, Notion                      |

---

## Part 2 — The Developer Perspective

### What do developers expect from a realtime library in 2026?

The competitive landscape includes: **Supabase Realtime**, **Firebase/Firestore**, **Liveblocks**, **PartyKit/Partyserver**, **Convex**, **Ably**, **Pusher**, **Socket.IO**, and emerging local-first libraries like **Y.js**, **Automerge**, **ElectricSQL**, and **Zero**.

Developers in 2026 have been burned by realtime complexity and have clear expectations.

### 2.1 Table Stakes for Developer Experience

| Expectation                          | What "Good" Looks Like                                                                    | Anti-Pattern                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------- |
| **< 50 lines to first live feature** | `npm install` → provider → hook → live. No infra setup.                                   | "Deploy a Redis cluster and configure 4 YAML files first" |
| **Works with my existing stack**     | Bring your own database, server, auth. Not a platform lock-in.                            | "Migrate your entire backend to our proprietary service"  |
| **TypeScript-first**                 | Generics on channels, messages, presence data. Autocomplete in the IDE.                   | `data: any` everywhere, no intellisense                   |
| **Framework hooks**                  | `usePresence()`, `useSubscribe()` — not raw event listeners.                              | "Here's a WebSocket, call addEventListener yourself"      |
| **Automatic reconnection**           | Library handles disconnects, backoff, resubscription. Developer never writes retry logic. | "Implement your own reconnection strategy"                |
| **Optimistic updates built in**      | Declare a mutation, get instant UI. The library handles echo suppression and rollback.    | "You'll need to manage your own optimistic state cache"   |
| **Connection status observable**     | `status === 'connected'                                                                   | 'reconnecting'` — bind it to a UI indicator.              | No visibility into connection state |
| **Auth integration**                 | Token-based auth with refresh support. Per-channel authorization.                         | "Auth? That's your problem" (no hooks at all)             |
| **Testing story**                    | Mock transports, deterministic timers, example test patterns.                             | "Good luck testing WebSocket code"                        |
| **Scalable beyond one server**       | Clear path from prototype (single process) to production (Redis/Kafka fan-out).           | "Works great in development, falls apart at scale"        |

### 2.2 WOW Features for Developer Experience

| Feature                             | Why Developers Love It                                                                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Progressive disclosure**          | Start simple (just a query), add realtime, add CRDTs, add offline — each step is one line of config. Don't front-load all the complexity. |
| **Transport-agnostic**              | Swap WebSocket for SSE for Centrifugo without changing application code.                                                                  |
| **Automatic conflict resolution**   | Declare `fields: { votes: 'pn-counter' }` and never think about merge conflicts again.                                                    |
| **Multiplayer primitives as hooks** | `usePresence()` returning typed `others[]` + `updatePresence()` — what would take 200 lines of custom code becomes 3 lines.               |
| **Offline queue with persistence**  | Wrap with `createOfflineQueue({ storage: createIndexedDBStorage() })` and offline works. One line.                                        |
| **Multi-tab coordination**          | Zero-config: the library detects SharedWorker support and deduplicates connections automatically.                                         |
| **Local-first CRDT fields**         | Mix-and-match per field: `title: 'lww'`, `votes: 'pn-counter'`, `tags: 'or-set'`, `localDraft: 'local'`.                                  |
| **Full-stack type safety**          | Channel definitions shared between server and client, with inferred message types.                                                        |

---

## Part 3 — How Well Does TanStack Realtime Solve These Problems?

### 3.1 Scorecard: End-User Features

| End-User Feature          | TanStack Realtime Support                                       | Score         | Notes                                                                                      |
| ------------------------- | --------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| Live data updates         | `realtimeCollectionOptions` with channel auto-broadcast         | **Excellent** | The progressive spectrum from `queryFn` → live is the crown jewel                          |
| Optimistic UI             | `optimistic: true` + echo suppression via nonce + clientId      | **Excellent** | `onOptimisticError` with `ConflictError<T>` for rollback UI                                |
| Presence awareness        | `usePresence()` with typed channel definitions                  | **Excellent** | Join/leave/update lifecycle is clean. `others[]` array is reactive                         |
| Typing indicators         | `ephemeralLiveOptions` with TTL-based expiry                    | **Good**      | Works, but `ephemeralLiveOptions` is undocumented on the website                           |
| Offline resilience        | `createOfflineQueue` with IndexedDB/localStorage                | **Excellent** | Reactive `queueStore` for pending-count badges                                             |
| Reconnection              | Exponential backoff + `withGapRecovery` + `refetchOnReconnect`  | **Excellent** | Two complementary recovery strategies well-documented                                      |
| Cross-device consistency  | CRDTs (LWW, PN-Counter, OR-Set) + `refetchOnReconnect`          | **Good**      | CRDTs converge. But no full sync protocol (no vector clocks across devices)                |
| Activity feeds            | `liveChannelOptions` (append-only) with `initialData`           | **Good**      | Works for live events. No built-in "what changed since I was last here"                    |
| Live counters             | `useSyncedCounter` (PN-Counter CRDT)                            | **Excellent** | Concurrent increments from any number of clients always converge                           |
| Chat / messaging          | `liveChannelOptions` + `usePresence` for typing                 | **Good**      | Missing: message history/pagination, read receipts, reactions, threads                     |
| Multiplayer cursors       | `usePresence` + `updatePresence({ cursor: {x,y} })`             | **Excellent** | Interactive demo in docs. Clean pattern.                                                   |
| Conflict-free editing     | `fields: { title: 'lww', tags: 'or-set' }` per-field CRDTs      | **Good**      | Field-level CRDTs, not character-level. No Y.js/Automerge-class rich text CRDT.            |
| AI streaming              | `createStreamChannel` + `useStream` + `createServerStream`      | **Excellent** | Full lifecycle: pending → streaming → done/error/stale. HMAC signing. Checkpoints.         |
| High-frequency updates    | `tickTransport` with delta compression at 60Hz                  | **Good**      | Exists and works, but no docs page on the website. `tickCollectionOptions` undiscoverable. |
| Instant reactions         | No built-in primitive                                           | **Gap**       | Could use `ephemeralLiveOptions` but no example or guidance                                |
| Undo across collaborators | No built-in primitive                                           | **Gap**       | CRDTs converge, but there's no undo stack that respects authorship                         |
| Contextual presence       | Presence data is generic — can carry cursor, selection, cell ID | **Good**      | Flexible but no built-in "presence on entity" pattern                                      |

### 3.2 Scorecard: Developer Ergonomics

| Developer Expectation      | TanStack Realtime                                                     | Score         | Notes                                                                                                                           |
| -------------------------- | --------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Quick start (< 50 lines)   | ~39 lines for a live todo app with `withRest`                         | **Excellent** | The progressive spectrum means you can start with 5 lines and add capabilities                                                  |
| Works with existing stack  | Transport-agnostic, BYO database, BYO auth                            | **Excellent** | REST adapter (`withRest`), server function adapter (`withServerFns`), message adapters (Supabase, Debezium)                     |
| TypeScript-first           | Generics everywhere, discriminated unions, `StandardSchemaV1` support | **Excellent** | One of the strongest typed realtime APIs available                                                                              |
| Framework hooks            | 10 React hooks covering all primitives                                | **Good**      | React only. No Vue, Solid, Svelte, or Angular adapters.                                                                         |
| Automatic reconnection     | All 3 transports have exponential backoff + auto-resubscribe          | **Excellent** |                                                                                                                                 |
| Optimistic updates         | `optimistic: true` with echo suppression                              | **Excellent** |                                                                                                                                 |
| Connection status          | `Store<ConnectionStatus>` observable → `useRealtime().status`         | **Excellent** |                                                                                                                                 |
| Auth integration           | `getUser` + `authorize` hooks on server; `getToken` on client         | **Good**      | Per-channel auth exists. But no token refresh mid-session (WebSocket) and no end-to-end auth guide                              |
| Testing story              | No exported test utilities or mock transport                          | **Weak**      | 35 test files internally, but nothing for consumers. No `createMockTransport()`                                                 |
| Scalable beyond one server | `PublishBackend` interface with Redis/Postgres examples               | **Moderate**  | Interface exists, examples in JSDoc comments, but no ready-made backend packages and no standalone guide outside TanStack Start |
| Progressive disclosure     | The "spectrum" from queryFn → CRDT fields                             | **Excellent** | Best-in-class. Each capability is one config property.                                                                          |
| Transport-agnostic         | WebSocket, SSE, Centrifugo — swap one line                            | **Excellent** |                                                                                                                                 |
| CRDT conflict resolution   | `fields` config with 3 CRDT types + `'local'`                         | **Excellent** |                                                                                                                                 |
| Multi-tab coordination     | `createCoordinatedTransport` with auto-detection                      | **Excellent** | SharedWorker → BroadcastChannel → Direct fallback. Zero config.                                                                 |

---

## Part 4 — Gap Analysis

### 4.1 Feature Gaps

#### Gap F1: No Rich Text / Document CRDT

**Impact: High** | **User expectation: Conflict-free text editing (Google Docs-level)**

The current CRDTs (LWW, PN-Counter, OR-Set) handle field-level conflicts beautifully. But for the most common "WOW" use case — two people editing the same paragraph — you need character-level or block-level CRDTs. Libraries like Y.js and Automerge solve this.

**Recommendation:** Don't reimplement Y.js. Instead, provide a documented integration pattern: "Here's how to use Y.js for rich text and TanStack Realtime for the transport layer." A `withYjs(transport)` adapter or a guide showing `y-websocket` provider backed by TanStack Realtime's transport would be high value.

#### Gap F2: No Message History / Pagination

**Impact: Medium-High** | **User expectation: Scroll up in chat and see older messages**

`liveChannelOptions` is append-only with `initialData` for seeding, but there's no pagination, cursor-based loading, or "load more" pattern. Chat and activity feeds are incomplete without this.

**Recommendation:** Add a `fetchMore` / `loadPrevious` option to `liveChannelOptions` that accepts a cursor-based loader function. This pairs naturally with TanStack Query's infinite query pattern.

#### Gap F3: No Read Receipts or Delivery Confirmation

**Impact: Medium** | **User expectation: "Delivered" / "Read" indicators in chat**

The `publish:ack` mechanism exists in the wire protocol but is only used for server-authoritative validation responses. There's no user-facing delivery confirmation or read receipt primitive.

**Recommendation:** This is likely too app-specific to build as a generic primitive, but a documented pattern (using presence or ephemeral channels for read cursors) would close the guidance gap.

#### Gap F4: No Undo/Redo Across Collaborators

**Impact: Medium** | **User expectation: "I can undo MY change without undoing yours"**

CRDTs converge state, but there's no operation log or undo stack that preserves authorship. This is genuinely hard (operational transform territory), but it's table stakes for serious collaborative apps.

**Recommendation:** Document the limitation explicitly. For field-level CRDTs, undo could be approximated by storing previous CRDT states per-field per-client. For rich text, defer to Y.js's built-in undo manager.

#### Gap F5: No Reactions / Ephemeral Broadcast Primitive

**Impact: Low-Medium** | **User expectation: Emoji reactions that pop up in real time**

`ephemeralLiveOptions` could serve this purpose (TTL-based events), but there's no example or documented pattern. A "confetti on celebration" or "emoji reaction" use case would make ephemeral features more discoverable.

#### Gap F6: No Webhooks / Server Event Hooks

**Impact: Medium** | **Developer expectation: "Notify my backend when a channel has zero subscribers"**

There's no lifecycle hook for server-side events like "last subscriber left channel", "client disconnected", or "channel became empty." These are critical for cleanup, analytics, and server-side state management.

**Recommendation:** Add optional lifecycle callbacks to `createNodeServer` and the SSE handler: `onChannelEmpty`, `onClientDisconnect`, `onFirstSubscriber`.

#### Gap F7: No DevTools Panel

**Impact: Medium-High** | **Developer expectation set by TanStack Query DevTools**

TanStack Query's DevTools panel (live query states, cache contents, error simulation) set a precedent that developers now expect. There is no equivalent for realtime: no way to inspect active subscriptions, message throughput, presence membership, connection state, or CRDT merge history during development without `console.log`. The CKEditor State of Collaborative Editing 2025 survey found that debugging realtime collaborative features is a top developer pain point.

**Recommendation:** Build a `@tanstack/realtime-devtools` panel showing:

- Active subscriptions and their channels
- Message log (recent incoming/outgoing with timestamps)
- Connection state timeline (connected/reconnecting/disconnected transitions)
- Presence membership per channel
- Offline queue contents and flush status
- CRDT field states and merge history

---

### 4.2 Ergonomic Gaps

#### Gap E1: No Runnable Example Applications

**Impact: Very High**

Zero example apps exist. Every code example lives inside documentation page source (as string literals in `<CodeBlock>` components) or test files. This is the single biggest onboarding gap.

Developers expect to: `git clone → cd examples/chat → npm install → npm run dev → see it working`

**Recommendation:** Create at minimum:

1. `examples/chat` — liveChannelOptions + presence + typing indicators
2. `examples/collaborative-todos` — realtimeCollectionOptions + withRest + CRDTs
3. `examples/ai-streaming` — createStreamChannel + useStream
4. `examples/live-cursors` — usePresence with canvas

Each should be a standalone runnable app with a README.

#### Gap E2: No Exported Test Utilities

**Impact: High**

There's no `createMockTransport()`, `createTestClient()`, or pattern for testing realtime hooks in consumer applications. The internal test suite uses ad-hoc mock patterns (`{ connect, disconnect, subscribe, publish, store }` objects) that aren't exported.

**Recommendation:** Export a `@tanstack/realtime/testing` entry point with:

- `createMockTransport()` — controllable fake transport
- `createMockPresenceTransport()` — with presence support
- `emitMessage(transport, channel, data)` — simulate incoming messages
- `TestRealtimeProvider` — React wrapper that auto-connects

#### Gap E3: `RealtimeProvider` Doesn't Auto-Connect

**Impact: Medium-High**

The provider puts the client in context and calls `destroy()` on unmount, but does **not** call `connect()`. This is intentional (auth-gating), but it's a DX footgun — nothing in the API hints at this requirement. New developers will render the provider and wonder why nothing works.

**Recommendation:** Either:

- Add an `autoConnect` prop (default `true`) to `RealtimeProvider`
- Or add a prominent console warning when hooks are used but client status is `'disconnected'` for more than 2 seconds

#### Gap E4: Inconsistent `authorize` Function Signatures

**Impact: Medium**

The authorize function shape differs across server presets:

- `createNodeServer`: `authorize(userId, parsedChannel) → ChannelPermissions` (granular: `{ subscribe, publish, presence }`)
- `createSseHandler`: `authorize({ userId, action, channel }) → boolean` (per-action)
- `createStartHandler`: inherits SSE handler shape

A developer switching from Node to Start (or running both) must learn two different auth APIs.

**Recommendation:** Unify around the more expressive `ChannelPermissions` return shape. Both the SSE and Start handlers should accept the same `authorize` signature as the Node server.

#### Gap E5: Silent Subscription Authorization Failures

**Impact: Medium-High**

When `subscribe:error` arrives (authorization denied), `wsTransport` logs a `console.warn` and does nothing else. The collection never knows its subscription was rejected. There's no error state in `useRealtimeCollection` or `useSubscribe`.

This means: a developer deploys with a `authorize` function that accidentally rejects a channel, and the UI shows zero data with no error. Debugging this requires checking the browser console.

**Recommendation:** Add an `onSubscribeError(channel, reason)` callback to:

- The transport (for raw subscribers)
- `realtimeCollectionOptions` (for collections)
- Surface as an `error` state in hooks

#### Gap E6: No SSE Transport Decision Guide

**Impact: Medium**

The docs show three transports (WebSocket, SSE, Centrifugo) but never explain **when to choose which**. A developer's first question is: "Which transport should I use?"

**Recommendation:** Add a decision matrix to the Transports doc page:

| Criterion                | WebSocket           | SSE                    | Centrifugo                      |
| ------------------------ | ------------------- | ---------------------- | ------------------------------- |
| Bidirectional            | Yes                 | No (publish via POST)  | Yes                             |
| Presence                 | Yes                 | No                     | Yes                             |
| Corporate proxy-friendly | Sometimes blocked   | Always works           | Sometimes blocked               |
| Multi-process scaling    | Need PublishBackend | Need PublishBackend    | Built-in (Centrifugo cluster)   |
| Infrastructure required  | Node.js server      | Any HTTP server        | Centrifugo binary               |
| Best for                 | Full-featured apps  | Simple live data + SSR | High-scale, existing Centrifugo |

---

### 4.3 Documentation Gaps

#### Gap D1: No Authentication Guide

**Impact: High**

Auth is the first thing every developer needs after "hello world." There's no guide covering:

- How `getUser(req)` is called and what happens when it returns null
- Token refresh during long WebSocket sessions (spoiler: not supported — you must reconnect)
- Centrifugo's subscription token flow
- SSE Bearer token patterns with real middleware examples
- What happens when auth expires mid-session

#### Gap D2: No Horizontal Scaling Guide (Standalone)

**Impact: High**

The `PublishBackend` interface and Redis/Postgres examples live exclusively in `createStartHandler`'s JSDoc. A developer using Express, Hono, or Fastify with `createNodeServer` has no documented path to multi-process deployment.

**Recommendation:** Create a standalone "Scaling to Production" doc page covering:

1. Why single-process breaks at scale
2. The `PublishBackend` interface
3. Redis PUBLISH/SUBSCRIBE implementation
4. Postgres LISTEN/NOTIFY implementation
5. Cloudflare Durable Objects approach
6. How to pair with `createNodeServer` (not just TanStack Start)

#### Gap D3: No Error Reference

**Impact: Medium**

Error handling patterns are scattered across JSDoc and individual doc pages. There's no consolidated page listing:

- All error types (`ConflictError`, subscribe errors, publish errors, queue flush errors, gap errors)
- What triggers each error
- How to handle each one
- What the user sees if you don't handle them

#### Gap D4: No Centrifugo Walkthrough

**Impact: Medium**

Centrifugo is a powerful option (built-in clustering, gap recovery, proven at scale), but the docs show only 2 lines of client config. No guide covers: installing Centrifugo, configuring namespaces, generating tokens, setting up presence, or leveraging server-side gap recovery.

#### Gap D5: No API Reference

**Impact: Medium**

Nine doc pages with narrative content, but no auto-generated API reference (TypeDoc or similar). Developers who want to know every option for `realtimeCollectionOptions` must read TypeScript source.

The JSDoc quality is exceptionally high — the API reference practically writes itself. Just need to run a generator.

#### Gap D6: Missing Features on the Documentation Website

**Impact: Medium**

Several implemented features are not documented on the website:

- `ephemeralLiveOptions` (typing indicators, reactions)
- `tickCollectionOptions` (game state)
- `staleAfter` / `'stale'` status in `useStream`
- `useLiveChannel` hook (separate from `liveChannelOptions`)
- Wire protocol (needed for custom transport authors)
- `createValidatedPublish` (stateless server validation)

#### Gap D7: No Migration / Changelog

**Impact: Low-Medium** (but increases as adoption grows)

No `CHANGELOG.md` exists. `NEW_FEATURES.md` is the closest thing but reads as an internal design doc, not a user-facing changelog.

#### Gap D8: SharedWorker Build Tooling Guidance Missing

**Impact: Medium**

Multi-tab coordination via SharedWorker requires a separate worker file. The docs mention this but don't explain the bundler-specific setup (Vite worker entrypoint, Webpack loader, etc.). For most developers, this will be the blocking question.

---

### 4.4 Framework Coverage Gap

#### Gap FW1: React-Only

**Impact: High for ecosystem reach**

The core is beautifully framework-agnostic — it's pure functions and `@tanstack/store` observables. But only React bindings exist. There are no adapters for:

- Vue (composables: `usePresence`, `useSubscribe`, etc.)
- Solid (signals-based)
- Svelte (store-based)
- Angular (service + observable)

This is the single biggest gap relative to TanStack's brand promise of framework-agnostic libraries (TanStack Query, Router, Table all support multiple frameworks).

**Recommendation:** At minimum, ship Vue and Solid adapters. The core's store-based architecture makes this straightforward — each framework adapter is ~200 lines wrapping `Store.subscribe` in the framework's reactive primitive.

---

## Part 5 — Prioritized Recommendations

### Tier 1 — Do These First (Highest Impact)

| #   | Gap                                           | Type      | Why                                                                  |
| --- | --------------------------------------------- | --------- | -------------------------------------------------------------------- |
| 1   | **E1: Runnable example apps**                 | Ergonomic | The #1 way developers evaluate a library. No examples = no adoption. |
| 2   | **D1: Authentication guide**                  | Docs      | Auth is the first production blocker after "hello world."            |
| 3   | **E2: Exported test utilities**               | Ergonomic | Can't adopt in a professional codebase without testability.          |
| 4   | **E5: Surface subscription auth errors**      | Ergonomic | Silent failures are the worst DX bug class.                          |
| 5   | **D2: Horizontal scaling guide (standalone)** | Docs      | Developers need confidence it works beyond a prototype.              |

### Tier 2 — Do These Soon (High Impact)

| #   | Gap                                         | Type         | Why                                                                  |
| --- | ------------------------------------------- | ------------ | -------------------------------------------------------------------- |
| 6   | **FW1: Vue + Solid adapters**               | Feature      | TanStack brand promise. Doubles addressable developer market.        |
| 7   | **E3: Auto-connect or warning in Provider** | Ergonomic    | Every new user will hit this footgun.                                |
| 8   | **D6: Document missing website features**   | Docs         | `ephemeralLiveOptions`, `tickCollectionOptions`, etc. are invisible. |
| 9   | **F1: Y.js integration guide**              | Feature/Docs | Rich text collab is the most-asked-about use case.                   |
| 10  | **D3: Consolidated error reference**        | Docs         | Scattered error docs = hours of debugging.                           |

### Tier 3 — Do These When Capacity Allows

| #   | Gap                                             | Type      | Why                                                                                         |
| --- | ----------------------------------------------- | --------- | ------------------------------------------------------------------------------------------- |
| 11  | **F7: DevTools panel**                          | Feature   | TanStack Query set the precedent. Developers expect an inspection panel for realtime state. |
| 12  | **F2: Message history / pagination**            | Feature   | Completes the chat use case.                                                                |
| 13  | **E4: Unify authorize signatures**              | Ergonomic | Reduces cognitive load when switching presets.                                              |
| 14  | **D4: Centrifugo walkthrough**                  | Docs      | Unlocks a powerful scaling path.                                                            |
| 15  | **D5: Auto-generated API reference**            | Docs      | JSDoc is already excellent — just needs a generator.                                        |
| 16  | **F6: Server lifecycle hooks**                  | Feature   | `onChannelEmpty`, `onClientDisconnect` for cleanup.                                         |
| 17  | **D8: SharedWorker bundler guide**              | Docs      | Practical blocker for multi-tab.                                                            |
| 18  | **F5: Reactions / ephemeral broadcast pattern** | Docs      | Make ephemeral features discoverable.                                                       |
| 19  | **D7: CHANGELOG.md**                            | Docs      | Needed before reaching 1.0.                                                                 |

---

## Part 6 — What TanStack Realtime Gets Uniquely Right

Despite the gaps above, it's worth calling out what this project does **exceptionally well** — things that most competitors get wrong:

1. **The progressive spectrum is genuinely novel.** No other realtime library lets you start with a plain `queryFn` and incrementally add realtime, CRDTs, optimistic updates, and offline support — each as a single config property. Liveblocks, Firebase, and Convex all require upfront architectural commitment.

2. **Transport-agnostic with middleware composition.** The `transport → createOfflineQueue → withGapRecovery → createCoordinatedTransport` stacking pattern is elegant. Swap WebSocket for SSE without touching application code. No competitor offers this level of transport abstraction.

3. **CRDTs as declarative field config.** `fields: { votes: 'pn-counter', tags: 'or-set' }` is dramatically simpler than wiring up Automerge or Y.js. For the 80% of use cases that don't need character-level text CRDTs, this is the right abstraction level.

4. **Multi-tab coordination is zero-config.** `createCoordinatedTransport()` auto-detects SharedWorker → BroadcastChannel → Direct fallback. This is a problem most developers don't even know they have until users open two tabs and get double notifications.

5. **The JSDoc quality is production-grade.** Every exported function has doc comments with examples, `@throws`, and decision guidance. The `docsExamples.test.ts` file ensures documentation code examples actually work. This is rare.

6. **TanStack DB integration is the right architectural bet.** Realtime as a sync source into an existing reactive store (TanStack DB) means no state duplication, no cache invalidation headaches, and optimistic rollback handled by the store's transaction system rather than the realtime layer.

7. **Server-initiated streams with checkpointing and HMAC.** `createServerStream` with `push()` / `done()` / `error()`, periodic checkpoint handlers, and signature verification is a production-ready AI streaming primitive. Most realtime libraries treat streaming as an afterthought.

---

## Appendix: Competitive Landscape Snapshot (Early 2026)

| Library                  | Strengths                                                  | Weaknesses                                                         | How TanStack Realtime Compares                                                           |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| **Liveblocks**           | Best-in-class presence, Y.js integration, room-based model | Proprietary SaaS, pricing at scale, vendor lock-in                 | TanStack is BYO-infrastructure, more flexible, but less batteries-included for rich text |
| **Firebase/Firestore**   | Massive ecosystem, offline-first, zero server setup        | Google lock-in, limited query capabilities, no CRDTs               | TanStack offers more flexibility, better TypeScript, no vendor lock-in                   |
| **Supabase Realtime**    | Postgres CDC, Row-Level Security, generous free tier       | Tied to Supabase/Postgres, limited client-side conflict resolution | TanStack can consume Supabase events via `onMessage` adapter while adding CRDTs          |
| **Convex**               | Reactive queries, server functions, excellent DX           | Full platform commitment required, no BYO database                 | TanStack is transport/DB agnostic; Convex is more opinionated but more integrated        |
| **Ably / Pusher**        | Battle-tested infrastructure, global edge                  | Message-bus only (no collections, no CRDTs, no offline queue)      | TanStack offers higher-level abstractions; could use Ably/Pusher as a transport backend  |
| **Socket.IO**            | Ubiquitous, well-understood, automatic fallbacks           | Low-level (no collections, presence, CRDTs), shows its age         | TanStack is a generation ahead in abstraction level                                      |
| **PartyKit/Partyserver** | Server-per-room model, Cloudflare edge, WebSocket-native   | Requires Cloudflare, room-scoped only                              | TanStack is runtime-agnostic; PartyKit is better for room-per-entity architectures       |
| **Y.js / Automerge**     | Character-level CRDTs, rich text, proven correctness       | Low-level, need your own transport, steep learning curve           | Complementary — TanStack could use Y.js for text, own CRDTs for structured data          |
| **ElectricSQL / Zero**   | Local-first with Postgres sync, SQL on the client          | Early stage, Postgres-only, different paradigm                     | Different approach — Electric syncs the DB; TanStack syncs events/mutations              |
