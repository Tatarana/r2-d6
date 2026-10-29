// CampaignPage - mesa da campanha: feed em tempo real, grupo (console do mestre com concessoes), convites e ajustes.
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Crown, Link2, LogOut, Plus, Skull, StepForward, Zap } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { usePlatform } from '@/components/AppShell';
import { ArtSlot } from '@/components/ArtSlot';
import { EmptyState, ErrorState, Modal, Page, Panel, PortraitFrame, Spinner, WOUND_PT, woundTone } from '@/components/ui';
import { ApiError, del, errText, get, patch, post } from '@/lib/api';
import { useSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { useChars } from '@/lib/sync';
import { useCatalog } from '@/lib/catalog';
import { useRoom, useSocketEvent } from '@/lib/socket';
import { templateArt } from '../hangar/Hangar';
import { FeedList } from './Feed';

type Tab = 'feed' | 'grupo' | 'config';

export function CampaignPage() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data: session } = useSession();
  const { platform } = usePlatform();
  const q = useQuery({ queryKey: ['campaign', id], queryFn: () => get<any>(`/api/campaigns/${id}`), retry: 0 });
  const party = useQuery({ queryKey: ['party', id], queryFn: () => get<{ round: number; party: any[] }>(`/api/campaigns/${id}/party`), retry: 0 });
  const [tab, setTab] = useState<Tab>('feed');
  const [online, setOnline] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [grantFor, setGrantFor] = useState<any | null>(null);

  useRoom({ campaignId: id });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ['party', id] }); void qc.invalidateQueries({ queryKey: ['campaign', id] }); };
  useSocketEvent('party:changed', refresh);
  useSocketEvent('campaign:members', refresh);
  useSocketEvent('campaign:round', refresh);
  useSocketEvent<{ campaignId: string; online: string[] }>('presence', (p) => { if (p.campaignId === id) setOnline(p.online); });
  useSocketEvent<{ id: string; ops: any[] }>('character:changed', refresh);

  const nextRound = useMutation({ mutationFn: () => post(`/api/campaigns/${id}/round/next`), onSuccess: refresh, onError: (e) => setErr(errText(e)) });

  if (q.isLoading) return <Spinner />;
  if (q.isError) return <ErrorState art={q.error instanceof ApiError && q.error.status === 404 ? 'error.not-found' : 'error.offline'} title="Campanha indisponível" onRetry={() => q.refetch()}>{q.error instanceof ApiError && q.error.status === 404 ? 'Ela não existe ou você não participa dela.' : 'Campanhas precisam de conexão.'}</ErrorState>;
  const c = q.data;
  const isGm = c.myRole === 'gm';
  const wide = platform !== 'phone';
  const feed = <FeedList campaignId={id} isGm={isGm} userId={session?.user.id} />;
  const tabs: [Tab, string][] = isGm ? [['feed', 'Mesa'], ['grupo', 'Console do mestre'], ['config', 'Convites e ajustes']] : [['feed', 'Mesa'], ['grupo', 'Grupo']];
  const pendingCount = 0;
  const partyList = party.data?.party ?? [];
  const mine = c.characters.find((m: any) => m.ownerId === session?.user.id);

  return (
    <div>
      <div className="relative h-36 overflow-hidden md:h-44">
        <ArtSlot id={isGm ? 'bg.gm-console' : 'hero.campaign'} ratio="auto" className="absolute inset-0 h-full w-full" decorative eager />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,7,12,.2), var(--space))' }} />
        <div className="relative mx-auto flex h-full max-w-6xl items-end justify-between gap-3 px-4 pb-3 md:px-6">
          <div><p className="label">{isGm ? 'Você é o mestre' : 'Campanha'} · round <span className="mono">{c.campaign.currentRound}</span></p><h1 className="holo-text text-2xl font-bold uppercase tracking-wider md:text-4xl" data-testid="campaign-name">{c.campaign.name}</h1></div>
          {isGm && <button className="btn" onClick={() => nextRound.mutate()} disabled={nextRound.isPending}><StepForward className="h-4 w-4" aria-hidden />Próximo round (todos)</button>}
        </div>
      </div>
      <Page className="pt-2">
        {err && <p role="alert" className="err mb-2">{err}</p>}
        <div className="mb-3 flex gap-1 overflow-x-auto" role="tablist" aria-label="Seções da campanha">
          {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} data-tab={k} className={cn('btn', tab === k && 'primary')} onClick={() => setTab(k)}>{l}</button>)}
        </div>
        {tab === 'config' && isGm ? <ConfigView c={c} onChange={refresh} />
          : tab === 'feed' ? (
            <div className={cn('grid gap-4', wide && 'lg:grid-cols-[minmax(0,1fr)_16rem]')} data-view="mesa">
              <section aria-label="Feed da mesa" className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="label">Feed da mesa · rolagens e decisões</h2>
                  {mine && <Link className="btn sm primary" to={`/mesa/${mine.id}`}>Rolar com {mine.name}</Link>}
                </div>
                {feed}
              </section>
              <aside aria-label="Faixa do grupo" className="min-w-0">
                <h2 className="label mb-2">Na mesa agora</h2>
                <ul className="grid gap-2">{partyList.map((p) => (
                  <li key={p.id} className="glass flex items-center gap-2 p-2"><PortraitFrame mediaId={p.portraitMediaId} size={32} alt="" fallback={templateArt(p.templateType)} />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                    <span className="chip" style={{ color: woundTone(p.woundStatus) }}>{WOUND_PT[p.woundStatus]}</span>
                    <span className="inline-block h-2 w-2 rounded-full" title={online.includes(p.ownerId) ? 'online' : 'offline'} style={{ background: online.includes(p.ownerId) ? 'var(--ok)' : 'var(--muted)' }} /></li>))}</ul>
              </aside>
            </div>
          ) : isGm ? (
            <div data-view="console">
              <div className="glass mb-3 flex flex-wrap items-center gap-3 p-3 text-sm"><strong>Round {c.campaign.currentRound}</strong><span className="text-muted">Ações declaradas, CP gastos e FP usados neste round aparecem em cada cartão. O próximo round libera CP/FP e zera as ações.</span></div>
              <PartyView data={party.data} loading={party.isLoading} isGm online={online} meId={session?.user.id} onGrant={setGrantFor} />
            </div>
          ) : (
            <div data-view="grupo"><RichGroup party={partyList} online={online} meId={session?.user.id} />
              <MyCharacter campaignId={id} members={c.characters} meId={session?.user.id} onDone={refresh} /></div>
          )}
        <div className="mt-6 flex justify-end"><button className="btn sm danger" onClick={async () => { if (confirm('Sair desta campanha?')) { try { await del(`/api/campaigns/${id}/members/${session!.user.id}`); void qc.invalidateQueries({ queryKey: ['campaigns'] }); nav('/campanhas'); } catch (e) { setErr(errText(e)); } } }}><LogOut className="h-4 w-4" aria-hidden />Sair da campanha</button></div>
      </Page>
      {grantFor && <GrantDialog campaignId={id} ch={grantFor} onClose={() => setGrantFor(null)} onDone={refresh} />}
    </div>
  );
}

