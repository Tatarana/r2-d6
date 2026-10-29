// policies.ts - politicas puras de autorizacao (ver docs/architecture.md secao 9.2). Sem acesso a banco.
import { isGmOp, type Op } from '@r2d6/rules';

export type CharRole = 'owner' | 'gm' | 'peer' | null;

export interface CharFacts { ownerId: string; campaignId: string | null }
export interface Membership { role: 'gm' | 'player' }

/** Papel de `userId` sobre a ficha: dono, mestre da campanha do personagem, colega de mesa ou nada (404). */
export function characterRole(userId: string, ch: CharFacts, membership: Membership | null): CharRole {
  if (ch.ownerId === userId) return 'owner';
  if (!ch.campaignId || !membership) return null;
  return membership.role === 'gm' ? 'gm' : 'peer';
}

export const canViewSheet = (r: CharRole) => r !== null;
export const canEditSheet = (r: CharRole) => r === 'owner';
export const canGmAct = (r: CharRole) => r === 'gm';
export const canSeeDarkSide = (r: CharRole) => r === 'owner' || r === 'gm';
export const canSeeHistory = (r: CharRole) => r === 'owner' || r === 'gm';
export const canRollFor = (r: CharRole) => r === 'owner';

/** Ficha entregue ao papel: colegas nao veem Dark Side Points. */
export function redactSheet(sheet: any, role: CharRole) {
  if (canSeeDarkSide(role)) return sheet;
  const { dark_side_points, ...rest } = sheet;
  return rest;
}

/** O mestre so pode aplicar operacoes em CP/FP/DSP, creditos e ferimento. */
export const gmOpsAllowed = (ops: Op[]) => ops.every(isGmOp);

export type RollVisibility = 'table' | 'gm' | 'private';
export function canSeeRoll(userId: string, roll: { userId: string; visibility: RollVisibility }, role: 'gm' | 'player' | null) {
  if (roll.userId === userId) return true;
  if (role === null) return false;
  if (roll.visibility === 'table') return true;
  if (roll.visibility === 'gm') return role === 'gm';
  return false;
}

/** Quem decide o Wild Die 1: mestre da campanha (padrao, PD-04) ou o autor (config da campanha); rolagem solo = autor. */
export function canResolveWildOne(userId: string, roll: { userId: string; campaignId: string | null }, role: 'gm' | 'player' | null, resolver: 'gm' | 'roller') {
  if (!roll.campaignId) return roll.userId === userId;
  if (role === 'gm') return true;
  return resolver === 'roller' && roll.userId === userId;
}
