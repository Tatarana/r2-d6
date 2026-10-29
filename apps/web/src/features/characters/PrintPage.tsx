// PrintPage - ficha em A4 (preto e branco, via CSS de impressao).
import { ATTRS, ATTR_ABBR } from '@r2d6/rules';
import { Printer } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { ErrorState, Spinner } from '@/components/ui';
import { useCatalog } from '@/lib/catalog';
import { useChar } from '@/lib/sync';

export function PrintPage() {
  const { id } = useParams();
  const ch = useChar(id);
  const cs = useCatalog();
  if (ch === undefined || !cs) return <Spinner />;
  if (ch === null) return <ErrorState art="error.not-found" title="Personagem não encontrado" />;
  const s = ch.sheet;
  const name = (sid: string) => cs.catalog.skillName(sid);
  return (
    <div className="p-4" style={{ background: 'var(--space)' }}>
      <div className="no-print mx-auto mb-4 flex max-w-[800px] justify-between">
        <Link className="btn" to={`/ficha/${ch.id}`}>Voltar</Link>
        <button className="btn primary" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden />Imprimir (A4)</button>
      </div>
      <article className="print-sheet glass p-6" style={{ background: '#fff', color: '#000' }}>
        <h1 className="text-2xl font-bold" style={{ color: '#000' }}>{s.name}</h1>
        <p>{s.type} · {cs.catalog.getEntity('species', s.species)?.name ?? s.species} · Move {s.move}{s.force_sensitive ? ' · Sensível à Força' : ''}</p>
        <table className="my-3 w-full border-collapse text-sm">
          <tbody>{ATTRS.map((a) => (
            <tr key={a} className="align-top"><th className="w-24 border p-1 text-left">{ATTR_ABBR[a as keyof typeof ATTR_ABBR]} {s.attributes[a].value.text}</th>
              <td className="border p-1">{(s.attributes[a].skills ?? []).map((k: any) => `${name(k.skill)} ${k.value.text}${(k.specializations ?? []).length ? ` (${k.specializations.map((x: any) => `${x.name} ${x.value.text}`).join(', ')})` : ''}`).join(' · ') || '—'}</td></tr>))}</tbody>
        </table>
        <p><strong>Força:</strong> {Object.entries(s.force_attributes ?? {}).map(([k, v]: any) => `${k} ${v.text}`).join(', ') || '—'} {s.force_powers?.length ? `· Poderes: ${s.force_powers.map((p: string) => cs.catalog.getEntity('powers', p)?.name ?? p).join(', ')}` : ''}</p>
        <p><strong>CP</strong> {s.character_points} · <strong>FP</strong> {s.force_points} · <strong>DSP</strong> {s.dark_side_points ?? 0} · <strong>Créditos</strong> {s.credits} · <strong>Ferimento</strong> {s.wound_status}</p>
        <h2 className="mt-3 font-bold" style={{ color: '#000' }}>Armas</h2>
        <table className="w-full border-collapse text-sm"><tbody>{s.weapons.map((w: any, i: number) => <tr key={i}><td className="border p-1">{w.type}</td><td className="border p-1">{w.damage}</td><td className="border p-1">{w.range}</td><td className="border p-1">{'□'.repeat(Math.min(w.ammo_max || 0, 30))} ({w.ammo_used ?? 0}/{w.ammo_max ?? 0})</td></tr>)}</tbody></table>
        <h2 className="mt-3 font-bold" style={{ color: '#000' }}>Armadura e equipamento</h2>
        <p>{[...s.armor.map((a: any) => `${a.type} (${a.av})`), ...s.other_equipment.map((g: any) => g.type)].join('; ') || '—'}</p>
        {([['special_abilities', 'Habilidades especiais'], ['background', 'Background'], ['personality', 'Personalidade'], ['objectives', 'Objetivos'], ['physical_description', 'Descrição física']] as const).map(([k, l]) => s[k] ? <div key={k}><h2 className="mt-3 font-bold" style={{ color: '#000' }}>{l}</h2><p>{s[k]}</p></div> : null)}
      </article>
    </div>
  );
}
