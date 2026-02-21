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
        replacement: resolve(
          root,
          'packages/realtime-preset-node/src/index.ts',
        ),
      },
    ],
  },
})
