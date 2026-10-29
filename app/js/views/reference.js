// views/reference.js - consulta: regras, entidades, tabelas, errata.
import { h, clear } from '../util.js';
import { renderMarkdown } from '../markdown.js';
import { D, CATEGORIES, listOf, getEntity, entityErrata, errataFor, findSection, pageText, search, GROUPS, tableTitle, moveStart } from '../data.js';
import { pageCite, errataSeals } from '../seals.js';
import { format, parse } from '../dice.js';

const label = (k) => k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
const catLabel = (cat) => (CATEGORIES.find((c) => c[0] === cat) || [, cat])[1];
const isDie = (v) => v && typeof v === 'object' && 'dice' in v && 'pips' in v;

// ------------------------------------------------------------------ renderizacao generica de dados
function valueNode(v, depth = 0) {
  if (v == null || v === '') return h('span', { class: 'muted' }, '—');
  if (isDie(v)) return h('span', null, v.text || format(v));
  if (typeof v === 'boolean') return h('span', null, v ? 'sim' : 'não');
  if (typeof v !== 'object') return h('span', null, String(v));
  if (Array.isArray(v)) {
    if (!v.length) return h('span', { class: 'muted' }, '—');
    if (v.every((x) => typeof x !== 'object' || x === null)) {
      if (v.every((x) => String(x).length < 14) && depth > 0) return h('span', null, v.join(' | '));
      return h('ul', null, v.map((x) => h('li', null, String(x))));
    }
    if (v.every((x) => Array.isArray(x))) return table(null, v.map((r) => r.map((c) => valueNode(c, depth + 1))));
    if (v.every((x) => x && typeof x === 'object' && !Array.isArray(x))) {
      const keys = [...new Set(v.flatMap((x) => Object.keys(x)))];
      return table(keys.map(label), v.map((x) => keys.map((k) => valueNode(x[k], depth + 1))));
    }
    return h('ul', null, v.map((x) => h('li', null, valueNode(x, depth + 1))));
  }
  return kvList(v, depth + 1);
}

function table(head, rows) {
  return h('div', { class: 'tbl-wrap' }, h('table', null,
    head ? h('thead', null, h('tr', null, head.map((c) => h('th', null, c)))) : null,
    h('tbody', null, rows.map((r) => h('tr', null, r.map((c) => h('td', null, c)))))));
}

function kvList(obj, depth = 0, skip = []) {
  const keys = Object.keys(obj).filter((k) => !skip.includes(k));
  return h('dl', { class: `kv d${depth}` }, keys.map((k) => [h('dt', null, label(k)), h('dd', null, valueNode(obj[k], depth))]));
}

const PROSE = ['summary', 'effect_summary', 'game_notes', 'note', 'notes'];

function entityBody(cat, e) {
  const prose = PROSE.filter((k) => typeof e[k] === 'string' && e[k]).map((k) => h('p', { class: 'prose' }, e[k]));
  const skip = ['id', 'name', 'page', 'source', 'stat_blocks', ...PROSE];
  if (cat === 'templates') skip.push('type', 'a_quote');
  const parts = [prose, kvList(e, 0, skip)];
  if (cat === 'species') {
    const ms = D.bundle.derived.species_move_start[e.id] || [];
    parts.push(h('h3', null, 'Stat blocks'));
    e.stat_blocks.forEach((b, i) => {
      const m = ms[i];
      parts.push(h('section', { class: 'card' }, h('h4', null, b.stat_block, ' ', pageCite(b.page ? `p.${b.page}` : '')),
        m ? h('p', { class: 'muted' }, `Move inicial: ${m.move_start} (RD-42, primeiro número de “${m.move_text}”)`) : null,
        kvList(b, 0, ['stat_block', 'page'])));
    });
  }
  if (cat === 'skills') {
    const pre = D.bundle.derived.advanced_prereqs[e.id];
    if (pre) parts.push(h('p', null, h('strong', null, 'Pré-requisito (RD-31): '),
      pre.manual ? `composto, o mestre confirma — ${pre.text}` : pre.requirements.map((r) => `${r.dice}D em ${getEntity('skills', r.skill_id).name}`).join(', ')));
  }
  return parts;
}

