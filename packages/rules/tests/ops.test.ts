import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyOps, clampSheet, createCreation, createSheetValidator, diffOps, findConflicts, rebase, blankSheet, type Op } from '../src/index';

const here = dirname(fileURLToPath(import.meta.url));
const bundle = JSON.parse(readFileSync(join(here, '..', '..', 'data', 'generated', 'bundle.json'), 'utf8'));

test('applyOps: replace/add/remove/inc e caminhos inválidos', () => {
  const doc = { a: 1, list: [{ n: 1 }, { n: 2 }], o: { x: 'y' } };
  const out = applyOps(doc, [
    { op: 'inc', path: '/a', value: 4 }, { op: 'replace', path: '/list/1/n', value: 9 },
    { op: 'add', path: '/list/-', value: { n: 3 } }, { op: 'remove', path: '/o/x' },
  ]);
  assert.deepEqual(out, { a: 5, list: [{ n: 1 }, { n: 9 }, { n: 3 }], o: {} });
  assert.deepEqual(doc.a, 1); // original intacto
  assert.throws(() => applyOps(doc, [{ op: 'replace', path: '/nada/x', value: 1 }]));
  assert.throws(() => applyOps(doc, [{ op: 'inc', path: '/o', value: 1 }]));
  assert.throws(() => applyOps(doc, [{ op: 'add', path: '/__proto__/x', value: 1 }]));
});

test('conflitos: inc+inc comuta; replace+replace na mesma folha conflita; folhas diferentes não', () => {
  const inc = (path: string, value = 1): Op => ({ op: 'inc', path, value });
  const rep = (path: string, value: any): Op => ({ op: 'replace', path, value });
  assert.equal(findConflicts([inc('/credits')], [inc('/credits', 5)]).length, 0);
  assert.equal(findConflicts([rep('/name', 'a')], [rep('/name', 'b')]).length, 1);
  assert.equal(findConflicts([rep('/name', 'a')], [rep('/background', 'b')]).length, 0);
  assert.equal(findConflicts([rep('/attributes/dexterity/value', 1)], [rep('/attributes/dexterity', {})]).length, 1); // ancestral
  assert.equal(findConflicts([inc('/credits')], [rep('/credits', 0)]).length, 1); // inc x replace
  assert.equal(findConflicts([rep('/weapons/1/type', 'x')], [{ op: 'remove', path: '/weapons/0' }]).length, 1); // índice deslocado
  const r = rebase({ credits: 10 }, [inc('/credits', 5)], [inc('/credits', 1)]);
  assert.ok(r.ok && r.doc.credits === 15);
});

test('diffOps gera inc para contadores e round-trip com applyOps', () => {
  const a = { ...blankSheet('X'), weapons: [{ type: 'Blaster', ammo_max: 10, ammo_used: 1 }] };
  const b = JSON.parse(JSON.stringify(a));
  b.character_points -= 2; b.credits += 50; b.weapons[0].ammo_used = 4; b.name = 'Y'; b.other_equipment.push({ type: 'Corda' });
  const ops = diffOps(a, b);
  assert.deepEqual(ops.filter((o) => o.op === 'inc').map((o) => [o.path, (o as any).value]).sort(), [['/character_points', -2], ['/credits', 50], ['/weapons/0/ammo_used', 3]].sort());
  assert.deepEqual(applyOps(a, ops), b);
});

test('clampSheet: não negativo e munição limitada ao máximo', () => {
  const s: any = { character_points: -3, credits: 5, weapons: [{ ammo_max: 5, ammo_used: 9 }] };
  const w = clampSheet(s);
  assert.equal(s.character_points, 0); assert.equal(s.weapons[0].ammo_used, 5); assert.equal(w.length, 2);
});

test('assistente de criação (porta): todos os templates geram fichas válidas pelo schema', () => {
  const validate = createSheetValidator(bundle.schema);
  const c = createCreation(bundle);
  for (const t of bundle.entities.templates) {
    const sheet = c.fromTemplate(t.id, `Teste ${t.id}`, bundle.derived.template_species[t.id] || 'humans');
    const v = validate(sheet);
    assert.ok(v.ok, `${t.id}: ${JSON.stringify(v.errors)}`);
  }
});