function PartyView({ data, loading, isGm, online, meId, onGrant }: { data?: { party: any[] }; loading: boolean; isGm: boolean; online: string[]; meId?: string; onGrant: (c: any) => void }) {
  if (loading) return <Spinner />;
  if (!data?.party.length) return <EmptyState art="empty.party" title="Nenhum personagem na mesa">Os jogadores vinculam seus personagens à campanha.</EmptyState>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2" aria-label="Personagens do grupo">
      {data.party.map((p) => {
        const ps = p.playState ?? {};
        const isOn = online.includes(p.ownerId);
        return (
          <li key={p.id} className="glass chamfer-2 reticle grid min-w-0 gap-2 p-3" data-testid="party-card" data-char={p.name}>
            <div className="flex items-center gap-3">
              <PortraitFrame mediaId={p.portraitMediaId} size={48} alt="" fallback={templateArt(p.templateType)} />
              <div className="min-w-0 flex-1"><div className="truncate font-bold">{p.name}</div><div className="truncate text-xs text-muted">{p.ownerName}{p.ownerId === meId ? ' (você)' : ''} · {p.templateType}</div></div>
              <span className="chip" title={isOn ? 'Online' : 'Offline'} style={{ color: isOn ? 'var(--ok)' : 'var(--muted)' }}><span className="inline-block h-2 w-2 rounded-full" style={{ background: 'currentColor' }} aria-hidden />{isOn ? 'online' : 'off'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="chip" style={{ color: woundTone(p.woundStatus), borderColor: woundTone(p.woundStatus) }}>{WOUND_PT[p.woundStatus]}</span>
              <span className="chip" style={{ color: 'var(--cp)' }}>CP {p.characterPoints}</span><span className="chip" style={{ color: 'var(--fp)' }}>FP {p.forcePoints}</span>
              {p.darkSidePoints !== undefined && <span className="chip" style={{ color: 'var(--dark)' }} data-testid="dsp-chip"><Skull className="h-3 w-3" aria-hidden />DSP {p.darkSidePoints}</span>}
              {(ps.stuns?.length ?? 0) > 0 && <span className="chip">stuns {ps.stuns.length}</span>}
              {ps.fpUsed && <span className="chip" style={{ color: 'var(--fp)' }}>FP no round</span>}
              {isGm && <span className="chip" title="Ações declaradas neste round">ações {ps.actions ?? 1}{ps.cpSpent ? ` · CP gastos ${ps.cpSpent}` : ''}</span>}
            </div>
            {isGm && p.weapons?.length > 0 && <div className="mono text-xs text-muted">{p.weapons.map((w: any) => `${w.type}: ${(w.ammoMax ?? 0) - (w.ammoUsed ?? 0)}/${w.ammoMax ?? 0}`).join(' · ')}</div>}
            {isGm && p.warnings?.length > 0 && <div className="text-xs warnc">{p.warnings.length} aviso(s) de regra: {p.warnings[0].msg}</div>}
            {isGm && <div className="flex flex-wrap gap-1.5">
              <button className="btn sm" onClick={() => onGrant(p)}><Zap className="h-3.5 w-3.5" aria-hidden />Conceder / ferir</button>
              <QuickGrant campaignId={p.campaignId} cid={p.id} body={{ cp: 1 }} label="+1 CP" />
              <QuickGrant campaignId={p.campaignId} cid={p.id} body={{ fp: 1 }} label="+1 FP" />
              <QuickGrant campaignId={p.campaignId} cid={p.id} body={{ stun: true }} label="Stun" />
              <QuickGrant campaignId={p.campaignId} cid={p.id} body={{ wound: 'wounded' }} label="Ferir" />
            </div>}
          </li>
        );
      })}
    </ul>
  );
}