export function entityDetail(cat, id) {
  const e = getEntity(cat, id);
  if (!e) return h('p', { class: 'muted' }, `Item não encontrado: ${cat}/${id}`);
  const title = e.name || e.type || e.id;
  return h('article', { class: 'ref-article' },
    h('h2', null, title, ' ', e.advanced ? h('small', null, '(A)') : null, ' ', pageCite(e.page ? `p.${e.page}` : '')),
    errataSeals((entityErrata(cat, id) || []).map((x) => x.id)),
    entityBody(cat, e));
}

// ------------------------------------------------------------------ regras
export function ruleSectionNode(file, anchor) {
  const hit = findSection(file, anchor);
  if (!hit) return h('p', { class: 'muted' }, `Seção não encontrada: ${file}#${anchor}`);
  const { file: f, section: s } = hit;
  const i = f.sections.indexOf(s);
  const prev = f.sections[i - 1], next = f.sections[i + 1];
  return h('article', { class: 'ref-article' },
    h('p', { class: 'crumb' }, h('a', { href: '#/regras/rules' }, 'Regras'), ' / ', h('a', { href: `#/regras/rules/${f.id}` }, f.title)),
    h('h2', null, s.title, ' ', pageCite(pageText(s.pages))),
    errataSeals(s.errata),
    h('div', { class: 'md', html: renderMarkdown(s.text, { file: f.id }) }),
    h('nav', { class: 'row between pager' },
      prev ? h('a', { class: 'btn', href: `#/regras/rules/${f.id}/${prev.anchor}` }, `← ${prev.title}`) : h('span'),
      next ? h('a', { class: 'btn', href: `#/regras/rules/${f.id}/${next.anchor}` }, `${next.title} →`) : h('span')));
}

function ruleFileNode(fileId) {
  const f = D.bundle.rules.find((x) => x.id === fileId);
  if (!f) return h('p', { class: 'muted' }, 'Arquivo de regras não encontrado.');
  return h('article', { class: 'ref-article' },
    h('p', { class: 'crumb' }, h('a', { href: '#/regras/rules' }, 'Regras')),
    h('h2', null, f.title),
    h('ul', { class: 'toc' }, f.sections.map((s) =>
      h('li', { class: `l${s.level}` }, h('a', { href: `#/regras/rules/${f.id}/${s.anchor}` }, s.title), ' ', pageCite(pageText(s.pages))))));
}

function rulesIndexNode() {
  return h('article', { class: 'ref-article' }, h('h2', null, 'Regras'),
    h('div', { class: 'cards' }, D.bundle.rules.map((f) =>
      h('a', { class: 'card link', href: `#/regras/rules/${f.id}` }, h('strong', null, f.title), h('span', { class: 'muted' }, `${f.sections.length} seções`)))));
}

// ------------------------------------------------------------------ listas
const COLS = {
  skills: [['name', 'Nome'], ['attribute', 'Atributo'], ['page', 'Pág.']],
  powers: [['name', 'Nome'], [(e) => e.skills.join(', '), 'Perícias'], ['page', 'Pág.']],
  species: [['name', 'Nome'], [(e) => (e.stat_blocks[0] || {}).attribute_dice, 'Atributos'], [(e) => moveStart(e.id), 'Move'], ['page', 'Pág.']],
  weapons: [['name', 'Nome'], ['skill', 'Perícia'], ['damage', 'Dano'], ['range', 'Alcance'], ['cost', 'Custo'], ['page', 'Pág.']],
  armor: [['name', 'Nome'], [(e) => e.protection && `${e.protection.physical || '-'} fís. / ${e.protection.energy || '-'} en.`, 'Proteção'], ['cost', 'Custo'], ['page', 'Pág.']],
  gear: [['name', 'Nome'], ['category', 'Categoria'], ['cost', 'Custo'], ['page', 'Pág.']],
  vehicles: [['name', 'Nome'], ['scale', 'Escala'], ['move', 'Move'], ['body_strength', 'Body'], ['cost', 'Custo'], ['page', 'Pág.']],
  starships: [['name', 'Nome'], ['scale', 'Escala'], ['space', 'Space'], ['hull', 'Hull'], ['cost', 'Custo'], ['page', 'Pág.']],
  templates: [['type', 'Template'], ['attribute_total', 'Atributos'], ['move', 'Move'], ['page', 'Pág.']],
};

