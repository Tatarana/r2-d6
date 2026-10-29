// seals.js - selos: pagina citada, leitura provisoria (errata open) e regra da casa.
import { h } from './util.js';
import { errataFor } from './data.js';

export const pageCite = (text) => (text ? h('span', { class: 'pg' }, `(${text})`) : null);

/** Selo "leitura provisoria E-0xx" para cada item open; mostra a leitura ao tocar. */
export function errataSeals(ids) {
  const open = errataFor(ids).filter((e) => e.status === 'open');
  if (!open.length) return null;
  return h('div', { class: 'seals' }, open.map((e) =>
    h('details', { class: 'seal prov' },
      h('summary', null, `leitura provisória ${e.id}`),
      h('p', null, e.provisional),
      h('p', { class: 'muted' }, e.problem, ' ', h('a', { href: `#/regras/errata/${e.id}` }, 'ver registro')))));
}

/** Rotulos curtos das decisoes CASA/PROV aplicadas pelo app (docs/rules-decisions.md). */
export const RD_NOTES = {
  'RD-04': 'Wild Die 1 numa parada de 1D: o livro é omisso; subtrai só o 1 e o total nunca fica abaixo de 0.',
  'RD-08': 'Dados reduzidos a 0D: pips restantes não contam (1D+2 com -1D não rola).',
  'RD-14': 'O livro não diz se FP dobra antes ou depois das penalidades; o app dobra e depois subtrai.',
  'RD-19': 'Mortally Wounded + Wounded: o livro é omisso; o app usa Killed.',
  'RD-21': 'Stun e ferimento somam as penalidades (o livro é omisso).',
  'RD-29': 'Pips soltos nas perícias na criação (o livro fala em 1D ou 2D).',
  'RD-30': 'Mais de um bloco de especializações (o livro só descreve 1D = 3).',
};

export function houseSeal(rd) {
  return h('span', { class: 'seal house', title: RD_NOTES[rd] || rd }, `regra da casa ${rd}`);
}

export const provSeal = (id, text) => h('span', { class: 'seal prov', title: text }, `leitura provisória ${id}`);
export const e061Seal = () => h('a', { class: 'seal prov small', href: '#/regras/errata/E-061', title: 'Nome impresso no template difere do capítulo de perícias; lido como a perícia mais próxima (E-061).' }, 'E-061');
