// ConflictDialog - tela de conflito: o mesmo campo mudou nos dois lados; o jogador escolhe "manter o meu" ou "manter o do servidor".
import { useState } from 'react';
import { Modal } from '@/components/ui';
import type { LocalChar } from '@/lib/db';
import { resolveConflict } from '@/lib/sync';

const fmt = (v: any) => (v === undefined ? '(removido)' : typeof v === 'object' && v ? (v.text ?? JSON.stringify(v)) : String(v));
function valueAt(doc: any, path: string) {
  try { return path.split('/').filter(Boolean).reduce((o, k) => o?.[k], doc); } catch { return undefined; }
}

export function ConflictDialog({ char }: { char: LocalChar }) {
  const c = char.conflict;
  const [choice, setChoice] = useState<Record<string, 'mine' | 'theirs'>>({});
  if (!c) return null;
  const pick = (path: string) => choice[path] ?? 'theirs';
  return (
    <Modal open onOpenChange={() => { /* so fecha resolvendo */ }} title="Conflito de edição" wide>
      <p className="mb-3 text-muted">Outro aparelho (ou o mestre) alterou {c.conflicts.length > 1 ? 'estes campos' : 'este campo'} de <strong>{char.name}</strong> enquanto você editava. Escolha qual valor fica. O resto das suas alterações segue normalmente.</p>
      <ul className="grid gap-3">
        {c.conflicts.map((x) => {
          const mine = (x.mine as any).value;
          const theirs = valueAt(c.current.sheet, x.path);
          return (
            <li key={x.path} className="glass p-3">
              <div className="mono mb-2 text-sm text-muted">{x.path}</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {([['mine', 'Manter o meu', mine], ['theirs', 'Manter o do servidor', theirs]] as const).map(([k, l, v]) => (
                  <label key={k} className="glass flex cursor-pointer items-start gap-2 p-2" style={pick(x.path) === k ? { borderColor: 'var(--holo)' } : undefined}>
                    <input type="radio" name={x.path} checked={pick(x.path) === k} onChange={() => setChoice({ ...choice, [x.path]: k })} className="mt-1" />
                    <span><strong>{l}</strong><br /><span className="mono break-all">{fmt(v)}</span></span>
                  </label>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex justify-end"><button className="btn primary" onClick={() => resolveConflict(char.id, Object.fromEntries(c.conflicts.map((x) => [x.path, pick(x.path)])))}>Aplicar escolhas</button></div>
    </Modal>
  );
}
