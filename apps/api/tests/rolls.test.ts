import type { FastifyInstance } from 'fastify';
import { io as ioc, type Socket } from 'socket.io-client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Client, campaignWithParty, makeApp, truncateAll, uuid } from './helpers';

let app: FastifyInstance;
beforeAll(async () => { app = await makeApp({ realtime: true }); await app.listen({ port: 0, host: '127.0.0.1' }); });
afterAll(async () => { await app.close(); });
beforeEach(async () => { await truncateAll(); });

const target = 'a:dexterity';
const physical = (normals: number[], wild: number[]) => ({ mode: 'physical', values: { normals, wild } });

/** Conecta um socket autenticado pelo cookie de sessão do cliente. */
async function connect(c: Client, sub: { campaignId?: string; characterId?: string }): Promise<Socket> {
  const port = (app.server.address() as any).port;
  const s = ioc(`http://127.0.0.1:${port}`, { extraHeaders: { cookie: c.cookie }, transports: ['websocket'], reconnection: false });
  await new Promise<void>((res, rej) => { s.on('connect', () => res()); s.on('connect_error', rej); });
  const ack: any = await new Promise((res) => s.emit('subscribe', sub, res));
  expect(ack.ok).toBe(true);
  return s;
}
const once = <T = any>(s: Socket, ev: string) => new Promise<T>((res) => s.once(ev, res));

