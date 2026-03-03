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
        find: /^@tanstack\/react-realtime$/,
        replacement: resolve(root, 'packages/react-realtime/src/index.ts'),
      },
      {
        find: /^@tanstack\/realtime$/,
        replacement: resolve(root, 'packages/realtime/src/index.ts'),
      },
      {
        find: /^@tanstack\/realtime-preset-workerd$/,
        replacement: resolve(
          root,
          'packages/realtime-preset-workerd/src/index.ts',
        ),
      },
      {
        find: /^@tanstack\/realtime-adapter-centrifugo$/,
        replacement: resolve(
          root,
          'packages/realtime-adapter-centrifugo/src/index.ts',
        ),
      },
    ],
  },
})
