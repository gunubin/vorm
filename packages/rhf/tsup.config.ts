import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  outDir: 'dist',
  external: ['react', 'react-hook-form', '@gunubin/vorm-core', '@gunubin/vorm-form'],
});
