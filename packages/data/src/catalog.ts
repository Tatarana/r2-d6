// catalog.ts - acesso ao bundle (gerado por tools/build_app_data.py) e busca global (porta de app/js/data.js).
export type Bundle = any;

export const CATEGORIES: [string, string][] = [
  ['rules', 'Regras'], ['skills', 'Perícias'], ['powers', 'Poderes'], ['species', 'Espécies'],
  ['weapons', 'Armas'], ['armor', 'Armaduras'], ['gear', 'Equipamentos'], ['vehicles', 'Veículos'],
  ['starships', 'Naves'], ['templates', 'Templates'], ['tables', 'Tabelas'], ['errata', 'Errata'],
];

export const GROUPS: [string, string][] = [['rules', 'Regras'], ['skills', 'Perícias'], ['powers', 'Poderes'], ['species', 'Espécies'], ['items', 'Itens'],
  ['craft', 'Veículos e naves'], ['templates', 'Templates'], ['tables', 'Tabelas'], ['glossary', 'Glossário'], ['errata', 'Errata']];

const fold = (s: any) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const tableTitle = (id: string) => id.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

export const pageText = (pages?: number[]) => {
  if (!pages || !pages.length) return '';
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  if (sorted.length === 1) return `p.${sorted[0]}`;
  return sorted.length <= 4 ? `p.${sorted.join(', ')}` : `p.${sorted[0]}-${sorted[sorted.length - 1]}`;
};

export interface SearchDoc { group: string; title: string; sub: string; page: string; href: string; text: string; ftitle: string; extra?: string; score?: number }

