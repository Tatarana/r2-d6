// VersionsPage - historico de versoes da ficha (visualizar, comparar com o atual, salvar marco e restaurar).
import { diffOps } from '@r2d6/rules';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bookmark, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ErrorState, Modal, Page, Panel, Spinner } from '@/components/ui';
import { errText, get, post } from '@/lib/api';
import { applyServerResult, useChar } from '@/lib/sync';

const KIND: Record<string, string> = { creation: 'Criação', auto: 'Automática', milestone: 'Marco', restore: 'Antes de restaurar', approval: 'Aprovação' };
const show = (v: any) => (v === undefined ? '(removido)' : typeof v === 'object' && v !== null ? (v.text ?? JSON.stringify(v)) : String(v));

export function VersionsPage() {
  const { id } = useParams();
  const ch = useChar(id);
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['versions', id], queryFn: () => get<{ versions: any[] }>(`/api/characters/${id}/versions`), enabled: !!id, retry: 0 });
  const [sel, setSel] = useState<string | null>(null);
  const detail = useQuery({ queryKey: ['version', id, sel], queryFn: () => get<{ version: any }>(`/api/characters/${id}/versions/${sel}`), enabled: !!sel });
  const [label, setLabel] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  if (ch === undefined) return <Spinner />;
  if (ch === null) return <ErrorState art="error.not-found" title="Personagem não encontrado" />;
  const changes = detail.data ? diffOps(ch.sheet, detail.data.version.snapshot).filter((o) => o.op !== 'inc' || true) : [];

  const saveMilestone = async () => {
    if (!label.trim()) return;
    try { await post(`/api/characters/${id}/versions`, { label: label.trim() }); setLabel(''); void qc.invalidateQueries({ queryKey: ['versions', id] }); } catch (e) { setErr(errText(e)); }
  };
  const restore = async () => {
    try { const r = await post(`/api/characters/${id}/restore`, { versionId: sel }); await applyServerResult(r.character); setConfirm(false); void qc.invalidateQueries({ queryKey: ['versions', id] }); } catch (e) { setErr(errText(e)); setConfirm(false); }
  };

  return (
    <Page title={`Histórico · ${ch.name}`} subtitle="Cada alteração fica registrada; restaurar cria uma nova revisão (nada é reescrito)." actions={<Link className="btn" to={`/ficha/${id}`}><ArrowLeft className="h-4 w-4" aria-hidden />Voltar à ficha</Link>}>
      {err && <p role="alert" className="err mb-3">{err}</p>}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Panel className="grid content-start gap-3">
          <div className="flex gap-2"><input className="input" aria-label="Nome do marco" placeholder="Marco (ex.: fim da sessão 3)" value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveMilestone()} />
            <button className="btn" onClick={saveMilestone} disabled={!label.trim()}><Bookmark className="h-4 w-4" aria-hidden />Salvar marco</button></div>
          {list.isLoading ? <Spinner /> : list.isError ? <p className="text-muted">Histórico indisponível offline.</p> : (
            <ul className="grid gap-1">
              {list.data!.versions.map((v) => (
                <li key={v.id}><button className="btn ghost w-full justify-between text-left" aria-pressed={sel === v.id} style={sel === v.id ? { background: 'color-mix(in srgb, var(--holo) 14%, transparent)' } : undefined} onClick={() => setSel(v.id)}>
                  <span><strong>{KIND[v.kind] ?? v.kind}</strong>{v.label ? ` · ${v.label}` : ''}</span><span className="mono text-xs text-muted">rev {v.revision} · {new Date(v.createdAt).toLocaleString('pt-BR')}</span></button></li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel className="grid content-start gap-3" aria-live="polite">
          {!sel ? <p className="text-muted">Selecione uma versão para ver o que mudou em relação à ficha atual.</p> : detail.isLoading ? <Spinner /> : detail.data && (
            <>
              <div className="flex items-center justify-between"><h2 className="label">Diferenças (versão → atual: o que voltaria)</h2>
                <button className="btn" onClick={() => setConfirm(true)}><RotateCcw className="h-4 w-4" aria-hidden />Restaurar esta versão</button></div>
              {!changes.length ? <p className="okc">Idêntica à ficha atual.</p> : (
                <ul className="grid gap-1 text-sm">{changes.slice(0, 60).map((o, i) => (
                  <li key={i} className="glass p-2"><span className="mono text-muted">{o.path}</span><br />
                    atual: <span className="mono">{show(path(ch.sheet, o.path))}</span> → versão: <span className="mono">{o.op === 'inc' ? show((path(ch.sheet, o.path) ?? 0) + (o as any).value) : o.op === 'remove' ? '(removido)' : show((o as any).value)}</span></li>))}
                </ul>
              )}
            </>
          )}
        </Panel>
      </div>
      <Modal open={confirm} onOpenChange={setConfirm} title="Restaurar versão?">
        <p className="mb-3">A ficha volta ao estado desta versão. O estado atual é guardado antes, então dá para desfazer.</p>
        <div className="flex justify-end gap-2"><button className="btn" onClick={() => setConfirm(false)}>Cancelar</button><button className="btn primary" onClick={restore}>Restaurar</button></div>
      </Modal>
    </Page>
  );
}
function path(doc: any, p: string) { return p.split('/').filter(Boolean).reduce((o, k) => o?.[k], doc); }
