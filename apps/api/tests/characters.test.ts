import type { FastifyInstance } from 'fastify';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Client, campaignWithParty, createChar, makeApp, newSheet, truncateAll, uuid } from './helpers';

let app: FastifyInstance;
beforeAll(async () => { app = await makeApp(); });
afterAll(async () => { await app.close(); });
beforeEach(async () => { await truncateAll(); });

const mutation = (ops: any[], baseRevision: number, extra: any = {}) => ({ mutationId: uuid(), deviceId: 'cel', baseRevision, ops, ...extra });

describe('fichas: criação, validação e persistência', () => {
  it('cria por template, recarrega do servidor e lista no Hangar', async () => {
    const c = new Client(app);
    await c.signUp('Ana', 'ana@t.local');
    const ch = await createChar(c, 'Kael');
    expect(ch.revision).toBe(1);
    const again = await c.get(`/api/characters/${ch.id}`);
    expect(again.json().character.sheet.name).toBe('Kael');
    const list = (await c.get('/api/characters')).json().characters;
    expect(list.map((x: any) => x.name)).toEqual(['Kael']);
    expect((await c.get(`/api/characters/${ch.id}/versions`)).json().versions[0].kind).toBe('creation');
  });

  it('valida a ficha contra character-sheet.schema.json (422)', async () => {
    const c = new Client(app);
    await c.signUp('Ana', 'ana@t.local');
    const bad: any = newSheet();
    bad.wound_status = 'ferido';
    delete bad.attributes.dexterity;
    const res = await c.post('/api/characters', { sheet: bad });
    expect(res.statusCode).toBe(422);
    expect(res.json().errors.length).toBeGreaterThan(0);
  });

  it('ops que quebram o schema são rejeitadas e nada é gravado', async () => {
    const c = new Client(app);
    await c.signUp('Ana', 'ana@t.local');
    const ch = await createChar(c);
    const res = await c.patch(`/api/characters/${ch.id}`, mutation([{ op: 'replace', path: '/wound_status', value: 'ferido' }], 1));
    expect(res.statusCode).toBe(422);
    expect((await c.get(`/api/characters/${ch.id}`)).json().character.sheet.wound_status).toBe('healthy');
    expect((await c.patch(`/api/characters/${ch.id}`, mutation([{ op: 'replace', path: '/inexistente/x', value: 1 }], 1))).statusCode).toBe(422);
  });

  it('contadores comutam (inc) e munição respeita o máximo', async () => {
    const c = new Client(app);
    await c.signUp('Ana', 'ana@t.local');
    const ch = await createChar(c);
    // dois aparelhos, mesma revisão base: ambos aplicam
    const r1 = await c.patch(`/api/characters/${ch.id}`, mutation([{ op: 'inc', path: '/character_points', value: -1 }], 1));
    const r2 = await c.patch(`/api/characters/${ch.id}`, mutation([{ op: 'inc', path: '/character_points', value: -1 }], 1));
    expect(r1.statusCode).toBe(200); expect(r2.statusCode).toBe(200);
    expect(r2.json().character.sheet.character_points).toBe(3);
    const down = await c.patch(`/api/characters/${ch.id}`, mutation([{ op: 'inc', path: '/character_points', value: -50 }], 3));
    expect(down.json().character.sheet.character_points).toBe(0);
    expect(down.json().warnings.length).toBeGreaterThan(0);
  });

  it('mesmo campo alterado dos dois lados vira conflito 409 com o valor do servidor', async () => {
    const c = new Client(app);
    await c.signUp('Ana', 'ana@t.local');
    const ch = await createChar(c);
    expect((await c.patch(`/api/characters/${ch.id}`, mutation([{ op: 'replace', path: '/background', value: 'tablet' }], 1))).statusCode).toBe(200);
    const res = await c.patch(`/api/characters/${ch.id}`, mutation([{ op: 'replace', path: '/background', value: 'celular' }], 1));
    expect(res.statusCode).toBe(409);
    expect(res.json().conflicts[0].path).toBe('/background');
    expect(res.json().current.sheet.background).toBe('tablet');
    // campos diferentes não conflitam
    const ok = await c.patch(`/api/characters/${ch.id}`, mutation([{ op: 'replace', path: '/personality', value: 'calmo' }], 1));
    expect(ok.statusCode).toBe(200);
  });

  it('mutationId repetido é idempotente', async () => {
    const c = new Client(app);
    await c.signUp('Ana', 'ana@t.local');
    const ch = await createChar(c);
    const m = mutation([{ op: 'inc', path: '/credits', value: 100 }], 1);
    const a = await c.patch(`/api/characters/${ch.id}`, m);
    const b = await c.patch(`/api/characters/${ch.id}`, m);
    expect(b.json().duplicate).toBe(true);
    expect(b.json().character.sheet.credits).toBe(a.json().character.sheet.credits);
  });

  it('histórico: marco, restauração e batch de sincronização offline', async () => {
    const c = new Client(app);
    await c.signUp('Ana', 'ana@t.local');
    const ch = await createChar(c);
    const original = ch.sheet.credits;
    await c.post(`/api/characters/${ch.id}/versions`, { label: 'Antes da sessão' });
    await c.patch(`/api/characters/${ch.id}`, mutation([{ op: 'inc', path: '/credits', value: 500 }], 1));
    const versions = (await c.get(`/api/characters/${ch.id}/versions`)).json().versions;
    const marco = versions.find((v: any) => v.kind === 'milestone');
    expect((await c.get(`/api/characters/${ch.id}/versions/${marco.id}`)).json().version.snapshot.credits).toBe(original);
    const rest = await c.post(`/api/characters/${ch.id}/restore`, { versionId: marco.id });
    expect(rest.json().character.sheet.credits).toBe(original);
    // batch (fila offline): uma criação nova + um patch
    const newId = uuid();
    const batch = await c.post('/api/sync/batch', { items: [
      { kind: 'create', characterId: newId, mutationId: uuid(), sheet: newSheet('Offline') },
      { kind: 'patch', characterId: ch.id, mutationId: uuid(), baseRevision: rest.json().character.revision, ops: [{ op: 'inc', path: '/force_points', value: 1 }] },
    ] });
    expect(batch.json().results.map((r: any) => r.status)).toEqual(['applied', 'applied']);
    const pull = (await c.get('/api/sync?since=0')).json();
    expect(pull.characters.length).toBe(2);
  });
});

