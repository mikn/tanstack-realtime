import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base so built assets resolve at any path depth: the prod root
  // (/tanstack-realtime/) and per-PR preview subdirs
  // (/tanstack-realtime/pr-preview/pr-N/). The docs SPA uses a hash router,
  // so there is no server-side routing — only index.html + relative assets.
  base: './',
  build: { outDir: 'dist' },
})
