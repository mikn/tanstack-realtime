/**
 * Integration tests for the RealtimeChannel Durable Object and
 * createWorkerdHandler, running inside the real workerd runtime via
 * @cloudflare/vitest-pool-workers / miniflare.
 *
 * Unlike integration.workerd.test.ts (which tests the workerdTransport client
 * against a mock Node.js server), these tests exercise the actual DO code:
 *   WebSocketPair, ctx.acceptWebSocket, ctx.getWebSockets,
 *   ws.serializeAttachment / deserializeAttachment, idFromName routing, etc.
 *
 * All requests go through the real createWorkerdHandler → real RealtimeChannel
 * DO, with no mocking of any layer.
 */

import { SELF } from 'cloudflare:test'
import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Open a WebSocket to the test worker for a specific channel.
 * Throws if the server does not return 101.
 */
async function wsConnect(channel: string, token?: string): Promise<WebSocket> {
  const qs = token !== undefined ? `?token=${encodeURIComponent(token)}` : ''
  const resp = await SELF.fetch(
    `http://localhost/_realtime/${encodeURIComponent(channel)}${qs}`,
    { headers: { Upgrade: 'websocket' } },
  )
  if (resp.status !== 101) {
    throw new Error(
      `Expected 101 WebSocket upgrade, got ${resp.status}`,
    )
  }
  const ws = resp.webSocket!
  ws.accept()
  return ws
}

/** Wait for the next message event on a WebSocket. */
function nextMsg(ws: WebSocket): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    ws.addEventListener(
      'message',
      (e: MessageEvent) => resolve(JSON.parse(e.data as string) as Record<string, unknown>),
      { once: true },
    )
    ws.addEventListener('error', () => reject(new Error('WebSocket error')), {
      once: true,
    })
  })
}

/**
 * Open a WebSocket and consume the initial `{ type: 'connected', connectionId }`
 * message the DO sends immediately after the handshake.
 */
async function wsConnected(channel: string, token?: string) {
  const ws = await wsConnect(channel, token)
  const msg = await nextMsg(ws)
  if (msg.type !== 'connected') {
    throw new Error(`Expected "connected" message, got "${msg.type}"`)
  }
  return { ws, connectionId: msg.connectionId as string }
}

/** Collect the next N messages from a WebSocket, with a timeout. */
function collectN(
  ws: WebSocket,
  n: number,
  timeoutMs = 2000,
): Promise<Array<Record<string, unknown>>> {
  return new Promise((resolve, reject) => {
    const msgs: Array<Record<string, unknown>> = []
    const timer = setTimeout(
      () =>
        reject(
          new Error(`Timeout: expected ${n} messages, got ${msgs.length}`),
        ),
      timeoutMs,
    )
    ws.addEventListener('message', (e: MessageEvent) => {
      msgs.push(JSON.parse(e.data as string) as Record<string, unknown>)
      if (msgs.length === n) {
        clearTimeout(timer)
        resolve(msgs)
      }
    })
  })
}

// ---------------------------------------------------------------------------
// createWorkerdHandler — auth and routing
// ---------------------------------------------------------------------------

describe('createWorkerdHandler — auth', () => {
  it('returns 101 and a connectionId for an authorised connection', async () => {
    const { ws, connectionId } = await wsConnected('auth-ok')
    expect(typeof connectionId).toBe('string')
    expect(connectionId.length).toBeGreaterThan(0)
    ws.close()
  })

  it('returns 401 for a denied token — no WebSocket upgrade', async () => {
    const resp = await SELF.fetch(
      'http://localhost/_realtime/auth-deny?token=deny',
      { headers: { Upgrade: 'websocket' } },
    )
    expect(resp.status).toBe(401)
  })

  it('routes different channels to different DO instances', async () => {
    // If channels shared a DO, a publish to 'ch-a' would reach 'ch-b'.
    const { ws: wsA } = await wsConnected('routing-ch-a')
    const { ws: wsB } = await wsConnected('routing-ch-b')

    const receivedByA: unknown[] = []
    wsA.addEventListener('message', (e: MessageEvent) =>
      receivedByA.push(JSON.parse(e.data as string)),
    )

    // Publish to ch-b via HTTP (server-side push shortcut).
    // This proves the DO for ch-b is a separate instance from ch-a's DO.
    wsB.send(JSON.stringify({ type: 'publish', data: 'from-b' }))

    // Give miniflare time to process.
    await new Promise((r) => setTimeout(r, 100))

    expect(receivedByA).toHaveLength(0)
    wsA.close()
    wsB.close()
  })
})

