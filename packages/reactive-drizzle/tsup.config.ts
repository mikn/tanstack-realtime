import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  target: 'es2022',
  splitting: false,
  clean: true,
  external: ['@realtimejs/core', 'drizzle-orm', 'pgsql-ast-parser'],
})