function QuickGrant({ campaignId, cid, body, label }: { campaignId: string; cid: string; body: any; label: string }) {
  const [busy, setBusy] = useState(false);
  return <button className="btn sm ghost" disabled={busy} onClick={async () => { setBusy(true); try { await post(`/api/campaigns/${campaignId}/characters/${cid}/grant`, body); } finally { setBusy(false); } }}>{label}</button>;
}

function GrantDialog({ campaignId, ch, onClose, onDone }: { campaignId: string; ch: any; onClose: () => void; onDone: () => void }) {
  const [v, setV] = useState({ cp: 0, fp: 0, dsp: 0, credits: 0, wound: '', stun: false, note: '' });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const n = (k: 'cp' | 'fp' | 'dsp' | 'credits') => (
    <label className="field"><span>{k === 'credits' ? 'Créditos' : k.toUpperCase()}</span><input className="input mono" type="number" value={v[k]} onChange={(e) => setV({ ...v, [k]: Number(e.target.value) || 0 })} aria-label={k === 'credits' ? 'Créditos' : k.toUpperCase()} /></label>
  );
  const submit = async () => {
    setBusy(true); setErr(null);
    const body: any = {};
    for (const k of ['cp', 'fp', 'dsp', 'credits'] as const) if (v[k]) body[k] = v[k];
    if (v.wound) body.wound = v.wound; if (v.stun) body.stun = true; if (v.note) body.note = v.note;
    try { await post(`/api/campaigns/${campaignId}/characters/${ch.id}/grant`, body); onDone(); onClose(); } catch (e) { setErr(errText(e)); setBusy(false); }
  };
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={`Conceder · ${ch.name}`}>
      <p className="mb-3 text-sm text-muted">Valores relativos (positivos somam, negativos tiram). Tudo fica registrado no histórico da ficha como ação do mestre.</p>
      <div className="grid grid-cols-2 gap-3">{n('cp')}{n('fp')}{n('dsp')}{n('credits')}</div>
      <div className="mt-3 grid gap-3">
        <label className="field"><span>Ferimento (define o estado)</span><select className="input" value={v.wound} onChange={(e) => setV({ ...v, wound: e.target.value })}><option value="">(não alterar)</option>{['healthy', 'wounded', 'wounded-twice', 'incapacitated', 'mortally-wounded', 'killed'].map((w) => <option key={w} value={w}>{WOUND_PT[w]}</option>)}</select></label>
        <label className="flex items-center gap-2"><input type="checkbox" className="h-5 w-5" checked={v.stun} onChange={(e) => setV({ ...v, stun: e.target.checked })} />Aplicar um stun (−1D neste round e no seguinte)</label>
        <label className="field"><span>Nota (opcional)</span><input className="input" maxLength={200} value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} /></label>
        {err && <p role="alert" className="err">{err}</p>}
        <div className="flex justify-end gap-2"><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={submit} disabled={busy} data-testid="grant-submit">Aplicar</button></div>
      </div>
    </Modal>
  );
}

