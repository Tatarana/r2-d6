// SheetPage - ficha editavel (todos os campos do schema) com salvamento automatico no servidor (via fila offline).
import { ATTRS, ATTR_ABBR, FORCE_SKILLS, WOUND_STATES, fromPips, parse, toDie, toPips, weaponEntry, armorEntry, gearEntry } from '@r2d6/rules';
import { BookOpen, Camera, Dices, History, Minus, Plus, Printer, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { openRef } from '@/components/AppShell';
import { ArtSlot } from '@/components/ArtSlot';
import { ErrorState, Modal, Page, Panel, PortraitFrame, Spinner, WOUND_PT, woundTone } from '@/components/ui';
import { ApiError, api, errText } from '@/lib/api';
import { useCatalog } from '@/lib/catalog';
import { usePrefs } from '@/lib/prefs';
import { applyServerResult, editSheet, useChar } from '@/lib/sync';
import { templateArt } from '../hangar/Hangar';
import { ConflictDialog } from './ConflictDialog';

/** Campo de texto que grava ao sair (evita uma operacao por tecla). */
export function TextField({ label, value, onCommit, area, mono, inputMode }: { label: string; value: string; onCommit: (v: string) => void; area?: boolean; mono?: boolean; inputMode?: 'numeric' | 'text' }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const common = { value: v, onChange: (e: any) => setV(e.target.value), onBlur: () => v !== value && onCommit(v), 'aria-label': label, className: `input ${mono ? 'mono' : ''}` };
  return <label className="field"><span>{label}</span>{area ? <textarea {...common} rows={3} /> : <input {...common} inputMode={inputMode} />}</label>;
}

/** Codigo de dados "3D+2": aceita digitacao (normaliza 3 pips = 1D) e botoes de 1 pip. */
export function CodeField({ value, onCommit, label }: { value: any; onCommit: (d: any) => void; label: string }) {
  const text = value?.text ?? `${value?.dice ?? 0}D${value?.pips ? `+${value.pips}` : ''}`;
  const [v, setV] = useState(text);
  const [bad, setBad] = useState(false);
  useEffect(() => setV(text), [text]);
  const commit = (s: string) => { try { const d = toDie(s.trim() === '' ? '0D' : s); setBad(false); if (d.text !== text) onCommit(d); } catch { setBad(true); } };
  const step = (n: number) => onCommit(toDie(fromPips(toPips(parse(value)) + n)));
  return (
    <span className="inline-flex items-center gap-1">
      <button type="button" className="btn icon sm" aria-label={`${label}: menos 1 pip`} onClick={() => step(-1)}><Minus className="h-3.5 w-3.5" /></button>
      <input className="input mono w-[5.2rem] text-center" aria-label={label} aria-invalid={bad} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => commit(v)} onKeyDown={(e) => e.key === 'Enter' && commit(v)} />
      <button type="button" className="btn icon sm" aria-label={`${label}: mais 1 pip`} onClick={() => step(1)}><Plus className="h-3.5 w-3.5" /></button>
    </span>
  );
}

