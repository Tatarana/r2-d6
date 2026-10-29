// rules.js - regras do jogo (puro, sem DOM). Cada funcao cita a RD de docs/rules-decisions.md.
import { parse, format, add, double, toPips, fromPips, normalize } from './dice.js';

export const ATTRS = ['dexterity', 'knowledge', 'mechanical', 'perception', 'strength', 'technical'];
export const ATTR_ABBR = { dexterity: 'DEX', knowledge: 'KNO', mechanical: 'MEC', perception: 'PER', strength: 'STR', technical: 'TEC' };
export const FORCE_SKILLS = ['control', 'sense', 'alter'];
export const WOUND_STATES = ['healthy', 'stunned', 'wounded', 'wounded-twice', 'incapacitated', 'mortally-wounded', 'killed'];
export const ROLL_TYPES = ['skill', 'attribute', 'specialization', 'reaction', 'damage', 'resist', 'initiative'];

// ------------------------------------------------------------------ parada efetiva
const NO_ACTION_PENALTY = new Set(['damage', 'resist', 'initiative']); // RD-07, RD-16
const NO_WOUND_PENALTY = new Set(['damage', 'resist']);               // RD-20, RD-23

/** Penalidade de ferimento em dados (RD-20). Incapacitated ou pior = nao age. */
export function woundPenaltyDice(woundState) {
  switch (woundState) {
    case 'wounded': return 1;
    case 'wounded-twice': return 2;
    default: return 0;
  }
}
export const cannotAct = (w) => w === 'incapacitated' || w === 'mortally-wounded' || w === 'killed';

/**
 * Parada efetiva com explicacao linha a linha.
 * RD-07/08/14/20/21/23. Ordem (RD-14, CASA): dobra (FP) e depois subtrai penalidades.
 * `bonus` (opcional) e somado depois de dobrar e nao e dobrado (arma no dano, RD-13).
 */
export function effectivePool({ base, actionsDeclared = 1, woundState = 'healthy', activeStuns = 0,
  forcePoint = false, rollType = 'skill', bonus = null }) {
  const lines = [];
  let code = parse(base);
  lines.push(`Base: ${format(code)}`);
  const result = (usable, extra = {}) => ({
    usable, code: usable ? code : { dice: 0, pips: 0 },
    text: usable ? format(code) : '0D', lines, penaltyDice: 0, ...extra,
  });

  if (cannotAct(woundState) && !NO_WOUND_PENALTY.has(rollType)) {
    lines.push(`Estado ${woundState}: nao pode agir (RD-20).`);
    return result(false);
  }

  let fpApplied = false;
  if (forcePoint) {
    if (rollType === 'initiative') {
      lines.push('Force Point nao vale em iniciativa (RD-16, p.78).');
    } else {
      code = double(code); // RD-13: dados e pips, sem renormalizar
      fpApplied = true;
      lines.push(`Force Point dobra: ${format(code)} (RD-13, p.85)`);
    }
  }
  if (bonus) {
    const b = parse(bonus);
    code = { dice: code.dice + b.dice, pips: code.pips + b.pips };
    lines.push(`Bonus (nao dobrado): +${format(b)} = ${format(code)}`);
  }

  let penalty = 0;
  const actionPenalty = NO_ACTION_PENALTY.has(rollType) ? 0 : Math.max(0, actionsDeclared - 1);
  if (actionsDeclared > 1) {
    if (actionPenalty) { lines.push(`Acoes declaradas ${actionsDeclared}: -${actionPenalty}D (RD-07, p.78)`); }
    else lines.push(`Acoes declaradas ${actionsDeclared}: sem penalidade em ${rollType} (RD-07).`);
  }
  penalty += actionPenalty;

  const wound = NO_WOUND_PENALTY.has(rollType) ? 0 : woundPenaltyDice(woundState);
  if (wound) lines.push(`Ferimento (${woundState}): -${wound}D (RD-20, p.100)`);
  else if (woundState !== 'healthy' && NO_WOUND_PENALTY.has(rollType)) {
    lines.push('Resistencia/dano usa Strength cheia, sem penalidade de ferimento (RD-23, p.80).');
  }
  penalty += wound;

  const stun = NO_WOUND_PENALTY.has(rollType) ? 0 : Math.max(0, activeStuns);
  if (stun) lines.push(`Stun ativo x${stun}: -${stun}D (soma, regra da casa RD-21)`);
  penalty += stun;

  const remaining = code.dice - penalty;
  if (penalty && remaining <= 0) {
    lines.push(`Dados reduzidos a ${Math.max(0, remaining)}D: a pericia nao pode ser usada (RD-08, p.78).`);
    return result(false, { penaltyDice: penalty });
  }
  if (penalty) code = { dice: remaining, pips: code.pips };
  if (!penalty && code.dice <= 0) {
    lines.push('Sem dados: nao e possivel rolar (RD-08).');
    return result(false);
  }
  lines.push(`Parada final: ${format(code)}`);
  return { usable: true, code, text: format(code), lines, penaltyDice: penalty, fpApplied };
}

