// creation.ts - logica pura do assistente de criacao (porta de app/js/views/creation.js; RD-28..RD-37).
// Recebe o bundle de dados (packages/data) e um objeto `wiz` mutavel; a UI so le/escreve nele.
import { parse, format, toPips, fromPips, roll, defaultRng } from './dice';
import * as R from './rules';
import { blankSheet, toDie, weaponEntry, armorEntry, gearEntry, type Sheet } from './sheet';

export interface Wizard {
  step: number; origin: null | 'template' | 'scratch'; templateId: string | null; speciesId: string | null; blockIdx: number;
  attrs: Record<string, { dice: number; pips: number }> | null; skills: Record<string, { dice: number; pips: number }>; perms: Record<string, boolean>;
  specs: { skillId: string; name: string }[]; forceAdded: Record<string, number>; forceSensitive: boolean | null; powers: string[];
  startCredits: number; cart: { cat: string; id: string; name: string; charged: number; warning?: string }[];
  details: Record<string, string>; allowPips: boolean; manualBudget: number; templateOverrideSens?: boolean;
  creditsClass: string; creditsRoll: number | null; gearTab: string; gearFilter: string;
}

export const STEPS: [string, string][] = [['origin', 'Origem'], ['species', 'Espécie'], ['attrs', 'Atributos'], ['skills', 'Perícias'], ['force', 'Força'], ['gear', 'Equipamento'], ['details', 'Detalhes'], ['summary', 'Resumo']];
export const STEP_RULE: Record<string, [string, string]> = { origin: ['characters', 'overview'], species: ['characters', 'new-template'], attrs: ['characters', 'new-template'], skills: ['characters', 'pick-skills'],
  force: ['characters', 'force-sensitivity'], gear: ['characters', 'credits'], details: ['characters', 'detailing'], summary: ['characters', 'finishing'] };
export const STEP_CITE: Record<string, string> = { origin: 'p.18-19', species: 'p.23-24', attrs: 'p.23-24', skills: 'p.21-22', force: 'p.22', gear: 'p.22, p.24', details: 'p.21', summary: 'p.21-22' };

export function freshWizard(): Wizard {
  return { step: 0, origin: null, templateId: null, speciesId: null, blockIdx: 0, attrs: null, skills: {}, perms: {}, specs: [], forceAdded: { control: 0, sense: 0, alter: 0 },
    forceSensitive: null, powers: [], startCredits: 0, cart: [], details: {}, allowPips: false, manualBudget: 14, gearTab: 'weapons', gearFilter: '', creditsClass: 'poor', creditsRoll: null };
}

const mapBy = (list: any[]) => new Map(list.map((x) => [x.id, x]));