describe('rolagens no servidor', () => {
  it('rola com o motor de regras, aplica penalidades e grava no feed', async () => {
    const { a, gm, b, ca, camp } = await campaignWithParty(app);
    const r = await a.post('/api/rolls', { characterId: ca.id, targetKey: target, ...physical([3, 4], [5]) });
    expect(r.statusCode).toBe(201);
    const roll = r.json().roll;
    expect(roll.pool.text).toMatch(/^\dD/);
    expect(roll.total).toBe(3 + 4 + 5 + (roll.pips ?? 0));
    expect(roll.rng).toBe('server'); expect(roll.mode).toBe('physical');
    const feed = (await b.get(`/api/campaigns/${camp.id}/rolls`)).json().rolls;
    expect(feed.map((x: any) => x.id)).toContain(roll.id);
    expect((await gm.get(`/api/campaigns/${camp.id}/rolls`)).json().rolls.length).toBe(1);
    // digital: o servidor sorteia (valores 1..6 e Wild Die presente)
    const d = (await a.post('/api/rolls', { characterId: ca.id, targetKey: target })).json().roll;
    expect(d.wild.length).toBeGreaterThan(0);
    expect([...d.normals, ...d.wild].every((v: number) => v >= 1 && v <= 6)).toBe(true);
  });

  it('ações múltiplas e ferimento reduzem a parada (RD-07/RD-20)', async () => {
    const { a, ca } = await campaignWithParty(app);
    const base = (await a.post('/api/rolls', { characterId: ca.id, targetKey: target })).json().roll;
    const dice = (t: string) => parseInt(t, 10);
    await a.put(`/api/characters/${ca.id}/play-state`, { playState: { n: 1, actions: 3, cpSpent: 0, fpUsed: false, stuns: [], mortalRounds: 0 } });
    const multi = (await a.post('/api/rolls', { characterId: ca.id, targetKey: target })).json().roll;
    expect(dice(multi.pool.text)).toBe(dice(base.pool.text) - 2);
    expect(multi.pool.lines.join(' ')).toContain('RD-07');
  });

  it('Wild Die 1 fica pendente até o mestre decidir; jogador não decide', async () => {
    const { a, gm, b, ca, camp } = await campaignWithParty(app);
    const r = await a.post('/api/rolls', { characterId: ca.id, targetKey: target, ...physical([6, 5], [1]) });
    const roll = r.json().roll;
    expect(roll.wildOne).toBe(true); expect(roll.total).toBeNull(); expect(roll.pending).toBe(true);
    expect((await a.post(`/api/rolls/${roll.id}/wild-one`, { choice: 'normal' })).statusCode).toBe(403);
    expect((await b.post(`/api/rolls/${roll.id}/wild-one`, { choice: 'normal' })).statusCode).toBe(403);
    const sub = await gm.post(`/api/rolls/${roll.id}/wild-one`, { choice: 'subtract' });
    expect(sub.statusCode).toBe(200);
    // tira o 1 e o maior dado normal (RD-04): 6+5+1 = 12 -> 12-1-6 = 5
    expect(sub.json().roll.total).toBe(5 + roll.pips);
    expect((await gm.post(`/api/rolls/${roll.id}/wild-one`, { choice: 'normal' })).statusCode).toBe(409);
    expect(camp.id).toBeTruthy();
  });

  it('valida os dados físicos (contagem e sequência do Wild Die)', async () => {
    const { a, ca } = await campaignWithParty(app);
    expect((await a.post('/api/rolls', { characterId: ca.id, targetKey: target, ...physical([1], [3]) })).statusCode).toBe(422);
    expect((await a.post('/api/rolls', { characterId: ca.id, targetKey: target, ...physical([3, 3], [6]) })).statusCode).toBe(422); // 6 sem continuar
    expect((await a.post('/api/rolls', { characterId: ca.id, targetKey: 'nao-existe' })).statusCode).toBe(422);
  });

  it('CP depois de ver: limite, desconto na ficha e exclusão com Force Point (RD-11/RD-12)', async () => {
    const { a, ca } = await campaignWithParty(app);
    const roll = (await a.post('/api/rolls', { characterId: ca.id, targetKey: target, ...physical([2, 2], [2]) })).json().roll;
    const before = ca.sheet.character_points;
    const cp = await a.post(`/api/rolls/${roll.id}/cp`, { count: 2 });
    expect(cp.statusCode).toBe(200);
    expect(cp.json().roll.cpDice.length).toBe(2);
    expect(cp.json().roll.total).toBeGreaterThanOrEqual(roll.total + 2);
    const after = (await a.get(`/api/characters/${ca.id}`)).json().character;
    expect(after.sheet.character_points).toBe(before - 2);
    expect(after.playState.cpSpent).toBe(2);
    // limite de 2 CP em perícia/atributo
    expect((await a.post(`/api/rolls/${roll.id}/cp`, { count: 1 })).statusCode).toBe(422);
    // CP gasto no round bloqueia o Force Point
    expect((await a.post(`/api/characters/${ca.id}/fp`, { use: true })).statusCode).toBe(422);
  });

  it('Force Point dobra a parada e bloqueia CP no mesmo round', async () => {
    const { a, ca } = await campaignWithParty(app);
    const base = (await a.post('/api/rolls', { characterId: ca.id, targetKey: target })).json().roll;
    const fp = await a.post(`/api/characters/${ca.id}/fp`, { use: true });
    expect(fp.statusCode).toBe(200);
    expect(fp.json().character.sheet.force_points).toBe(ca.sheet.force_points - 1);
    const doubled = (await a.post('/api/rolls', { characterId: ca.id, targetKey: target })).json().roll;
    expect(parseInt(doubled.pool.text, 10)).toBe(parseInt(base.pool.text, 10) * 2);
    const roll = (await a.post('/api/rolls', { characterId: ca.id, targetKey: target, ...physical(Array(parseInt(doubled.pool.text, 10) - 1).fill(2), [2]) })).json().roll;
    expect((await a.post(`/api/rolls/${roll.id}/cp`, { count: 1 })).statusCode).toBe(422);
    expect((await a.post(`/api/characters/${ca.id}/fp`, { use: true })).statusCode).toBe(422); // um FP por round
  });

  it('rolagem do mestre-only não aparece para jogadores; privada nem no feed', async () => {
    const { a, b, gm, ca, camp } = await campaignWithParty(app);
    await a.post('/api/rolls', { characterId: ca.id, targetKey: target, visibility: 'gm' });
    await a.post('/api/rolls', { characterId: ca.id, targetKey: target, visibility: 'private' });
    expect((await b.get(`/api/campaigns/${camp.id}/rolls`)).json().rolls.length).toBe(0);
    expect((await gm.get(`/api/campaigns/${camp.id}/rolls`)).json().rolls.length).toBe(1);
    expect((await a.get(`/api/campaigns/${camp.id}/rolls`)).json().rolls.length).toBe(1);
  });

  it('o mestre avança o round de todos: libera CP/FP e zera ações', async () => {
    const { a, gm, ca, camp } = await campaignWithParty(app);
    await a.put(`/api/characters/${ca.id}/play-state`, { playState: { n: 1, actions: 3, cpSpent: 2, fpUsed: true, stuns: [1], mortalRounds: 0 } });
    expect((await a.post(`/api/campaigns/${camp.id}/round/next`)).statusCode).toBe(403);
    const next = await gm.post(`/api/campaigns/${camp.id}/round/next`);
    expect(next.json().round).toBe(2);
    const ps = (await a.get(`/api/characters/${ca.id}`)).json().character.playState;
    expect(ps).toMatchObject({ n: 2, actions: 1, cpSpent: 0, fpUsed: false });
  });
});

