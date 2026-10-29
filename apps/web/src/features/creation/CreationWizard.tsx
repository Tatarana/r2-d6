// CreationWizard - assistente de criacao em 8 passos (porta de app/js/views/creation.js; logica pura em @r2d6/rules/creation).
// Salva no servidor (via fila offline). Limites do livro bloqueiam; leituras provisorias e regras da casa aparecem como selos.
import { ATTRS, ATTR_ABBR, FORCE_SKILLS, SKILL_CAP_DICE, ADVANCED_START, STEPS, STEP_CITE, STEP_RULE, checkAdvancedPrereq, format, freshWizard, fromPips, parse, purchase, scratchBudget,
  specializationValue, speciesLimitWarnings, startingPoints, templateDiceTotals, toPips, validateScratchAttributes, type Wizard } from '@r2d6/rules';
import { Check, ChevronLeft, ChevronRight, Minus, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { openRef } from '@/components/AppShell';
import { ArtSlot, artItem } from '@/components/ArtSlot';
import { Page, Panel, Seal, Spinner } from '@/components/ui';
import { useCatalog } from '@/lib/catalog';
import { createLocal } from '@/lib/sync';
import { cn } from '@/lib/cn';
import { RefBrowser } from '../reference/RefBrowser';
import { usePlatform } from '@/components/AppShell';
import { slugify } from '../hangar/Hangar';

const Msgs = ({ items, cls }: { items: { rd: string; msg: string; house?: boolean }[]; cls: string }) => (items.length ? (
  <ul className={cn('grid gap-1 text-sm', cls)} role={cls === 'err' ? 'alert' : undefined}>{items.map((m, i) => <li key={i}>{m.msg} {m.house ? <Seal kind="casa">{m.rd}</Seal> : <small className="text-muted">{m.rd}</small>}</li>)}</ul>) : null);

function Step({ onClick, children, disabled, label }: { onClick: () => void; children: ReactNode; disabled?: boolean; label: string }) {
  return <button type="button" className="btn icon sm" aria-label={label} disabled={disabled} onClick={onClick}>{children}</button>;
}

export function CreationWizard() {
  const cs = useCatalog();
  const nav = useNavigate();
  const { platform } = usePlatform();
  const [wiz, setWiz] = useState<Wizard>(freshWizard);
  const [, tick] = useState(0);
  const [saving, setSaving] = useState(false);
  const [ctxPath, setCtxPath] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const W = cs?.creation;
  const C = cs?.catalog;
  const upd = (fn: (w: Wizard) => void) => { fn(wiz); tick((n) => n + 1); };
  const replace = (w: Wizard) => { setWiz(w); setCtxPath(null); };
  const stepKey = STEPS[wiz.step][0];
  useEffect(() => { setCtxPath(null); window.scrollTo?.(0, 0); }, [wiz.step]);

  const sv = useMemo(() => (W && wiz.attrs ? W.validateSkills(wiz) : null), [W, wiz, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!W || !C) return <Spinner label="Carregando regras…" />;

  const tpl = W.tpl(wiz);
  const mode = W.mode(wiz);
  const block = W.block(wiz);
  const sens = W.sensitivity(wiz);
  const sensitive = W.isSensitive(wiz);
  const remaining = sv ? toPips(sv.budget) - toPips(sv.used) : 0;

  // ---------------------------------------------------------------- passos
  const stepOrigin = () => {
    const ts = [...C.listOf('templates')].sort((a: any, b: any) => a.type.localeCompare(b.type));
    return (
      <div className="grid gap-4">
        <div><h2 className="text-xl font-bold">De onde vem o personagem?</h2><p className="text-muted">Template: atributos, perícias e equipamento prontos (cap. 23). Do zero: espécie + 6D para distribuir (p.23-24).</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {([['template', 'Por template', 'create.path.template', 'Escolha um dos 26 modelos do livro e ajuste.'], ['scratch', 'Do zero', 'create.path.scratch', 'Espécie + 6D de atributos, você monta tudo.']] as const).map(([k, l, art, d]) => (
            <button key={k} type="button" aria-pressed={wiz.origin === k} className={cn('glass chamfer overflow-hidden text-left', wiz.origin === k && 'glow')} onClick={() => (k === 'scratch' ? replace(W.pickScratch()) : upd((w) => { w.origin = 'template'; }))}>
              <ArtSlot id={art} className="w-full" decorative /><div className="p-3"><strong className="text-lg">{l}</strong><p className="text-sm text-muted">{d}</p></div>
            </button>
          ))}
        </div>
        {wiz.origin === 'template' && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" role="list" aria-label="Templates">
            {ts.map((t: any) => {
              const tot = templateDiceTotals(t);
              const art = artItem(`template.${slugify(t.type)}`) ? `template.${slugify(t.type)}` : 'template.smuggler';
              return (
                <button key={t.id} role="listitem" type="button" aria-pressed={wiz.templateId === t.id} className={cn('glass chamfer-2 overflow-hidden text-left transition-transform hover:-translate-y-0.5', wiz.templateId === t.id && 'glow reticle')}
                  onClick={() => replace(W.pickTemplate(t))} data-testid={`tpl-${t.id}`}>
                  <ArtSlot id={art} className="w-full" decorative />
                  <div className="p-2.5"><strong>{t.type}</strong><div className="mono text-xs text-muted">{tot.totalText} · Move {t.move} · p.{t.page}</div>{t.force_skills && <Seal kind="raw">Força</Seal>}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const stepSpecies = () => {
    if (mode === 'droid') return <div><h2 className="text-xl font-bold">Espécie</h2><p>Protocol Droid é um droide: sem espécie. Atributos fixos e 17D de perícias, máximo 2D por perícia (RD-34).</p></div>;
    const sp = wiz.speciesId ? W.speciesById.get(wiz.speciesId) : null;
    const ms = wiz.speciesId ? C.bundle.derived.species_move_start[wiz.speciesId] : null;
    return (
      <div className="grid gap-3">
        <h2 className="text-xl font-bold">Espécie</h2>
        {wiz.origin === 'template' && <p className="text-muted">{wiz.speciesId ? `Espécie sugerida para ${tpl?.type} (RD-34). Em templates, os limites da espécie só geram avisos.` : 'Este template aceita qualquer espécie: escolha uma.'}</p>}
        <label className="field"><span>Espécie</span>
          <select className="input" value={wiz.speciesId ?? ''} onChange={(e) => upd((w) => W.pickSpecies(w, e.target.value))}>
            <option value="">(escolha)</option>{C.listOf('species').map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        {sp && sp.stat_blocks.length > 1 && <label className="field"><span>Variante</span><select className="input" value={wiz.blockIdx} onChange={(e) => upd((w) => { const i = Number(e.target.value); W.pickSpecies(w, w.speciesId); w.blockIdx = i; })}>{sp.stat_blocks.map((x: any, i: number) => <option key={i} value={i}>{x.stat_block}</option>)}</select></label>}
        {sp && block && (
          <Panel className="grid gap-2">
            <div className="flex gap-3"><ArtSlot id={`species.${sp.id}`} className="w-24 shrink-0" /><div><h3 className="font-bold">{sp.name} <span className="pg">(p.{block.page || sp.page})</span></h3>
              <p className="text-sm">Atributos: {block.attribute_dice} · Move inicial {ms?.[wiz.blockIdx]?.move_start ?? '?'} (“{block.move}”, RD-42) · {block.size || ''}</p></div></div>
            {block.attributes && <div className="tbl-wrap"><table className="prose"><thead><tr><th />{ATTRS.map((a) => <th key={a}>{ATTR_ABBR[a as keyof typeof ATTR_ABBR]}</th>)}</tr></thead><tbody>
              <tr><th>mín</th>{ATTRS.map((a) => <td key={a} className="mono">{block.attributes[a].min.text}</td>)}</tr><tr><th>máx</th>{ATTRS.map((a) => <td key={a} className="mono">{block.attributes[a].max.text}</td>)}</tr></tbody></table></div>}
            {(block.special_abilities || []).length > 0 && <div className="glass p-2 text-sm" style={{ borderColor: 'var(--warn)' }}><strong>Habilidades especiais (aplique manualmente):</strong><ul className="list-disc pl-5">{block.special_abilities.map((t: string, i: number) => <li key={i}>{t}</li>)}</ul></div>}
          </Panel>
        )}
        {wiz.origin === 'scratch' && block && !scratchBudget(block) && (
          <div className="glass p-3" style={{ borderColor: 'var(--warn)' }}><p>O total de atributos desta espécie é texto livre (“{block.attribute_dice}”). Informe o total de dados de atributos (inclui o +6D):</p>
            <label className="field mt-2 w-40"><span>Total (D)</span><input className="input" type="number" min={1} value={wiz.manualBudget} onChange={(e) => upd((w) => { w.manualBudget = Number(e.target.value); })} /></label></div>
        )}
      </div>
    );
  };

  const stepAttrs = () => {
    if (!wiz.attrs) return <p className="text-muted">Escolha a espécie antes.</p>;
    if (mode !== 'scratch') {
      const tot = templateDiceTotals(tpl);
      return (
        <div className="grid gap-3"><h2 className="text-xl font-bold">Atributos do template</h2>
          <p className="text-muted">Valores impressos (p.{tpl.page}). Total: {tpl.attribute_total}{tot.forcePips ? ` + ${format(fromPips(tot.forcePips))} de Força = ${tot.totalText}` : ''} (RD-33).</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{ATTRS.map((a) => <div key={a} className="glass p-3 text-center"><div className="label">{ATTR_ABBR[a as keyof typeof ATTR_ABBR]}</div><div className="mono text-2xl font-bold text-[var(--holo)]">{format(W.attrCode(wiz, a))}</div></div>)}</div>
          <Msgs items={speciesLimitWarnings(wiz.attrs, block)} cls="warnc" /></div>
      );
    }
    const res = validateScratchAttributes(wiz.attrs, block, W.forceDiceForBudget(wiz), W.scratchBudgetOverride(wiz) as any);
    return (
      <div className="grid gap-3"><h2 className="text-xl font-bold">Distribua os atributos</h2>
        <p className="text-muted">Total disponível: {res.budget ? format(res.budget) : '?'} (espécie + 6D). 3 pips = 1D (RD-01). Usado: <strong className="mono">{format(res.used)}</strong>{W.forceDiceForBudget(wiz) ? ` (inclui ${W.forceDiceForBudget(wiz)}D de Força)` : ''}.</p>
        {ATTRS.map((a) => {
          const v = toPips(W.attrCode(wiz, a)); const lim = block?.attributes?.[a]; const min = lim ? toPips(lim.min) : 3; const max = lim ? toPips(lim.max) : 60;
          const setv = (n: number) => upd((w) => { w.attrs![a] = fromPips(n); });
          return (
            <div key={a} className="glass flex flex-wrap items-center justify-between gap-2 p-2"><span><strong>{ATTR_ABBR[a as keyof typeof ATTR_ABBR]}</strong> <small className="text-muted">{lim ? `${lim.min.text} a ${lim.max.text}` : ''}</small></span>
              <span className="flex items-center gap-1"><button type="button" className="btn sm" disabled={v - 3 < min} onClick={() => setv(v - 3)} aria-label={`${a} menos 1D`}>−1D</button><Step label={`${a} menos 1 pip`} disabled={v - 1 < min} onClick={() => setv(v - 1)}><Minus className="h-4 w-4" /></Step>
                <output className="mono w-16 text-center text-xl font-bold text-[var(--holo)]">{format(W.attrCode(wiz, a))}</output>
                <Step label={`${a} mais 1 pip`} disabled={v + 1 > max} onClick={() => setv(v + 1)}><Plus className="h-4 w-4" /></Step><button type="button" className="btn sm" disabled={v + 3 > max} onClick={() => setv(v + 3)} aria-label={`${a} mais 1D`}>+1D</button></span></div>
          );
        })}
        <Msgs items={res.errors} cls="err" /><Msgs items={res.warnings} cls="warnc" /></div>
    );
  };

  const skillRow = (id: string, extra = false) => {
    const s = W.skillsById.get(id);
    const added = wiz.skills[id] || { dice: 0, pips: 0 };
    const ids = W.listedIds(wiz);
    const notListed = !s.advanced && ids && !ids.has(id) && !wiz.perms[id];
    const cap = SKILL_CAP_DICE * 3;
    const why = (need: number) => (notListed ? 'precisa da permissão do mestre' : toPips(added) + need > cap ? `teto de ${SKILL_CAP_DICE}D na criação (p.21)` : remaining < need ? 'sem dados de perícia restantes' : '');
    const set = (dice: number, pips: number) => upd((w) => { w.skills[id] = { dice: Math.max(0, dice), pips: Math.max(0, pips) }; });
    const entry = W.listedEntries(wiz).find((e: any) => e.skill_id === id);
    return (
      <div key={id} className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] py-1.5">
        <span><button type="button" className="font-semibold text-[var(--holo)] hover:underline" onClick={() => { setCtxPath(`/consulta/skills/${id}`); openIfNarrow(id); }}>{s.name}{s.advanced ? ' (A)' : ''}</button>{entry?.alias && <> <Seal kind="prov">E-061</Seal><small className="text-muted"> (“{entry.name}”)</small></>}</span>
        <span className="flex items-center gap-1.5">
          {extra && <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!wiz.perms[id]} onChange={(e) => upd((w) => { w.perms[id] = e.target.checked; })} />mestre permite</label>}
          {!s.advanced && <small className="mono text-muted">{format(W.attrCode(wiz, s.attribute))}</small>}
          <Step label={`${s.name} menos 1D`} disabled={!toPips(added)} onClick={() => set(added.dice - 1, added.pips)}><Minus className="h-4 w-4" /></Step>
          <output className="mono w-10 text-center">+{format(added)}</output>
          <button type="button" className="btn icon sm" aria-label={`${s.name} mais 1D`} disabled={!!why(3)} title={why(3) || undefined} onClick={() => set(added.dice + 1, added.pips)}><Plus className="h-4 w-4" /></button>
          {wiz.allowPips && <button type="button" className="btn sm" disabled={added.pips < 2 && !!why(1)} onClick={() => set(added.dice, (added.pips + 1) % 3)}>+pip ({added.pips})</button>}
          <strong className="mono w-16 text-right text-[var(--holo)]">{format(W.skillCodeOf(wiz, id))}</strong>
        </span>
      </div>
    );
  };
  const openIfNarrow = (id: string) => { if (platform !== 'pc') openRef('skills', id); };

  const stepSkills = () => {
    if (!wiz.attrs || !sv) return <p className="text-muted">Defina os atributos antes.</p>;
    const listed = W.listedEntries(wiz);
    const ids = W.listedIds(wiz);
    const extraIds = Object.keys(wiz.skills).filter((id) => ids && !ids.has(id) && !W.skillsById.get(id).advanced);
    const advIds = Object.keys(wiz.skills).filter((id) => W.skillsById.get(id).advanced);
    const grant = W.forceGrant(wiz);
    const nSpec = wiz.specs.length;
    return (
      <div className="grid gap-3">
        <div className="glass sticky top-0 z-10 p-2 text-sm md:top-14" role="status"><strong>{sv.budget.dice}D de perícias</strong> · usado <span className="mono">{format(sv.used)}</span> · restante <strong className={remaining < 0 ? 'err mono' : 'mono'}>{format(fromPips(Math.max(0, remaining)))}</strong> · teto {SKILL_CAP_DICE}D por perícia</div>
        {mode === 'droid' && <div className="glass p-2 text-sm" style={{ borderColor: 'var(--warn)' }}>Protocol Droid: 17D de perícias, máximo 2D por perícia (texto do template).</div>}
        <label className="flex items-center gap-2"><input type="checkbox" className="h-5 w-5" checked={wiz.allowPips} onChange={(e) => upd((w) => { w.allowPips = e.target.checked; })} />Permitir pips soltos <Seal kind="casa">RD-29</Seal></label>
        {ATTRS.map((a) => {
          const rows = listed.filter((e: any) => e.attribute === a && e.skill_id);
          return rows.length ? <Panel key={a} className="grid"><h3 className="font-bold">{ATTR_ABBR[a as keyof typeof ATTR_ABBR]} <span className="mono text-[var(--holo)]">{format(W.attrCode(wiz, a))}</span></h3>{rows.map((e: any) => skillRow(e.skill_id))}</Panel> : null;
        })}
        {listed.some((e: any) => e.species_special_skill) && <p className="text-sm text-muted">Perícias especiais da espécie (sem id no capítulo de perícias): {listed.filter((e: any) => e.species_special_skill).map((e: any) => e.name).join(', ')}.</p>}
        {ids && <Panel className="grid"><h3 className="font-bold">Fora do template (permissão do mestre)</h3>{extraIds.map((id) => skillRow(id, true))}
          <select className="input mt-2" aria-label="Adicionar perícia fora do template" value="" onChange={(e) => e.target.value && upd((w) => { w.skills[e.target.value] = { dice: 0, pips: 0 }; w.perms[e.target.value] = true; })}>
            <option value="">+ perícia fora do template…</option>{C.listOf('skills').filter((s: any) => !s.advanced && !ids.has(s.id) && !extraIds.includes(s.id)).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Panel>}
        <Panel className="grid gap-2"><h3 className="font-bold">Especializações <small className="text-muted">(1D = 3, RD-30)</small></h3>
          {wiz.specs.map((sp, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select className="input !w-48" aria-label="Perícia da especialização" value={sp.skillId} onChange={(e) => upd((w) => { w.specs[i].skillId = e.target.value; })}>{C.listOf('skills').filter((x: any) => !x.advanced).map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
              <input className="input !w-48" aria-label="Nome da especialização" placeholder="ex.: blaster pistol" value={sp.name} onChange={(e) => upd((w) => { w.specs[i].name = e.target.value; })} />
              <strong className="mono text-[var(--holo)]">{format(specializationValue(W.skillCodeOf(wiz, sp.skillId)))}</strong>
              <Step label="Remover especialização" onClick={() => upd((w) => { w.specs.splice(i, 1); })}><Trash2 className="h-4 w-4" /></Step></div>))}
          <button type="button" className="btn w-fit" disabled={remaining < 3 && nSpec % 3 === 0} onClick={() => upd((w) => { for (let k = 0; k < 3; k++) w.specs.push({ skillId: 'blaster', name: '' }); })}>+ bloco de 3 especializações (1D)</button></Panel>
        <Panel className="grid"><h3 className="font-bold">Perícias avançadas (A) <small className="text-muted">(RD-31, começam em {format(ADVANCED_START)})</small></h3>
          {advIds.map((id) => { const chk = checkAdvancedPrereq(id, (x: string) => W.skillCodeOf(wiz, x), C.bundle.derived.advanced_prereqs); return <div key={id}>{skillRow(id)}<p className={cn('text-sm', chk.ok ? 'text-muted' : 'err')}>{chk.manual ? `Pré-requisito composto, confirmar com o mestre: ${chk.text}` : chk.ok ? 'Pré-requisito cumprido.' : `Pré-requisito: ${chk.text}`} <button className="btn sm ghost" onClick={() => upd((w) => { delete w.skills[id]; })}>remover</button></p></div>; })}
          <select className="input mt-2" aria-label="Adicionar perícia avançada" value="" onChange={(e) => e.target.value && upd((w) => { w.skills[e.target.value] = { dice: 1, pips: 0 }; })}><option value="">+ perícia avançada (A)…</option>{C.listOf('skills').filter((s: any) => s.advanced && !advIds.includes(s.id)).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Panel>
        {Object.keys(grant).length > 0 && <Panel className="grid gap-2"><h3 className="font-bold">Perícias da Força do template (RD-32)</h3>
          {FORCE_SKILLS.filter((f) => grant[f]).map((f) => <div key={f} className="flex items-center justify-between"><span>{f} <small className="text-muted">base {format(grant[f])}</small></span><span className="flex items-center gap-1.5"><Step label={`Force ${f} menos`} disabled={!wiz.forceAdded[f]} onClick={() => upd((w) => { w.forceAdded[f]--; })}><Minus className="h-4 w-4" /></Step><output className="mono w-10 text-center">+{wiz.forceAdded[f]}D</output><Step label={`Force ${f} mais`} disabled={wiz.forceAdded[f] >= SKILL_CAP_DICE || remaining < 3} onClick={() => upd((w) => { w.forceAdded[f]++; })}><Plus className="h-4 w-4" /></Step><strong className="mono w-12 text-right">{W.forceTotal(wiz, f)}D</strong></span></div>)}</Panel>}
        <Msgs items={sv.errors} cls="err" /><Msgs items={sv.warnings} cls="warnc" />
      </div>
    );
  };

  const stepForce = () => {
    W.pruneForcePowers(wiz);
    const need = tpl?.force_powers_to_select || 0;
    const eligible = W.eligiblePowers(wiz);
    const sp = startingPoints(sensitive);
    return (
      <div className="grid gap-3"><h2 className="text-xl font-bold">Força</h2>
        {sens.fixed ? (
          <p>{sens.value ? 'Este template é sensível à Força (obrigatório).' : 'Este template está impresso como não sensível à Força.'}
            {!sens.value && <> <button type="button" className="btn sm" onClick={() => { if (confirm('O template está impresso como “No”. Mudar a sensibilidade pede aprovação do mestre. Continuar?')) upd((w) => { w.forceSensitive = true; w.templateOverrideSens = true; }); }}>alterar com aviso</button></>}</p>
        ) : (
          <fieldset className="grid gap-2"><legend className="label">Sensível à Força?</legend>
            {([[true, 'Sim (2 Force Points)'], [false, 'Não (1 Force Point)']] as const).map(([v, l]) => <label key={String(v)} className="glass flex items-center gap-2 p-3"><input type="radio" name="sens" className="h-5 w-5" checked={wiz.forceSensitive === v} onChange={() => upd((w) => { w.forceSensitive = v; })} />{l}</label>)}</fieldset>
        )}
        <p className="text-muted">Pontos iniciais: {sp.characterPoints} Character Points, {sp.forcePoints} Force Point(s) (RD-36, p.21-22).</p>
        {mode === 'scratch' && sensitive && (
          <Panel className="grid gap-2"><h3 className="font-bold">Perícias da Força (RD-33)</h3><p className="text-sm text-muted">Cada 1D de control, sense ou alter custa 1D dos dados de atributo; exige permissão do mestre.</p>
            <label className="flex items-center gap-2"><input type="checkbox" className="h-5 w-5" checked={!!wiz.perms['force:control']} onChange={(e) => upd((w) => { for (const f of FORCE_SKILLS) w.perms[`force:${f}`] = e.target.checked; if (!e.target.checked) w.forceAdded = { control: 0, sense: 0, alter: 0 }; })} />O mestre permite</label>
            {wiz.perms['force:control'] && FORCE_SKILLS.map((f) => <div key={f} className="flex items-center justify-between"><span>{f}</span><span className="flex items-center gap-1.5"><Step label={`Force ${f} menos`} disabled={!wiz.forceAdded[f]} onClick={() => upd((w) => { w.forceAdded[f]--; })}><Minus className="h-4 w-4" /></Step><output className="mono w-10 text-center">{wiz.forceAdded[f]}D</output><Step label={`Force ${f} mais`} disabled={wiz.forceAdded[f] >= 4} onClick={() => upd((w) => { w.forceAdded[f]++; })}><Plus className="h-4 w-4" /></Step></span></div>)}</Panel>
        )}
        {sensitive ? (
          <Panel className="grid gap-1"><h3 className="font-bold">Poderes {need ? `(escolha ${need}: ${wiz.powers.length}/${need})` : '(escolha com o mestre)'}</h3>
            <p className="text-sm text-muted">Só aparecem poderes cujas perícias você tem e cujos poderes exigidos já foram escolhidos.</p>
            {eligible.length ? eligible.map((p: any) => (
              <label key={p.id} className="flex items-center gap-2 border-t border-[var(--line)] py-1.5"><input type="checkbox" className="h-5 w-5" checked={wiz.powers.includes(p.id)} onChange={(e) => upd((w) => { if (e.target.checked) { if (need && w.powers.length >= need) return; w.powers.push(p.id); } else w.powers = w.powers.filter((x) => x !== p.id); })} />
                <span>{p.name} <small className="text-muted">{p.skills.join('+')} · p.{p.page}</small></span>{p.warning && <Seal kind="prov" title={p.warning}>aviso: Dark Side</Seal>}</label>)) : <p className="text-muted">Nenhum poder disponível: precisa de dados em control, sense ou alter.</p>}
          </Panel>
        ) : <p className="text-muted">Sem poderes da Força para este personagem.</p>}
      </div>
    );
  };

  const stepGear = () => {
    const bal = W.balance(wiz);
    const items = C.listOf(wiz.gearTab).filter((i: any) => !wiz.gearFilter || i.name.toLowerCase().includes(wiz.gearFilter.toLowerCase())).slice(0, 60);
    const cls: Record<string, number> = { poor: 100, average: 250, wealthy: 400 };
    return (
      <div className="grid gap-3"><h2 className="text-xl font-bold">Equipamento</h2>
        {tpl && <div className="glass p-3 text-sm"><strong>Equipamento do template: </strong>{tpl.equipment}</div>}
        <div className="flex flex-wrap items-end gap-3"><label className="field w-40"><span>Créditos iniciais</span><input className="input mono" type="number" min={0} inputMode="numeric" value={wiz.startCredits} onChange={(e) => upd((w) => { w.startCredits = Math.max(0, Number(e.target.value) || 0); })} /></label>
          <strong className={cn('mono pb-3', bal < 0 && 'err')}>Saldo: {bal} cr</strong></div>
        {mode === 'scratch' && <Panel className="flex flex-wrap items-center gap-2"><span className="label w-full">Créditos iniciais opcionais (mestre, RD-37)</span>
          <select className="input !w-52" aria-label="Classe" value={wiz.creditsClass} onChange={(e) => upd((w) => { w.creditsClass = e.target.value; })}>{[['poor', 'Poor (2D × 100)'], ['average', 'Average (2D × 250)'], ['wealthy', 'Wealthy (2D × 400)']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <button type="button" className="btn" onClick={() => upd((w) => W.rollCredits(w))}>Rolar 2D</button>{wiz.creditsRoll && <span className="mono">2D = {wiz.creditsRoll} → {wiz.creditsRoll * cls[wiz.creditsClass]} cr</span>}</Panel>}
        <div className="flex gap-1" role="tablist">{([['weapons', 'Armas'], ['armor', 'Armaduras'], ['gear', 'Equipamentos']] as const).map(([id, l]) => <button key={id} role="tab" aria-selected={wiz.gearTab === id} className={cn('btn sm', wiz.gearTab === id && 'primary')} onClick={() => upd((w) => { w.gearTab = id; })}>{l}</button>)}</div>
        <input className="input" type="search" aria-label="Filtrar catálogo" placeholder="Filtrar catálogo…" value={wiz.gearFilter} onChange={(e) => upd((w) => { w.gearFilter = e.target.value; })} />
        <div className="max-h-96 overflow-auto">{items.map((i: any) => (
          <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] py-1.5"><span>{i.name} <small className="text-muted">{[i.damage, i.range].filter(Boolean).join(' · ')}</small></span>
            <span className="flex items-center gap-2">{i.cost_credits == null ? <Seal kind="prov" title="preço a combinar com o mestre">sem preço</Seal> : <span className="mono">{i.cost_credits} cr</span>}<small className="pg">p.{i.page}</small>
              <button type="button" className="btn sm" onClick={() => { const p = purchase(bal, i); if (p.error) { alert(p.error); return; } upd((w) => { w.cart.push({ cat: w.gearTab, id: i.id, name: i.name, charged: p.charged, warning: p.warning }); }); }}>Adicionar</button></span></div>))}</div>
        <Panel><h3 className="font-bold">Comprados ({wiz.cart.length})</h3>{wiz.cart.map((c, i) => <div key={i} className="flex items-center justify-between"><span>{c.name} {c.warning ? <Seal kind="prov">{c.warning}</Seal> : <small className="mono">({c.charged} cr)</small>}</span><Step label={`Remover ${c.name}`} onClick={() => upd((w) => { w.cart.splice(i, 1); })}><Trash2 className="h-4 w-4" /></Step></div>)}{!wiz.cart.length && <p className="text-muted">Nada ainda.</p>}</Panel>
      </div>
    );
  };

  const stepDetails = () => {
    const f = (k: string, l: string, area?: boolean) => (
      <label key={k} className="field"><span>{l}</span>{area ? <textarea className="input" rows={3} value={wiz.details[k] ?? ''} onChange={(e) => upd((w) => { w.details[k] = e.target.value; })} /> : <input className="input" value={wiz.details[k] ?? ''} onChange={(e) => upd((w) => { w.details[k] = e.target.value; })} />}</label>
    );
    return <div className="grid gap-3"><h2 className="text-xl font-bold">Detalhes</h2>{f('name', 'Nome *')}<div className="grid grid-cols-2 gap-3">{f('gender', 'Gênero')}{f('age', 'Idade')}{f('height', 'Altura')}{f('weight', 'Peso')}</div>
      {f('physical_description', 'Descrição física', true)}{f('personality', 'Personalidade', true)}{f('background', 'Background', true)}{f('objectives', 'Objetivos', true)}{f('languages', 'Idiomas')}{f('quote', 'Citação')}</div>;
  };

  const stepSummary = () => {
    const v = W.validation(wiz);
    const c = W.buildCharacter(wiz);
    const skillList = ATTRS.flatMap((a) => c.attributes[a].skills.map((s: any) => `${C.skillName(s.skill)} ${s.value.text}${s.specializations.length ? ` (${s.specializations.map((x: any) => `${x.name} ${x.value.text}`).join(', ')})` : ''}`));
    const save = async () => {
      setSaving(true); setSaveErr(null);
      try { const id = await createLocal(c, c.type); nav(`/ficha/${id}`); } catch (e: any) { setSaveErr(e.message); setSaving(false); }
    };
    return (
      <div className="grid gap-3"><h2 className="text-xl font-bold">Resumo</h2>
        {v.errors.length ? <div className="glass p-3" style={{ borderColor: 'var(--dark)' }}><strong>Corrija antes de salvar:</strong><Msgs items={v.errors} cls="err" /></div> : <p className="okc"><Check className="mr-1 inline h-4 w-4" aria-hidden />Sem erros.</p>}
        {v.warnings.length > 0 && <div className="glass p-3" style={{ borderColor: 'var(--warn)' }}><strong>Avisos (não bloqueiam; o mestre decide):</strong><Msgs items={v.warnings} cls="warnc" /></div>}
        <Panel className="grid gap-2"><h3 className="text-lg font-bold">{c.name} <small className="text-muted">{c.type}</small></h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{ATTRS.map((a) => <div key={a} className="text-center"><div className="label">{ATTR_ABBR[a as keyof typeof ATTR_ABBR]}</div><div className="mono font-bold text-[var(--holo)]">{c.attributes[a].value.text}</div></div>)}</div>
          <p><strong>Perícias: </strong>{skillList.join('; ') || '—'}</p>
          <p className="mono">CP {c.character_points} · FP {c.force_points} · Move {c.move} · Créditos {c.credits}{c.force_sensitive ? ' · sensível à Força' : ''}</p>
          {c.force_powers.length > 0 && <p>Poderes: {c.force_powers.map((id: string) => W.powersById.get(id).name).join(', ')}</p>}</Panel>
        {saveErr && <p role="alert" className="err">{saveErr}</p>}
        <button type="button" className="btn primary big" disabled={v.errors.length > 0 || saving} onClick={save} data-testid="save-character">{saving ? 'Salvando…' : 'Salvar personagem'}</button>
      </div>
    );
  };

  const body = { origin: stepOrigin, species: stepSpecies, attrs: stepAttrs, skills: stepSkills, force: stepForce, gear: stepGear, details: stepDetails, summary: stepSummary }[stepKey]!();
  const [file, anchor] = STEP_RULE[stepKey];
  const ctx = ctxPath ?? `/consulta/rules/${file}/${anchor}`;
  const live = wiz.attrs ? `${ATTRS.map((a) => `${ATTR_ABBR[a as keyof typeof ATTR_ABBR]} ${format(W.attrCode(wiz, a))}`).join(' · ')}` : null;

  return (
    <Page title="Novo personagem" subtitle={`Passo ${wiz.step + 1} de ${STEPS.length}: ${STEPS[wiz.step][1]} (${STEP_CITE[stepKey]})`}>
      <div className="grid gap-4 xl:grid-cols-[13rem_1fr_22rem]">
        <nav aria-label="Passos" className="min-w-0 max-w-full xl:sticky xl:top-4 xl:self-start">
          <ol className="flex gap-1 overflow-x-auto xl:grid">{STEPS.map(([id, label], i) => (
            <li key={id}><button type="button" aria-current={i === wiz.step ? 'step' : undefined} disabled={i > 0 && !wiz.origin} onClick={() => upd((w) => { w.step = i; })}
              className={cn('btn ghost w-full justify-start whitespace-nowrap', i === wiz.step && '!border-[var(--holo)] !bg-white/5 text-[var(--holo)]', i < wiz.step && 'text-[var(--ok)]')}>
              <span className="mono">{i < wiz.step ? '✓' : i + 1}</span> {label}</button></li>))}</ol>
        </nav>
        <div className="min-w-0">
          <div className="rise" key={stepKey}>{body}</div>
          <div className="mt-6 flex justify-between">
            <button type="button" className="btn" disabled={wiz.step === 0} onClick={() => upd((w) => { w.step--; })}><ChevronLeft className="h-4 w-4" aria-hidden />Voltar</button>
            {wiz.step < STEPS.length - 1 && <button type="button" className="btn primary" disabled={!W.canAdvance(wiz)} onClick={() => upd((w) => { w.step++; })} data-testid="next-step">Avançar<ChevronRight className="h-4 w-4" aria-hidden /></button>}
          </div>
        </div>
        {platform === 'pc' && (
          <aside aria-label="Contexto" className="glass chamfer max-h-[85dvh] self-start overflow-auto p-3 xl:sticky xl:top-4">
            <p className="label mb-2">Regra deste passo ({STEP_CITE[stepKey]})</p>
            <RefBrowser path={ctx} onNavigate={(p) => setCtxPath(p)} compact />
            {live && <div className="glass mt-3 p-2 text-sm"><strong>Personagem até agora</strong><p className="mono text-muted">{live}</p></div>}
          </aside>
        )}
      </div>
    </Page>
  );
}
