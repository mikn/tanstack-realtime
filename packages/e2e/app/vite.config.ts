import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// vite.config.ts is at packages/e2e/app/vite.config.ts
// Three levels up  →  repo root
const root = fileURLToPath(new URL('../../..', import.meta.url))

// Mirror the aliases from vitest.workspace.ts so the Vite dev server resolves
// workspace packages from TypeScript source (no build step required).
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
    find: /^@tanstack\/realtime-adapter-centrifugo$/,
    replacement: resolve(
      root,
      'packages/realtime-adapter-centrifugo/src/index.ts',
    ),
  },
]

export default defineConfig({
  plugins: [react()],
  resolve: { alias: sourceAliases },
  server: { port: 5173 },
})
