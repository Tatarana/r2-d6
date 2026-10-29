// Confere as tres larguras (375 celular, 768 e 1024 tablet, 1366 PC): sem scroll horizontal, navegacao por plataforma e capturas em e2e/screenshots.
import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { loginAs } from './helpers';

const SIZES = [
  { name: 'celular-375', width: 375, height: 812, nav: 'bottom' },
  { name: 'tablet-768', width: 768, height: 1024, nav: 'tabs' },
  { name: 'tablet-1024', width: 1024, height: 768, nav: 'tabs' },
  { name: 'pc-1366', width: 1366, height: 800, nav: 'side' },
] as const;

mkdirSync('e2e/screenshots', { recursive: true });

for (const s of SIZES) {
  test(`layout ${s.name}`, async ({ browser }) => {
    const { ctx, page } = await loginAs(browser, 'jogador@r2d6.local', { width: s.width, height: s.height });
    const noOverflow = async (label: string) => {
      const bad = await page.evaluate(() => {
        const W = document.documentElement.clientWidth;
        if (document.documentElement.scrollWidth <= W + 1) return [];
        const out: string[] = [];
        document.querySelectorAll('body *').forEach((e) => { const r = e.getBoundingClientRect(); if (r.right > W + 1 && r.width > 0 && !(e.closest('[data-art]'))) out.push(`${e.tagName}.${String(e.className).slice(0, 50)} right=${Math.round(r.right)}`); });
        return out.slice(0, 6);
      });
      expect(bad, `${s.name}: scroll horizontal em ${label}`).toEqual([]);
    };

    // navegacao por plataforma
    const nav = s.nav === 'side' ? page.getByRole('complementary', { name: 'Navegação principal' }) : page.getByRole('navigation', { name: 'Navegação principal' });
    await expect(nav).toBeVisible();
    const box = (await nav.boundingBox())!;
    if (s.nav === 'bottom') expect(box.y).toBeGreaterThan(s.height - 120);
    if (s.nav === 'side') { expect(box.x).toBeLessThan(5); expect(box.height).toBeGreaterThan(200); }
    if (s.nav === 'tabs') expect(box.y).toBeLessThan(120);

    await page.waitForTimeout(700);
    await noOverflow('hangar');
    await page.screenshot({ path: `e2e/screenshots/${s.name}-hangar.png` });

    await page.getByTestId('holocard').first().click();
    await expect(page.getByLabel('Nome do personagem')).toBeVisible();
    await noOverflow('ficha');
    await page.screenshot({ path: `e2e/screenshots/${s.name}-ficha.png` });

    await page.getByRole('link', { name: 'Modo mesa' }).click();
    await expect(page.getByTestId('roll-button')).toBeVisible();
    await page.getByTestId('roll-button').click();
    await expect(page.getByTestId('result')).toBeVisible();
    await page.waitForTimeout(1300);
    await noOverflow('mesa');
    await page.screenshot({ path: `e2e/screenshots/${s.name}-mesa.png` });

    await page.goto('/campanhas');
    await page.getByTestId('campaign-link').first().click();
    await expect(page.getByTestId('campaign-name')).toBeVisible();
    await page.waitForTimeout(500);
    await noOverflow('campanha');
    await page.screenshot({ path: `e2e/screenshots/${s.name}-campanha.png` });

    await page.goto('/criar');
    await page.getByRole('button', { name: /Por template/ }).click();
    await page.waitForTimeout(400);
    await noOverflow('assistente');
    await page.screenshot({ path: `e2e/screenshots/${s.name}-criar.png` });

    await page.goto('/consulta');
    await page.waitForTimeout(400);
    await noOverflow('consulta');
    await ctx.close();
  });
}
