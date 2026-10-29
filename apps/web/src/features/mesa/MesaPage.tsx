// MesaPage - modo mesa: rolador (Wild Die, acoes multiplas, CP/FP), ferimentos, round, municao e feed da campanha.
// Rolagem no servidor quando ha rede (selo "servidor"), dados fisicos digitados, e rolagem local sem rede (selo "offline").
import { ATTRS, canSpendCP, canSpendFP, applyWound, damageResult, defaultPlayState, format, mortalCheck, nextRound, parse, parseWeaponDamage, penaltyOf, poolForTarget, roll as rollLocal,
  targetsOf, validWildSeq, cpLimit, stunPenaltyCount, WOUND_STATES, type RollTarget } from '@r2d6/rules';
import { Dices, Eye, Minus, Plus, Shield, Swords, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { ErrorState, Page, Panel, PortraitFrame, Spinner, WOUND_PT, woundTone } from '@/components/ui';
import { ApiError, NetworkError, errText, post } from '@/lib/api';
import { useCatalog } from '@/lib/catalog';
import { db, type LocalChar } from '@/lib/db';
import { cn } from '@/lib/cn';
import { usePrefs } from '@/lib/prefs';
import { useSocketEvent, useRoom } from '@/lib/socket';
import { applyServerResult, editSheet, flush, pull, setPlayState, syncNow, useChar, useSync } from '@/lib/sync';
import { templateArt } from '../hangar/Hangar';
import { CHOICES, FeedList, RollSeal, type RollDTO } from '../campaigns/Feed';
import { DiceDisplay } from './DiceViews';
import { useSession } from '@/lib/auth';

const vibrate = (p: number | number[]) => { if (usePrefs.getState().vibrate && 'vibrate' in navigator) try { navigator.vibrate(p); } catch { /* sem vibracao */ } };

type View = RollDTO & { local?: boolean };

export function MesaPage() {
  const { id } = useParams();
  const ch = useChar(id);
  const cs = useCatalog();
  if (ch === undefined || !cs) return <Spinner />;
  if (ch === null) return <ErrorState art="error.not-found" title="Personagem não encontrado" />;
  return <Mesa ch={ch} />;
}

function Mesa({ ch }: { ch: LocalChar }) {
  const cs = useCatalog()!;
  const online = useSync((s) => s.online);
  const { data: session } = useSession();
  const prefs = usePrefs();
  const s = ch.sheet;
  const ps = ch.playState ?? defaultPlayState();
  const targets = useMemo(() => targetsOf(s, cs.creation.skillsById), [s, cs]);
  const [key, setKey] = useState('a:dexterity');
  const target = targets.find((t) => t.key === key) ?? targets[0];
  const [visibility, setVisibility] = useState<'table' | 'gm' | 'private'>(ch.campaignId ? 'table' : 'private');
  const [weaponIdx, setWeaponIdx] = useState(0);
  const [noStr, setNoStr] = useState(false);
  const [result, setResult] = useState<View | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [phys, setPhys] = useState<{ normals: string[]; wild: string[] }>({ normals: [], wild: [''] });
  const [showLines, setShowLines] = useState(false);

  useRoom(ch.campaignId ? { campaignId: ch.campaignId } : null);
  useSocketEvent<RollDTO>('roll:updated', (r) => { setResult((cur) => (cur && cur.id === r.id ? { ...r } : cur)); });

  const weapon = s.weapons[weaponIdx];
  const dmg = target?.rollType === 'damage' && weapon ? parseWeaponDamage(weapon.damage) : null;
  const bonus = dmg?.bonus || undefined;
  const pool = target ? poolForTarget(s, ps, target, { bonus, noStr: dmg ? !dmg.str : noStr }) : null;
  const pen = penaltyOf(s, ps);

  // dados fisicos: N-1 normais + sequencia do Wild Die
  const dice = pool?.usable ? parse(pool.code).dice : 0;
  useEffect(() => { setPhys({ normals: Array(Math.max(0, dice - 1)).fill(''), wild: [''] }); }, [dice, key]);
  const physVals = useMemo(() => {
    const normals = phys.normals.map((v) => Number(v)), wild = phys.wild.filter((v) => v !== '').map((v) => Number(v));
    const okN = normals.every((n) => Number.isInteger(n) && n >= 1 && n <= 6);
    return { normals, wild, ok: okN && wild.length > 0 && validWildSeq(wild) };
  }, [phys]);

  // ---------------------------------------------------------------- rolar
  async function doRoll() {
    if (!target || !pool?.usable) return;
    setBusy(true); setErr(null);
    const physical = prefs.rollMode === 'physical';
    if (physical && !physVals.ok) { setErr('Preencha todos os dados; o Wild Die continua enquanto sair 6 e termina em 1 a 5.'); setBusy(false); return; }
    const id = crypto.randomUUID();
    const values = physical ? { normals: physVals.normals, wild: physVals.wild } : undefined;
    try {
      if (!online) throw new NetworkError();
      await flush(); // garante que ficha/estado de mesa locais ja estao no servidor (o servidor calcula a parada)
      const r = await post('/api/rolls', { id, characterId: ch.id, targetKey: target.key, mode: physical ? 'physical' : 'digital', visibility: ch.campaignId ? visibility : 'private', damageBonus: bonus, noStr: dmg ? !dmg.str : noStr, values });
      setResult(r.roll);
      afterRoll(r.roll);
    } catch (e) {
      if (e instanceof NetworkError || (e instanceof ApiError && e.status >= 500)) await localRoll(id, physical ? values : undefined);
      else setErr(errText(e));
    } finally { setBusy(false); }
  }
  function afterRoll(r: RollDTO) {
    if (r.wild[0] === 6) vibrate(30); else if (r.wildOne) vibrate([20, 40, 20]);
    if (r.wild.length === 1 && r.wild[0] !== 1) { /* rolagem comum */ }
  }
  async function localRoll(id: string, values?: { normals: number[]; wild: number[] }) {
    // sem rede: sorteio local (selo "offline"); sobe quando a conexao voltar
    const code = pool!.code;
    const r = values ? (await import('@r2d6/rules')).rollFromValues(values.normals, values.wild, code.pips) : rollLocal(code);
    const v: View = {
      id, userId: session?.user.id ?? '', userName: session?.user.name ?? '', characterId: ch.id, characterName: ch.name, portraitMediaId: ch.portraitMediaId, campaignId: ch.campaignId,
      rollType: target!.rollType, label: target!.label, pool: { text: pool!.text, lines: pool!.lines }, mode: values ? 'physical' : 'digital', rng: 'client',
      normals: r.normals, wild: r.wild, pips: r.pips, wildOne: r.wildOne, totals: r.totals, cpDice: [], cpTotal: 0, wildOneChoice: null,
      total: r.wildOne ? null : r.totals.normal, pending: r.wildOne, visibility: 'private', createdAt: new Date().toISOString(), local: true,
    };
    setResult(v); afterRoll(v);
    await db.rolls.put({ id, characterId: ch.id, campaignId: ch.campaignId, label: v.label, poolText: v.pool.text, result: { ...r, targetKey: target!.key, values: values ?? { normals: r.normals, wild: r.wild } }, total: v.total, origin: 'offline', cpDice: [], createdAt: Date.now(), synced: false, targetKey: target!.key });
  }

  async function decide(choice: string) {
    if (!result) return;
    if (result.local) {
      const total = result.totals[choice as 'normal'];
      setResult({ ...result, wildOneChoice: choice, total, pending: false });
      await db.rolls.update(result.id, { total });
      return;
    }
    try { const r = await post(`/api/rolls/${result.id}/wild-one`, { choice }); setResult(r.roll); } catch (e) { setErr(errText(e)); }
  }

  async function spendCP(count: number) {
    if (!result) return;
    setErr(null);
    if (result.local) {
      const chk = canSpendCP(ps, result.rollType, result.cpDice.length, s.character_points);
      if (!chk.ok) return setErr(`${chk.reason} (${chk.cite})`);
      const rl = rollLocal('1D'); const extra = rl.wild; const total = extra.reduce((a, b) => a + b, 0);
      setResult({ ...result, cpDice: [...result.cpDice, extra], cpTotal: result.cpTotal + total, total: (result.total ?? 0) + total });
      await editSheet(ch.id, (d) => { d.character_points -= 1; });
      await setPlayState(ch.id, (p) => ({ ...p, cpSpent: (p.cpSpent || 0) + 1 }));
      return;
    }
    try {
      await flush();
      const r = await post(`/api/rolls/${result.id}/cp`, { count });
      setResult(r.roll); await pull();
    } catch (e) { setErr(errText(e)); }
  }

  async function toggleFP(use: boolean) {
    setErr(null);
    if (use) { const chk = canSpendFP(ps, s.force_points); if (!chk.ok) return setErr(`${chk.reason} (${chk.cite})`); }
    if (online) {
      try { await flush(); const r = await post(`/api/characters/${ch.id}/fp`, { use }); await applyServerResult(r.character); await pull(); } catch (e) { setErr(errText(e)); }
    } else {
      await editSheet(ch.id, (d) => { d.force_points += use ? -1 : 1; });
      await setPlayState(ch.id, (p) => ({ ...p, fpUsed: use }));
    }
  }

  const nextRoundNow = async () => {
    const mortal = s.wound_status === 'mortally-wounded';
    await setPlayState(ch.id, (p) => { const n = nextRound(p); if (mortal) n.mortalRounds = (p.mortalRounds || 0) + 1; return n; });
    setResult(null);
  };
  const setActions = (n: number) => setPlayState(ch.id, (p) => ({ ...p, actions: Math.max(1, Math.min(9, n)) }));

  // atalhos de teclado (PC): R rola, N proximo round, 1-9 acoes
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') || e.ctrlKey || e.metaKey) return;
      if (e.key.toLowerCase() === 'r') { e.preventDefault(); void doRoll(); }
      else if (e.key.toLowerCase() === 'n') void nextRoundNow();
      else if (/^[1-9]$/.test(e.key)) void setActions(Number(e.key));
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  const cpAvail = canSpendCP(ps, result?.rollType ?? 'skill', result?.cpDice.length ?? 0, s.character_points);
  const groups = useMemo(() => {
    const g = new Map<string, RollTarget[]>();
    for (const t of targets) g.set(t.group, [...(g.get(t.group) ?? []), t]);
    return [...g];
  }, [targets]);
  const wound = s.wound_status as string;
  const canAct = pool?.usable;

  return (
    <Page className="grid gap-4 !max-w-7xl lg:grid-cols-[1.25fr_1fr]">
      {/* ------------------------------------------------ coluna do rolador */}
      <div className="grid content-start gap-4">
        <Panel className="flex items-center gap-3">
          <PortraitFrame mediaId={ch.portraitMediaId} size={52} alt="" fallback={templateArt(ch.templateType)} />
          <div className="min-w-0 flex-1"><h1 className="truncate text-xl font-bold">{ch.name}</h1><p className="text-sm text-muted">Round <span className="mono">{ps.n}</span> · {ps.actions} ação(ões)</p></div>
          <span className="chip" style={{ color: woundTone(wound), borderColor: woundTone(wound) }} data-testid="wound-chip">{WOUND_PT[wound]}</span>
          {prefs.wake && <span className="chip" title="Tela sempre ligada neste modo"><Eye className="h-3 w-3" aria-hidden /></span>}
        </Panel>

        <Panel scan className="grid gap-3" aria-labelledby="roller">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="roller" className="label !text-[0.8rem]">Rolador · {target?.label}</h2>
            <div className="flex gap-1" role="group" aria-label="Modo de dados">
              {([['digital', 'Digital'], ['physical', 'Dados físicos']] as const).map(([m, l]) => <button key={m} className={cn('btn sm', prefs.rollMode === m && 'primary')} aria-pressed={prefs.rollMode === m} onClick={() => prefs.set({ rollMode: m })}>{l}</button>)}
            </div>
          </div>
          <div className="flex flex-wrap items-baseline gap-3" aria-live="polite">
            <span className="label">Parada</span>
            <span className="mono text-3xl font-bold text-[var(--holo)]" data-testid="pool-text">{pool?.text ?? '—'}</span>
            <span className="mono text-sm text-muted">base {target ? format(target.base) : ''}</span>
            {(pen.actions > 0 || pen.wound > 0 || pen.stuns > 0 || ps.fpUsed) && <span className="chip warnc">{[pen.actions && `ações −${pen.actions}D`, pen.wound && `ferimento −${pen.wound}D`, pen.stuns && `stun −${pen.stuns}D`, ps.fpUsed && 'FP dobra'].filter(Boolean).join(' · ')}</span>}
            <button className="btn sm ghost" onClick={() => setShowLines(!showLines)} aria-expanded={showLines}>como foi calculada</button>
          </div>
          {showLines && pool && <ul className="glass list-disc p-3 pl-7 text-sm">{pool.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>}
          {!canAct && pool && <p role="alert" className="err">{pool.lines[pool.lines.length - 1]}</p>}

          {target?.rollType === 'damage' && (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="field"><span>Arma</span><select className="input" value={weaponIdx} onChange={(e) => setWeaponIdx(Number(e.target.value))}>{s.weapons.length ? s.weapons.map((w: any, i: number) => <option key={i} value={i}>{w.type} ({w.damage || '—'})</option>) : <option>(sem arma: só Strength)</option>}</select></label>
              {!dmg && <label className="flex items-center gap-2 self-end"><input type="checkbox" className="h-5 w-5" checked={noStr} onChange={(e) => setNoStr(e.target.checked)} />Arma de dano fixo (sem Strength)</label>}
            </div>
          )}

          {prefs.rollMode === 'physical' && canAct && (
            <fieldset className="grid gap-2">
              <legend className="label">Valores que saíram na mesa</legend>
              <div className="flex flex-wrap items-center gap-2">
                {phys.normals.map((v, i) => <input key={i} className="die-n mono !w-12 text-center" inputMode="numeric" maxLength={1} aria-label={`Dado normal ${i + 1}`} value={v} onChange={(e) => setPhys((p) => ({ ...p, normals: p.normals.map((x, k) => (k === i ? e.target.value.replace(/[^1-6]/g, '') : x)) }))} />)}
                <span className="flex items-center gap-1 rounded-lg border border-dashed border-[var(--wild)]/60 p-1">
                  {phys.wild.map((v, i) => <input key={i} className="die-w hex mono !w-14 text-center !text-[1.3rem]" inputMode="numeric" maxLength={1} aria-label={i === 0 ? 'Wild Die' : `Wild Die (continuação ${i})`} value={v}
                    onChange={(e) => { const nv = e.target.value.replace(/[^1-6]/g, ''); setPhys((p) => { const w = p.wild.slice(0, i); w[i] = nv; if (nv === '6') w.push(''); return { ...p, wild: w }; }); }} />)}
                  <span className="mono text-[0.65rem] font-bold tracking-widest text-[var(--wild)]">WILD</span></span>
              </div>
              <p className="text-xs text-muted">O Wild Die explode no 6: digite 6 e o próximo campo aparece.</p>
            </fieldset>
          )}

          {ch.campaignId && (
            <label className="field w-fit"><span>Quem vê</span><select className="input" value={visibility} onChange={(e) => setVisibility(e.target.value as any)}><option value="table">Toda a mesa</option><option value="gm">Só o mestre</option><option value="private">Só eu</option></select></label>
          )}

          <button className="btn primary big" disabled={busy || !canAct || (prefs.rollMode === 'physical' && !physVals.ok)} onClick={doRoll} data-testid="roll-button"><Dices className="h-5 w-5" aria-hidden />{busy ? 'Rolando…' : prefs.rollMode === 'physical' ? 'Registrar rolagem' : 'Rolar'} <kbd className="mono ml-1 hidden text-xs opacity-70 lg:inline">R</kbd></button>
          {!online && <p className="warnc text-sm" role="status">Sem rede: a rolagem será local (selo offline) e sobe quando a conexão voltar.</p>}
          {err && <p role="alert" className="err">{err}</p>}

          {result && (
            <div className="grid gap-3 border-t border-[var(--line)] pt-3" data-testid="result" data-roll-id={result.id} aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="label">{result.label} · {result.pool.text}</span><RollSeal r={result} /></div>
              <DiceDisplay r={{ normals: result.normals, wild: result.wild, cp: result.cpDice }} rollKey={result.id + result.cpDice.length} />
              <div className="flex items-end justify-between gap-3">
                <div>{result.pending ? <div className="mesa-total pulse" style={{ color: 'var(--dark)' }} aria-label="aguardando decisão">?</div> : <div className="mesa-total text-[var(--holo)]" data-testid="total">{result.total}</div>}
                  {result.pips > 0 && <span className="mono text-sm text-muted">inclui +{result.pips} pips</span>}</div>
                {!result.pending && result.cpTotal > 0 && <span className="chip" style={{ color: 'var(--cp)' }}>+{result.cpTotal} de CP</span>}
              </div>
              {result.pending && (
                <div className="glass grid gap-2 p-3" style={{ borderColor: 'var(--dark)' }} role="group" aria-label="Decisão do Wild Die 1">
                  <strong style={{ color: 'var(--dark)' }}>Wild Die saiu 1 (RD-03).</strong>
                  {result.campaignId && !result.local ? <p className="text-sm">Aguardando a decisão do mestre no feed da mesa…</p> : (
                    <div className="grid gap-2 sm:grid-cols-3">{CHOICES.map(([k, l, tip]) => <button key={k} className="btn" title={tip} onClick={() => decide(k)}>{l} <span className="mono">({result.totals[k as 'normal']})</span></button>)}</div>)}
                </div>
              )}
              {result.wildOneChoice === 'complication' && <p role="status" style={{ color: 'var(--dark)' }}><strong>Complicação:</strong> o mestre define o que dá errado.</p>}
              {!result.pending && cpLimit(result.rollType) > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="label">Character Points</span>
                  {[1, 2].filter((n) => n <= cpLimit(result.rollType)).map((n) => <button key={n} className="btn sm" style={{ borderColor: 'var(--cp)' }} disabled={!cpAvail.ok || result.cpDice.length + n > cpLimit(result.rollType) || s.character_points < n} onClick={() => spendCP(n)} title={!cpAvail.ok ? `${cpAvail.reason} (${cpAvail.cite})` : undefined}>+{n} CP</button>)}
                  {!cpAvail.ok && <span className="text-xs text-muted">{cpAvail.reason}</span>}
                </div>
              )}
            </div>
          )}
        </Panel>

        <Panel className="grid gap-3">
          <h2 className="label !text-[0.8rem]">O que rolar</h2>
          {groups.map(([g, list]) => (
            <div key={g}><div className="label mb-1">{g}</div>
              <div className="flex flex-wrap gap-1.5">{list.map((t) => (
                <button key={t.key} className={cn('btn sm', t.key === target?.key && 'primary')} aria-pressed={t.key === target?.key} onClick={() => setKey(t.key)}>{t.label} <span className="mono opacity-70">{format(t.base)}</span></button>))}</div></div>
          ))}
        </Panel>
      </div>

      {/* ------------------------------------------------ coluna de estado */}
      <div className="grid content-start gap-4">
        <Panel className="grid gap-3" aria-labelledby="round">
          <h2 id="round" className="label !text-[0.8rem]">Round e ações</h2>
          <div className="flex items-center justify-between">
            <div><div className="label">Round</div><div className="mono text-3xl font-bold">{ps.n}</div></div>
            <div className="grid justify-items-center gap-1"><div className="label">Ações declaradas</div>
              <div className="flex items-center gap-1.5"><button className="btn icon" aria-label="Menos uma ação" disabled={ps.actions <= 1} onClick={() => setActions(ps.actions - 1)}><Minus className="h-4 w-4" /></button>
                <output className="mono w-8 text-center text-2xl font-bold" data-testid="actions">{ps.actions}</output>
                <button className="btn icon" aria-label="Mais uma ação" disabled={ps.actions >= 9} onClick={() => setActions(ps.actions + 1)}><Plus className="h-4 w-4" /></button></div></div>
            <button className="btn" onClick={nextRoundNow}>Próximo round <kbd className="mono hidden text-xs opacity-70 lg:inline">N</kbd></button>
          </div>
          <p className="text-xs text-muted">Penalidade por ações: −{pen.actions}D (RD-07). Próximo round libera CP/FP e zera as ações.</p>
        </Panel>

        <Panel className="grid gap-3" aria-labelledby="pts">
          <h2 id="pts" className="label !text-[0.8rem]">Pontos</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><div className="label">CP</div><div className="mono text-3xl font-bold" style={{ color: 'var(--cp)' }} data-testid="cp">{s.character_points}</div><div className="text-xs text-muted">gastos no round: {ps.cpSpent}</div></div>
            <div><div className="label">FP</div><div className="mono text-3xl font-bold" style={{ color: 'var(--fp)' }} data-testid="fp">{s.force_points}</div><div className="text-xs text-muted">{ps.fpUsed ? 'usado neste round' : 'livre'}</div></div>
            <div><div className="label">DSP</div><div className="mono text-3xl font-bold" style={{ color: 'var(--dark)' }}>{s.dark_side_points ?? 0}</div></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!ps.fpUsed ? <button className="btn" style={{ borderColor: 'var(--fp)' }} disabled={!canSpendFP(ps, s.force_points).ok} title={!canSpendFP(ps, s.force_points).ok ? canSpendFP(ps, s.force_points).reason : 'Dobra seus códigos até o fim do round (p.85)'} onClick={() => toggleFP(true)} data-testid="spend-fp"><Zap className="h-4 w-4" aria-hidden />Gastar Force Point</button>
              : <button className="btn" onClick={() => toggleFP(false)}>Desfazer Force Point</button>}
            <button className="btn sm ghost" onClick={() => editSheet(ch.id, (d) => { d.character_points += 1; })} aria-label="Ganhar 1 CP">+1 CP</button>
          </div>
          {!canSpendFP(ps, s.force_points).ok && !ps.fpUsed && <p className="text-xs text-muted">{canSpendFP(ps, s.force_points).reason}</p>}
        </Panel>

        <WoundCard ch={ch} />
        <AmmoCard ch={ch} />
        {ch.campaignId && (
          <Panel className="grid gap-2" aria-labelledby="feed-h"><h2 id="feed-h" className="label !text-[0.8rem]">Mesa</h2>
            <FeedList campaignId={ch.campaignId} isGm={false} userId={session?.user.id} limit={6} /></Panel>
        )}
      </div>

      {/* botao de rolar sempre ao alcance do polegar (celular) */}
      <button className="btn primary fixed bottom-[4.6rem] right-4 z-20 h-14 w-14 rounded-full p-0 shadow-lg lg:hidden" aria-label="Rolar" disabled={busy || !canAct} onClick={doRoll}><Dices className="h-6 w-6" /></button>
    </Page>
  );
}

