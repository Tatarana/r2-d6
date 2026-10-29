# ADR-0001: Monorepo com npm workspaces

- Status: proposto (2026-10-28)

## Contexto

A v2 tem front, back e código compartilhado (regras, dados, contratos). O v1 (`app/`) tem de ficar intacto. A máquina de desenvolvimento é Windows com Node 22 e npm 11; o próximo passo é implementação pelo `smart-coder`, então menos ferramentas é melhor.

## Decisão

Um repositório com npm workspaces: `apps/web`, `apps/api`, `packages/rules`, `packages/data`, `packages/contracts`, mais `e2e/`. Pacotes internos são consumidos **como fonte TypeScript** (`"exports": { ".": "./src/index.ts" }`): Vite e `tsx` compilam na hora, sem build dos pacotes no dev; o build de produção da API (`tsup`) embute os pacotes. `tsconfig.base.json` com `strict`, project references para `tsc -b`. Scripts de automação em Node (`scripts/*.mjs`), nunca bash. `concurrently` sobe API e web com `npm run dev`.

## Alternativas

- **pnpm + Turborepo:** mais rápido e com cache, mas exige instalar pnpm (corepack) e aprender mais uma ferramenta; ganho irrelevante com cinco pacotes.
- **Nx:** poderoso, pesado demais para o porte.
- **Repositórios separados:** quebra o compartilhamento de tipos e regras; versões de pacote para sincronizar.

## Consequências

- Um `npm install` na raiz instala tudo; um `package-lock.json`.
- Sem cache de tarefas; se o build ficar lento, adicionar Turborepo sem mudar a estrutura.
- Pacotes "fonte TS" não são publicáveis como estão; não é objetivo.
