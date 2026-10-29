import { expect, test } from '@playwright/test';
import { DEMO_PASSWORD, loginAs, newUserContext, waitSynced } from './helpers';

test('cadastro de usuário novo, criar personagem por template e ver a ficha vinda do servidor após recarregar', async ({ browser }) => {
  const { ctx, page } = await newUserContext(browser);
  const email = `e2e-${Date.now()}@teste.local`;
  await page.goto('/cadastro');
  await page.getByLabel('Nome de exibição').fill('Teste E2E');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/^Senha/).fill(DEMO_PASSWORD);
  await page.getByLabel('Repita a senha').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: /Bem-vindo de volta, Teste/i })).toBeVisible();
  await expect(page.getByText('Nenhum personagem no hangar')).toBeVisible();

  // assistente: template -> 8 passos -> salvar
  await page.getByRole('link', { name: /Novo personagem|Criar o primeiro/ }).first().click();
  await page.getByRole('button', { name: /Por template/ }).click();
  await page.getByTestId('tpl-smuggler').click();
  for (let i = 0; i < 4; i++) await page.getByTestId('next-step').click(); // origem, espécie, atributos, perícias
  await page.getByRole('radio', { name: /Não \(1 Force Point\)/ }).check(); // template sem sensibilidade fixa
  for (let i = 0; i < 2; i++) await page.getByTestId('next-step').click(); // força, equipamento
  await page.getByLabel('Nome *').fill('Hana Teste');
  await page.getByTestId('next-step').click();
  await expect(page.getByText('Sem erros.')).toBeVisible();
  await page.getByTestId('save-character').click();
  await expect(page.getByLabel('Nome do personagem')).toHaveValue('Hana Teste');
  await waitSynced(page);

  // o servidor tem a ficha
  const api = await page.request.get('/api/characters');
  const list = (await api.json()).characters;
  expect(list.map((c: any) => c.name)).toEqual(['Hana Teste']);

  // outro aparelho (contexto novo: sem IndexedDB) so tem a conta; a ficha vem do servidor
  const state = await ctx.storageState();
  const ctx2 = await browser.newContext({ storageState: state, baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173' });
  const p2 = await ctx2.newPage();
  await p2.goto('/');
  await expect(p2.getByTestId('holocard').filter({ hasText: 'Hana Teste' })).toBeVisible();
  await p2.reload();
  await expect(p2.getByTestId('holocard').filter({ hasText: 'Hana Teste' })).toBeVisible();
  await ctx2.close(); await ctx.close();
});

test('entrar na campanha demo por convite e ver uma rolagem chegar em tempo real para o mestre e decidir o Wild Die 1', async ({ browser }) => {
  const gm = await loginAs(browser, 'mestre@r2d6.local');
  const pl = await loginAs(browser, 'jogador@r2d6.local');

  // mestre abre a campanha demo e fica no feed
  await gm.page.goto('/campanhas');
  await gm.page.getByTestId('campaign-link').first().click();
  await expect(gm.page.getByTestId('campaign-name')).toContainText('Demo');
  await gm.page.getByRole('tab', { name: 'Console do mestre' }).click();
  await expect(gm.page.getByTestId('party-card').first()).toBeVisible();
  await gm.page.getByRole('tab', { name: 'Mesa' }).click();

  // jogador abre o modo mesa e registra uma rolagem com dados fisicos (Wild Die 1)
  await pl.page.getByTestId('holocard').first().click();
  await pl.page.getByRole('link', { name: 'Modo mesa' }).click();
  await pl.page.getByRole('button', { name: 'Dados físicos' }).click();
  const n = await pl.page.getByRole('textbox', { name: /^Dado normal/ }).count();
  for (let i = 1; i <= n; i++) await pl.page.getByRole('textbox', { name: `Dado normal ${i}` }).fill('4');
  await pl.page.getByRole('textbox', { name: 'Wild Die', exact: true }).fill('1');
  await pl.page.getByTestId('roll-button').click();
  await expect(pl.page.getByTestId('result')).toBeVisible();
  await expect(pl.page.getByTestId('result').getByText(/Aguardando a decisão do mestre/)).toBeVisible();

  // chega ao mestre sem recarregar, com o pedido de decisão
  const rollId = await pl.page.getByTestId('result').getAttribute('data-roll-id');
  const item = gm.page.locator(`[data-roll-id="${rollId}"]`);
  await expect(item).toBeVisible({ timeout: 8_000 });
  await expect(item.getByTestId('feed-total')).toHaveAccessibleName(/aguardando/);
  await expect(item.getByTestId('roll-seal')).toContainText('dados físicos');
  await item.locator('[data-choice="subtract"]').click();

  // o jogador recebe o total decidido (sem o 1 e sem o maior dado)
  await expect(pl.page.getByTestId('total')).toBeVisible({ timeout: 8_000 });
  const total = Number(await pl.page.getByTestId('total').innerText());
  expect(total).toBeGreaterThan(0);
  await expect(gm.page.locator(`[data-roll-id="${rollId}"]`).getByTestId('feed-total')).toHaveText(String(total));
  await gm.ctx.close(); await pl.ctx.close();
});

