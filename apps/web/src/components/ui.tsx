// ui.tsx - componentes base (estilo shadcn/ui: Radix + cva + cn): painel de vidro, selos, dialogo, estados vazio/erro, retrato.
import * as RDialog from '@radix-ui/react-dialog';
import { renderMarkdown } from '@r2d6/data';
import { AlertTriangle, Check, CloudOff, LoaderCircle, RefreshCw, X } from 'lucide-react';
import { useMemo, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { dismissNotice, useSync } from '@/lib/sync';
import { ArtSlot, artSrc } from './ArtSlot';

export function Panel({ className, chamfer = true, scan = false, ...p }: ComponentProps<'section'> & { chamfer?: boolean; scan?: boolean }) {
  return <section {...p} className={cn('glass p-4', chamfer && 'chamfer', scan && 'scan', className)} />;
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('label', className)}>{children}</div>;
}

export function Field({ label, children, hint, error }: { label: string; children: ReactNode; hint?: string; error?: string | null }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && !error && <small className="text-muted">{hint}</small>}
      {error && <small className="err" role="alert">{error}</small>}
    </label>
  );
}

/** Selo de rastreabilidade: CASA (regra da casa), PROV (leitura provisoria, E-0xx) ou RAW. */
export function Seal({ kind, children, title }: { kind: 'casa' | 'prov' | 'raw'; children?: ReactNode; title?: string }) {
  const label = children ?? (kind === 'casa' ? 'casa' : kind === 'prov' ? 'prov' : 'livro');
  return <span className={cn('seal', kind)} title={title ?? (kind === 'casa' ? 'Regra da casa (decisão do projeto)' : kind === 'prov' ? 'Leitura provisória: o livro é ambíguo' : 'Do livro')}>{label}</span>;
}

