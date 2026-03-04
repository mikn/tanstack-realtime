# TanStack Realtime: Ergonomics, Feature Gaps & Common-Case Review

## Framing

This review approaches TanStack Realtime from three perspectives:

1. **End-user** — A non-technical person who uses apps like Figma, Notion, Slack, Linear daily. What do they expect? What impresses them?
2. **Developer** — Someone evaluating this library to build those features. How quickly can they get productive? Where do they get stuck?
3. **The common case** — The 80% path. Not the edge cases — the first 30 minutes, the first feature, the first production deploy.

---

## Part 1 — The End-User Mental Model

### What "realtime" means to a normal person

A non-technical user has no concept of WebSockets, CRDTs, or transport layers. Their mental model was permanently recalibrated by a handful of products:

- **Google Docs** (2010s): "Two people can edit the same thing and it just works"
- **Figma** (mid-2010s): "I can literally see where other people's cursors are"
- **Slack/Discord**: "Messages appear instantly. I see when someone is typing"
- **Linear/Notion**: "Everything updates without refreshing. Ever."
- **ChatGPT** (2023+): "The AI's response streams in word by word"

The result: **instant is the baseline. Anything less feels broken.** Users don't reward you for realtime — they punish you for the absence of it.

### Table Stakes (users get annoyed if missing)

| What the user thinks                         | Feature              | Reference apps              |
| -------------------------------------------- | -------------------- | --------------------------- |
| "I shouldn't have to refresh to see changes" | Live data updates    | Google Docs, Notion, Linear |
| "When I click Save, it should feel instant"  | Optimistic UI        | Gmail, every modern SaaS    |
| "I can see who's online / looking at this"   | Presence             | Figma, Notion, Slack        |
| "I see when someone is typing"               | Typing indicators    | iMessage, WhatsApp, Slack   |
| "If I lose wifi, my edits don't vanish"      | Offline resilience   | Notion, Linear, iMessage    |
| "If my connection drops, it recovers itself" | Auto-reconnection    | Every chat app, Figma       |
| "Unread counts update in real time"          | Live counters/badges | Reddit, X, YouTube          |
| "Messages appear instantly, in order"        | Chat / messaging     | Every messaging app         |

### WOW features (users remember and talk about these)

| What the user thinks                                    | Feature                            | Reference apps                 |
| ------------------------------------------------------- | ---------------------------------- | ------------------------------ |
| "I can see where others are working, live"              | Multiplayer cursors                | Figma, Google Docs, Miro       |
| "Two people edited at the same time and nothing broke"  | Conflict-free editing              | Google Docs, Notion, Figma     |
| "The AI response types out word by word"                | AI streaming                       | ChatGPT, Cursor, Notion AI     |
| "We both edited the Kanban board at once and it worked" | Live structured data collaboration | Notion databases, Airtable     |
| "I reacted with an emoji and everyone saw it pop"       | Instant reactions                  | Slack, Discord, Zoom           |
| "The dashboard updates at 60fps, no jank"               | Smooth high-frequency updates      | Trading platforms, live sports |
| "I can undo MY change without undoing yours"            | Collaborative undo                 | Google Docs, Figma             |

---

## Part 2 — The Developer Mental Model

### What developers expect from a realtime library in 2026

Developers have been burned by realtime complexity. The competitive bar is set by Supabase Realtime, Firebase, Liveblocks, Convex, Ably, Socket.IO, and emerging local-first libraries (Y.js, Automerge, ElectricSQL).

### Table stakes for developers

| Expectation                      | What "good" looks like                                      | Anti-pattern                                         |
| -------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| < 50 lines to first live feature | `npm install` -> provider -> hook -> live                   | "Deploy Redis and configure 4 YAML files first"      |
| Works with my existing stack     | BYO database, server, auth                                  | "Migrate your entire backend to our service"         |
| TypeScript-first                 | Generics on channels, messages, presence. IDE autocomplete. | `data: any` everywhere                               |
| Framework hooks                  | `usePresence()`, `useSubscribe()`                           | "Here's a WebSocket, call addEventListener yourself" |
| Auto-reconnection                | Library handles it. I never write retry logic.              | "Implement your own reconnection strategy"           |
| Optimistic updates               | Declare mutation, get instant UI                            | "Manage your own optimistic cache"                   |
| Connection status                | `status === 'connected' \| 'reconnecting'` for UI           | No visibility into connection state                  |
| Auth integration                 | Token-based auth, per-channel authorization                 | "Auth? That's your problem"                          |
| Testing story                    | Mock transports, deterministic tests                        | "Good luck testing WebSocket code"                   |
| Scales beyond one server         | Clear path from prototype to production                     | "Works in development, falls apart at scale"         |

