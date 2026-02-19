import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', '@tanstack/react-query', '@tanstack/realtime-client'],
  tsconfig: './tsconfig.json',
})
