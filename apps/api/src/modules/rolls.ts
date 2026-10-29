// rolls.ts - rolagens autoritativas no servidor (ADR-0009): sorteio com crypto.randomInt, CP depois de ver, Wild Die 1 do mestre.
import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';
import { randomInt } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { cpBody, createRollBody, wildOneBody } from '@r2d6/contracts';
import { canSpendCP, cpFromValues, parse, poolForTarget, roll as rollDice, rollCP, rollFromValues, targetsOf, validWildSeq, format } from '@r2d6/rules';
import { canResolveWildOne, canRollFor, canSeeRoll } from '../authz/policies';
import type { AppCtx } from '../ctx';
import { schema } from '../db/client';
import { HttpError, badRequest, conflict, forbidden, notFound, unprocessable } from '../lib/http';
import { accessCharacter, membershipOf, writeCharacter } from './characters';
import { requireMember, settingsOf } from './campaigns';

const { rolls, characters, user, campaigns } = schema;
const rng = () => randomInt(1, 7);

type RollRow = typeof rolls.$inferSelect;

export function presentRoll(r: RollRow, extra: { userName?: string; characterName?: string | null; portraitMediaId?: string | null } = {}) {
  const res: any = r.result;
  return {
    id: r.id, userId: r.userId, userName: extra.userName ?? '', characterId: r.characterId, characterName: extra.characterName ?? null, portraitMediaId: extra.portraitMediaId ?? null,
    campaignId: r.campaignId, rollType: r.rollType, label: r.label, pool: r.pool, mode: r.mode, rng: r.rng,
    normals: res.normals, wild: res.wild, pips: res.pips, wildOne: res.wildOne, totals: res.totals,
    cpDice: r.cpDice, cpTotal: r.cpTotal, wildOneChoice: r.wildOneChoice, resolvedBy: r.resolvedBy, total: r.total,
    pending: r.total === null, visibility: r.visibility, createdAt: r.createdAt,
  };
}

async function hydrate(ctx: AppCtx, r: RollRow) {
  const [u] = await ctx.db.select({ name: user.name }).from(user).where(eq(user.id, r.userId));
  const [c] = r.characterId ? await ctx.db.select({ name: characters.name, portrait: characters.portraitMediaId }).from(characters).where(eq(characters.id, r.characterId)) : [];
  return presentRoll(r, { userName: u?.name, characterName: c?.name ?? null, portraitMediaId: c?.portrait ?? null });
}