// ------------------------------------------------------------------ pontos
/** RD-11: limite de CP por rolagem. initiative = 0 (RD-16). */
export function cpLimit(rollType) {
  switch (rollType) {
    case 'specialization': case 'reaction': case 'resist': return 5;
    case 'initiative': return 0;
    default: return 2; // skill, attribute, damage
  }
}

/**
 * RD-12: round = {cpSpent:number, fpUsed:boolean}. spentOnRoll = CP ja gastos nesta rolagem.
 * Retorna {ok, reason, cite}.
 */
export function canSpendCP(round, rollType, spentOnRoll = 0, available = Infinity) {
  if (round.fpUsed) return { ok: false, reason: 'Force Point ja usado neste round: CP e FP nao se misturam.', cite: 'p.78, p.84' };
  const limit = cpLimit(rollType);
  if (limit === 0) return { ok: false, reason: 'Iniciativa nao aceita Character Points.', cite: 'p.78' };
  if (spentOnRoll >= limit) return { ok: false, reason: `Limite de ${limit} CP nesta rolagem.`, cite: 'p.85' };
  if (available <= 0) return { ok: false, reason: 'Sem Character Points.', cite: 'p.84' };
  return { ok: true, limit };
}

export function canSpendFP(round, available = Infinity, rollType = 'skill') {
  if (round.fpUsed) return { ok: false, reason: 'Um Force Point por round.', cite: 'p.85' };
  if (round.cpSpent > 0) return { ok: false, reason: 'Character Points ja gastos neste round: CP e FP nao se misturam.', cite: 'p.78, p.84' };
  if (rollType === 'initiative') return { ok: false, reason: 'Iniciativa nao aceita Force Point.', cite: 'p.78' };
  if (available <= 0) return { ok: false, reason: 'Sem Force Points.', cite: 'p.85' };
  return { ok: true };
}

/** RD-15: nao sensivel guarda no maximo 5. */
export function fpCap(forceSensitive) { return forceSensitive ? Infinity : 5; }
export function canAddFP(current, forceSensitive) {
  const max = fpCap(forceSensitive);
  return current < max ? { ok: true } : { ok: false, reason: `Limite de ${max} Force Points para quem nao e sensivel a Forca.`, cite: 'p.85' };
}

/** RD-36: pontos iniciais. */
export const startingPoints = (forceSensitive) => ({ characterPoints: 5, forcePoints: forceSensitive ? 2 : 1 });

/** RD-41: Dark Side Point: rolar 1D; menor que o total = virou; 6 = caido. */
export function darkSideCheck(roll1d, total) { return { turned: roll1d < total, fallen: total >= 6 }; }

// ------------------------------------------------------------------ dano e ferimentos
/** RD-17. diff = dano - resistencia. */
export function damageResult(diff) {
  if (diff <= 0) return 'none';
  if (diff <= 3) return 'stunned';
  if (diff <= 8) return 'wounded';
  if (diff <= 12) return 'incapacitated';
  if (diff <= 15) return 'mortally-wounded';
  return 'killed';
}

const RANK = { healthy: 0, stunned: 0, wounded: 1, 'wounded-twice': 2, incapacitated: 3, 'mortally-wounded': 4, killed: 5 };
const worst = (a, b) => (RANK[a] >= RANK[b] ? a : b);

/**
 * RD-18/19/26. current: estado persistente; result: saida de damageResult.
 * Retorna {status, addStun, unconscious2D, house, note}. 'house' = regra da casa (RD-19).
 */
