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
    alias: [
      // Subpath exports must be aliased before the bare package name.
      {
        find: /^@tanstack\/realtime\/react$/,
        replacement: resolve(root, 'packages/realtime/src/react/index.ts'),
      },
      {
        find: /^@tanstack\/realtime\/server$/,
        replacement: resolve(root, 'packages/realtime/src/server/index.ts'),
      },
      {
        find: /^@tanstack\/realtime$/,
        replacement: resolve(root, 'packages/realtime/src/index.ts'),
      },
      {
        find: /^@tanstack\/realtime-preset-node$/,
        replacement: resolve(
          root,
          'packages/realtime-preset-node/src/index.ts',
        ),
      },
    ],
  },
})