describe('tempo real (Socket.IO)', () => {
  it('uma rolagem do jogador chega ao mestre e a outro jogador em tempo real; a decisão do Wild Die também', async () => {
    const { a, b, gm, ca, camp } = await campaignWithParty(app);
    const sGm = await connect(gm, { campaignId: camp.id });
    const sB = await connect(b, { campaignId: camp.id });
    const gotGm = once(sGm, 'roll:created'); const gotB = once(sB, 'roll:created');
    const t0 = Date.now();
    const roll = (await a.post('/api/rolls', { characterId: ca.id, targetKey: target, ...physical([6, 5], [1]) })).json().roll;
    const [evGm, evB] = await Promise.all([gotGm, gotB]);
    expect(Date.now() - t0).toBeLessThan(1500);
    expect(evGm.id).toBe(roll.id); expect(evB.id).toBe(roll.id);
    expect(evGm.pending).toBe(true);
    const upd = once(sB, 'roll:updated');
    await gm.post(`/api/rolls/${roll.id}/wild-one`, { choice: 'normal' });
    expect((await upd).total).toBeGreaterThan(0);
    sGm.close(); sB.close();
  });

  it('rolagem só do mestre não vaza para o colega; estranho não entra na sala; DSP não vaza', async () => {
    const { a, b, gm, ca, camp } = await campaignWithParty(app);
    const stranger = new Client(app); await stranger.signUp('Eva', 'eva@t.local');
    const sB = await connect(b, { campaignId: camp.id });
    const sGm = await connect(gm, { campaignId: camp.id });
    const port = (app.server.address() as any).port;
    const sx = ioc(`http://127.0.0.1:${port}`, { extraHeaders: { cookie: stranger.cookie }, transports: ['websocket'], reconnection: false });
    await new Promise<void>((r) => sx.on('connect', () => r()));
    const ack: any = await new Promise((r) => sx.emit('subscribe', { campaignId: camp.id, characterId: ca.id }, r));
    expect(ack.campaign).toBe(false); expect(ack.character).toBe(false);
    let leaked = false;
    sB.on('roll:created', () => { leaked = true; });
    sx.on('roll:created', () => { leaked = true; });
    sB.on('character:changed', () => { leaked = true; }); // peers só recebem party:changed
    const got = once(sGm, 'roll:created');
    await a.post('/api/rolls', { characterId: ca.id, targetKey: target, visibility: 'gm' });
    await got;
    await gm.post(`/api/campaigns/${camp.id}/characters/${ca.id}/grant`, { dsp: 1 });
    await new Promise((r) => setTimeout(r, 300));
    expect(leaked).toBe(false);
    [sB, sGm, sx].forEach((s) => s.close());
  });

  it('o mesmo usuário recebe as alterações da ficha em outro aparelho', async () => {
    const { a, ca } = await campaignWithParty(app);
    const s = await connect(a, { characterId: ca.id });
    const ev = once(s, 'character:changed');
    await a.patch(`/api/characters/${ca.id}`, { mutationId: uuid(), deviceId: 'celular', baseRevision: 1, ops: [{ op: 'inc', path: '/credits', value: 7 }] });
    const payload = await ev;
    expect(payload.deviceId).toBe('celular');
    expect(payload.ops[0]).toMatchObject({ op: 'inc', path: '/credits', value: 7 });
    s.close();
  });
});
