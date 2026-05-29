import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createStartHandler } from '@realtimejs/preset-start'
import type { IncomingMessage, ServerResponse } from 'node:http'

// packages/e2e/app-vue is 3 levels below the repo root
const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))

const sourceAliases = {
  '@realtimejs/vue': resolve(repoRoot, 'packages/vue/src/index.ts'),
  '@realtimejs/core': resolve(repoRoot, 'packages/core/src/index.ts'),
  '@realtimejs/adapter-sse': resolve(
    repoRoot,
    'packages/adapter-sse/src/index.ts',
  ),
  '@realtimejs/preset-start': resolve(
    repoRoot,
    'packages/preset-start/src/index.ts',
  ),
}

const realtime = createStartHandler({ pingInterval: 0 })

export default defineConfig({
  server: { port: 3002 },
  plugins: [
    vue(),
    {
      name: 'realtime-api',
      configureServer(server) {
        server.middlewares.use(
          '/api/core',
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
                `http://localhost:3002${req.url ?? '/api/core'}`,
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
              if (!res.headersSent) res.writeHead(500)
              res.end()
            }
          },
        )
      },
    },
  ],
  resolve: { alias: sourceAliases },
})