function MyCharacter({ campaignId, members, meId, onDone }: { campaignId: string; members: any[]; meId?: string; onDone: () => void }) {
  const chars = useChars();
  const mine = members.find((m) => m.ownerId === meId);
  const [sel, setSel] = useState('');
  const [err, setErr] = useState<string | null>(null);
  if (mine) return (
    <Panel className="mt-3 flex items-center justify-between gap-2"><span>Seu personagem na mesa: <strong>{mine.name}</strong></span>
      <span className="flex gap-1.5"><Link className="btn sm" to={`/mesa/${mine.id}`}>Modo mesa</Link><button className="btn sm danger" onClick={async () => { try { await del(`/api/campaigns/${campaignId}/characters/${mine.id}`); onDone(); } catch (e) { setErr(errText(e)); } }}>Desvincular</button></span></Panel>
  );
  const free = (chars ?? []).filter((c) => !c.campaignId && !c.pendingCreate);
  return (
    <Panel className="mt-3 grid gap-2"><h3 className="label">Vincular personagem</h3>
      {free.length ? <div className="flex gap-2"><select className="input" aria-label="Personagem" value={sel} onChange={(e) => setSel(e.target.value)}><option value="">escolha…</option>{free.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <button className="btn primary" disabled={!sel} onClick={async () => { try { await post(`/api/campaigns/${campaignId}/characters`, { characterId: sel }); onDone(); } catch (e) { setErr(errText(e)); } }}>Vincular</button></div> : <p className="text-sm text-muted">Nenhum personagem livre. <Link to="/criar">Crie um</Link>. Um personagem participa de no máximo uma campanha.</p>}
      {err && <p role="alert" className="err">{err}</p>}</Panel>
  );
}

function ConfigView({ c, onChange }: { c: any; onChange: () => void }) {
  const [invite, setInvite] = useState<{ code: string; url: string } | null>(null);
  const [qr, setQr] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const st = c.settings ?? c.campaign.settings;
  useEffect(() => { if (invite) void QRCode.toDataURL(invite.url, { margin: 1, width: 192, color: { dark: '#05070C', light: '#E8F1FA' } }).then(setQr); }, [invite]);
  const create = async () => { try { setInvite(await post(`/api/campaigns/${c.campaign.id}/invites`, {})); onChange(); } catch (e) { setErr(errText(e)); } };
  const set = async (settings: any) => { try { await patch(`/api/campaigns/${c.campaign.id}`, { settings }); onChange(); } catch (e) { setErr(errText(e)); } };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="grid content-start gap-3"><h2 className="label">Convidar jogadores</h2>
        <button className="btn primary w-fit" onClick={create} data-testid="create-invite"><Plus className="h-4 w-4" aria-hidden />Gerar convite</button>
        {invite && (
          <div className="glass grid gap-2 p-3" data-testid="invite-box">
            <div className="mono text-2xl font-bold tracking-widest text-[var(--holo)]" data-testid="invite-code">{invite.code}</div>
            <div className="flex items-center gap-2"><input className="input mono text-sm" readOnly value={invite.url} aria-label="Link do convite" onFocus={(e) => e.target.select()} /><button className="btn icon" aria-label="Copiar link" onClick={() => navigator.clipboard?.writeText(invite.url)}><Copy className="h-4 w-4" /></button></div>
            {qr && <img src={qr} alt={`QR code do convite ${invite.code}`} width={192} height={192} className="rounded" />}
            <p className="text-xs text-muted">Vale por 7 dias e 10 usos. O código só aparece agora.</p>
          </div>)}
        <p className="text-sm text-muted">Convites ativos: {c.invites?.length ?? 0}. <Link2 className="inline h-3 w-3" aria-hidden /></p>
      </Panel>
      <Panel className="grid content-start gap-3"><h2 className="label">Ajustes da campanha</h2>
        <label className="field"><span>Quem decide o Wild Die 1 (PD-04)</span><select className="input" value={st.wildOneResolver} onChange={(e) => set({ wildOneResolver: e.target.value })}><option value="gm">O mestre (padrão)</option><option value="roller">O próprio jogador</option></select></label>
        <label className="field"><span>Visibilidade padrão das rolagens</span><select className="input" value={st.rollVisibilityDefault} onChange={(e) => set({ rollVisibilityDefault: e.target.value })}><option value="table">Toda a mesa</option><option value="gm">Só o mestre</option></select></label>
        <h3 className="label mt-2">Membros</h3>
        <ul className="grid gap-1">{c.members.map((m: any) => <li key={m.userId} className="flex items-center justify-between"><span>{m.role === 'gm' ? <Crown className="mr-1 inline h-4 w-4 text-[var(--wild)]" aria-label="mestre" /> : null}{m.name}</span>
          {m.role !== 'gm' && <button className="btn sm danger" onClick={async () => { if (confirm(`Remover ${m.name}?`)) { try { await del(`/api/campaigns/${c.campaign.id}/members/${m.userId}`); onChange(); } catch (e) { setErr(errText(e)); } } }}>Remover</button>}</li>)}</ul>
        {err && <p role="alert" className="err">{err}</p>}
      </Panel>
    </div>
  );
}

