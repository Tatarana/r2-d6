// views/sheet.js - ficha editavel (todos os campos do schema) e acoes (exportar, duplicar, apagar, imprimir).
import { h, download, confirmDialog, toast, slugify } from '../util.js';
import { parse, format } from '../dice.js';
import { ATTRS, ATTR_ABBR, FORCE_SKILLS, WOUND_STATES } from '../rules.js';
import { toDie, exportJSON, newId } from '../store.js';
import { app, activeChar, mutate, notify } from '../state.js';
import { D, listOf, skillName } from '../data.js';
import { openRef } from '../layout.js';
import { printSheet } from './print.js';

const WOUND_LABEL = { healthy: 'Healthy', stunned: 'Stunned', wounded: 'Wounded', 'wounded-twice': 'Wounded twice', incapacitated: 'Incapacitated', 'mortally-wounded': 'Mortally Wounded', killed: 'Killed' };

/** Campo de codigo de dados: aceita "3D+2"; normaliza 3 pips = 1D (RD-01). */
function codeInput(die, onChange, label) {
  const inp = h('input', { class: 'code', value: die ? die.text || format(die) : '', 'aria-label': label, inputMode: 'text', size: 6,
    onchange: () => {
      try { const d = toDie(inp.value.trim() === '' ? '0D' : inp.value); onChange(d); inp.classList.remove('bad'); }
      catch { inp.classList.add('bad'); toast(`Código inválido: “${inp.value}”. Use o formato 3D+2.`, 'err'); }
    } });
  return inp;
}

const fld = (lab, input, cls = '') => h('label', { class: `fld ${cls}` }, h('span', null, lab), input);
const textF = (c, key, lab, o = {}) => fld(lab, h(o.area ? 'textarea' : 'input', { value: c[key] ?? '', rows: o.area ? 4 : undefined, onchange: (e) => mutate((x) => { x[key] = e.target.value; }) }), o.cls);
const numF = (c, key, lab, min = 0) => fld(lab, h('input', { type: 'number', min, inputMode: 'numeric', value: c[key] ?? 0,
  onchange: (e) => mutate((x) => { x[key] = Math.max(min, parseInt(e.target.value, 10) || 0); }) }));

function skillRow(c, attr, entry, idx) {
  const sk = D.maps.skills.get(entry.skill);
  return h('li', { class: 'skill-row' },
    h('div', { class: 'row' },
      h('button', { class: 'linkbtn', type: 'button', onclick: () => openRef('skills', entry.skill) }, sk ? sk.name + (sk.advanced ? ' (A)' : '') : entry.skill),
      codeInput(entry.value, (d) => mutate(() => { entry.value = d; }), `Valor de ${sk ? sk.name : entry.skill}`),
      h('button', { class: 'btn icon', type: 'button', 'aria-label': 'Remover perícia', onclick: () => mutate(() => c.attributes[attr].skills.splice(idx, 1)) }, '✕')),
    (entry.specializations || []).map((sp, j) => h('div', { class: 'row sub' },
      h('input', { value: sp.name, 'aria-label': 'Nome da especialização', onchange: (e) => mutate(() => { sp.name = e.target.value; }) }),
      codeInput(sp.value, (d) => mutate(() => { sp.value = d; }), `Valor de ${sp.name}`),
      h('button', { class: 'btn icon', type: 'button', 'aria-label': 'Remover especialização', onclick: () => mutate(() => entry.specializations.splice(j, 1)) }, '✕'))),
    h('button', { class: 'btn small', type: 'button', onclick: () => mutate(() => {
      const base = parse(entry.value);
      (entry.specializations ||= []).push({ name: 'nova especialização', value: toDie({ dice: base.dice + 1, pips: base.pips }) });
    }) }, '+ especialização'));
}

function attributeCard(c, attr) {
  const at = c.attributes[attr];
  const taken = new Set(at.skills.map((s) => s.skill));
  const options = D.bundle.entities.skills.filter((s) => s.attribute === attr && !taken.has(s.id));
  const sel = h('select', { 'aria-label': `Adicionar perícia de ${attr}` }, h('option', { value: '' }, '+ adicionar perícia…'),
    options.map((s) => h('option', { value: s.id }, s.name + (s.advanced ? ' (A)' : ''))));
  sel.addEventListener('change', () => {
    if (!sel.value) return;
    const s = D.maps.skills.get(sel.value);
    mutate(() => at.skills.push({ skill: s.id, value: s.advanced ? toDie('1D') : toDie(parse(at.value)), specializations: [] }));
  });
  return h('section', { class: 'card attr' },
    h('div', { class: 'row between' }, h('h3', null, ATTR_ABBR[attr], ' ', h('small', null, attr)),
      codeInput(at.value, (d) => mutate(() => { at.value = d; }), `Atributo ${attr}`)),
    h('ul', { class: 'skills' }, at.skills.map((e, i) => skillRow(c, attr, e, i))), sel);
}