// ------------------------------------------------------------------ ferimentos
const HEAL: Record<string, string> = { killed: 'killed', 'mortally-wounded': 'incapacitated', incapacitated: 'wounded-twice', 'wounded-twice': 'wounded', wounded: 'healthy', healthy: 'healthy' };

function WoundCard({ ch }: { ch: LocalChar }) {
  const s = ch.sheet, ps = ch.playState ?? defaultPlayState();
  const [dmg, setDmg] = useState(''), [res, setRes] = useState(''), [stunW, setStunW] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [mortal, setMortal] = useState<string | null>(null);
  const wound = s.wound_status as string;
  const stuns = stunPenaltyCount(ps.stuns, ps.n);
  const diff = Number(dmg) - Number(res);
  const outcome = dmg !== '' && res !== '' ? damageResult(diff) : null;

  const apply = async () => {
    if (!outcome) return;
    const r = applyWound(wound, outcome, { stunWeapon: stunW });
    if (r.status !== wound) await editSheet(ch.id, (d) => { d.wound_status = r.status; });
    if (r.addStun) await setPlayState(ch.id, (p) => ({ ...p, stuns: [...(p.stuns || []), p.n] }));
    setNote([r.addStun && 'Stun registrado (−1D neste round e no seguinte, RD-20).', r.unconscious2D && r.note, r.house && r.note, r.status !== wound && `Ferimento: ${WOUND_PT[r.status]}.`].filter(Boolean).join(' ') || 'Sem efeito.');
  };
  return (
    <Panel className="grid gap-3" aria-labelledby="wound">
      <h2 id="wound" className="label !text-[0.8rem]">Ferimentos</h2>
      <div className={cn('flex items-center justify-between gap-2')} key={wound}>
        <div className={cn('mono text-xl font-bold', wound !== 'healthy' && 'hurt')} style={{ color: woundTone(wound) }} data-testid="wound">{WOUND_PT[wound]}</div>
        <span className="chip">stuns ativos: {stuns}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {WOUND_STATES.filter((w) => w !== 'stunned').map((w) => <button key={w} className={cn('btn sm', w === wound && 'primary')} aria-pressed={w === wound} onClick={() => editSheet(ch.id, (d) => { d.wound_status = w; })}>{WOUND_PT[w]}</button>)}
        <button className="btn sm ghost" onClick={() => editSheet(ch.id, (d) => { d.wound_status = HEAL[d.wound_status]; })}>Curar um nível</button>
      </div>
      <div className="grid gap-2 border-t border-[var(--line)] pt-2">
        <span className="label flex items-center gap-1"><Swords className="h-3 w-3" aria-hidden />Dano × Resistência (RD-17)</span>
        <div className="grid grid-cols-2 gap-2">
          <label className="field"><span>Dano</span><input className="input mono" inputMode="numeric" value={dmg} onChange={(e) => setDmg(e.target.value.replace(/\D/g, ''))} /></label>
          <label className="field"><span>Resistência</span><input className="input mono" inputMode="numeric" value={res} onChange={(e) => setRes(e.target.value.replace(/\D/g, ''))} /></label>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={stunW} onChange={(e) => setStunW(e.target.checked)} />Arma em stun</label>
        {outcome && <p role="status">Diferença <span className="mono">{diff}</span> → <strong style={{ color: outcome === 'none' ? 'var(--ok)' : 'var(--warn)' }}>{outcome === 'none' ? 'sem efeito' : WOUND_PT[outcome] ?? outcome}</strong></p>}
        <button className="btn" disabled={!outcome || outcome === 'none'} onClick={apply}><Shield className="h-4 w-4" aria-hidden />Aplicar ao personagem</button>
        {note && <p role="status" className="text-sm text-muted">{note}</p>}
      </div>
      {wound === 'mortally-wounded' && (
        <div className="glass grid gap-2 p-2" style={{ borderColor: 'var(--dark)' }}>
          <span>Mortally Wounded há <strong className="mono">{ps.mortalRounds}</strong> round(s). Rolar 2D: se for menor que os rounds, morre (RD-25).</span>
          <button className="btn sm w-fit" onClick={() => { const t = rollLocal('2D').totals.normal; const m = mortalCheck(t, ps.mortalRounds); setMortal(`2D = ${t} · ${m.dies ? 'MORRE' : 'sobrevive'}`); }}>Rolar 2D</button>{mortal && <span role="status" className="mono">{mortal}</span>}
        </div>
      )}
      {stuns > 0 && ATTRS && <p className="text-xs text-muted">Stuns somam −1D cada nas rolagens (regra da casa RD-21).</p>}
    </Panel>
  );
}

