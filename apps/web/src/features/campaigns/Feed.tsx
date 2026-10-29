// Feed - feed da mesa em tempo real (rolagens), com selo de origem e decisao do Wild Die 1 pelo mestre.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Cpu, Dices, ServerCog, WifiOff } from 'lucide-react';
import { useState } from 'react';
import { EmptyState, PortraitFrame, Spinner } from '@/components/ui';
import { cn } from '@/lib/cn';
import { errText, get, post } from '@/lib/api';
import { useRoom, useSocketEvent } from '@/lib/socket';
import { DiceRow2D } from '../mesa/DiceViews';

export interface RollDTO {
  id: string; userId: string; userName: string; characterId: string | null; characterName: string | null; portraitMediaId: string | null; campaignId: string | null;
  rollType: string; label: string; pool: { text: string; lines: string[] }; mode: 'digital' | 'physical'; rng: 'server' | 'client';
  normals: number[]; wild: number[]; pips: number; wildOne: boolean; totals: { normal: number; complication: number; subtract: number };
  cpDice: number[][]; cpTotal: number; wildOneChoice: string | null; total: number | null; pending: boolean; visibility: string; createdAt: string;
}

export function RollSeal({ r }: { r: Pick<RollDTO, 'rng' | 'mode'> }) {
  const [icon, text, tip] = r.rng === 'client' ? [<WifiOff key="i" className="h-3 w-3" aria-hidden />, 'offline', 'Rolada no aparelho sem rede e enviada depois'] : r.mode === 'physical' ? [<Dices key="i" className="h-3 w-3" aria-hidden />, 'dados físicos', 'Valores digitados pelo jogador'] : [<ServerCog key="i" className="h-3 w-3" aria-hidden />, 'servidor', 'Sorteada no servidor (crypto.randomInt)'];
  return <span className="chip" title={tip} data-testid="roll-seal">{icon}{text}</span>;
}

export const CHOICES: [string, string, string][] = [
  ['normal', 'Contar como normal', 'O 1 vale como número comum (RD-03 a)'],
  ['complication', 'Complicação', 'Soma tudo e o mestre aplica uma complicação (RD-03 b)'],
  ['subtract', 'Tirar o 1 e o maior dado', 'Remove o Wild Die e o maior dado normal (RD-03 c, RD-04 CASA)'],
];

export function useFeed(campaignId: string | undefined) {
  const qc = useQueryClient();
  const key = ['feed', campaignId];
  const q = useQuery({ queryKey: key, queryFn: () => get<{ rolls: RollDTO[] }>(`/api/campaigns/${campaignId}/rolls`), enabled: !!campaignId, retry: 0 });
  useRoom(campaignId ? { campaignId } : null);
  useSocketEvent<RollDTO>('roll:created', (r) => { if (r.campaignId === campaignId) qc.setQueryData<{ rolls: RollDTO[] }>(key, (o) => ({ rolls: [r, ...(o?.rolls ?? []).filter((x) => x.id !== r.id)] })); });
  useSocketEvent<RollDTO>('roll:updated', (r) => { if (r.campaignId === campaignId) qc.setQueryData<{ rolls: RollDTO[] }>(key, (o) => ({ rolls: (o?.rolls ?? []).map((x) => (x.id === r.id ? r : x)) })); });
  return q;
}

export function FeedItem({ r, canDecide, mine }: { r: RollDTO; canDecide: boolean; mine?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const decide = async (choice: string) => {
    setBusy(true); setErr(null);
    try { await post(`/api/rolls/${r.id}/wild-one`, { choice }); } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };
  return (
    <li className={cn('glass rise grid gap-2 p-3', r.pending && 'glow')} style={r.pending ? { borderColor: 'var(--dark)' } : mine ? { borderColor: 'var(--line-strong)' } : undefined} data-testid="feed-item" data-roll-id={r.id}>
      <div className="flex items-start gap-3">
        <PortraitFrame mediaId={r.portraitMediaId} size={40} alt="" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2">
            <strong>{r.characterName ?? r.userName}</strong><time className="mono text-xs text-muted" dateTime={r.createdAt}>{new Date(r.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time>
          </div>
          <div className="text-sm text-muted">{r.label} · parada <span className="mono">{r.pool.text}</span>{r.visibility === 'gm' && <> · <span className="chip">só o mestre</span></>}</div>
        </div>
        <div className="text-right"><div className="mono text-3xl font-bold leading-none" style={{ color: r.pending ? 'var(--dark)' : undefined }} data-testid="feed-total" aria-label={r.pending ? 'total aguardando o mestre' : `total ${r.total}`}>{r.pending ? <span className="pulse">?</span> : r.total}</div>
          {r.wildOneChoice === 'complication' && <span className="chip" style={{ color: 'var(--dark)' }}>complicação</span>}</div>
      </div>
      <DiceRow2D r={{ normals: r.normals, wild: r.wild, cp: r.cpDice }} />
      <div className="flex flex-wrap items-center gap-1.5 text-xs"><RollSeal r={r} />{r.pips ? <span className="chip mono">+{r.pips} pips</span> : null}{r.cpTotal > 0 && <span className="chip" style={{ color: 'var(--cp)' }}><Cpu className="h-3 w-3" aria-hidden />+{r.cpTotal} CP</span>}</div>
      {r.pending && (
        <div role="group" aria-label="Decisão do mestre sobre o Wild Die 1" className="grid gap-2 border-t border-[var(--line)] pt-2">
          <p className="text-sm" style={{ color: 'var(--dark)' }}><strong>Wild Die saiu 1.</strong> {canDecide ? 'Decida:' : 'Aguardando a decisão do mestre.'}</p>
          {canDecide && <div className="grid gap-1.5 sm:grid-cols-3">{CHOICES.map(([k, l, tip]) => <button key={k} className="btn sm" disabled={busy} title={tip} onClick={() => decide(k)} data-choice={k}>{l} <span className="mono">({r.totals[k as 'normal']})</span></button>)}</div>}
          {err && <p role="alert" className="err text-sm">{err}</p>}
        </div>
      )}
    </li>
  );
}

export function FeedList({ campaignId, isGm, userId, limit }: { campaignId: string; isGm: boolean; userId?: string; limit?: number }) {
  const feed = useFeed(campaignId);
  if (feed.isLoading) return <Spinner />;
  if (feed.isError) return <p className="text-muted">Feed indisponível sem conexão.</p>;
  const rolls = (feed.data?.rolls ?? []).slice(0, limit);
  if (!rolls.length) return <EmptyState art="empty.feed" title="Nenhuma rolagem ainda">As rolagens da mesa aparecem aqui em tempo real.</EmptyState>;
  const pending = rolls.filter((r) => r.pending);
  const rest = rolls.filter((r) => !r.pending);
  return (
    <ul className="grid gap-2" aria-live="polite" aria-label="Feed da mesa" data-testid="feed">
      {[...pending, ...rest].map((r) => <FeedItem key={r.id} r={r} canDecide={isGm} mine={r.userId === userId} />)}
    </ul>
  );
}
