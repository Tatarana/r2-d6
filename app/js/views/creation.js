// views/creation.js - assistente de criacao passo a passo (RD-28..RD-37).
import { h, stepper, toast, confirmDialog } from '../util.js';
import { parse, format, add, toPips, fromPips, roll, defaultRng } from '../dice.js';
import * as R from '../rules.js';
import { blankCharacter, toDie } from '../store.js';
import { app, notify } from '../state.js';
import { D, listOf, getEntity, speciesBlock, moveStart } from '../data.js';
import { houseSeal, e061Seal, pageCite, errataSeals } from '../seals.js';
import { entityDetail, ruleSectionNode } from './reference.js';
import { weaponEntry, armorEntry, gearEntry } from './sheet.js';

const STEPS = [['origin', 'Origem'], ['species', 'Espécie'], ['attrs', 'Atributos'], ['skills', 'Perícias'], ['force', 'Força'], ['gear', 'Equipamento'], ['details', 'Detalhes'], ['summary', 'Resumo']];
const STEP_RULE = { origin: ['characters', 'overview'], species: ['characters', 'new-template'], attrs: ['characters', 'new-template'], skills: ['characters', 'pick-skills'],
  force: ['characters', 'force-sensitivity'], gear: ['characters', 'credits'], details: ['characters', 'detailing'], summary: ['characters', 'finishing'] };
const STEP_CITE = { origin: 'p.18-19', species: 'p.23-24', attrs: 'p.23-24', skills: 'p.21-22', force: 'p.22', gear: 'p.22, p.24', details: 'p.21', summary: 'p.21-22' };

let wiz = fresh();
function fresh() {
  return { step: 0, origin: null, templateId: null, speciesId: null, blockIdx: 0, attrs: null, skills: {}, perms: {}, specs: [], forceAdded: { control: 0, sense: 0, alter: 0 },
    forceSensitive: null, powers: [], startCredits: 0, cart: [], details: {}, allowPips: false, manualBudget: 14, ctx: null, gearTab: 'weapons', gearFilter: '', extra: '', creditsClass: 'poor', creditsRoll: null };
}
export const resetWizard = () => { wiz = fresh(); };

// ------------------------------------------------------------------ derivados
const tpl = () => (wiz.templateId ? getEntity('templates', wiz.templateId) : null);
const mode = () => (wiz.origin === 'scratch' ? 'scratch' : wiz.templateId === 'protocol-droid' ? 'droid' : 'template');
const block = () => (wiz.speciesId ? speciesBlock(wiz.speciesId, wiz.blockIdx) : null);
const attrCode = (a) => parse(wiz.attrs[a]);
const listedEntries = () => (wiz.templateId ? D.bundle.derived.template_skill_map[wiz.templateId] : []);
const listedIds = () => (wiz.origin === 'scratch' ? null : new Set(listedEntries().map((e) => e.skill_id).filter(Boolean)));
const forceGrant = () => {
  const g = {};
  if (tpl()) for (const [k, v] of Object.entries(tpl().force_skills || {})) g[k] = parse(v);
  return g;
};
const sensitivity = () => (tpl() ? R.templateSensitivity(tpl()) : { fixed: false, value: null });
const isSensitive = () => (sensitivity().fixed && !wiz.templateOverrideSens ? sensitivity().value : !!wiz.forceSensitive);
const forceTotal = (f) => ((forceGrant()[f] || { dice: 0 }).dice) + (wiz.forceAdded[f] || 0);
const forceDiceForBudget = () => R.FORCE_SKILLS.reduce((s, f) => s + (wiz.forceAdded[f] || 0), 0);
const scratchBudgetOverride = () => {
  const b = block();
  if (!b || R.scratchBudget(b)) return null;
  return { dice: Math.max(0, parseInt(wiz.manualBudget, 10) || 0), pips: 0 };
};

function ctxObj() {
  return { skills: D.bundle.entities.skills, advancedPrereqs: D.bundle.derived.advanced_prereqs, listedIds: listedIds(), template: tpl(), forceGrant: forceGrant(),
    speciesBlock: block(), budget: mode() === 'droid' ? 17 : undefined, budgetOverride: scratchBudgetOverride() };
}
function draft() {
  return { name: wiz.details.name, mode: mode(), attributes: wiz.attrs || {}, skills: wiz.skills, specializations: wiz.specs, forceAdded: wiz.forceAdded,
    forceSensitive: isSensitive(), permissions: wiz.perms, allowPips: wiz.allowPips, forcePowers: wiz.powers };
}
function skillCodeOf(id) {
  const s = D.maps.skills.get(id);
  const added = wiz.skills[id] || { dice: 0, pips: 0 };
  if (s.advanced) return toPips(added) ? added : { dice: 0, pips: 0 };
  return R.skillValue(attrCode(s.attribute), added);
}
const parseCredits = (text) => { const m = String(text || '').match(/([\d][\d,.]*)\s*credits/i); return m ? parseInt(m[1].replace(/[,.]/g, ''), 10) : 0; };
const balance = () => wiz.startCredits - wiz.cart.reduce((s, i) => s + (i.charged || 0), 0);

