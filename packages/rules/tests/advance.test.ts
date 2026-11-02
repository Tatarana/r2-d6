// advance.test.ts - evolucao (p.25-28) e armadura/escala na rolagem (p.94-95), com os exemplos do livro.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { advanceOptions, applyAdvance, blankSheet, ceilingCheck, defaultPlayState, effectiveCost, modsContext, poolForTarget, targetsOf, toDie, trainingTime } from '../src/index';

const here = dirname(fileURLToPath(import.meta.url));
const bundle = JSON.parse(readFileSync(join(here, '..', '..', 'data', 'generated', 'bundle.json'), 'utf8'));
const skills = bundle.entities.skills;
const skillsById = new Map<string, any>(skills.map((s: any) => [s.id, s]));
const human = bundle.entities.species.find((s: any) => s.id === 'humans').stat_blocks[0];
const ctx = { skills, skillsById, advancedPrereqs: bundle.derived.advanced_prereqs, speciesBlock: human };
const opt = (sheet: any, key: string) => advanceOptions(sheet, ctx).find((o) => o.key === key)!;
const no = { teacher: true, usedLastAdventure: false, extraCP: 0 };

function thannik() {
  const s = blankSheet('Thannik');
  s.attributes.knowledge.value = toDie('2D+2');
  s.attributes.knowledge.skills.push({ skill: 'alien-species', value: toDie('3D+2'), specializations: [] });
  s.attributes.perception.value = toDie('3D');
  s.attributes.dexterity.value = toDie('3D');
  s.attributes.dexterity.skills.push({ skill: 'blaster', value: toDie('3D+2'), specializations: [{ name: 'blaster pistol', value: toDie('5D+2') }] });
  s.attributes.technical.skills.push({ skill: 'first-aid', value: toDie('5D'), specializations: [] }, { skill: 'medicine-advanced', value: toDie('2D+2'), specializations: [] });
  s.character_points = 60;
  s.move = 11;
  return s;
}

test('custos RD-40: perícia, especialização, avançada, atributo, Move, sensível', () => {
  const s = thannik();
  assert.equal(opt(s, 's:blaster').cost, 3); // 3D+2 -> 4D custa 3
  assert.equal(opt(s, 'p:blaster:0').cost, 3); // 5D+2 -> 6D custa metade de 5, para cima
  assert.equal(opt(s, 's:medicine-advanced').cost, 4); // (A) 2D+2 -> 3D custa 2x2
  assert.equal(opt(s, 'a:knowledge').cost, 20); // 2D+2 -> 3D custa 10x2
  assert.equal(opt(s, 'm').cost, 11); // Move 11 -> 12
  assert.equal(opt(s, 'fs').cost, 20);
  assert.equal(opt(s, 'n:bargain').cost, 3); // Perception 3D: bargain 3D+1 por 3 (p.26)
  assert.equal(opt(s, 'n:bargain').next, '3D+1');
});

test('tempo de treino (p.26-28)', () => {
  const s = thannik();
  const blaster = opt(s, 's:blaster');
  assert.equal(trainingTime(blaster, no).days, 3);
  assert.equal(trainingTime(blaster, { ...no, teacher: false }).days, 6);
  assert.equal(trainingTime(blaster, { ...no, extraCP: 2 }).days, 1); // Thannik corta dois dias
  assert.equal(trainingTime(blaster, { ...no, extraCP: 9 }).days, 1); // minimo 1 dia
  assert.equal(trainingTime(blaster, { ...no, usedLastAdventure: true }).days, 0);
  const med = opt(s, 's:medicine-advanced');
  assert.equal(trainingTime(med, no).text, '4 semana(s)');
  assert.equal(trainingTime(med, { ...no, teacher: false }).text, '8 semana(s)');
  assert.equal(trainingTime(med, { ...no, extraCP: 50 }).days, 7); // minimo 1 semana
  assert.equal(trainingTime(opt(s, 'a:knowledge'), no).text, '20 semana(s)');
  assert.equal(trainingTime(opt(s, 'm'), no).text, '11 semana(s)');
  assert.equal(trainingTime(opt(s, 'fs'), no).days, 0);
});

