// data.js - acesso ao bundle (gerado por tools/build_app_data.py) e busca global.
import { parse } from './dice.js';

export const D = { bundle: null, maps: {}, errataById: new Map(), docs: null };

export async function loadBundle() {
  const res = await fetch('data/bundle.json');
  if (!res.ok) throw new Error(`bundle.json: HTTP ${res.status}`);
  setBundle(await res.json());
  return D.bundle;
}

export function setBundle(b) {
  D.bundle = b;
  const e = b.entities;
  const byId = (list) => new Map(list.map((x) => [x.id, x]));
  D.maps = {
    skills: byId(e.skills), powers: byId(e.force_powers), species: byId(e.species),
    weapons: byId(e.weapons), armor: byId(e.armor), gear: byId(e.gear),
    vehicles: byId(e.vehicles), starships: byId(e.starships), templates: byId(e.templates),
  };
  D.errataById = new Map(b.errata.map((x) => [x.id, x]));
  D.docs = null;
}

export const CATEGORIES = [
  ['rules', 'Regras'], ['skills', 'Perícias'], ['powers', 'Poderes'], ['species', 'Espécies'],
  ['weapons', 'Armas'], ['armor', 'Armaduras'], ['gear', 'Equipamentos'], ['vehicles', 'Veículos'],
  ['starships', 'Naves'], ['templates', 'Templates'], ['tables', 'Tabelas'], ['errata', 'Errata'],
];

/** Lista de itens de uma categoria de entidades. */
export function listOf(cat) {
  const e = D.bundle.entities;
  return { skills: e.skills, powers: e.force_powers, species: e.species, weapons: e.weapons, armor: e.armor,
    gear: e.gear, vehicles: e.vehicles, starships: e.starships, templates: e.templates }[cat] || [];
}
export const getEntity = (cat, id) => (D.maps[cat] ? D.maps[cat].get(id) : null);
export const skillName = (id) => (D.maps.skills.get(id) || {}).name || id;

/** E-0xx citados por uma secao/entidade, com status. */
export function errataFor(ids) {
  return (ids || []).map((id) => D.errataById.get(id)).filter(Boolean);
}
export function entityErrata(cat, id) {
  const key = `${cat === 'powers' ? 'force_powers' : cat}:${id}`;
  return errataFor(D.bundle.derived.entity_errata[key]);
}

export const pageText = (pages) => {
  if (!pages || !pages.length) return '';
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  if (sorted.length === 1) return `p.${sorted[0]}`;
  return sorted.length <= 4 ? `p.${sorted.join(', ')}` : `p.${sorted[0]}-${sorted[sorted.length - 1]}`;
};

export const ruleFiles = () => D.bundle.rules;
export function findSection(file, anchor) {
  const f = D.bundle.rules.find((r) => r.id === file);
  if (!f) return null;
  const s = f.sections.find((x) => x.anchor === anchor);
  return s ? { file: f, section: s } : null;
}

