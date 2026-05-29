import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts', 'server/index': 'src/server/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  target: 'es2022',
  splitting: false,
  clean: true,
  external: ['@standard-schema/spec', '@tanstack/db', '@tanstack/store'],
})
