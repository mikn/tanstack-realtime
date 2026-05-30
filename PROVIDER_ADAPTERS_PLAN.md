# Provider Adapter Plan — "commoditise most WS providers"

## Status: COMPLETE ✅

All WPs delivered via the TPM + 3-agent relay (implementation → adversarial review → fixer), each committed green and pushed:

| WP  | Commit(s)                       | Result                                                                                                                                                                                                                                             |
| --- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-1 | `a63e7fd`, `3caff6c`            | `TransportCapabilities` contract + `getCapabilities` + `client.capabilities`; capability-gated presence degradation. Fixer: coordinated transports now report their inner's real capabilities (coordinated-SSE no longer over-promises presence).  |
| P-2 | `2d604e3`, `b02e80a`            | `@realtimejs/adapter-conformance` kit. Fixer gave it teeth: reconnect re-subscribe check is mandatory + non-vacuous (negative phase), proven to fail a non-re-subscribing adapter.                                                                 |
| P-3 | `5123c94`                       | Centrifugo declares honest capabilities + passes the kit. **The kit caught a real re-subscribe timing bug in the shipping adapter** (publications dropped between connect and re-subscribe) — fixed.                                               |
| P-4 | `7389349`, `b5635a1`            | `@realtimejs/adapter-pusher` (Pusher + Soketi). Review caught a **real reconnect double-bind** (N+1 deliveries, confirmed against pusher-js@8.5.0 source); fixer added unbind-before-rebind + hardened the fake so the kit catches that bug class. |
| P-5 | `4fc3c13`, `c0da0b1`            | `@realtimejs/adapter-partykit` (PartyKit / Durable Objects), single-socket/envelope design + reference DO server. Fixer closed a latent `disconnect()` double-bind + exposed `./protocol`.                                                         |
| P-7 | `fbc3003`, + search-keyword fix | Per-provider capability matrix (every cell verified against declared `capabilities`), serverless-vs-fan-out architecture honesty, decision guidance, and the capability-contract + conformance "write your own adapter" reference.                 |

Final gate state: lint 0 errors, typecheck 0, **1053 tests pass / 3 skip**, build 19 projects, size within limits, knip clean, docs build OK.

Outcome: "commoditise most WS providers" is now backed by **three conformant adapters across three infra models** (self-host WS / managed SaaS+self-host / edge-DO) plus the conformance kit that guarantees future adapters behave the same — and the kit already earned its keep by catching real reconnect bugs in two adapters.

### Deferred follow-ups (logged, non-blocking)

- A behavioral gap-replay test for Centrifugo's `serverAssistedRecovery` (currently verified by inspection + declaration, not a recoverable-channel test).
- The conformance harness's synchronous interleaving is correct but fragile (documented).

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