// ------------------------------------------------------------------ busca
const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function buildDocs() {
  const b = D.bundle, e = b.entities, docs = [];
  for (const f of b.rules) for (const s of f.sections) {
    docs.push({ group: 'rules', title: s.title, sub: f.title, page: pageText(s.pages), href: `#/regras/rules/${f.id}/${s.anchor}`, text: fold(s.text), ftitle: fold(s.title) });
  }
  for (const s of e.skills) docs.push({ group: 'skills', title: s.name + (s.advanced ? ' (A)' : ''), sub: s.attribute, page: s.page ? `p.${s.page}` : '', href: `#/regras/skills/${s.id}`, text: fold(`${s.summary} ${s.specializations}`), ftitle: fold(s.name) });
  for (const p of e.force_powers) docs.push({ group: 'powers', title: p.name, sub: p.skills.join(', '), page: p.page ? `p.${p.page}` : '', href: `#/regras/powers/${p.id}`, text: fold(p.effect_summary), ftitle: fold(p.name) });
  for (const s of e.species) docs.push({ group: 'species', title: s.name, sub: '', page: s.page ? `p.${s.page}` : '', href: `#/regras/species/${s.id}`, text: fold(`${s.homeworlds} ${s.languages}`), ftitle: fold(s.name) });
  for (const [g, list] of [['weapons', e.weapons], ['armor', e.armor], ['gear', e.gear]]) {
    for (const it of list) docs.push({ group: 'items', title: it.name, sub: g, page: it.page ? `p.${it.page}` : '', href: `#/regras/${g}/${it.id}`, text: fold(`${it.type || ''} ${it.game_notes || ''}`), ftitle: fold(it.name) });
  }
  for (const v of e.vehicles) docs.push({ group: 'craft', title: v.name, sub: 'veículo', page: v.page ? `p.${v.page}` : '', href: `#/regras/vehicles/${v.id}`, text: fold(`${v.entry} ${v.craft} ${v.type}`), ftitle: fold(`${v.name} ${v.entry}`) });
  for (const v of e.starships) docs.push({ group: 'craft', title: v.name, sub: 'nave', page: v.page ? `p.${v.page}` : '', href: `#/regras/starships/${v.id}`, text: fold(`${v.entry} ${v.craft} ${v.type}`), ftitle: fold(`${v.name} ${v.entry}`) });
  for (const t of e.templates) docs.push({ group: 'templates', title: t.type, sub: 'template', page: t.page ? `p.${t.page}` : '', href: `#/regras/templates/${t.id}`, text: fold(`${t.special_abilities} ${t.equipment}`), ftitle: fold(t.type) });
  for (const [id, t] of Object.entries(b.tables)) docs.push({ group: 'tables', title: tableTitle(id), sub: 'tabela', page: '', href: `#/regras/tables/${id}`, text: fold(JSON.stringify(t).slice(0, 6000)), ftitle: fold(tableTitle(id)) });
  for (const g of b.glossary) docs.push({ group: 'glossary', title: g.term, sub: '', page: '', href: `#/glossario`, text: fold(g.meaning), ftitle: fold(g.term), extra: g.meaning });
  for (const x of b.errata) docs.push({ group: 'errata', title: x.id, sub: x.status, page: '', href: `#/regras/errata/${x.id}`, text: fold(`${x.problem} ${x.provisional}`), ftitle: fold(x.id) });
  return docs;
}

export const tableTitle = (id) => id.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

export const GROUPS = [['rules', 'Regras'], ['skills', 'Perícias'], ['powers', 'Poderes'], ['species', 'Espécies'], ['items', 'Itens'],
  ['craft', 'Veículos e naves'], ['templates', 'Templates'], ['tables', 'Tabelas'], ['glossary', 'Glossário'], ['errata', 'Errata']];

/** Busca global. Retorna [{group,label,results:[doc]}] (maximo `per` por grupo). */
export function search(query, per = 8) {
  if (!D.docs) D.docs = buildDocs();
  const q = fold(query).trim();
  if (!q) return [];
  const toks = q.split(/\s+/);
  const scored = [];
  for (const d of D.docs) {
    let score = 0;
    if (d.ftitle === q) score += 100;
    else if (d.ftitle.startsWith(q)) score += 60;
    else if (d.ftitle.includes(q)) score += 45;
    else if (toks.every((t) => d.ftitle.includes(t))) score += 30;
    if (d.text.includes(q)) score += 12;
    else if (toks.every((t) => d.text.includes(t))) score += 6;
    if (score) scored.push({ ...d, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const groups = GROUPS.map(([group, label]) => ({ group, label, results: scored.filter((d) => d.group === group).slice(0, per) })).filter((g) => g.results.length);
  // entidade com titulo igual/comecando pela busca (ex.: "AT-AT") sobe para o topo; regras e glossario mantem a ordem
  const strong = (g) => !['rules', 'glossary', 'errata', 'tables'].includes(g.group) && g.results[0].score >= 60;
  return [...groups.filter(strong), ...groups.filter((g) => !strong(g))];
}

// ------------------------------------------------------------------ calculos do catalogo
export const speciesBlock = (speciesId, idx = 0) => {
  const s = D.maps.species.get(speciesId);
  return s ? s.stat_blocks[idx] || s.stat_blocks[0] : null;
};
export function moveStart(speciesId) {
  const b = D.bundle.derived.species_move_start[speciesId];
  return b && b[0] ? b[0].move_start : null;
}
export const dieOf = (c) => parse(c);
