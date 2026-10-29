// @ts-nocheck - testes migrados do v1 (node:test -> Vitest) sem alterar as asserções.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { parse, format, add, normalize, subtractDice, double, roll, rollFromValues, rollCP, validWildSeq } from '../src/dice';

// rng deterministico: devolve a sequencia na ordem
const seq = (...v) => { let i = 0; return () => { if (i >= v.length) throw new Error('rng esgotado'); return v[i++]; }; };

test('parse e format', () => {
  assert.deepEqual(parse('3D+2'), { dice: 3, pips: 2 });
  assert.deepEqual(parse('4d'), { dice: 4, pips: 0 });
  assert.equal(format({ dice: 3, pips: 2 }), '3D+2');
  assert.equal(format('2D'), '2D');
  assert.throws(() => parse('abc'));
});

test('RD-01: 3 pips = 1D', () => {
  assert.deepEqual(add('2D+2', { dice: 0, pips: 1 }), { dice: 3, pips: 0 });
  assert.deepEqual(normalize({ dice: 2, pips: 5 }), { dice: 3, pips: 2 });
  assert.deepEqual(subtractDice('3D', '1D+1'), { dice: 1, pips: 2 });
});

test('RD-13: dobrar dados e pips sem renormalizar', () => {
  const d = double('3D+2');
  assert.deepEqual(d, { dice: 6, pips: 4 });
  assert.equal(format(d), '6D+4');
});

test('US-01: 5D normais 1,2,5,6 wild 2 = 16 (p.73)', () => {
  const r = roll('5D', seq(1, 2, 5, 6, 2));
  assert.deepEqual(r.normals, [1, 2, 5, 6]);
  assert.deepEqual(r.wild, [2]);
  assert.equal(r.totals.normal, 16);
  assert.equal(r.wildOne, false);
});

test('US-01: wild explode 6,6,3 -> 28 (p.73)', () => {
  const r = roll('5D', seq(2, 4, 5, 2, 6, 6, 3));
  assert.deepEqual(r.wild, [6, 6, 3]);
  assert.equal(r.totals.normal, 28);
});

test('US-02: 6D com Wild 1 -> normal 18, subtract 12 (p.73)', () => {
  const r = roll('6D', seq(3, 4, 2, 5, 3, 1));
  assert.equal(r.wildOne, true);
  assert.equal(r.totals.normal, 18);
  assert.equal(r.totals.complication, 18);
  assert.equal(r.totals.subtract, 12);
});

test('um 1 depois de 6 explodido nao e wildOne', () => {
  const r = roll('3D', seq(3, 4, 6, 1));
  assert.equal(r.wildOne, false);
  assert.deepEqual(r.wild, [6, 1]);
  assert.equal(r.totals.normal, 3 + 4 + 6 + 1);
});

test('RD-04: 1D com Wild 1: subtract = so os pips, nunca negativo', () => {
  const a = roll('1D+2', seq(1));
  assert.equal(a.wildOne, true);
  assert.equal(a.totals.normal, 3);
  assert.equal(a.totals.subtract, 2);
  assert.equal(roll('1D', seq(1)).totals.subtract, 0);
});

test('pips somam no total', () => {
  assert.equal(roll('2D+2', seq(3, 4)).totals.normal, 9);
});

test('0D nao rola (RD-08)', () => {
  assert.throws(() => roll('0D', seq(1)), RangeError);
});

test('US-03: modo dados fisicos usa o mesmo calculo', () => {
  const r = rollFromValues([3, 4, 2, 5, 3], [1], 0);
  assert.equal(r.totals.subtract, 12);
  assert.equal(rollFromValues([1, 2, 5, 6], [2], 0).totals.normal, 16);
});

test('rollCP: 6 explode, 1 vale 1 (RD-10, E-009)', () => {
  const r = rollCP(2, seq(6, 3, 1));
  assert.deepEqual(r.dice, [[6, 3], [1]]);
  assert.equal(r.total, 10);
});

test('validWildSeq', () => {
  assert.ok(validWildSeq([6, 6, 3]));
  assert.ok(validWildSeq([1]));
  assert.ok(!validWildSeq([6]));
  assert.ok(!validWildSeq([3, 2]));
});
