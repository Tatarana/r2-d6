// layout.js - painel lateral de consulta (split ficha + regras) e utilitarios de layout.
import { h, clear } from './util.js';
import { refContent } from './views/reference.js';

let side = null;
const mqSplit = () => window.matchMedia('(min-width: 700px) and (orientation: landscape)').matches;
export const isWide = () => window.matchMedia('(min-width: 1100px)').matches;
export const isPhone = () => window.matchMedia('(max-width: 699px)').matches;

export function initSidePane(el) {
  side = el;
  side.addEventListener('click', (ev) => {
    const a = ev.target.closest('a[href^="#/regras"]');
    if (!a) return;
    ev.preventDefault();
    showInSide(a.getAttribute('href'));
  });
}

function showInSide(href) {
  const parts = href.replace(/^#\/regras\/?/, '').split('/').filter(Boolean);
  clear(side).append(
    h('div', { class: 'side-head row between' },
      h('strong', null, 'Consulta'),
      h('span', null,
        h('a', { class: 'btn', href, onclick: (e) => { e.preventDefault(); location.hash = href; } }, 'Abrir inteira'),
        h('button', { class: 'btn', type: 'button', 'aria-label': 'Fechar painel', onclick: closeSide }, '✕'))),
    h('div', { class: 'side-body' }, refContent(parts)));
  document.body.classList.add('side-open');
}

export function closeSide() { if (side) clear(side); document.body.classList.remove('side-open'); }

/** Abre uma consulta: no painel lateral (tablet paisagem/PC) ou navegando (celular/retrato). */
export function openRef(cat, id) {
  const href = `#/regras/${cat}${id ? '/' + id : ''}`;
  if (side && mqSplit() && !document.body.classList.contains('no-side')) showInSide(href);
  else location.hash = href;
}
export const sidePaneAvailable = () => mqSplit();