/** Funcoes do assistente ligadas a um bundle de dados. */
export function createCreation(B: any) {
  const E = B.entities;
  const skillsById = mapBy(E.skills), powersById = mapBy(E.force_powers), speciesById = mapBy(E.species), templatesById = mapBy(E.templates);
  const itemMaps: Record<string, Map<string, any>> = { weapons: mapBy(E.weapons), armor: mapBy(E.armor), gear: mapBy(E.gear) };
  const getEntity = (cat: string, id: string) => (cat === 'skills' ? skillsById : cat === 'powers' ? powersById : cat === 'species' ? speciesById : cat === 'templates' ? templatesById : itemMaps[cat]).get(id);

  const tpl = (w: Wizard) => (w.templateId ? templatesById.get(w.templateId) : null);
  const mode = (w: Wizard) => (w.origin === 'scratch' ? 'scratch' : w.templateId === 'protocol-droid' ? 'droid' : 'template');
  const speciesBlock = (id: string | null, idx = 0) => { const s = id ? speciesById.get(id) : null; return s ? s.stat_blocks[idx] || s.stat_blocks[0] : null; };
  const block = (w: Wizard) => (w.speciesId ? speciesBlock(w.speciesId, w.blockIdx) : null);
  const moveStart = (speciesId: string | null) => { const b = speciesId ? B.derived.species_move_start[speciesId] : null; return b && b[0] ? b[0].move_start : null; };
  const attrCode = (w: Wizard, a: string) => parse(w.attrs![a]);
  const listedEntries = (w: Wizard) => (w.templateId ? B.derived.template_skill_map[w.templateId] : []);
  const listedIds = (w: Wizard) => (w.origin === 'scratch' ? null : new Set<string>(listedEntries(w).map((e: any) => e.skill_id).filter(Boolean)));
  const forceGrant = (w: Wizard) => {
    const g: Record<string, any> = {};
    const t = tpl(w);
    if (t) for (const [k, v] of Object.entries(t.force_skills || {})) g[k] = parse(v as string);
    return g;
  };
  const sensitivity = (w: Wizard) => (tpl(w) ? R.templateSensitivity(tpl(w)) : { fixed: false, value: null as any });
  const isSensitive = (w: Wizard) => (sensitivity(w).fixed && !w.templateOverrideSens ? sensitivity(w).value : !!w.forceSensitive);
  const forceTotal = (w: Wizard, f: string) => ((forceGrant(w)[f] || { dice: 0 }).dice) + (w.forceAdded[f] || 0);
  const forceDiceForBudget = (w: Wizard) => R.FORCE_SKILLS.reduce((s, f) => s + (w.forceAdded[f] || 0), 0);
  const scratchBudgetOverride = (w: Wizard) => {
    const b = block(w);
    if (!b || R.scratchBudget(b)) return null;
    return { dice: Math.max(0, Number(w.manualBudget) || 0), pips: 0 };
  };
  const ctxObj = (w: Wizard) => ({ skills: E.skills, advancedPrereqs: B.derived.advanced_prereqs, listedIds: listedIds(w), template: tpl(w), forceGrant: forceGrant(w),
    speciesBlock: block(w), budget: mode(w) === 'droid' ? 17 : undefined, budgetOverride: scratchBudgetOverride(w) });
  const draft = (w: Wizard): any => ({ name: w.details.name, mode: mode(w), attributes: w.attrs || {}, skills: w.skills, specializations: w.specs, forceAdded: w.forceAdded,
    forceSensitive: isSensitive(w), permissions: w.perms, allowPips: w.allowPips, forcePowers: w.powers });
  const skillCodeOf = (w: Wizard, id: string) => {
    const s = skillsById.get(id);
    const added = w.skills[id] || { dice: 0, pips: 0 };
    if (s.advanced) return toPips(added) ? added : { dice: 0, pips: 0 };
    return R.skillValue(attrCode(w, s.attribute), added);
  };
  const parseCredits = (text: string) => { const m = String(text || '').match(/([\d][\d,.]*)\s*credits/i); return m ? parseInt(m[1].replace(/[,.]/g, ''), 10) : 0; };
  const balance = (w: Wizard) => w.startCredits - w.cart.reduce((s, i) => s + (i.charged || 0), 0);
  const validation = (w: Wizard) => R.validateCreation(draft(w), ctxObj(w) as any);
  const validateSkills = (w: Wizard) => R.validateSkills(draft(w), ctxObj(w) as any);

  function pickTemplate(t: any): Wizard {
    const w = freshWizard();
    w.origin = 'template'; w.templateId = t.id;
    w.attrs = Object.fromEntries(R.ATTRS.map((a) => [a, parse(t.attributes[a])]));
    w.speciesId = B.derived.template_species[t.id] || null;
    const sens = R.templateSensitivity(t);
    w.forceSensitive = sens.fixed ? sens.value : null;
    w.startCredits = parseCredits(t.equipment);
    w.details = { background: t.background || '', personality: t.personality || '', objectives: t.objectives || '', connection: t.connection_with_characters || '', quote: t.a_quote || '' };
    return w;
  }
  function pickScratch(): Wizard { const w = freshWizard(); w.origin = 'scratch'; return w; }
  function pickSpecies(w: Wizard, id: string | null) {
    w.speciesId = id || null; w.blockIdx = 0;
    if (w.origin === 'scratch' && id) {
      const b = block(w);
      w.attrs = Object.fromEntries(R.ATTRS.map((a) => [a, b.attributes && b.attributes[a] ? parse(b.attributes[a].min) : parse('2D')]));
    }
  }

  /** Remove em cascata poderes cujos pre-requisitos deixaram de valer. */
  function pruneForcePowers(w: Wizard) {
    const forceValues = Object.fromEntries(R.FORCE_SKILLS.map((f) => [f, forceTotal(w, f)]));
    const req = B.derived.force_power_required_ids;
    let changed = true;
    while (changed) {
      changed = false;
      for (const id of [...w.powers]) {
        const p = powersById.get(id);
        const others = w.powers.filter((x) => x !== id);
        const ok = p.skills.every((s: string) => forceValues[s] > 0) && (req[id] || []).every((r: string) => others.includes(r));
        if (!ok) { w.powers = others; changed = true; }
      }
    }
  }
  const eligiblePowers = (w: Wizard) => R.eligibleForcePowers(E.force_powers,
    Object.fromEntries(R.FORCE_SKILLS.map((f) => [f, forceTotal(w, f)])), w.powers, B.derived.force_power_required_ids);

  function canAdvance(w: Wizard) {
    const key = STEPS[w.step][0];
    if (key === 'origin') return !!w.origin && (w.origin === 'scratch' || !!w.templateId);
    if (key === 'species') return mode(w) === 'droid' || !!w.speciesId;
    if (key === 'attrs') return !!w.attrs;
    if (key === 'force') return mode(w) === 'droid' || sensitivity(w).fixed || w.forceSensitive !== null;
    return true;
  }

  /** Monta a ficha (documento do schema) a partir do assistente. */
  function buildCharacter(w: Wizard): Sheet {
    const c = blankSheet(w.details.name || 'Sem nome');
    const t = tpl(w), sp = w.speciesId ? speciesById.get(w.speciesId) : null, b = block(w);
    c.type = t ? t.type : 'Novo template';
    c.species = sp ? sp.id : '';
    for (const a of R.ATTRS) c.attributes[a] = { value: toDie(attrCode(w, a)), skills: [] };
    const entryFor = (id: string) => {
      const s = skillsById.get(id);
      const list = c.attributes[s.attribute].skills;
      let e = list.find((x: any) => x.skill === id);
      if (!e) { e = { skill: id, value: toDie(skillCodeOf(w, id)), specializations: [] }; list.push(e); }
      return e;
    };
    for (const [id, added] of Object.entries(w.skills)) if (toPips(added)) entryFor(id);
    for (const sx of w.specs) {
      if (!sx.name || !sx.name.trim()) continue;
      entryFor(sx.skillId).specializations.push({ name: sx.name.trim(), value: toDie(R.specializationValue(skillCodeOf(w, sx.skillId))) });
    }
    const sens = isSensitive(w);
    c.force_sensitive = !!sens;
    c.force_points = R.startingPoints(sens).forcePoints;
    c.character_points = R.startingPoints(sens).characterPoints;
    c.force_attributes = {};
    for (const f of R.FORCE_SKILLS) if (forceTotal(w, f) > 0) c.force_attributes[f] = toDie({ dice: forceTotal(w, f), pips: 0 });
    c.force_powers = [...w.powers];
    c.move = t && mode(w) !== 'scratch' ? parseInt(t.move, 10) || 10 : moveStart(w.speciesId) || 10;
    c.special_abilities = t ? t.special_abilities || '' : ((b && b.special_abilities) || []).join(' ');
    c.credits = Math.max(0, balance(w));
    if (t && t.equipment) c.other_equipment.push({ type: t.equipment, notes: 'equipamento do template' });
    for (const i of w.cart) {
      const item = getEntity(i.cat, i.id);
      if (i.cat === 'weapons') c.weapons.push(weaponEntry(item));
      else if (i.cat === 'armor') c.armor.push(armorEntry(item));
      else c.other_equipment.push(gearEntry(item));
    }
    const d = w.details;
    Object.assign(c, { gender: d.gender || '', age: d.age || '', height: d.height || '', weight: d.weight || '', physical_description: d.physical_description || '',
      personality: d.personality || '', background: d.background || '', objectives: d.objectives || '', languages: d.languages || '', quote: d.quote || '',
      connection_with_characters: d.connection || '' });
    return c;
  }

  /** Cria um personagem completo direto de um template (usado no seed e nos testes). */
  function fromTemplate(templateId: string, name: string, speciesId?: string): Sheet {
    const t = templatesById.get(templateId);
    if (!t) throw new Error(`template desconhecido: ${templateId}`);
    const w = pickTemplate(t);
    if (speciesId) w.speciesId = speciesId;
    w.details.name = name;
    return buildCharacter(w);
  }

  const rollCredits = (w: Wizard) => {
    const cls: Record<string, number> = { poor: 100, average: 250, wealthy: 400 };
    const r2 = roll('2D', defaultRng).totals.normal;
    w.creditsRoll = r2; w.startCredits = r2 * cls[w.creditsClass];
  };

  return { skillsById, powersById, speciesById, templatesById, getEntity, tpl, mode, speciesBlock, block, moveStart, attrCode, listedEntries, listedIds, forceGrant, sensitivity,
    isSensitive, forceTotal, forceDiceForBudget, scratchBudgetOverride, ctxObj, draft, skillCodeOf, balance, validation, validateSkills, pickTemplate, pickScratch, pickSpecies,
    pruneForcePowers, eligiblePowers, canAdvance, buildCharacter, fromTemplate, rollCredits, fromPips, format };
}
export type Creation = ReturnType<typeof createCreation>;