### WOW features for developers

| Feature                       | Why developers love it                                                 |
| ----------------------------- | ---------------------------------------------------------------------- |
| Progressive disclosure        | Start simple, add complexity one config prop at a time                 |
| Transport-agnostic            | Swap WebSocket for SSE without touching app code                       |
| Automatic conflict resolution | `fields: { votes: 'pn-counter' }` and never think about merges         |
| Multiplayer as hooks          | `usePresence()` returning typed `others[]` — 3 lines instead of 200    |
| Offline queue                 | One line: `createOfflineQueue({ storage: createIndexedDBStorage() })`  |
| Multi-tab coordination        | Zero-config: library deduplicates connections automatically            |
| Declarative CRDTs             | Mix per field: `title: 'lww'`, `votes: 'pn-counter'`, `tags: 'or-set'` |

---

## Part 3 — How Well TanStack Realtime Solves These Today

### 3.1 The progressive spectrum: genuinely novel

This is the crown jewel. No other library lets you do this:

| Step | What you add               | What you get                          |
| ---- | -------------------------- | ------------------------------------- |
| 0    | `getKey` + `queryFn`       | Server-only data (no realtime at all) |
| 1    | `+ channel`                | Peer sync via pub/sub                 |
| 2    | `+ onInsert/Update/Delete` | Server persistence                    |
| 3    | `+ fields`                 | CRDT conflict resolution              |
| 4    | `+ serverAuthoritative`    | Server-only publishing                |
| 5    | `+ refetchOnReconnect`     | Gap recovery                          |

Each step is literally adding one config key. The mental model doesn't change — same collection, same hooks. Liveblocks, Firebase, and Convex all require upfront architectural commitment. TanStack Realtime is the only library where realtime is an incremental capability you layer on.

### 3.2 Scorecard: end-user features

| Feature                   | Support                               | Score         | Notes                                                   |
| ------------------------- | ------------------------------------- | ------------- | ------------------------------------------------------- |
| Live data updates         | `realtimeCollectionOptions` + channel | **Excellent** | The progressive spectrum is best-in-class               |
| Optimistic UI             | `optimistic: true` + echo suppression | **Excellent** | Nonce-based dedup, `ConflictError<T>` for rollback      |
| Presence                  | `usePresence()` with typed channels   | **Excellent** | Join/leave/update lifecycle is clean                    |
| Typing indicators         | `ephemeralLiveOptions` with TTL       | **Good**      | Works, but was undiscoverable before doc page was added |
| Offline resilience        | `createOfflineQueue` + IndexedDB      | **Excellent** | Reactive `queueStore` for pending badges                |
| Reconnection              | Exponential backoff + gap recovery    | **Excellent** | Two complementary strategies                            |
| Live counters             | `useSyncedCounter` (PN-Counter)       | **Excellent** | Concurrent increments always converge                   |
| Chat / messaging          | `liveChannelOptions` + presence       | **Good**      | Missing: history/pagination, threads                    |
| Multiplayer cursors       | `usePresence` + cursor in data        | **Excellent** | Clean pattern, well-documented                          |
| Conflict-free editing     | `fields: { title: 'lww' }`            | **Good**      | Field-level only. No char-level rich text CRDT          |
| AI streaming              | `useStream` + `createServerStream`    | **Excellent** | Full lifecycle, HMAC signing, checkpoints               |
| High-frequency updates    | `tickTransport` at 60Hz               | **Good**      | Works, now has doc page                                 |
| Instant reactions         | Via ephemeral channels                | **Good**      | Now has recipes in Ephemeral doc page                   |
| Undo across collaborators | None                                  | **Gap**       | Documented limitation, Y.js UndoManager referenced      |

### 3.3 Scorecard: developer ergonomics