export function createCatalog(bundle: Bundle, opts: { hrefBase?: string } = {}) {
  const base = opts.hrefBase ?? '/consulta';
  const e = bundle.entities;
  const byId = (list: any[]) => new Map<string, any>(list.map((x) => [x.id, x]));
  const maps: Record<string, Map<string, any>> = {
    skills: byId(e.skills), powers: byId(e.force_powers), species: byId(e.species),
    weapons: byId(e.weapons), armor: byId(e.armor), gear: byId(e.gear),
    vehicles: byId(e.vehicles), starships: byId(e.starships), templates: byId(e.templates),
  };
  const errataById = new Map<string, any>(bundle.errata.map((x: any) => [x.id, x]));
  let docs: SearchDoc[] | null = null;

  const listOf = (cat: string): any[] => ({ skills: e.skills, powers: e.force_powers, species: e.species, weapons: e.weapons, armor: e.armor,
    gear: e.gear, vehicles: e.vehicles, starships: e.starships, templates: e.templates } as Record<string, any[]>)[cat] || [];
  const getEntity = (cat: string, id: string) => (maps[cat] ? maps[cat].get(id) : null);
  const skillName = (id: string) => (maps.skills.get(id) || {}).name || id;
  const errataFor = (ids?: string[]) => (ids || []).map((id) => errataById.get(id)).filter(Boolean);
  const entityErrata = (cat: string, id: string) => errataFor(bundle.derived.entity_errata[`${cat === 'powers' ? 'force_powers' : cat}:${id}`]);
  const findSection = (file: string, anchor: string) => {
    const f = bundle.rules.find((r: any) => r.id === file);
    if (!f) return null;
    const s = f.sections.find((x: any) => x.anchor === anchor);
    return s ? { file: f, section: s } : null;
  };
  const speciesBlock = (speciesId: string, idx = 0) => { const s = maps.species.get(speciesId); return s ? s.stat_blocks[idx] || s.stat_blocks[0] : null; };
  const moveStart = (speciesId: string) => { const b = bundle.derived.species_move_start[speciesId]; return b && b[0] ? b[0].move_start : null; };

  function buildDocs(): SearchDoc[] {
    const out: SearchDoc[] = [];
    const b = bundle;
    for (const f of b.rules) for (const s of f.sections) {
      out.push({ group: 'rules', title: s.title, sub: f.title, page: pageText(s.pages), href: `${base}/rules/${f.id}/${s.anchor}`, text: fold(s.text), ftitle: fold(s.title) });
    }
    for (const s of e.skills) out.push({ group: 'skills', title: s.name + (s.advanced ? ' (A)' : ''), sub: s.attribute, page: s.page ? `p.${s.page}` : '', href: `${base}/skills/${s.id}`, text: fold(`${s.summary} ${s.specializations}`), ftitle: fold(s.name) });
    for (const p of e.force_powers) out.push({ group: 'powers', title: p.name, sub: p.skills.join(', '), page: p.page ? `p.${p.page}` : '', href: `${base}/powers/${p.id}`, text: fold(p.effect_summary), ftitle: fold(p.name) });
    for (const s of e.species) out.push({ group: 'species', title: s.name, sub: '', page: s.page ? `p.${s.page}` : '', href: `${base}/species/${s.id}`, text: fold(`${s.homeworlds} ${s.languages}`), ftitle: fold(s.name) });
    for (const [g, list] of [['weapons', e.weapons], ['armor', e.armor], ['gear', e.gear]] as [string, any[]][]) {
      for (const it of list) out.push({ group: 'items', title: it.name, sub: g, page: it.page ? `p.${it.page}` : '', href: `${base}/${g}/${it.id}`, text: fold(`${it.type || ''} ${it.game_notes || ''}`), ftitle: fold(it.name) });
    }
    for (const v of e.vehicles) out.push({ group: 'craft', title: v.name, sub: 'veículo', page: v.page ? `p.${v.page}` : '', href: `${base}/vehicles/${v.id}`, text: fold(`${v.entry} ${v.craft} ${v.type}`), ftitle: fold(`${v.name} ${v.entry}`) });
    for (const v of e.starships) out.push({ group: 'craft', title: v.name, sub: 'nave', page: v.page ? `p.${v.page}` : '', href: `${base}/starships/${v.id}`, text: fold(`${v.entry} ${v.craft} ${v.type}`), ftitle: fold(`${v.name} ${v.entry}`) });
    for (const t of e.templates) out.push({ group: 'templates', title: t.type, sub: 'template', page: t.page ? `p.${t.page}` : '', href: `${base}/templates/${t.id}`, text: fold(`${t.special_abilities} ${t.equipment}`), ftitle: fold(t.type) });
    for (const [id, t] of Object.entries(b.tables)) out.push({ group: 'tables', title: tableTitle(id), sub: 'tabela', page: '', href: `${base}/tables/${id}`, text: fold(JSON.stringify(t).slice(0, 6000)), ftitle: fold(tableTitle(id)) });
    for (const g of b.glossary) out.push({ group: 'glossary', title: g.term, sub: '', page: '', href: '/glossario', text: fold(g.meaning), ftitle: fold(g.term), extra: g.meaning });
    for (const x of b.errata) out.push({ group: 'errata', title: x.id, sub: x.status, page: '', href: `${base}/errata/${x.id}`, text: fold(`${x.problem} ${x.provisional}`), ftitle: fold(x.id) });
    return out;
  }

  /** Busca global. Retorna [{group,label,results:[doc]}] (maximo `per` por grupo). */
  function search(query: string, per = 8) {
    if (!docs) docs = buildDocs();
    const q = fold(query).trim();
    if (!q) return [];
    const toks = q.split(/\s+/);
    const scored: SearchDoc[] = [];
    for (const d of docs) {
      let score = 0;
      if (d.ftitle === q) score += 100;
      else if (d.ftitle.startsWith(q)) score += 60;
      else if (d.ftitle.includes(q)) score += 45;
      else if (toks.every((t) => d.ftitle.includes(t))) score += 30;
      if (d.text.includes(q)) score += 12;
      else if (toks.every((t) => d.text.includes(t))) score += 6;
      if (score) scored.push({ ...d, score });
    }
    scored.sort((a, b) => b.score! - a.score!);
    const groups = GROUPS.map(([group, label]) => ({ group, label, results: scored.filter((d) => d.group === group).slice(0, per) })).filter((g) => g.results.length);
    const strong = (g: { group: string; results: SearchDoc[] }) => !['rules', 'glossary', 'errata', 'tables'].includes(g.group) && g.results[0].score! >= 60;
    return [...groups.filter(strong), ...groups.filter((g) => !strong(g))];
  }

  return { bundle, maps, errataById, listOf, getEntity, skillName, errataFor, entityErrata, findSection, speciesBlock, moveStart, search, pageText, hrefBase: base };
}
export type Catalog = ReturnType<typeof createCatalog>;
