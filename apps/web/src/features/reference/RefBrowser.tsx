// RefBrowser - consulta de regras e entidades (porta de app/js/views/reference.js), sem estado de rota proprio:
// recebe `path` (/consulta/...) e avisa a navegacao por `onNavigate`, entao serve a pagina e o painel lateral.
import { ArrowLeft, Search } from 'lucide-react';
import { useDeferredValue, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { ArtSlot } from '@/components/ArtSlot';
import { Markdown, Seal, Spinner } from '@/components/ui';
import { useCatalog } from '@/lib/catalog';

const CATS: [string, string, string][] = [
  ['rules', 'Regras', 'ref.rules'], ['skills', 'Perícias', 'ref.skills'], ['powers', 'Poderes da Força', 'ref.force-powers'], ['species', 'Espécies', 'ref.species'],
  ['weapons', 'Armas', 'ref.weapons'], ['armor', 'Armaduras', 'ref.armor'], ['gear', 'Equipamentos', 'ref.gear'], ['vehicles', 'Veículos', 'ref.vehicles'],
  ['starships', 'Naves', 'ref.starships'], ['templates', 'Templates', 'ref.rules'], ['tables', 'Tabelas', 'ref.tables'], ['errata', 'Errata', 'ref.rules'],
];
/** Id do espaco de arte do item (<grupo>.<id>); as reservas vem do campo `fallback` do manifesto, lido pelo ArtSlot. */
export function entityArt(cat: string, it: any): string | null {
  const g: Record<string, string> = { weapons: 'weapon', armor: 'armor', gear: 'gear', vehicles: 'vehicle', starships: 'starship', skills: 'skill', powers: 'power', species: 'species', templates: 'template' };
  return g[cat] ? `${g[cat]}.${it.id}` : null;
}
const HIDE = new Set(['id', 'name', 'page', 'raw', 'source']);
const label = (k: string) => k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

function pageCite(p?: number | number[] | string) {
  if (p === undefined || p === null || p === '') return null;
  const t = Array.isArray(p) ? (p.length ? `p.${p.join(', ')}` : '') : /^p\./.test(String(p)) ? String(p) : `p.${p}`;
  return t ? <span className="pg"> ({t})</span> : null;
}

/** Visualizador generico de JSON do catalogo (tabelas e blocos de espécie). */
export function JsonView({ v, depth = 0 }: { v: any; depth?: number }): ReactNode {
  if (v === null || v === undefined || v === '') return <span className="text-muted">—</span>;
  if (typeof v !== 'object') return <span>{String(v)}</span>;
  if (Array.isArray(v)) {
    if (!v.length) return <span className="text-muted">—</span>;
    if (v.every((x) => x && typeof x === 'object' && !Array.isArray(x))) {
      const cols = [...new Set(v.flatMap((x) => Object.keys(x)))].filter((c) => !HIDE.has(c) || c === 'name').slice(0, 8);
      return (
        <div className="tbl-wrap"><table className="prose"><thead><tr>{cols.map((c) => <th key={c}>{label(c)}</th>)}</tr></thead>
          <tbody>{v.map((r, i) => <tr key={i}>{cols.map((c) => <td key={c}>{typeof r[c] === 'object' ? <JsonView v={r[c]} depth={depth + 1} /> : String(r[c] ?? '')}</td>)}</tr>)}</tbody></table></div>
      );
    }
    return <ul className="list-disc pl-5">{v.map((x, i) => <li key={i}><JsonView v={x} depth={depth + 1} /></li>)}</ul>;
  }
  const entries = Object.entries(v).filter(([k]) => !(depth === 0 && HIDE.has(k)));
  if (v.text && v.dice !== undefined) return <span className="mono">{v.text}</span>;
  return (
    <dl className="grid gap-1.5">
      {entries.map(([k, x]) => (
        <div key={k} className={depth ? 'pl-2' : ''}><dt className="label">{label(k)}</dt><dd className="m-0"><JsonView v={x} depth={depth + 1} /></dd></div>
      ))}
    </dl>
  );
}

export function RefBrowser({ path, onNavigate, compact }: { path: string; onNavigate: (p: string) => void; compact?: boolean }) {
  const cs = useCatalog();
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const parts = path.replace(/^\/(consulta|glossario)\/?/, '').split('/').filter(Boolean);
  const isGloss = path.startsWith('/glossario');
  const results = useMemo(() => (cs && dq.trim().length >= 2 ? cs.catalog.search(dq, 6) : []), [cs, dq]);

  if (!cs) return <Spinner label="Carregando regras…" />;
  const { catalog: C } = cs;

  // links internos dos textos (Markdown) navegam dentro do componente
  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a');
    const href = a?.getAttribute('href');
    if (href && href.startsWith('/') && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setQ(''); onNavigate(href); }
  };
  const go = (p: string) => () => { setQ(''); onNavigate(p); };
  const back = (to: string) => <button className="btn sm ghost mb-2" onClick={go(to)}><ArrowLeft className="h-4 w-4" aria-hidden />Voltar</button>;

  const searchBox = (
    <div className="relative mb-3">
      <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" aria-hidden />
      <input className="input pl-9" type="search" placeholder="Buscar regras, perícias, armas… (ex.: wild die)" aria-label="Buscar na consulta" value={q} onChange={(e) => setQ(e.target.value)} />
    </div>
  );

  let body: ReactNode;
  if (dq.trim().length >= 2) {
    body = results.length ? results.map((g) => (
      <section key={g.group} className="mb-4"><h3 className="label mb-1">{g.label}</h3>
        <ul className="grid gap-1">{g.results.map((r) => (
          <li key={r.href}><button className="btn ghost w-full justify-between text-left" onClick={go(r.href)}><span><strong>{r.title}</strong> <span className="text-muted">{r.sub}</span></span><span className="pg">{r.page}</span></button>
            {r.extra && <p className="px-3 text-sm text-muted">{r.extra}</p>}</li>))}</ul></section>
    )) : <p className="text-muted">Nada encontrado para “{dq}”.</p>;
  } else if (isGloss) {
    body = (
      <div>
        <h2 className="mb-3 text-xl font-bold">Glossário</h2>
        <dl className="grid gap-3">{C.bundle.glossary.map((g: any) => (
          <div key={g.term} className="glass p-3"><dt className="font-semibold">{g.term}</dt><dd className="m-0 text-muted"><Markdown md={g.meaning} /></dd>
            {g.where && <button className="btn sm ghost" onClick={go(`/consulta/rules/${g.where.replace('#', '/')}`)}>Ver na regra</button>}</div>))}</dl>
      </div>
    );
  } else if (!parts.length) {
    body = (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATS.map(([id, name, art]) => (
          <button key={id} className="glass chamfer overflow-hidden text-left transition-transform hover:-translate-y-0.5" onClick={go(`/consulta/${id}`)}>
            <ArtSlot id={art} className="w-full" ratio="16 / 9" decorative /><div className="p-2.5 font-semibold">{name}</div>
          </button>
        ))}
        <button className="glass chamfer p-3 text-left font-semibold" onClick={go('/glossario')}>Glossário</button>
      </div>
    );
  } else {
    const [cat, a, b] = parts;
    const catName = CATS.find((c) => c[0] === cat)?.[1] ?? cat;
    if (cat === 'rules' && !a) {
      body = <div>{back('/consulta')}<h2 className="mb-2 text-xl font-bold">Regras</h2><ul className="grid gap-1">{C.bundle.rules.map((f: any) => <li key={f.id}><button className="btn ghost w-full justify-start" onClick={go(`/consulta/rules/${f.id}`)}>{f.title}</button></li>)}</ul></div>;
    } else if (cat === 'rules' && a && !b) {
      const f = C.bundle.rules.find((r: any) => r.id === a);
      body = !f ? <p>Arquivo de regras não encontrado.</p> : <div>{back('/consulta/rules')}<h2 className="mb-2 text-xl font-bold">{f.title}</h2>
        <ul className="grid gap-1">{f.sections.map((s: any) => <li key={s.anchor} style={{ paddingLeft: `${(s.level - 1) * 12}px` }}><button className="btn ghost w-full justify-between text-left" onClick={go(`/consulta/rules/${f.id}/${s.anchor}`)}><span>{s.title}</span><span className="pg">{C.pageText(s.pages)}</span></button></li>)}</ul></div>;
    } else if (cat === 'rules' && a && b) {
      const hit = C.findSection(a, b);
      if (!hit) body = <p>Seção não encontrada.</p>;
      else {
        const errs = C.errataFor(hit.section.errata);
        body = (
          <article>{back(`/consulta/rules/${a}`)}
            <h2 className="text-xl font-bold">{hit.section.title} {pageCite(hit.section.pages)}</h2><p className="label mb-2">{hit.file.title}</p>
            {errs.map((e: any) => (
              <div key={e.id} className="glass mb-2 p-2 text-sm" style={{ borderColor: 'var(--warn)' }}><Seal kind={e.status === 'open' ? 'prov' : 'raw'}>{e.id} · {e.status}</Seal> {e.problem}{e.provisional && <div className="text-muted">Provisório: {e.provisional}</div>}</div>
            ))}
            <Markdown md={hit.section.text} file={a} />
          </article>
        );
      }
    } else if (cat === 'tables') {
      if (!a) body = <div>{back('/consulta')}<h2 className="mb-2 text-xl font-bold">Tabelas</h2><ul className="grid gap-1">{Object.keys(C.bundle.tables).map((id) => <li key={id}><button className="btn ghost w-full justify-start" onClick={go(`/consulta/tables/${id}`)}>{id.replace(/-/g, ' ')}</button></li>)}</ul></div>;
      else body = <div>{back('/consulta/tables')}<h2 className="mb-2 text-xl font-bold">{a.replace(/-/g, ' ')}</h2><JsonView v={C.bundle.tables[a]} /></div>;
    } else if (cat === 'errata') {
      if (!a) body = <div>{back('/consulta')}<h2 className="mb-2 text-xl font-bold">Errata</h2><ul className="grid gap-1">{C.bundle.errata.map((e: any) => <li key={e.id}><button className="btn ghost w-full justify-between text-left" onClick={go(`/consulta/errata/${e.id}`)}><span><strong>{e.id}</strong> <span className="text-muted">{e.problem.slice(0, 70)}</span></span><Seal kind={e.status === 'open' ? 'prov' : 'raw'}>{e.status}</Seal></button></li>)}</ul></div>;
      else { const e = C.errataById.get(a); body = <div>{back('/consulta/errata')}{e ? <JsonView v={e} /> : <p>Errata não encontrada.</p>}</div>; }
    } else if (!a) {
      const list = C.listOf(cat);
      body = (
        <div>{back('/consulta')}<h2 className="mb-2 text-xl font-bold">{catName} <span className="text-muted">({list.length})</span></h2>
          <ul className="grid gap-1 sm:grid-cols-2">{list.map((it: any) => <li key={it.id}><button className="btn ghost w-full justify-between gap-2 text-left" onClick={go(`/consulta/${cat}/${it.id}`)}>{entityArt(cat, it) && <ArtSlot id={entityArt(cat, it)!} className="w-14 shrink-0 rounded" ratio="1 / 1" decorative />}<span className="min-w-0 flex-1">{it.name ?? it.type}{it.advanced ? ' (A)' : ''}</span><span className="pg">{it.page ? `p.${it.page}` : ''}</span></button></li>)}</ul></div>
      );
    } else {
      const it = C.getEntity(cat, a);
      const errs = C.entityErrata(cat, a);
      body = !it ? <p>Item não encontrado.</p> : (
        <article>{back(`/consulta/${cat}`)}
          {entityArt(cat, it) && <ArtSlot id={entityArt(cat, it)!} className={cat === 'species' || cat === 'templates' || cat === 'skills' || cat === 'powers' ? 'mb-3 w-40' : 'mb-3 w-full max-w-md'} ratio={['weapons','armor','gear','vehicles','starships'].includes(cat) ? '16 / 9' : undefined} />}
          <h2 className="text-xl font-bold">{it.name ?? it.type} {pageCite(it.page)}</h2>
          {errs.map((e: any) => <div key={e.id} className="glass my-2 p-2 text-sm" style={{ borderColor: 'var(--warn)' }}><Seal kind="prov">{e.id}</Seal> {e.problem} <span className="text-muted">{e.provisional}</span></div>)}
          <div className="mt-3"><JsonView v={it} /></div>
        </article>
      );
    }
  }
  return <div onClick={onClick} className={compact ? 'text-sm' : ''}>{searchBox}{body}</div>;
}
