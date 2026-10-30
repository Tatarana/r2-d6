// /dev/art - lista os 144 espacos de imagem do manifesto com status (tem arte ou nao), para quem for produzir as imagens.
import { useMemo, useState } from 'react';
import { ART_ITEMS, ArtSlot, artResolved } from '@/components/ArtSlot';
import { Page } from '@/components/ui';

const STATUS: Record<string, string> = { draft: 'rascunho', approved: 'aprovada', rejected: 'recusada' };

export default function ArtDev() {
  const [group, setGroup] = useState('todos');
  const [only, setOnly] = useState<'todos' | 'faltam' | 'prontos'>('todos');
  const [q, setQ] = useState('');
  const groups = useMemo(() => ['todos', ...new Set(ART_ITEMS.map((i) => i.group))], []);
  const rows = ART_ITEMS.map((i) => ({ ...i, ...artResolved(i.id), own: !!artResolved(i.id).src && !artResolved(i.id).via }));
  const shown = rows.filter((r) => (group === 'todos' || r.group === group) && (only === 'todos' || (only === 'prontos') === r.own) && (!q || (r.id + r.description + r.screen).toLowerCase().includes(q.toLowerCase())));
  const done = rows.filter((r) => r.own).length;
  return (
    <Page title="Arte do universo" subtitle={`${done} de ${rows.length} espaços com arte. Coloque o arquivo em apps/web/public/art/<id>.webp (ou no caminho do manifesto) e recarregue.`}>
      <div className="glass mb-4 flex flex-wrap items-end gap-3 p-3">
        <label className="field"><span>Grupo</span><select className="input" value={group} onChange={(e) => setGroup(e.target.value)}>{groups.map((g) => <option key={g}>{g}</option>)}</select></label>
        <label className="field"><span>Status</span><select className="input" value={only} onChange={(e) => setOnly(e.target.value as any)}><option value="todos">Todos</option><option value="faltam">Faltam</option><option value="prontos">Com arte</option></select></label>
        <label className="field grow"><span>Buscar</span><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="id, tela ou descrição" /></label>
        <div className="mono text-sm" data-testid="art-count">{shown.length} exibidos · {done}/{rows.length} prontos</div>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="art-list">
        {shown.map((r) => (
          <li key={r.id} className="glass grid grid-cols-[7rem_1fr] gap-3 p-3" data-art-row={r.id}>
            {/* caixa de tamanho fixo para todas as linhas; a imagem inteira aparece (contain), sem recorte */}
            <ArtSlot id={r.id} className="w-28 self-start rounded bg-[var(--void)]" ratio="4 / 3" fit="contain" alt="" decorative />
            <div className="min-w-0 text-sm">
              <div className="flex flex-wrap items-center gap-1.5"><code className="mono break-all font-bold">{r.id}</code>
                <span className="chip" style={{ color: r.own ? 'var(--ok)' : 'var(--warn)' }} data-status={r.own ? 'ok' : 'falta'}>{r.own ? 'tem arte' : r.via ? 'usa reserva' : 'falta'}</span>{r.own && r.status && r.status !== 'missing' && <span className="chip" data-review={r.status}>{STATUS[r.status] ?? r.status}</span>}<span className="chip">{r.priority}</span></div>
              <div className="text-muted">{r.screen} · {r.aspect} · {r.style}</div>
              <p className="mt-1 line-clamp-3" title={r.description}>{r.description}</p>
              <p className="mt-1 text-xs text-muted">alt: {r.alt || '(decorativa)'}</p>
              <p className="mono mt-1 text-xs">{r.own ? r.src : `esperado: art/${r.id}.webp`}{r.via && ` · reserva em uso: ${r.via}`}{!r.own && !r.via && r.fallback?.length ? ` · reservas: ${r.fallback.join(', ')}` : ''}</p>
            </div>
          </li>
        ))}
      </ul>
    </Page>
  );
}