// ------------------------------------------------------------------ inicializacao por origem
function pickTemplate(t) {
  wiz = { ...fresh(), step: 0, origin: 'template', templateId: t.id };
  wiz.attrs = Object.fromEntries(R.ATTRS.map((a) => [a, parse(t.attributes[a])]));
  wiz.speciesId = D.bundle.derived.template_species[t.id] || null;
  const sens = R.templateSensitivity(t);
  wiz.forceSensitive = sens.fixed ? sens.value : null;
  wiz.startCredits = parseCredits(t.equipment);
  wiz.details = { background: t.background || '', personality: t.personality || '', objectives: t.objectives || '', connection: t.connection_with_characters || '', quote: t.a_quote || '' };
}
function pickScratch() {
  wiz = { ...fresh(), origin: 'scratch' };
}
function pickSpecies(id) {
  wiz.speciesId = id || null; wiz.blockIdx = 0;
  if (wiz.origin === 'scratch' && id) {
    const b = block();
    wiz.attrs = Object.fromEntries(R.ATTRS.map((a) => [a, b.attributes && b.attributes[a] ? parse(b.attributes[a].min) : parse('2D')]));
  }
}

// ------------------------------------------------------------------ UI auxiliar
const msgList = (items, cls) => (items.length ? h('ul', { class: `msgs ${cls}` }, items.map((m) => h('li', null, m.msg, ' ', m.house ? houseSeal(m.rd) : h('small', { class: 'muted' }, m.rd)))) : null);
const nameBtn = (cat, id, label) => h('button', { class: 'linkbtn', type: 'button', onclick: () => { wiz.ctx = { cat, id }; notify(); } }, label);

function validation() { return R.validateCreation(draft(), ctxObj()); }

// ------------------------------------------------------------------ passos
function stepOrigin() {
  const ts = [...listOf('templates')].sort((a, b) => a.type.localeCompare(b.type));
  return h('div', null, h('h3', null, 'De onde vem o personagem?'),
    h('p', { class: 'muted' }, 'Template: atributos, perícias e equipamento prontos (livro, cap. 23). Do zero: espécie + 6D para distribuir (novo template, p.23-24).'),
    h('div', { class: 'cards' },
      h('button', { class: `card link pick${wiz.origin === 'scratch' ? ' on' : ''}`, type: 'button', onclick: () => { pickScratch(); notify(); } }, h('strong', null, 'Do zero (novo template)'), h('span', { class: 'muted' }, 'Espécie + 6D de atributos')),
      ts.map((t) => {
        const tot = R.templateDiceTotals(t);
        return h('button', { class: `card link pick${wiz.templateId === t.id ? ' on' : ''}`, type: 'button', onclick: () => { pickTemplate(t); notify(); } },
          h('strong', null, t.type), h('span', { class: 'muted' }, `${tot.totalText} · Move ${t.move} · p.${t.page}`),
          t.force_skills ? h('span', { class: 'seal' }, 'Força') : null);
      })));
}

function stepSpecies() {
  if (mode() === 'droid') return h('div', null, h('h3', null, 'Espécie'), h('p', null, 'Protocol Droid é um droide: sem espécie. Atributos fixos de 8D e 17D de perícias, máximo 2D por perícia (RD-34).'));
  const species = listOf('species');
  const b = block();
  const sel = h('select', { 'aria-label': 'Espécie', onchange: (e) => { pickSpecies(e.target.value); notify(); } },
    h('option', { value: '' }, '(escolha)'), species.map((s) => h('option', { value: s.id, selected: s.id === wiz.speciesId }, s.name)));
  const s = wiz.speciesId ? getEntity('species', wiz.speciesId) : null;
  const ms = wiz.speciesId ? D.bundle.derived.species_move_start[wiz.speciesId] : null;
  return h('div', null, h('h3', null, 'Espécie'),
    wiz.origin === 'template' ? h('p', { class: 'muted' }, wiz.speciesId ? `Espécie sugerida para ${tpl().type} (RD-34). Limites da espécie só geram avisos em templates.` : 'Este template aceita qualquer espécie: escolha uma.') : null,
    h('label', { class: 'fld' }, h('span', null, 'Espécie'), sel),
    s && s.stat_blocks.length > 1 ? h('label', { class: 'fld' }, h('span', null, 'Variante'), h('select', { onchange: (e) => { wiz.blockIdx = Number(e.target.value); pickSpecies(wiz.speciesId); wiz.blockIdx = Number(e.target.value); notify(); } },
      s.stat_blocks.map((x, i) => h('option', { value: i, selected: i === wiz.blockIdx }, x.stat_block)))) : null,
    s && b ? h('div', { class: 'card' }, h('h4', null, s.name, ' ', pageCite(`p.${b.page || s.page}`)),
      h('p', null, `Atributos: ${b.attribute_dice} · Move inicial ${ms && ms[wiz.blockIdx] ? ms[wiz.blockIdx].move_start : '?'} (“${b.move}”, RD-42) · ${b.size || ''}`),
      b.attributes ? h('table', { class: 'mini' }, h('thead', null, h('tr', null, h('th'), R.ATTRS.map((a) => h('th', null, R.ATTR_ABBR[a])))),
        h('tbody', null, h('tr', null, h('th', null, 'mín'), R.ATTRS.map((a) => h('td', null, b.attributes[a].min.text))), h('tr', null, h('th', null, 'máx'), R.ATTRS.map((a) => h('td', null, b.attributes[a].max.text))))) : null,
      (b.special_abilities || []).length ? h('div', { class: 'warnbox' }, h('strong', null, 'Habilidades especiais (aplique manualmente):'), h('ul', null, b.special_abilities.map((t) => h('li', null, t)))) : null,
      (b.special_skills || []).length ? h('details', null, h('summary', null, 'Perícias especiais da espécie'), h('ul', null, b.special_skills.map((t) => h('li', null, t)))) : null,
      (b.story_factors || []).length ? h('details', null, h('summary', null, 'Fatores de história'), h('ul', null, b.story_factors.map((t) => h('li', null, t)))) : null) : null,
    wiz.origin === 'scratch' && b && !R.scratchBudget(b) ? h('div', { class: 'warnbox' }, h('p', null, `O total de atributos desta espécie é texto livre (“${b.attribute_dice}”). Informe o total de dados de atributos (inclui o +6D):`),
      h('label', { class: 'fld inline' }, h('span', null, 'Total (D)'), h('input', { type: 'number', min: 1, value: wiz.manualBudget, onchange: (e) => { wiz.manualBudget = e.target.value; notify(); } }))) : null);
}