| Expectation               | Support                        | Score         | Notes                                                                     |
| ------------------------- | ------------------------------ | ------------- | ------------------------------------------------------------------------- |
| Quick start (< 50 lines)  | ~60-80 lines for full setup    | **Good**      | Progressive spectrum helps, but initial boilerplate is real (see below)   |
| Works with existing stack | BYO everything                 | **Excellent** | Transport-agnostic, `withRest`, `withServerFns`                           |
| TypeScript-first          | Generics everywhere            | **Excellent** | One of the strongest typed realtime APIs                                  |
| Framework hooks           | 14 React hooks                 | **Good**      | React-only. No Vue/Solid/Svelte                                           |
| Auto-reconnection         | All transports have backoff    | **Excellent** |                                                                           |
| Optimistic updates        | `optimistic: true`             | **Excellent** | Echo suppression, auto-rollback                                           |
| Connection status         | `Store<ConnectionStatus>`      | **Excellent** |                                                                           |
| Auth integration          | `getUser` + `authorize`        | **Good**      | Auth guide now exists. Token refresh mid-session still unsupported for WS |
| Testing story             | `createMockTransport` exported | **Good**      | Mock transports exist; `TestRealtimeProvider` for React still missing     |
| Scales beyond one server  | `PublishBackend` interface     | **Good**      | Scaling guide now exists with Redis/Postgres/DO examples                  |
| Progressive disclosure    | The spectrum                   | **Excellent** | Best-in-class                                                             |
| Transport-agnostic        | SSE/WS/Centrifugo swap         | **Excellent** |                                                                           |
| Multi-tab coordination    | Zero-config auto-detection     | **Excellent** |                                                                           |

---

## Part 4 — The Common Case Under a Microscope

This is where the review gets opinionated. The features above score well in isolation, but the **common case** — the path a developer actually walks — reveals friction that scorecards miss.

### 4.1 The "Hello World" is heavier than it needs to feel

The Getting Started guide requires understanding **7 concepts** before anything renders:

1. Transport selection (SSE vs WebSocket vs Centrifugo)
2. Server authorization handler (`createStartHandler` with `getUser` + `authorize`)
3. `createRealtimeClient` construction
4. `<RealtimeProvider>` wrapper
5. **Manual `client.connect()` call** — this is a footgun (see 4.2)
6. `realtimeCollectionOptions` configuration (with `withRest` helper)
7. `useCollection` hook for rendering

Compare this to the **conceptual minimum** a developer expects:

```
install → wrap app → use hook → see live data
```

That's 3 concepts (provider, hook, done). TanStack Realtime requires 7 because it front-loads server setup, transport selection, and explicit connection management.

**This isn't wrong** — it's the cost of being infrastructure-agnostic. But the Getting Started page should acknowledge this cost and provide a "just make it work" fast path before explaining why each piece exists.

**Recommendation:** Consider a `createQuickStart({ url })` or preset that bundles the 7 steps into 3, with escape hatches for each config dimension. The `realtime-preset-start` package is heading in this direction but isn't positioned as "the easy path" in docs — it's positioned as "the TanStack Start path."

### 4.2 The `connect()` footgun

`RealtimeProvider` does **not** auto-connect. The developer must call `realtimeClient.connect()` separately in their app entry file. The Getting Started guide documents this:

> "RealtimeProvider does not call client.connect() automatically. Call it once during app initialization."

This is a genuine footgun. A developer will:

1. Install packages
2. Create client, wrap provider, add hook
3. See nothing working
4. Spend 10 minutes wondering why
5. Eventually find the note about `connect()`

The `TODO.md` lists this as Project 7 (`autoConnect` prop, default `true`). It's marked incomplete. **This should be Tier 0 priority** — it's the single most common first-time failure mode.

**Recommendation:** Ship `autoConnect={true}` as the `RealtimeProvider` default. Developers who need auth-gating before connection can pass `autoConnect={false}`. The current default optimizes for the uncommon case at the expense of every new user.

### 4.3 No runnable examples

This remains the single biggest adoption blocker. The `examples/` directory does not exist. The E2E test app (`packages/e2e/app/`) is the closest thing to a runnable reference, but it's:

- Not discoverable (buried in test infrastructure)
- Uses Centrifugo transport (requires running a Centrifugo binary)
- Built for test verification, not for learning

A developer evaluating this library cannot do: `git clone → cd examples/chat → npm install → npm run dev → see it working`

The TODO.md lists 5 planned examples (todos, chat, AI streaming, cursors, offline-first). None exist yet. **This is the #1 gap.**

### 4.4 The `withRest` / `withServerFns` split creates decision paralysis

The Getting Started guide uses `withRest` for REST APIs and mentions `withServerFns` for TanStack Start server functions. But a new developer doesn't know which to pick, and the two helpers have subtly different APIs.

