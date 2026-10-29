// DiceViews - dados 2D (fileira chapada; Wild Die = hexagono ambar) e o wrapper que carrega o 3D sob demanda com fallback.
import { Component, lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { usePrefs } from '@/lib/prefs';
import { usePlatform } from '@/components/AppShell';

export interface DiceResult { normals: number[]; wild: number[]; cp: number[][]; wildOne?: boolean }

export function DiceRow2D({ r, animate }: { r: DiceResult; animate?: boolean }) {
  const spin = animate && usePrefs.getState().motion === 'on';
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Dados rolados" data-testid="dice-row">
      {r.normals.map((n, i) => <span key={`n${i}`} className={cn('die-n', spin && 'holo-in')} style={{ animationDelay: `${i * 50}ms` }} aria-label={`dado normal ${n}`}>{n}</span>)}
      <span className="flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--wild)]/50 p-1" aria-label="Wild Die">
        {r.wild.map((n, i) => (
          <span key={`w${i}`} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden className="text-muted">→</span>}
            <span className={cn('die-w hex', n === 6 && 'boom', n === 1 && i === 0 && 'one', spin && 'holo-in')} style={{ animationDelay: `${(r.normals.length + i) * 70}ms` }} aria-label={`Wild Die ${n}${n === 6 ? ' (explodiu)' : n === 1 && i === 0 ? ' (complicação)' : ''}`}>{n}</span>
          </span>
        ))}
        <span className="mono text-[0.65rem] font-bold tracking-widest text-[var(--wild)]">WILD</span>
      </span>
      {r.cp.flat().length > 0 && r.cp.map((seq, i) => (
        <span key={`c${i}`} className="flex items-center gap-1">{seq.map((n, j) => <span key={j} className="die-n die-cp" style={{ borderColor: 'var(--cp)' }} aria-label={`dado de CP ${n}`}>{n}</span>)}</span>
      ))}
    </div>
  );
}

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  render() { return this.state.err ? this.props.fallback : this.props.children; }
}

const Tray3D = lazy(() => import('./DiceTray3D'));

function webglOk() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

/** 3D so quando faz sentido: tablet/PC, sem reduced-motion, sem baixa luz e com WebGL. O resultado vem sempre das regras/servidor. */
export function useUse3D() {
  const { dice, lowLight, motion } = usePrefs();
  const { platform } = usePlatform();
  const [reduced, setReduced] = useState(false);
  useEffect(() => { const m = window.matchMedia('(prefers-reduced-motion: reduce)'); setReduced(m.matches); const on = () => setReduced(m.matches); m.addEventListener('change', on); return () => m.removeEventListener('change', on); }, []);
  return useMemo(() => {
    if (reduced || motion === 'off' || lowLight || dice === '2d') return false;
    if (!webglOk()) return false;
    return dice === '3d' || platform !== 'phone';
  }, [dice, lowLight, motion, platform, reduced]);
}

export function DiceDisplay({ r, rollKey }: { r: DiceResult; rollKey: string }) {
  const use3D = useUse3D();
  const two = <DiceRow2D r={r} animate />;
  return (
    <div className="grid gap-2">
      {use3D && (
        <Boundary fallback={null}>
          <Suspense fallback={<div className="grid h-48 place-items-center text-muted" role="status">Preparando a bandeja…</div>}>
            <Tray3D r={r} rollKey={rollKey} />
          </Suspense>
        </Boundary>
      )}
      {/* a fileira 2D sempre acompanha: leitura acessivel do resultado exato */}
      {two}
    </div>
  );
}