function cell(col, e) {
  const v = typeof col === 'function' ? col(e) : e[col];
  if (v && typeof v === 'object') return v.text || '';
  return v == null ? '' : v;
}

function listNode(cat) {
  const items = listOf(cat);
  const cols = COLS[cat];
  let sortCol = 0, dir = 1, filter = '';
  const wrap = h('div');
  const input = h('input', { type: 'search', placeholder: `Filtrar ${catLabel(cat).toLowerCase()}…`, 'aria-label': 'Filtrar', oninput: (ev) => { filter = ev.target.value.toLowerCase(); draw(); } });
  function draw() {
    let rows = items.filter((e) => !filter || JSON.stringify(e).toLowerCase().includes(filter));
    rows = [...rows].sort((a, b) => {
      const x = cell(cols[sortCol][0], a), y = cell(cols[sortCol][0], b);
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt', { numeric: true })) * dir;
    });
    clear(wrap).append(h('div', { class: 'tbl-wrap' }, h('table', { class: 'sortable' },
      h('thead', null, h('tr', null, cols.map(([, lab], i) =>
        h('th', { 'aria-sort': i === sortCol ? (dir > 0 ? 'ascending' : 'descending') : 'none' },
          h('button', { class: 'thbtn', type: 'button', onclick: () => { if (sortCol === i) dir = -dir; else { sortCol = i; dir = 1; } draw(); } }, lab, i === sortCol ? (dir > 0 ? ' ▲' : ' ▼') : ''))))),
      h('tbody', null, rows.map((e) => h('tr', null, cols.map(([c], i) =>
        h('td', null, i === 0 ? h('a', { href: `#/regras/${cat}/${e.id}` }, String(cell(c, e))) : String(cell(c, e))))))))),
      h('p', { class: 'muted' }, `${rows.length} de ${items.length}`));
  }
  draw();
  return h('article', { class: 'ref-article' }, h('h2', null, catLabel(cat)), input, wrap);
}

function tablesIndex() {
  return h('article', { class: 'ref-article' }, h('h2', null, 'Tabelas'),
    h('ul', { class: 'toc' }, Object.keys(D.bundle.tables).map((id) => h('li', null, h('a', { href: `#/regras/tables/${id}` }, tableTitle(id))))));
}
function tableDetail(id) {
  const t = D.bundle.tables[id];
  if (!t) return h('p', { class: 'muted' }, 'Tabela não encontrada.');
  const pages = t.source && t.source.pages ? pageText(t.source.pages) : t.source && t.source.page ? `p.${t.source.page}` : '';
  return h('article', { class: 'ref-article' }, h('p', { class: 'crumb' }, h('a', { href: '#/regras/tables' }, 'Tabelas')),
    h('h2', null, tableTitle(id), ' ', pageCite(pages)), kvList(t, 0, ['id', 'source']));
}

function errataIndex() {
  const rows = D.bundle.errata;
  return h('article', { class: 'ref-article' }, h('h2', null, 'Errata e leituras provisórias'),
    h('p', { class: 'muted' }, '“open” = leitura provisória aguardando decisão humana; “accepted” = confirmada; “info” = sem efeito.'),
    table(['ID', 'Tipo', 'Onde', 'Status'], rows.map((e) => [h('a', { href: `#/regras/errata/${e.id}` }, e.id), e.kind, e.where, h('span', { class: `status ${e.status}` }, e.status)])));
}
function errataDetail(id) {
  const e = D.errataById.get(id);
  if (!e) return h('p', { class: 'muted' }, 'Item do errata não encontrado.');
  return h('article', { class: 'ref-article' }, h('p', { class: 'crumb' }, h('a', { href: '#/regras/errata' }, 'Errata')),
    h('h2', null, e.id, ' ', h('span', { class: `status ${e.status}` }, e.status)),
    kvList(e, 0, ['id']));
}

