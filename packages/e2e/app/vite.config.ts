import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { createStartHandler } from '@tanstack/realtime-preset-start'
import type { IncomingMessage, ServerResponse } from 'node:http'

// packages/e2e/app is 3 levels below the repo root
const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))

// Resolve workspace packages from TypeScript source (no build step required).
const sourceAliases = {
  '@tanstack/react-realtime': resolve(
    repoRoot,
    'packages/react-realtime/src/index.ts',
  ),
  '@tanstack/realtime': resolve(repoRoot, 'packages/realtime/src/index.ts'),
  '@tanstack/realtime-adapter-sse': resolve(
    repoRoot,
    'packages/realtime-adapter-sse/src/index.ts',
  ),
  '@tanstack/realtime-preset-start': resolve(
    repoRoot,
    'packages/realtime-preset-start/src/index.ts',
  ),
}

const realtime = createStartHandler({ pingInterval: 0 })

export default defineConfig({
  server: { port: 3000 },
  plugins: [
    TanStackRouterVite({
      routesDirectory: './app/routes',
      generatedRouteTree: './app/routeTree.gen.ts',
    }),
    react(),
    {
      name: 'realtime-api',
      configureServer(server) {
        server.middlewares.use(
          '/api/realtime',
          async (req: IncomingMessage, res: ServerResponse) => {
            if (req.method === 'OPTIONS') {
              res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              })
              res.end()
              return
            }

            try {
              const bodyChunks: Array<Buffer> = []
              if (req.method !== 'GET' && req.method !== 'HEAD') {
                await new Promise<void>((resolve, reject) => {
                  req.on('data', (chunk: Buffer) => bodyChunks.push(chunk))
                  req.on('end', resolve)
                  req.on('error', reject)
                })
              }

              const webRequest = new Request(
                `http://localhost:3000${req.url ?? '/api/realtime'}`,
                {
                  method: req.method ?? 'GET',
                  headers: Object.fromEntries(
                    Object.entries(req.headers)
                      .filter(([, v]) => v !== undefined)
                      .map(([k, v]) => [
                        k,
                        Array.isArray(v) ? v.join(', ') : String(v),
                      ]),
                  ),
                  ...(bodyChunks.length
                    ? { body: Buffer.concat(bodyChunks), duplex: 'half' }
                    : {}),
                } as RequestInit,
              )

              const webResponse = await realtime.handle(webRequest)

              const headers: Record<string, string | Array<string>> = {}
              webResponse.headers.forEach((v, k) => {
                headers[k] = v
              })
              res.writeHead(webResponse.status, headers)

              if (webResponse.body) {
                const reader = webResponse.body.getReader()
                req.on('close', () => {
                  reader.cancel().catch(() => {})
                })
                try {
                  for (;;) {
                    const { done, value } = await reader.read()
                    if (done) break
                    res.write(value)
                  }
                } catch {
                  // connection closed by client
                } finally {
                  res.end()
                }
              } else {
                res.end()
              }
            } catch {
              if (!res.headersSent) {
                res.writeHead(500)
              }
              res.end()
            }
          },
        )
      },
    },
  ],
  resolve: { alias: sourceAliases },
})