export function Counter({ label, value, onChange, tone, min = 0, max }: { label: string; value: number; onChange: (n: number) => void; tone?: string; min?: number; max?: number }) {
  return (
    <div className="grid justify-items-center gap-1">
      <span className="label">{label}</span>
      <div className="flex items-center gap-1.5">
        <button className="btn icon" aria-label={`${label}: diminuir`} disabled={value <= min} onClick={() => onChange(value - 1)}><Minus className="h-4 w-4" /></button>
        <output className="mono min-w-10 text-center text-2xl font-bold" style={{ color: tone }} aria-label={`${label}: ${value}`}>{value}</output>
        <button className="btn icon" aria-label={`${label}: aumentar`} disabled={max !== undefined && value >= max} onClick={() => onChange(value + 1)}><Plus className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return <Panel className="grid gap-3"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="label !text-[0.8rem]">{title}</h2>{right}</div>{children}</Panel>;
}

export function SheetPage() {
  const { id } = useParams();
  const ch = useChar(id);
  const cs = useCatalog();
  const nav = useNavigate();
  const setPref = usePrefs((s) => s.set);
  const [portraitBusy, setPortraitBusy] = useState(false);
  const [portraitErr, setPortraitErr] = useState<string | null>(null);
  const [del, setDel] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { if (id) setPref({ activeChar: id }); }, [id, setPref]);

  if (ch === undefined || !cs) return <Spinner />;
  if (ch === null) return <ErrorState art="error.not-found" title="Personagem não encontrado">Ele pode ter sido apagado ou pertencer a outra conta.</ErrorState>;
  const s = ch.sheet;
  const C = cs.catalog;
  const set = (fn: (d: any) => void) => editSheet(ch.id, fn);
  const skillName = (sid: string) => C.skillName(sid);
  const species = C.getEntity('species', s.species)?.name ?? s.species;

  const uploadPortrait = async (f: File) => {
    setPortraitBusy(true); setPortraitErr(null);
    try {
      const fd = new FormData(); fd.append('file', f);
      const r = await api('POST', `/api/characters/${ch.id}/portrait`, fd);
      await applyServerResult(r.character);
    } catch (e) { setPortraitErr(e instanceof ApiError && e.status === 415 ? 'Esse arquivo não é uma imagem válida (use JPEG, PNG, WebP ou AVIF).' : errText(e)); }
    finally { setPortraitBusy(false); }
  };

  const addSkill = (attr: string, sid: string) => set((d) => {
    if (!sid || d.attributes[attr].skills.some((x: any) => x.skill === sid)) return;
    d.attributes[attr].skills.push({ skill: sid, value: toDie(d.attributes[attr].value), specializations: [] });
  });

  return (
    <div>
      <ConflictDialog char={ch} />
      <div className="relative overflow-hidden">
        <ArtSlot id={templateArt(ch.templateType)} ratio="auto" className="absolute inset-0 h-full w-full scale-110 opacity-50 blur-md" decorative />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,7,12,.3), var(--space))' }} />
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-end gap-4 px-4 pb-4 pt-6 md:px-6">
          <div className="grid justify-items-center gap-1">
            <PortraitFrame mediaId={ch.portraitMediaId} size={96} alt={`Retrato de ${ch.name}`} fallback={templateArt(ch.templateType)} />
            <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" aria-label="Enviar retrato" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadPortrait(f); e.target.value = ''; }} />
            <button className="btn sm" disabled={portraitBusy} onClick={() => file.current?.click()}><Camera className="h-4 w-4" aria-hidden />{portraitBusy ? 'Enviando…' : 'Retrato'}</button>
          </div>
          <div className="min-w-[10rem] flex-1">
            <p className="label">{ch.templateType}{species ? ` · ${species}` : ''}</p>
            <input className="input holo-text !min-h-12 !border-0 !bg-transparent !p-0 text-2xl font-bold md:text-4xl" style={{ fontFamily: 'var(--font-display)' }} aria-label="Nome do personagem" defaultValue={s.name} key={s.name}
              onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== s.name) set((d) => { d.name = v; }); else e.target.value = s.name; }} />
            {portraitErr && <p role="alert" className="err text-sm">{portraitErr}</p>}
          </div>
          <div className="flex w-full flex-wrap gap-2 md:w-auto">
            <Link className="btn primary" to={`/mesa/${ch.id}`}><Dices className="h-4 w-4" aria-hidden />Modo mesa</Link>
            <Link className="btn" to={`/ficha/${ch.id}/historico`}><History className="h-4 w-4" aria-hidden />Histórico</Link>
            <Link className="btn" to={`/imprimir/${ch.id}`}><Printer className="h-4 w-4" aria-hidden />Imprimir</Link>
            <button className="btn danger" onClick={() => setDel(true)} aria-label="Apagar personagem"><Trash2 className="h-4 w-4" aria-hidden /></button>
          </div>
        </div>
      </div>

      <Page className="grid gap-4 pt-2 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-4">
          {ATTRS.map((a) => {
            const at = s.attributes[a];
            const free = C.listOf('skills').filter((k: any) => k.attribute === a && !at.skills.some((x: any) => x.skill === k.id));
            return (
              <Section key={a} title={`${ATTR_ABBR[a as keyof typeof ATTR_ABBR]} · ${a}`} right={<CodeField label={`Valor de ${a}`} value={at.value} onCommit={(v) => set((d) => { d.attributes[a].value = v; })} />}>
                <ul className="grid gap-2">
                  {at.skills.map((sk: any, i: number) => (
                    <li key={sk.skill} className="grid gap-1.5 border-t border-[var(--line)] pt-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button className="text-left font-semibold text-[var(--holo)] hover:underline" onClick={() => openRef('skills', sk.skill)} aria-label={`Ver regra de ${skillName(sk.skill)}`}>{skillName(sk.skill)}</button>
                        <span className="inline-flex items-center gap-1">
                          <CodeField label={`Valor de ${skillName(sk.skill)}`} value={sk.value} onCommit={(v) => set((d) => { d.attributes[a].skills[i].value = v; })} />
                          <button className="btn icon sm ghost" aria-label={`Remover ${skillName(sk.skill)}`} onClick={() => set((d) => { d.attributes[a].skills.splice(i, 1); })}><Trash2 className="h-3.5 w-3.5" /></button>
                        </span>
                      </div>
                      {(sk.specializations ?? []).map((sp: any, j: number) => (
                        <div key={j} className="flex flex-wrap items-center justify-between gap-2 pl-4">
                          <TextField label="Especialização" value={sp.name} onCommit={(v) => set((d) => { d.attributes[a].skills[i].specializations[j].name = v; })} />
                          <span className="inline-flex items-center gap-1"><CodeField label={`Valor de ${sp.name}`} value={sp.value} onCommit={(v) => set((d) => { d.attributes[a].skills[i].specializations[j].value = v; })} />
                            <button className="btn icon sm ghost" aria-label="Remover especialização" onClick={() => set((d) => { d.attributes[a].skills[i].specializations.splice(j, 1); })}><Trash2 className="h-3.5 w-3.5" /></button></span>
                        </div>
                      ))}
                      <button className="btn sm ghost w-fit" onClick={() => set((d) => { (d.attributes[a].skills[i].specializations ??= []).push({ name: 'Nova especialização', value: toDie(fromPips(toPips(parse(sk.value)) + 3)) }); })}>+ especialização (+1D)</button>
                    </li>
                  ))}
                  {!at.skills.length && <li className="text-sm text-muted">Sem perícias melhoradas: usa o valor do atributo.</li>}
                </ul>
                <select className="input" aria-label={`Adicionar perícia de ${a}`} value="" onChange={(e) => addSkill(a, e.target.value)}>
                  <option value="">+ adicionar perícia…</option>
                  {free.map((k: any) => <option key={k.id} value={k.id}>{k.name}{k.advanced ? ' (A)' : ''}</option>)}
                </select>
              </Section>
            );
          })}

          <Section title="Força">
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!s.force_sensitive} onChange={(e) => set((d) => { d.force_sensitive = e.target.checked; })} className="h-5 w-5" />Sensível à Força</label>
            {s.force_sensitive && (
              <>
                <div className="grid grid-cols-3 gap-2">{FORCE_SKILLS.map((f) => (
                  <div key={f} className="grid justify-items-center gap-1"><span className="label">{f}</span>
                    <CodeField label={`Force ${f}`} value={s.force_attributes?.[f] ?? { dice: 0, pips: 0, text: '0D' }} onCommit={(v) => set((d) => { (d.force_attributes ??= {})[f] = v; })} /></div>))}</div>
                <div className="flex flex-wrap gap-1.5">{(s.force_powers ?? []).map((pid: string) => <button key={pid} className="chip" onClick={() => openRef('powers', pid)}>{C.getEntity('powers', pid)?.name ?? pid}</button>)}</div>
              </>
            )}
          </Section>

          <Section title="Detalhes">
            <div className="grid gap-3 sm:grid-cols-2">
              {([['gender', 'Gênero'], ['age', 'Idade'], ['height', 'Altura'], ['weight', 'Peso'], ['languages', 'Idiomas'], ['quote', 'Citação']] as const).map(([k, l]) => <TextField key={k} label={l} value={s[k] ?? ''} onCommit={(v) => set((d) => { d[k] = v; })} />)}
            </div>
            {([['physical_description', 'Descrição física'], ['personality', 'Personalidade'], ['background', 'Background'], ['objectives', 'Objetivos'], ['contacts_and_enemies', 'Contatos e inimigos'], ['connection_with_characters', 'Ligação com outros personagens'], ['special_abilities', 'Habilidades especiais']] as const)
              .map(([k, l]) => <TextField key={k} area label={l} value={s[k] ?? ''} onCommit={(v) => set((d) => { d[k] = v; })} />)}
          </Section>
        </div>

        <div className="grid content-start gap-4">
          <Section title="Estado e pontos">
            <div className="flex flex-wrap justify-around gap-3">
              <Counter label="CP" tone="var(--cp)" value={s.character_points} onChange={(n) => set((d) => { d.character_points = n; })} />
              <Counter label="FP" tone="var(--fp)" value={s.force_points} onChange={(n) => set((d) => { d.force_points = n; })} />
              <Counter label="DSP" tone="var(--dark)" value={s.dark_side_points ?? 0} onChange={(n) => set((d) => { d.dark_side_points = n; })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="field"><span>Ferimento</span>
                <select className="input" value={s.wound_status} style={{ color: woundTone(s.wound_status) }} onChange={(e) => set((d) => { d.wound_status = e.target.value; })}>
                  {WOUND_STATES.filter((w) => w !== 'stunned').map((w) => <option key={w} value={w}>{WOUND_PT[w]}</option>)}</select></label>
              <TextField label="Move" mono inputMode="numeric" value={String(s.move ?? 10)} onCommit={(v) => set((d) => { d.move = Math.max(0, parseInt(v, 10) || 0); })} />
              <TextField label="Créditos" mono inputMode="numeric" value={String(s.credits ?? 0)} onCommit={(v) => set((d) => { d.credits = Math.max(0, parseInt(v, 10) || 0); })} />
            </div>
          </Section>

          <Section title="Armas" right={<AddFromCatalog cat="weapons" make={weaponEntry} onAdd={(e) => set((d) => { d.weapons.push(e); })} />}>
            {s.weapons.map((w: any, i: number) => (
              <div key={i} className="grid gap-1.5 border-t border-[var(--line)] pt-2">
                <div className="flex items-center justify-between gap-2"><TextField label="Arma" value={w.type} onCommit={(v) => set((d) => { d.weapons[i].type = v; })} />
                  <button className="btn icon sm ghost" aria-label={`Remover ${w.type}`} onClick={() => set((d) => { d.weapons.splice(i, 1); })}><Trash2 className="h-3.5 w-3.5" /></button></div>
                <div className="grid grid-cols-2 gap-2"><TextField label="Dano" mono value={w.damage ?? ''} onCommit={(v) => set((d) => { d.weapons[i].damage = v; })} /><TextField label="Alcance" mono value={w.range ?? ''} onCommit={(v) => set((d) => { d.weapons[i].range = v; })} /></div>
                <div className="flex items-center gap-3"><Counter label={`Munição usada / ${w.ammo_max ?? 0}`} value={w.ammo_used ?? 0} max={w.ammo_max || undefined} onChange={(n) => set((d) => { d.weapons[i].ammo_used = n; })} />
                  <TextField label="Máx." mono inputMode="numeric" value={String(w.ammo_max ?? 0)} onCommit={(v) => set((d) => { d.weapons[i].ammo_max = Math.max(0, parseInt(v, 10) || 0); })} /></div>
              </div>
            ))}
            {!s.weapons.length && <p className="text-sm text-muted">Sem armas. Adicione do catálogo.</p>}
          </Section>

          <Section title="Armadura" right={<AddFromCatalog cat="armor" make={armorEntry} onAdd={(e) => set((d) => { d.armor.push(e); })} />}>
            {s.armor.map((a: any, i: number) => (
              <div key={i} className="flex items-end justify-between gap-2 border-t border-[var(--line)] pt-2"><TextField label="Armadura" value={a.type} onCommit={(v) => set((d) => { d.armor[i].type = v; })} /><TextField label="AV" mono value={a.av ?? ''} onCommit={(v) => set((d) => { d.armor[i].av = v; })} />
                <button className="btn icon sm ghost" aria-label={`Remover ${a.type}`} onClick={() => set((d) => { d.armor.splice(i, 1); })}><Trash2 className="h-3.5 w-3.5" /></button></div>))}
            {!s.armor.length && <p className="text-sm text-muted">Sem armadura.</p>}
          </Section>

          <Section title="Equipamento" right={<AddFromCatalog cat="gear" make={gearEntry} onAdd={(e) => set((d) => { d.other_equipment.push(e); })} />}>
            {s.other_equipment.map((g: any, i: number) => (
              <div key={i} className="flex items-end justify-between gap-2 border-t border-[var(--line)] pt-2"><TextField label="Item" value={g.type} onCommit={(v) => set((d) => { d.other_equipment[i].type = v; })} />
                <button className="btn icon sm ghost" aria-label={`Remover ${g.type}`} onClick={() => set((d) => { d.other_equipment.splice(i, 1); })}><Trash2 className="h-3.5 w-3.5" /></button></div>))}
            <button className="btn sm w-fit" onClick={() => set((d) => { d.other_equipment.push({ type: 'Novo item', notes: '' }); })}>+ item livre</button>
          </Section>
          <Link className="btn" to="/consulta"><BookOpen className="h-4 w-4" aria-hidden />Abrir consulta de regras</Link>
        </div>
      </Page>

      <Modal open={del} onOpenChange={setDel} title="Apagar personagem?">
        <p className="mb-3">“{ch.name}” vai para a lixeira no servidor e sai deste aparelho. Essa ação não pode ser desfeita pela interface.</p>
        <div className="flex justify-end gap-2"><button className="btn" onClick={() => setDel(false)}>Cancelar</button>
          <button className="btn danger" onClick={async () => { try { await api('DELETE', `/api/characters/${ch.id}`); nav('/'); } catch (e) { setPortraitErr(errText(e)); setDel(false); } }}>Apagar</button></div>
      </Modal>
    </div>
  );
}

function AddFromCatalog({ cat, make, onAdd }: { cat: string; make: (item: any) => any; onAdd: (e: any) => void }) {
  const cs = useCatalog();
  if (!cs) return null;
  return (
    <select className="input !w-44" aria-label={`Adicionar do catálogo (${cat})`} value="" onChange={(e) => { const it = cs.catalog.getEntity(cat, e.target.value); if (it) onAdd(make(it)); }}>
      <option value="">+ do catálogo…</option>
      {cs.catalog.listOf(cat).map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
    </select>
  );
}
