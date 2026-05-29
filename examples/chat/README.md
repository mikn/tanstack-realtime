# Chat — realtime.js example

A real-time chat room demonstrating **append-only live channels**, **presence**,
and **typing indicators** with `@realtimejs/core` + `@realtimejs/react`.

> **Architecture:** Vite + React client talks to an in-memory SSE server
> (Vite dev middleware) with an auth stub; messages flow append-only over a
> `chat` channel, while presence and typing ride the transport's pub/sub.

## No ORM

Message history is a plain in-memory array in [`src/server.ts`](./src/server.ts)
— no ORM, no database. The server adds an **auth stub** (`getUser`) that reads a
`userId` query param; a real app would verify a JWT or session cookie there.

## What it exercises

| API                                                       | Where             |
| --------------------------------------------------------- | ----------------- |
| `createRealtimeClient`, `sseTransport`                    | `src/realtime.ts` |
| `RealtimeProvider`                                        | `src/main.tsx`    |
| `useLiveChannel` (append-only) + `useLiveQuery`           | `src/App.tsx`     |
| `createPresenceChannel` + `usePresence`                   | `src/App.tsx`     |
| `useTypingIndicator`                                      | `src/App.tsx`     |
| `useConnectionStatus`                                     | `src/App.tsx`     |
| `createSseHandler` with `getUser` auth stub + `broadcast` | `src/server.ts`   |

Presence is layered on the transport via a small `withPresence` wrapper
(`src/withPresence.ts`) — the same helper the repo's e2e app uses — so the SSE
server needs no presence-specific code.

### Late joiners

The presence sidecar channel only delivers a `join` announcement to peers who
are already subscribed when it is published — it has no replay/history. Without
mitigation that makes the online list asymmetric: if Alice joins and then Bob
joins, Bob sees Alice's `join`, but Alice's earlier `join` never reaches Bob.
`src/App.tsx` fixes this (mirroring the e2e `PresencePanel`) with a ~2s
`updatePresence` heartbeat: each client re-announces its presence on an interval
(cleared on unmount), so every peer — including late joiners — discovers
everyone else within a couple of seconds.

## Run

```sh
pnpm install          # from the repo root
pnpm --filter @realtimejs-example/chat dev
```

Open <http://localhost:5174?userId=alice> and
<http://localhost:5174?userId=bob> in two tabs to chat, see each other online,
and watch typing indicators.

## Scripts

- `dev` — start the Vite dev server (client + in-memory SSE server middleware)
- `build` — production client build (`vite build`)
- `typecheck` — `tsc --noEmit`