test('rolagem digital no servidor aparece no feed do outro usuário; mestre concede CP e o jogador vê na hora', async ({ browser }) => {
  const gm = await loginAs(browser, 'mestre@r2d6.local');
  const pl = await loginAs(browser, 'jogador@r2d6.local');
  await gm.page.goto('/campanhas');
  await gm.page.getByTestId('campaign-link').first().click();
  await pl.page.getByTestId('holocard').first().click();
  await pl.page.getByRole('link', { name: 'Modo mesa' }).click();
  const cpBefore = Number(await pl.page.getByTestId('cp').innerText());
  const before = await gm.page.getByTestId('feed-item').count();
  await pl.page.getByTestId('roll-button').click();
  await expect(pl.page.getByTestId('result').getByTestId('roll-seal')).toContainText('servidor');
  await expect(gm.page.getByTestId('feed-item')).toHaveCount(before + 1, { timeout: 8_000 });

  await gm.page.getByRole('tab', { name: 'Console do mestre' }).click();
  // concessao do mestre: +1 CP no cartao do personagem do jogador
  await gm.page.getByTestId('party-card').filter({ hasText: 'Kael Varn' }).getByRole('button', { name: '+1 CP' }).click();
  await expect(pl.page.getByTestId('cp')).toHaveText(String(cpBefore + 1), { timeout: 8_000 });
  await gm.ctx.close(); await pl.ctx.close();
});

test('offline: marca munição sem rede, fica na fila e sincroniza quando a rede volta', async ({ browser }) => {
  const pl = await loginAs(browser, 'jogador@r2d6.local');
  await pl.page.getByTestId('holocard').first().click();
  await pl.page.getByRole('link', { name: 'Modo mesa' }).click();
  await waitSynced(pl.page);
  const out = pl.page.getByLabel(/tiros$/).first();
  const before = await out.innerText();
  await pl.ctx.setOffline(true);
  await pl.page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await pl.page.getByRole('button', { name: /Atirar com/ }).first().click();
  await expect(pl.page.getByTestId('sync-indicator').first()).toContainText(/na fila/);
  expect(await out.innerText()).not.toBe(before);
  await pl.ctx.setOffline(false);
  await pl.page.evaluate(() => window.dispatchEvent(new Event('online')));
  await waitSynced(pl.page);
  // no servidor
  const chars = (await (await pl.page.request.get('/api/characters')).json()).characters;
  const full = (await (await pl.page.request.get(`/api/characters/${chars[0].id}`)).json()).character;
  expect(full.sheet.weapons[0].ammo_used).toBeGreaterThanOrEqual(1);
  await pl.ctx.close();
});

test('acessibilidade básica: sem erros de console e sem scroll horizontal na ficha', async ({ browser }) => {
  const pl = await loginAs(browser, 'jogador@r2d6.local');
  const errors: string[] = [];
  pl.page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await pl.page.getByTestId('holocard').first().click();
  await expect(pl.page.getByLabel('Nome do personagem')).toBeVisible();
  const overflow = await pl.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
  await pl.ctx.close();
});

