import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['packages/**/__tests__/**/*.test.ts'],
    setupFiles: ['packages/__tests__/setup.ts'],
    // Run tests serially to avoid port conflicts between harnesses
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
  },
  resolve: {
    alias: [
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
    ],
  },
})
