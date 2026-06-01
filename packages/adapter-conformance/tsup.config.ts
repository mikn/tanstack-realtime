import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  target: 'es2022',
  splitting: false,
  clean: true,
  // vitest is a PEER dependency — the kit imports describe/it/expect from the
  // caller's vitest. Never bundle it.
  external: ['@realtimejs/core', 'vitest'],
})