test('dois aparelhos do mesmo usuário: munição marcada em um aparece no outro em tempo real', async ({ browser }) => {
  const a = await loginAs(browser, 'jogador@r2d6.local');
  const b = await loginAs(browser, 'jogador@r2d6.local');
  for (const x of [a, b]) { await x.page.getByTestId('holocard').first().click(); await x.page.getByRole('link', { name: 'Modo mesa' }).click(); await waitSynced(x.page); }
  const out = (p: typeof a.page) => p.getByLabel(/tiros$/).first();
  const before = await out(b.page).innerText();
  await a.page.getByRole('button', { name: /Atirar com/ }).first().click();
  await expect(async () => expect(await out(b.page).innerText()).not.toBe(before)).toPass({ timeout: 10_000 });
  expect(await out(b.page).innerText()).toBe(await out(a.page).innerText());
  await a.ctx.close(); await b.ctx.close();
});

test('conflito de sincronização: o mesmo campo editado offline e em outro aparelho abre a escolha "manter o meu / do servidor"', async ({ browser }) => {
  const a = await loginAs(browser, 'jogador@r2d6.local');
  const b = await loginAs(browser, 'jogador@r2d6.local');
  for (const x of [a, b]) { await x.page.getByTestId('holocard').first().click(); await expect(x.page.getByLabel('Nome do personagem')).toBeVisible(); await waitSynced(x.page); }
  const field = (p: typeof a.page) => p.getByLabel('Background', { exact: true });
  const tag = Date.now();
  const tablet = `versão do tablet ${tag}`, celular = `versão do celular ${tag}`;
  // A fica offline e edita; B edita o mesmo campo online
  await a.ctx.setOffline(true);
  await a.page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await field(a.page).fill(tablet); await field(a.page).blur();
  await expect(a.page.getByTestId('sync-indicator').first()).toContainText(/na fila/);
  await field(b.page).fill(celular); await field(b.page).blur();
  const cid = (await (await b.page.request.get('/api/characters')).json()).characters[0].id;
  await expect.poll(async () => (await (await b.page.request.get(`/api/characters/${cid}`)).json()).character.sheet.background, { timeout: 15_000 }).toBe(celular); // já no servidor
  await a.ctx.setOffline(false);
  await a.page.evaluate(() => window.dispatchEvent(new Event('online')));
  const dlg = a.page.getByRole('dialog', { name: 'Conflito de edição' });
  await expect(dlg).toBeVisible({ timeout: 15_000 });
  await expect(dlg).toContainText(celular);
  await dlg.getByLabel(/Manter o meu/).check();
  await dlg.getByRole('button', { name: 'Aplicar escolhas' }).click();
  await expect(dlg).toBeHidden();
  await waitSynced(a.page);
  const chars = (await (await a.page.request.get('/api/characters')).json()).characters;
  const full = (await (await a.page.request.get(`/api/characters/${chars[0].id}`)).json()).character;
  expect(full.sheet.background).toBe(tablet);
  await a.ctx.close(); await b.ctx.close();
});

test('retrato: envia imagem pela ficha, aparece no Hangar; arquivo falso é recusado com mensagem', async ({ browser }) => {
  const { default: sharp } = await import('sharp');
  const png = await sharp({ create: { width: 400, height: 500, channels: 3, background: '#7a3355' } }).png().toBuffer();
  const pl = await loginAs(browser, 'mestre@r2d6.local');
  await pl.page.getByTestId('holocard').first().click();
  await pl.page.getByLabel('Enviar retrato').setInputFiles({ name: 'retrato.png', mimeType: 'image/png', buffer: png });
  await expect(pl.page.locator('img[src^="/api/media/"]').first()).toBeVisible({ timeout: 12_000 });
  await pl.page.getByLabel('Enviar retrato').setInputFiles({ name: 'falso.png', mimeType: 'image/png', buffer: Buffer.from('isto não é uma imagem') });
  await expect(pl.page.getByRole('alert').filter({ hasText: /não é uma imagem válida/ })).toBeVisible({ timeout: 12_000 });
  await pl.page.goto('/');
  await expect(pl.page.locator('[data-testid="holocard"] img[src^="/api/media/"]').first()).toBeVisible();
  await pl.ctx.close();
});

