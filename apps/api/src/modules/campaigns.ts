// campaigns.ts - campanhas: criar, convidar por codigo/link, membros, grupo, concessoes do mestre, avancar round.
import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { createHash, randomInt } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { attachCharacterBody, createCampaignBody, createInviteBody, grantBody, patchCampaignBody } from '@r2d6/contracts';
import { canAddFP, nextRound, type Op } from '@r2d6/rules';
import type { AppCtx } from '../ctx';
import { schema } from '../db/client';
import { badRequest, conflict, forbidden, notFound, unprocessable } from '../lib/http';
import { accessCharacter, membershipOf, summarize, writeCharacter } from './characters';

const { campaigns, campaignMembers, campaignInvites, characters, user } = schema;

export const DEFAULT_SETTINGS = { wildOneResolver: 'gm', partyVisibility: 'full', rollVisibilityDefault: 'table', houseRules: {} };
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I/L
const makeCode = () => {
  const pick = (n: number) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `${pick(4)}-${pick(4)}`;
};
export const hashCode = (code: string) => createHash('sha256').update(code.toUpperCase().replace(/[^A-Z0-9]/g, '')).digest('hex');

export async function requireMember(ctx: AppCtx, campaignId: string, userId: string) {
  if (!z.string().uuid().safeParse(campaignId).success) throw notFound('Campanha');
  const [c] = await ctx.db.select().from(campaigns).where(and(eq(campaigns.id, campaignId), isNull(campaigns.archivedAt)));
  if (!c) throw notFound('Campanha');
  const m = await membershipOf(ctx, campaignId, userId);
  if (!m) throw notFound('Campanha');
  return { campaign: c, role: m.role };
}
export async function requireGm(ctx: AppCtx, campaignId: string, userId: string) {
  const r = await requireMember(ctx, campaignId, userId);
  if (r.role !== 'gm') throw forbidden('Só o mestre pode fazer isso.');
  return r;
}
export const settingsOf = (c: { settings: unknown }) => ({ ...DEFAULT_SETTINGS, ...((c.settings as any) || {}) });

