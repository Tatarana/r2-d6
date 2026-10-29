// views/print.js - ficha para impressao: A4, preto e branco, 2 paginas (p.501-502).
import { h, clear } from '../util.js';
import { ATTRS, ATTR_ABBR } from '../rules.js';
import { D, skillName } from '../data.js';

const code = (d) => (d && (d.text || `${d.dice}D${d.pips ? '+' + d.pips : ''}`)) || '';
const boxes = (n) => h('span', { class: 'boxes' }, Array.from({ length: n }, () => h('i', { class: 'box' })));
const line = (lab, val) => h('div', { class: 'pl' }, h('span', { class: 'pk' }, lab), h('span', { class: 'pv' }, val || ' '));

export function renderPrint(c) {
  const root = document.getElementById('print-root');
  if (!root) return;
  clear(root);
  if (!c) return;
  const attrBlock = (a) => {
    const at = c.attributes[a];
    return h('div', { class: 'pattr' },
      h('div', { class: 'ph' }, h('span', null, `${a.toUpperCase()}`), h('b', null, code(at.value))),
      h('ul', null, (at.skills || []).flatMap((s) => [
        h('li', null, h('span', null, skillName(s.skill)), h('b', null, code(s.value))),
        ...(s.specializations || []).map((sp) => h('li', { class: 'sub' }, h('span', null, `↳ ${sp.name}`), h('b', null, code(sp.value)))),
      ])));
  };
  const fa = c.force_attributes || {};
  const page1 = h('section', { class: 'psheet' },
    h('h1', null, 'Star Wars RPG — ', c.name),
    h('div', { class: 'pgrid3' },
      line('Tipo', c.type), line('Espécie', (D.maps.species.get(c.species) || {}).name || c.species), line('Gênero', c.gender),
      line('Idade', c.age), line('Altura', c.height), line('Peso', c.weight)),
    line('Descrição física', c.physical_description),
    h('div', { class: 'pattrs' }, ATTRS.map(attrBlock)),
    h('div', { class: 'pgrid3' },
      h('div', { class: 'pbox' }, h('h3', null, 'Força'),
        line('Sensível', c.force_sensitive ? 'sim' : 'não'),
        line('Control', code(fa.control)), line('Sense', code(fa.sense)), line('Alter', code(fa.alter)),
        h('p', { class: 'small' }, 'Poderes: ', (c.force_powers || []).map((id) => (D.maps.powers.get(id) || { name: id }).name).join(', '))),
      h('div', { class: 'pbox' }, h('h3', null, 'Pontos'),
        line('Force Points', String(c.force_points)), line('Dark Side Points', String(c.dark_side_points || 0)),
        line('Character Points', String(c.character_points)), line('Move', String(c.move ?? '')), line('Créditos', String(c.credits ?? 0))),
      h('div', { class: 'pbox' }, h('h3', null, 'Habilidades especiais'), h('p', { class: 'small' }, c.special_abilities))));

  const page2 = h('section', { class: 'psheet' },
    h('h2', null, c.name, ' — página 2'),
    h('div', { class: 'pbox wounds' }, h('h3', null, 'Ferimentos'),
      h('div', { class: 'wrow' }, h('span', null, 'Stunned'), boxes(1)),
      h('div', { class: 'wrow' }, h('span', null, 'Wounded'), boxes(2)),
      h('div', { class: 'wrow' }, h('span', null, 'Incapacitated'), boxes(1)),
      h('div', { class: 'wrow' }, h('span', null, 'Mortally Wounded'), boxes(1))),
    h('div', { class: 'pbox' }, h('h3', null, 'Armas'),
      (c.weapons.length ? c.weapons : [{ type: '' }]).map((w) => h('div', { class: 'pweapon' },
        h('div', { class: 'row' }, h('b', null, w.type || ' '), h('span', null, `Dano ${w.damage || ''}`), h('span', null, `Alcance ${w.range || ''}`)),
        h('div', { class: 'ammo' }, 'Munição ', boxes(18), w.ammo_max ? h('small', null, ` (${w.ammo_max})`) : null)))),
    h('div', { class: 'pbox' }, h('h3', null, 'Armadura'),
      c.armor.map((a) => h('div', { class: 'pl' }, h('span', { class: 'pk' }, a.type), h('span', { class: 'pv' }, `AV ${a.av || ''} ${a.notes || ''}`))),
      c.armor.length ? null : h('p', { class: 'small' }, ' ')),
    h('div', { class: 'pbox' }, h('h3', null, 'Outro equipamento'),
      h('ul', null, c.other_equipment.map((o) => h('li', null, o.type, o.notes ? ` — ${o.notes}` : '')))),
    h('div', { class: 'pgrid2' },
      [['Background', c.background], ['Personalidade', c.personality], ['Objetivos', c.objectives], ['Idiomas', c.languages],
        ['Contatos e inimigos', c.contacts_and_enemies], ['Ligação com os personagens', c.connection_with_characters], ['Citação', c.quote]]
        .map(([k, v]) => h('div', { class: 'pbox' }, h('h3', null, k), h('p', { class: 'small' }, v)))));

  root.append(page1, page2);
}

export function printSheet(c) {
  renderPrint(c);
  window.print();
}
export { ATTR_ABBR };