function stepAttrs() {
  if (!wiz.attrs) return h('p', { class: 'muted' }, 'Escolha a espécie antes.');
  const b = block();
  if (mode() !== 'scratch') {
    const tot = R.templateDiceTotals(tpl());
    return h('div', null, h('h3', null, 'Atributos do template'),
      h('p', { class: 'muted' }, `Valores impressos no template (p.${tpl().page}). Total de atributos: ${tpl().attribute_total}${tot.forcePips ? ` + ${format(fromPips(tot.forcePips))} de Força = ${tot.totalText}` : ''} (RD-33).`),
      h('table', { class: 'mini big' }, h('thead', null, h('tr', null, R.ATTRS.map((a) => h('th', null, R.ATTR_ABBR[a])))), h('tbody', null, h('tr', null, R.ATTRS.map((a) => h('td', null, format(attrCode(a))))))),
      msgList(R.speciesLimitWarnings(wiz.attrs, b), 'warn'));
  }
  const res = R.validateScratchAttributes(wiz.attrs, b, forceDiceForBudget(), scratchBudgetOverride());
  const row = (a) => {
    const v = toPips(attrCode(a)), lim = b && b.attributes && b.attributes[a];
    const min = lim ? toPips(lim.min) : 3, max = lim ? toPips(lim.max) : 60;
    const set = (nv) => { wiz.attrs[a] = fromPips(nv); notify(); };
    return h('div', { class: 'row between wrapr attr-row' }, h('span', null, h('strong', null, R.ATTR_ABBR[a]), ' ', h('small', { class: 'muted' }, lim ? `${lim.min.text} a ${lim.max.text}` : '')),
      h('span', { class: 'row' },
        h('button', { class: 'btn', type: 'button', disabled: v - 3 < min, onclick: () => set(v - 3), 'aria-label': `${a} menos 1D` }, '−1D'),
        h('button', { class: 'btn icon', type: 'button', disabled: v - 1 < min, onclick: () => set(v - 1), 'aria-label': `${a} menos 1 pip` }, '−'),
        h('output', { class: 'val code' }, format(attrCode(a))),
        h('button', { class: 'btn icon', type: 'button', disabled: v + 1 > max, onclick: () => set(v + 1), 'aria-label': `${a} mais 1 pip` }, '+'),
        h('button', { class: 'btn', type: 'button', disabled: v + 3 > max, onclick: () => set(v + 3), 'aria-label': `${a} mais 1D` }, '+1D')));
  };
  return h('div', null, h('h3', null, 'Distribua os atributos'),
    h('p', { class: 'muted' }, `Total disponível: ${res.budget ? format(res.budget) : '?'} (espécie + 6D). 3 pips = 1D (RD-01). Usado: ${format(res.used)}${forceDiceForBudget() ? ` (inclui ${forceDiceForBudget()}D de Força)` : ''}.`),
    R.ATTRS.map(row), msgList(res.errors, 'err'), msgList(res.warnings, 'warn'));
}