test('aprender (A) medicina: pré-requisito de primeiros socorros 5D, 2 CP, 2 semanas com professor', () => {
  const s = thannik();
  s.attributes.technical.skills = s.attributes.technical.skills.filter((x: any) => x.skill !== 'medicine-advanced');
  const learn = opt(s, 'n:medicine-advanced');
  assert.equal(learn.blocked, undefined);
  assert.equal(learn.cost, 2);
  assert.equal(trainingTime(learn, no).text, '2 semana(s)');
  assert.equal(trainingTime(learn, { ...no, teacher: false }).text, '4 semana(s)');
  s.attributes.technical.skills[0].value = toDie('4D+2');
  assert.match(opt(s, 'n:medicine-advanced').blocked!, /Pré-requisito/);
});

test('atributo sobe as perícias dele (não as avançadas) e o teste de teto devolve metade', () => {
  const s = thannik();
  applyAdvance(s, opt(s, 'a:knowledge'), 20, skillsById);
  assert.equal(s.attributes.knowledge.value.text, '3D');
  assert.equal(s.attributes.knowledge.skills[0].value.text, '4D'); // alien species 3D+2 -> 4D
  assert.equal(s.character_points, 40);
  const t = thannik();
  applyAdvance(t, opt(t, 'a:technical'), 20, skillsById);
  assert.equal(t.attributes.technical.skills.find((x: any) => x.skill === 'medicine-advanced').value.text, '2D+2');
  assert.deepEqual(ceilingCheck(17, 15, 40), { ok: false, refund: 20 }); // exemplo do livro
  assert.deepEqual(ceilingCheck(15, 15, 40), { ok: true, refund: 0 });
  assert.equal(opt(thannik(), 'a:dexterity').ceiling, '4D');
});

test('Force: dobro sem professor; sensível dá +1 FP; Move respeita o máximo da espécie', () => {
  const s = thannik();
  s.force_sensitive = true;
  s.force_attributes = { control: toDie('2D') };
  const c = opt(s, 'f:control');
  assert.equal(effectiveCost(c, true), 2);
  assert.equal(effectiveCost(c, false), 4);
  const u = thannik();
  const fp = u.force_points;
  applyAdvance(u, opt(u, 'fs'), 20, skillsById);
  assert.equal(u.force_sensitive, true);
  assert.equal(u.force_points, fp + 1);
  u.move = 12;
  assert.match(opt(u, 'm').blocked!, /12/);
});

// ------------------------------------------------------------------ armadura e escala (B-220)
const mctx = modsContext(bundle, skillsById);
function trooper() {
  const s = thannik();
  s.attributes.strength.value = toDie('3D');
  s.armor.push({ type: 'Stormtrooper Armor', item: 'stormtrooper-armor', av: '', notes: '' });
  return s;
}
const pool = (s: any, ps: any, key: string, mods = {}) => poolForTarget(s, ps, targetsOf(s, skillsById).find((t) => t.key === key)!, { mods, ctx: mctx }).text;

test('armadura soma na resistência por tipo de dano e tira da Dexterity (p.94)', () => {
  const s = trooper();
  const ps = { ...defaultPlayState(), armorWorn: 0 };
  assert.equal(pool(s, ps, 'r', { damageKind: 'physical' }), '5D'); // 3D + 2D
  assert.equal(pool(s, ps, 'r', { damageKind: 'energy' }), '4D'); // 3D + 1D
  assert.equal(pool(s, ps, 's:blaster'), '2D+2'); // 3D+2 - 1D
  assert.equal(pool(s, ps, 'a:knowledge'), '2D+2'); // sem efeito
  assert.equal(pool(s, defaultPlayState(), 'r', { damageKind: 'physical' }), '3D'); // sem armadura vestida
});

test('escala (p.95): speeder contra personagem', () => {
  const s = trooper();
  const vsSpeeder = { ...defaultPlayState(), opponentScale: 'speeder' };
  assert.equal(pool(s, vsSpeeder, 's:blaster', { attack: true }), '5D+2'); // menor ataca maior: +2D no ataque
  assert.equal(pool(s, vsSpeeder, 's:blaster'), '3D+2'); // sem marcar ataque
  assert.equal(pool(s, vsSpeeder, 'r'), '3D'); // maior ataca menor: alvo menor nao soma na resistencia
  s.attributes.dexterity.skills.push({ skill: 'dodge', value: toDie('4D'), specializations: [] });
  assert.equal(pool(s, vsSpeeder, 's:dodge'), '6D'); // alvo menor soma na esquiva
  const inSpeeder = { ...defaultPlayState(), scale: 'speeder', opponentScale: 'character' };
  assert.equal(pool(s, inSpeeder, 'r'), '5D'); // menor ataca maior: alvo maior soma na resistencia
});