test('páginas de apoio: Holocron "em breve", glossário, consulta/busca e /dev/art', async ({ browser }) => {
  const pl = await loginAs(browser, 'jogador@r2d6.local');
  await pl.page.goto('/holocron');
  await expect(pl.page.getByTestId('holocron-soon')).toBeVisible();
  await pl.page.goto('/glossario');
  await expect(pl.page.getByText('Die code').first()).toBeVisible();
  await pl.page.goto('/consulta');
  await pl.page.getByLabel('Buscar na consulta').fill('wild die');
  await expect(pl.page.getByText('The Wild Die').first()).toBeVisible();
  await pl.page.keyboard.press('Escape');
  await pl.page.goto('/dev/art');
  await expect(pl.page.getByTestId('art-list').locator('li')).toHaveCount(568);
  await expect(pl.page.getByTestId('art-count')).toContainText('0/568 prontos');
  await pl.ctx.close();
});

test('abas da campanha têm propósitos distintos para jogador e mestre', async ({ browser }) => {
  const pl = await loginAs(browser, 'jogador@r2d6.local');
  await pl.page.goto('/campanhas');
  await pl.page.getByTestId('campaign-link').first().click();
  await expect(pl.page.locator('[data-view="mesa"]')).toBeVisible();
  await expect(pl.page.getByTestId('party-card')).toHaveCount(0); // Mesa = feed + faixa compacta
  await pl.page.getByRole('tab', { name: 'Grupo' }).click();
  await expect(pl.page.locator('[data-view="grupo"]')).toBeVisible();
  await expect(pl.page.getByTestId('rich-card').first()).toContainText('Perícias');
  await expect(pl.page.getByTestId('rich-card')).toHaveCount(2);
  await expect(pl.page.getByTestId('feed')).toHaveCount(0);
  const gm = await loginAs(browser, 'mestre@r2d6.local');
  await gm.page.goto('/campanhas');
  await gm.page.getByTestId('campaign-link').first().click();
  await gm.page.getByRole('tab', { name: 'Console do mestre' }).click();
  await expect(gm.page.locator('[data-view="console"]')).toBeVisible();
  await expect(gm.page.getByRole('button', { name: 'Conceder / ferir' }).first()).toBeVisible();
  await expect(gm.page.getByRole('button', { name: 'Stun' }).first()).toBeVisible();
  await pl.ctx.close(); await gm.ctx.close();
});

test('login: Google desabilitado sem credenciais, estrelas animadas e salto ao entrar', async ({ browser }) => {
  const { ctx, page } = await newUserContext(browser);
  await page.goto('/entrar');
  await expect(page.getByTestId('hyperspace-canvas')).toBeVisible();
  await expect(page.getByTestId('google-button')).toBeDisabled();
  await page.getByLabel('E-mail').fill('jogador@r2d6.local');
  await page.getByLabel('Senha').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForTimeout(600);
  expect(page.url()).toContain('/entrar'); // ainda no salto
  await expect(page.getByRole('heading', { name: /Bem-vindo de volta/i })).toBeVisible({ timeout: 8_000 });
  await page.goto('/cadastro');
  await expect(page.getByTestId('google-button')).toContainText('Cadastrar com Google');
  await ctx.close();
});

test('entidades ilustradas: arma, veículo e nave têm cabeçalho de arte com reserva', async ({ browser }) => {
  const pl = await loginAs(browser, 'jogador@r2d6.local');
  for (const [path, art] of [['/consulta/weapons/blaster-pistol', 'weapon.blaster-pistol'], ['/consulta/vehicles/at-at', 'vehicle.at-at']]) {
    await pl.page.goto(path);
    await expect(pl.page.locator(`[data-art="${art}"]`)).toBeVisible();
  }
  await pl.page.goto('/consulta/starships');
  await expect(pl.page.locator('[data-art^="starship."]').first()).toBeVisible();
  await pl.ctx.close();
});
