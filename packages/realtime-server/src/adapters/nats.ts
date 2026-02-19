import type { RealtimeAdapter, PresenceEvent } from '../types.js'

export interface NatsAdapterOptions {
  url: string
  invalidateSubject?: string
  presenceSubject?: string
}

/**
 * Minimal structural types for the parts of the NATS API this adapter uses.
 * Avoids a hard dependency on the `nats` package's type definitions while
 * still eliminating `any`.
 */
interface NatsMsg {
  data: Uint8Array
}

interface NatsSubscription extends AsyncIterable<NatsMsg> {}

interface NatsConnection {
  publish(subject: string, data: Uint8Array): void
  subscribe(subject: string): NatsSubscription
  drain(): Promise<void>
}

interface NatsStringCodec {
  encode(str: string): Uint8Array
  decode(data: Uint8Array): string
}

interface NatsModule {
  connect(opts: { servers: string }): Promise<NatsConnection>
  StringCodec(): NatsStringCodec
}

/**
 * NATS adapter for multi-instance deployments.
 * Requires the `nats` package to be installed.
 *
 * @example
 * ```ts
 * import { natsAdapter } from '@tanstack/realtime-server/adapters/nats'
 *
 * const realtime = createRealtimeServer({
 *   adapter: natsAdapter({ url: process.env.NATS_URL }),
 * })
 * ```
 */
export function natsAdapter(options: NatsAdapterOptions): RealtimeAdapter {
  const {
    url,
    invalidateSubject = 'tanstack.realtime.invalidate',
    presenceSubject = 'tanstack.realtime.presence',
  } = options

  let nc: NatsConnection | null = null
  let sc: NatsStringCodec | null = null

  async function connect() {
    if (nc) return
    // Dynamically import nats to avoid requiring it as a hard dep.
    // Uses an indirect import so TypeScript does not attempt to resolve the module.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const nats = await (new Function('m', 'return import(m)') as (m: string) => Promise<NatsModule>)('nats').catch(() => {
      throw new Error(
        'The `nats` package is required for natsAdapter. Install it with: npm install nats',
      )
    })
    nc = await nats.connect({ servers: url })
    sc = nats.StringCodec()
  }

  return {
    async publish(serializedKey: string): Promise<void> {
      await connect()
      nc!.publish(invalidateSubject, sc!.encode(serializedKey))
    },

    async subscribe(callback: (serializedKey: string) => void): Promise<void> {
      await connect()
      const sub = nc!.subscribe(invalidateSubject)
      ;(async () => {
        for await (const msg of sub) {
          callback(sc!.decode(msg.data))
        }
      })()
    },

    async publishPresence(
      channel: string,
      event: PresenceEvent,
    ): Promise<void> {
      await connect()
      nc!.publish(presenceSubject, sc!.encode(JSON.stringify({ channel, event })))
    },

    async subscribePresence(
      callback: (channel: string, event: PresenceEvent) => void,
    ): Promise<void> {
      await connect()
      const sub = nc!.subscribe(presenceSubject)
      ;(async () => {
        for await (const msg of sub) {
          const { channel, event } = JSON.parse(sc!.decode(msg.data)) as { channel: string; event: PresenceEvent }
          callback(channel, event)
        }
      })()
    },

    async close(): Promise<void> {
      if (nc) {
        await nc.drain()
        nc = null
      }
    },
  }
}
