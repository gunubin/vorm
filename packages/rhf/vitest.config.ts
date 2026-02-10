import { defineConfig } from 'vitest/config';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@vorm/core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    typecheck: {
      enabled: true,
      include: ['src/__tests__/types/**/*.test.ts'],
    },
  },
});
