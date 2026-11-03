// NotesPanel - notas privadas do personagem (F-14): so o dono ve. Salva sozinho; sem rede, guarda o rascunho no aparelho
// e envia quando a conexao voltar.
import { Lock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Panel } from '@/components/ui';
import { ApiError, NetworkError, api } from '@/lib/api';

const pendingKey = (id: string) => `r2d6.notes.pending.${id}`;
const readPending = (id: string) => { try { return localStorage.getItem(pendingKey(id)); } catch { return null; } };
const writePending = (id: string, v: string | null) => { try { v === null ? localStorage.removeItem(pendingKey(id)) : localStorage.setItem(pendingKey(id), v); } catch { /* sem storage */ } };

type Status = 'loading' | 'saved' | 'dirty' | 'saving' | 'offline' | 'error' | 'hidden';

export function NotesPanel({ characterId }: { characterId: string }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>('loading');
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef('');

  const save = async (body: string) => {
    window.clearTimeout(timer.current);
    setStatus('saving');
    try {
      await api('PUT', `/api/characters/${characterId}/notes`, { body });
      writePending(characterId, null);
      if (latest.current === body) setStatus('saved');
    } catch (e) {
      if (e instanceof NetworkError || (e instanceof ApiError && e.status >= 500)) { writePending(characterId, body); setStatus('offline'); }
      else setStatus('error');
    }
  };

  useEffect(() => {
    let alive = true;
    const pending = readPending(characterId);
    api('GET', `/api/characters/${characterId}/notes`)
      .then((r: any) => {
        if (!alive) return;
        const body = pending ?? r.body;
        latest.current = body; setText(body); setStatus('saved');
        if (pending !== null && pending !== r.body) void save(pending);
      })
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 404) return setStatus('hidden'); // nao e o dono
        // sem rede: mostra o rascunho local, se houver
        latest.current = pending ?? ''; setText(pending ?? ''); setStatus(pending !== null ? 'offline' : 'error');
      });
    const online = () => { const p = readPending(characterId); if (p !== null) void save(p); };
    window.addEventListener('online', online);
    return () => { alive = false; window.removeEventListener('online', online); window.clearTimeout(timer.current); };
  }, [characterId]);

  if (status === 'hidden') return null;
  const onChange = (v: string) => {
    latest.current = v; setText(v); setStatus('dirty'); writePending(characterId, v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void save(v), 1200);
  };
  const label: Record<Status, string> = {
    loading: 'Carregando…', saved: 'Salvo', dirty: 'Editando…', saving: 'Salvando…', hidden: '',
    offline: 'Sem rede: guardado neste aparelho; sobe quando a conexão voltar.', error: 'Não foi possível salvar. Tente de novo.',
  };
  return (
    <Panel className="grid gap-2" aria-labelledby="notes-h">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="notes-h" className="label inline-flex items-center gap-1.5 !text-[0.8rem]"><Lock className="h-3.5 w-3.5" aria-hidden />Notas · só você vê</h2>
        <span className={status === 'error' ? 'err text-xs' : 'text-xs text-muted'} role="status" data-testid="notes-status">{label[status]}</span>
      </div>
      <textarea className="input min-h-40 font-[inherit]" value={text} disabled={status === 'loading'} maxLength={20000} data-testid="notes"
        placeholder="Pistas, nomes de NPCs, dívidas, senhas… Nem o mestre nem os outros jogadores leem."
        onChange={(e) => onChange(e.target.value)} onBlur={() => { if (status === 'dirty') void save(latest.current); }} aria-label="Notas do personagem" />
    </Panel>
  );
}
