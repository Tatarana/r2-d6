// ArtSlot - espaco de imagem do universo. Recebe so o id do manifesto (docs/image-manifest.json), procura o arquivo em
// public/art/<id>.webp (ou no caminho do manifesto) e, se nao existir, desenha o placeholder da familia:
// gradiente + scanlines + icone Lucide a 45% + (em dev) id e descricao curta. A proporcao e fixa para nao haver salto de layout.
import { Backpack, Car, CircleDashed, Crosshair, IdCard, Rocket, Shield, Target, Image as ImageIcon, Orbit, ScanLine, Sparkles, SquareDashed, TriangleAlert, UserRound, type LucideIcon } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import artFiles from 'virtual:art-index';
import manifest from '../../../../docs/image-manifest.json';
import { cn } from '@/lib/cn';

export interface ArtItem {
  id: string; group: string; screen: string; component: string; aspect: string; style: string; placeholder: string; focal_point: string;
  priority: string; description: string; alt: string; file: string | null; status: string; fallback?: string[];
}
export const ART_ITEMS = manifest.items as unknown as ArtItem[];
const byId = new Map(ART_ITEMS.map((i) => [i.id, i]));
const have = new Set(artFiles);
const EXTS = ['webp', 'avif', 'png', 'jpg', 'jpeg', 'svg'];

const ICONS: Record<string, LucideIcon> = {
  image: ImageIcon, sparkles: Sparkles, 'user-round': UserRound, 'id-card': IdCard, 'scan-line': ScanLine, orbit: Orbit,
  crosshair: Crosshair, shield: Shield, backpack: Backpack, car: Car, rocket: Rocket, target: Target,
  'circle-dashed': CircleDashed, 'triangle-alert': TriangleAlert, 'square-dashed': SquareDashed,
};
const PLACEHOLDERS = manifest.placeholders as Record<string, { gradient: string; icon: string; accent: string }>;

/** Caminho publico da arte, ou null se o arquivo ainda nao existe. */
export function artSrc(id: string): string | null {
  const it = byId.get(id);
  const candidates = [it?.file, ...EXTS.map((e) => `art/${id}.${e}`)].filter(Boolean) as string[];
  const hit = candidates.find((c) => have.has(c.replace(/^\//, '')));
  return hit ? `/${hit.replace(/^\//, '')}` : null;
}
export const artItem = (id: string) => byId.get(id);

function ratioOf(aspect: string | undefined): string | undefined {
  const m = aspect?.match(/(\d+(?:[.,]\d+)?)\s*:\s*(\d+(?:[.,]\d+)?)/);
  return m ? `${m[1].replace(',', '.')} / ${m[2].replace(',', '.')}` : undefined;
}
// "9:16" do celular em hero de varias proporcoes: o slot usa a primeira, mas pode ser sobrescrita por `ratio`

/** `id` pode ser uma cadeia de reserva (item, categoria, ...): usa o primeiro com arquivo; sem arquivo, o placeholder do primeiro id presente no manifesto. Id ausente do manifesto cai no placeholder generico. */
export function ArtSlot({ id: idOrChain, className, style, ratio, alt, fit = 'cover', eager, children, decorative }: {
  id: string | string[]; className?: string; style?: CSSProperties; ratio?: string | 'auto'; alt?: string; fit?: 'cover' | 'contain'; eager?: boolean; children?: ReactNode; decorative?: boolean;
}) {
  // cadeia: id (ou ids dados) + campo `fallback` de cada um no manifesto, na ordem
  const base = Array.isArray(idOrChain) ? idOrChain : [idOrChain];
  const chain = [...new Set(base.flatMap((b) => [b, ...(byId.get(b)?.fallback ?? [])]))];
  const id = chain[0];
  const it = chain.map((c) => byId.get(c)).find(Boolean);
  const hitId = chain.find((c) => artSrc(c));
  const src = hitId ? artSrc(hitId) : null;
  const ph = PLACEHOLDERS[it?.placeholder ?? 'default'] ?? PLACEHOLDERS.default;
  const accent = ph.accent;
  const Icon = ICONS[ph.icon] ?? ImageIcon;
  const text = alt ?? it?.alt ?? '';
  const aspectRatio = ratio === 'auto' ? undefined : ratio ?? ratioOf(it?.aspect);
  const dev = import.meta.env.DEV;
  const focal = it?.focal_point && /esquerda|left/i.test(it.focal_point) ? '25% 50%' : /direita|right/i.test(it?.focal_point ?? '') ? '75% 50%' : '50% 40%';
  const hidden = decorative || !text;
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ aspectRatio, ...style }}
      data-art={id} data-art-status={src ? (hitId === id ? 'ok' : 'fallback') : 'placeholder'}
      title={dev ? `${id}\n${it?.description ?? '(id fora do manifesto)'}` : undefined}
      role={hidden ? undefined : 'img'} aria-label={hidden ? undefined : text} aria-hidden={hidden ? true : undefined}
    >
      {src ? (
        <img src={src} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" className="absolute inset-0 h-full w-full" style={{ objectFit: fit, objectPosition: focal }} />
      ) : (
        <>
          <div className="absolute inset-0" style={{ background: ph.gradient.startsWith('none') ? 'transparent' : ph.gradient }} />
          <div className="absolute inset-0" style={{ background: 'var(--scan)' }} />
          <div className="absolute inset-0 grid place-items-center" style={{ color: accent === 'currentColor' ? undefined : accent, opacity: 0.45 }}>
            <Icon className="h-[28%] max-h-20 min-h-5 w-[28%] max-w-20 min-w-5" strokeWidth={1.25} aria-hidden />
          </div>
          {dev && <span className="mono absolute bottom-1 left-1.5 text-[11px] opacity-60" aria-hidden>{id}</span>}
        </>
      )}
      {children}
    </div>
  );
}

/** Id usado de fato para um espaco (o proprio, uma reserva ou null = placeholder). */
export function artResolved(id: string): { src: string | null; via: string | null } {
  const chain = [id, ...(byId.get(id)?.fallback ?? [])];
  const hit = chain.find((c) => artSrc(c));
  return { src: hit ? artSrc(hit) : null, via: hit && hit !== id ? hit : null };
}
