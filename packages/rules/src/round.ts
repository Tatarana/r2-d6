// round.ts - estado de mesa (play_state) e alvos de rolagem. Puro; usado no cliente e no servidor.
import { format, parse } from './dice';
import { ATTRS, ATTR_ABBR, FORCE_SKILLS, effectivePool, scaleAdjust, stunPenaltyCount, woundPenaltyDice, canSpendCP, canSpendFP, cpLimit, nextRound } from './rules';

/** Escalas de combate (RD-24, p.95), da menor para a maior. */
export const SCALES = ['character', 'speeder', 'walker', 'starfighter', 'capital', 'death-star'] as const;

/** armorWorn: indice em sheet.armor; scale/opponentScale: escala do personagem (ou do veiculo que pilota) e do oponente. */
export interface PlayState {
  n: number; actions: number; cpSpent: number; fpUsed: boolean; stuns: number[]; mortalRounds: number; activeWeapon?: number | null;
  armorWorn?: number | null; scale?: string; opponentScale?: string;
}

export function defaultPlayState(): PlayState {
  return { n: 1, actions: 1, cpSpent: 0, fpUsed: false, stuns: [], mortalRounds: 0, activeWeapon: null, armorWorn: null, scale: 'character', opponentScale: 'character' };
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

// ------------------------------------------------------------------ armadura e escala (p.94-95, RD-24)
/** Por rolagem: tipo do dano recebido (armadura protege diferente) e se a pericia e um ataque (bonus de escala). */
export interface RollMods { damageKind?: 'physical' | 'energy'; attack?: boolean }
export interface ModsCtx { armorById: Map<string, any>; scaleTable: any; skillsById: Map<string, any> }

export const modsContext = (bundle: any, skillsById: Map<string, any>): ModsCtx => ({
  armorById: new Map(bundle.entities.armor.map((a: any) => [a.id, a])), scaleTable: bundle.tables['combat-modifiers'].scale, skillsById,
});

const SCALE_PT: Record<string, string> = { character: 'personagem', speeder: 'speeder', walker: 'walker', starfighter: 'caça', capital: 'nave capital', 'death-star': 'Death Star' };
export const scaleLabel = (s: string) => SCALE_PT[s] ?? s;

/** Armadura vestida e a peca da ficha correspondente no catalogo (null se nenhuma). */
export function wornArmor(sheet: any, ps: PlayState, ctx: ModsCtx) {
  const i = ps.armorWorn;
  const entry = Number.isInteger(i) ? sheet.armor?.[i as number] : null;
  const item = entry ? ctx.armorById.get(entry.item) : null;
  return entry ? { entry, protection: item?.protection ?? null } : null;
}

/**
 * Bonus e penalidade de armadura e escala para um alvo, com uma linha de explicacao por efeito.
 * Armadura (p.94): soma so na resistencia (fisico ou energia) e tira da Dexterity e das pericias dela.
 * Escala (p.95): menor ataca maior = atacante soma no ataque, alvo na resistencia; maior ataca menor = alvo soma na esquiva, atacante no dano.
 */
export function combatMods(sheet: any, ps: PlayState, target: { key: string; rollType: string; skillId?: string }, mods: RollMods, ctx: ModsCtx) {
  const lines: string[] = [];
  let bonus = { dice: 0, pips: 0 }, penalty = 0;
  const plus = (code: any, why: string) => { const c = parse(code); bonus = { dice: bonus.dice + c.dice, pips: bonus.pips + c.pips }; lines.push(`${why}: +${format(c)}`); };

  const armor = wornArmor(sheet, ps, ctx);
  const prot = armor?.protection;
  if (target.rollType === 'resist' && prot) {
    const kind = mods.damageKind ?? 'energy';
    if (prot[kind]) plus(prot[kind], `Armadura ${armor!.entry.type} (${kind === 'energy' ? 'energia' : 'físico'}, p.94)`);
    else lines.push(`Armadura ${armor!.entry.type}: não protege contra dano ${kind === 'energy' ? 'de energia' : 'físico'}`);
  }
  const attr = target.key === 'a:dexterity' ? 'dexterity' : target.skillId ? ctx.skillsById.get(target.skillId)?.attribute : null;
  if (prot?.dexterity_penalty && attr === 'dexterity') {
    const p = Math.abs(parse(prot.dexterity_penalty).dice);
    if (p) { penalty += p; lines.push(`Armadura ${armor!.entry.type}: -${p}D em Dexterity e perícias dela (p.94)`); }
  }

  const self = ps.scale ?? 'character', opp = ps.opponentScale ?? self;
  if (self !== opp) {
    const incoming = scaleAdjust(opp, self, ctx.scaleTable), outgoing = scaleAdjust(self, opp, ctx.scaleTable);
    const why = (a: string, b: string) => `Escala: ${scaleLabel(a)} contra ${scaleLabel(b)} (p.95)`;
    if (target.rollType === 'resist' && incoming.resistBonus) plus(incoming.resistBonus, why(opp, self));
    else if (target.rollType === 'reaction' && incoming.dodgeBonus) plus(incoming.dodgeBonus, why(opp, self));
    else if (target.rollType === 'damage' && outgoing.damageBonus) plus(outgoing.damageBonus, why(self, opp));
    else if (mods.attack && outgoing.attackBonus) plus(outgoing.attackBonus, why(self, opp));
  }
  return { bonus: bonus.dice || bonus.pips ? bonus : null, penalty, lines };
}

/** Parada efetiva de um alvo dado o estado da ficha e do round (com armadura e escala quando ha contexto). */
export function poolForTarget(sheet: any, ps: PlayState, target: { key?: string; base: any; rollType: string; skillId?: string },
  opts: { bonus?: any; noStr?: boolean; mods?: RollMods; ctx?: ModsCtx } = {}) {
  const rollType = target.rollType;
  const base = rollType === 'damage' && opts.noStr ? { dice: 0, pips: 0 } : target.base;
  const cm = opts.ctx ? combatMods(sheet, ps, { key: target.key ?? '', rollType, skillId: target.skillId }, opts.mods ?? {}, opts.ctx) : null;
  const weapon = rollType === 'damage' && opts.bonus ? parse(opts.bonus) : null;
  const sum = [weapon, cm?.bonus].filter(Boolean).reduce((a: any, b: any) => ({ dice: a.dice + b.dice, pips: a.pips + b.pips }), { dice: 0, pips: 0 });
  return effectivePool({
    base, actionsDeclared: ps.actions, woundState: sheet.wound_status, activeStuns: stunPenaltyCount(ps.stuns, ps.n),
    forcePoint: ps.fpUsed, rollType, bonus: sum.dice || sum.pips ? sum : null, extraPenalty: cm?.penalty ?? 0, extraLines: cm?.lines ?? [],
  });
}

export { canSpendCP, canSpendFP, cpLimit, nextRound };
