// main.js - inicializacao, roteador por hash, navegacao responsiva, busca global, atalhos e tema.
import { h, clear, $ } from './util.js';
import { initState, activeChar, subscribe, notify, prefs, setPref } from './state.js';
import { loadBundle, D } from './data.js';
import { initSidePane, closeSide, sidePaneAvailable } from './layout.js';
import { referenceView, searchBox } from './views/reference.js';
import { mesaView, goNextRound, setActions, triggerRoll, applyWake } from './views/mesa.js';
import { sheetView } from './views/sheet.js';
import { creationView } from './views/creation.js';
import { charactersView, glossaryView, moreView } from './views/characters.js';
import { renderPrint } from './views/print.js';

const NAV = [
  ['mesa', 'Mesa', '#/mesa', '▣'], ['ficha', 'Ficha', '#/ficha', '☰'], ['rolar', 'Rolar', '#/rolar', '⚄'],
  ['regras', 'Regras', '#/regras', '☖'], ['mais', 'Mais', '#/mais', '⋯'],
];
const NAV_WIDE = [...NAV.slice(0, 4), ['personagens', 'Personagens', '#/personagens', '☷'], ['criar', 'Criar', '#/criar', '✚'], ['glossario', 'Glossário', '#/glossario', '≡'], ['mais', 'Ajustes', '#/mais', '⚙']];
const SPLIT_ROUTES = new Set(['mesa', 'ficha', 'rolar']);

let viewEl, navSide, navBottom, navTop;

// ------------------------------------------------------------------ tema
function applyTheme() {
  const t = prefs().theme;
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
}
const effectiveTheme = () => prefs().theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
function toggleTheme() { setPref('theme', effectiveTheme() === 'dark' ? 'light' : 'dark'); applyTheme(); notify(); }
const themeLabel = () => (effectiveTheme() === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro');

// ------------------------------------------------------------------ roteador
function parseHash() {
  const parts = (location.hash.replace(/^#\/?/, '') || 'mesa').split('/').filter(Boolean).map(decodeURIComponent);
  return { route: parts[0] || 'mesa', rest: parts.slice(1) };
}

function renderNav(route) {
  const make = (items, cls) => items.map(([id, label, href, icon]) =>
    h('a', { class: `${cls}${(route === id || (id === 'mais' && ['glossario', 'personagens', 'criar'].includes(route) && cls === 'nb')) ? ' on' : ''}`, href, 'aria-current': route === id ? 'page' : null },
      h('span', { class: 'ic', 'aria-hidden': 'true' }, icon), h('span', { class: 'lb' }, label)));
  clear(navSide).append(h('div', { class: 'brand' }, 'r2-d6'), ...make(NAV_WIDE, 'ns'),
    h('button', { class: 'ns search', type: 'button', onclick: openSearch }, h('span', { class: 'ic' }, '⌕'), h('span', { class: 'lb' }, 'Buscar (/)')));
  clear(navTop).append(h('div', { class: 'brand' }, 'r2-d6'), ...make(NAV_WIDE.filter(([id]) => id !== 'glossario'), 'nt'),
    h('button', { class: 'nt search', type: 'button', onclick: openSearch, 'aria-label': 'Buscar' }, '⌕'));
  clear(navBottom).append(...make(NAV, 'nb'));
}

function render() {
  const { route, rest } = parseHash();
  const scroll = window.scrollY;
  renderNav(route);
  document.body.dataset.route = route;
  document.body.classList.toggle('no-side', !SPLIT_ROUTES.has(route));
  if (!SPLIT_ROUTES.has(route)) closeSide();
  clear(viewEl);
  try {
    if (route === 'mesa') mesaView(viewEl, 'mesa');
    else if (route === 'rolar') mesaView(viewEl, 'rolar');
    else if (route === 'ficha') sheetView(viewEl);
    else if (route === 'criar') creationView(viewEl);
    else if (route === 'regras') referenceView(viewEl, rest);
    else if (route === 'personagens') charactersView(viewEl);
    else if (route === 'glossario') glossaryView(viewEl);
    else if (route === 'mais') moreView(viewEl, { toggleTheme, themeLabel });
    else { location.hash = '#/mesa'; return; }
  } catch (e) {
    console.error(e);
    viewEl.append(h('div', { class: 'errbox', role: 'alert' }, h('strong', null, 'Erro ao desenhar a tela: '), String(e.message || e)));
  }
  document.title = `r2-d6 · ${(NAV_WIDE.find((n) => n[0] === route) || [, 'Consulta'])[1]}`;
  if (history.scrollRestoration) window.scrollTo(0, window.__keepScroll ? scroll : 0);
  window.__keepScroll = false;
}

// ------------------------------------------------------------------ busca global (dialog)
function openSearch() {
  let dlg = $('#search-dlg');
  if (dlg) { dlg.close(); return; }
  const sb = searchBox({ autofocus: true, onNavigate: () => dlg.close() });
  dlg = h('dialog', { id: 'search-dlg', class: 'dlg search-dlg', 'aria-label': 'Busca global' },
    h('div', { class: 'row between' }, h('strong', null, 'Buscar'), h('button', { class: 'btn', type: 'button', onclick: () => dlg.close(), 'aria-label': 'Fechar busca' }, '✕')),
    sb.el);
  dlg.addEventListener('close', () => dlg.remove());
  dlg.addEventListener('keydown', (e) => { if (e.key === 'Escape') dlg.close(); });
  document.body.append(dlg);
  dlg.showModal();
  sb.input.focus();
}

function help() {
  location.hash = '#/mais';
}

function onKey(e) {
  const t = e.target;
  const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); return; }
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === '/') { e.preventDefault(); openSearch(); }
  else if (e.key === '?') help();
  else if (e.key === 'r' || e.key === 'R') triggerRoll();
  else if (e.key === 'n' || e.key === 'N') { if (activeChar()) goNextRound(); }
  else if (/^[1-9]$/.test(e.key)) { if (activeChar() && ['mesa', 'rolar'].includes(parseHash().route)) setActions(Number(e.key)); }
}

// ------------------------------------------------------------------ boot
async function boot() {
  initState();
  applyTheme();
  viewEl = $('#view'); navSide = $('#nav-side'); navBottom = $('#nav-bottom'); navTop = $('#nav-top');
  initSidePane($('#side'));
  try {
    await loadBundle();
  } catch (e) {
    viewEl.append(h('div', { class: 'errbox' }, h('h2', null, 'Dados não carregados'), h('p', null, `${e.message}. Gere o bundle com: python tools/build_app_data.py`)));
    return;
  }
  subscribe(() => { window.__keepScroll = true; render(); });
  window.addEventListener('hashchange', () => { window.__keepScroll = false; render(); });
  window.addEventListener('keydown', onKey);
  window.addEventListener('beforeprint', () => renderPrint(activeChar()));
  window.addEventListener('resize', () => { if (!sidePaneAvailable()) closeSide(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && prefs().wake) applyWake(true); });
  if (!location.hash) location.hash = activeChar() ? '#/mesa' : '#/personagens';
  render();
  if (prefs().wake) applyWake(true);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').then((reg) => reg.update()).catch((e) => console.warn('Service worker não registrado:', e));
  }
}
boot();
export { D };