function skillRow(id, { extra = false } = {}) {
  const s = D.maps.skills.get(id);
  const added = wiz.skills[id] || { dice: 0, pips: 0 };
  const entry = listedEntries().find((e) => e.skill_id === id);
  const set = (dice, pips) => { wiz.skills[id] = { dice: Math.max(0, dice), pips: Math.max(0, pips) }; notify(); };
  const canPips = wiz.allowPips;
  const sv0 = R.validateSkills(draft(), ctxObj());
  const remaining = toPips(sv0.budget) - toPips(sv0.used);
  const cap = R.SKILL_CAP_DICE * 3;
  const notListed = !s.advanced && listedIds() && !listedIds().has(id) && !wiz.perms[id];
  const why = (need) => (notListed ? 'precisa da permissão do mestre' : toPips(added) + need > cap ? `teto de ${R.SKILL_CAP_DICE}D na criação (p.21)` : remaining < need ? 'sem dados de perícia restantes (7D)' : '');
  const plusWhy = why(3), pipWhy = why(1);
  return h('div', { class: 'row between wrapr skill-pick' },
    h('span', null, nameBtn('skills', id, s.name + (s.advanced ? ' (A)' : '')), ' ', entry && entry.alias ? e061Seal() : null, entry && entry.alias ? h('small', { class: 'muted' }, ` (“${entry.name}”)`) : null),
    h('span', { class: 'row' },
      extra ? h('label', { class: 'check small' }, h('input', { type: 'checkbox', checked: !!wiz.perms[id], onchange: (e) => { wiz.perms[id] = e.target.checked; notify(); } }), ' permissão do mestre') : null,
      h('small', { class: 'muted' }, s.advanced ? '' : format(attrCode(s.attribute))),
      h('button', { class: 'btn icon', type: 'button', disabled: !toPips(added), onclick: () => set(added.dice - 1, added.pips), 'aria-label': `${s.name} menos 1D` }, '−'),
      h('output', { class: 'val' }, `+${format(added)}`),
      h('button', { class: 'btn icon', type: 'button', disabled: !!plusWhy, title: plusWhy || null, onclick: () => set(added.dice + 1, added.pips), 'aria-label': `${s.name} mais 1D` }, '+'),
      canPips ? h('button', { class: 'btn small', type: 'button', disabled: added.pips < 2 && !!pipWhy, title: added.pips < 2 && pipWhy ? pipWhy : null, onclick: () => set(added.dice, (added.pips + 1) % 3) }, `+pip (${added.pips})`) : null,
      h('strong', { class: 'code' }, format(skillCodeOf(id)))));
}

function stepSkills() {
  const v = validation();
  const sv = R.validateSkills(draft(), ctxObj());
  const listed = listedEntries();
  const ids = listedIds();
  const byAttr = (a) => listed.filter((e) => e.attribute === a && e.skill_id);
  const extraIds = Object.keys(wiz.skills).filter((id) => ids && !ids.has(id) && !D.maps.skills.get(id).advanced);
  const addExtra = h('select', { 'aria-label': 'Adicionar perícia fora do template' }, h('option', { value: '' }, '+ perícia fora do template (permissão do mestre)…'),
    D.bundle.entities.skills.filter((s) => !s.advanced && ids && !ids.has(s.id) && !extraIds.includes(s.id)).map((s) => h('option', { value: s.id }, s.name)));
  addExtra.addEventListener('change', () => { if (addExtra.value) { wiz.skills[addExtra.value] = { dice: 0, pips: 0 }; wiz.perms[addExtra.value] = true; notify(); } });
  const special = listed.filter((e) => e.species_special_skill);
  const advIds = Object.keys(wiz.skills).filter((id) => D.maps.skills.get(id).advanced);
  const addAdv = h('select', { 'aria-label': 'Adicionar perícia avançada' }, h('option', { value: '' }, '+ perícia avançada (A)…'),
    D.bundle.entities.skills.filter((s) => s.advanced && !advIds.includes(s.id)).map((s) => h('option', { value: s.id }, s.name)));
  addAdv.addEventListener('change', () => { if (addAdv.value) { wiz.skills[addAdv.value] = { dice: 1, pips: 0 }; notify(); } });
  const sp = species();
  const ewokWarn = sp && sp.id === 'ewok' ? (getEntity('species', 'ewok').stat_blocks[0].special_abilities || []).filter((t) => /bonus|limit/i.test(t)) : [];
  const nSpec = wiz.specs.length;
  const specBlocked = toPips(sv.budget) - toPips(sv.used) < 3;
  return h('div', null,
    h('div', { class: 'budget sticky' }, h('strong', null, `${sv.budget.dice}D de perícias`), ` · usado ${format(sv.used)} · restante `,
      h('strong', { class: toPips(sv.budget) - toPips(sv.used) < 0 ? 'bad' : '' }, format(fromPips(Math.max(0, toPips(sv.budget) - toPips(sv.used))))), ` · teto ${R.SKILL_CAP_DICE}D por perícia`),
    ewokWarn.length ? h('div', { class: 'warnbox' }, h('strong', null, 'Espécie Ewok (RD-38): aplique manualmente.'), h('ul', null, ewokWarn.map((t) => h('li', null, t)))) : null,
    mode() === 'droid' ? h('div', { class: 'warnbox' }, 'Protocol Droid: 17D de perícias, máximo 2D por perícia (texto do template).') : null,
    h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: wiz.allowPips, onchange: (e) => { wiz.allowPips = e.target.checked; notify(); } }), ' Permitir pips soltos ', houseSeal('RD-29')),
    R.ATTRS.map((a) => {
      const rows = byAttr(a);
      if (!rows.length) return null;
      return h('section', { class: 'card' }, h('h4', null, `${R.ATTR_ABBR[a]} ${format(attrCode(a))}`), rows.map((e) => skillRow(e.skill_id)));
    }),
    special.length ? h('p', { class: 'muted' }, 'Perícias especiais da espécie (sem id no capítulo de perícias): ', special.map((e) => e.name).join(', '), '.') : null,
    ids ? h('section', { class: 'card' }, h('h4', null, 'Fora do template (permissão do mestre)'), extraIds.map((id) => skillRow(id, { extra: true })), addExtra) : null,
    h('section', { class: 'card' }, h('h4', null, 'Especializações (1D = 3, RD-30)'),
      h('p', { class: 'muted small' }, 'Cada uma vale a perícia base +1D (ou o atributo +1D se a perícia não foi melhorada).'),
      wiz.specs.map((spx, i) => {
        const s = D.maps.skills.get(spx.skillId);
        return h('div', { class: 'row wrapr spec-row' },
          h('select', { 'aria-label': 'Perícia da especialização', onchange: (e) => { spx.skillId = e.target.value; notify(); } },
            D.bundle.entities.skills.filter((x) => !x.advanced).map((x) => h('option', { value: x.id, selected: x.id === spx.skillId }, x.name))),
          h('input', { 'aria-label': 'Nome da especialização', placeholder: 'nome (ex.: blaster pistol)', value: spx.name, oninput: (e) => { spx.name = e.target.value; } }),
          h('strong', { class: 'code' }, format(R.specializationValue(skillCodeOf(spx.skillId)))),
          h('button', { class: 'btn icon', type: 'button', 'aria-label': 'Remover', onclick: () => { wiz.specs.splice(i, 1); notify(); } }, '✕'));
      }),
      h('div', { class: 'row wrapr' }, h('button', { class: 'btn', type: 'button', disabled: specBlocked, title: specBlocked ? 'sem 1D de perícia restante (7D)' : null, onclick: () => { for (let k = 0; k < 3; k++) wiz.specs.push({ skillId: D.bundle.entities.skills.find((x) => !x.advanced && (!ids || ids.has(x.id))).id, name: '' }); notify(); } }, '+ bloco de 3 (custa 1D)'),
        nSpec > 3 ? houseSeal('RD-30') : null)),
    h('section', { class: 'card' }, h('h4', null, 'Perícias avançadas (A) (RD-31)'),
      advIds.map((id) => {
        const chk = R.checkAdvancedPrereq(id, skillCodeOf, D.bundle.derived.advanced_prereqs);
        return h('div', null, skillRow(id), h('p', { class: `small ${chk.ok ? 'muted' : 'bad'}` }, chk.manual ? `Pré-requisito composto, confirmar com o mestre: ${chk.text}` : chk.ok ? 'Pré-requisito cumprido.' : `Pré-requisito: ${chk.text}`),
          h('button', { class: 'btn small', type: 'button', onclick: () => { delete wiz.skills[id]; notify(); } }, 'remover'));
      }), addAdv, h('p', { class: 'muted small' }, `Começa em ${format(R.ADVANCED_START)}; recebe 1D ou 2D dos dados de perícia.`)),
    Object.keys(forceGrant()).length ? h('section', { class: 'card' }, h('h4', null, 'Perícias da Força do template (RD-32)'),
      R.FORCE_SKILLS.filter((f) => forceGrant()[f]).map((f) => h('div', { class: 'row between wrapr' }, h('span', null, f, ' ', h('small', { class: 'muted' }, `base ${format(forceGrant()[f])}`)),
        h('span', { class: 'row' }, stepper(wiz.forceAdded[f], (n) => { wiz.forceAdded[f] = n; notify(); }, { min: 0, max: R.SKILL_CAP_DICE, label: `Force ${f}`, fmt: (n) => `+${n}D` }), h('strong', { class: 'code' }, `${forceTotal(f)}D`))))) : null,
    msgList(sv.errors, 'err'), msgList(sv.warnings, 'warn'), v.errors.length ? null : null);
}
function species() { return wiz.speciesId ? getEntity('species', wiz.speciesId) : null; }

