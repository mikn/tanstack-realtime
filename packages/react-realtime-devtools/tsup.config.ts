import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  target: 'es2022',
  splitting: false,
  clean: true,
  external: [
    'react',
    '@tanstack/realtime',
    '@tanstack/react-realtime',
    '@tanstack/react-store',
  ],
})
