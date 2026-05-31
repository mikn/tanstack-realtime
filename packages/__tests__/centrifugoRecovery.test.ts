/**
 * Behavioral gap-replay recovery test for @realtimejs/adapter-centrifugo.
 *
 * The Centrifugo adapter declares `capabilities.serverAssistedRecovery: true`
 * and implements epoch/offset gap recovery (see `transport.ts`:
 * `channelRecovery` tracking, subscribe with `recover:true` + stored position,
 * and `handleReply` dispatching replayed `publications`). This file LOCKS THAT
 * IN behaviorally: a real recoverable-channel gap replay over an in-process
 * `ws` server, asserting the adapter
 *   1. stores the epoch/offset from the subscribe reply and updates the offset
 *      as live publications arrive,
 *   2. on a network-drop reconnect re-subscribes with `recover: true` carrying
 *      the LAST known `{ epoch, offset }`,
 *   3. dispatches the server-replayed MISSED publications to the channel
 *      subscriber IN ORDER, exactly once, with no gaps and no dupes.
 *
 * A regression in the recovery path (wrong stored offset, dropped/duplicated
 * replay, missing `recover:true`) now fails this test instead of escaping code
 * inspection.
 *
 * Like `centrifugo.test.ts`, this uses a minimal Centrifugo-protocol `ws`
 * server — but one that models a RECOVERABLE channel: it assigns increasing
 * offsets, retains a per-channel history, replies `recoverable: true` with an
 * `{ epoch, offset }`, and on a `recover: true` re-subscribe replays only the
 * publications after the client's last offset.
 */

import { createServer } from 'node:http'
import { WebSocketServer, WebSocket as WsWebSocket } from 'ws'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { centrifugoTransport } from '@realtimejs/adapter-centrifugo'
import { createRealtimeClient } from '@realtimejs/core'
import type { WebSocket as WsSocket } from 'ws'
import type { Server as HttpServer } from 'node:http'

const NodeWebSocket = WsWebSocket as unknown as typeof globalThis.WebSocket

// ---------------------------------------------------------------------------
// Recovery-aware mini Centrifugo server
// ---------------------------------------------------------------------------

interface SubscribeCommand {
  id: number
  recover?: boolean
  epoch?: string
  offset?: number
}

interface RecoveryServer {
  port: number
  /** Publish on a recoverable channel: assigns the next offset, retains it in
   *  history, and pushes to currently-connected subscribers. */
  publish: (channel: string, data: unknown) => void
  /** Forcibly drop the single client socket (simulates a network drop). The
   *  adapter will see `close` and schedule a reconnect WITHOUT clearing its
   *  per-channel recovery position. */
  dropConnection: () => void
  /** All subscribe commands the server has seen, in order, per channel. */
  subscribeCommandsFor: (channel: string) => Array<SubscribeCommand>
  teardown: () => Promise<void>
}

/**
 * @param epoch The epoch the server reports for every recoverable channel.
 *              Stable across the reconnect so recovery is accepted.
 */
