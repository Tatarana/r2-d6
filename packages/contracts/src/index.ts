// @r2d6/contracts - schemas Zod dos DTOs REST e eventos Socket.IO (validam no servidor e tipam o cliente).
import { z } from 'zod';

export const uuid = z.string().uuid();

// ---- operacoes sobre a ficha (ADR-0007)
export const opSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('add'), path: z.string().min(1).max(200), value: z.any() }),
  z.object({ op: z.literal('replace'), path: z.string().min(1).max(200), value: z.any() }),
  z.object({ op: z.literal('remove'), path: z.string().min(1).max(200) }),
  z.object({ op: z.literal('inc'), path: z.string().min(1).max(200), value: z.number().int().min(-1000000).max(1000000) }),
]);

export const mutationSchema = z.object({
  mutationId: uuid,
  deviceId: z.string().min(1).max(64).default('web'),
  baseRevision: z.number().int().min(0),
  ops: z.array(opSchema).min(1).max(200),
});
export type MutationInput = z.infer<typeof mutationSchema>;

export const createCharacterBody = z.object({
  id: uuid.optional(),
  mutationId: uuid.optional(),
  sheet: z.record(z.any()),
  templateType: z.string().max(120).optional(),
});

export const batchBody = z.object({
  items: z.array(z.object({
    kind: z.enum(['patch', 'create', 'play-state']),
    characterId: uuid,
    mutationId: uuid.optional(),
    deviceId: z.string().max(64).optional(),
    baseRevision: z.number().int().min(0).optional(),
    ops: z.array(opSchema).max(200).optional(),
    sheet: z.record(z.any()).optional(),
    playState: z.record(z.any()).optional(),
  })).max(100),
});

export const playStateBody = z.object({ playState: z.record(z.any()) });

// ---- campanhas
export const createCampaignBody = z.object({ name: z.string().trim().min(2).max(80), description: z.string().max(2000).optional().default('') });
export const campaignSettings = z.object({
  wildOneResolver: z.enum(['gm', 'roller']).optional(),
  partyVisibility: z.enum(['summary', 'full']).optional(),
  rollVisibilityDefault: z.enum(['table', 'gm']).optional(),
  houseRules: z.record(z.boolean()).optional(),
});
export const patchCampaignBody = z.object({ name: z.string().trim().min(2).max(80).optional(), description: z.string().max(2000).optional(), settings: campaignSettings.optional() });
export const createInviteBody = z.object({ role: z.enum(['player']).default('player'), maxUses: z.number().int().min(1).max(50).default(10), days: z.number().int().min(1).max(30).default(7) });
export const attachCharacterBody = z.object({ characterId: uuid });
export const grantBody = z.object({
  cp: z.number().int().min(-50).max(50).optional(),
  fp: z.number().int().min(-10).max(10).optional(),
  dsp: z.number().int().min(-10).max(10).optional(),
  credits: z.number().int().min(-1000000).max(1000000).optional(),
  wound: z.enum(['healthy', 'wounded', 'wounded-twice', 'incapacitated', 'mortally-wounded', 'killed']).optional(),
  stun: z.boolean().optional(),
  note: z.string().max(200).optional(),
});

// ---- rolagens
export const createRollBody = z.object({
  id: uuid.optional(),
  characterId: uuid,
  targetKey: z.string().min(1).max(120),
  mode: z.enum(['digital', 'physical']).default('digital'),
  visibility: z.enum(['table', 'gm', 'private']).default('table'),
  damageBonus: z.string().max(20).optional(),
  noStr: z.boolean().optional(),
  /** valores: dados fisicos (mode=physical) ou rolagem feita offline no aparelho (rng=client) */
  values: z.object({ normals: z.array(z.number().int().min(1).max(6)).max(40), wild: z.array(z.number().int().min(1).max(6)).min(1).max(30) }).optional(),
  rng: z.enum(['server', 'client']).default('server'),
});
export const cpBody = z.object({ count: z.number().int().min(1).max(5), values: z.array(z.array(z.number().int().min(1).max(6)).min(1).max(20)).max(5).optional() });
export const wildOneBody = z.object({ choice: z.enum(['normal', 'complication', 'subtract']) });
export const fpBody = z.object({ use: z.boolean() });

// ---- assistente
export const askBody = z.object({ question: z.string().trim().min(3).max(600), characterId: uuid.optional() });

// ---- eventos Socket.IO
export const SOCKET_EVENTS = ['roll:created', 'roll:updated', 'character:changed', 'party:changed', 'campaign:round', 'campaign:members', 'presence', 'sync:hint'] as const;
export type SocketEvent = (typeof SOCKET_EVENTS)[number];

export const WOUND_LABEL: Record<string, string> = {
  healthy: 'Healthy', stunned: 'Stunned', wounded: 'Wounded', 'wounded-twice': 'Wounded twice',
  incapacitated: 'Incapacitated', 'mortally-wounded': 'Mortally Wounded', killed: 'Killed',
};
