// GameIcon - os 20 icones do jogo (icon.* do manifesto) desenhados a mao em SVG: grade 24x24, traco 2 com pontas
// arredondadas e cor herdada do texto (currentColor), no mesmo padrao dos icones Lucide usados no resto do app.
import type { ReactNode, SVGProps } from 'react';

// escudo dos estados de ferimento
const SHIELD = 'M12 2.5 19.5 5.5v6c0 4.6-3.2 8.4-7.5 10-4.3-1.6-7.5-5.4-7.5-10v-6z';
const dot = (cx: number, cy: number, r = 1) => <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />;

export const GAME_ICONS: Record<string, ReactNode> = {
  // ---- atributos
  'attr.dexterity': <><circle cx="14.5" cy="4.5" r="1.8" /><path d="m13.5 7.5-2.3 5.7M8 10l4-2 3.5 2.5M11.2 13.2l3 3-.7 4.8M11.2 13.2 8.5 17l-3.5.5M1.5 8h3M1 12h3.5M1.5 16h2.5" /></>,
  'attr.knowledge': <><path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z" /><path d="M12 6.5v13M7 9h2.5M7 12h2.5M14.5 9H17M14.5 12H17" /></>,
  'attr.mechanical': <><path d="M7 5a7 7 0 0 1 10 0" /><path d="M4 8v6M20 8v6M4 11h5.5M14.5 11H20" /><circle cx="12" cy="11" r="2.5" /><path d="M12 13.5V21" /></>,
  'attr.perception': <><path d="M12 2 22 12 12 22 2 12z" /><path d="M6.5 12q5.5-6 11 0-5.5 6-11 0z" /><circle cx="12" cy="12" r="1.6" /></>,
  'attr.strength': <><rect x="6" y="8" width="12" height="10" rx="2.5" /><path d="M10 8v4M14 8v4M6 13.5h5" /></>,
  'attr.technical': <><path d="M14.5 4.2a4.5 4.5 0 0 0-5.3 5.9L3.5 15.8a1.8 1.8 0 0 0 2.6 2.6l5.7-5.7a4.5 4.5 0 0 0 5.9-5.3l-2.6 2.6-2.4-.6-.6-2.4z" /><path d="M14 21h3.5l3-3v-3" />{dot(20.5, 13.5, 1.1)}</>,
  // ---- Força
  'force.control': <><path d="m2 15.5 6 6" /><path d="m6.8 20.2 1.6-1.5c.4-.4.9-.6 1.4-.6h4.3c1 0 2-.4 2.7-1.1l4.3-4.2a1.8 1.8 0 0 0-2.5-2.6l-3.9 3.7" /><path d="M11 15.4h2.1a1.8 1.8 0 0 0 0-3.6H10c-.6 0-1.1.2-1.5.6L3.4 17.2" /><circle cx="13.5" cy="4.5" r="2.3" /><path d="M12 8.6h3" /></>,
  'force.sense': <><path d="M4.5 12.5q7.5 5.5 15 0" /><path d="m8 15.2-1.2 2M12 16.4v2.3M16 15.2l1.2 2M12 3.5v3.5M5.6 6l2 2.2M18.4 6l-2 2.2" /></>,
  'force.alter': <><path d="M9.2 12.6 10.8 10.6h2.6l1.5 2-.9 2.8h-4z" /><path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3M19.5 12a7.5 7.5 0 0 1-12.8 5.3" /><path d="M17.3 3.4v3.3H14M6.7 20.6v-3.3H10" /></>,
  // ---- pontos
  'points.cp': <><path d="M11 4.5 12.6 10.4 18.5 12l-5.9 1.6L11 19.5l-1.6-5.9L3.5 12l5.9-1.6z" /><path d="M19 2.5v4M17 4.5h4" /></>,
  'points.fp': <><circle cx="12" cy="12" r="9.5" /><path d="M12 6c1.8 2.6 4 4.3 4 7.4a4 4 0 0 1-8 0c0-1.7.9-2.9 1.9-3.9 0 1.4.6 2.4 1.5 2.4C11.4 10 12 8.3 12 6z" /></>,
  'points.dsp': <><path d="M10.4 3.6A6 6 0 0 0 6 9.5c0 3.5 2.5 6.5 6 11.5M13.6 3.6A6 6 0 0 1 18 9.5c0 3.5-2.5 6.5-6 11.5" /><path d="m10.4 3.6 2.2 3.4-2 2.8 2.6 3" /></>,
  // ---- ferimentos
  'wound.stunned': <><circle cx="12" cy="11" r="3.5" /><path d="M5 21c0-3.6 3.1-6 7-6s7 2.4 7 6" /><ellipse cx="12" cy="5" rx="6.5" ry="1.8" /><path d="M18 2v2.6M16.7 3.3h2.6" /></>,
  'wound.wounded': <><path d={SHIELD} /><path d="m9 14.5 6-6" /></>,
  'wound.wounded-twice': <><path d={SHIELD} /><path d="m7.8 12.7 5-5M11.2 16.2l5-5" /></>,
  'wound.incapacitated': <><path d={SHIELD} /><path d="M8.5 11h7" />{dot(12, 15)}</>,
  'wound.mortally-wounded': <><path d={SHIELD} /><path d="M12 2.5 10.7 8l2.4 3.2-2 3.6.9 6.7" /><path d="M18 15.3s-1.8 2.2-1.8 3.3a1.8 1.8 0 0 0 3.6 0c0-1.1-1.8-3.3-1.8-3.3z" /></>,
  'wound.killed': <path d={SHIELD} strokeDasharray="2.6 2.2" />,
  // ---- dados
  'die.normal': <><rect x="4" y="4" width="16" height="16" rx="3" />{dot(12, 12, 1.6)}</>,
  'die.wild': <><path d="M12 2.2 20.6 7.1v9.8L12 21.8l-8.6-4.9V7.1z" fill="currentColor" fillOpacity={0.22} /><path d="m13 6.5-4 6.3h3.2L11 17.5l4-6.3h-3.2z" /></>,
};

export const GAME_ICON_IDS = Object.keys(GAME_ICONS);

/** Icone do jogo pelo id do manifesto sem o prefixo (ex.: "attr.dexterity", "die.wild"). Sem `title`, e decorativo. */
export function GameIcon({ id, size = 24, title, ...rest }: { id: string; size?: number; title?: string } & SVGProps<SVGSVGElement>) {
  const body = GAME_ICONS[id];
  if (!body) return null;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title} data-game-icon={id} {...rest}>
      {title && <title>{title}</title>}
      {body}
    </svg>
  );
}
