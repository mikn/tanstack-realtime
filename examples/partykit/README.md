# PartyKit — realtime.js example

A **provider-adapter** demo: the same realtime.js client and React hooks used by
the SSE examples, but the realtime traffic flows over a **PartyKit room** (a
Cloudflare **Durable Object**) via `@realtimejs/adapter-partykit`'s
`partykitTransport` — not SSE.

> **The headline:** open two browser tabs. The "who's here" presence list and
> the shared reaction feed stay in sync across both — over PartyKit. The ONLY
> thing that changed from an SSE example is the transport.

## Architecture

```
  Browser tab(s)                         PartyKit dev server (:1999)
 ┌────────────────────────┐            ┌──────────────────────────────────┐
 │ React + realtime.js     │  WebSocket │ PartyKit Server (= one Durable    │
 │ hooks (usePresence,     │◄──────────►│ Object per room)                  │
 │ useChannel, …)          │  one room  │   src/party/server.ts (bridge)    │
 │                         │  socket    │     └─ delegates to the adapter's │
 │ partykitTransport({     │            │        REFERENCE server           │
 │   host, room })         │            │   @realtimejs/adapter-partykit/   │
 └────────────────────────┘            │        server                     │
                                        └──────────────────────────────────┘
```

- **Client** ([`src/realtime.ts`](./src/realtime.ts)) — `createRealtimeClient({
transport: partykitTransport({ host, room }) })`. `host` defaults to
  `localhost:1999` (the `partykit dev` server); `room` is a fixed demo room.
  realtime.js multiplexes **all** of its channels over that one room socket
  (each channel rides inside a JSON envelope routed by name). `partysocket` (a
  reconnecting WebSocket) comes transitively via the adapter.
- **Server** ([`src/party/server.ts`](./src/party/server.ts)) — a PartyKit
  `Server` (default export) that does **not** re-implement the protocol. It is a
  thin bridge that forwards PartyKit's `onConnect`/`onMessage`/`onClose`
  lifecycle to the adapter's **reference server**,
  `@realtimejs/adapter-partykit/server` (`RealtimeRoomServer`). The reference
  server handles subscribe/unsubscribe, publish fan-out, and presence — deriving
  the member list from the **Durable Object's live connection list**.

### Server-held presence (what SSE can't do)

Because a PartyKit room **is** a Durable Object, the server holds membership in
its live connection list. `presence:join`/`presence:leave` and connection
open/close drive a `{type:'presence', members}` push to every subscriber — so
the "who's here" list updates the instant a tab opens or closes, with **no
client-side heartbeat hack**. (Contrast the SSE [`chat`](../chat) example, which
re-announces presence on a ~2s timer because its pub/sub presence sidecar has no
server-held membership.)

## What it exercises

| API                                                         | Where                 |
| ----------------------------------------------------------- | --------------------- |
| `createRealtimeClient`, `partykitTransport({ host, room })` | `src/realtime.ts`     |
| `RealtimeProvider`                                          | `src/main.tsx`        |
| `createPresenceChannel` + `usePresence` (`others`/`self`)   | `src/App.tsx`         |
| `useChannel` (subscribe + publish broadcast)                | `src/App.tsx`         |
| `useConnectionStatus`                                       | `src/App.tsx`         |
| `RealtimeRoomServer` (adapter reference server)             | `src/party/server.ts` |

## Run it locally — TWO processes

Unlike the SSE examples (which self-host the realtime server inside Vite dev
middleware), this example needs the **PartyKit dev server running separately**.

In one terminal — start the PartyKit room server on `:1999`:

```sh
pnpm --filter @realtimejs-example/partykit dev:party
# (= npx partykit dev)
```

In another terminal — start the Vite client (on `:5176`):

```sh
pnpm --filter @realtimejs-example/partykit dev
```

Open http://localhost:5176 in **two tabs** (optionally `?name=alice` /
`?name=bob`): presence and reactions stay in sync across both.

To point at a deployed PartyKit project instead of the dev server, set
`VITE_PARTYKIT_HOST=my-app.username.partykit.dev` for the client.

## The "swap transports" point

The client code here is the same shape as the SSE examples — `usePresence`,
`useChannel`, `useConnectionStatus`, `RealtimeProvider`. The only line that
chose PartyKit is in `src/realtime.ts`:

```ts
transport: partykitTransport({ host, room }) // vs. sseTransport({ url })
```

That is the commoditise-the-provider story made runnable: realtime.js apps are
written against the hooks/client contract, and the WebSocket provider is a swap.

## Honest limits

- **At-most-once delivery.** `partykitTransport` declares
  `serverAssistedRecovery: false` and `history: false` — PartySocket reconnects
  transparently, but the room replays **nothing missed** during a gap. The
  reactions feed is fire-and-forget; a tab offline during a burst will not see
  those reactions afterwards. (For gap-replay semantics, use a recovery-capable
  transport.)
- **Presence is Durable-Object-held**, derived from the live connection list —
  accurate while connected, reset for a connection when its socket drops (the
  adapter re-asserts presence intent on reconnect).

## CI note: typecheck + build only

CI **typechecks** (`tsc --noEmit` over the client _and_ the
`src/party/server.ts` PartyKit server — needing the `partykit` types) and
**builds the client** (`vite build`, a static bundle — it does **not** need the
PartyKit server running). CI does **not** boot `partykit dev` and run the demo
end-to-end; that is expected for a provider example (it would require the
PartyKit/Cloudflare runtime). The server's correctness is covered by the
adapter's reference server and the transport conformance suite; the bridge in
`src/party/server.ts` only forwards to it.