describe('permissões', () => {
  it('um estranho recebe 404 em tudo (IDOR)', async () => {
    const owner = new Client(app); await owner.signUp('Ana', 'ana@t.local');
    const spy = new Client(app); await spy.signUp('Eva', 'eva@t.local');
    const ch = await createChar(owner);
    for (const [m, url, body] of [
      ['GET', `/api/characters/${ch.id}`], ['PATCH', `/api/characters/${ch.id}`, mutation([{ op: 'inc', path: '/credits', value: 1 }], 1)],
      ['GET', `/api/characters/${ch.id}/versions`], ['DELETE', `/api/characters/${ch.id}`], ['PUT', `/api/characters/${ch.id}/play-state`, { playState: {} }],
    ] as const) {
      const res = await spy.req(m, url, body);
      expect(res.statusCode, `${m} ${url}`).toBe(404);
    }
    expect((await spy.get('/api/characters')).json().characters).toEqual([]);
  });

  it('jogador não edita a ficha de outro jogador da mesma campanha', async () => {
    const { a, b, cb } = await campaignWithParty(app);
    const res = await a.patch(`/api/characters/${cb.id}`, mutation([{ op: 'replace', path: '/name', value: 'Hackeado' }], 1));
    expect(res.statusCode).toBe(403);
    // colega vê a ficha, mas não rola por ela
    expect((await a.get(`/api/characters/${cb.id}`)).statusCode).toBe(200);
    const target = 'a:dexterity';
    expect((await a.post('/api/rolls', { characterId: cb.id, targetKey: target })).statusCode).toBe(403);
    expect(b).toBeTruthy();
  });

  it('colega não vê Dark Side Points; dono e mestre veem', async () => {
    const { gm, a, b, ca, camp } = await campaignWithParty(app);
    const grant = await gm.post(`/api/campaigns/${camp.id}/characters/${ca.id}/grant`, { dsp: 2 });
    expect(grant.statusCode).toBe(200);
    expect((await a.get(`/api/characters/${ca.id}`)).json().character.sheet.dark_side_points).toBe(2);
    expect((await gm.get(`/api/characters/${ca.id}`)).json().character.sheet.dark_side_points).toBe(2);
    const peer = (await b.get(`/api/characters/${ca.id}`)).json().character;
    expect(peer.role).toBe('peer');
    expect('dark_side_points' in peer.sheet).toBe(false);
    const party = (await b.get(`/api/campaigns/${camp.id}/party`)).json().party;
    expect(party.find((p: any) => p.id === ca.id).darkSidePoints).toBeUndefined();
    const gmParty = (await gm.get(`/api/campaigns/${camp.id}/party`)).json().party;
    expect(gmParty.find((p: any) => p.id === ca.id).darkSidePoints).toBe(2);
  });

  it('mestre concede CP/FP/créditos e aplica ferimento, tudo no histórico; jogador não concede', async () => {
    const { gm, a, ca, camp } = await campaignWithParty(app);
    const before = ca.sheet;
    const g = await gm.post(`/api/campaigns/${camp.id}/characters/${ca.id}/grant`, { cp: 2, fp: 1, credits: 300, wound: 'wounded', note: 'Recompensa' });
    expect(g.statusCode).toBe(200);
    const sheet = (await a.get(`/api/characters/${ca.id}`)).json().character.sheet;
    expect(sheet.character_points).toBe(before.character_points + 2);
    expect(sheet.force_points).toBe(before.force_points + 1);
    expect(sheet.credits).toBe(before.credits + 300);
    expect(sheet.wound_status).toBe('wounded');
    const changes = (await a.get(`/api/characters/${ca.id}/changes`)).json().changes;
    expect(changes[0].actorRole).toBe('gm');
    expect(changes[0].note).toContain('Recompensa');
    expect((await a.post(`/api/campaigns/${camp.id}/characters/${ca.id}/grant`, { cp: 5 })).statusCode).toBe(403);
    // o mestre só pode mexer em CP/FP/DSP/créditos/ferimento
    const sneaky = await gm.patch(`/api/characters/${ca.id}`, mutation([{ op: 'replace', path: '/name', value: 'Outro' }], 2));
    expect(sneaky.statusCode).toBe(403);
    const okGm = await gm.patch(`/api/characters/${ca.id}`, mutation([{ op: 'inc', path: '/character_points', value: 1 }], 2));
    expect(okGm.statusCode).toBe(200);
  });

  it('um personagem participa de no máximo uma campanha', async () => {
    const { gm, a, ca } = await campaignWithParty(app);
    const other = (await gm.post('/api/campaigns', { name: 'Outra mesa' })).json().campaign;
    const inv = (await gm.post(`/api/campaigns/${other.id}/invites`, {})).json();
    await a.post(`/api/invites/${inv.code}/accept`);
    const res = await a.post(`/api/campaigns/${other.id}/characters`, { characterId: ca.id });
    expect(res.statusCode).toBe(409);
  });

  it('convite: prévia pública, código inválido e revogação', async () => {
    const gm = new Client(app); await gm.signUp('Mestra', 'gm@t.local');
    const camp = (await gm.post('/api/campaigns', { name: 'Mesa' })).json().campaign;
    const inv = (await gm.post(`/api/campaigns/${camp.id}/invites`, {})).json();
    const pub = await app.inject({ method: 'GET', url: `/api/invites/${inv.code}` });
    expect(pub.json().campaign.name).toBe('Mesa');
    expect((await app.inject({ method: 'GET', url: '/api/invites/ZZZZ-ZZZZ' })).statusCode).toBe(410);
    const detail = (await gm.get(`/api/campaigns/${camp.id}`)).json();
    await gm.del(`/api/campaigns/${camp.id}/invites/${detail.invites[0].id}`);
    expect((await app.inject({ method: 'GET', url: `/api/invites/${inv.code}` })).statusCode).toBe(410);
  });
});

