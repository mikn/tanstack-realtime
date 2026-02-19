import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'adapters/nats': 'src/adapters/nats.ts',
    'adapters/memory': 'src/adapters/memory.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['ws', '@tanstack/realtime-core'],
  tsconfig: './tsconfig.json',
})
