// notes.test.ts - notas do personagem (F-14): so o dono le e escreve; nunca aparecem para o mestre nem para a mesa.
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { campaignWithParty, makeApp, truncateAll } from './helpers';

let app: FastifyInstance;
beforeAll(async () => { app = await makeApp(); });
afterAll(async () => { await app.close(); });
beforeEach(async () => { await truncateAll(); });

describe('notas do personagem', () => {
  it('o dono grava e lê; mestre e outro jogador não veem nem sabem que existem', async () => {
    const { gm, a, b, ca } = await campaignWithParty(app);
    expect((await a.get(`/api/characters/${ca.id}/notes`)).json()).toEqual({ body: '', updatedAt: null });
    const put = await a.put(`/api/characters/${ca.id}/notes`, { body: 'Devo 2.000 créditos ao Jabba. Senha do hangar: 4471.' });
    expect(put.statusCode).toBe(200);
    expect((await a.get(`/api/characters/${ca.id}/notes`)).json().body).toMatch(/Jabba/);

    for (const other of [gm, b]) {
      expect((await other.get(`/api/characters/${ca.id}/notes`)).statusCode).toBe(404);
      expect((await other.put(`/api/characters/${ca.id}/notes`, { body: 'x' })).statusCode).toBe(404);
      const seen = await other.get(`/api/characters/${ca.id}`);
      expect(seen.statusCode).toBe(200); // a ficha continua visivel para a mesa...
      expect(JSON.stringify(seen.json())).not.toMatch(/Jabba|4471/); // ...mas sem as notas
    }
    expect((await a.get(`/api/characters/${ca.id}/notes`)).json().body).toMatch(/Jabba/); // ninguem sobrescreveu

    const exp = (await a.get('/api/me/export')).json();
    expect(exp.notes).toEqual([expect.objectContaining({ characterId: ca.id, body: expect.stringMatching(/Jabba/) })]);
  });

  it('recusa notas grandes demais', async () => {
    const { a, ca } = await campaignWithParty(app);
    expect((await a.put(`/api/characters/${ca.id}/notes`, { body: 'x'.repeat(20_001) })).statusCode).toBe(400);
  });
});
