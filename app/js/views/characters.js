// views/characters.js - lista de personagens, importar/exportar/duplicar/apagar, glossario e "Mais".
import { h, download, confirmDialog, toast, slugify } from '../util.js';
import { exportJSON } from '../store.js';
import { app, notify, prefs, setPref } from '../state.js';
import { D } from '../data.js';
import { pageCite } from '../seals.js';
import { resetWizard } from './creation.js';

function importText(text) {
  const r = app.store.importText(text);
  if (!r.ok) {
    toast('Importação recusada.', 'err');
    return h('div', { class: 'errbox', role: 'alert' }, h('strong', null, 'Não foi possível importar:'), h('ul', null, r.errors.map((e) => h('li', null, e))));
  }
  app.store.setActive(r.char.x_app.id);
  toast(`“${r.char.name}” importado.`);
  notify();
  return null;
}

export function charactersView(root) {
  const list = app.store.list();
  const activeId = app.store.getActiveId();
  const msg = h('div', { 'aria-live': 'polite' });
  const show = (node) => { msg.replaceChildren(...(node ? [node] : [])); };
  const fileIn = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: async (e) => {
    const f = e.target.files[0]; if (!f) return;
    show(importText(await f.text())); e.target.value = '';
  } });
  const drop = h('div', { class: 'drop', tabindex: 0, role: 'button', 'aria-label': 'Importar ficha JSON: clique ou arraste o arquivo',
    onclick: () => fileIn.click(), onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') fileIn.click(); },
    ondragover: (e) => { e.preventDefault(); drop.classList.add('over'); }, ondragleave: () => drop.classList.remove('over'),
    ondrop: async (e) => { e.preventDefault(); drop.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) show(importText(await f.text())); } },
  'Arraste um arquivo .json aqui ou toque para escolher');
  const paste = h('textarea', { rows: 3, placeholder: 'ou cole o JSON da ficha aqui', 'aria-label': 'JSON da ficha' });
  root.append(h('div', { class: 'view chars' },
    h('div', { class: 'row between wrapr' }, h('h2', null, 'Personagens'), h('a', { class: 'btn primary', href: '#/criar', onclick: () => resetWizard() }, 'Novo (assistente)')),
    app.persistent ? null : h('p', { class: 'warnbox' }, 'Armazenamento local indisponível (modo privado?): os personagens somem ao fechar a página. Exporte o JSON.'),
    list.length ? h('div', { class: 'cards' }, list.map((c) => {
      const id = c.x_app.id;
      return h('section', { class: `card char${id === activeId ? ' active' : ''}` },
        h('h3', null, c.name, id === activeId ? h('span', { class: 'seal' }, 'ativo') : null),
        h('p', { class: 'muted' }, `${c.type || '—'} · CP ${c.character_points} · FP ${c.force_points} · ${c.wound_status}`),
        h('div', { class: 'row wrapr' },
          h('button', { class: 'btn', type: 'button', onclick: () => { app.store.setActive(id); notify(); } }, 'Usar'),
          h('a', { class: 'btn', href: '#/ficha', onclick: () => app.store.setActive(id) }, 'Ficha'),
          h('a', { class: 'btn', href: '#/mesa', onclick: () => app.store.setActive(id) }, 'Mesa'),
          h('button', { class: 'btn', type: 'button', onclick: () => { app.store.duplicate(id); notify(); toast('Duplicado.'); } }, 'Duplicar'),
          h('button', { class: 'btn', type: 'button', onclick: () => download(`${slugify(c.name) || 'ficha'}.json`, exportJSON(c)) }, 'Exportar'),
          h('button', { class: 'btn danger', type: 'button', onclick: async () => { if (await confirmDialog(`Apagar “${c.name}”? Não dá para desfazer.`, 'Apagar')) { app.store.remove(id); notify(); } } }, 'Apagar')));
    })) : h('div', { class: 'empty' }, h('p', null, 'Nenhum personagem salvo neste aparelho.')),
    h('section', { class: 'card' }, h('h3', null, 'Importar ficha'), fileIn, drop, paste,
      h('button', { class: 'btn', type: 'button', onclick: () => { if (paste.value.trim()) { show(importText(paste.value)); paste.value = ''; } } }, 'Importar texto'), msg)));
}

// ------------------------------------------------------------------ glossario
export function glossaryView(root) {
  root.append(h('div', { class: 'view' }, h('h2', null, 'Glossário'),
    h('p', { class: 'muted' }, 'Termos oficiais ficam em inglês. “Onde” aponta para a regra.'),
    h('dl', { class: 'gloss' }, D.bundle.glossary.map((g) => {
      const m = g.where.match(/^([\w-]+)#([\w-]+)$/);
      return [h('dt', null, g.term), h('dd', null, g.meaning.replace(/`/g, ''), ' ',
        m ? h('a', { href: `#/regras/rules/${m[1]}/${m[2]}` }, 'ver regra') : (g.where ? pageCite(g.where) : null))];
    }))));
}

// ------------------------------------------------------------------ mais
export function moreView(root, { toggleTheme, themeLabel }) {
  root.append(h('div', { class: 'view' }, h('h2', null, 'Mais'),
    h('div', { class: 'cards' },
      [['#/personagens', 'Personagens', 'lista, importar e exportar'], ['#/criar', 'Criar personagem', 'assistente passo a passo'], ['#/glossario', 'Glossário', 'termos oficiais'], ['#/regras/errata', 'Errata', 'leituras provisórias']]
        .map(([href, t, s]) => h('a', { class: 'card link', href, onclick: () => (href === '#/criar' ? resetWizard() : null) }, h('strong', null, t), h('span', { class: 'muted' }, s)))),
    h('section', { class: 'card' }, h('h3', null, 'Aparência'),
      h('button', { class: 'btn', type: 'button', onclick: toggleTheme }, themeLabel()),
      h('p', { class: 'muted small' }, 'Segue o tema do sistema até você alternar.')),
    h('section', { class: 'card' }, h('h3', null, 'Atalhos (PC)'),
      h('ul', null, h('li', null, h('kbd', null, '/'), ' ou ', h('kbd', null, 'Ctrl+K'), ': busca'), h('li', null, h('kbd', null, 'R'), ': rolar'), h('li', null, h('kbd', null, 'N'), ': próximo round'),
        h('li', null, h('kbd', null, '1'), ' a ', h('kbd', null, '9'), ': ações declaradas'), h('li', null, h('kbd', null, '?'), ': esta lista'))),
    h('p', { class: 'muted small' }, `Dados gerados em ${D.bundle.meta.generated}. Regras: base data/ (resumos); páginas do livro impresso.`)));
}
export { prefs, setPref };