function listEditor(c, key, title, fields, blank, catalog) {
  const rows = c[key];
  const body = rows.map((r, i) => h('div', { class: 'row wrapr' },
    fields.map(([k, lab, type]) => fld(lab, h('input', { type: type || 'text', value: r[k] ?? '', min: type === 'number' ? 0 : undefined,
      onchange: (e) => mutate(() => { r[k] = type === 'number' ? Math.max(0, parseInt(e.target.value, 10) || 0) : e.target.value; }) }))),
    h('button', { class: 'btn icon', type: 'button', 'aria-label': 'Remover', onclick: () => mutate(() => rows.splice(i, 1)) }, '✕')));
  const actions = [h('button', { class: 'btn', type: 'button', onclick: () => mutate(() => rows.push({ ...blank })) }, `+ ${title.toLowerCase()}`)];
  if (catalog) {
    const sel = h('select', { 'aria-label': `Adicionar ${title} do catálogo` }, h('option', { value: '' }, 'do catálogo…'), listOf(catalog.cat).map((i) => h('option', { value: i.id }, i.name)));
    sel.addEventListener('change', () => { if (sel.value) mutate(() => rows.push(catalog.make(D.maps[catalog.cat].get(sel.value)))); });
    actions.push(sel);
  }
  return h('section', { class: 'card' }, h('h3', null, title), body, h('div', { class: 'row' }, actions));
}

export const weaponEntry = (w) => ({ type: w.name, item: w.id, damage: w.damage || '', range: w.range || '',
  ammo_max: (String(w.ammo || '').match(/\d+/) || [0])[0] * 1, ammo_used: 0 });
export const armorEntry = (a) => ({ type: a.name, item: a.id, av: a.protection ? `${a.protection.physical || '-'} fís. / ${a.protection.energy || '-'} en.` : '', notes: '' });
export const gearEntry = (g) => ({ type: g.name, item: g.id, notes: g.cost || '' });

function multiPick(c, key, lab, items) {
  const sel = h('select', { 'aria-label': lab }, h('option', { value: '' }, `+ ${lab}…`),
    items.filter((i) => !c[key].includes(i.id)).map((i) => h('option', { value: i.id }, i.name)));
  sel.addEventListener('change', () => { if (sel.value) mutate(() => c[key].push(sel.value)); });
  return h('div', null,
    h('div', { class: 'chips' }, c[key].map((id, i) => h('span', { class: 'chip' }, (items.find((x) => x.id === id) || { name: id }).name,
      h('button', { type: 'button', 'aria-label': 'Remover', onclick: () => mutate(() => c[key].splice(i, 1)) }, '✕')))), sel);
}

