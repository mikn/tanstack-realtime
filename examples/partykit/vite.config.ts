import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// examples/partykit is 2 levels below the repo root.
const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

// Resolve workspace packages from TypeScript source (no build step required).
// Unlike the SSE examples, this example has NO Vite server middleware — the
// realtime server is a separate PartyKit process (`partykit dev`, :1999).
const sourceAliases = {
  '@realtimejs/react': resolve(repoRoot, 'packages/react/src/index.ts'),
  '@realtimejs/core': resolve(repoRoot, 'packages/core/src/index.ts'),
  '@realtimejs/adapter-partykit': resolve(
    repoRoot,
    'packages/adapter-partykit/src/index.ts',
  ),
}

export default defineConfig({
  server: { port: 5176 },
  plugins: [react()],
  resolve: { alias: sourceAliases },
  // The PartyKit server entry (`src/party/server.ts`) is built/run by the
  // partykit CLI, not Vite. Keep it out of the client bundle.
  build: { rollupOptions: { external: [/\/party\//] } },
})