function stepForce() {
  const sens = sensitivity();
  const t = tpl();
  const need = t ? t.force_powers_to_select || 0 : 0;
  const forceValues = Object.fromEntries(R.FORCE_SKILLS.map((f) => [f, forceTotal(f)]));
  const req = D.bundle.derived.force_power_required_ids;
  const eligible = R.eligibleForcePowers(D.bundle.entities.force_powers, forceValues, wiz.powers, req);
  const eligibleIds = new Set(eligible.map((p) => p.id));
  // remove em cascata poderes cujos pre-requisitos deixaram de valer
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of [...wiz.powers]) {
      const p = D.maps.powers.get(id);
      const others = wiz.powers.filter((x) => x !== id);
      const ok = p.skills.every((s) => forceValues[s] > 0) && (req[id] || []).every((r) => others.includes(r));
      if (!ok) { wiz.powers = others; changed = true; }
    }
  }
  const sensitive = isSensitive();
  const toggle = (id, on) => {
    if (on && need && wiz.powers.length >= need) { toast(`Este template permite ${need} poder(es).`, 'err'); return; }
    wiz.powers = on ? [...wiz.powers, id] : wiz.powers.filter((x) => x !== id);
    notify();
  };
  return h('div', null, h('h3', null, 'Força'),
    sens.fixed
      ? h('p', null, sens.value ? 'Este template é sensível à Força (obrigatório).' : 'Este template está impresso como não sensível à Força.',
        !sens.value ? h('span', null, ' ', h('button', { class: 'btn small', type: 'button', onclick: async () => {
          if (await confirmDialog('O template Bounty Hunter está impresso como “No”. Mudar a sensibilidade pede aprovação do mestre. Continuar?', 'Mudar')) { wiz.forceSensitive = true; wiz.templateOverrideSens = true; notify(); }
        } }, 'alterar com aviso')) : null)
      : h('fieldset', null, h('legend', null, 'Sensível à Força?'),
        [[true, 'Sim (2 Force Points)'], [false, 'Não (1 Force Point)']].map(([v, l]) => h('label', { class: 'check big' }, h('input', { type: 'radio', name: 'sens', checked: wiz.forceSensitive === v, onchange: () => { wiz.forceSensitive = v; notify(); } }), ` ${l}`))),
    h('p', { class: 'muted' }, `Pontos iniciais: ${R.startingPoints(sensitive).characterPoints} Character Points, ${R.startingPoints(sensitive).forcePoints} Force Point(s) (RD-36, p.21-22).`),
    mode() === 'scratch' && sensitive ? h('section', { class: 'card' }, h('h4', null, 'Perícias da Força (RD-33)'),
      h('p', { class: 'muted small' }, 'Cada 1D de control, sense ou alter custa 1D dos dados de atributo; exige permissão do mestre.'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!wiz.perms['force:control'], onchange: (e) => { for (const f of R.FORCE_SKILLS) wiz.perms[`force:${f}`] = e.target.checked; if (!e.target.checked) wiz.forceAdded = { control: 0, sense: 0, alter: 0 }; notify(); } }), ' Permissão do mestre'),
      wiz.perms['force:control'] ? R.FORCE_SKILLS.map((f) => h('div', { class: 'row between wrapr' }, h('span', null, f), stepper(wiz.forceAdded[f], (n) => { wiz.forceAdded[f] = n; notify(); }, { min: 0, max: 4, label: `Force ${f}`, fmt: (n) => `${n}D` }))) : null) : null,
    sensitive ? h('section', { class: 'card' }, h('h4', null, `Poderes ${need ? `(escolha ${need}: ${wiz.powers.length}/${need})` : '(escolha com o mestre)'}`),
      h('p', { class: 'muted small' }, 'Só aparecem poderes cujas perícias você tem e cujos poderes exigidos já foram escolhidos.'),
      eligible.length ? eligible.map((p) => h('label', { class: 'check pick-power' }, h('input', { type: 'checkbox', checked: wiz.powers.includes(p.id), onchange: (e) => toggle(p.id, e.target.checked) }), ' ',
        nameBtn('powers', p.id, p.name), h('small', { class: 'muted' }, ` ${p.skills.join('+')} · p.${p.page}`), p.warning ? h('span', { class: 'seal warn small', title: p.warning }, 'aviso: Dark Side') : null))
        : h('p', { class: 'muted' }, 'Nenhum poder disponível: precisa de dados em control, sense ou alter.'),
      wiz.powers.filter((id) => !eligibleIds.has(id)).map((id) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: true, onchange: () => toggle(id, false) }), ' ', D.maps.powers.get(id).name))) : h('p', { class: 'muted' }, 'Sem Força: nenhum poder.'));
}