export function registerCampaignRoutes(app: FastifyInstance, ctx: AppCtx) {
  const auth = { preHandler: app.requireUser };

  app.get('/api/campaigns', auth, async (req) => {
    const rows = await ctx.db.select({ c: campaigns, role: campaignMembers.role }).from(campaignMembers)
      .innerJoin(campaigns, eq(campaigns.id, campaignMembers.campaignId))
      .where(and(eq(campaignMembers.userId, req.user!.id), isNull(campaigns.archivedAt))).orderBy(desc(campaigns.createdAt));
    const ids = rows.map((r) => r.c.id);
    const members = ids.length ? await ctx.db.select({ campaignId: campaignMembers.campaignId, role: campaignMembers.role, name: user.name }).from(campaignMembers).innerJoin(user, eq(user.id, campaignMembers.userId)).where(inArray(campaignMembers.campaignId, ids)) : [];
    return {
      campaigns: rows.map(({ c, role }) => ({
        id: c.id, name: c.name, description: c.description, myRole: role, currentRound: c.currentRound,
        memberCount: members.filter((m) => m.campaignId === c.id).length, gmName: members.find((m) => m.campaignId === c.id && m.role === 'gm')?.name ?? '',
      })),
    };
  });

  app.post('/api/campaigns', auth, async (req, reply) => {
    const body = createCampaignBody.parse(req.body);
    const created = await ctx.db.transaction(async (tx) => {
      const [c] = await tx.insert(campaigns).values({ name: body.name, description: body.description, createdBy: req.user!.id, settings: DEFAULT_SETTINGS }).returning();
      await tx.insert(campaignMembers).values({ campaignId: c.id, userId: req.user!.id, role: 'gm' });
      return c;
    });
    reply.code(201);
    return { campaign: { id: created.id, name: created.name } };
  });

  app.get('/api/campaigns/:id', auth, async (req) => {
    const { campaign, role } = await requireMember(ctx, (req.params as any).id, req.user!.id);
    const members = await ctx.db.select({ userId: campaignMembers.userId, role: campaignMembers.role, name: user.name, joinedAt: campaignMembers.joinedAt })
      .from(campaignMembers).innerJoin(user, eq(user.id, campaignMembers.userId)).where(eq(campaignMembers.campaignId, campaign.id)).orderBy(asc(campaignMembers.joinedAt));
    const chars = await ctx.db.select({ ch: characters, owner: user.name }).from(characters).innerJoin(user, eq(user.id, characters.ownerId))
      .where(and(eq(characters.campaignId, campaign.id), isNull(characters.deletedAt))).orderBy(asc(characters.createdAt));
    const invites = role === 'gm' ? await ctx.db.select({ id: campaignInvites.id, expiresAt: campaignInvites.expiresAt, uses: campaignInvites.uses, maxUses: campaignInvites.maxUses, revokedAt: campaignInvites.revokedAt })
      .from(campaignInvites).where(and(eq(campaignInvites.campaignId, campaign.id), isNull(campaignInvites.revokedAt))) : [];
    return {
      campaign: { id: campaign.id, name: campaign.name, description: campaign.description, settings: settingsOf(campaign), currentRound: campaign.currentRound, createdAt: campaign.createdAt },
      myRole: role, members,
      characters: chars.map(({ ch, owner }) => ({ ...summarize(ch, ch.ownerId === req.user!.id ? 'owner' : role === 'gm' ? 'gm' : 'peer'), ownerName: owner })),
      invites,
    };
  });

  app.patch('/api/campaigns/:id', auth, async (req) => {
    const { campaign } = await requireGm(ctx, (req.params as any).id, req.user!.id);
    const body = patchCampaignBody.parse(req.body);
    const [c] = await ctx.db.update(campaigns).set({
      ...(body.name ? { name: body.name } : {}), ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.settings ? { settings: { ...settingsOf(campaign), ...body.settings } } : {}),
    }).where(eq(campaigns.id, campaign.id)).returning();
    return { campaign: { id: c.id, name: c.name, settings: settingsOf(c) } };
  });

  app.delete('/api/campaigns/:id', auth, async (req, reply) => {
    const { campaign } = await requireGm(ctx, (req.params as any).id, req.user!.id);
    await ctx.db.update(campaigns).set({ archivedAt: new Date() }).where(eq(campaigns.id, campaign.id));
    await ctx.db.update(characters).set({ campaignId: null }).where(eq(characters.campaignId, campaign.id));
    reply.code(204);
  });

  // ---- convites
  app.post('/api/campaigns/:id/invites', auth, async (req, reply) => {
    const { campaign } = await requireGm(ctx, (req.params as any).id, req.user!.id);
    const body = createInviteBody.parse(req.body ?? {});
    const code = makeCode();
    await ctx.db.insert(campaignInvites).values({
      campaignId: campaign.id, codeHash: hashCode(code), role: body.role, createdBy: req.user!.id, maxUses: body.maxUses, expiresAt: new Date(Date.now() + body.days * 86400_000),
    });
    reply.code(201);
    return { code, url: `${ctx.cfg.APP_URL}/convite/${code}`, expiresAt: new Date(Date.now() + body.days * 86400_000) };
  });
  app.delete('/api/campaigns/:id/invites/:inviteId', auth, async (req, reply) => {
    const { campaign } = await requireGm(ctx, (req.params as any).id, req.user!.id);
    await ctx.db.update(campaignInvites).set({ revokedAt: new Date() }).where(and(eq(campaignInvites.id, (req.params as any).inviteId), eq(campaignInvites.campaignId, campaign.id)));
    reply.code(204);
  });

  const findInvite = async (code: string) => {
    const [inv] = await ctx.db.select().from(campaignInvites).where(eq(campaignInvites.codeHash, hashCode(code)));
    if (!inv || inv.revokedAt || inv.expiresAt < new Date() || inv.uses >= inv.maxUses) return null;
    const [c] = await ctx.db.select().from(campaigns).where(and(eq(campaigns.id, inv.campaignId), isNull(campaigns.archivedAt)));
    return c ? { inv, campaign: c } : null;
  };
  const inviteLimit = { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } };

  // previa publica (a pagina de convite mostra o nome da campanha e o mestre)
  app.get('/api/invites/:code', inviteLimit, async (req) => {
    const found = await findInvite((req.params as any).code);
    if (!found) throw new (await import('../lib/http')).HttpError(410, 'Convite indisponível', 'Este convite expirou, foi revogado ou atingiu o limite de usos.');
    const [gm] = await ctx.db.select({ name: user.name }).from(campaignMembers).innerJoin(user, eq(user.id, campaignMembers.userId)).where(and(eq(campaignMembers.campaignId, found.campaign.id), eq(campaignMembers.role, 'gm'))).limit(1);
    return { campaign: { name: found.campaign.name, description: found.campaign.description }, gmName: gm?.name ?? '' };
  });
  app.post('/api/invites/:code/accept', { ...auth, ...inviteLimit }, async (req) => {
    const found = await findInvite((req.params as any).code);
    if (!found) throw new (await import('../lib/http')).HttpError(410, 'Convite indisponível', 'Este convite expirou, foi revogado ou atingiu o limite de usos.');
    const already = await membershipOf(ctx, found.campaign.id, req.user!.id);
    if (!already) {
      await ctx.db.transaction(async (tx) => {
        await tx.insert(campaignMembers).values({ campaignId: found.campaign.id, userId: req.user!.id, role: found.inv.role });
        await tx.update(campaignInvites).set({ uses: sql`${campaignInvites.uses} + 1` }).where(eq(campaignInvites.id, found.inv.id));
      });
      ctx.rt.campaignMembers(found.campaign.id);
    }
    return { campaignId: found.campaign.id, joined: !already };
  });

  // ---- membros
  app.delete('/api/campaigns/:id/members/:userId', auth, async (req, reply) => {
    const { campaign, role } = await requireMember(ctx, (req.params as any).id, req.user!.id);
    const target = (req.params as any).userId as string;
    if (target !== req.user!.id && role !== 'gm') throw forbidden('Só o mestre remove outros jogadores.');
    const gms = await ctx.db.select().from(campaignMembers).where(and(eq(campaignMembers.campaignId, campaign.id), eq(campaignMembers.role, 'gm')));
    if (gms.length === 1 && gms[0].userId === target) throw conflict('A campanha precisa de pelo menos um mestre.');
    await ctx.db.delete(campaignMembers).where(and(eq(campaignMembers.campaignId, campaign.id), eq(campaignMembers.userId, target)));
    await ctx.db.update(characters).set({ campaignId: null, syncSeq: sql`nextval('character_sync_seq')` }).where(and(eq(characters.campaignId, campaign.id), eq(characters.ownerId, target)));
    ctx.rt.campaignMembers(campaign.id);
    ctx.rt.syncHint(target);
    reply.code(204);
  });

  // ---- personagens na campanha (no maximo uma por personagem)
  app.post('/api/campaigns/:id/characters', auth, async (req) => {
    const { campaign } = await requireMember(ctx, (req.params as any).id, req.user!.id);
    const { characterId } = attachCharacterBody.parse(req.body);
    const { row, role } = await accessCharacter(ctx, req.user!.id, characterId);
    if (role !== 'owner') throw forbidden('Só o dono vincula o personagem.');
    if (row.campaignId && row.campaignId !== campaign.id) throw conflict('Este personagem já participa de outra campanha. Um personagem participa de no máximo uma campanha.');
    await ctx.db.update(characters).set({ campaignId: campaign.id, syncSeq: sql`nextval('character_sync_seq')` }).where(eq(characters.id, row.id));
    ctx.rt.campaignMembers(campaign.id);
    return { ok: true };
  });
  app.delete('/api/campaigns/:id/characters/:cid', auth, async (req, reply) => {
    const { campaign, role } = await requireMember(ctx, (req.params as any).id, req.user!.id);
    const { row } = await accessCharacter(ctx, req.user!.id, (req.params as any).cid);
    if (row.campaignId !== campaign.id) throw notFound('Personagem');
    if (row.ownerId !== req.user!.id && role !== 'gm') throw forbidden();
    await ctx.db.update(characters).set({ campaignId: null, syncSeq: sql`nextval('character_sync_seq')` }).where(eq(characters.id, row.id));
    ctx.rt.campaignMembers(campaign.id);
    ctx.rt.syncHint(row.ownerId);
    reply.code(204);
  });

  // ---- concessoes do mestre (CP/FP/DSP, creditos, ferimento): registradas no historico com actor_role=gm
  app.post('/api/campaigns/:id/characters/:cid/grant', auth, async (req) => {
    const { campaign } = await requireGm(ctx, (req.params as any).id, req.user!.id);
    const body = grantBody.parse(req.body);
    const { row } = await accessCharacter(ctx, req.user!.id, (req.params as any).cid);
    if (row.campaignId !== campaign.id) throw notFound('Personagem');
    const sheet: any = row.sheet;
    const ops: Op[] = [];
    if (body.cp) ops.push({ op: 'inc', path: '/character_points', value: body.cp });
    if (body.fp) {
      if (body.fp > 0) {
        const chk = canAddFP(sheet.force_points + body.fp - 1, !!sheet.force_sensitive);
        if (!chk.ok) throw unprocessable(`${chk.reason} (${chk.cite})`);
      }
      ops.push({ op: 'inc', path: '/force_points', value: body.fp });
    }
    if (body.dsp) ops.push({ op: 'inc', path: '/dark_side_points', value: body.dsp });
    if (body.credits) ops.push({ op: 'inc', path: '/credits', value: body.credits });
    if (body.wound) ops.push({ op: 'replace', path: '/wound_status', value: body.wound });
    if (!ops.length && !body.stun) throw badRequest('Nada a aplicar.');
    const note = body.note || [body.cp && `CP ${body.cp > 0 ? '+' : ''}${body.cp}`, body.fp && `FP ${body.fp > 0 ? '+' : ''}${body.fp}`, body.dsp && `DSP ${body.dsp > 0 ? '+' : ''}${body.dsp}`, body.credits && `créditos ${body.credits}`, body.wound && `ferimento: ${body.wound}`, body.stun && 'stun'].filter(Boolean).join(', ');
    const res = await writeCharacter(ctx, row.id, {
      actor: { id: req.user!.id, role: 'gm' }, ops: ops.length ? ops : undefined, baseRevision: row.revision, note: `Mestre: ${note}`,
      playState: body.stun ? (p) => ({ ...p, stuns: [...(p.stuns || []), p.n] }) : undefined,
    });
    if (res.status === 'conflict') throw conflict('A ficha mudou durante a concessão. Tente de novo.');
    return { character: summarize(res.row, 'gm'), warnings: res.warnings };
  });

  // ---- grupo (painel do mestre) e round
  app.get('/api/campaigns/:id/party', auth, async (req) => {
    const { campaign, role } = await requireMember(ctx, (req.params as any).id, req.user!.id);
    const chars = await ctx.db.select({ ch: characters, owner: user.name }).from(characters).innerJoin(user, eq(user.id, characters.ownerId))
      .where(and(eq(characters.campaignId, campaign.id), isNull(characters.deletedAt))).orderBy(asc(characters.createdAt));
    return {
      round: campaign.currentRound,
      party: chars.map(({ ch, owner }) => {
        const r = ch.ownerId === req.user!.id ? 'owner' : role === 'gm' ? 'gm' : 'peer';
        const s: any = ch.sheet;
        return {
          ...summarize(ch, r), ownerName: owner,
          weapons: role === 'gm' ? (s.weapons || []).map((w: any) => ({ type: w.type, ammoMax: w.ammo_max, ammoUsed: w.ammo_used })) : undefined,
          warnings: role === 'gm' ? (ch.validation as any)?.warnings ?? [] : undefined,
        };
      }),
    };
  });

  app.post('/api/campaigns/:id/round/next', auth, async (req) => {
    const { campaign } = await requireGm(ctx, (req.params as any).id, req.user!.id);
    const [c] = await ctx.db.update(campaigns).set({ currentRound: sql`${campaigns.currentRound} + 1` }).where(eq(campaigns.id, campaign.id)).returning();
    const chars = await ctx.db.select().from(characters).where(and(eq(characters.campaignId, campaign.id), isNull(characters.deletedAt)));
    for (const ch of chars) {
      await writeCharacter(ctx, ch.id, {
        actor: { id: req.user!.id, role: 'gm' }, deviceId: 'gm',
        playState: (p) => {
          const next: any = nextRound(p);
          if ((ch.sheet as any).wound_status === 'mortally-wounded') next.mortalRounds = (p.mortalRounds || 0) + 1;
          return next;
        },
      });
    }
    ctx.rt.campaignRound(campaign.id, c.currentRound);
    return { round: c.currentRound };
  });
}
