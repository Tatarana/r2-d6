// @ts-nocheck - porte direto do JS do v1 (logica testada pelos 56 testes); tipagem estrita fica no backlog.
// dice.js - codigos de dados e rolagens (puro, sem DOM).
// Regras: RD-01 (3 pips = 1D), RD-02..RD-04 (Wild Die), RD-10 (dados de CP), RD-13 (dobrar).

/** RNG padrao: inteiro 1..6. Nos testes injete uma funcao deterministica. */
export const defaultRng = () => 1 + Math.floor(Math.random() * 6);

/** Converte "3D+2", "2D", "+1D", "-1D", "4" ou {dice,pips} em {dice,pips}. */
export function parse(code) {
  if (code && typeof code === 'object') return { dice: code.dice | 0, pips: code.pips | 0 };
  const s = String(code).trim().toUpperCase().replace(/\s+/g, '').replace(/−/g, '-');
  let m = s.match(/^([+-]?)(\d+)D(?:([+-])(\d+))?$/);
  if (m) {
    const sign = m[1] === '-' ? -1 : 1;
    const pips = m[4] ? (m[3] === '-' ? -1 : 1) * Number(m[4]) : 0;
    return { dice: sign * Number(m[2]), pips: sign * pips };
  }
  m = s.match(/^([+-]?\d+)$/); // so pips
  if (m) return { dice: 0, pips: Number(m[1]) };
  throw new Error(`Codigo de dados invalido: "${code}"`);
}

/** {dice,pips} -> "3D+2" (sem renormalizar: 6D+4 continua 6D+4). */
export function format(code) {
  const c = parse(code);
  if (c.dice === 0 && c.pips !== 0) return String(c.pips > 0 ? `+${c.pips}` : c.pips);
  return c.pips ? `${c.dice}D${c.pips > 0 ? '+' : '-'}${Math.abs(c.pips)}` : `${c.dice}D`;
}

export const toPips = (code) => { const c = parse(code); return c.dice * 3 + c.pips; };

/** RD-01: 3 pips viram 1D. Total negativo vira 0D. */
export function fromPips(total) {
  const t = Math.max(0, total | 0);
  return { dice: Math.floor(t / 3), pips: t % 3 };
}

export const normalize = (code) => fromPips(toPips(code));

export const add = (a, b) => fromPips(toPips(a) + toPips(b));

/** Subtrai b de a; nunca abaixo de 0D (use rules.effectivePool para a regra de "0D = inutilizavel"). */
export const subtractDice = (a, b) => fromPips(toPips(a) - toPips(b));

/** RD-13: dobra dados E pips, sem renormalizar (3D+2 -> 6D+4). */
export function double(code) {
  const c = parse(code);
  return { dice: c.dice * 2, pips: c.pips * 2 };
}

export const compare = (a, b) => toPips(a) - toPips(b);

const sum = (xs) => xs.reduce((a, b) => a + b, 0);

/**
 * Calculo comum de uma rolagem (digital ou fisica). RD-02..RD-04.
 * normals: dados normais; wildSeq: sequencia do Wild Die (6 explode); pips: bonus fixo.
 * wildOne so vale para a PRIMEIRA rolagem do Wild Die (1 depois de 6 soma 1).
 */
export function rollFromValues(normals, wildSeq, pips = 0) {
  const wild = wildSeq.slice();
  const wildOne = wild.length > 0 && wild[0] === 1; // RD-03
  const normal = sum(normals) + sum(wild) + pips;
  let subtract = normal;
  if (wildOne) {
    // opcao (c): tira o 1 e o maior dado normal; sem outro dado, tira so o 1 (RD-04, CASA); minimo 0
    const biggest = normals.length ? Math.max(...normals) : 0;
    subtract = Math.max(0, normal - 1 - biggest);
  }
  return {
    normals: normals.slice(), wild, pips, wildOne,
    totals: { normal, complication: normal, subtract },
  };
}

/** Rola `code` (ex.: "5D+1"). Um dos dados e o Wild Die (RD-02). */
export function roll(code, rng = defaultRng) {
  const c = parse(code);
  if (c.dice < 1) throw new RangeError('Parada sem dados (0D): nao e possivel rolar (RD-08).');
  const normals = [];
  for (let i = 0; i < c.dice - 1; i++) normals.push(rng());
  const wild = [rng()];
  while (wild[wild.length - 1] === 6) wild.push(rng());
  return rollFromValues(normals, wild, c.pips);
}

/** RD-10, E-009: dados de CP separados, 6 explode, 1 vale 1. Retorna {dice:[[6,3],[2]], total}. */
export function rollCP(n, rng = defaultRng) {
  const dice = [];
  for (let i = 0; i < n; i++) {
    const seq = [rng()];
    while (seq[seq.length - 1] === 6) seq.push(rng());
    dice.push(seq);
  }
  return { dice, total: sum(dice.map(sum)) };
}

/** Valores digitados de CP (modo dados fisicos): cada item = sequencia de um dado. */
export const cpFromValues = (dice) => ({ dice: dice.map((d) => d.slice()), total: sum(dice.map(sum)) });

/** Valida a sequencia do Wild Die digitada: todos 6 exceto o ultimo (que nao e 6). */
export function validWildSeq(seq) {
  if (!seq.length) return false;
  if (!seq.every((v) => Number.isInteger(v) && v >= 1 && v <= 6)) return false;
  return seq.slice(0, -1).every((v) => v === 6) && seq[seq.length - 1] !== 6;
}