async function createRecoveryServer(
  epoch = 'epoch-1',
): Promise<RecoveryServer> {
  const httpServer: HttpServer = createServer()
  const wss = new WebSocketServer({ server: httpServer })

  let clientCounter = 0
  // The current live socket (this server expects a single client at a time).
  let activeSocket: WsSocket | null = null
  // channel → ordered history of { data, offset }
  const history = new Map<string, Array<{ data: unknown; offset: number }>>()
  // channel → highest assigned offset
  const channelOffset = new Map<string, number>()
  // channel → sockets currently subscribed
  const channelSockets = new Map<string, Set<WsSocket>>()
  // channel → subscribe commands observed (for assertions)
  const subscribeCommands = new Map<string, Array<SubscribeCommand>>()

  function nextOffset(channel: string): number {
    const next = (channelOffset.get(channel) ?? 0) + 1
    channelOffset.set(channel, next)
    return next
  }

  wss.on('connection', (ws) => {
    const clientId = `client-${++clientCounter}`
    activeSocket = ws
    const subscribed = new Set<string>()

    ws.on('message', (raw) => {
      let msgs: Array<Record<string, unknown>>
      try {
        const parsed = JSON.parse(raw.toString())
        msgs = Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        return
      }

      for (const msg of msgs) {
        const id = msg['id'] as number | undefined

        if (msg['connect'] !== undefined) {
          ws.send(
            JSON.stringify({
              id,
              connect: { client: clientId, version: '4.0.0' },
            }),
          )
        } else if (msg['subscribe'] !== undefined) {
          const sub = msg['subscribe'] as {
            channel: string
            recover?: boolean
            epoch?: string
            offset?: number
          }
          const ch = sub.channel
          subscribed.add(ch)
          if (!channelSockets.has(ch)) channelSockets.set(ch, new Set())
          channelSockets.get(ch)!.add(ws)

          if (!subscribeCommands.has(ch)) subscribeCommands.set(ch, [])
          subscribeCommands.get(ch)!.push({
            id: id ?? -1,
            recover: sub.recover,
            epoch: sub.epoch,
            offset: sub.offset,
          })

          const currentOffset = channelOffset.get(ch) ?? 0

          if (sub.recover === true) {
            // Recovery subscribe: replay everything AFTER the client's offset.
            const since = sub.offset ?? 0
            const missed = (history.get(ch) ?? []).filter(
              (p) => p.offset > since,
            )
            ws.send(
              JSON.stringify({
                id,
                subscribe: {
                  recoverable: true,
                  epoch,
                  offset: currentOffset,
                  publications: missed.map((p) => ({
                    data: p.data,
                    offset: p.offset,
                  })),
                },
              }),
            )
          } else {
            // Fresh subscribe: recoverable with the current position, no replay.
            ws.send(
              JSON.stringify({
                id,
                subscribe: {
                  recoverable: true,
                  epoch,
                  offset: currentOffset,
                },
              }),
            )
          }
        } else if (msg['unsubscribe'] !== undefined) {
          const ch = (msg['unsubscribe'] as { channel: string }).channel
          subscribed.delete(ch)
          channelSockets.get(ch)?.delete(ws)
          ws.send(JSON.stringify({ id, unsubscribe: {} }))
        } else if (msg['publish'] !== undefined) {
          const { channel: ch, data } = msg['publish'] as {
            channel: string
            data: unknown
          }
          ws.send(JSON.stringify({ id, publish: {} }))
          // Treat client publishes as live publications too (offset-tracked).
          deliver(ch, data)
        }
      }
    })

    ws.on('close', () => {
      if (activeSocket === ws) activeSocket = null
      for (const ch of subscribed) channelSockets.get(ch)?.delete(ws)
    })
  })

  function deliver(channel: string, data: unknown): void {
    const offset = nextOffset(channel)
    if (!history.has(channel)) history.set(channel, [])
    history.get(channel)!.push({ data, offset })
    const push = JSON.stringify({
      push: { channel, pub: { data, offset } },
    })
    for (const ws of channelSockets.get(channel) ?? []) {
      if (ws.readyState === ws.OPEN) ws.send(push)
    }
  }

  await new Promise<void>((resolve) => httpServer.listen(0, resolve))
  const port = (httpServer.address() as { port: number }).port

  return {
    port,
    publish: deliver,
    dropConnection() {
      // Drop subscriber registrations so a publication made while the client is
      // disconnected is NOT delivered live (it only resurfaces via recovery),
      // then close the socket so the adapter reconnects.
      for (const set of channelSockets.values()) {
        if (activeSocket) set.delete(activeSocket)
      }
      activeSocket?.close()
    },
    subscribeCommandsFor(channel) {
      return subscribeCommands.get(channel) ?? []
    },
    teardown() {
      return new Promise<void>((resolve, reject) => {
        wss.close(() => {
          httpServer.close((err) => (err ? reject(err) : resolve()))
        })
      })
    },
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('centrifugoTransport server-assisted recovery', () => {
  let server: RecoveryServer
  let client: ReturnType<typeof createRealtimeClient>

  beforeEach(async () => {
    server = await createRecoveryServer()
    client = createRealtimeClient({
      transport: centrifugoTransport({
        url: `ws://localhost:${server.port}`,
        initialDelay: 20,
        maxDelay: 50,
        jitter: 0,
        WebSocket: NodeWebSocket,
      }),
    })
    await client.connect()
  })

  afterEach(async () => {
    client.disconnect()
    client.destroy()
    await server.teardown()
  })

  it('replays missed publications in order, exactly once, after a reconnect gap', async () => {
    const received: Array<unknown> = []
    client.subscribe('chat', (data) => received.push(data))

    // Let the initial subscribe round-trip (stores recoverable epoch/offset).
    await wait(60)

    // (1) A few live publications with increasing offsets; client tracks position.
    server.publish('chat', { n: 1 })
    server.publish('chat', { n: 2 })
    await wait(60)
    expect(received).toEqual([{ n: 1 }, { n: 2 }])

    // (2) Network drop. The server-side subscriber registration is dropped, and
    //     the socket closes. The adapter keeps its per-channel recovery
    //     position (network drop, NOT an intentional disconnect()).
    server.dropConnection()

    // (3) Publications that occur WHILE the client is disconnected — these are
    //     the gap. They must NOT be delivered live; only replayed on recovery.
    server.publish('chat', { n: 3 })
    server.publish('chat', { n: 4 })
    server.publish('chat', { n: 5 })

    // (4) Wait for the adapter to reconnect and re-subscribe with recovery.
    await wait(200)

    // The subscriber received the missed publications, in order, exactly once,
    // with no gaps and no dupes — appended after the pre-drop ones.
    expect(received).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }, { n: 5 }])

    // (5) The recovery re-subscribe carried recover:true with the LAST known
    //     position the client had before the drop (epoch from the first
    //     subscribe reply, offset of the last live publication = 2).
    const cmds = server.subscribeCommandsFor('chat')
    expect(cmds.length).toBe(2)
    expect(cmds[0]?.recover).toBeFalsy() // initial plain subscribe
    const recoverCmd = cmds[1]
    expect(recoverCmd.recover).toBe(true)
    expect(recoverCmd.epoch).toBe('epoch-1')
    expect(recoverCmd.offset).toBe(2)
  })

  it('continues delivering live publications after a recovery replay', async () => {
    const received: Array<unknown> = []
    client.subscribe('feed', (data) => received.push(data))
    await wait(60)

    server.publish('feed', 'a')
    await wait(60)
    expect(received).toEqual(['a'])

    server.dropConnection()
    server.publish('feed', 'b') // missed → replayed on recovery
    await wait(200)
    expect(received).toEqual(['a', 'b'])

    // Live publication after recovery is delivered normally (and only once).
    server.publish('feed', 'c')
    await wait(60)
    expect(received).toEqual(['a', 'b', 'c'])
  })

  it('recovers correctly across TWO reconnect cycles from the right offset each time', async () => {
    // Regression guard for the cmdChannels delete-after-read fix: deleting the
    // cmdChannels entry once a subscribe reply is processed must NOT break a
    // SECOND recovery round-trip. Each recover re-subscribe uses a fresh
    // command id and re-populates cmdChannels via resubscribeAll(), so the
    // second reconnect must still resolve to the channel and replay from the
    // correct, advanced offset.
    const received: Array<unknown> = []
    client.subscribe('room', (data) => received.push(data))
    await wait(60)

    // --- First gap ---
    server.publish('room', { n: 1 })
    await wait(60)
    expect(received).toEqual([{ n: 1 }])

    server.dropConnection()
    server.publish('room', { n: 2 }) // gap #1 → replayed on first recovery
    await wait(200)
    expect(received).toEqual([{ n: 1 }, { n: 2 }])

    // A live publication between the two drops, to advance the offset further.
    server.publish('room', { n: 3 })
    await wait(60)
    expect(received).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }])

    // --- Second gap ---
    server.dropConnection()
    server.publish('room', { n: 4 }) // gap #2 → replayed on second recovery
    await wait(200)
    expect(received).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }])

    // Two recover re-subscribes happened, each carrying recover:true and the
    // last-known offset BEFORE its respective drop (3 publications had been
    // seen before the first drop's offset advanced... offsets are 1 then 3).
    const cmds = server.subscribeCommandsFor('room')
    expect(cmds.length).toBe(3)
    expect(cmds[0]?.recover).toBeFalsy() // initial plain subscribe
    expect(cmds[1]?.recover).toBe(true) // first recovery
    expect(cmds[1]?.offset).toBe(1) // last seen offset before first drop
    expect(cmds[2]?.recover).toBe(true) // second recovery
    expect(cmds[2]?.offset).toBe(3) // last seen offset before second drop
  })
})