export function registerRollRoutes(app: FastifyInstance, ctx: AppCtx) {
  const auth = { preHandler: app.requireUser };

  app.post('/api/rolls', auth, async (req, reply) => {
    const body = createRollBody.parse(req.body);
    const { row, role } = await accessCharacter(ctx, req.user!.id, body.characterId);
    if (!canRollFor(role)) throw forbidden('Só o dono rola pelo personagem.');
    const id = body.id ?? crypto.randomUUID();
    const [existing] = await ctx.db.select().from(rolls).where(eq(rolls.id, id));
    if (existing) {
      if (existing.userId !== req.user!.id) throw notFound('Rolagem');
      reply.code(200);
      return { roll: await hydrate(ctx, existing) };
    }
    const sheet: any = row.sheet;
    const target = targetsOf(sheet, ctx.skillsById).find((t) => t.key === body.targetKey);
    if (!target) throw unprocessable('Alvo de rolagem desconhecido para este personagem.');
    const pool = poolForTarget(sheet, row.playState as any, target, { bonus: body.damageBonus, noStr: body.noStr });
    if (!pool.usable) throw unprocessable('Parada sem dados: não é possível rolar.', { lines: pool.lines });
    const code = parse(pool.code);
    let result;
    const physical = body.mode === 'physical' || body.rng === 'client';
    if (physical) {
      if (!body.values) throw badRequest('Informe os valores dos dados.');
      if (body.values.normals.length !== code.dice - 1) throw unprocessable(`A parada ${pool.text} tem ${code.dice - 1} dado(s) normal(is) além do Wild Die.`);
      if (!validWildSeq(body.values.wild)) throw unprocessable('Sequência do Wild Die inválida: 6 explode, e a última rolagem não é 6.');
      result = rollFromValues(body.values.normals, body.values.wild, code.pips);
    } else {
      result = rollDice(pool.code, rng);
    }
    const campaignId = body.visibility === 'private' ? null : row.campaignId;
    const total = result.wildOne ? null : result.totals.normal;
    const [inserted] = await ctx.db.insert(rolls).values({
      id, userId: req.user!.id, characterId: row.id, campaignId, rollType: target.rollType, label: target.label,
      pool: { text: pool.text, lines: pool.lines, code: pool.code }, mode: body.mode, rng: body.rng,
      result: result as any, total, visibility: body.visibility,
    }).returning();
    const out = await hydrate(ctx, inserted);
    ctx.rt.rollCreated(out, inserted.visibility, inserted.campaignId, inserted.userId);
    reply.code(201);
    return { roll: out };
  });

  // historico pessoal (modo mesa)
  app.get('/api/rolls/mine', auth, async (req) => {
    const rows = await ctx.db.select().from(rolls).where(eq(rolls.userId, req.user!.id)).orderBy(desc(rolls.createdAt)).limit(30);
    return { rolls: await Promise.all(rows.map((r) => hydrate(ctx, r))) };
  });

  async function loadRollFor(userId: string, id: string) {
    if (!z.string().uuid().safeParse(id).success) throw notFound('Rolagem');
    const [r] = await ctx.db.select().from(rolls).where(eq(rolls.id, id));
    if (!r) throw notFound('Rolagem');
    const mem = await membershipOf(ctx, r.campaignId, userId);
    if (!canSeeRoll(userId, r as any, mem?.role ?? null)) throw notFound('Rolagem');
    return { r, mem };
  }

  // gasta CP depois de ver a rolagem (US-05; RD-10..RD-12): servidor sorteia, valida limite/exclusao e desconta da ficha
  app.post('/api/rolls/:id/cp', auth, async (req) => {
    const { r } = await loadRollFor(req.user!.id, (req.params as any).id);
    if (r.userId !== req.user!.id) throw forbidden('Só o autor gasta CP na rolagem.');
    if (r.total === null) throw conflict('Resolva o Wild Die 1 antes de gastar Character Points.');
    if (!r.characterId) throw unprocessable('Rolagem sem personagem.');
    const body = cpBody.parse(req.body);
    const { row } = await accessCharacter(ctx, req.user!.id, r.characterId);
    const sheet: any = row.sheet;
    let ps: any = row.playState;
    let spentOnRoll = (r.cpDice as any[]).length;
    for (let i = 0; i < body.count; i++) {
      const chk = canSpendCP(ps, r.rollType, spentOnRoll + i, sheet.character_points - i);
      if (!chk.ok) throw unprocessable(`${chk.reason} (${chk.cite})`);
    }
    const spent = body.values ? cpFromValues(body.values) : rollCP(body.count, rng);
    if (body.values && body.values.length !== body.count) throw badRequest('Quantidade de dados de CP diferente de count.');
    const res = await writeCharacter(ctx, row.id, {
      actor: { id: req.user!.id, role: 'owner' }, deviceId: (req.headers['x-device-id'] as string) || 'web',
      ops: [{ op: 'inc', path: '/character_points', value: -body.count }],
      playState: (p) => ({ ...p, cpSpent: (p.cpSpent || 0) + body.count }),
    });
    if (res.status === 'conflict') throw conflict('A ficha mudou. Tente de novo.');
    const [updated] = await ctx.db.update(rolls).set({
      cpDice: [...(r.cpDice as any[]), ...spent.dice], cpTotal: r.cpTotal + spent.total, total: (r.total ?? 0) + spent.total,
    }).where(eq(rolls.id, r.id)).returning();
    const out = await hydrate(ctx, updated);
    ctx.rt.rollUpdated(out, updated.visibility, updated.campaignId, updated.userId);
    return { roll: out, character: { characterPoints: (res.row.sheet as any).character_points } };
  });

  // Wild Die 1: o mestre escolhe (PD-04/RD-03)
  app.post('/api/rolls/:id/wild-one', auth, async (req) => {
    const { r, mem } = await loadRollFor(req.user!.id, (req.params as any).id);
    const { choice } = wildOneBody.parse(req.body);
    if (!(r.result as any).wildOne) throw conflict('Esta rolagem não tem Wild Die 1.');
    if (r.total !== null) throw conflict('O Wild Die 1 desta rolagem já foi decidido.');
    let resolver: 'gm' | 'roller' = 'gm';
    if (r.campaignId) { const [c] = await ctx.db.select().from(campaigns).where(eq(campaigns.id, r.campaignId)); resolver = settingsOf(c).wildOneResolver; }
    if (!canResolveWildOne(req.user!.id, r as any, mem?.role ?? null, resolver)) throw forbidden('Quem decide o Wild Die 1 é o mestre da campanha.');
    const totals: any = (r.result as any).totals;
    const [updated] = await ctx.db.update(rolls).set({
      wildOneChoice: choice, total: totals[choice] + r.cpTotal, resolvedBy: req.user!.id, resolvedAt: new Date(),
    }).where(eq(rolls.id, r.id)).returning();
    const out = await hydrate(ctx, updated);
    ctx.rt.rollUpdated(out, updated.visibility, updated.campaignId, updated.userId);
    return { roll: out };
  });

  // feed da campanha
  app.get('/api/campaigns/:id/rolls', auth, async (req) => {
    const { campaign, role } = await requireMember(ctx, (req.params as any).id, req.user!.id);
    const q = req.query as any;
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 50));
    const before = q.before ? new Date(q.before) : null;
    const vis = role === 'gm' ? inArray(rolls.visibility, ['table', 'gm']) : or(eq(rolls.visibility, 'table'), eq(rolls.userId, req.user!.id))!;
    const rows = await ctx.db.select().from(rolls)
      .where(and(eq(rolls.campaignId, campaign.id), vis, before && !isNaN(+before) ? lt(rolls.createdAt, before) : undefined))
      .orderBy(desc(rolls.createdAt)).limit(limit);
    return { rolls: await Promise.all(rows.map((r) => hydrate(ctx, r))) };
  });
}
export { format, sql };
