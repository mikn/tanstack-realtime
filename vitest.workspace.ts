import { defineWorkspace } from 'vitest/config'
import { defineWorkersProject } from '@cloudflare/vitest-pool-workers/config'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const root = fileURLToPath(new URL('.', import.meta.url))

// Source aliases so tests run against TypeScript source without a prior build.
const sourceAliases = [
  {
    find: /^@tanstack\/react-realtime$/,
    replacement: resolve(root, 'packages/react-realtime/src/index.ts'),
  },
  {
    find: /^@tanstack\/realtime$/,
    replacement: resolve(root, 'packages/realtime/src/index.ts'),
  },
  {
    find: /^@tanstack\/realtime-preset-node$/,
    replacement: resolve(root, 'packages/realtime-preset-node/src/index.ts'),
  },
  {
    find: /^@tanstack\/realtime-preset-workerd$/,
    replacement: resolve(root, 'packages/realtime-preset-workerd/src/index.ts'),
  },
]

export default defineWorkspace([
  // ── Node.js integration tests ────────────────────────────────────────────
  // Defined inline (not via `extends`) so the `include` list is authoritative
  // and the workerd-do test never leaks into this project.
  {
    test: {
      name: 'node',
      environment: 'node',
      globals: true,
      include: [
        'packages/__tests__/integration.test.ts',
        'packages/__tests__/integration.workerd.test.ts',
      ],
      pool: 'forks',
      poolOptions: { forks: { singleFork: true } },
    },
    resolve: { alias: sourceAliases },
  },

  // ── Workerd / miniflare DO tests ─────────────────────────────────────────
  // Runs inside the real workerd runtime via @cloudflare/vitest-pool-workers.
  // Tests the actual RealtimeChannel Durable Object and createWorkerdHandler
  // using SELF.fetch() — exercises WebSocketPair, ctx.acceptWebSocket,
  // serializeAttachment, idFromName routing, and the full wire protocol.
  //
  // NOTE: wrangler resolves @tanstack/realtime-preset-workerd from the built
  // dist/ via the workspace symlink. Run `npm run build` before this runs —
  // the CI build step handles it; for local dev run:
  //   npm run build -w @tanstack/realtime-preset-workerd
  defineWorkersProject({
    test: {
      name: 'workerd',
      globals: true,
      include: ['packages/__tests__/integration.workerd-do.test.ts'],
      poolOptions: {
        workers: {
          wrangler: { configPath: './wrangler.test.toml' },
        },
      },
    },
  }),
])