export function applyWound(current, result, { stunWeapon = false } = {}) {
  const cur = current === 'stunned' ? 'healthy' : current;
  const out = { status: cur, addStun: false, unconscious2D: false, house: false, note: '' };
  if (result === 'none') return out;
  if (cur === 'killed') return out;
  if (result === 'stunned') { out.addStun = true; return out; }
  if (stunWeapon) { // RD-26
    out.unconscious2D = true;
    out.note = 'Arma em stun: inconsciente por 2D minutos; nenhum ferimento registrado (p.101).';
    return out;
  }
  let next;
  if (result === 'wounded') {
    switch (cur) {
      case 'healthy': next = 'wounded'; break;
      case 'wounded': next = 'wounded-twice'; break;
      case 'wounded-twice': next = 'incapacitated'; break;
      case 'incapacitated': next = 'mortally-wounded'; break;
      case 'mortally-wounded': next = 'killed'; out.house = true; // RD-19 (CASA)
        out.note = 'Mortally Wounded + Wounded: o livro e omisso; regra da casa = Killed.'; break;
      default: next = cur;
    }
  } else if (result === 'incapacitated') {
    next = cur === 'incapacitated' ? 'mortally-wounded' : cur === 'mortally-wounded' ? 'killed' : worst(cur, 'incapacitated');
  } else if (result === 'mortally-wounded') {
    next = cur === 'mortally-wounded' ? 'killed' : worst(cur, 'mortally-wounded');
  } else { // killed
    next = 'killed';
  }
  out.status = next;
  return out;
}

/** RD-22: stuns "afetando" >= numero antes do D da Strength => inconsciente 2D minutos. */
export function stunUnconscious(stunsAffecting, strength) {
  const n = typeof strength === 'number' ? strength : parse(strength).dice;
  return { unconscious: n > 0 && stunsAffecting >= n, minutes: '2D', threshold: n };
}

/** RD-25: rolar 2D; se menor que os rounds em Mortally Wounded, morre. */
export function mortalCheck(roll2d, rounds) { return { dies: roll2d < rounds, roll: roll2d, rounds }; }

// ------------------------------------------------------------------ escala (RD-24)
/** scaleTable = tables/combat-modifiers.json -> scale. */
export function scaleAdjust(attackerScale, targetScale, scaleTable) {
  const mod = (s) => { const m = scaleTable.modifier[s]; return m ? parse(m) : { dice: 0, pips: 0 }; };
  const order = scaleTable.order;
  const a = mod(attackerScale), t = mod(targetScale);
  const diff = toPips(a) - toPips(t);
  const adjust = fromPips(Math.abs(diff));
  const base = { adjust, adjustText: format(adjust), attackBonus: null, dodgeBonus: null, resistBonus: null, damageBonus: null };
  if (diff === 0 || order.indexOf(attackerScale) === order.indexOf(targetScale)) {
    return { ...base, direction: 'same', adjust: { dice: 0, pips: 0 }, adjustText: '0D' };
  }
  if (diff < 0) { // menor ataca maior: atacante soma no ataque, alvo soma na resistencia
    return { ...base, direction: 'lower-attacks-higher', attackBonus: adjust, resistBonus: adjust };
  }
  return { ...base, direction: 'higher-attacks-lower', dodgeBonus: adjust, damageBonus: adjust };
}

/** RD-06: faixa de dificuldade. levels = tables/difficulty-numbers.json -> levels. */
export function difficultyLevel(n, levels) {
  if (n < 1) return null;
  let found = levels[0];
  for (const l of levels) if (n >= l.min) found = l;
  return found;
}

/** RD-09: reacao normal substitui a dificuldade; reacao total soma. */
export function reactionDifficulty(reactionTotal, attackDifficulty, full) {
  return full ? attackDifficulty + reactionTotal : reactionTotal;
}

// ------------------------------------------------------------------ round
/** Proximo round: libera CP/FP, ações = 1, avança stuns (RD-12, RD-20, RD-25). */
export function nextRound(r) {
  const n = r.n + 1;
  return {
    ...r, n, actions: 1, cpSpent: 0, fpUsed: false,
    stuns: (r.stuns || []).filter((st) => n - st <= 1), // -1D no round do stun e no seguinte
    mortalRounds: r.mortalRounds, // incrementado pela UI conforme o estado
  };
}
export const stunPenaltyCount = (stuns, n) => (stuns || []).filter((st) => n - st <= 1).length;

