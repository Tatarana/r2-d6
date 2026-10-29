// @ts-nocheck - testes migrados do v1 (node:test -> Vitest) sem alterar as asserções.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as R from '../src/rules';
import { format, parse } from '../src/dice';

const here = dirname(fileURLToPath(import.meta.url));
const DATA = join(here, '..', '..', '..', 'data');
const j = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const skills = j('skills.json').skills;
const templates = j('templates.json').templates;
const species = j('species.json').species;
const powers = j('force-powers.json').powers;
const scale = j('tables/combat-modifiers.json').scale;
const levels = j('tables/difficulty-numbers.json').levels;
const bundle = JSON.parse(readFileSync(join(here, '..', '..', 'data', 'generated', 'bundle.json'), 'utf8'));
const tpl = (id) => templates.find((t) => t.id === id);
const pool = (o) => R.effectivePool(o);
const txt = (o) => pool(o).text;

test('RD-14/US-06: search 4D com FP = 8D; 4D, 2 acoes, FP = 7D', () => {
  assert.equal(txt({ base: '4D', forcePoint: true }), '8D');
  assert.equal(txt({ base: '4D', actionsDeclared: 2, forcePoint: true }), '7D');
});

test('RD-13: dano com FP dobra so a Strength; arma soma sem dobrar', () => {
  const p = pool({ base: '3D+2', forcePoint: true, rollType: 'damage', bonus: '2D' });
  assert.equal(p.text, '8D+4'); // 6D+4 + 2D
});

test('RD-07: 5D blaster com 2 acoes = 4D; 4 acoes = -3D', () => {
  assert.equal(txt({ base: '5D', actionsDeclared: 2 }), '4D');
  assert.equal(txt({ base: '5D', actionsDeclared: 4 }), '2D');
  assert.equal(txt({ base: '4D', actionsDeclared: 4 }), '1D');
});

test('penalidade de acoes nao vale em damage/resist/initiative', () => {
  for (const rollType of ['damage', 'resist', 'initiative']) {
    assert.equal(txt({ base: '4D', actionsDeclared: 4, rollType }), '4D', rollType);
  }
});

test('RD-23: ferimento nao penaliza damage/resist; penaliza skill e initiative', () => {
  assert.equal(txt({ base: '3D', woundState: 'wounded', rollType: 'resist' }), '3D');
  assert.equal(txt({ base: '3D', woundState: 'wounded', rollType: 'damage' }), '3D');
  assert.equal(txt({ base: '3D', woundState: 'wounded', rollType: 'skill' }), '2D');
  assert.equal(txt({ base: '4D', woundState: 'wounded-twice', rollType: 'initiative' }), '2D');
});

test('RD-21: Wounded + 1 stun = -2D; FP nao vale em initiative', () => {
  assert.equal(txt({ base: '4D', woundState: 'wounded', activeStuns: 1 }), '2D');
  assert.equal(txt({ base: '4D', forcePoint: true, rollType: 'initiative' }), '4D');
});

test('RD-08: 1D+2 com -1D => nao usavel; 0D', () => {
  const p = pool({ base: '1D+2', actionsDeclared: 2 });
  assert.equal(p.usable, false);
  assert.ok(p.lines.some((l) => l.includes('RD-08')));
  assert.equal(pool({ base: '0D' }).usable, false);
  assert.equal(pool({ base: '4D', woundState: 'incapacitated' }).usable, false);
});

test('RD-11: limites de CP', () => {
  assert.equal(R.cpLimit('skill'), 2);
  assert.equal(R.cpLimit('damage'), 2);
  for (const t of ['reaction', 'specialization', 'resist']) assert.equal(R.cpLimit(t), 5, t);
  assert.equal(R.cpLimit('initiative'), 0);
});