function stepGear() {
  const t = tpl();
  const bal = balance();
  const cat = wiz.gearTab;
  const items = listOf(cat).filter((i) => !wiz.gearFilter || i.name.toLowerCase().includes(wiz.gearFilter.toLowerCase()));
  const add = (item) => {
    const p = R.purchase(bal, item);
    if (p.error) { toast(p.error, 'err'); return; }
    wiz.cart.push({ cat, id: item.id, name: item.name, charged: p.charged, warning: p.warning });
    notify();
  };
  const cls = { poor: 100, average: 250, wealthy: 400 };
  return h('div', null, h('h3', null, 'Equipamento'),
    t ? h('div', { class: 'card' }, h('strong', null, 'Equipamento do template: '), t.equipment) : null,
    h('div', { class: 'row wrapr' }, h('label', { class: 'fld inline' }, h('span', null, 'Créditos iniciais'), h('input', { type: 'number', min: 0, inputMode: 'numeric', value: wiz.startCredits, onchange: (e) => { wiz.startCredits = Math.max(0, parseInt(e.target.value, 10) || 0); notify(); } })),
      h('strong', { class: bal < 0 ? 'bad' : '' }, `Saldo: ${bal} cr`)),
    t ? h('p', { class: 'muted small' }, 'Confirme o valor em créditos conforme o texto do template (RD-37).') : null,
    mode() === 'scratch' ? h('section', { class: 'card' }, h('h4', null, 'Créditos iniciais opcionais (mestre, RD-37)'),
      h('div', { class: 'row wrapr' },
        h('select', { 'aria-label': 'Classe', onchange: (e) => { wiz.creditsClass = e.target.value; notify(); } }, [['poor', 'Poor (2D × 100)'], ['average', 'Average (2D × 250)'], ['wealthy', 'Wealthy (2D × 400)']].map(([v, l]) => h('option', { value: v, selected: v === wiz.creditsClass }, l))),
        h('button', { class: 'btn', type: 'button', onclick: () => { const r2 = roll('2D', defaultRng).totals.normal; wiz.creditsRoll = r2; wiz.startCredits = r2 * cls[wiz.creditsClass]; notify(); } }, 'Rolar 2D'),
        wiz.creditsRoll ? h('span', null, `2D = ${wiz.creditsRoll} → ${wiz.creditsRoll * cls[wiz.creditsClass]} cr`) : null)) : null,
    h('div', { class: 'tabs' }, [['weapons', 'Armas'], ['armor', 'Armaduras'], ['gear', 'Equipamentos']].map(([id, l]) => h('button', { class: `tab${wiz.gearTab === id ? ' on' : ''}`, type: 'button', onclick: () => { wiz.gearTab = id; notify(); } }, l))),
    h('input', { type: 'search', placeholder: 'Filtrar catálogo…', 'aria-label': 'Filtrar catálogo', value: wiz.gearFilter, oninput: (e) => { wiz.gearFilter = e.target.value; clearTimeout(wiz._ft); wiz._ft = setTimeout(notify, 250); } }),
    h('div', { class: 'catalog' }, items.slice(0, 60).map((i) => h('div', { class: 'row between wrapr cat-row' },
      h('span', null, nameBtn(cat, i.id, i.name), ' ', h('small', { class: 'muted' }, [i.damage, i.range].filter(Boolean).join(' · '))),
      h('span', { class: 'row' }, i.cost_credits == null ? h('span', { class: 'seal warn small', title: 'preço a combinar com o mestre' }, 'sem preço') : h('span', null, `${i.cost_credits} cr`), pageCite(`p.${i.page}`),
        h('button', { class: 'btn', type: 'button', onclick: () => add(i) }, 'Adicionar'))))),
    h('section', { class: 'card' }, h('h4', null, `Comprados (${wiz.cart.length})`),
      wiz.cart.map((c, i) => h('div', { class: 'row between' }, h('span', null, c.name, c.warning ? h('span', { class: 'seal warn small' }, ` ${c.warning}`) : ` (${c.charged} cr)`),
        h('button', { class: 'btn icon', type: 'button', 'aria-label': `Remover ${c.name}`, onclick: () => { wiz.cart.splice(i, 1); notify(); } }, '✕'))),
      wiz.cart.length ? null : h('p', { class: 'muted' }, 'Nada ainda.')));
}