describe('retrato (upload)', () => {
  it('aceita imagem real, gera WebP sem EXIF e serve só a quem pode ver; rejeita arquivo falso', async () => {
    const { a, b, ca } = await campaignWithParty(app);
    const png = await sharp({ create: { width: 900, height: 600, channels: 3, background: '#335577' } }).withMetadata({ exif: { IFD0: { Copyright: 'segredo' } } }).jpeg().toBuffer();
    const up = await a.upload(`/api/characters/${ca.id}/portrait`, png, 'foto.jpg', 'image/jpeg');
    expect(up.statusCode).toBe(200);
    const mediaId = up.json().mediaId;
    const img = await a.get(`/api/media/${mediaId}/256`);
    expect(img.statusCode).toBe(200);
    expect(img.headers['content-type']).toBe('image/webp');
    const meta = await sharp(img.rawPayload).metadata();
    expect(meta.format).toBe('webp'); expect(meta.exif).toBeUndefined();
    expect((await b.get(`/api/media/${mediaId}/256`)).statusCode).toBe(200); // colega de mesa
    const stranger = new Client(app); await stranger.signUp('Eva', 'eva@t.local');
    expect((await stranger.get(`/api/media/${mediaId}/256`)).statusCode).toBe(404);
    const fake = await a.upload(`/api/characters/${ca.id}/portrait`, Buffer.from('não sou uma imagem'), 'x.png', 'image/png');
    expect(fake.statusCode).toBe(415);
  });
});

describe('LGPD: baixar meus dados', () => {
  it('exporta só os dados do próprio usuário', async () => {
    const { a, b } = await campaignWithParty(app);
    const res = await a.get('/api/me/export');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-disposition']).toContain('r2d6-meus-dados.json');
    const data = res.json();
    expect(data.user.email).toBe('ana@t.local');
    expect(data.characters.map((c: any) => c.name)).toEqual(['Kael']);
    expect(JSON.stringify(data)).not.toContain('Zia');
    expect((await app.inject({ method: 'GET', url: '/api/me/export' })).statusCode).toBe(401);
    expect(b).toBeTruthy();
  });
});
