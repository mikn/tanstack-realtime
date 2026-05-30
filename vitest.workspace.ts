import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineWorkspace } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

// Source aliases so tests run against TypeScript source without a prior build.
const sourceAliases = [
  {
    find: /^@realtimejs\/react$/,
    replacement: resolve(root, 'packages/react/src/index.ts'),
  },
  {
    find: /^@realtimejs\/core$/,
    replacement: resolve(root, 'packages/core/src/index.ts'),
  },
  {
    find: /^@realtimejs\/adapter-centrifugo$/,
    replacement: resolve(root, 'packages/adapter-centrifugo/src/index.ts'),
  },
  {
    find: /^@realtimejs\/adapter-sse$/,
    replacement: resolve(root, 'packages/adapter-sse/src/index.ts'),
  },
  {
    find: /^@realtimejs\/adapter-conformance$/,
    replacement: resolve(root, 'packages/adapter-conformance/src/index.ts'),
  },
  {
    find: /^@realtimejs\/preset-start$/,
    replacement: resolve(root, 'packages/preset-start/src/index.ts'),
  },
  {
    find: /^@realtimejs\/reactive-drizzle$/,
    replacement: resolve(root, 'packages/reactive-drizzle/src/index.ts'),
  },
  {
    find: /^@realtimejs\/react-devtools$/,
    replacement: resolve(root, 'packages/react-devtools/src/index.ts'),
  },
  {
    find: /^@realtimejs\/vue$/,
    replacement: resolve(root, 'packages/vue/src/index.ts'),
  },
  {
    find: /^@realtimejs\/vue-devtools$/,
    replacement: resolve(root, 'packages/vue-devtools/src/index.ts'),
  },
]

export default defineWorkspace([
  // ── Node.js integration tests ────────────────────────────────────────────
  {
    test: {
      name: 'node',
      environment: 'node',
      globals: true,
      setupFiles: ['packages/__tests__/setup.ts'],
      include: [
        'packages/__tests__/stream.test.ts',
        'packages/__tests__/centrifugo.test.ts',
        'packages/__tests__/centrifugoConformance.test.ts',
        'packages/__tests__/conformance.test.ts',
        'packages/__tests__/dedup.test.ts',
        'packages/__tests__/offlineQueue.test.ts',
        'packages/__tests__/throttle.test.ts',
        'packages/__tests__/ephemeral.test.ts',
        'packages/__tests__/gapRecovery.test.ts',
        'packages/__tests__/optimistic.test.ts',
        'packages/__tests__/derived.test.ts',
        'packages/__tests__/liveChannel.test.ts',
        'packages/__tests__/sharedTransport.test.ts',
        'packages/__tests__/hasPresence.test.ts',
        'packages/__tests__/capabilities.test.ts',
        'packages/__tests__/realtimeCollectionOnMessage.test.ts',
        'packages/__tests__/presenceCollection.test.ts',
        'packages/__tests__/ephemeralLive.test.ts',
        'packages/__tests__/sharedWorkerFallback.test.ts',
        'packages/__tests__/sse.test.ts',
        'packages/__tests__/spectrum.test.ts',
        'packages/__tests__/docsExamples.test.ts',
        'packages/__tests__/broadcastChannelTransport.test.ts',
        'packages/__tests__/offlineQueueStorage.test.ts',
        'packages/__tests__/validation.test.ts',
        'packages/__tests__/optimisticMode.test.ts',
        'packages/__tests__/serverStream.test.ts',
        'packages/__tests__/streamResilience.test.ts',
        'packages/__tests__/tickTransport.test.ts',
        'packages/__tests__/coreInvariants.test.ts',
        'packages/__tests__/startPreset.test.ts',
        'packages/__tests__/testingUtils.test.ts',
        'packages/__tests__/subscribeError.test.ts',
        'packages/__tests__/unifiedAuthorize.test.ts',
        'packages/__tests__/lifecycleHooks.test.ts',
        'packages/__tests__/deriveChannelFromUrl.test.ts',
        'packages/__tests__/reactHooks.test.ts',
        'packages/__tests__/solidPrimitives.test.ts',
        'packages/__tests__/vuePrimitives.test.ts',
        'packages/__tests__/reactiveLayer.test.ts',
        'packages/__tests__/reactiveQuery.test.ts',
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
])
