// characters.ts - servico e rotas de fichas: CRUD, sincronizacao por operacoes (rebase), versoes, estado de mesa.
import { and, asc, desc, eq, gt, inArray, isNull, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { batchBody, createCharacterBody, mutationSchema, playStateBody } from '@r2d6/contracts';
import { applyOps, canSpendFP, clampSheet, defaultPlayState, findConflicts, isGmOp, speciesLimitWarnings, type Op } from '@r2d6/rules';
import { canEditSheet, canSeeHistory, characterRole, gmOpsAllowed, redactSheet, type CharRole } from '../authz/policies';
import type { AppCtx, SessionUser } from '../ctx';
import { schema } from '../db/client';
import { HttpError, badRequest, conflict, forbidden, notFound, unprocessable } from '../lib/http';

const { characters, characterChanges, characterVersions, campaignMembers, campaigns, media } = schema;
export type CharRow = typeof characters.$inferSelect;

const MAX_SHEET_BYTES = 128 * 1024;
const AUTO_VERSION_GAP_MS = 30 * 60 * 1000;

export async function membershipOf(ctx: AppCtx, campaignId: string | null, userId: string) {
  if (!campaignId) return null;
  const [m] = await ctx.db.select().from(campaignMembers).where(and(eq(campaignMembers.campaignId, campaignId), eq(campaignMembers.userId, userId)));
  return m ? { role: m.role as 'gm' | 'player' } : null;
}

export async function loadCharacter(ctx: AppCtx, id: string, includeDeleted = false) {
  const [row] = await ctx.db.select().from(characters).where(includeDeleted ? eq(characters.id, id) : and(eq(characters.id, id), isNull(characters.deletedAt)));
  return row ?? null;
}

/** Carrega a ficha e o papel do usuario. Sem acesso = 404 (nao revela existencia). */
export async function accessCharacter(ctx: AppCtx, userId: string, id: string): Promise<{ row: CharRow; role: Exclude<CharRole, null> }> {
  if (!z.string().uuid().safeParse(id).success) throw notFound('Personagem');
  const row = await loadCharacter(ctx, id);
  if (!row) throw notFound('Personagem');
  const role = characterRole(userId, row, await membershipOf(ctx, row.campaignId, userId));
  if (!role) throw notFound('Personagem');
  return { row, role };
}

export function presentCharacter(row: CharRow, role: CharRole) {
  return {
    id: row.id, ownerId: row.ownerId, campaignId: row.campaignId, name: row.name, speciesId: row.speciesId, templateType: row.templateType,
    portraitMediaId: row.portraitMediaId, revision: row.revision, syncSeq: row.syncSeq, reviewStatus: row.reviewStatus,
    sheet: redactSheet(row.sheet, role), playState: row.playState, validation: row.validation,
    createdAt: row.createdAt, updatedAt: row.updatedAt, role,
  };
}

export function summarize(row: CharRow, role: CharRole = 'owner') {
  const s: any = row.sheet;
  return {
    id: row.id, ownerId: row.ownerId, campaignId: row.campaignId, name: row.name, speciesId: row.speciesId, templateType: row.templateType,
    portraitMediaId: row.portraitMediaId, revision: row.revision, woundStatus: s.wound_status, characterPoints: s.character_points, forcePoints: s.force_points,
    darkSidePoints: role === 'owner' || role === 'gm' ? s.dark_side_points ?? 0 : undefined, forceSensitive: !!s.force_sensitive, updatedAt: row.updatedAt,
    playState: row.playState,
  };
}

function checkSheet(ctx: AppCtx, sheet: any) {
  if (JSON.stringify(sheet).length > MAX_SHEET_BYTES) throw unprocessable('A ficha excede 128 KB.');
  const v = ctx.validateSheet(sheet);
  if (!v.ok) throw unprocessable('A ficha não confere com o schema.', { errors: v.errors });
}

/** Avisos de regra (nunca bloqueiam; PD-04): limites da especie. */
function ruleWarnings(ctx: AppCtx, sheet: any) {
  try {
    const sp = sheet.species ? ctx.catalog.speciesBlock(sheet.species) : null;
    return speciesLimitWarnings(Object.fromEntries(Object.entries(sheet.attributes).map(([k, v]: any) => [k, v.value])), sp);
  } catch { return []; }
}

export interface WriteInput {
  actor: { id: string; role: 'owner' | 'gm' };
  ops?: Op[];
  baseRevision?: number;
  mutationId?: string;
  deviceId?: string;
  note?: string;
  playState?: (ps: any) => any; // transforma o play_state na mesma transacao
}
export type WriteResult =
  | { status: 'ok'; row: CharRow; ops: Op[]; warnings: string[]; duplicate?: boolean }
  | { status: 'conflict'; row: CharRow; conflicts: any[] };

/** Gravacao unica de ficha (ops + play_state) com idempotencia, rebase, schema e versoes. */
export async function writeCharacter(ctx: AppCtx, characterId: string, input: WriteInput): Promise<WriteResult> {
  const result = await ctx.db.transaction(async (tx) => {
    const locked = await tx.execute(sql`select id from characters where id = ${characterId} for update`);
    if (!locked.rows.length) throw notFound('Personagem');
    const [row] = await tx.select().from(characters).where(eq(characters.id, characterId));
    if (input.mutationId) {
      const [dup] = await tx.select().from(characterChanges).where(eq(characterChanges.mutationId, input.mutationId));
      if (dup) return { status: 'ok', row, ops: dup.ops as Op[], warnings: [], duplicate: true } as WriteResult;
    }
    const ops = input.ops ?? [];
    let nextSheet: any = row.sheet;
    let warnings: string[] = [];
    let revision = row.revision;
    if (ops.length) {
      const base = input.baseRevision ?? row.revision;
      if (base > row.revision) throw conflict('Revisão base maior que a do servidor.', { current: row.revision });
      if (base < row.revision) {
        const theirs = await tx.select().from(characterChanges)
          .where(and(eq(characterChanges.characterId, characterId), gt(characterChanges.revision, base))).orderBy(asc(characterChanges.revision));
        const expected = row.revision - base;
        const theirOps = theirs.flatMap((c) => c.ops as Op[]);
        if (theirs.length < expected) {
          // base fora da retencao: tudo que diverge vira conflito (arquitetura 11.2, regra 6)
          return { status: 'conflict', row, conflicts: ops.filter((o) => o.op !== 'inc').map((o) => ({ path: o.path, mine: o })) } as WriteResult;
        }
        const conflicts = findConflicts(ops, theirOps);
        if (conflicts.length) return { status: 'conflict', row, conflicts } as WriteResult;
      }
      try { nextSheet = applyOps(row.sheet, ops); } catch (e: any) { throw unprocessable(`Operação inválida: ${e.message}`); }
      warnings = clampSheet(nextSheet);
      checkSheet(ctx, nextSheet);
      revision = row.revision + 1;
      // snapshot "auto": estado anterior na primeira escrita apos 30 min sem alteracoes
      const [lastV] = await tx.select().from(characterVersions).where(eq(characterVersions.characterId, characterId)).orderBy(desc(characterVersions.createdAt)).limit(1);
      if (!lastV || Date.now() - new Date(lastV.createdAt).getTime() > AUTO_VERSION_GAP_MS) {
        await tx.insert(characterVersions).values({ characterId, revision: row.revision, snapshot: row.sheet as any, kind: 'auto', label: 'Antes de editar', authorId: input.actor.id });
      }
      await tx.insert(characterChanges).values({
        characterId, revision, ops: ops as any, actorId: input.actor.id, actorRole: input.actor.role,
        deviceId: input.deviceId ?? 'web', mutationId: input.mutationId ?? null, note: input.note ?? null,
      });
    }
    const nextPlay = input.playState ? input.playState(row.playState) : row.playState;
    const [updated] = await tx.update(characters).set({
      sheet: nextSheet, playState: nextPlay, revision,
      name: nextSheet.name, speciesId: nextSheet.species ?? '', templateType: nextSheet.type ?? row.templateType,
      validation: { warnings: ruleWarnings(ctx, nextSheet) },
      syncSeq: sql`nextval('character_sync_seq')`, updatedAt: new Date(),
    }).where(eq(characters.id, characterId)).returning();
    return { status: 'ok', row: updated, ops, warnings } as WriteResult;
  });
  if (result.status === 'ok' && !result.duplicate) {
    ctx.rt.characterChanged(result.row, { ops: result.ops, actorId: input.actor.id, deviceId: input.deviceId ?? 'web', role: input.actor.role });
  }
  return result;
}

const sanitizePlayState = (raw: any) => {
  const d = defaultPlayState();
  const n = (v: any, def: number, min = 0, max = 1000) => (Number.isInteger(v) ? Math.max(min, Math.min(max, v)) : def);
  return {
    n: n(raw?.n, d.n, 1), actions: n(raw?.actions, 1, 1, 9), cpSpent: n(raw?.cpSpent, 0, 0, 50), fpUsed: !!raw?.fpUsed,
    stuns: Array.isArray(raw?.stuns) ? raw.stuns.filter((x: any) => Number.isInteger(x)).slice(0, 20) : [],
    mortalRounds: n(raw?.mortalRounds, 0, 0, 100), activeWeapon: Number.isInteger(raw?.activeWeapon) ? raw.activeWeapon : null,
  };
};

export async function createCharacter(ctx: AppCtx, user: SessionUser, body: z.infer<typeof createCharacterBody>) {
  const id = body.id ?? crypto.randomUUID();
  const existing = await loadCharacter(ctx, id, true);
  if (existing) {
    if (existing.ownerId !== user.id) throw notFound('Personagem');
    return { row: existing, created: false };
  }
  checkSheet(ctx, body.sheet);
  const sheet: any = body.sheet;
  const [row] = await ctx.db.insert(characters).values({
    id, ownerId: user.id, name: sheet.name, speciesId: sheet.species ?? '', templateType: body.templateType ?? sheet.type ?? '',
    sheet, playState: defaultPlayState() as any, revision: 1, validation: { warnings: ruleWarnings(ctx, sheet) },
  }).returning();
  await ctx.db.insert(characterVersions).values({ characterId: id, revision: 1, snapshot: sheet, kind: 'creation', label: 'Criação', authorId: user.id });
  return { row, created: true };
}

const mutationToWrite = (user: SessionUser, role: 'owner' | 'gm', m: z.infer<typeof mutationSchema>): WriteInput => ({
  actor: { id: user.id, role }, ops: m.ops as Op[], baseRevision: m.baseRevision, mutationId: m.mutationId, deviceId: m.deviceId,
});

export function registerCharacterRoutes(app: FastifyInstance, ctx: AppCtx) {
  const auth = { preHandler: app.requireUser };

  app.get('/api/characters', auth, async (req) => {
    const rows = await ctx.db.select().from(characters).where(and(eq(characters.ownerId, req.user!.id), isNull(characters.deletedAt))).orderBy(desc(characters.updatedAt));
    const cids = [...new Set(rows.map((r) => r.campaignId).filter(Boolean))] as string[];
    const cs = cids.length ? await ctx.db.select({ id: campaigns.id, name: campaigns.name }).from(campaigns).where(inArray(campaigns.id, cids)) : [];
    const names = new Map(cs.map((c) => [c.id, c.name]));
    return { characters: rows.map((r) => ({ ...summarize(r, 'owner'), campaignName: r.campaignId ? names.get(r.campaignId) ?? null : null })) };
  });

  app.post('/api/characters', auth, async (req, reply) => {
    const body = createCharacterBody.parse(req.body);
    const { row, created } = await createCharacter(ctx, req.user!, body);
    reply.code(created ? 201 : 200);
    return { character: presentCharacter(row, 'owner') };
  });

  app.get('/api/characters/:id', auth, async (req) => {
    const { row, role } = await accessCharacter(ctx, req.user!.id, (req.params as any).id);
    return { character: presentCharacter(row, role) };
  });

  app.patch('/api/characters/:id', auth, async (req, reply) => {
    const { row, role } = await accessCharacter(ctx, req.user!.id, (req.params as any).id);
    const m = mutationSchema.parse(req.body);
    if (!canEditSheet(role)) {
      if (role !== 'gm') throw forbidden('Só o dono edita esta ficha.');
      if (!gmOpsAllowed(m.ops as Op[])) throw forbidden('O mestre só pode alterar CP, FP, Dark Side Points, créditos e ferimentos.');
    }
    const res = await writeCharacter(ctx, row.id, mutationToWrite(req.user!, role === 'gm' ? 'gm' : 'owner', m));
    if (res.status === 'conflict') {
      reply.code(409);
      return { type: 'sync-conflict', title: 'Conflito de edição', status: 409, conflicts: res.conflicts, current: presentCharacter(res.row, role) };
    }
    return { revision: res.row.revision, warnings: res.warnings, duplicate: !!res.duplicate, character: presentCharacter(res.row, role) };
  });

  app.put('/api/characters/:id/play-state', auth, async (req) => {
    const { row, role } = await accessCharacter(ctx, req.user!.id, (req.params as any).id);
    if (!canEditSheet(role)) throw forbidden();
    const { playState } = playStateBody.parse(req.body);
    const res = await writeCharacter(ctx, row.id, { actor: { id: req.user!.id, role: 'owner' }, deviceId: (req.headers['x-device-id'] as string) || 'web', playState: () => sanitizePlayState(playState) });
    return { character: presentCharacter((res as any).row, role) };
  });

  // Force Point: gasta/desfaz atomicamente (ficha + play_state) validando as regras (RD-12, RD-15)
  app.post('/api/characters/:id/fp', auth, async (req) => {
    const { row, role } = await accessCharacter(ctx, req.user!.id, (req.params as any).id);
    if (!canEditSheet(role)) throw forbidden();
    const { use } = z.object({ use: z.boolean() }).parse(req.body);
    const ps: any = row.playState;
    const sheet: any = row.sheet;
    if (use) {
      const chk = canSpendFP(ps, sheet.force_points);
      if (!chk.ok) throw unprocessable(`${chk.reason} (${chk.cite})`);
    } else if (!ps.fpUsed) throw unprocessable('Nenhum Force Point gasto neste round.');
    const res = await writeCharacter(ctx, row.id, {
      actor: { id: req.user!.id, role: 'owner' }, deviceId: (req.headers['x-device-id'] as string) || 'web',
      ops: [{ op: 'inc', path: '/force_points', value: use ? -1 : 1 }], playState: (p) => ({ ...p, fpUsed: use }),
    });
    return { character: presentCharacter((res as any).row, role) };
  });

  app.delete('/api/characters/:id', auth, async (req, reply) => {
    const { row, role } = await accessCharacter(ctx, req.user!.id, (req.params as any).id);
    if (!canEditSheet(role)) throw forbidden();
    await ctx.db.update(characters).set({ deletedAt: new Date(), campaignId: null, syncSeq: sql`nextval('character_sync_seq')` }).where(eq(characters.id, row.id));
    ctx.rt.syncHint(row.ownerId);
    reply.code(204);
  });

  app.get('/api/characters/:id/changes', auth, async (req) => {
    const { row, role } = await accessCharacter(ctx, req.user!.id, (req.params as any).id);
    if (!canSeeHistory(role)) throw notFound('Personagem');
    const rows = await ctx.db.select().from(characterChanges).where(eq(characterChanges.characterId, row.id)).orderBy(desc(characterChanges.revision)).limit(100);
    return { changes: rows.map((c) => ({ revision: c.revision, ops: c.ops, actorId: c.actorId, actorRole: c.actorRole, deviceId: c.deviceId, note: c.note, createdAt: c.createdAt })) };
  });

  // ---- versoes
  app.get('/api/characters/:id/versions', auth, async (req) => {
    const { row, role } = await accessCharacter(ctx, req.user!.id, (req.params as any).id);
    if (!canSeeHistory(role)) throw notFound('Personagem');
    const rows = await ctx.db.select({ id: characterVersions.id, revision: characterVersions.revision, kind: characterVersions.kind, label: characterVersions.label, createdAt: characterVersions.createdAt, authorId: characterVersions.authorId })
      .from(characterVersions).where(eq(characterVersions.characterId, row.id)).orderBy(desc(characterVersions.createdAt)).limit(100);
    return { versions: rows };
  });
  app.get('/api/characters/:id/versions/:vid', auth, async (req) => {
    const { row, role } = await accessCharacter(ctx, req.user!.id, (req.params as any).id);
    if (!canSeeHistory(role)) throw notFound('Personagem');
    const vid = (req.params as any).vid;
    if (!z.string().uuid().safeParse(vid).success) throw notFound('Versão');
    const [v] = await ctx.db.select().from(characterVersions).where(and(eq(characterVersions.id, vid), eq(characterVersions.characterId, row.id)));
    if (!v) throw notFound('Versão');
    return { version: v };
  });
  app.post('/api/characters/:id/versions', auth, async (req, reply) => {
    const { row, role } = await accessCharacter(ctx, req.user!.id, (req.params as any).id);
    if (!canEditSheet(role)) throw forbidden();
    const { label } = z.object({ label: z.string().trim().min(1).max(80) }).parse(req.body);
    const [v] = await ctx.db.insert(characterVersions).values({ characterId: row.id, revision: row.revision, snapshot: row.sheet as any, kind: 'milestone', label, authorId: req.user!.id }).returning();
    reply.code(201);
    return { version: { id: v.id, revision: v.revision, kind: v.kind, label: v.label, createdAt: v.createdAt } };
  });
  app.post('/api/characters/:id/restore', auth, async (req) => {
    const { row, role } = await accessCharacter(ctx, req.user!.id, (req.params as any).id);
    if (!canEditSheet(role)) throw forbidden();
    const { versionId } = z.object({ versionId: z.string().uuid() }).parse(req.body);
    const [v] = await ctx.db.select().from(characterVersions).where(and(eq(characterVersions.id, versionId), eq(characterVersions.characterId, row.id)));
    if (!v) throw notFound('Versão');
    // guarda o estado atual antes de restaurar; restaurar = nova revisao que substitui a ficha inteira
    await ctx.db.insert(characterVersions).values({ characterId: row.id, revision: row.revision, snapshot: row.sheet as any, kind: 'restore', label: 'Antes de restaurar', authorId: req.user!.id });
    const snapshot: any = v.snapshot;
    const ops: Op[] = Object.keys(snapshot).map((k) => ({ op: (k in (row.sheet as any) ? 'replace' : 'add') as 'replace', path: `/${k}`, value: snapshot[k] }));
    for (const k of Object.keys(row.sheet as any)) if (!(k in snapshot)) ops.push({ op: 'remove', path: `/${k}` });
    const res = await writeCharacter(ctx, row.id, { actor: { id: req.user!.id, role: 'owner' }, ops, note: `Restaurado: ${v.label || v.kind}` });
    return { character: presentCharacter((res as any).row, role) };
  });

  // ---- sincronizacao (offline)
  app.get('/api/sync', auth, async (req) => {
    const since = Number((req.query as any).since ?? 0) || 0;
    const rows = await ctx.db.select().from(characters).where(and(eq(characters.ownerId, req.user!.id), gt(characters.syncSeq, since))).orderBy(asc(characters.syncSeq));
    const live = rows.filter((r) => !r.deletedAt).map((r) => presentCharacter(r, 'owner'));
    const deleted = rows.filter((r) => r.deletedAt).map((r) => r.id);
    const cursor = rows.length ? rows[rows.length - 1].syncSeq : since;
    return { characters: live, deleted, cursor, bundleHash: ctx.bundleHash };
  });

  app.post('/api/sync/batch', auth, async (req) => {
    const { items } = batchBody.parse(req.body);
    const results: any[] = [];
    for (const it of items) {
      try {
        if (it.kind === 'create') {
          const { row } = await createCharacter(ctx, req.user!, { id: it.characterId, sheet: it.sheet ?? {} });
          results.push({ mutationId: it.mutationId, characterId: it.characterId, status: 'applied', revision: row.revision });
          continue;
        }
        const { row, role } = await accessCharacter(ctx, req.user!.id, it.characterId);
        if (!canEditSheet(role)) { results.push({ mutationId: it.mutationId, characterId: it.characterId, status: 'rejected', detail: 'sem permissão' }); continue; }
        if (it.kind === 'play-state') {
          await writeCharacter(ctx, row.id, { actor: { id: req.user!.id, role: 'owner' }, deviceId: it.deviceId, playState: () => sanitizePlayState(it.playState) });
          results.push({ mutationId: it.mutationId, characterId: it.characterId, status: 'applied' });
          continue;
        }
        const m = mutationSchema.parse({ mutationId: it.mutationId, deviceId: it.deviceId, baseRevision: it.baseRevision, ops: it.ops });
        const res = await writeCharacter(ctx, row.id, mutationToWrite(req.user!, 'owner', m));
        results.push(res.status === 'conflict'
          ? { mutationId: it.mutationId, characterId: it.characterId, status: 'conflict', conflicts: res.conflicts, current: presentCharacter(res.row, role) }
          : { mutationId: it.mutationId, characterId: it.characterId, status: 'applied', revision: res.row.revision });
      } catch (e: any) {
        if (e instanceof HttpError) results.push({ mutationId: it.mutationId, characterId: it.characterId, status: e.status === 404 ? 'gone' : 'rejected', detail: e.detail, errors: (e.extra as any)?.errors });
        else if (e instanceof z.ZodError) results.push({ mutationId: it.mutationId, characterId: it.characterId, status: 'rejected', detail: 'formato inválido' });
        else throw e;
      }
    }
    return { results };
  });

  // ---- retrato (upload)
  app.post('/api/characters/:id/portrait', auth, async (req) => {
    const { row, role } = await accessCharacter(ctx, req.user!.id, (req.params as any).id);
    if (!canEditSheet(role)) throw forbidden();
    const file = await req.file({ limits: { fileSize: 8 * 1024 * 1024, files: 1 } });
    if (!file) throw badRequest('Envie um arquivo de imagem.');
    const buf = await file.toBuffer();
    if (file.file.truncated) throw new HttpError(413, 'Arquivo grande demais', 'O limite é 8 MB.');
    const m = await ctx.storage.saveImage(req.user!.id, 'portrait', buf);
    const old = row.portraitMediaId;
    const [updated] = await ctx.db.update(characters).set({ portraitMediaId: m.id, updatedAt: new Date(), syncSeq: sql`nextval('character_sync_seq')` }).where(eq(characters.id, row.id)).returning();
    if (old) await ctx.storage.remove(old).catch(() => {});
    ctx.rt.characterChanged(updated, { ops: [], actorId: req.user!.id, deviceId: 'web', role: 'owner' });
    return { character: presentCharacter(updated, role), mediaId: m.id };
  });

  app.get('/api/media/:id/:variant', auth, async (req, reply) => {
    const { id, variant } = req.params as any;
    if (!z.string().uuid().safeParse(id).success || !['256', '768'].includes(variant)) throw notFound('Imagem');
    const [m] = await ctx.db.select().from(media).where(and(eq(media.id, id), isNull(media.deletedAt)));
    if (!m) throw notFound('Imagem');
    let allowed = m.ownerId === req.user!.id;
    if (!allowed) {
      const [ch] = await ctx.db.select().from(characters).where(eq(characters.portraitMediaId, id));
      if (ch) allowed = !!characterRole(req.user!.id, ch, await membershipOf(ctx, ch.campaignId, req.user!.id));
    }
    if (!allowed) throw notFound('Imagem');
    const data = await ctx.storage.read(m, variant);
    return reply.header('Cache-Control', 'private, max-age=86400').type('image/webp').send(data);
  });
}

export { isGmOp };
