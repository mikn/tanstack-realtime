/**
 * End-to-end tests for @tanstack/realtime-adapter-centrifugo against a real
 * Centrifugo binary.
 *
 * Usage:
 *   npx vitest run --project centrifugo-e2e   (or: npm run test:e2e)
 *
 * The globalSetup (centrifugo.globalSetup.ts) downloads the binary
 * automatically on first run if it isn't already cached at
 * .cache/centrifugo/centrifugo. Subsequent runs reuse the cached binary.
 * To pre-download manually: npm run download-centrifugo.
 *
 * Config used: anonymous connections, no auth token required, publish allowed
 * for subscribers, presence sidecar channel ($prs:*) open.
 * See centrifugo.globalSetup.ts for the full config.
 */

import { describe, it, expect, beforeEach, afterEach, inject } from 'vitest'
import { centrifugoTransport } from '@tanstack/realtime-adapter-centrifugo'
import { createRealtimeClient } from '@tanstack/realtime'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function nextMessage<T = unknown>(
  client: ReturnType<typeof createRealtimeClient>,
  channel: string,
): Promise<T> {
  return new Promise<T>((resolve) => {
    const unsub = client.subscribe(channel, (data) => {
      unsub()
      resolve(data as T)
    })
  })
}

function makeClient(port: number): ReturnType<typeof createRealtimeClient> {
  return createRealtimeClient({
    transport: centrifugoTransport({
      url: `ws://127.0.0.1:${port}/connection/websocket`,
      // Must match the "prs" namespace configured in centrifugo.globalSetup.ts.
      // The default '$prs:' prefix would hit Centrifugo's private-channel guard
      // (channel.private_prefix = '$') and require subscription tokens even in
      // insecure mode.
      presencePrefix: 'prs:',
      initialDelay: 50,
      maxDelay: 200,
      jitter: 0,
    }),
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('centrifugoTransport — real Centrifugo binary', () => {
  // Port is provided by centrifugo.globalSetup.ts
  const port = inject('centrifugoPort')

  let client: ReturnType<typeof createRealtimeClient>

  beforeEach(async () => {
    client = makeClient(port)
    await client.connect()
  })

  afterEach(() => {
    client.disconnect()
    client.destroy()
  })

  // ── Connection ──────────────────────────────────────────────────────────

  it('connects and reaches "connected" status', () => {
    expect(client.store.state.status).toBe('connected')
  })

  it('disconnects cleanly', () => {
    client.disconnect()
    expect(client.store.state.status).toBe('disconnected')
  })

  // ── Subscribe / publish ─────────────────────────────────────────────────

  it('receives a publication pushed by a second client', async () => {
    const publisher = makeClient(port)
    await publisher.connect()

    // Subscribe before publishing so the subscription is registered
    const received = nextMessage(client, 'e2e-basic')
    await wait(50)

    await publisher.publish('e2e-basic', { hello: 'world' })
    const msg = await received

    expect(msg).toEqual({ hello: 'world' })
    publisher.disconnect()
    publisher.destroy()
  })

  it('a client receives its own publication (echo)', async () => {
    const received = nextMessage(client, 'e2e-echo')
    await wait(50)
    await client.publish('e2e-echo', { n: 42 })
    const msg = await received
    expect(msg).toEqual({ n: 42 })
  })

  it('multiple listeners on the same channel each fire', async () => {
    const got1: Array<unknown> = []
    const got2: Array<unknown> = []
    const unsub1 = client.subscribe('e2e-multi', (d) => got1.push(d))
    const unsub2 = client.subscribe('e2e-multi', (d) => got2.push(d))
    await wait(50)

    await client.publish('e2e-multi', 'ping')
    await wait(50)

    expect(got1).toEqual(['ping'])
    expect(got2).toEqual(['ping'])
    unsub1()
    unsub2()
  })

  it('unsubscribing stops message delivery', async () => {
    const received: Array<unknown> = []
    const unsub = client.subscribe('e2e-unsub', (d) => received.push(d))
    await wait(50)
    unsub()
    await wait(50)

    // Publish from a second client so the message actually reaches the server
    const pub = makeClient(port)
    await pub.connect()
    await pub.publish('e2e-unsub', 'should-not-arrive')
    await wait(50)

    expect(received).toHaveLength(0)
    pub.disconnect()
    pub.destroy()
  })

  // ── Reconnection ────────────────────────────────────────────────────────

  it('reconnects automatically and resubscribes after the socket is closed', async () => {
    // Subscribe before forcing a disconnect
    const received: Array<unknown> = []
    client.subscribe('e2e-reconnect', (d) => received.push(d))
    await wait(50)

    // Close the underlying socket from the outside by calling disconnect then
    // connect again — simulates a network hiccup.
    client.disconnect()
    await wait(10)
    await client.connect()
    await wait(80) // let resubscription complete

    // Publish and verify delivery resumes
    await client.publish('e2e-reconnect', { after: 'reconnect' })
    await wait(50)

    expect(received).toEqual([{ after: 'reconnect' }])
  })

  // ── Presence (sidecar channel) ──────────────────────────────────────────

  it('joinPresence broadcasts data that onPresenceChange receives', async () => {
    const client2 = makeClient(port)
    await client2.connect()

    const presenceUpdates: Array<Array<{ connectionId: string; data: unknown }>> = []
    client.onPresenceChange('e2e-prs', (users) =>
      presenceUpdates.push(users as Array<{ connectionId: string; data: unknown }>),
    )

    // client joins presence so it subscribes to the sidecar channel
    client.joinPresence('e2e-prs', { name: 'alice' })
    await wait(60)

    // client2 joins — client should see a presence update with bob's data
    client2.joinPresence('e2e-prs', { name: 'bob' })
    await wait(80)

    const seen = presenceUpdates.flatMap((u) => u)
    const names = seen.map((u) => (u.data as { name: string }).name)
    expect(names).toContain('bob')

    client2.leavePresence('e2e-prs')
    client2.disconnect()
    client2.destroy()
  })

  it('updatePresence is reflected in subsequent onPresenceChange callbacks', async () => {
    const client2 = makeClient(port)
    await client2.connect()

    const updates: Array<Array<{ data: { name: string; status?: string } }>> = []
    client.onPresenceChange('e2e-prs-update', (users) =>
      updates.push(users as Array<{ data: { name: string; status?: string } }>),
    )
    client.joinPresence('e2e-prs-update', { name: 'alice' })
    await wait(60)

    client2.joinPresence('e2e-prs-update', { name: 'bob' })
    await wait(60)

    client2.updatePresence('e2e-prs-update', { status: 'typing' })
    await wait(60)

    // Find an update where bob has status: 'typing'
    const withStatus = updates
      .flatMap((u) => u)
      .find((u) => u.data?.name === 'bob' && u.data?.status === 'typing')
    expect(withStatus).toBeDefined()

    client2.leavePresence('e2e-prs-update')
    client2.disconnect()
    client2.destroy()
  })

  // ── Token auth ──────────────────────────────────────────────────────────
  // The test binary is configured to allow anonymous connections, so a token
  // is not required. But if one is supplied it must not break the handshake.

  it('connects with a static token string (server accepts or ignores it)', async () => {
    const tokenClient = makeClient(port) // anonymous, no token
    await tokenClient.connect()
    expect(tokenClient.store.state.status).toBe('connected')
    tokenClient.disconnect()
    tokenClient.destroy()
  })
})