function homeNode() {
  return h('article', { class: 'ref-article' }, h('h2', null, 'Consulta'),
    h('p', { class: 'muted' }, 'Toda regra traz a página impressa do livro. Atalho de busca: / ou Ctrl+K.'),
    h('div', { class: 'cards' }, CATEGORIES.map(([id, lab]) =>
      h('a', { class: 'card link', href: `#/regras/${id}` }, h('strong', null, lab),
        h('span', { class: 'muted' }, id === 'rules' ? `${D.bundle.rules.length} arquivos` : id === 'tables' ? `${Object.keys(D.bundle.tables).length} tabelas` : id === 'errata' ? `${D.bundle.errata.length} registros` : `${listOf(id).length} itens`)))));
}

/** Conteudo de consulta para `parts` = segmentos depois de #/regras. */
export function refContent(parts) {
  const [cat, a, b] = parts;
  if (!cat) return homeNode();
  if (cat === 'rules') return !a ? rulesIndexNode() : !b ? ruleFileNode(a) : ruleSectionNode(a, b);
  if (cat === 'tables') return a ? tableDetail(a) : tablesIndex();
  if (cat === 'errata') return a ? errataDetail(a) : errataIndex();
  if (COLS[cat]) return a ? entityDetail(cat, a) : listNode(cat);
  return homeNode();
}

// ------------------------------------------------------------------ busca (campo + resultados)
export function searchBox({ autofocus = false, onNavigate } = {}) {
  const out = h('div', { class: 'results', 'aria-live': 'polite' });
  const input = h('input', { type: 'search', class: 'big', placeholder: 'Buscar regras, perícias, itens, glossário…', 'aria-label': 'Busca global', autofocus,
    oninput: () => draw(), onkeydown: (ev) => {
      const links = [...out.querySelectorAll('a.hit')];
      const cur = links.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown') { ev.preventDefault(); (links[cur + 1] || links[0])?.focus(); }
      if (ev.key === 'ArrowUp') { ev.preventDefault(); (links[cur - 1] || links[links.length - 1])?.focus(); }
      if (ev.key === 'Enter' && links[0]) { links[0].click(); }
    } });
  out.addEventListener('keydown', (ev) => {
    const links = [...out.querySelectorAll('a.hit')];
    const cur = links.indexOf(document.activeElement);
    if (ev.key === 'ArrowDown') { ev.preventDefault(); (links[cur + 1] || links[0]).focus(); }
    if (ev.key === 'ArrowUp') { ev.preventDefault(); if (cur <= 0) input.focus(); else links[cur - 1].focus(); }
  });
  function draw() {
    clear(out);
    const groups = search(input.value);
    if (!input.value.trim()) return;
    if (!groups.length) { out.append(h('p', { class: 'muted' }, 'Nada encontrado.')); return; }
    for (const g of groups) {
      out.append(h('h3', { class: 'grp' }, g.label), h('ul', { class: 'hits' }, g.results.map((r) =>
        h('li', null, h('a', { class: 'hit', href: r.href, onclick: () => onNavigate && onNavigate() },
          h('strong', null, r.title), ' ', r.sub ? h('span', { class: 'muted' }, r.sub) : null, ' ', pageCite(r.page),
          r.extra ? h('span', { class: 'snippet' }, r.extra) : null)))));
    }
  }
  return { el: h('div', { class: 'searchbox' }, input, out), input, draw };
}

export function referenceView(root, parts) {
  const sb = searchBox();
  root.append(h('div', { class: 'view ref' },
    sb.el,
    h('p', { class: 'crumb' }, h('a', { href: '#/regras' }, 'Consulta'), parts.length ? ` / ${catLabel(parts[0])}` : ''),
    refContent(parts)));
}