function stepDetails() {
  const d = wiz.details;
  const f = (k, lab, area) => h('label', { class: 'fld' }, h('span', null, lab), h(area ? 'textarea' : 'input', { rows: area ? 4 : undefined, value: d[k] || '', oninput: (e) => { d[k] = e.target.value; }, onchange: () => notify() }));
  return h('div', null, h('h3', null, 'Detalhes'),
    f('name', 'Nome *'), h('div', { class: 'grid2' }, f('gender', 'Gênero'), f('age', 'Idade'), f('height', 'Altura'), f('weight', 'Peso')),
    f('physical_description', 'Descrição física', true), f('personality', 'Personalidade', true), f('background', 'Background', true), f('objectives', 'Objetivos', true), f('languages', 'Idiomas'), f('quote', 'Citação'));
}

// ------------------------------------------------------------------ montagem e resumo
export function buildCharacter() {
  const c = blankCharacter(wiz.details.name || 'Sem nome');
  const t = tpl(), sp = species(), b = block();
  c.type = t ? t.type : 'Novo template';
  c.species = sp ? sp.id : '';
  for (const a of R.ATTRS) c.attributes[a] = { value: toDie(attrCode(a)), skills: [] };
  const byAttr = (a) => c.attributes[a].skills;
  const entryFor = (id) => {
    const s = D.maps.skills.get(id);
    let e = byAttr(s.attribute).find((x) => x.skill === id);
    if (!e) { e = { skill: id, value: toDie(skillCodeOf(id)), specializations: [] }; byAttr(s.attribute).push(e); }
    return e;
  };
  for (const [id, added] of Object.entries(wiz.skills)) if (toPips(added)) entryFor(id);
  for (const sx of wiz.specs) {
    if (!sx.name || !sx.name.trim()) continue;
    const e = entryFor(sx.skillId);
    e.specializations.push({ name: sx.name.trim(), value: toDie(R.specializationValue(skillCodeOf(sx.skillId))) });
  }
  const sens = isSensitive();
  c.force_sensitive = !!sens;
  c.force_points = R.startingPoints(sens).forcePoints;
  c.character_points = R.startingPoints(sens).characterPoints;
  c.force_attributes = {};
  for (const f of R.FORCE_SKILLS) if (forceTotal(f) > 0) c.force_attributes[f] = toDie({ dice: forceTotal(f), pips: 0 });
  c.force_powers = [...wiz.powers];
  c.move = t && mode() !== 'scratch' ? parseInt(t.move, 10) || 10 : moveStart(wiz.speciesId) || 10;
  if (t && mode() !== 'scratch' && wiz.speciesId && moveStart(wiz.speciesId) && parseInt(t.move, 10) !== moveStart(wiz.speciesId)) c.move = parseInt(t.move, 10);
  c.special_abilities = t ? t.special_abilities || '' : ((b && b.special_abilities) || []).join(' ');
  c.credits = Math.max(0, balance());
  if (t && t.equipment) c.other_equipment.push({ type: t.equipment, notes: 'equipamento do template' });
  for (const i of wiz.cart) {
    const item = getEntity(i.cat, i.id);
    if (i.cat === 'weapons') c.weapons.push(weaponEntry(item));
    else if (i.cat === 'armor') c.armor.push(armorEntry(item));
    else c.other_equipment.push(gearEntry(item));
  }
  const d = wiz.details;
  Object.assign(c, { gender: d.gender || '', age: d.age || '', height: d.height || '', weight: d.weight || '', physical_description: d.physical_description || '',
    personality: d.personality || '', background: d.background || '', objectives: d.objectives || '', languages: d.languages || '', quote: d.quote || '',
    connection_with_characters: d.connection || '' });
  return c;
}