test('RD-12: CP e FP nao no mesmo round; 3o CP bloqueado', () => {
  assert.equal(R.canSpendCP({ cpSpent: 0, fpUsed: true }, 'skill').ok, false);
  assert.equal(R.canSpendFP({ cpSpent: 1, fpUsed: false }).ok, false);
  assert.equal(R.canSpendFP({ cpSpent: 0, fpUsed: true }).ok, false);
  assert.equal(R.canSpendFP({ cpSpent: 0, fpUsed: false }).ok, true);
  assert.equal(R.canSpendCP({ cpSpent: 2, fpUsed: false }, 'skill', 2).ok, false);
  assert.equal(R.canSpendCP({ cpSpent: 2, fpUsed: false }, 'reaction', 2).ok, true);
});

test('RD-15: teto de 5 FP para nao sensivel', () => {
  assert.equal(R.fpCap(false), 5);
  assert.equal(R.fpCap(true), Infinity);
  assert.equal(R.canAddFP(5, false).ok, false);
  assert.equal(R.canAddFP(4, false).ok, true);
});

test('RD-17: tabela de dano', () => {
  const cases = [[0, 'none'], [-4, 'none'], [3, 'stunned'], [4, 'wounded'], [8, 'wounded'], [9, 'incapacitated'],
    [12, 'incapacitated'], [13, 'mortally-wounded'], [15, 'mortally-wounded'], [16, 'killed']];
  for (const [d, r] of cases) assert.equal(R.damageResult(d), r, `diff ${d}`);
  assert.equal(R.damageResult(18 - 14), 'wounded'); // US-07
});

test('RD-18/19: progressao de ferimentos', () => {
  const w = (cur, res, o) => R.applyWound(cur, res, o);
  assert.equal(w('healthy', 'wounded').status, 'wounded');
  assert.equal(w('wounded', 'wounded').status, 'wounded-twice');
  assert.equal(w('wounded-twice', 'wounded').status, 'incapacitated');
  assert.equal(w('incapacitated', 'wounded').status, 'mortally-wounded');
  assert.equal(w('incapacitated', 'incapacitated').status, 'mortally-wounded');
  assert.equal(w('mortally-wounded', 'incapacitated').status, 'killed');
  assert.equal(w('mortally-wounded', 'mortally-wounded').status, 'killed');
  const house = w('mortally-wounded', 'wounded');
  assert.equal(house.status, 'killed');
  assert.equal(house.house, true);
  assert.equal(w('wounded', 'incapacitated').status, 'incapacitated');
  assert.equal(w('wounded', 'stunned').addStun, true);
  assert.equal(w('wounded', 'stunned').status, 'wounded');
});

test('RD-26: arma em stun nao registra ferimento', () => {
  const r = R.applyWound('healthy', 'wounded', { stunWeapon: true });
  assert.equal(r.status, 'healthy');
  assert.equal(r.unconscious2D, true);
});

test('RD-22: 3 stuns com STR 3D => inconsciente', () => {
  assert.equal(R.stunUnconscious(3, { dice: 3, pips: 0 }).unconscious, true);
  assert.equal(R.stunUnconscious(2, { dice: 3, pips: 0 }).unconscious, false);
  assert.equal(R.stunUnconscious(3, 3).minutes, '2D');
});

test('RD-25: Mortally Wounded 2D', () => {
  assert.equal(R.mortalCheck(2, 3).dies, true);
  assert.equal(R.mortalCheck(3, 3).dies, false);
});

test('RD-24: escala', () => {
  const a = R.scaleAdjust('starfighter', 'speeder', scale);
  assert.equal(a.adjustText, '4D');
  assert.equal(a.direction, 'higher-attacks-lower');
  assert.equal(format(a.dodgeBonus), '4D');
  assert.equal(format(a.damageBonus), '4D');
  const b = R.scaleAdjust('character', 'speeder', scale);
  assert.equal(b.adjustText, '2D');
  assert.equal(b.direction, 'lower-attacks-higher');
  assert.equal(format(b.attackBonus), '2D');
  assert.equal(format(b.resistBonus), '2D');
  assert.equal(R.scaleAdjust('walker', 'walker', scale).direction, 'same');
});

