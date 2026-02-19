import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['packages/**/__tests__/**/*.test.ts'],
    // Run tests serially to avoid port conflicts between harnesses
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
  },
  resolve: {
    alias: {
      '@tanstack/realtime-core': resolve(root, 'packages/realtime-core/src/index.ts'),
      '@tanstack/realtime-client': resolve(root, 'packages/realtime-client/src/index.ts'),
      '@tanstack/realtime-server': resolve(root, 'packages/realtime-server/src/index.ts'),
    },
  },
})
