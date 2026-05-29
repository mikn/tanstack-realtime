# Rebrand & Freestanding Plan — `realtime.js`

> Working plan to take this from an experimental TanStack-adjacent repo to a
> freestanding, vendor-neutral realtime/sync library.

## Identity

- **Name:** `realtime.js`
- **Hero tagline:** **Bring your own backend.**
- **Subtitle:** _The kitchen sink you actually need for proper realtime — sync,
  presence, CRDTs, and offline — with no platform and no per-seat bill._
- **npm:** `realtime.js` (the literal name is available) ships as a thin
  meta-package re-exporting core + recommended adapters (the "kitchen sink"
  install). The monorepo packages publish under the `@realtimejs/*` scope.
- **Repo:** `mikn/tanstack-realtime` → `mikn/realtime.js`. TanStack DB / Start
  become _supported integrations_, not the project's identity. Drop the
  "not affiliated with TanStack" disclaimer.

### Package rename map

| Current                                 | New                              |
| --------------------------------------- | -------------------------------- |
| `@tanstack/realtime`                    | `@realtimejs/core`               |
| `@tanstack/react-realtime`              | `@realtimejs/react`              |
| `@tanstack/vue-realtime`                | `@realtimejs/vue`                |
| `@tanstack/solid-realtime`              | `@realtimejs/solid`              |
| `@tanstack/*-realtime-devtools`         | `@realtimejs/*-devtools`         |
| `@tanstack/realtime-adapter-sse`        | `@realtimejs/adapter-sse`        |
| `@tanstack/realtime-adapter-centrifugo` | `@realtimejs/adapter-centrifugo` |
| `@tanstack/realtime-preset-start`       | `@realtimejs/preset-start`       |
| _(new, extracted in Phase 2)_           | `@realtimejs/reactive-drizzle`   |
| _(new meta-package)_                    | `realtime.js`                    |

> **Caveat:** verify the `@realtimejs` npm scope is claimable by the publishing
> account before locking — a 404 on `@realtimejs/core` only proves no package
> exists, not that the org/scope is free.

## Guiding principle

The repo already _is_ a vendor-neutral realtime core. The only deep tie-in is
the Drizzle/Postgres reactive-query engine, isolated to **3 files** inside
`preset-start` (`reactive-db.ts`, `compile-predicate.ts`,
`subscription-manager.ts`). Core, transports, CRDT, presence, and all three
framework adapters carry **no** ORM/db dependency. So "freestanding, no deep
tie-in" is mostly packaging + positioning, not a rewrite.

---

## Phase 1 — Make the gate green ✅ (done)

- [x] Fix the 8 committed `pnpm typecheck` errors (WriteDescriptor union
      narrowing in `reactiveLayer.test.ts`; `ReadonlyArray<PresenceUser>`
      mismatches in the React/Vue/Solid primitive tests; async `onInsert` in
      `optimisticMode.test.ts`).
- [x] Wire `pnpm typecheck` into the CI `typecheck` job — it previously only ran
      `pnpm build`, which is why the type errors slipped through.

## Phase 2 — Cut the tie-in (freestanding architecture)

- [ ] Extract `reactive-db.ts` / `compile-predicate.ts` /
      `subscription-manager.ts` from `preset-start` into a new optional package
      **`@realtimejs/reactive-drizzle`** (owns `drizzle-orm` + `pgsql-ast-parser`
      as _its_ deps). `preset-start` keeps the vendor-neutral transport/SSE/
      publish-backend logic and _optionally_ composes the reactive engine.
      Result: installing `realtime.js` pulls in **zero** ORM/db deps.
- [ ] Define a pluggable `ReactiveQueryEngine` seam:
      `capture(query) → { table, predicate, channel }` and
      `matchWrites(writes) → channels`. Make the Drizzle/PG implementation the
      first adapter behind it, leaving room for Kysely / Prisma / raw SQL /
      MySQL / SQLite without touching core.
- [ ] **Fix the multi-table footgun:** `reactive-loader.ts` only uses
      `ctx.reads[0]`. Either register a predicate per captured table, or
      **throw/warn** when >1 table is captured, pointing at the
      `channels`/`matches` escape hatch. (Silent under-invalidation is the worst
      failure mode and undermines the "proper realtime" claim.)
- [ ] Document the AND-equality-only channel derivation and table-level
      fallback as explicit, tested contracts.

## Phase 3 — Mechanical rename (scriptable — DO NOT start before Phases 1–2 land)

- [ ] Codemod script in `scripts/` (reviewable, reproducible) that rewrites the
      ~241 `@tanstack/*` references across `package.json` names/deps, source
      imports, `tsconfig.check.json` paths, `vitest.workspace.ts`, `knip.json`,
      `nx.json`, and docs.
- [ ] Rename package directories to match (`react-realtime` → `react`, etc.).
- [ ] Update `workspace:*` refs, changesets config, size-limit entries.
- [ ] Re-run lint + typecheck + tests (935-test suite is the safety net).

## Phase 4 — Prove it: examples + docs

- [ ] Ship the 3 missing runnable examples (TODO Project 1, currently 0): collaborative-todos (collections + CRDT), chat + presence + typing, ai-streaming. Add a CI job that builds/typechecks them.
- [ ] One example must use **no ORM** (raw SQL + manual `channels`/`invalidate`)
      to concretely demonstrate the no-tie-in claim.
- [ ] Rebrand docs site: name, tagline, hero. Re-frame "Why" around
      "sync without a platform / keep your stack / keep your bill". Add an honest
      "what needs Drizzle+Postgres today vs. what doesn't" matrix.

## Phase 5 — Release engineering

- [ ] Reset to `0.1.0`; configure changesets to publish `@realtimejs/*` + the
      `realtime.js` meta-package together.
- [ ] LICENSE/author lines, badges, OpenGraph, repo description, provenance /
      `publishConfig` for the scope.

## Sequencing

Phase 1 → 2 (get it correct and green under the old name) → 3 (rename in one
shot) → 4–5. Renaming before the gate is green just doubles the noise.