// ------------------------------------------------------------------ evolucao (RD-40)
/** kind: skill | specialization | advanced | attribute | newSkill | move | sensitive. current = codigo atual. */
export function advancementCost(kind, current) {
  const c = current == null ? { dice: 0, pips: 0 } : typeof current === 'number' ? { dice: current, pips: 0 } : parse(current);
  switch (kind) {
    case 'skill': case 'newSkill': return c.dice;
    case 'specialization': return Math.ceil(c.dice / 2);
    case 'advanced': return 2 * c.dice;
    case 'attribute': return 10 * c.dice;
    case 'move': return c.dice;
    case 'sensitive': return 20;
    default: throw new Error(`tipo de evolucao desconhecido: ${kind}`);
  }
}

// ------------------------------------------------------------------ criacao (RD-28..RD-37)
export const SKILL_DICE_BUDGET = 7; // RD-28
export const SKILL_CAP_DICE = 2;    // RD-28

/** Valor da pericia = atributo + dados adicionados (RD-01). */
export const skillValue = (attr, added) => add(attr, added || { dice: 0, pips: 0 });

/** RD-30: especializacao = valor da pericia (ou do atributo) + 1D. */
export const specializationValue = (skillOrAttrValue) => add(skillOrAttrValue, { dice: 1, pips: 0 });

/** RD-31: perícia avançada começa em 1D. */
export const ADVANCED_START = { dice: 1, pips: 0 };

/** Bloco de 3 especializacoes custa 1D (RD-30). */
export const specializationDiceCost = (count) => Math.ceil(count / 3);

/** RD-32/RD-36: o template define a sensibilidade? */
export function templateSensitivity(template) {
  const v = template.force_sensitive;
  const hasForce = template.force_skills && Object.keys(template.force_skills).length > 0;
  if (hasForce || v === 'Yes') return { fixed: true, value: true };
  if (v === 'No') return { fixed: true, value: false, warnOnChange: true };
  return { fixed: false, value: null };
}

/** RD-33: soma dos dados de atributos de um template + dados de Forca concedidos. */
export function templateDiceTotals(template) {
  const attr = ATTRS.reduce((s, a) => s + toPips(template.attributes[a]), 0);
  const force = Object.values(template.force_skills || {}).reduce((s, v) => s + toPips(v), 0);
  return { attributePips: attr, forcePips: force, total: fromPips(attr + force), totalText: format(fromPips(attr + force)) };
}

/** RD-33: orcamento de atributos de um novo template (espécie + 6D). */
export function scratchBudget(speciesBlock) {
  const v = speciesBlock && speciesBlock.attribute_dice_value;
  if (!v || !v.dice) return null; // texto livre (ex.: Republic Clone): distribuicao manual
  return fromPips(toPips(v) + 18);
}

/** Valida atributos de novo template: soma, min/max por atributo. forceDice = dados de Forca comprados (RD-33). */
export function validateScratchAttributes(attributes, speciesBlock, forceDice = 0, budgetOverride = null) {
  const errors = [], warnings = [];
  const budget = budgetOverride || scratchBudget(speciesBlock);
  const used = ATTRS.reduce((s, a) => s + toPips(attributes[a]), 0) + forceDice * 3;
  if (budget) {
    if (used > toPips(budget)) errors.push({ rd: 'RD-33', msg: `Atributos${forceDice ? ' + Forca' : ''}: ${format(fromPips(used))} excede ${format(budget)}.` });
    else if (used < toPips(budget)) warnings.push({ rd: 'RD-33', msg: `Faltam ${format(fromPips(toPips(budget) - used))} de atributos para distribuir.` });
  } else warnings.push({ rd: 'RD-33', msg: 'Total de atributos da espécie é texto livre: confira o total com o mestre.' });
  for (const a of ATTRS) {
    const lim = speciesBlock && speciesBlock.attributes && speciesBlock.attributes[a];
    if (!lim) continue;
    const v = toPips(attributes[a]);
    if (v < toPips(lim.min)) errors.push({ rd: 'RD-33', msg: `${ATTR_ABBR[a]} ${format(attributes[a])} abaixo do mínimo ${lim.min.text}.` });
    if (v > toPips(lim.max)) errors.push({ rd: 'RD-33', msg: `${ATTR_ABBR[a]} ${format(attributes[a])} acima do máximo ${lim.max.text}.` });
  }
  return { errors, warnings, used: fromPips(used), budget };
}

