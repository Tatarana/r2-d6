// advance.ts - evolucao entre aventuras (p.25-28, RD-40): opcoes da ficha, custo em CP, tempo de treino, teste de teto e aplicacao.
import { fromPips, parse, toPips } from './dice';
import { ATTRS, FORCE_SKILLS, advancementCost, checkAdvancedPrereq } from './rules';
import { skillCode, toDie } from './sheet';

export type AdvKind = 'skill' | 'specialization' | 'advanced' | 'newSkill' | 'learnAdvanced' | 'attribute' | 'move' | 'force' | 'sensitive';

export interface AdvOption {
  key: string; kind: AdvKind; label: string; group: string;
  current: string; next: string; cost: number;
  /** posicao na ficha */
  attr?: string; skillId?: string; specIdx?: number; force?: string;
  /** motivo de nao poder (pre-requisito, maximo de Move...) */
  blocked?: string;
  /** atributo acima do maximo da especie: teste de teto ao fim do treino (p.27) */
  ceiling?: string | null;
}

const code = (c: any) => fromPips(toPips(c));
const plusPip = (c: any) => toDie(fromPips(toPips(c) + 1));
const txt = (c: any) => toDie(c).text;

/** Move inicial e maximo da especie ("10/12"); sem especie, sem limite. */
export function moveLimits(speciesBlock: any) {
  const m = String(speciesBlock?.move ?? '').match(/(\d+)\D+(\d+)/);
  return m ? { start: Number(m[1]), max: Number(m[2]) } : null;
}

/**
 * Tudo que a ficha pode evoluir agora, com custo.
 * ctx: skills (catalogo), skillsById, advancedPrereqs (bundle.derived), speciesBlock (bloco da especie da ficha ou null).
 */
export function advanceOptions(sheet: any, ctx: { skills: any[]; skillsById: Map<string, any>; advancedPrereqs: any; speciesBlock: any }): AdvOption[] {
  const out: AdvOption[] = [];
  for (const a of ATTRS) {
    const at = sheet.attributes[a];
    const cur = code(at.value);
    const max = ctx.speciesBlock?.attributes?.[a]?.max;
    out.push({ key: `a:${a}`, kind: 'attribute', label: a, group: 'Atributos', attr: a, current: txt(cur), next: plusPip(cur).text, cost: advancementCost('attribute', cur),
      ceiling: max ? max.text : null });
    for (const s of at.skills || []) {
      const sk = ctx.skillsById.get(s.skill);
      const v = code(s.value);
      const kind: AdvKind = sk?.advanced ? 'advanced' : 'skill';
      out.push({ key: `s:${s.skill}`, kind, label: (sk?.name ?? s.skill) + (sk?.advanced ? ' (A)' : ''), group: 'Perícias', attr: a, skillId: s.skill,
        current: txt(v), next: plusPip(v).text, cost: advancementCost(kind, v) });
      (s.specializations || []).forEach((sp: any, j: number) => {
        const sv = code(sp.value);
        out.push({ key: `p:${s.skill}:${j}`, kind: 'specialization', label: `${sk?.name ?? s.skill}: ${sp.name}`, group: 'Especializações', attr: a, skillId: s.skill, specIdx: j,
          current: txt(sv), next: plusPip(sv).text, cost: advancementCost('specialization', sv) });
      });
    }
  }
  // perícias novas: chegar a +1 pip acima do atributo custa o numero antes do D do atributo (p.26)
  const have = new Set(ATTRS.flatMap((a) => (sheet.attributes[a].skills || []).map((s: any) => s.skill)));
  for (const sk of ctx.skills) {
    if (have.has(sk.id)) continue;
    const attr = sheet.attributes[sk.attribute];
    if (!attr) continue;
    if (sk.advanced) {
      const chk = checkAdvancedPrereq(sk.id, (id: string) => skillCode(sheet, id, ctx.skillsById) ?? { dice: 0, pips: 0 }, ctx.advancedPrereqs);
      out.push({ key: `n:${sk.id}`, kind: 'learnAdvanced', label: `${sk.name} (A)`, group: 'Aprender perícia avançada', attr: sk.attribute, skillId: sk.id, current: '—', next: '1D', cost: 2,
        blocked: chk.ok ? undefined : `Pré-requisito: ${chk.text ?? 'ver a perícia'}` });
    } else {
      const av = code(attr.value);
      out.push({ key: `n:${sk.id}`, kind: 'newSkill', label: sk.name, group: 'Perícias novas', attr: sk.attribute, skillId: sk.id, current: txt(av), next: plusPip(av).text, cost: advancementCost('newSkill', av) });
    }
  }
  if (sheet.force_sensitive) {
    for (const f of FORCE_SKILLS) {
      const v = code(sheet.force_attributes?.[f] ?? { dice: 0, pips: 0 });
      if (!v.dice && !v.pips) continue; // aprender uma pericia da Forca exige professor e fica com o mestre (p.151)
      out.push({ key: `f:${f}`, kind: 'force', label: `Force: ${f}`, group: 'Força', force: f, current: txt(v), next: plusPip(v).text, cost: advancementCost('skill', v) });
    }
  } else {
    out.push({ key: 'fs', kind: 'sensitive', label: 'Tornar-se sensível à Força', group: 'Força', current: 'não', next: 'sim (+1 Force Point)', cost: advancementCost('sensitive', null) });
  }
  const mv = Number(sheet.move ?? 10);
  const lim = moveLimits(ctx.speciesBlock);
  out.push({ key: 'm', kind: 'move', label: 'Move', group: 'Move', current: String(mv), next: String(mv + 1), cost: advancementCost('move', mv),
    blocked: lim && mv >= lim.max ? `Máximo da espécie: ${lim.max}` : undefined });
  return out;
}

