import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@tanstack/start/config'

// packages/e2e/app is 3 levels below the repo root
const root = fileURLToPath(new URL('../../..', import.meta.url))

// Resolve workspace packages from TypeScript source (no build step required).
const sourceAliases = {
  '@tanstack/react-realtime': resolve(
    root,
    'packages/react-realtime/src/index.ts',
  ),
  '@tanstack/realtime': resolve(root, 'packages/realtime/src/index.ts'),
  '@tanstack/realtime-adapter-sse': resolve(
    root,
    'packages/realtime-adapter-sse/src/index.ts',
  ),
  '@tanstack/realtime-preset-start': resolve(
    root,
    'packages/realtime-preset-start/src/index.ts',
  ),
}

export default defineConfig({
  server: {
    port: 3000,
  },
  vite: {
    resolve: {
      alias: sourceAliases,
    },
  },
})
