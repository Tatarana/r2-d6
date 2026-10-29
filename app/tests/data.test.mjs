import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { setBundle, search, D, errataFor } from '../js/data.js';
import { renderMarkdown } from '../js/markdown.js';

const here = dirname(fileURLToPath(import.meta.url));
setBundle(JSON.parse(readFileSync(join(here, '..', 'data', 'bundle.json'), 'utf8')));

test('US-15: "wild die" tem a secao do Wild Die com (p.73) como primeiro resultado de Regras', () => {
  const g = search('wild die');
  const rules = g.find((x) => x.group === 'rules');
  assert.equal(rules.results[0].title, 'The Wild Die');
  assert.equal(rules.results[0].page, 'p.73');
});

test('US-15: "AT-AT" encontra o veiculo com a pagina', () => {
  const g = search('AT-AT');
  const craft = g.find((x) => x.group === 'craft');
  assert.ok(craft, 'grupo craft');
  assert.equal(craft.results[0].title, 'AT-AT');
  assert.equal(craft.results[0].page, 'p.403');
  assert.equal(g[0].group, 'craft'); // titulo exato sobe para o topo
});

test('US-15: secao com E-0xx open recebe o selo (dados do errata)', () => {
  const sec = D.bundle.rules.find((f) => f.id === 'combat-injuries').sections.find((s) => s.anchor === 'attack-steps');
  assert.ok(sec.errata.includes('E-023'));
  const open = errataFor(sec.errata).filter((e) => e.status === 'open');
  assert.equal(open[0].id, 'E-023');
  assert.ok(open[0].provisional.length > 0);
});

test('bundle: secoes tem ancora, paginas e ids de errata; derivados sem pendencias', () => {
  const core = D.bundle.rules.find((f) => f.id === 'core-mechanics');
  const wild = core.sections.find((s) => s.anchor === 'wild-die');
  assert.deepEqual(wild.pages.includes(73), true);
  const flat = Object.values(D.bundle.derived.template_skill_map).flat();
  assert.equal(flat.filter((e) => !e.skill_id && !e.species_special_skill).length, 0);
  const errataRows = readFileSync(join(here, '..', '..', 'data', 'errata.md'), 'utf8').split(/\r?\n/).filter((l) => /^\| E-\d{3} \|/.test(l)).length;
  assert.equal(D.bundle.errata.length, errataRows);
  assert.equal(D.bundle.glossary.length, 17);
});

test('markdown: titulos, listas, tabelas, negrito, codigo, links internos e paginas', () => {
  const html = renderMarkdown('## T {#x}\n\n- um **negrito**\n  - filho\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\nVeja `characters.md#credits` (p.22) e E-023 <script>', { file: 'core-mechanics' });
  assert.match(html, /<h4>T<\/h4>/);
  assert.match(html, /<strong>negrito<\/strong>/);
  assert.match(html, /<ul><li>um <strong>negrito<\/strong><ul><li>filho/);
  assert.match(html, /<table>/);
  assert.match(html, /href="#\/regras\/rules\/characters\/credits"/);
  assert.match(html, /<span class="pg">\(p\.22\)<\/span>/);
  assert.match(html, /href="#\/regras\/errata\/E-023"/);
  assert.ok(!html.includes('<script>')); // escapado
});
