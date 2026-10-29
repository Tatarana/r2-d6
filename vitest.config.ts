import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // os testes de API compartilham o banco r2d6_test (TRUNCATE entre testes): um arquivo por vez
    fileParallelism: false,
    projects: [
      { test: { name: 'rules', include: ['packages/rules/tests/**/*.test.ts'], environment: 'node' } },
      { test: { name: 'data', include: ['packages/data/tests/**/*.test.ts'], environment: 'node' } },
      { test: { name: 'api', include: ['apps/api/tests/**/*.test.ts'], environment: 'node', fileParallelism: false, testTimeout: 30000, hookTimeout: 60000, globalSetup: ['apps/api/tests/global-setup.ts'] } },
    ],
  },
});