/** RD-34: em template os limites da especie so geram aviso. */
export function speciesLimitWarnings(attributes, speciesBlock) {
  const warnings = [];
  if (!speciesBlock || !speciesBlock.attributes) return warnings;
  for (const a of ATTRS) {
    const lim = speciesBlock.attributes[a];
    if (!lim) continue;
    const v = toPips(attributes[a]);
    if (v < toPips(lim.min) || v > toPips(lim.max)) {
      warnings.push({ rd: 'RD-34', msg: `${ATTR_ABBR[a]} ${format(attributes[a])} fora dos limites da espécie (${lim.min.text} a ${lim.max.text}).` });
    }
  }
  return warnings;
}

/** RD-31: confere o pre-requisito de uma perícia avancada. Retorna {ok, manual, missing[]}. */
export function checkAdvancedPrereq(skillId, valueOfSkill, advancedPrereqs) {
  const p = advancedPrereqs[skillId];
  if (!p) return { ok: true, manual: false, missing: [] };
  if (p.manual) return { ok: true, manual: true, missing: [], text: p.text };
  const missing = p.requirements.filter((r) => toPips(valueOfSkill(r.skill_id)) < r.dice * 3);
  return { ok: missing.length === 0, manual: false, missing, text: p.text };
}

/**
 * Validacao do passo de pericias / resumo (RD-28..RD-32, RD-34, RD-36).
 * draft = { attributes, skills:{id:{dice,pips}}, specializations:[{skillId|null, attribute, name}],
 *           forceAdded:{control,sense,alter}(dados), forceSensitive, permissions:{id:true},
 *           mode:'template'|'scratch'|'droid', allowPips }
 * ctx = { skills:[], advancedPrereqs, listedIds:Set|null, template, forceGrant:{control:{dice}}, budget }
 */
export function validateSkills(draft, ctx) {
  const errors = [], warnings = [];
  const skillById = new Map(ctx.skills.map((s) => [s.id, s]));
  const budgetPips = (ctx.budget ?? (draft.mode === 'droid' ? 17 : SKILL_DICE_BUDGET)) * 3;
  const capPips = SKILL_CAP_DICE * 3;
  let used = 0;
  const value = (id) => {
    const s = skillById.get(id);
    const added = draft.skills[id] || { dice: 0, pips: 0 };
    if (s && s.advanced) return toPips(added) ? added : { dice: 0, pips: 0 };
    return skillValue(draft.attributes[s.attribute], added);
  };
  for (const [id, added] of Object.entries(draft.skills)) {
    const s = skillById.get(id);
    const pips = toPips(added);
    if (!pips) continue;
    if (!s) { errors.push({ rd: 'RD-28', msg: `Perícia desconhecida: ${id}` }); continue; }
    used += pips;
    if (added.pips && !draft.allowPips) errors.push({ rd: 'RD-29', msg: `${s.name}: pips soltos só com a regra da casa ligada.`, house: true });
    if (pips > capPips) errors.push({ rd: 'RD-28', msg: `${s.name}: máximo de ${SKILL_CAP_DICE}D adicionais na criação (p.21).` });
    if (ctx.listedIds && !s.advanced && !ctx.listedIds.has(id) && !(draft.permissions || {})[id]) {
      errors.push({ rd: 'RD-28', msg: `${s.name} não está no template: precisa de permissão do mestre.` });
    }
    if (ctx.listedIds && !ctx.listedIds.has(id) && (draft.permissions || {})[id]) {
      warnings.push({ rd: 'RD-28', msg: `${s.name}: fora do template, com permissão do mestre.` });
    }
    if (s.advanced) {
      const chk = checkAdvancedPrereq(id, value, ctx.advancedPrereqs);
      if (!chk.ok) errors.push({ rd: 'RD-31', msg: `${s.name} (A): pré-requisito não cumprido (${chk.text || ''}).` });
      else if (chk.manual) warnings.push({ rd: 'RD-31', msg: `${s.name} (A): pré-requisito composto; o mestre confirma (${chk.text}).` });
    }
  }
  for (const f of FORCE_SKILLS) {
    const d = (draft.forceAdded || {})[f] || 0;
    if (!d) continue;
    if (draft.mode !== 'scratch') used += d * 3; // em novo template a Forca custa dados de atributo (RD-33)
    const grant = ctx.forceGrant && ctx.forceGrant[f];
    if (!grant && !(draft.permissions || {})[`force:${f}`]) errors.push({ rd: 'RD-32', msg: `Force skill ${f}: só se o template a lista (p.21).` });
    if (!draft.forceSensitive) errors.push({ rd: 'RD-32', msg: `Force skill ${f} exige sensível à Força = sim.` });
    if (d > SKILL_CAP_DICE) errors.push({ rd: 'RD-28', msg: `Force skill ${f}: máximo de ${SKILL_CAP_DICE}D adicionais.` });
  }
  const specs = draft.specializations || [];
  used += specializationDiceCost(specs.length) * 3;
  if (specs.length % 3 !== 0) warnings.push({ rd: 'RD-30', msg: `Especializações em blocos de 3: faltam ${3 - (specs.length % 3)} nome(s) para completar o bloco.` });
  for (const sp of specs) if (!sp.name || !sp.name.trim()) warnings.push({ rd: 'RD-30', msg: 'Especialização sem nome.' });
  if (used > budgetPips) errors.push({ rd: 'RD-28', msg: `Dados de perícia: ${format(fromPips(used))} excedem ${budgetPips / 3}D.` });
  else if (used < budgetPips) warnings.push({ rd: 'RD-28', msg: `Dados não gastos: ${format(fromPips(budgetPips - used))} (o mestre decide).` });
  return { errors, warnings, used: fromPips(used), budget: fromPips(budgetPips) };
}

