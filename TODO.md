# realtime.js — Backlog

A short, forward-looking list of work for the freestanding **realtime.js** project
(`@realtimejs/*` scope + the `realtime.js` meta-package). Most of the feature and
docs work tracked in earlier plans has shipped; what remains is mostly release
hygiene and breadth.

## Release & naming

- [ ] Claim the `@realtimejs` npm scope and publish the first `0.x` release.
- [ ] Decide whether to rename the GitHub repo `mikn/tanstack-realtime` →
      `mikn/realtimejs` (and update `repository`/`homepage`/`bugs` URLs if so).

## Packages & docs

- [ ] Per-package `README.md` for each published package (`core`, `react`, `vue`,
      `solid`, the adapters, `preset-start`, `reactive-drizzle`, the devtools).
- [ ] Revise the docs site to reflect the freestanding realtime.js identity and the
      `@realtimejs/*` package names (handled by the docs-rewrite work package).

## Reactive query engine

- [ ] Additional `ReactiveQueryEngine` implementations behind the existing seam:
      Kysely, Prisma, and a raw-SQL adapter (`@realtimejs/reactive-drizzle` is the
      reference implementation).

## Transports & examples

- [ ] Runnable examples for the Pusher and PartyKit adapters (the SSE/Centrifugo
      paths already have examples).
- [ ] Keep every adapter passing the `@realtimejs/adapter-conformance` kit as new
      capabilities land.
