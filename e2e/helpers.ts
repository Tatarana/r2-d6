import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: join(root, '.env'), quiet: true });
export const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? 'r2d6-demo-2026';

export async function login(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Bem-vindo de volta/i })).toBeVisible();
}

export async function newUserContext(browser: Browser, viewport = { width: 1366, height: 800 }): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext({ viewport, locale: 'pt-BR', baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173' });
  return { ctx, page: await ctx.newPage() };
}

export async function loginAs(browser: Browser, email: string, viewport?: { width: number; height: number }) {
  const r = await newUserContext(browser, viewport);
  await login(r.page, email);
  return r;
}

/** Espera o indicador de sincronia ficar "Sincronizado" (fila vazia). */
export const waitSynced = (page: Page) => expect(page.getByTestId('sync-indicator').first()).toHaveAttribute('data-sync', 'Sincronizado', { timeout: 15_000 });
