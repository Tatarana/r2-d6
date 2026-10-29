import { defineConfig, devices } from '@playwright/test';

// E2E contra a stack de dev (docker compose up -d + npm run dev). Reaproveita servidores ja ligados.
export default defineConfig({
  testDir: './e2e',
  timeout: 150_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  outputDir: 'test-results',
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173', trace: 'retain-on-failure', locale: 'pt-BR', viewport: { width: 1366, height: 800 } },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 800 } } }],
  webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true, timeout: 240_000 },
});
