import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createStore, memoryStorage, blankCharacter, exportJSON, importCharacter, validateSheet, toDie } from '../js/store.js';

const here = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(join(here, '..', '..', 'data', 'character-sheet.schema.json'), 'utf8'));
const ATTR = ['dexterity', 'knowledge', 'mechanical', 'perception', 'strength', 'technical'];

function sample() {
  const c = blankCharacter('Han');
  c.attributes.dexterity = { value: toDie('3D+1'), skills: [{ skill: 'blaster', value: toDie('4D+1'), specializations: [{ name: 'blaster pistol', value: toDie('5D+1') }] }] };
  c.force_sensitive = false; c.force_points = 1; c.credits = 1500;
  c.weapons.push({ type: 'Blaster Pistol', item: 'blaster-pistol', damage: '4D', range: '3-10/30/120', ammo_max: 100, ammo_used: 3 });
  c.x_app.round.stuns = [1];
  c.x_app.history.push({ t: 'roll', text: '16' });
  return c;
}

test('US-12: salvar e recarregar (localStorage simulado)', () => {
  const storage = memoryStorage();
  const a = createStore(storage);
  const han = a.save(sample());
  const luke = a.save({ ...blankCharacter('Luke') });
  const b = createStore(storage); // "recarrega a pagina"
  assert.equal(b.list().length, 2);
  assert.equal(b.get(han.x_app.id).attributes.dexterity.skills[0].value.text, '4D+1');
  assert.equal(b.getActive().name, 'Han');
  b.setActive(luke.x_app.id);
  assert.equal(createStore(storage).getActive().name, 'Luke');
  const dup = b.duplicate(han.x_app.id);
  assert.notEqual(dup.x_app.id, han.x_app.id);
  b.remove(han.x_app.id);
  assert.equal(b.list().length, 2);
});

test('US-13: export/import ida e volta', () => {
  const orig = sample();
  const json = exportJSON(orig);
  const r = importCharacter(json);
  assert.ok(r.ok, r.errors.join('; '));
  const back = r.char;
  assert.equal(back.name, 'Han');
  assert.deepEqual(back.attributes, orig.attributes);
  assert.deepEqual(back.weapons, orig.weapons);
  assert.equal(back.credits, 1500);
  assert.deepEqual(back.x_app.round.stuns, [1]);
  assert.equal(back.wound_status, 'healthy'); // 'stunned' do arquivo volta a healthy + stun em x_app
  assert.notEqual(back.x_app.id, orig.x_app.id);
  const again = JSON.parse(exportJSON(back));
  assert.equal(again.wound_status, 'stunned');
});

test('US-13: importar sem name ou attributes e recusado com mensagem', () => {
  const r = importCharacter(JSON.stringify({ force_sensitive: false, force_points: 1, character_points: 5, wound_status: 'healthy' }));
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('name')));
  assert.ok(r.errors.some((e) => e.includes('attributes')));
  assert.equal(importCharacter('{nao e json').ok, false);
  const bad = sample(); bad.wound_status = 'ferido';
  assert.ok(importCharacter(JSON.stringify(bad)).errors.some((e) => e.includes('wound_status')));
});

test('ficha exportada tem todos os campos obrigatorios do schema', () => {
  const out = JSON.parse(exportJSON(sample()));
  for (const k of schema.required) assert.ok(k in out, `faltou ${k}`);
  for (const a of schema.properties.attributes.required) {
    assert.ok(out.attributes[a], a);
    assert.equal(typeof out.attributes[a].value.dice, 'number');
    assert.ok(out.attributes[a].value.pips >= 0 && out.attributes[a].value.pips <= 2);
  }
  assert.ok(schema.properties.wound_status.enum.includes(out.wound_status));
  assert.equal(typeof out.force_sensitive, 'boolean');
  assert.deepEqual(validateSheet(out), []);
  assert.deepEqual(Object.keys(out.attributes).sort(), [...ATTR].sort()); // additionalProperties: false
});