export function Page({ title, subtitle, children, actions, className }: { title?: ReactNode; subtitle?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl px-4 pb-28 pt-4 md:px-6 lg:pb-10', className)}>
      {(title || actions) && (
        <header className="rise mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            {title && <h1 className="holo-text text-2xl font-bold uppercase tracking-wider md:text-3xl">{title}</h1>}
            {subtitle && <p className="text-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </div>
  );
}

export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return <div role="status" className="flex items-center gap-2 p-6 text-muted"><LoaderCircle className="h-5 w-5 animate-spin" aria-hidden />{label}</div>;
}

export function EmptyState({ art, title, children, action }: { art?: string; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-md justify-items-center gap-3 p-6 text-center">
      {art && <ArtSlot id={art} className="w-40 md:w-52" />}
      <h2 className="text-lg font-semibold">{title}</h2>
      {children && <p className="text-muted">{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ art = 'error.server', title = 'Algo deu errado', children, onRetry }: { art?: string; title?: string; children?: ReactNode; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto grid max-w-md justify-items-center gap-3 p-6 text-center">
      <ArtSlot id={art} className="w-40 md:w-52" />
      <h2 className="text-lg font-semibold">{title}</h2>
      {children && <p className="text-muted">{children}</p>}
      {onRetry && <button className="btn" onClick={onRetry}><RefreshCw className="h-4 w-4" aria-hidden />Tentar de novo</button>}
    </div>
  );
}

export function Modal({ open, onOpenChange, title, children, wide }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode; wide?: boolean }) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <RDialog.Content
          aria-describedby={undefined}
          className={cn('glass chamfer fixed left-1/2 top-1/2 z-50 max-h-[88dvh] w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 overflow-auto p-5', wide && 'w-[min(94vw,52rem)]')}
          style={{ background: 'var(--glass-solid)' }}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <RDialog.Title className="text-lg font-bold uppercase tracking-wider">{title}</RDialog.Title>
            <RDialog.Close className="btn icon sm ghost" aria-label="Fechar"><X className="h-4 w-4" /></RDialog.Close>
          </div>
          {children}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

/** Retrato em moldura hexagonal; usa o upload do jogador e cai para a arte padrao. */
export function PortraitFrame({ mediaId, size = 64, alt = '', fallback = 'portrait.default', className }: { mediaId?: string | null; size?: number; alt?: string; fallback?: string; className?: string }) {
  return (
    <div className={cn('hex relative shrink-0', className)} style={{ width: size, height: size * 1.08, background: 'var(--line-strong)' }}>
      <div className="hex absolute inset-[2px] overflow-hidden" style={{ background: 'var(--space)' }}>
        {mediaId ? <img src={`/api/media/${mediaId}/256`} alt={alt} className="h-full w-full object-cover" loading="lazy" /> : <ArtSlot id={fallback} className="h-full w-full" ratio="auto" decorative />}
      </div>
    </div>
  );
}
export { artSrc };

export function Markdown({ md, file, className }: { md: string; file?: string; className?: string }) {
  const html = useMemo(() => renderMarkdown(md, { file, hrefBase: '/consulta' }), [md, file]);
  return <div className={cn('prose', className)} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Indicador de sincronia: transmitindo / sincronizado / na fila (n) / offline. */
export function SyncIndicator({ compact }: { compact?: boolean }) {
  const { online, pending, syncing, conflicts, authLost } = useSync();
  let tone = 'var(--ok)', text = 'Sincronizado', icon = <Check className="h-3.5 w-3.5" aria-hidden />;
  if (authLost) { tone = 'var(--dark)'; text = 'Sessão expirada'; icon = <AlertTriangle className="h-3.5 w-3.5" aria-hidden />; }
  else if (conflicts) { tone = 'var(--dark)'; text = `${conflicts} conflito${conflicts > 1 ? 's' : ''}`; icon = <AlertTriangle className="h-3.5 w-3.5" aria-hidden />; }
  else if (!online) { tone = 'var(--warn)'; text = pending ? `Offline · na fila (${pending})` : 'Offline'; icon = <CloudOff className="h-3.5 w-3.5" aria-hidden />; }
  else if (syncing || pending) { tone = 'var(--holo)'; text = pending ? `Transmitindo (${pending})` : 'Transmitindo'; icon = <span className="pulse inline-block h-2 w-2 rounded-full" style={{ background: tone }} aria-hidden />; }
  return (
    <span role="status" aria-live="polite" data-testid="sync-indicator" data-sync={text} className="chip" style={{ color: tone, borderColor: tone }}>
      {icon}{!compact && <span>{text}</span>}{compact && <span className="sr-only">{text}</span>}
    </span>
  );
}

/** Avisos do motor de sincronia (alteracao recusada, ajuste do servidor). */
export function SyncNotices() {
  const notices = useSync((s) => s.notices);
  if (!notices.length) return null;
  return (
    <div className="fixed inset-x-3 top-3 z-[60] grid gap-2 md:left-auto md:right-4 md:w-96" aria-live="polite">
      {notices.map((n, i) => (
        <div key={i} role="alert" className="glass chamfer flex items-start gap-2 p-3 text-sm" style={{ borderColor: 'var(--warn)' }}>
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 warnc" aria-hidden /><span className="flex-1">{n}</span>
          <button className="btn icon sm ghost" aria-label="Dispensar aviso" onClick={() => dismissNotice(i)}><X className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}

export function Stat({ label, value, tone, icon }: { label: string; value: ReactNode; tone?: string; icon?: ReactNode }) {
  return (
    <div className="grid gap-0.5 text-center">
      <span className="label flex items-center justify-center gap-1">{icon}{label}</span>
      <span className="mono text-xl font-bold" style={{ color: tone }}>{value}</span>
    </div>
  );
}

export const WOUND_PT: Record<string, string> = {
  healthy: 'Healthy', stunned: 'Stunned', wounded: 'Wounded', 'wounded-twice': 'Wounded x2', incapacitated: 'Incapacitated', 'mortally-wounded': 'Mortally Wounded', killed: 'Killed',
};
export const woundTone = (w: string) => (w === 'healthy' ? 'var(--ok)' : w === 'wounded' || w === 'stunned' ? 'var(--warn)' : 'var(--dark)');