// ---------------------------------------------------------------------------
// RealtimeChannel DO — pub/sub fanout
// ---------------------------------------------------------------------------

describe('RealtimeChannel DO — publish / subscribe', () => {
  it('fans out a published message to all connections on the same channel', async () => {
    const { ws: ws1 } = await wsConnected('fanout-basic')
    const { ws: ws2 } = await wsConnected('fanout-basic')

    // Listen on ws1 before ws2 publishes.
    const received = nextMsg(ws1)
    ws2.send(JSON.stringify({ type: 'publish', data: { text: 'hello' } }))

    const msg = await received
    expect(msg.type).toBe('message')
    expect(msg.data).toEqual({ text: 'hello' })

    ws1.close()
    ws2.close()
  })

  it('the publisher also receives their own message (full fanout)', async () => {
    const { ws } = await wsConnected('fanout-self')

    const received = nextMsg(ws)
    ws.send(JSON.stringify({ type: 'publish', data: 'self-echo' }))

    const msg = await received
    expect(msg).toEqual({ type: 'message', data: 'self-echo' })

    ws.close()
  })

  it('a third connection joining mid-stream receives subsequent publishes', async () => {
    const { ws: ws1 } = await wsConnected('fanout-late-join')
    const { ws: ws2 } = await wsConnected('fanout-late-join')

    // ws3 joins after ws1 and ws2 are already connected.
    const { ws: ws3 } = await wsConnected('fanout-late-join')

    const received = nextMsg(ws3)
    ws1.send(JSON.stringify({ type: 'publish', data: 'late-msg' }))

    const msg = await received
    expect(msg).toEqual({ type: 'message', data: 'late-msg' })

    ws1.close()
    ws2.close()
    ws3.close()
  })

  it('refuses publish for a readonly token and sends an error message back', async () => {
    const { ws } = await wsConnected('publish-auth', 'readonly')

    const reply = nextMsg(ws)
    ws.send(JSON.stringify({ type: 'publish', data: 'should-fail' }))

    const msg = await reply
    expect(msg.type).toBe('error')
    expect(typeof msg.message).toBe('string')

    ws.close()
  })
})

// ---------------------------------------------------------------------------
// RealtimeChannel DO — presence
// ---------------------------------------------------------------------------