/** Grupo (jogador): cartoes ricos com o que a visibilidade permite (ficha dos colegas, sem Dark Side Points). */
function RichGroup({ party, online, meId }: { party: any[]; online: string[]; meId?: string }) {
  const qs = useQueries({ queries: party.map((p) => ({ queryKey: ['char', p.id, p.updatedAt], queryFn: () => get<{ character: any }>(`/api/characters/${p.id}`), retry: 0 })) });
  const cs = useCatalog();
  if (!party.length) return <EmptyState art="empty.party" title="Nenhum personagem na mesa">Os jogadores vinculam seus personagens à campanha.</EmptyState>;
  return (
    <ul className="grid gap-4 md:grid-cols-2" aria-label="Fichas do grupo">
      {party.map((p, i) => {
        const s = qs[i]?.data?.character?.sheet;
        return (
          <li key={p.id} className="glass chamfer-2 reticle grid min-w-0 gap-3 p-4" data-testid="rich-card" data-char={p.name}>
            <div className="flex items-center gap-3">
              <PortraitFrame mediaId={p.portraitMediaId} size={64} alt="" fallback={templateArt(p.templateType)} />
              <div className="min-w-0 flex-1"><div className="truncate text-lg font-bold">{p.name}</div><div className="truncate text-sm text-muted">{p.ownerName}{p.ownerId === meId ? ' (você)' : ''} · {p.templateType}</div></div>
              <span className="chip" style={{ color: online.includes(p.ownerId) ? 'var(--ok)' : 'var(--muted)' }}>{online.includes(p.ownerId) ? 'online' : 'off'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="chip" style={{ color: woundTone(p.woundStatus), borderColor: woundTone(p.woundStatus) }}>{WOUND_PT[p.woundStatus]}</span>
              <span className="chip" style={{ color: 'var(--cp)' }}>CP {p.characterPoints}</span><span className="chip" style={{ color: 'var(--fp)' }}>FP {p.forcePoints}</span>
              {p.forceSensitive && <span className="chip">sensível à Força</span>}
            </div>
            {!s ? <Spinner /> : (
              <>
                <div className="grid grid-cols-3 gap-1.5 text-center sm:grid-cols-6">{Object.entries(s.attributes).map(([a, v]: any) => <div key={a} className="rounded border border-[var(--line)] p-1"><div className="label">{a.slice(0, 3)}</div><div className="mono font-bold text-[var(--holo)]">{v.value.text}</div></div>)}</div>
                <p className="text-sm"><strong>Perícias: </strong>{Object.values(s.attributes).flatMap((a: any) => a.skills).slice(0, 8).map((k: any) => `${cs?.catalog.skillName(k.skill) ?? k.skill} ${k.value.text}`).join(' · ') || '—'}</p>
                {s.weapons.length > 0 && <p className="mono text-sm">{s.weapons.map((w: any) => `${w.type} ${w.damage || ''}${w.ammo_max ? ` (${w.ammo_max - (w.ammo_used ?? 0)}/${w.ammo_max})` : ''}`).join(' · ')}</p>}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
