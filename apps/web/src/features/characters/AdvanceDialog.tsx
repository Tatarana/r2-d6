// AdvanceDialog - evolucao entre aventuras (B-111, p.25-28): escolhe o que melhorar, mostra custo em CP e tempo de treino,
// faz o teste de teto do atributo e aplica na ficha (o historico de versoes registra a mudanca).
import { advanceOptions, applyAdvance, ceilingCheck, effectiveCost, roll as rollDice, trainingTime } from '@r2d6/rules';
import { TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Modal } from '@/components/ui';
import { useCatalog } from '@/lib/catalog';
import type { LocalChar } from '@/lib/db';
import { editSheet } from '@/lib/sync';

export function AdvanceButton({ ch }: { ch: LocalChar }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn sm" onClick={() => setOpen(true)} data-testid="advance-open"><TrendingUp className="h-4 w-4" aria-hidden />Evoluir</button>
      {open && <AdvanceDialog ch={ch} onClose={() => setOpen(false)} />}
    </>
  );
}

function AdvanceDialog({ ch, onClose }: { ch: LocalChar; onClose: () => void }) {
  const cs = useCatalog()!;
  const s = ch.sheet;
  const options = useMemo(() => advanceOptions(s, {
    skills: cs.bundle.entities.skills, skillsById: cs.creation.skillsById, advancedPrereqs: cs.bundle.derived.advanced_prereqs,
    speciesBlock: s.species ? cs.creation.speciesBlock(s.species) : null,
  }), [s, cs]);
  const groups = useMemo(() => [...new Set(options.map((o) => o.group))], [options]);
  const [key, setKey] = useState('');
  const [teacher, setTeacher] = useState(true);
  const [used, setUsed] = useState(false);
  const [extra, setExtra] = useState(0);
  const [player, setPlayer] = useState(''), [gm, setGm] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const opt = options.find((o) => o.key === key) ?? null;

  const cost = opt ? effectiveCost(opt, teacher) : 0;
  const time = opt ? trainingTime(opt, { teacher, usedLastAdventure: used, extraCP: extra }) : null;
  const spent = cost + (time?.extraUsed ?? 0);
  const enough = spent <= (s.character_points ?? 0);
  const usedApplies = opt && ['skill', 'specialization', 'newSkill'].includes(opt.kind);
  const isAttr = opt?.kind === 'attribute';
  const ceil = isAttr && player !== '' && gm !== '' ? ceilingCheck(Number(player), Number(gm), cost) : null;
  const canApply = !!opt && !opt.blocked && enough && (!isAttr || !!ceil);

  const pick = (k: string) => { setKey(k); setUsed(false); setExtra(0); setPlayer(''); setGm(''); setDone(null); };
  const apply = async () => {
    if (!opt || !canApply) return;
    if (ceil && !ceil.ok) {
      // falhou no teto: o atributo nao sobe e volta metade do custo (o CP extra do treino nao volta)
      await editSheet(ch.id, (d) => { d.character_points = Math.max(0, (d.character_points ?? 0) - (spent - ceil.refund)); });
      setDone(`Teste de teto falhou: ${opt.label} continua ${opt.current}; ${spent - ceil.refund} CP gastos (${ceil.refund} devolvidos).`);
      return;
    }
    let msg = '';
    await editSheet(ch.id, (d) => { msg = applyAdvance(d, opt, spent, cs.creation.skillsById); });
    setDone(`${msg}. Treino: ${time!.text}.`);
  };

  return (
    <Modal open onOpenChange={(o) => { if (!o) onClose(); }} title="Evoluir personagem" wide>
      <div className="grid gap-3">
        <p className="text-sm text-muted">Gaste Character Points entre aventuras (p.25-28). Você tem <strong className="mono text-[var(--cp)]">{s.character_points ?? 0} CP</strong>. Uma perícia sobe no máximo 1 pip entre aventuras.</p>
        <label className="field"><span>O que melhorar</span>
          <select className="input" value={key} onChange={(e) => pick(e.target.value)} data-testid="advance-pick">
            <option value="">Escolha…</option>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {options.filter((o) => o.group === g).map((o) => (
                  <option key={o.key} value={o.key} disabled={!!o.blocked}>{o.label}: {o.current} → {o.next} · {o.cost} CP{o.blocked ? ` (${o.blocked})` : ''}</option>
                ))}
              </optgroup>
            ))}
          </select></label>

        {opt && (
          <>
            {opt.blocked && <p role="alert" className="err">{opt.blocked}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {opt.kind !== 'sensitive' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={teacher} onChange={(e) => setTeacher(e.target.checked)} />Tem professor (valor ≥ {opt.next})</label>}
              {usedApplies && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={used} onChange={(e) => setUsed(e.target.checked)} />Usou na última aventura (sem treino)</label>}
            </div>
            {time && time.base > time.minDays && (
              <label className="field w-fit"><span>CP extra para cortar dias de treino</span>
                <input className="input mono !w-24" type="number" min={0} max={time.base - time.minDays} value={extra} onChange={(e) => setExtra(Math.max(0, Math.min(time.base - time.minDays, Number(e.target.value) || 0)))} /></label>
            )}
            <div className="glass grid gap-1 p-3 text-sm" role="status">
              <div><strong>{opt.label}</strong>: <span className="mono">{opt.current}</span> → <span className="mono text-[var(--holo)]">{opt.next}</span></div>
              <div>Custo: <span className="mono">{cost} CP</span>{opt.kind === 'force' && !teacher && ' (dobro sem professor, p.151)'}{time?.extraUsed ? <> + <span className="mono">{time.extraUsed} CP</span> para cortar treino = <strong className="mono">{spent} CP</strong></> : null}</div>
              {time && <div>Treino: <strong>{time.text}</strong>{time.days > 0 && ' · a melhora só vale ao terminar; uma coisa por vez, fora de aventura'}</div>}
              {opt.kind === 'attribute' && <div className="text-muted">As perícias deste atributo (menos as avançadas) sobem 1 pip junto.</div>}
              {!enough && <div className="err">CP insuficientes.</div>}
            </div>

            {isAttr && (
              <fieldset className="grid gap-2">
                <legend className="label">Teste de teto (p.27), ao fim do treino</legend>
                <p className="text-sm text-muted">O jogador rola o novo valor ({opt.next}); o mestre rola o máximo da espécie ({opt.ceiling ?? 'veja a espécie'}). Se o jogador tirar mais, o atributo não sobe e volta metade dos CP.</p>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="field"><span>Jogador ({opt.next})</span><input className="input mono !w-24" inputMode="numeric" value={player} onChange={(e) => setPlayer(e.target.value.replace(/\D/g, ''))} /></label>
                  <button className="btn sm" onClick={() => setPlayer(String(rollDice(opt.next).totals.normal))}>Rolar</button>
                  <label className="field"><span>Mestre ({opt.ceiling ?? 'máximo'})</span><input className="input mono !w-24" inputMode="numeric" value={gm} onChange={(e) => setGm(e.target.value.replace(/\D/g, ''))} /></label>
                  {opt.ceiling && <button className="btn sm" onClick={() => setGm(String(rollDice(opt.ceiling!).totals.normal))}>Rolar</button>}
                </div>
                {ceil && <p role="status" className={ceil.ok ? 'text-[var(--ok)]' : 'err'}>{ceil.ok ? 'Passou: o atributo sobe.' : `Falhou: não sobe e voltam ${ceil.refund} CP.`}</p>}
              </fieldset>
            )}
          </>
        )}

        {done && <p role="status" className="glass p-3 text-sm" data-testid="advance-done">{done}</p>}
        <div className="flex justify-end gap-2">
          <button className="btn" onClick={onClose}>{done ? 'Fechar' : 'Cancelar'}</button>
          {!done && <button className="btn primary" disabled={!canApply} onClick={apply} data-testid="advance-apply">Aplicar</button>}
        </div>
      </div>
    </Modal>
  );
}

