// round.ts - estado de mesa (play_state) e alvos de rolagem. Puro; usado no cliente e no servidor.
import { parse } from './dice';
import { ATTRS, ATTR_ABBR, FORCE_SKILLS, effectivePool, stunPenaltyCount, woundPenaltyDice, canSpendCP, canSpendFP, cpLimit, nextRound } from './rules';

export interface PlayState { n: number; actions: number; cpSpent: number; fpUsed: boolean; stuns: number[]; mortalRounds: number; activeWeapon?: number | null }

export function defaultPlayState(): PlayState {
  return { n: 1, actions: 1, cpSpent: 0, fpUsed: false, stuns: [], mortalRounds: 0, activeWeapon: null };
}

export const penaltyOf = (sheet: any, ps: PlayState) => ({
  actions: Math.max(0, ps.actions - 1), wound: woundPenaltyDice(sheet.wound_status), stuns: stunPenaltyCount(ps.stuns, ps.n),
});

export interface RollTarget { key: string; label: string; base: { dice: number; pips: number }; rollType: string; skillId?: string; group: string }

/** Alvos de rolagem de uma ficha: atributos, pericias, especializacoes, Forca e atalhos. skillsById: Map id -> skill do catalogo. */
export function targetsOf(sheet: any, skillsById: Map<string, any>): RollTarget[] {
  const out: RollTarget[] = [];
  for (const a of ATTRS) out.push({ key: `a:${a}`, label: `${ATTR_ABBR[a as keyof typeof ATTR_ABBR]} ${a}`, base: parse(sheet.attributes[a].value), rollType: 'attribute', group: 'Atributos' });
  for (const a of ATTRS) for (const s of sheet.attributes[a].skills || []) {
    const sk = skillsById.get(s.skill);
    const isReaction = sk && (sk.tags || []).includes('reaction');
    out.push({ key: `s:${s.skill}`, label: sk ? sk.name + (sk.advanced ? ' (A)' : '') : s.skill, base: parse(s.value), rollType: isReaction ? 'reaction' : 'skill', skillId: s.skill, group: 'Perícias' });
    for (const sp of s.specializations || []) {
      out.push({ key: `p:${s.skill}:${sp.name}`, label: `${sk ? sk.name : s.skill}: ${sp.name}`, base: parse(sp.value), rollType: 'specialization', skillId: s.skill, group: 'Especializações' });
    }
  }
  const fa = sheet.force_attributes || {};
  for (const f of FORCE_SKILLS) if (fa[f] && (fa[f].dice || fa[f].pips)) out.push({ key: `f:${f}`, label: `Force: ${f}`, base: parse(fa[f]), rollType: 'skill', group: 'Força' });
  const str = parse(sheet.attributes.strength.value);
  out.push({ key: 'i', label: 'Iniciativa (PER)', base: parse(sheet.attributes.perception.value), rollType: 'initiative', group: 'Atalhos' });
  out.push({ key: 'r', label: 'Resistir dano (STR)', base: str, rollType: 'resist', group: 'Atalhos' });
  out.push({ key: 'd', label: 'Dano (STR + arma)', base: str, rollType: 'damage', group: 'Atalhos' });
  return out;
}

/** Dano de arma: "STR+1D" soma Strength; "4D" e dano fixo da arma (US-06). */
export function parseWeaponDamage(text: string) {
  const t = String(text || '').trim();
  const m = t.match(/^STR(?:\s*\+\s*(\d+D(?:\s*\+\s*\d+)?|\d+))?/i);
  if (m) return { str: true, bonus: m[1] ? (/D/i.test(m[1]) ? m[1].replace(/\s+/g, '') : `+${m[1]}`) : '' };
  if (/^\d+D(\s*\+\s*\d+)?$/i.test(t)) return { str: false, bonus: t.replace(/\s+/g, '') };
  return null;
}

/** Parada efetiva de um alvo dado o estado da ficha e do round. */
export function poolForTarget(sheet: any, ps: PlayState, target: { base: any; rollType: string }, opts: { bonus?: any; noStr?: boolean } = {}) {
  const rollType = target.rollType;
  const base = rollType === 'damage' && opts.noStr ? { dice: 0, pips: 0 } : target.base;
  return effectivePool({
    base, actionsDeclared: ps.actions, woundState: sheet.wound_status, activeStuns: stunPenaltyCount(ps.stuns, ps.n),
    forcePoint: ps.fpUsed, rollType, bonus: rollType === 'damage' && opts.bonus ? opts.bonus : null,
  });
}

export { canSpendCP, canSpendFP, cpLimit, nextRound };