test('RD-06: faixa de dificuldade', () => {
  assert.equal(R.difficultyLevel(13, levels).id, 'moderate');
  assert.equal(R.difficultyLevel(35, levels).id, 'heroic');
  assert.equal(R.difficultyLevel(5, levels).id, 'very-easy');
});

test('RD-09: reacao total soma, normal substitui (27 em 13 e 8)', () => {
  assert.equal(R.reactionDifficulty(27, 13, true), 40);
  assert.equal(R.reactionDifficulty(27, 8, true), 35);
  assert.equal(R.reactionDifficulty(27, 13, false), 27);
});

test('proximo round libera CP/FP e zera acoes', () => {
  const r = R.nextRound({ n: 3, actions: 3, cpSpent: 2, fpUsed: true, stuns: [2, 3], mortalRounds: 0 });
  assert.deepEqual([r.n, r.actions, r.cpSpent, r.fpUsed], [4, 1, 0, false]);
  assert.deepEqual(r.stuns, [3]);
});

test('RD-40: custos de evolucao', () => {
  assert.equal(R.advancementCost('skill', '3D+2'), 3);
  assert.equal(R.advancementCost('specialization', '5D+2'), 3);
  assert.equal(R.advancementCost('attribute', '4D'), 40);
  assert.equal(R.advancementCost('advanced', '3D'), 6);
  assert.equal(R.advancementCost('move', 10), 10);
  assert.equal(R.advancementCost('sensitive'), 20);
});

// ---------------------------------------------------------------- criacao
const ctxFor = (template, extra = {}) => {
  const listed = new Set(bundle.derived.template_skill_map[template.id].map((e) => e.skill_id).filter(Boolean));
  const forceGrant = {};
  for (const [k, v] of Object.entries(template.force_skills || {})) forceGrant[k] = parse(v);
  return { skills, advancedPrereqs: bundle.derived.advanced_prereqs, listedIds: listed, template, forceGrant,
    speciesBlock: species.find((s) => s.id === 'humans').stat_blocks[0], ...extra };
};
const attrsOf = (t) => Object.fromEntries(R.ATTRS.map((a) => [a, parse(t.attributes[a])]));

test('RD-28: Smuggler + 1D blaster = 4D+1; teto 2D', () => {
  const t = tpl('smuggler');
  const attrs = attrsOf(t);
  assert.equal(format(R.skillValue(attrs.dexterity, { dice: 1, pips: 0 })), '4D+1');
  const ctx = ctxFor(t);
  const ok = R.validateSkills({ mode: 'template', attributes: attrs, skills: { blaster: { dice: 2, pips: 0 } } }, ctx);
  assert.equal(ok.errors.length, 0);
  const bad = R.validateSkills({ mode: 'template', attributes: attrs, skills: { blaster: { dice: 3, pips: 0 } } }, ctx);
  assert.ok(bad.errors.some((e) => e.rd === 'RD-28' && /ximo/.test(e.msg)));
});

test('RD-28: 7D no total; excesso e erro, sobra e aviso', () => {
  const t = tpl('smuggler'), attrs = attrsOf(t), ctx = ctxFor(t);
  const ids = ['blaster', 'dodge', 'astrogation', 'bargain', 'con', 'gambling', 'streetwise', 'space-transports'];
  for (const id of ids) assert.ok(ctx.listedIds.has(id), `${id} nao listado no smuggler`);
  const mk = (n) => { const s = {}; ids.slice(0, n).forEach((id) => { s[id] = { dice: 1, pips: 0 }; }); return s; };
  const six = R.validateSkills({ mode: 'template', attributes: attrs, skills: mk(6) }, ctx);
  assert.equal(six.errors.length, 0);
  assert.ok(six.warnings.some((w) => /gastos/.test(w.msg)));
  const eight = R.validateSkills({ mode: 'template', attributes: attrs, skills: mk(8) }, ctx);
  assert.ok(eight.errors.some((e) => /excedem/.test(e.msg)));
});

