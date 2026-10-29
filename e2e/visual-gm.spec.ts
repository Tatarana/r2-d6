import { test } from '@playwright/test';
import { loginAs } from './helpers';

for (const [n, width, height] of [['375', 375, 812], ['1024', 1024, 768], ['1366', 1366, 800]] as const) {
  test(`console ${n}`, async ({ browser }) => {
    const gm = await loginAs(browser, 'mestre@r2d6.local', { width, height });
    await gm.page.goto('/campanhas');
    await gm.page.getByTestId('campaign-link').first().click();
    await gm.page.getByRole('tab', { name: 'Console do mestre' }).click();
    await gm.page.waitForTimeout(1500);
    await gm.page.screenshot({ path: `e2e/screenshots/v-${n}-camp-console-mestre.png` });
    await gm.ctx.close();
  });
}
