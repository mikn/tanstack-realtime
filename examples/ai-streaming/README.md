# AI Streaming — realtime.js example

Streams mock LLM tokens from the server to the browser and renders
**pending → streaming → done** states with `@realtimejs/core` + `@realtimejs/react`.

> **Architecture:** Vite + React client opens one SSE connection; a `POST` kicks
> off a server-side stream (`handler.createStream`) that pushes tokens over an
> `['ai', { sessionId }]` channel, folded into reactive state by `useStream`.

## No ORM

There is no database, no ORM, and no real LLM — `src/server.ts` pushes a fixed
mock response token-by-token with small delays to simulate generation. Swap
`runMockStream` for a real model call (OpenAI, Anthropic, a local model) and the
streaming wiring stays identical.

## What it exercises

| API                                                              | Where              |
| ---------------------------------------------------------------- | ------------------ |
| `createRealtimeClient`, `sseTransport`                           | `src/realtime.ts`  |
| `RealtimeProvider`                                               | `src/main.tsx`     |
| `createStreamChannel`                                            | `src/streamDef.ts` |
| `useStream` (pending/streaming/done/error/stale)                 | `src/App.tsx`      |
| `STREAM_DONE` / `STREAM_ERROR` sentinels                         | `src/streamDef.ts` |
| `createSseHandler` + `handler.createStream` (server-side stream) | `src/server.ts`    |

## Run

```sh
pnpm install          # from the repo root
pnpm --filter @realtimejs-example/ai-streaming dev
```

Open <http://localhost:5175> and click **Generate** to watch tokens stream in.

## Scripts

- `dev` — start the Vite dev server (client + in-memory SSE server middleware)
- `build` — production client build (`vite build`)
- `typecheck` — `tsc --noEmit`
