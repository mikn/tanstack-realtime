# Collaborative Todos — realtime.js example

A multi-tab collaborative todo list demonstrating **optimistic updates** and
**CRDT convergence** with `@realtimejs/core` + `@realtimejs/react`.

> **Architecture:** Vite + React client talks to an in-memory SSE server
> (mounted as Vite dev middleware) over a single `todos` channel. Peer sync is
> **client-authoritative**: the in-memory server's REST endpoints persist data
> and serve the initial load, while the mutating client publishes a
> CRDT-tagged message (`_crdt` header) back over the `todos` channel so peers
> converge. The server deliberately does **not** re-broadcast a header-less row,
> which would clobber the CRDT-merged `votes` value on peers.

## Bring your own backend

There is **no ORM, no database, and no platform** here. The "database" is a
plain JavaScript `Map` in [`src/server.ts`](./src/server.ts). This is the
explicit BYOB showcase: realtime.js does not care where your data lives — swap
the `Map` for Postgres, SQLite, Redis, or a SaaS API and the realtime wiring
(`createSseHandler` + the `todos` channel) stays identical.

## What it exercises

| API                                      | Where             |
| ---------------------------------------- | ----------------- |
| `createRealtimeClient`, `sseTransport`   | `src/realtime.ts` |
| `RealtimeProvider`                       | `src/main.tsx`    |
| `useRealtimeCollection` (REST shorthand) | `src/App.tsx`     |
| `useConnectionStatus`                    | `src/App.tsx`     |
| CRDT `fields` (`lww`, `pn-counter`)      | `src/App.tsx`     |
| `createSseHandler` + `broadcast`         | `src/server.ts`   |

- `text` → `lww` (last-write-wins): concurrent text edits resolve deterministically.
- `votes` → `pn-counter`: concurrent +/- from multiple tabs always add up.
- `done` → plain incoming-wins boolean.

## Run

```sh
pnpm install          # from the repo root
pnpm --filter @realtimejs-example/collaborative-todos dev
```

Open <http://localhost:5173> in two browser tabs and edit/vote/complete todos —
state converges live.

## Scripts

- `dev` — start the Vite dev server (client + in-memory SSE server middleware)
- `build` — production client build (`vite build`)
- `typecheck` — `tsc --noEmit`
