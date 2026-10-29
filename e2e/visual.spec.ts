// Capturas para conferencia visual (375, 1024, 1366): abas da campanha (jogador e mestre), arma, veiculo, nave, login e salto.
import { test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { loginAs, newUserContext } from './helpers';

mkdirSync('e2e/screenshots', { recursive: true });
const SIZES = [{ n: '375', width: 375, height: 812 }, { n: '1024', width: 1024, height: 768 }, { n: '1366', width: 1366, height: 800 }];

for (const s of SIZES) {
  test(`visual ${s.n}`, async ({ browser }) => {
    const out = (name: string) => `e2e/screenshots/v-${s.n}-${name}.png`;
    const { ctx, page } = await newUserContext(browser, s);
    await page.goto('/entrar');
    await page.waitForTimeout(800);
    await page.screenshot({ path: out('login') });
    await page.getByLabel('E-mail').fill('jogador@r2d6.local');
    await page.getByLabel('Senha').fill(process.env.SEED_PASSWORD ?? 'r2d6-demo-2026');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.waitForTimeout(1250);
    await page.screenshot({ path: out('salto-a') });
    await page.waitForTimeout(250);
    await page.screenshot({ path: out('salto-b') });
    await page.waitForURL('**/', { timeout: 10000 });
    await page.goto('/campanhas');
    await page.getByTestId('campaign-link').first().click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: out('camp-mesa-jogador') });
    await page.getByRole('tab', { name: 'Grupo' }).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: out('camp-grupo-jogador') });
    for (const [p, n] of [['/consulta/weapons/blaster-pistol', 'arma'], ['/consulta/vehicles/at-at', 'veiculo'], ['/consulta/starships/delta-7-aethersprite-starfighter', 'nave']] as const) {
      await page.goto(p); await page.waitForTimeout(900); await page.screenshot({ path: out(n) });
    }
    await ctx.close();
    const gm = await loginAs(browser, 'mestre@r2d6.local', s);
    await gm.page.goto('/campanhas');
    await gm.page.getByTestId('campaign-link').first().click();
    await gm.page.getByRole('tab', { name: 'Console do mestre' }).click();
    await gm.page.waitForTimeout(1200);
    await gm.page.screenshot({ path: out('camp-console-mestre') });
    await gm.ctx.close();
  });
}