/** Validacao completa (atributos + pericias + Forca + pontos). */
export function validateCreation(draft, ctx) {
  const errors = [], warnings = [];
  const push = (r) => { errors.push(...r.errors); warnings.push(...r.warnings); };
  if (!draft.name || !draft.name.trim()) errors.push({ rd: 'PROD', msg: 'Dê um nome ao personagem.' });
  if (draft.mode === 'scratch') {
    push(validateScratchAttributes(draft.attributes, ctx.speciesBlock, FORCE_SKILLS.reduce((s, f) => s + ((draft.forceAdded || {})[f] || 0), 0), ctx.budgetOverride));
  } else if (draft.mode === 'template') {
    warnings.push(...speciesLimitWarnings(draft.attributes, ctx.speciesBlock));
    if (ctx.template) {
      const sens = templateSensitivity(ctx.template);
      if (sens.fixed && draft.forceSensitive !== sens.value) {
        (sens.value ? errors : warnings).push({ rd: 'RD-32', msg: `Template ${ctx.template.type}: sensibilidade ${sens.value ? 'obrigatoriamente sim' : 'impressa como não'}.` });
      }
    }
  }
  push(validateSkills(draft, ctx));
  const nPowers = ctx.template ? ctx.template.force_powers_to_select || 0 : 0;
  const chosen = (draft.forcePowers || []).length;
  if (draft.forceSensitive && nPowers && chosen !== nPowers) {
    (chosen > nPowers ? errors : warnings).push({ rd: 'RD-32', msg: `Poderes da Força: ${chosen} de ${nPowers}.` });
  }
  const hasForceDice = FORCE_SKILLS.some((f) => ((draft.forceAdded || {})[f] || 0) > 0 || (ctx.forceGrant && ctx.forceGrant[f]));
  if (hasForceDice && !draft.forceSensitive) errors.push({ rd: 'RD-32', msg: 'Perícias da Força exigem sensível à Força = sim.' });
  return { errors, warnings };
}

/**
 * Poderes oferecidos: todas as Force skills do poder devem ter dados (> 0) e os poderes
 * exigidos (ids) ja estarem escolhidos. forceValues = {control: dice, sense:..., alter:...}.
 */
export function eligibleForcePowers(powers, forceValues, selectedIds, requiredIds) {
  const sel = new Set(selectedIds);
  return powers.filter((p) => {
    const skillsOk = p.skills.length > 0 && p.skills.every((s) => (forceValues[s] || 0) > 0); // sem perícia (Force Scream) nao e escolha de criacao
    const reqs = requiredIds[p.id] || [];
    return skillsOk && reqs.every((r) => sel.has(r));
  });
}

// ------------------------------------------------------------------ equipamento
/** US-11: compra do catalogo. Item sem cost_credits entra sem descontar, com aviso. */
export function purchase(credits, item) {
  if (item.cost_credits == null) {
    return { credits, charged: 0, warning: 'preço a combinar com o mestre' };
  }
  if (item.cost_credits > credits) return { credits, charged: 0, error: 'Créditos insuficientes.' };
  return { credits: credits - item.cost_credits, charged: item.cost_credits };
}

/** Primeiro inteiro de "100", "30 (power packs: 25)"; null se sem numero (ex.: "Unlimited"). */
export function parseAmmo(text) {
  const m = String(text ?? '').match(/\d+/);
  return m ? Number(m[0]) : null;
}

export { parse, format, add, normalize };
