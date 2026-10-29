// me.ts - perfil, metadados publicos e "Baixar meus dados" (LGPD).
import { and, eq, isNull } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import type { AppCtx } from '../ctx';
import { schema } from '../db/client';

const { characters, characterVersions, campaignMembers, rolls } = schema;

export function registerMeRoutes(app: FastifyInstance, ctx: AppCtx) {
  app.get('/api/meta', async () => ({
    name: 'r2-d6', version: '0.1.0', bundleHash: ctx.bundleHash,
    features: { google: ctx.cfg.features.google, discord: ctx.cfg.features.discord, assistant: ctx.cfg.features.assistant, magicLink: false },
  }));

  app.get('/api/me', { preHandler: app.requireUser }, async (req) => ({ user: req.user }));

  app.get('/healthz', async () => ({ ok: true }));
  app.get('/readyz', async (_req, reply) => {
    try { await ctx.db.execute('select 1' as any); return { ok: true }; } catch { reply.code(503); return { ok: false }; }
  });

  // LGPD: tudo que a conta guarda, em JSON (retratos ficam de fora; baixe pela ficha)
  app.get('/api/me/export', { preHandler: app.requireUser }, async (req, reply) => {
    const uid = req.user!.id;
    const chars = await ctx.db.select().from(characters).where(and(eq(characters.ownerId, uid), isNull(characters.deletedAt)));
    const versions = chars.length ? await ctx.db.select().from(characterVersions) : [];
    const mine = new Set(chars.map((c) => c.id));
    const data = {
      exportedAt: new Date().toISOString(), user: req.user,
      characters: chars.map((c) => ({ id: c.id, name: c.name, sheet: c.sheet, playState: c.playState, revision: c.revision, createdAt: c.createdAt })),
      versions: versions.filter((v) => mine.has(v.characterId)).map((v) => ({ characterId: v.characterId, revision: v.revision, kind: v.kind, label: v.label, snapshot: v.snapshot, createdAt: v.createdAt })),
      campaigns: await ctx.db.select().from(campaignMembers).where(eq(campaignMembers.userId, uid)),
      rolls: await ctx.db.select().from(rolls).where(eq(rolls.userId, uid)),
    };
    reply.header('Content-Disposition', 'attachment; filename="r2d6-meus-dados.json"');
    return data;
  });
}
