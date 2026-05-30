# Provider Adapter Plan — "commoditise most WS providers"

> Goal: make the central claim true. We don't host the socket — we normalize
> whoever does. Deliverable is a provider-adapter LAYER (contract + conformance
> kit + real adapters), not a transport we run. Serverless functions stay the
> publish endpoint; the fan-out tier is a provider (or `PublishBackend`).

Selected targets (beyond the existing Centrifugo adapter): **Pusher / Soketi**
(Pusher protocol — hosted SaaS + self-hostable drop-in) and **PartyKit /
Cloudflare Durable Objects** (edge / server-held membership). Ably and a generic
raw-WS client transport are explicitly out of scope for this round.

## Methodology

TPM + 3-agent relay per WP (implementation → adversarial review → fixer). I own
sequencing and the green gate; agents commit-when-green; I push after review/fix.
Every adapter WP must: take the provider SDK **injected** (offline-testable, no
live network/credentials in CI), pass the conformance kit, declare honest
capability flags, carry no `"*"` deps, keep root gates green, use `realtime.js`
naming.

## Work packages

| WP  | Scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-1 | **Adapter contract + capability model.** Document `RealtimeTransport` (+ `PresenceCapable`) as the public adapter API. Add a `TransportCapabilities` descriptor (candidate flags: `presence`, `history`, `serverAssistedRecovery`, `ephemeral`) exposed on the transport; generalize today's `hasPresence` into capability-gated **graceful degradation** (`usePresence` throws an actionable `[realtime]` error when `!presence`; history/pagination hooks no-op + dev-warn when `!history`). Back-compat default capabilities for transports that don't declare them.                              |
| P-2 | **Conformance test kit** — new dev package `@realtimejs/adapter-conformance` (vitest as peer). Exports `runAdapterConformance({ createTransport, capabilities, fakeProvider })` running one battery: connect/disconnect + status store, subscribe delivers, unsubscribe stops, publish reaches subscribers, reconnect re-subscribes deferred channels, `onSubscribeError` surfaces, presence join/update/leave + `onPresenceChange` (only when `capabilities.presence`), and **capability honesty** (declared flags match observed behavior). Runs offline against an injected fake provider client. |
| P-3 | **Retrofit Centrifugo onto the contract.** Centrifugo adapter declares `capabilities` and passes the conformance kit with NO behavior change. Validates the contract on a real adapter before new ones; backward-compat guard.                                                                                                                                                                                                                                                                                                                                                                       |
| P-4 | **`@realtimejs/adapter-pusher`** — wraps `pusher-js` (injected; Soketi is wire-compatible, same adapter + config). Channels → Pusher channels; presence via Pusher `presence-` channels; auth via authEndpoint/authorizer. Declares capabilities (presence ✓; history via separate HTTP API → flag accordingly). Passes conformance against a fake Pusher client. Docs + example wiring + capability-matrix row.                                                                                                                                                                                     |
| P-5 | **`@realtimejs/adapter-partykit`** — wraps PartySocket (injected). PartyKit room ↔ channel; presence via the room's server-held connection list (DO holds membership). Declares capabilities. Passes conformance against a fake PartySocket. Docs + example wiring + capability-matrix row.                                                                                                                                                                                                                                                                                                          |
| P-7 | **Architecture-honesty docs.** Document the production model: serverless fn = publish endpoint; fan-out tier = provider OR `PublishBackend` (Redis/DO); SSE-in-process = dev/single-node only. Per-provider "what degrades where" matrix (SSE / Centrifugo / Pusher-Soketi / PartyKit). Reframe presence as "needs server-side membership state (provider or external store)," not a transport quirk. Update the Transports decision matrix.                                                                                                                                                         |

(P-6, the generic raw-WS client transport, is dropped per target selection.)

## Sequencing

**Contract phase:** P-1 → P-2 → P-3 (prove the contract on Centrifugo). _Pause
for go._ **Adapter phase:** P-4 and P-5 (independent packages, back-to-back) →
P-7 docs last.

## Why this and not "add a WebSocket transport"

A built-in WS server handler is off-thesis: serverless functions can't hold a
socket. Everything stateful (presence membership, history, multi-instance
fan-out) needs the external tier anyway. So the on-thesis move is to make the
provider-normalization layer real and proven across ≥3 providers/architectures,
with a conformance kit guaranteeing "most providers" actually behave the same.
