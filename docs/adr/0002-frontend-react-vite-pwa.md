# ADR-0002: Front em React + Vite, SPA instalável (PWA)

- Status: proposto (2026-10-28)

## Contexto

O usuário liberou sair do HTML puro e quer visual mais chamativo (imagens do universo, animações, talvez dados 3D). O app continua precisando ser responsivo em três formas (PC, tablet, celular; `docs/ux-platforms.md`), instalável e utilizável offline na mesa. Todo o conteúdo fica atrás de login: não há SEO a ganhar.

## Decisão

SPA com **React 19 + Vite + TypeScript**.

- Rotas: React Router (modo SPA). Estado do servidor: TanStack Query. Estado local de UI e da mesa: Zustand. Fichas e outbox: Dexie (IndexedDB) com `useLiveQuery`.
- PWA: `vite-plugin-pwa` (Workbox): precache do shell e do bundle de dados, cache de runtime para retratos, prompt de atualização.
- UI: Tailwind CSS 4 + shadcn/ui (Radix: diálogos, menus e abas acessíveis), lucide-react, Motion para transições e para o Wild Die "explodindo".
- Dados 3D: React Three Fiber + drei, em chunk carregado sob demanda; o resultado vem do `@r2d6/rules` (ou do servidor) e a animação termina na face sorteada (sem física decidindo o resultado); desligado com `prefers-reduced-motion`; fallback 2D.
- Imagens do universo: componente `ArtSlot` que mostra a arte quando existe em `public/art/` ou um placeholder com gradiente e a descrição; o mapeamento vem do manifesto de imagens mantido pelo PM.
- Layout por forma (largura + `pointer`), como no v1.

## Alternativas

- **Next.js:** SSR e Server Components não ajudam num app autenticado e offline-first; service worker e cache ficam mais trabalhosos; acopla front e back num runtime que não é o Fastify.
- **SvelteKit / Vue + Nuxt:** bons, mas ecossistema menor de componentes acessíveis e de 3D; React é o mais conhecido por quem vai manter.
- **Continuar sem framework:** o v1 mostrou o limite (re-render manual, bug B-22 de foco); a v2 tem muito mais estado (sync, tempo real).

## Consequências

- Build com Vite; dev server com proxy para a API (cookie do mesmo site).
- Bundle maior que o v1; mitigado por code splitting por rota e 3D lazy.
- As views do v1 são reescritas em React; a lógica pura vem dos pacotes compartilhados (ADR-0008).
