import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  target: 'es2022',
  splitting: false,
  clean: true,
  // cloudflare:workers is a virtual module resolved by the workerd runtime.
  // @tanstack/realtime and @tanstack/store are peer workspace packages.
  external: ['cloudflare:workers', '@tanstack/realtime', '@tanstack/store'],
})