More importantly, a developer using Next.js, Remix, Hono, or Express has to figure out which helper applies to them. The answer is `withRest` for all of those — but they have to read both APIs to discover that.

**Recommendation:** Position `withRest` as the universal default in Getting Started. Mention `withServerFns` only in the TanStack Start guide. Don't make developers choose on the first page.

### 4.5 The server setup asks too much too early

The Getting Started page opens with server configuration:

```typescript
const realtime = createStartHandler({
  getUser: async (req) => {
    const session = await getSession(req)
    return session ? { userId: session.userId } : null
  },
  authorize: async (userId) => ({
    subscribe: !!userId,
    publish: !!userId,
    presence: true,
  }),
})
```

Before a developer has seen anything working, they must implement:

- User session extraction
- Authorization logic
- Route handler mounting

This is correct for production, but wrong for evaluation. A developer evaluating a realtime library wants to see **live data in 5 minutes**, not design their auth model.

**Recommendation:** Show the zero-auth version first:

```typescript
const realtime = createStartHandler({
  getUser: async () => ({ userId: 'anonymous' }),
  authorize: async () => true,
})
```

Then progressively add real auth. This matches the library's own progressive philosophy — start with the simplest thing that works, add complexity when needed.

### 4.6 Collection options config is verbose for the common case

A basic realtime collection requires:

```typescript
const todosOptions = realtimeCollectionOptions({
  ...withRest<Todo>({ url: '/api/todos', getKey: (t) => t.id }),
  client: realtimeClient,
  channel: ['todos'],
})
```

This is ~5 lines for the simplest case. The spread-with-helper pattern (`...withRest<Todo>(...)`) is unusual — most React developers haven't seen config composition via spread. It works, but it's a "wait, what?" moment.

Compare to what TanStack Query looks like:

```typescript
const { data } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
```

One line, inline, self-contained. The realtime equivalent requires:

1. A separate module-level config
2. Spreading a helper
3. Passing the client explicitly
4. Defining the channel separately

**This is inherently more complex** (realtime IS more complex than fetch), but the API doesn't minimize the distance between "I want live data" and "I have live data."

**Recommendation:** Consider a `useRealtimeQuery`-style hook that mirrors TanStack Query's inline ergonomics for the 80% case:

```typescript
const todos = useRealtimeQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  channel: ['todos'],
})
```

The full `realtimeCollectionOptions` API stays for advanced cases (CRDTs, server fns, etc.), but the common case should feel as familiar as TanStack Query.

### 4.7 Channel key serialization is clever but undiscoverable

Channels use a QueryKey pattern: `['todos', { projectId: '123' }]` which serializes to `todos:projectId=123`. This is great for type safety and familiarity with TanStack Query.

But the serialization format matters for the server side. When a server receives a subscription for `todos:projectId=123`, it needs to parse that. The `parseChannel` utility exists and is documented in the Wire Protocol page, but the Getting Started guide doesn't mention this bidirectional contract.

A developer will hit this the moment they try to do per-channel authorization on the server: "Wait, what string format does my `authorize` function receive?"

**Recommendation:** Show the server-side `parseChannel` usage in the Getting Started guide, immediately after showing the client-side channel definition.

---

## Part 5 — Documentation & Information Architecture Review

### 5.1 What's there (22 pages, well-structured)

The sidebar organizes into 5 logical sections:

- **Overview** (2): Getting Started, Collections
- **Guides** (6): TanStack Start + Drizzle, Authentication, Rich Text, Centrifugo, Read Receipts, Testing
- **Features** (6): CRDTs, Presence, Channels, Streaming, Ephemeral, Tick-Based
- **Infrastructure** (4): Transports, Resilience, Scaling, Server Hooks
- **Reference** (4): React Hooks, API Reference, Error Reference, Wire Protocol

This is good information architecture. The progression from "getting started" → "features" → "infrastructure" → "reference" matches how developers learn.

### 5.2 What's missing or weak

**No "Quick Examples" page.** The Getting Started goes deep into one pattern (collections with REST). A developer who wants presence, or streaming, or chat has to navigate to the right feature page and piece together the setup. A single "Quick Examples" page showing the 5-line version of each pattern would dramatically improve discoverability.

**No "When to use what" decision tree.** The library offers: `realtimeCollectionOptions`, `liveChannelOptions`, `ephemeralLiveOptions`, `streamChannelOptions`, `tickCollectionOptions`, `presenceChannelOptions`, plus raw `useSubscribe`/`usePublish`. That's 7 different patterns. A developer needs a decision tree:

- Want a synchronized list of records? → `realtimeCollectionOptions`
- Want an append-only event stream (chat)? → `liveChannelOptions`
- Want to know who's online? → `presenceChannelOptions` or `usePresence`
- Want typing indicators / ephemeral state? → `ephemeralLiveOptions`
- Want AI streaming / progress? → `streamChannelOptions` + `useStream`
- Want 60fps game state? → `tickCollectionOptions`
- Want raw pub/sub? → `useSubscribe` + `usePublish`

This decision tree doesn't exist on any page. It should be on the Getting Started page or a dedicated "Patterns" overview.

**The `useCollectionSync` vs `useRealtimeCollection` distinction is unclear.** The E2E app uses `useCollectionSync` (which returns a simple array). The docs primarily show `useRealtimeCollection` (which returns a `Collection` for `useLiveQuery`). These serve different needs but the distinction isn't explained anywhere.

**Search is missing.** 22 pages with no search functionality. A developer looking for "how to handle offline" has to scan the sidebar and guess between "Resilience", "Infrastructure", or "Features." DocSearch or Fuse.js would fix this.

### 5.3 JSDoc quality is exceptional

Every exported function has comprehensive JSDoc with:

- Description of purpose and behavior
- `@param` with types and explanations
- `@returns` with shape descriptions
- `@example` blocks with working code
- `@throws` where applicable
- Decision guidance ("use this when...")

This is better JSDoc than most production libraries. The `docsExamples.test.ts` file ensures doc examples compile. This is rare and commendable.

---

## Part 6 — Feature Gaps That Matter Most for the Common Case

Ranked by impact on the first-time developer experience:

### Gap 1: No runnable examples (Critical)

Already covered. This is the #1 blocker. The planned examples (todos, chat, AI streaming, cursors, offline-first) would transform the evaluation experience.

### Gap 2: `RealtimeProvider` doesn't auto-connect (High)

Already covered. Every new developer will hit this. Ship `autoConnect={true}` as default.

### Gap 3: No `TestRealtimeProvider` for React (High)

`createMockTransport` and `createMockPresenceTransport` are now exported — good. But React developers need a `TestRealtimeProvider` that:

- Creates a mock transport internally
- Auto-connects
- Exposes `simulateMessage`, `simulateDisconnect` etc. on the returned wrapper

Without this, every test file needs 10 lines of boilerplate to set up the provider + mock transport + connect call. That's friction that compounds across a codebase.

### Gap 4: No message history / pagination (Medium-High)

`liveChannelOptions` is append-only with `initialData` seeding. There's no "load more" / cursor-based pagination. This means chat and activity feeds are incomplete — users can see live messages but can't scroll up to see history.

This isn't a niche feature; it's table stakes for the #2 most common realtime use case (after "live data updates").

### Gap 5: No DevTools panel (Medium-High)

TanStack Query DevTools set a precedent. When realtime things go wrong (and they will — auth denials, missed messages, stale CRDT state), developers have no inspection tool. They're back to `console.log`.

The CKEditor State of Collaborative Editing 2025 survey found that debugging realtime features is developers' top pain point. A DevTools panel showing active subscriptions, message log, connection timeline, presence state, and CRDT merge history would be high-value.

### Gap 6: React-only (Medium)

The core is beautifully framework-agnostic (pure functions + `@tanstack/store`). But only React bindings exist. For a library in the TanStack family — where Query, Router, and Table all support multiple frameworks — this is a brand promise gap.

Vue and Solid adapters would each be ~200 lines wrapping `Store.subscribe` in the framework's reactive primitive. The core architecture makes this straightforward.

### Gap 7: No rich text / document CRDT (Medium)

The field-level CRDTs (LWW, PN-Counter, OR-Set) are excellent for structured data. But the most asked-about "WOW" use case — two people editing the same paragraph — requires character-level CRDTs (Y.js, Automerge).

The Rich Text doc page correctly positions Y.js as complementary and provides architectural guidance. The gap is that no working integration exists — just a guide. A `withYjs(transport)` adapter or proof-of-concept would turn "this is possible in theory" into "this works, here's the code."

---

## Part 7 — What TanStack Realtime Gets Uniquely Right

These are genuine competitive advantages that no other library matches:

1. **Progressive spectrum.** Start with a plain `queryFn`, add `channel` for realtime, add `fields` for CRDTs, add `refetchOnReconnect` for recovery. Each step is one config key. No architectural commitment upfront. Nobody else does this.

2. **Transport-agnostic with middleware composition.** `transport → createOfflineQueue → withGapRecovery → createCoordinatedTransport` stacking. Swap SSE for WebSocket for Centrifugo without touching app code. The middleware pattern is elegant and extensible.

3. **CRDTs as declarative field config.** `fields: { votes: 'pn-counter', tags: 'or-set' }` is dramatically simpler than wiring Automerge or Y.js for structured data. For the 80% of cases that aren't rich text, this is the right abstraction.

4. **Multi-tab coordination is zero-config.** `createCoordinatedTransport()` auto-detects SharedWorker → BroadcastChannel → Direct fallback. This solves a problem most developers don't know they have until users open two tabs and get double notifications.

5. **Server-initiated streams with HMAC and checkpointing.** `createServerStream` with `push()`/`done()`/`error()`, checkpoint persistence, and signature verification is a production-ready AI streaming primitive. Most libraries treat streaming as an afterthought.

6. **BYO everything.** No vendor lock-in. Keep your database, your server, your auth, your deploy target. Realtime is a capability layer, not a platform migration.

7. **The JSDoc is production-grade.** Every export documented with examples, tested via `docsExamples.test.ts`. This is better than most production libraries.

---

## Part 8 — Recommendations Summary

### Immediate (common-case ergonomics)

| #   | Action                                                           | Impact                                               | Effort |
| --- | ---------------------------------------------------------------- | ---------------------------------------------------- | ------ |
| 1   | Ship `autoConnect={true}` as RealtimeProvider default            | Eliminates #1 first-time failure                     | Small  |
| 2   | Add "zero-auth" Getting Started fast path before production auth | Reduces time-to-first-render from 30min to 5min      | Small  |
| 3   | Add "which pattern should I use?" decision tree to docs          | Reduces decision paralysis across 7 collection types | Small  |
| 4   | Create at least one runnable example (collaborative todos)       | Transforms evaluation experience                     | Medium |
| 5   | Ship `TestRealtimeProvider` for React                            | Completes testing story                              | Small  |

### Soon (high impact, medium effort)

| #   | Action                                                                 | Impact                                    | Effort |
| --- | ---------------------------------------------------------------------- | ----------------------------------------- | ------ |
| 6   | Add "Quick Examples" doc page (5-line version of each pattern)         | Dramatically improves discoverability     | Small  |
| 7   | Consider `useRealtimeQuery` hook mirroring TanStack Query inline style | Lowers conceptual barrier for common case | Medium |
| 8   | Add search to docs site                                                | 22 pages without search = guessing        | Medium |
| 9   | Ship `liveChannelOptions` pagination / `loadMore`                      | Completes chat use case                   | Medium |
| 10  | Vue + Solid adapters                                                   | TanStack brand promise, doubles market    | Medium |

### Later (important but not blocking)

| #   | Action                                                   | Impact                                           | Effort |
| --- | -------------------------------------------------------- | ------------------------------------------------ | ------ |
| 11  | DevTools panel                                           | Debugging realtime is developers' top pain point | Large  |
| 12  | Y.js transport adapter (proof of concept)                | Turns "possible in theory" into working code     | Medium |
| 13  | Auto-generated API reference from JSDoc                  | JSDoc is excellent, just needs a generator       | Medium |
| 14  | `useCollectionSync` vs `useRealtimeCollection` explainer | Currently undocumented distinction               | Small  |

---

## Conclusion

TanStack Realtime has genuinely best-in-class architecture. The progressive spectrum, transport abstraction, declarative CRDTs, and multi-tab coordination are competitive advantages no other library matches. The TypeScript quality and JSDoc coverage are exceptional.

The gaps are almost entirely in the **on-ramp** — the first 30 minutes. The library optimizes for power and flexibility at the cost of the common case. A developer who powers through the initial setup will find an excellent library. But too many will bounce before they get there because:

1. Nothing works until you call `connect()` manually (and nothing tells you)
2. There's no runnable example to clone and explore
3. The Getting Started asks you to design your auth model before seeing live data
4. 7 collection patterns with no guidance on which to pick

The good news: these are all fixable with documentation and small API additions, not architectural changes. The foundation is sound. The on-ramp needs smoothing.