/** Custo efetivo: pericias da Forca custam o dobro sem professor (p.151). */
export const effectiveCost = (opt: AdvOption, teacher: boolean) => (opt.kind === 'force' && !teacher ? opt.cost * 2 : opt.cost);

/**
 * Tempo de treino (p.26-28). extraCP corta 1 dia cada (minimo 1 dia; 1 semana em avancada, atributo e Move).
 * usedLastAdventure dispensa o treino de pericia, especializacao e pericia nova.
 */
export function trainingTime(opt: AdvOption, o: { teacher: boolean; usedLastAdventure: boolean; extraCP: number }) {
  const cost = effectiveCost(opt, o.teacher);
  const extra = Math.max(0, o.extraCP | 0);
  if (opt.kind === 'sensitive') return { days: 0, base: 0, minDays: 0, extraUsed: 0, text: 'sem treino' };
  if ((opt.kind === 'skill' || opt.kind === 'specialization' || opt.kind === 'newSkill') && o.usedLastAdventure) return { days: 0, base: 0, minDays: 0, extraUsed: 0, text: 'sem treino (usada na última aventura)' };
  const weekly = opt.kind === 'advanced' || opt.kind === 'learnAdvanced' || opt.kind === 'attribute' || opt.kind === 'move';
  const base = (weekly ? 7 : 1) * cost * (o.teacher ? 1 : 2);
  const minDays = weekly ? 7 : 1;
  const days = Math.max(minDays, base - extra);
  return { days, base, minDays, extraUsed: base - days, text: days % 7 === 0 && days >= 7 ? `${days / 7} semana(s)` : `${days} dia(s)` };
}

/** Teste de teto do atributo (p.27): jogador rola o novo valor, mestre rola o maximo da especie; maior que o do mestre = falha e volta metade do CP. */
export function ceilingCheck(playerTotal: number, gmTotal: number, cost: number) {
  const ok = playerTotal <= gmTotal;
  return { ok, refund: ok ? 0 : Math.floor(cost / 2) };
}

/** Aplica a evolucao no rascunho da ficha (debita o CP, sobe o valor). Retorna a descricao para o historico. */
export function applyAdvance(d: any, opt: AdvOption, spentCP: number, skillsById: Map<string, any>) {
  d.character_points = Math.max(0, (d.character_points ?? 0) - spentCP);
  switch (opt.kind) {
    case 'attribute': {
      const at = d.attributes[opt.attr!];
      at.value = plusPip(at.value);
      // todas as pericias do atributo (menos as avancadas) sobem 1 pip junto (p.27)
      for (const s of at.skills || []) if (!skillsById.get(s.skill)?.advanced) s.value = plusPip(s.value);
      break;
    }
    case 'skill': case 'advanced': {
      const s = d.attributes[opt.attr!].skills.find((x: any) => x.skill === opt.skillId);
      if (s) s.value = plusPip(s.value);
      break;
    }
    case 'specialization': {
      const s = d.attributes[opt.attr!].skills.find((x: any) => x.skill === opt.skillId);
      if (s?.specializations?.[opt.specIdx!]) s.specializations[opt.specIdx!].value = plusPip(s.specializations[opt.specIdx!].value);
      break;
    }
    case 'newSkill': d.attributes[opt.attr!].skills.push({ skill: opt.skillId, value: plusPip(d.attributes[opt.attr!].value), specializations: [] }); break;
    case 'learnAdvanced': d.attributes[opt.attr!].skills.push({ skill: opt.skillId, value: toDie('1D'), specializations: [] }); break;
    case 'force': (d.force_attributes ??= {})[opt.force!] = plusPip(d.force_attributes[opt.force!] ?? parse('0D')); break;
    case 'move': d.move = Number(d.move ?? 10) + 1; break;
    case 'sensitive': d.force_sensitive = true; d.force_points = (d.force_points ?? 0) + 1; break;
  }
  return `${opt.label}: ${opt.current} → ${opt.next} (${spentCP} CP)`;
}
