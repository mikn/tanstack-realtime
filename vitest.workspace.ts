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
    find: /^@tanstack\/realtime-adapter-centrifugo$/,
    replacement: resolve(root, 'packages/realtime-adapter-centrifugo/src/index.ts'),
  },
]

export default defineWorkspace([
  // ── Node.js integration tests ────────────────────────────────────────────
  {
    test: {
      name: 'node',
      environment: 'node',
      globals: true,
      include: [
        'packages/__tests__/integration.test.ts',
        'packages/__tests__/stream.test.ts',
        'packages/__tests__/centrifugo.test.ts',
      ],
      pool: 'forks',
      poolOptions: { forks: { singleFork: true } },
    },
    resolve: { alias: sourceAliases },
  },

  // ── Centrifugo E2E tests (real binary) ──────────────────────────────────
  // Requires the Centrifugo binary to be pre-downloaded:
  //   npm run download-centrifugo
  // Then run with:
  //   npx vitest run --project centrifugo-e2e
  //
  // globalSetup starts an isolated Centrifugo instance on a free port and
  // tears it down after the suite. If the binary is absent, setup throws
  // immediately with an actionable error — nothing is downloaded here.
  {
    test: {
      name: 'centrifugo-e2e',
      environment: 'node',
      globals: true,
      include: ['packages/__tests__/centrifugo.e2e.test.ts'],
      globalSetup: ['packages/__tests__/centrifugo.globalSetup.ts'],
      pool: 'forks',
      poolOptions: { forks: { singleFork: true } },
    },
    resolve: { alias: sourceAliases },
  },

  // ── Workerd runtime compatibility tests ──────────────────────────────────
  // Runs inside the real workerd runtime via @cloudflare/vitest-pool-workers.
  // Verifies that nodeTransport from @tanstack/realtime-preset-node is
  // workerd-compatible: the "browser": { "ws": false } field in that
  // package's package.json tells wrangler's esbuild to exclude the `ws`
  // package, leaving the transport to use globalThis.WebSocket (which
  // exists in workerd) instead.
  //
  // NOTE: wrangler bundles via esbuild and resolves @tanstack/realtime-preset-node
  // from the built dist/ via the workspace symlink. Run `npm run build` before
  // this test project (CI does; locally: npm run build -w @tanstack/realtime-preset-node)
  defineWorkersProject({
    test: {
      name: 'workerd',
      globals: true,
      include: ['packages/__tests__/integration.workerd-client.test.ts'],
      poolOptions: {
        workers: {
          wrangler: { configPath: './wrangler.test.toml' },
        },
      },
    },
  }),
])
