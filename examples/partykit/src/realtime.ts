/**
 * Realtime client for the PartyKit example.
 *
 * This is the headline of the provider-adapter story: the SAME hooks and client
 * code used by the SSE examples work unchanged here — only the TRANSPORT is
 * different. We swap `sseTransport(...)` for `partykitTransport(...)`, point it
 * at the PartyKit dev server (`localhost:1999`), and everything else (presence,
 * pub/sub, connection status) "just works" over WebSockets + a Durable Object.
 *
 * `partysocket` (the reconnecting WebSocket) comes transitively via the adapter.
 */
import { createRealtimeClient } from '@realtimejs/core'
import { partykitTransport } from '@realtimejs/adapter-partykit'

/**
 * PartyKit host. Defaults to the `partykit dev` server on :1999.
 * In production this would be `my-app.username.partykit.dev`.
 */
const HOST = import.meta.env.VITE_PARTYKIT_HOST ?? 'localhost:1999'

/**
 * Fixed demo room. realtime.js multiplexes ALL of its channels over this single
 * room connection — each channel rides inside a JSON envelope routed by name.
 * One room == one Durable Object, which is what holds presence membership.
 */
const ROOM = 'realtime-demo'

export const client = createRealtimeClient({
  transport: partykitTransport({ host: HOST, room: ROOM }),
})

/** A friendly per-tab identity used for presence + chat. */
export const userName = (() => {
  const params = new URLSearchParams(window.location.search)
  return params.get('name') ?? `guest-${Math.random().toString(36).slice(2, 6)}`
})()