function stepSummary() {
  const v = validation();
  const c = buildCharacter();
  const skillList = R.ATTRS.flatMap((a) => c.attributes[a].skills.map((s) => `${D.maps.skills.get(s.skill).name} ${s.value.text}${s.specializations.length ? ` (${s.specializations.map((x) => `${x.name} ${x.value.text}`).join(', ')})` : ''}`));
  return h('div', null, h('h3', null, 'Resumo'),
    v.errors.length ? h('div', { class: 'errbox' }, h('strong', null, 'Corrija antes de salvar:'), msgList(v.errors, 'err')) : h('p', { class: 'ok' }, 'Sem erros.'),
    v.warnings.length ? h('div', { class: 'warnbox' }, h('strong', null, 'Avisos (não bloqueiam):'), msgList(v.warnings, 'warn')) : null,
    h('div', { class: 'card' }, h('h4', null, c.name, ' ', h('small', { class: 'muted' }, c.type)),
      h('table', { class: 'mini big' }, h('thead', null, h('tr', null, R.ATTRS.map((a) => h('th', null, R.ATTR_ABBR[a])))), h('tbody', null, h('tr', null, R.ATTRS.map((a) => h('td', null, c.attributes[a].value.text))))),
      h('p', null, h('strong', null, 'Perícias: '), skillList.join('; ') || '—'),
      h('p', null, `CP ${c.character_points} · FP ${c.force_points} · Move ${c.move} · Créditos ${c.credits}${c.force_sensitive ? ' · sensível à Força' : ''}`),
      c.force_powers.length ? h('p', null, 'Poderes: ', c.force_powers.map((id) => D.maps.powers.get(id).name).join(', ')) : null),
    h('button', { class: 'btn primary big', type: 'button', disabled: v.errors.length > 0, onclick: () => {
      const saved = app.store.save(c);
      app.store.setActive(saved.x_app.id);
      resetWizard(); toast(`${saved.name} salvo.`);
      location.hash = '#/ficha'; notify();
    } }, 'Salvar personagem'));
}

// ------------------------------------------------------------------ painel de contexto
function contextPanel() {
  const key = STEPS[wiz.step][0];
  const [file, anchor] = STEP_RULE[key];
  const rule = ruleSectionNode(file, anchor);
  const extra = [];
  if (key === 'force') extra.push(ruleSectionNode('characters', 'force-powers'));
  const ctxNode = wiz.ctx ? h('div', null, h('button', { class: 'btn small', type: 'button', onclick: () => { wiz.ctx = null; notify(); } }, '← regra do passo'), entityDetail(wiz.ctx.cat, wiz.ctx.id)) : null;
  const live = wiz.attrs ? h('section', { class: 'card' }, h('h4', null, 'Personagem até agora'),
    h('p', null, R.ATTRS.map((a) => `${R.ATTR_ABBR[a]} ${format(attrCode(a))}`).join(' · ')),
    h('p', { class: 'muted small' }, Object.entries(wiz.skills).filter(([, v]) => toPips(v)).map(([id]) => `${D.maps.skills.get(id).name} ${format(skillCodeOf(id))}`).join('; ') || 'sem perícias melhoradas')) : null;
  return h('aside', { class: 'wiz-ctx', 'aria-label': 'Contexto' }, h('p', { class: 'muted small' }, 'Regra deste passo ', pageCite(STEP_CITE[key])), ctxNode || [rule, extra], live);
}

function canAdvance() {
  const key = STEPS[wiz.step][0];
  if (key === 'origin') return !!wiz.origin && (wiz.origin === 'scratch' || !!wiz.templateId);
  if (key === 'species') return mode() === 'droid' || !!wiz.speciesId;
  if (key === 'attrs') return !!wiz.attrs;
  if (key === 'force') return mode() === 'droid' || sensitivity().fixed || wiz.forceSensitive !== null;
  return true;
}

export function creationView(root) {
  const key = STEPS[wiz.step][0];
  const body = { origin: stepOrigin, species: stepSpecies, attrs: stepAttrs, skills: stepSkills, force: stepForce, gear: stepGear, details: stepDetails, summary: stepSummary }[key]();
  root.append(h('div', { class: 'view wizard' },
    h('nav', { class: 'wiz-steps', 'aria-label': 'Passos' }, h('ol', null, STEPS.map(([id, l], i) => h('li', null,
      h('button', { class: `step${i === wiz.step ? ' on' : ''}${i < wiz.step ? ' done' : ''}`, type: 'button', 'aria-current': i === wiz.step ? 'step' : null, disabled: i > 0 && !wiz.origin, onclick: () => { wiz.step = i; notify(); } }, h('span', { class: 'n' }, i + 1), l))))),
    h('main', { class: 'wiz-main' }, body,
      h('div', { class: 'row between wiz-nav' },
        h('button', { class: 'btn', type: 'button', disabled: wiz.step === 0, onclick: () => { wiz.step--; notify(); } }, '← Voltar'),
        wiz.step < STEPS.length - 1 ? h('button', { class: 'btn primary', type: 'button', disabled: !canAdvance(), onclick: () => { wiz.step++; notify(); window.scrollTo(0, 0); } }, 'Avançar →') : null)),
    contextPanel()));
}
export { errataSeals };
