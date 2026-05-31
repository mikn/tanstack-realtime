# Rebrand & Freestanding Plan — `realtime.js`

> Working plan to take this from an experimental TanStack-adjacent repo to a
> freestanding, vendor-neutral realtime/sync library.

## Status: COMPLETE ✅

All phases delivered via the TPM + 3-agent relay (implementation → adversarial
review → fixer), each committed green and pushed to
`claude/experimental-repo-review-Zm5BV`:

| Phase                           | Commit(s)            | Result                                                                   |
| ------------------------------- | -------------------- | ------------------------------------------------------------------------ |
| Phase 1 — green gate            | `71117b3`            | Fixed 8 typecheck errors; CI now runs `pnpm typecheck`                   |
| WP-A — extract reactive engine  | `ddb6527`            | `@realtimejs/reactive-drizzle`; preset/core ORM-dep-free                 |
| WP-B — pluggable seam           | `7f8d274`            | `ReactiveQueryEngine` interface; single-source `REALTIME_BATCH_CHANNEL`  |
| WP-C — multi-table invalidation | `78d63fb`            | Silent under-invalidation closed end-to-end                              |
| WP-D — rename + meta            | `dfd6cce`, `4e74ab9` | `@realtimejs/*` + `realtime.js`; codemod over-match reverted             |
| WP-E — examples                 | `8fa2b37`, `fc4585f` | 3 runnable examples; CRDT/presence defects fixed + verified              |
| WP-F — docs rebrand             | `a1de831`, `817ebb1` | "Bring your own backend"; honest capability matrix                       |
| WP-G — release prep             | `381cf2c`, `203b60a` | `0.1.0`, publishConfig, metadata; core `/server` build + repo URLs fixed |

Final gate state: lint 0 errors, typecheck 0, **945 tests pass**, build 16
projects, size within limits, knip clean, docs build OK, `changeset status` clean.

### Deferred follow-ups (logged, not blocking 0.1.0)

- Distinct reactive queries that derive the SAME channel key collide in the 1:1
  `channelIndex` / server registry (pre-existing; candidate fix `Map<channel, Set<cacheKey>>`).
- Per-package READMEs (only `realtime.js` meta has one) — npm pages otherwise blank.
- Additional `ReactiveQueryEngine` adapters beyond Drizzle/Postgres (Kysely, Prisma, raw SQL).
- Consider moving framework packages' TanStack deps to `peerDependencies` to mirror core.
- Create/rename the GitHub repo to `mikn/realtime.js` (today it is `mikn/tanstack-realtime`;
  package metadata + badges currently point at the real `tanstack-realtime` slug).

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

## Development methodology — TPM + 3-agent relay

I act as **Technical Program Manager**: I never write feature code myself. I
decompose the work into **work packages (WPs)**, write each as a ticket with an
explicit spec + acceptance criteria, then drive every WP through a fixed
three-stage relay of delegated agents. I own sequencing, the green gate, and
the final commit/push decision.

**The relay (per work package):**

1. **Implementation agent** (`general-purpose`, runs in a `worktree`). Input:
   the WP ticket + spec + acceptance criteria. Output: the implementation +
   tests, with all local gates (`lint`, `typecheck`, `test`, `build`) passing,
   plus a written summary of what changed and any deviations from spec.
2. **Adversarial review agent** (`Explore` / `general-purpose`, read-only).
   Input: the WP spec + the diff from stage 1. Mandate: **try to break it.**
   Hunt correctness bugs, missed edge cases, regressions, weak/oversized tests,
   API-vs-docs drift, security issues, and any place the implementation quietly
   fails the spec. Output: a prioritized findings list tagged
   `blocking` / `non-blocking` / `nit`. It does **not** edit code.
3. **Fixer agent** (`general-purpose`, same worktree). Input: the findings list.
   Resolves every `blocking` finding (and `non-blocking` where cheap),
   re-runs the gates, and returns what it fixed plus any finding it
   **disputes** (with rationale) back to me.

**TPM adjudication (me):** I review the dispute list and the final diff. I
either (a) accept → commit + push, (b) send back for another adversarial pass
if findings remain unresolved, or (c) escalate a genuine product decision to
you via a question. A WP is "done" only when the full repo gate is green and
the adversarial agent has no remaining `blocking` findings.

**Context handoff:** agents share no memory, so I pass the spec, the unified
diff, and the findings list explicitly between stages. Each WP is small enough
to review in one pass. The 935-test suite is the regression backstop on every
stage.

---

## Work packages

Phase 1 is done. Each WP below runs the full 3-agent relay above.

| WP   | Scope                                                                                                                                                      | Phase |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| WP-A | Extract reactive engine (3 files) into new optional `@realtimejs/reactive-drizzle`; preset-start composes it optionally; core + preset carry zero ORM deps | 2     |
| WP-B | Introduce pluggable `ReactiveQueryEngine` seam; Drizzle/PG impl becomes the first adapter behind it                                                        | 2     |
| WP-C | Fix silent multi-table under-invalidation (per-table predicates or explicit throw/warn); test + document the AND-equality / table-level contracts          | 2     |
| WP-D | Scripted rename codemod → `@realtimejs/*` scope + `realtime.js` meta-package + directory renames                                                           | 3     |
| WP-E | 3 runnable examples (one deliberately ORM-free) + examples build/typecheck CI job                                                                          | 4     |
| WP-F | Docs rebrand: name, tagline, "Why" reframe, honest "needs Drizzle+PG vs. doesn't" matrix                                                                   | 4     |
| WP-G | Release engineering: changesets for the new scope + meta-package, `0.1.0`, `publishConfig`, badges/OG                                                      | 5     |

Order: **A → B → C** (correct + freestanding under current names) → **D**
(rename in one shot) → **E, F** (prove + reposition) → **G** (ship). I pause for
your go between phases; WPs within a phase run back-to-back.

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