test('RD-28: pericia fora do template exige permissao do mestre', () => {
  const t = tpl('smuggler'), attrs = attrsOf(t), ctx = ctxFor(t);
  assert.ok(!ctx.listedIds.has('lightsaber'));
  const no = R.validateSkills({ mode: 'template', attributes: attrs, skills: { lightsaber: { dice: 1, pips: 0 } } }, ctx);
  assert.ok(no.errors.some((e) => /permiss/.test(e.msg)));
  const yes = R.validateSkills({ mode: 'template', attributes: attrs, skills: { lightsaber: { dice: 1, pips: 0 } }, permissions: { lightsaber: true } }, ctx);
  assert.equal(yes.errors.length, 0);
});

test('RD-30: especializacao Knowledge 2D+2 sem pericia => 3D+2; blocos de 3 custam 1D', () => {
  assert.equal(format(R.specializationValue(parse('2D+2'))), '3D+2');
  assert.equal(R.specializationDiceCost(3), 1);
  assert.equal(R.specializationDiceCost(4), 2);
  const t = tpl('smuggler'), attrs = attrsOf(t), ctx = ctxFor(t);
  const r = R.validateSkills({ mode: 'template', attributes: attrs, skills: {},
    specializations: [{ skillId: 'alien-species', name: 'Wookiees' }] }, ctx);
  assert.ok(r.warnings.some((w) => w.rd === 'RD-30'));
  assert.equal(format(r.used), '1D');
});

test('RD-31: (A) medicine exige first aid 5D e comeca em 1D', () => {
  assert.deepEqual(R.ADVANCED_START, { dice: 1, pips: 0 });
  const pre = bundle.derived.advanced_prereqs['medicine-advanced'];
  assert.deepEqual(pre.requirements, [{ skill_id: 'first-aid', dice: 5 }]);
  const t = tpl('smuggler'), ctx = ctxFor(t);
  const attrs = { ...attrsOf(t), technical: parse('2D+2') };
  const bad = R.validateSkills({ mode: 'template', attributes: attrs,
    skills: { 'medicine-advanced': { dice: 1, pips: 0 } } }, ctx);
  assert.ok(bad.errors.some((e) => e.rd === 'RD-31'));
  // first aid 3D+1 + 2D = 5D+1 >= 5D: ok
  const good = R.validateSkills({ mode: 'template', attributes: { ...attrs, technical: parse('3D+1') },
    skills: { 'first-aid': { dice: 2, pips: 0 }, 'medicine-advanced': { dice: 1, pips: 0 } },
    permissions: { 'first-aid': true } }, ctx);
  assert.ok(!good.errors.some((e) => e.rd === 'RD-31'));
});

test('RD-32/33: Young Jedi atributos 15D + 3D Forca = 18D', () => {
  const t = tpl('young-jedi');
  const tot = R.templateDiceTotals(t);
  assert.equal(tot.totalText, '18D');
  assert.deepEqual(R.templateSensitivity(t), { fixed: true, value: true });
  assert.equal(R.templateSensitivity(tpl('bounty-hunter')).value, false);
  assert.equal(R.templateSensitivity(tpl('smuggler')).fixed, false);
  const ctx = ctxFor(t);
  const r = R.validateCreation({ name: 'Luke', mode: 'template', attributes: attrsOf(t), skills: {}, forceSensitive: true,
    forcePowers: ['a', 'b', 'c'] }, ctx);
  assert.equal(r.errors.length, 0);
  const noSens = R.validateCreation({ name: 'X', mode: 'template', attributes: attrsOf(t), skills: {}, forceSensitive: false }, ctx);
  assert.ok(noSens.errors.length > 0);
});

