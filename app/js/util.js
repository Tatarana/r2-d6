// util.js - helpers de DOM e interface (sem dependencias).

/** Cria elemento. props: class, html (confiavel), onclick..., dataset, demais viram propriedade/atributo. */
export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  let value;
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'value') value = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k in el && k !== 'list' && k !== 'form' && k !== 'style') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  (function add(list) {
    for (const k of list) {
      if (k == null || k === false) continue;
      if (Array.isArray(k)) add(k);
      else el.append(k instanceof Node ? k : document.createTextNode(String(k)));
    }
  })(kids);
  if (value !== undefined) el.value = value;
  return el;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

let toastTimer;
export function toast(msg, kind = '') {
  let t = document.getElementById('toast');
  if (!t) { t = h('div', { id: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.append(t); }
  t.className = `toast show ${kind}`;
  t.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 3500);
}

/** Confirmacao modal acessivel. Retorna Promise<boolean>. */
export function confirmDialog(message, okLabel = 'Confirmar') {
  return new Promise((resolve) => {
    const dlg = h('dialog', { class: 'dlg' },
      h('p', null, message),
      h('div', { class: 'row end' },
        h('button', { class: 'btn', onclick: () => dlg.close('no') }, 'Cancelar'),
        h('button', { class: 'btn danger', onclick: () => dlg.close('yes') }, okLabel)));
    dlg.addEventListener('close', () => { resolve(dlg.returnValue === 'yes'); dlg.remove(); });
    document.body.append(dlg);
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  });
}

export function download(filename, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = h('a', { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const slugify = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** +/- numerico com alvo grande. */
export function stepper(value, onChange, { min = 0, max = Infinity, label = '', fmt = String } = {}) {
  return h('div', { class: 'stepper', role: 'group', 'aria-label': label },
    h('button', { class: 'btn icon', type: 'button', 'aria-label': `Diminuir ${label}`, disabled: value <= min, onclick: () => onChange(value - 1) }, '−'),
    h('output', { class: 'val', 'aria-live': 'polite' }, fmt(value)),
    h('button', { class: 'btn icon', type: 'button', 'aria-label': `Aumentar ${label}`, disabled: value >= max, onclick: () => onChange(value + 1) }, '+'));
}

export function tabs(items, active, onSelect) {
  return h('div', { class: 'tabs', role: 'tablist' }, items.map(([id, label]) =>
    h('button', { class: `tab${id === active ? ' on' : ''}`, role: 'tab', 'aria-selected': id === active, type: 'button', onclick: () => onSelect(id) }, label)));
}