describe('RealtimeChannel DO — presence', () => {
  it('broadcasts presence:update when a user joins', async () => {
    const { ws: ws1, connectionId: id1 } = await wsConnected('pres-join')
    const { ws: ws2, connectionId: id2 } = await wsConnected('pres-join')

    // Listen on ws1 before ws2 joins presence.
    const update = nextMsg(ws1)
    ws2.send(JSON.stringify({ type: 'presence:join', data: { name: 'Bob' } }))

    const msg = await update
    expect(msg.type).toBe('presence:update')
    const users = msg.users as Array<{ connectionId: string; data: unknown }>
    expect(users.some((u) => u.connectionId === id2)).toBe(true)
    expect(users.some((u) => (u.data as { name: string }).name === 'Bob')).toBe(
      true,
    )

    ws1.close()
    ws2.close()
  })

  it('presence:update reflects the current snapshot (includes all joined users)', async () => {
    const { ws: ws1 } = await wsConnected('pres-snapshot')
    const { ws: ws2 } = await wsConnected('pres-snapshot')

    // Register listener BEFORE each send so we never race with miniflare's
    // work loop. The pattern is: listen → send → await, then repeat.
    const aliceUpdate = nextMsg(ws1)
    ws2.send(JSON.stringify({ type: 'presence:join', data: { name: 'Alice' } }))
    await aliceUpdate

    // ws3 connects after Alice has joined so the snapshot already has Alice.
    const { ws: ws3 } = await wsConnected('pres-snapshot')

    const bobUpdate = nextMsg(ws1)
    ws3.send(JSON.stringify({ type: 'presence:join', data: { name: 'Bob' } }))
    const msg = await bobUpdate

    // Final snapshot must contain both users.
    const users = msg.users as Array<{ data: { name: string } }>
    const names = users.map((u) => u.data.name)
    expect(names).toContain('Alice')
    expect(names).toContain('Bob')

    ws1.close()
    ws2.close()
    ws3.close()
  })

  it('presence:update propagates new data', async () => {
    const { ws: ws1 } = await wsConnected('pres-update')
    const { ws: ws2 } = await wsConnected('pres-update')

    ws2.send(JSON.stringify({ type: 'presence:join', data: { cursor: null } }))
    await nextMsg(ws1) // consume join broadcast

    const update = nextMsg(ws1)
    ws2.send(
      JSON.stringify({
        type: 'presence:update',
        data: { cursor: { x: 42, y: 7 } },
      }),
    )

    const msg = await update
    const users = msg.users as Array<{ data: unknown }>
    expect(users[0]?.data).toEqual({ cursor: { x: 42, y: 7 } })

    ws1.close()
    ws2.close()
  })

  it('presence:leave removes the user from the snapshot', async () => {
    const { ws: ws1 } = await wsConnected('pres-leave')
    const { ws: ws2, connectionId: id2 } = await wsConnected('pres-leave')

    ws2.send(JSON.stringify({ type: 'presence:join', data: { name: 'Bob' } }))
    await nextMsg(ws1) // consume join broadcast

    const update = nextMsg(ws1)
    ws2.send(JSON.stringify({ type: 'presence:leave' }))

    const msg = await update
    const users = msg.users as Array<{ connectionId: string }>
    expect(users.some((u) => u.connectionId === id2)).toBe(false)

    ws1.close()
    ws2.close()
  })

  it('closing a connection removes the user and broadcasts an updated snapshot', async () => {
    const { ws: ws1 } = await wsConnected('pres-close')
    const { ws: ws2, connectionId: id2 } = await wsConnected('pres-close')

    ws2.send(JSON.stringify({ type: 'presence:join', data: { name: 'Bob' } }))
    await nextMsg(ws1) // consume join broadcast

    // Closing ws2 should trigger broadcastPresence in webSocketClose.
    const update = nextMsg(ws1)
    ws2.close()

    const msg = await update
    const users = msg.users as Array<{ connectionId: string }>
    expect(users.some((u) => u.connectionId === id2)).toBe(false)

    ws1.close()
  })

  it('presence:update includes connectionId from serializeAttachment (survives hibernation sim)', async () => {
    // This verifies that deserializeAttachment correctly restores ConnectionMeta
    // across the "hibernation" simulation miniflare performs between messages.
    const { ws: ws1, connectionId: id1 } = await wsConnected('pres-attach')
    const { ws: ws2, connectionId: id2 } = await wsConnected('pres-attach')

    ws1.send(JSON.stringify({ type: 'presence:join', data: { role: 'editor' } }))
    const update = await nextMsg(ws2)

    const users = update.users as Array<{ connectionId: string; data: { role: string } }>
    const alice = users.find((u) => u.connectionId === id1)
    expect(alice).toBeDefined()
    expect(alice!.data.role).toBe('editor')

    ws1.close()
    ws2.close()
  })
})