function AmmoCard({ ch }: { ch: LocalChar }) {
  const ws: any[] = ch.sheet.weapons;
  if (!ws.length) return null;
  return (
    <Panel className="grid gap-2" aria-labelledby="ammo">
      <h2 id="ammo" className="label !text-[0.8rem]">Munição</h2>
      {ws.map((w, i) => {
        const left = (w.ammo_max ?? 0) - (w.ammo_used ?? 0);
        return (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="min-w-0"><div className="truncate font-semibold">{w.type}</div><div className="mono text-sm text-muted">{w.damage || '—'}</div></div>
            <div className="flex items-center gap-1.5">
              <button className="btn icon" aria-label={`Recarregar ${w.type}`} title="Recarregar" onClick={() => editSheet(ch.id, (d) => { d.weapons[i].ammo_used = 0; })}>↺</button>
              <button className="btn" aria-label={`Atirar com ${w.type}`} disabled={w.ammo_max > 0 && left <= 0} onClick={() => editSheet(ch.id, (d) => { d.weapons[i].ammo_used += 1; })}>−1 tiro</button>
              <output className="mono w-16 text-right text-xl font-bold" style={{ color: w.ammo_max > 0 && left <= 0 ? 'var(--dark)' : undefined }} aria-label={`${left} de ${w.ammo_max} tiros`}>{w.ammo_max ? `${left}/${w.ammo_max}` : w.ammo_used}</output>
            </div>
          </div>
        );
      })}
    </Panel>
  );
}

export { syncNow };
