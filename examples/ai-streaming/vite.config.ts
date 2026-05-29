import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createAiServer } from './src/server.js'
import type { Plugin } from 'vite'
import type { IncomingMessage } from 'node:http'

// examples/ai-streaming is 2 levels below the repo root.
const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

// Resolve workspace packages from TypeScript source (no build step required).
const sourceAliases = {
  '@realtimejs/react': resolve(repoRoot, 'packages/react/src/index.ts'),
  '@realtimejs/core': resolve(repoRoot, 'packages/core/src/index.ts'),
  '@realtimejs/adapter-sse': resolve(
    repoRoot,
    'packages/adapter-sse/src/index.ts',
  ),
}

/**
 * Bridges Node's `IncomingMessage`/`ServerResponse` to the Fetch-API server the
 * realtime handler speaks — the same proven pattern as the repo's e2e app.
 */
function realtimeServerPlugin(): Plugin {
  const server = createAiServer()

  async function toWebRequest(req: IncomingMessage): Promise<Request> {
    const chunks: Array<Buffer> = []
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      await new Promise<void>((res, rej) => {
        req.on('data', (c: Buffer) => chunks.push(c))
        req.on('end', res)
        req.on('error', rej)
      })
    }
    return new Request(`http://localhost:5175${req.url ?? '/'}`, {
      method: req.method ?? 'GET',
      headers: Object.fromEntries(
        Object.entries(req.headers)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : String(v)]),
      ),
      ...(chunks.length ? { body: Buffer.concat(chunks), duplex: 'half' } : {}),
    } as RequestInit)
  }

  return {
    name: 'realtime-api',
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '/'
        if (!url.startsWith('/api/')) return next()
        try {
          const webReq = await toWebRequest(req)
          const webRes = url.startsWith('/api/realtime')
            ? await server.handleRealtime(webReq)
            : ((await server.handleRest(webReq)) ??
              new Response('Not Found', { status: 404 }))

          const headers: Record<string, string> = {}
          webRes.headers.forEach((v, k) => {
            headers[k] = v
          })
          res.writeHead(webRes.status, headers)

          if (webRes.body) {
            const reader = webRes.body.getReader()
            req.on('close', () => void reader.cancel().catch(() => {}))
            try {
              for (;;) {
                const { done, value } = await reader.read()
                if (done) break
                res.write(value)
              }
            } catch {
              // client disconnected
            } finally {
              res.end()
            }
          } else {
            res.end()
          }
        } catch {
          if (!res.headersSent) res.writeHead(500)
          res.end()
        }
      })
    },
  }
}

export default defineConfig({
  server: { port: 5175 },
  plugins: [react(), realtimeServerPlugin()],
  resolve: { alias: sourceAliases },
})