export function sheetView(root) {
  const c = activeChar();
  if (!c) {
    root.append(h('div', { class: 'view' }, h('div', { class: 'empty' }, h('h2', null, 'Nenhum personagem'),
      h('p', null, 'Crie um personagem com o assistente ou importe uma ficha JSON.'),
      h('a', { class: 'btn primary', href: '#/criar' }, 'Criar personagem'), ' ', h('a', { class: 'btn', href: '#/personagens' }, 'Meus personagens'))));
    return;
  }
  const fa = c.force_attributes || (c.force_attributes = {});
  const advList = (D.bundle.tables['advantages-disadvantages'] || {}).entries || [];
  root.append(h('div', { class: 'view sheet' },
    h('div', { class: 'row between wrapr' }, h('h2', null, c.name),
      h('div', { class: 'row wrapr' },
        h('button', { class: 'btn', type: 'button', onclick: () => printSheet(c) }, 'Imprimir'),
        h('button', { class: 'btn', type: 'button', onclick: () => { download(`${slugify(c.name) || 'ficha'}.json`, exportJSON(c)); toast('Ficha exportada.'); } }, 'Exportar JSON'),
        h('button', { class: 'btn', type: 'button', onclick: () => { const d = app.store.duplicate(c.x_app.id); app.store.setActive(d.x_app.id); notify(); toast('Personagem duplicado.'); } }, 'Duplicar'),
        h('button', { class: 'btn danger', type: 'button', onclick: async () => {
          if (await confirmDialog(`Apagar “${c.name}”? Não dá para desfazer (exporte antes).`, 'Apagar')) { app.store.remove(c.x_app.id); notify(); location.hash = '#/personagens'; }
        } }, 'Apagar'))),
    h('div', { class: 'cols' },
      h('div', { class: 'col' },
        h('section', { class: 'card' }, h('h3', null, 'Identificação'),
          h('div', { class: 'grid2' }, textF(c, 'name', 'Nome'), textF(c, 'type', 'Template / conceito'),
            fld('Espécie', (() => { const s = h('select', { onchange: (e) => mutate((x) => { x.species = e.target.value; }) },
              h('option', { value: '' }, '(nenhuma)'), listOf('species').map((sp) => h('option', { value: sp.id, selected: sp.id === c.species }, sp.name))); return s; })()),
            textF(c, 'gender', 'Gênero'), textF(c, 'age', 'Idade'), textF(c, 'height', 'Altura'), textF(c, 'weight', 'Peso')),
          textF(c, 'physical_description', 'Descrição física', { area: true })),
        ATTRS.map((a) => attributeCard(c, a))),
      h('div', { class: 'col' },
        h('section', { class: 'card' }, h('h3', null, 'Pontos e estado'),
          h('div', { class: 'grid2' }, numF(c, 'character_points', 'Character Points'), numF(c, 'force_points', 'Force Points'),
            numF(c, 'dark_side_points', 'Dark Side Points'), numF(c, 'move', 'Move'), numF(c, 'credits', 'Créditos'),
            fld('Ferimento', h('select', { onchange: (e) => mutate((x) => { x.wound_status = e.target.value; }) },
              WOUND_STATES.filter((w) => w !== 'stunned').map((w) => h('option', { value: w, selected: w === c.wound_status }, WOUND_LABEL[w]))))),
          h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: c.force_sensitive, onchange: (e) => mutate((x) => { x.force_sensitive = e.target.checked; }) }), ' Sensível à Força')),
        h('section', { class: 'card' }, h('h3', null, 'Força'),
          h('div', { class: 'row wrapr' }, FORCE_SKILLS.map((f) => fld(f, codeInput(fa[f], (d) => mutate((x) => { x.force_attributes[f] = d; }), `Force skill ${f}`)))),
          h('h4', null, 'Poderes'), multiPick(c, 'force_powers', 'poder', D.bundle.entities.force_powers)),
        h('section', { class: 'card' }, h('h3', null, 'Vantagens e desvantagens (opcional)'),
          h('h4', null, 'Vantagens'), multiPick(c, 'advantages', 'vantagem', advList.filter((x) => x.type === 'advantage')),
          h('h4', null, 'Desvantagens'), multiPick(c, 'disadvantages', 'desvantagem', advList.filter((x) => x.type !== 'advantage'))),
        textF(c, 'special_abilities', 'Habilidades especiais', { area: true, cls: 'card' }),
        listEditor(c, 'weapons', 'Armas', [['type', 'Arma'], ['damage', 'Dano'], ['range', 'Alcance'], ['ammo_max', 'Munição', 'number'], ['ammo_used', 'Usada', 'number']],
          { type: '', damage: '', range: '', ammo_max: 0, ammo_used: 0 }, { cat: 'weapons', make: weaponEntry }),
        listEditor(c, 'armor', 'Armadura', [['type', 'Tipo'], ['av', 'AV'], ['notes', 'Notas']], { type: '', av: '', notes: '' }, { cat: 'armor', make: armorEntry }),
        listEditor(c, 'other_equipment', 'Equipamento', [['type', 'Item'], ['notes', 'Notas']], { type: '', notes: '' }, { cat: 'gear', make: gearEntry }))),
    h('section', { class: 'card' }, h('h3', null, 'Texto'),
      h('div', { class: 'grid2' }, [['background', 'Background'], ['personality', 'Personalidade'], ['objectives', 'Objetivos'], ['languages', 'Idiomas'],
        ['contacts_and_enemies', 'Contatos e inimigos'], ['connection_with_characters', 'Ligação com os personagens'], ['quote', 'Citação']]
        .map(([k, l]) => textF(c, k, l, { area: true }))))));
}
export { newId };