test('todos os templates (exceto droide) somam 18D com a Forca', () => {
  for (const t of templates) {
    if (t.id === 'protocol-droid') continue;
    assert.equal(R.templateDiceTotals(t).totalText, '18D', t.id);
  }
});

test('RD-32: Force skill so se o template lista', () => {
  const t = tpl('smuggler'), ctx = ctxFor(t);
  const r = R.validateSkills({ mode: 'template', attributes: attrsOf(t), skills: {}, forceAdded: { control: 1 }, forceSensitive: true }, ctx);
  assert.ok(r.errors.some((e) => e.rd === 'RD-32'));
});

test('poderes elegiveis: perícias da Forca e poderes exigidos', () => {
  const req = bundle.derived.force_power_required_ids;
  const el = R.eligibleForcePowers(powers, { control: 1, sense: 1, alter: 1 }, [], req).map((p) => p.id);
  assert.ok(el.includes('absorb-dissipate-energy'));
  assert.ok(!el.includes('burst-of-speed')); // exige enhance attribute
  const el2 = R.eligibleForcePowers(powers, { control: 1, sense: 0, alter: 0 }, ['enhance-attribute'], req).map((p) => p.id);
  assert.ok(el2.includes('burst-of-speed'));
  assert.ok(!el2.includes('farseeing')); // control + sense
});

test('RD-33: humano do zero 18D, min 2D / max 4D', () => {
  const human = species.find((s) => s.id === 'humans').stat_blocks[0];
  assert.equal(format(R.scratchBudget(human)), '18D');
  const six3 = Object.fromEntries(R.ATTRS.map((a) => [a, parse('3D')]));
  const ok = R.validateScratchAttributes(six3, human);
  assert.equal(ok.errors.length, 0);
  assert.equal(ok.warnings.length, 0);
  const bad = { ...six3, dexterity: parse('4D+1'), knowledge: parse('1D+2') };
  const r = R.validateScratchAttributes(bad, human);
  assert.ok(r.errors.some((e) => /ximo/.test(e.msg)));
  assert.ok(r.errors.some((e) => /nimo/.test(e.msg)));
  // control 1D com permissao: restam 17D para atributos
  const over = R.validateScratchAttributes(six3, human, 1);
  assert.ok(over.errors.some((e) => /excede/.test(e.msg)));
});

test('RD-34/RD-42: espécie do template e Move inicial', () => {
  assert.equal(bundle.derived.template_species.ewok, 'ewok');
  assert.equal(bundle.derived.template_species['protocol-droid'], null);
  assert.equal(bundle.derived.template_species.smuggler, 'humans');
  assert.equal(bundle.derived.species_move_start.wookiees[0].move_start, 11);
});

test('RD-35: mapa de nomes de pericia dos templates', () => {
  const m = bundle.derived.template_skill_map.ewok;
  assert.equal(m.find((e) => e.name === 'Demolition').skill_id, 'demolitions');
  assert.equal(m.find((e) => e.name === 'Demolition').alias, true);
  assert.equal(m.find((e) => e.name === 'Glider').species_special_skill, true);
});

test('RD-36: pontos iniciais', () => {
  assert.deepEqual(R.startingPoints(true), { characterPoints: 5, forcePoints: 2 });
  assert.deepEqual(R.startingPoints(false), { characterPoints: 5, forcePoints: 1 });
});

test('US-11: compra e item sem preco', () => {
  const w = j('weapons.json').items;
  const bp = w.find((x) => x.id === 'blaster-pistol');
  assert.deepEqual(R.purchase(2000, bp), { credits: 1500, charged: 500 });
  assert.equal(bp.damage, '4D');
  assert.equal(R.parseAmmo(bp.ammo), 100);
  const ls = w.find((x) => x.id === 'lightsaber');
  const r = R.purchase(2000, ls);
  assert.equal(r.credits, 2000);
  assert.ok(r.warning);
  assert.equal(R.purchase(100, bp).error, 'Créditos insuficientes.');
});
