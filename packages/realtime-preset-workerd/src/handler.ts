import type { WorkerdHandlerOptions, WorkerdEnv } from './types.js'

/**
 * Create the `fetch` handler for a Cloudflare Worker that routes realtime
 * WebSocket connections and server-side publish requests to per-channel
 * {@link RealtimeChannel} Durable Objects.
 *
 * ## Example — `worker.ts`
 *
 * ```ts
 * import {
 *   RealtimeChannel,
 *   createWorkerdHandler,
 * } from '@tanstack/realtime-preset-workerd'
 *
 * export { RealtimeChannel }
 *
 * interface Env extends WorkerdEnv {
 *   AUTH_SECRET: string
 * }
 *
 * const handler = createWorkerdHandler<Env>({
 *   async getAuthToken(request) {
 *     return request.headers.get('Authorization')?.replace('Bearer ', '') ?? null
 *   },
 *   async authorize(token, channel) {
 *     const userId = await verifyToken(token)
 *     if (!userId) return null
 *     return { subscribe: true, publish: false, presence: true }
 *   },
 * })
 *
 * export default {
 *   fetch: handler.fetch,
 * }
 * ```
 *
 * ```toml
 * # wrangler.toml
 * [[durable_objects.bindings]]
 * name = "REALTIME_CHANNEL"
 * class_name = "RealtimeChannel"
 *
 * [[migrations]]
 * tag = "v1"
 * new_classes = ["RealtimeChannel"]
 * ```
 *
 * ## Routing
 *
 * | Method | Path | Description |
 * |--------|------|-------------|
 * | `GET` | `{path}/{channel}` | WebSocket upgrade (clients) |
 * | `POST` | `{path}/{channel}/publish` | Server-side push (internal only) |
 *
 * The channel segment is URL-encoded, so `todos?teamId=123` becomes
 * `todos%3FteamId%3D123` in the path.
 *
 * @param options - Auth hooks and path configuration.
 */
export function createWorkerdHandler<TEnv extends WorkerdEnv = WorkerdEnv>(
  options: WorkerdHandlerOptions,
): { fetch: (request: Request, env: TEnv, ctx: ExecutionContext) => Promise<Response> } {
  const pathPrefix = options.path ?? '/_realtime'

  return {
    async fetch(request: Request, env: TEnv): Promise<Response> {
      const url = new URL(request.url)

      if (!url.pathname.startsWith(pathPrefix)) {
        return new Response('Not found', { status: 404 })
      }

      // Strip path prefix and split off an optional "/publish" suffix.
      const rest = url.pathname.slice(pathPrefix.length).replace(/^\//, '')
      const isPublish = rest.endsWith('/publish')
      const encodedChannel = isPublish ? rest.slice(0, -'/publish'.length) : rest

      if (!encodedChannel) {
        return new Response('Channel required in path', { status: 400 })
      }

      const channel = decodeURIComponent(encodedChannel)

      // Authenticate and authorise before touching the DO.
      const token = await options.getAuthToken(request)
      const permissions = await options.authorize(token, channel)

      const isWsUpgrade = request.headers.get('Upgrade') === 'websocket'

      if (isWsUpgrade && !permissions?.subscribe) {
        return new Response('Unauthorized', { status: 401 })
      }

      if (isPublish && !permissions?.publish) {
        return new Response('Unauthorized', { status: 401 })
      }

      // Route to the per-channel DO instance.
      // The channel key IS the DO ID — one DO per channel (the granular key).
      const doId = env.REALTIME_CHANNEL.idFromName(channel)
      const stub = env.REALTIME_CHANNEL.get(doId)

      // Inject auth results as internal headers so the DO can trust them.
      const connectionId = crypto.randomUUID()
      const forwardHeaders = new Headers(request.headers)
      forwardHeaders.set('X-Realtime-Connection-Id', connectionId)
      forwardHeaders.set(
        'X-Realtime-Permissions',
        JSON.stringify(
          permissions ?? { subscribe: false, publish: false, presence: false },
        ),
      )

      return stub.fetch(new Request(request, { headers: forwardHeaders }))
    },
  }
}
