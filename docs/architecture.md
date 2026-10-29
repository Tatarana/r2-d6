---
id: architecture-v2
status: proposta
owner: The Architect (r2-d6)
related: [docs/adr/README.md, docs/product-spec.md, docs/rules-decisions.md, docs/ux-platforms.md, app/README.md]
---

# r2-d6 v2: arquitetura

## 1. Resumo executivo

A v2 transforma o protótipo estático (`app/`, que fica intacto e congelado) num sistema cliente-servidor: **SPA React + Vite instalável (PWA, offline)** e **API Node.js (Fastify) + PostgreSQL**, num **monorepo npm workspaces**. As fichas ficam no servidor como documento JSONB validado pelo mesmo `character-sheet.schema.json`, com **revisões, histórico de versões e sincronização offline por operações**. Login com **e-mail e senha (Argon2id) e sessão em cookie httpOnly** (Better Auth); Discord e Google entram como opção por variável de ambiente. **Campanhas** com convite e papéis (mestre, jogador), **rolagens compartilhadas em tempo real** (Socket.IO) sorteadas no servidor, e **sincronização entre os aparelhos do mesmo jogador**. A lógica de regras do v1 vira o pacote `packages/rules`, usado no front e no back. Roda no Windows com `docker compose up -d`, `npm install`, `npm run dev`.

## 2. Requisitos e premissas

### 2.1 Requisitos funcionais (v2)

| ID | Requisito | Origem |
|---|---|---|
| F-01 | Conta e login; sessão persistente; sair de um aparelho remotamente. | pedido do usuário |
| F-02 | Fichas guardadas no servidor, com histórico de versões e restauração. Sai a importação/exportação JSON do fluxo principal. | pedido do usuário |
| F-03 | Campanhas (mesas) com convite por link, código curto ou QR; papéis mestre e jogador; o mestre vê as fichas do grupo e aprova personagens. | brief |
| F-04 | Rolagens compartilhadas em tempo real com o grupo; decisão do Wild Die 1 pelo mestre (PD-04). | brief, RD-03 |
| F-05 | Modo mesa sincronizado entre os aparelhos do mesmo jogador (celular e tablet). | brief |
| F-06 | Retrato do personagem (upload) e espaços de imagem do universo com placeholder. | brief, visual |
| F-07 | Funciona offline na mesa e sincroniza quando a rede volta. | PD-01 (evoluído) |
| F-08 | Assistente de regras com IA (Claude API) respondendo só com base em `data/`, com página citada. | brief (provável) |
| F-09 | Tudo que o v1 faz: assistente de criação, ficha, modo mesa, consulta, glossário, impressão A4. | v1 |

### 2.2 Requisitos não funcionais

| Tema | Alvo |
|---|---|
| Uso | Grupos pequenos (3 a 8 pessoas por mesa), sessões de 3 a 5 horas, picos só durante as sessões. |
| Latência | Rolagem compartilhada aparece nos outros aparelhos em < 500 ms na mesma cidade; ações locais (marcar munição) instantâneas (otimistas). |
| Disponibilidade | Sem SLA formal. Meta prática 99,5%; o modo offline cobre quedas durante a sessão. |
| Perda de dados | RPO 24 h no plano pequeno (backup diário), RPO de minutos no plano de escala (PITR). RTO de horas. Nenhuma edição feita offline pode se perder silenciosamente. |
| Segurança | OWASP ASVS nível 1 como referência; autorização por recurso testada; LGPD (exportar e apagar conta). |
| Plataformas | PC, tablet, celular (`docs/ux-platforms.md`); instalável; Chrome/Edge/Safari atuais. |
| Dev local | Windows 11, Node 22, Docker Desktop, Python 3; três comandos; nada de scripts bash obrigatórios. |

### 2.3 Premissas (confirmar com o usuário; ver seção 15)

1. Uso privado por grupos conhecidos, sem monetização (o tema é propriedade da Lucasfilm; ver riscos).
2. Sem cloud preferida; recomendo um caminho barato e simples para o grupo pequeno e um de referência para escala.
3. Um personagem pertence a um jogador e participa de no máximo uma campanha por vez.
4. Interface só em pt-BR (PD-06 continua).
5. Orçamento do grupo pequeno: até cerca de US$ 25/mês.

## 3. Visão de componentes

```mermaid
flowchart LR
  subgraph Cliente["Aparelho do jogador (PC, tablet, celular)"]
    UI["SPA React (apps/web)"]
    SW["Service worker (Workbox)\nshell + bundle + retratos"]
    IDB[("IndexedDB (Dexie)\nfichas, outbox, rolagens")]
    RulesC["@r2d6/rules + @r2d6/data\n(cálculo local)"]
    UI --- RulesC
    UI --- IDB
    UI --- SW
  end

  subgraph Servidor["apps/api (Node 22 + Fastify)"]
    Auth["Better Auth\n/api/auth/*"]
    REST["REST /api/*\n(Zod, OpenAPI)"]
    RT["Socket.IO\nsalas: user, campaign, character"]
    Sync["Sync: rebase de operações\nAjv + @r2d6/rules"]
    Dice["Rolagens autoritativas\n(crypto RNG)"]
    Media["Mídia: sharp + driver\nlocal | S3"]
    AI["Assistente de regras\n(Claude API)"]
    REST --> Sync
    REST --> Dice
    REST --> Media
    REST --> AI
    REST -- "após commit" --> RT
  end

  PG[("PostgreSQL 17")]
  OBJ[("Armazenamento de objetos\n.data/media no dev\nR2/S3 em produção")]
  MAIL["E-mail\nMailpit no dev"]
  CLAUDE["Anthropic API"]
  OAUTH["Discord / Google OAuth"]

  UI -- "HTTPS, cookie de sessão" --> REST
  UI -- "HTTPS" --> Auth
  UI <-- "WebSocket" --> RT
  Auth --> PG
  Sync --> PG
  Dice --> PG
  Media --> OBJ
  Auth --> MAIL
  Auth --> OAUTH
  AI --> CLAUDE
```

Fronteiras de confiança: (1) navegador, não confiável; tudo que chega é revalidado; (2) API, única que fala com banco, armazenamento, e-mail e Anthropic; (3) serviços externos, acessados só com segredos do servidor. A chave da Anthropic e os segredos OAuth nunca vão ao cliente.

Princípios do desenho:

- **Uma só via de escrita.** Toda mutação passa por REST (`/api/*`). O WebSocket só distribui o que já foi gravado. Isso deixa o offline simples (o outbox reenvia requisições HTTP idempotentes) e evita duas implementações de autorização.
- **Monólito modular.** Um processo de API com módulos (`auth`, `characters`, `campaigns`, `rolls`, `media`, `assistant`). Microsserviços não se justificam nessa escala.
- **O app calcula, o mestre decide** (PD-04). O servidor bloqueia só o que quebra a estrutura da ficha (schema). Problemas de regra (7D não gastos, limite de espécie) viram **avisos** guardados e mostrados ao mestre.

## 4. Stack escolhida

| Camada | Escolha | Por quê | ADR |
|---|---|---|---|
| Monorepo | npm workspaces (npm 11), TypeScript, pacotes internos consumidos como fonte TS | Já instalado; sem pnpm/Turborepo para aprender; Vite e `tsx` leem TS direto. | [ADR-0001](adr/0001-monorepo-npm-workspaces.md) |
| Front | React 19 + Vite + TypeScript, React Router (modo SPA), TanStack Query, Zustand, Dexie (IndexedDB), `vite-plugin-pwa` (Workbox) | SPA atrás de login não precisa de SSR; o offline-first é natural numa SPA; ecossistema maior. | [ADR-0002](adr/0002-frontend-react-vite-pwa.md) |
| UI e visual | Tailwind CSS 4 + shadcn/ui (Radix, acessível), Motion (animações), React Three Fiber + drei para dados 3D (carregado sob demanda), lucide-react (ícones) | Componentes acessíveis prontos; visual chamativo sem perder AA; 3D opcional e com fallback 2D. | ADR-0002 |
| Back | Node 22 + Fastify 5 + TypeScript (`tsx watch` no dev, `tsup` no build), Zod + `fastify-type-provider-zod`, `@fastify/swagger` | Maduro, rápido, plugins oficiais (multipart, rate-limit, helmet, static); contratos Zod compartilhados com o front. | [ADR-0003](adr/0003-backend-fastify-rest.md) |
| API | REST JSON + OpenAPI em `/api/docs`; contratos em `packages/contracts` | Outbox offline reenvia HTTP simples; upload multipart; Better Auth já é REST; abre espaço para bot de Discord ou app nativo. | ADR-0003 |
| Banco | PostgreSQL 17 (Docker no dev), Drizzle ORM + drizzle-kit (migrações SQL versionadas) | Relacional para contas, campanhas, papéis; JSONB para a ficha; Drizzle é TS puro, sem binário de engine, bom no Windows. | [ADR-0004](adr/0004-postgres-drizzle-jsonb.md) |
| Auth | Better Auth (e-mail+senha, sessão em banco, cookie httpOnly), hash Argon2id (`@node-rs/argon2`), plugins: OAuth Discord/Google, magic link | Biblioteca TS madura e popular, dados no nosso Postgres, sem fornecedor externo; roda offline no dev. | [ADR-0005](adr/0005-auth-better-auth-cookie.md) |
| Tempo real | Socket.IO 4 acoplado ao Fastify; adapter Postgres (`@socket.io/postgres-adapter`) quando houver mais de uma instância | Salas, reconexão e autenticação por cookie prontas; sem Redis no início. | [ADR-0006](adr/0006-realtime-socketio.md) |
| Offline/sync | Dexie (IndexedDB) + outbox; operações JSON Patch com `inc` para contadores; revisão por ficha e rebase no servidor | Resolve o caso real da mesa (dois aparelhos marcando munição e CP) sem CRDT. | [ADR-0007](adr/0007-offline-sync-ops-rebase.md) |
| Regras e dados | `packages/rules` (port de `dice.js` e `rules.js`), `packages/data` (bundle gerado por `tools/build_app_data.py`), Ajv para o schema | Mesma regra no cliente e no servidor; fonte única `data/` (PD-02). | [ADR-0008](adr/0008-shared-rules-and-data.md) |
| Rolagens | Sorteio no servidor com `crypto.randomInt` para rolagens compartilhadas; modo "dados físicos" registra os valores digitados | Confiança do grupo; o mestre vê o selo "sorteada no servidor". | [ADR-0009](adr/0009-server-authoritative-rolls.md) |
| Mídia | `sharp` (redimensiona para WebP, remove EXIF), driver `local` (dev) ou `s3` (produção: Cloudflare R2 ou S3) | Sem MinIO (descontinuado como imagem Docker, ver ADR). | [ADR-0010](adr/0010-media-storage.md) |
| IA | Anthropic SDK, corpus de regras com prompt caching, resposta em streaming (SSE), atrás de feature flag | Respostas fundamentadas em `data/` com citação; custo baixo; desligado sem chave. | [ADR-0011](adr/0011-rules-assistant-claude.md) |
| E-mail | Nodemailer; Mailpit no dev (SMTP 1025, UI 8025); Resend, Postmark ou SES em produção | Reset de senha e magic link testáveis localmente. | ADR-0005 |
| Testes | Vitest (unidade e integração), Playwright (E2E com dois navegadores para tempo real), Testing Library | Padrão do ecossistema Vite. | seção 13 |
| Observabilidade | pino (JSON), request id, `/healthz` e `/readyz`, Sentry (front e back) opcional, OpenTelemetry depois | Suficiente para um grupo; cresce sem retrabalho. | seção 12 |

Fixar as versões estáveis atuais no momento da implementação (`npm install <pkg>@latest` uma vez, depois versões exatas no `package-lock.json`). `engines.node: ">=22.12"`.

## 5. Estrutura de pastas

`app/` (v1) não muda. `data/` continua sendo a fonte da verdade e não é alterada pela v2.

```
r2-d6/
  app/                         v1 congelado (estático); não editar
  data/                        base de conhecimento (fonte da verdade, PD-02)
  tools/                       scripts Python; build_app_data.py ganha --out (aditivo)
  docs/
    architecture.md            este documento
    adr/                       decisões (0001..0012)
  apps/
    web/                       SPA React + PWA
      index.html
      vite.config.ts           proxy /api e /socket.io -> :3000; vite-plugin-pwa
      public/
        art/                   imagens do universo (placeholders até as artes chegarem)
        icons/                 ícones do PWA
      src/
        main.tsx, router.tsx
        app/                   providers (Query, Auth, Socket), layout (PC/tablet/celular)
        features/
          auth/                login, cadastro, reset, sessões ativas
          characters/          lista, ficha, histórico de versões, retrato
          creation/            assistente de criação (8 passos)
          mesa/                modo mesa, rolador, dados 3D (lazy), CP/FP, ferimentos
          campaigns/           campanhas, convites, painel do mestre, feed de rolagens
          reference/           consulta, busca, glossário, errata
          assistant/           chat do assistente de regras
          print/               ficha A4
        components/            UI (shadcn/ui), ArtSlot (imagem ou placeholder com descrição)
        lib/
          api.ts               cliente REST tipado (contratos Zod)
          socket.ts            Socket.IO client
          db.ts                Dexie: characters, outbox, rolls, meta
          sync/                outbox, aplicação de ops, rebase local, tela de conflito
        styles/
      tests/                   Testing Library
    api/                       Fastify + Socket.IO
      src/
        server.ts              boot, plugins, static (produção), graceful shutdown
        config.ts              env com defaults de dev (Zod)
        db/
          schema/              Drizzle: auth.ts, characters.ts, campaigns.ts, rolls.ts, media.ts
          migrations/          SQL gerado pelo drizzle-kit (versionado)
          seed.ts              usuários e campanha de demonstração
        auth/                  configuração do Better Auth, hash Argon2id, e-mail
        authz/                 políticas puras (canRead, canEdit, canGmAct...)
        modules/
          characters/          rotas, serviço de sync (ops, rebase, versões), validação
          campaigns/           rotas, convites, revisão, round
          rolls/               rotas, RNG do servidor, resolução do Wild Die 1
          media/               upload, variantes, drivers local e s3
          assistant/           recuperação, prompt, streaming SSE, limites
          me/                  perfil, exportar dados (LGPD), apagar conta
        realtime/              Socket.IO: autenticação, salas, emissão pós-commit
        lib/                   logger, erros, rate limit
      tests/                   Vitest + banco r2d6_test
  packages/
    rules/                     @r2d6/rules: dice.ts, rules.ts (port do v1), sheet.ts, creation.ts, ops.ts
      tests/                   os 56 testes do v1 portados para Vitest + novos
    data/                      @r2d6/data: bundle gerado, tipos, catálogo e busca
      scripts/build.mjs        chama tools/build_app_data.py --out ...; fallback: copia app/data/bundle.json
      generated/               bundle.json, bundle.meta.json (hash), character-sheet.d.ts (não editar)
      src/catalog.ts           índice por id, busca (port de app/js/data.js), seções de regra
    contracts/                 @r2d6/contracts: Zod de DTOs REST, eventos Socket.IO, formato das ops
  e2e/                         Playwright (login, criar ficha, rolagem compartilhada com 2 contextos)
  scripts/                     Node (não bash): setup.mjs, ensure-data.mjs, wait-db.mjs
  docker/
    postgres/init.sql          cria o banco r2d6_test
  docker-compose.yml           postgres + mailpit
  .env.example                 todas as variáveis, com valores de dev
  package.json                 workspaces e scripts raiz
  tsconfig.base.json
  vitest.workspace.ts
  playwright.config.ts
```

## 6. Execução local (Windows)

Pré-requisitos: Docker Desktop rodando, Node 22.12+, Python 3 (opcional: sem ele o script copia `app/data/bundle.json`).

```powershell
cd E:\dev\r2-d6
docker compose up -d      # Postgres 17 (5432) e Mailpit (SMTP 1025, UI http://localhost:8025)
npm install
npm run dev               # predev: gera dados se faltarem, aplica migrações, semeia se vazio
```

- Web: <http://localhost:5173> (Vite faz proxy de `/api` e `/socket.io` para a API, então o cookie é do mesmo site).
- API: <http://localhost:3000>, documentação OpenAPI em <http://localhost:3000/api/docs>.
- Contas de demonstração criadas pelo seed: `mestre@r2d6.local` e `jogador@r2d6.local`, senha `r2d6-demo` (só no dev), na campanha "Demo: Fuga de Tatooine".
- Testar no celular da rede local: `npm run dev -- --host` expõe o Vite em `http://<ip-do-pc>:5173`. Service worker exige HTTPS fora de `localhost`; para testar a instalação no celular use `npm run dev:https` (plugin `@vitejs/plugin-basic-ssl`) ou um túnel.

Scripts da raiz (`package.json`):

| Script | Faz |
|---|---|
| `dev` | `concurrently` com `dev` de `@r2d6/api` (`tsx watch`) e de `@r2d6/web` (`vite`). |
| `predev` | `node scripts/setup.mjs --quick`: `.env` padrão se não existir, `data:build` se o bundle não existir ou `data/` mudou (hash), espera o banco, `db:migrate`, `db:seed` se não houver usuários. Mensagem clara se o Docker não estiver de pé. |
| `data:build` | `node packages/data/scripts/build.mjs` (detecta `python`, `py` ou `python3`). |
| `db:generate` / `db:migrate` / `db:seed` / `db:studio` | drizzle-kit e seed. |
| `test` | `vitest run` em todos os workspaces (usa o banco `r2d6_test`). |
| `test:e2e` | Playwright. |
| `build` | data, web (estático) e api (`tsup`); a API serve `apps/web/dist` em produção. |
| `lint` / `typecheck` | ESLint e `tsc -b`. |

`docker-compose.yml` (texto previsto, o `smart-coder` pode copiar):

```yaml
services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: r2d6
      POSTGRES_PASSWORD: r2d6
      POSTGRES_DB: r2d6
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data          # volume nomeado: evita problemas de permissão no Windows
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U r2d6"]
      interval: 2s
      retries: 30
  mail:
    image: axllent/mailpit
    ports: ["1025:1025", "8025:8025"]
volumes:
  pgdata:
```

Variáveis (`.env.example`; `config.ts` aplica os mesmos defaults de dev, então o `.env` é opcional localmente):

```
DATABASE_URL=postgres://r2d6:r2d6@localhost:5432/r2d6
DATABASE_URL_TEST=postgres://r2d6:r2d6@localhost:5432/r2d6_test
APP_URL=http://localhost:5173
BETTER_AUTH_SECRET=dev-only-change-me
SMTP_URL=smtp://localhost:1025
MAIL_FROM="r2-d6 <no-reply@r2d6.local>"
STORAGE_DRIVER=local            # local | s3
MEDIA_DIR=.data/media
S3_ENDPOINT= S3_REGION=auto S3_BUCKET= S3_ACCESS_KEY_ID= S3_SECRET_ACCESS_KEY=
DISCORD_CLIENT_ID= DISCORD_CLIENT_SECRET=     # vazio = botão escondido
GOOGLE_CLIENT_ID= GOOGLE_CLIENT_SECRET=
ANTHROPIC_API_KEY=                            # vazio = assistente desligado
ASSISTANT_MODEL=claude-haiku-4-5
ASSISTANT_DAILY_LIMIT=40
```

Cuidados de Windows: sem scripts `.sh`; caminhos via `node:path`; `sharp` e `@node-rs/argon2` têm binários pré-compilados para win32-x64 (sem compilador C++); `.gitattributes` com `* text=auto eol=lf` quando o projeto virar repositório.

## 7. Modelo de dados

```mermaid
erDiagram
  user ||--o{ session : "tem"
  user ||--o{ account : "credenciais/OAuth"
  user ||--o{ characters : "é dono"
  user ||--o{ campaign_members : "participa"
  campaigns ||--o{ campaign_members : "tem"
  campaigns ||--o{ campaign_invites : "emite"
  campaigns ||--o{ characters : "inclui"
  characters ||--o{ character_changes : "revisões"
  characters ||--o{ character_versions : "snapshots"
  characters ||--o{ rolls : "rola"
  campaigns ||--o{ rolls : "feed"
  user ||--o{ rolls : "autor"
  user ||--o{ media : "envia"
  media |o--o{ characters : "retrato"
  user ||--o{ assistant_queries : "pergunta"
```

Identificadores: **UUIDv7 gerado no cliente** para fichas e rolagens (permite criar offline sem colisão e serve de chave de idempotência); UUIDv7 gerado no servidor para o resto. Datas em `timestamptz`.

### 7.1 Tabelas de autenticação (geradas pelo Better Auth, esquema Drizzle)

| Tabela | Campos principais | Notas |
|---|---|---|
| `user` | `id`, `name` (nome de exibição), `email` (único, minúsculo), `email_verified`, `image`, `created_at`, `updated_at` | `image` aponta para `media` (avatar do usuário). |
| `session` | `id`, `user_id`, `token` (único), `expires_at`, `ip_address`, `user_agent`, `created_at` | Sessão no banco: permite listar e revogar aparelhos. |
| `account` | `id`, `user_id`, `provider_id` (`credential`, `discord`, `google`), `account_id`, `password` (hash Argon2id, só `credential`), tokens OAuth | Um usuário pode ter senha e Discord ligados. |
| `verification` | `id`, `identifier`, `value`, `expires_at` | Reset de senha, verificação de e-mail, magic link. |

### 7.2 Domínio

**`characters`**

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | gerado no cliente |
| `owner_id` | FK user | |
| `campaign_id` | FK campaigns, nulo | premissa: uma campanha por vez |
| `name`, `species_id`, `template_type` | text | desnormalizados do `sheet` para listas e busca |
| `portrait_media_id` | FK media, nulo | |
| `sheet` | jsonb | **documento conforme `character-sheet.schema.json`**, sem `x_app` |
| `play_state` | jsonb | estado de mesa que era `x_app.round`: `{ round, actions, cpSpent, fpUsed, stuns[], mortalRounds, activeWeapon, updatedAt por campo }` |
| `revision` | int | incrementa a cada alteração de `sheet` |
| `sync_seq` | bigint | valor de uma sequência global a cada escrita; cursor do pull incremental |
| `validation` | jsonb | avisos de regra calculados no servidor (`validateCreation`, limites de espécie) |
| `review_status` | enum `draft`, `submitted`, `approved`, `changes_requested` | aprovação do mestre |
| `review_note`, `reviewed_by`, `reviewed_at` | | |
| `rules_bundle_hash` | text | hash do bundle usado na última validação |
| `created_at`, `updated_at`, `deleted_at` | | exclusão lógica (lixeira de 30 dias) |

Índices: `(owner_id) where deleted_at is null`, `(campaign_id)`, `(sync_seq)`.

**`character_changes`** (log de revisões; base do rebase e do "quem mudou o quê")

`character_id`, `revision` (PK composta), `ops` jsonb, `actor_id`, `actor_role` (`owner`, `gm`), `device_id`, `mutation_id` uuid único (idempotência do outbox), `created_at`. Retenção: 90 dias (depois disso só os snapshots).

**`character_versions`** (snapshots que o usuário vê como histórico)

`id`, `character_id`, `revision`, `snapshot` jsonb (sheet completo), `kind` (`creation`, `auto`, `milestone`, `approval`, `advancement`, `restore`), `label`, `author_id`, `created_at`. Quando criar:

- na criação, na aprovação do mestre, ao gastar CP em evolução, antes de uma restauração;
- `milestone`: botão "Salvar marco" (ex.: "fim da sessão 3");
- `auto`: na primeira escrita depois de 30 min sem alterações, grava o estado anterior (efeito prático: um snapshot por sessão de jogo, sem um por clique de munição).

Restaurar = nova revisão que substitui o `sheet` inteiro (o histórico nunca é reescrito). Diferença entre versões calculada no cliente (`jsondiffpatch`).

**`campaigns`**: `id`, `name`, `description`, `banner_media_id`, `settings` jsonb, `current_round` int, `created_by`, `created_at`, `archived_at`. `settings` contém:

- `houseRules`: liga/desliga RD-04, RD-14, RD-19, RD-21, RD-29 (as regras da casa em aberto no backlog), lidas pelo `@r2d6/rules` como opções;
- `wildOneResolver`: `gm` (padrão, PD-04) ou `roller`;
- `partyVisibility`: `summary` (padrão: nome, retrato, espécie, ferimento) ou `full` (jogadores veem fichas completas dos colegas);
- `rollVisibilityDefault`: `table` ou `gm`.

**`campaign_members`**: `campaign_id`, `user_id` (PK composta), `role` (`gm`, `player`), `joined_at`. Pode haver mais de um `gm` (co-mestre). Restrição: toda campanha tem pelo menos um `gm`.

**`campaign_invites`**: `id`, `campaign_id`, `code_hash` (SHA-256 do código; o código em claro só aparece na criação), `role`, `created_by`, `expires_at` (padrão 7 dias), `max_uses`, `uses`, `revoked_at`. Código curto legível para digitar na mesa (`KX7Q-M2PA`, alfabeto sem 0/O/1/I, cerca de 40 bits) mais link e QR com o mesmo código; tentativas limitadas por IP e usuário.

**`rolls`**

| Campo | Notas |
|---|---|
| `id` uuid (cliente), `mutation_id` único | idempotência |
| `user_id`, `character_id` nulo, `campaign_id` nulo | rolagem sem campanha fica privada |
| `roll_type` | `skill`, `attribute`, `specialization`, `reaction`, `damage`, `resist`, `initiative`, `free` (ROLL_TYPES do v1) |
| `label`, `skill_id` | "blaster", "dodge"... |
| `pool` jsonb | base, penalidades, FP, final, explicação linha a linha (`effectivePool`) |
| `mode` | `digital` ou `physical` |
| `rng` | `server` (rolagem online) ou `client` (feita offline, enviada depois; selo diferente) |
| `normals` int[], `wild` int[], `pips` int, `cp_dice` jsonb | valores |
| `wild_one` bool, `wild_one_choice` (`normal`, `complication`, `subtract`), `resolved_by`, `resolved_at` | RD-03 |
| `total` int nulo | nulo enquanto o Wild Die 1 aguarda o mestre |
| `visibility` | `table`, `gm`, `private` |
| `created_at` | índice `(campaign_id, created_at desc)` |

**`media`**: `id`, `owner_id`, `kind` (`portrait`, `avatar`, `campaign_banner`), `driver`, `storage_key`, `mime`, `bytes`, `width`, `height`, `sha256`, `variants` jsonb (`{"256": key, "768": key}`), `created_at`, `deleted_at`.

**`assistant_queries`**: `id`, `user_id`, `question`, `answer`, `citations` jsonb, `model`, `input_tokens`, `cached_tokens`, `output_tokens`, `created_at`. Serve para limite diário, custo e avaliação de qualidade.

### 7.3 Do v1 para a v2

| v1 (`localStorage`) | v2 |
|---|---|
| `r2d6.char.<id>` (ficha + `x_app`) | `characters.sheet` + `characters.play_state` |
| `x_app.history` (últimas rolagens) | tabela `rolls` |
| `x_app.round` | `play_state` |
| `r2d6.prefs` | IndexedDB local (tema, tela ligada) + `user` (preferências que devem seguir a conta) |
| exportar/importar JSON | sai do fluxo principal. Ficam: "Baixar meus dados" (LGPD) e, se o usuário quiser, um importador único "trazer fichas do protótipo v1" (decisão 15.3) |

## 8. API

REST JSON sob `/api`, contratos Zod em `@r2d6/contracts` (o mesmo schema valida no servidor e tipa o cliente), OpenAPI gerado. Erros no formato `application/problem+json` (`type`, `title`, `status`, `detail`, `errors[]`). Paginação por cursor. Todas as mutações aceitam o cabeçalho `Idempotency-Key` (o `mutation_id` do outbox).

### 8.1 Autenticação (Better Auth, montado em `/api/auth/*`)

| Rota | Uso |
|---|---|
| `POST /api/auth/sign-up/email` | cadastro (nome, e-mail, senha) |
| `POST /api/auth/sign-in/email` | login |
| `POST /api/auth/sign-out` | sair |
| `GET /api/auth/get-session` | sessão atual |
| `POST /api/auth/request-password-reset`, `POST /api/auth/reset-password` | esqueci a senha (e-mail via Mailpit no dev) |
| `GET /api/auth/list-sessions`, `POST /api/auth/revoke-session` | aparelhos conectados |
| `POST /api/auth/sign-in/social` (`discord`, `google`) + callback | OAuth, se configurado |
| `POST /api/auth/sign-in/magic-link`, `GET /api/auth/magic-link/verify` | magic link (fase 3) |

Os nomes exatos seguem a versão do Better Auth instalada; o front usa o cliente oficial (`better-auth/react`), não chama as rotas à mão.

### 8.2 Domínio

| Método e rota | Faz | Quem |
|---|---|---|
| `GET /api/me` · `PATCH /api/me` | perfil, preferências | logado |
| `GET /api/me/export` · `DELETE /api/me` | LGPD: baixar tudo (ZIP com JSON e imagens), apagar conta | logado |
| `GET /api/meta` | versão da API, `bundleHash`, features ligadas (oauth, assistente) | público |
| `GET /api/characters?scope=mine\|campaign:<id>` | lista resumida | dono; membros (resumo) |
| `POST /api/characters` | cria (id do cliente) | logado |
| `GET /api/characters/:id` | ficha, `play_state`, `revision`, `validation` | ver 9 |
| `PATCH /api/characters/:id` | `{ baseRevision, ops[], mutationId, deviceId }` → `200 { revision, ops aplicadas }` ou `409 { conflicts[], current }` ou `422` (schema) | dono; mestre (ops de mestre) |
| `PUT /api/characters/:id/play-state` | estado de mesa, último a escrever vence por campo | dono |
| `DELETE /api/characters/:id` · `POST /api/characters/:id/restore-deleted` | lixeira | dono |
| `POST /api/characters/:id/duplicate` | cópia | dono |
| `GET /api/characters/:id/versions` · `GET .../versions/:vid` | histórico | dono, mestre |
| `POST /api/characters/:id/versions` | salvar marco `{ label }` | dono |
| `POST /api/characters/:id/restore` | `{ versionId }` | dono |
| `GET /api/characters/:id/changes?sinceRevision=` | ops desde uma revisão | dono, mestre |
| `GET /api/sync?since=<sync_seq>` | pull incremental: fichas alteradas visíveis ao usuário + tombstones | logado |
| `POST /api/sync/batch` | reenvio do outbox: lista de mutações, resultado por item | logado |
| `GET /api/campaigns` · `POST /api/campaigns` | minhas campanhas; criar (criador vira `gm`) | logado |
| `GET/PATCH/DELETE /api/campaigns/:id` | detalhe; configurações e regras da casa; arquivar | membro; `gm` |
| `GET /api/campaigns/:id/members` · `PATCH .../members/:userId` · `DELETE .../members/:userId` | papéis, remover, sair | membro; `gm`; o próprio |
| `POST /api/campaigns/:id/invites` · `DELETE .../invites/:inviteId` | criar/revogar convite | `gm` |
| `GET /api/invites/:code` · `POST /api/invites/:code/accept` | prévia (nome da campanha, mestre) e aceitar | logado |
| `POST /api/campaigns/:id/characters` · `DELETE .../characters/:cid` | vincular/desvincular personagem | dono do personagem (membro) |
| `POST /api/campaigns/:id/characters/:cid/submit` · `.../review` | enviar para aprovação; aprovar ou pedir ajustes `{ status, note }` | dono; `gm` |
| `GET /api/campaigns/:id/party` | painel do mestre: ferimento, stuns, CP/FP, munição, avisos de cada ficha | `gm` (jogadores: resumo) |
| `POST /api/campaigns/:id/round/next` | mestre avança o round de todos (libera CP/FP, zera ações) | `gm` |
| `GET /api/campaigns/:id/rolls?before=` | feed | membro (filtra `visibility`) |
| `POST /api/rolls` | `{ id, characterId?, campaignId?, rollType, skillId?, specialization?, mode, values? (físico), visibility }`; servidor calcula a parada a partir da ficha e sorteia | dono do personagem |
| `POST /api/rolls/:id/cp` | gastar CP depois de ver a rolagem (US-05): servidor sorteia os dados de CP, valida limite e exclusão com FP, desconta da ficha | autor |
| `POST /api/rolls/:id/wild-one` | `{ choice }` | `gm` (ou autor, conforme `wildOneResolver`) |
| `POST /api/media` (multipart) · `GET /api/media/:id/:variant` · `DELETE /api/media/:id` | upload e entrega | dono; quem pode ver o recurso ligado |
| `POST /api/assistant/ask` (resposta SSE) | `{ question, context?: { characterId?, sectionId? } }` | logado, com limite diário |
| `GET /healthz` · `GET /readyz` | vivo; banco acessível | público |

### 8.3 Eventos Socket.IO (só servidor → cliente, exceto inscrição)

| Evento | Sala | Carga |
|---|---|---|
| `character:changed` | `character:<id>`, `user:<owner>` | `{ id, revision, ops, actor, deviceId }` (o aparelho de origem ignora o próprio `deviceId`) |
| `play:changed` | `character:<id>` | campos alterados do `play_state` |
| `roll:created` · `roll:updated` | `campaign:<id>` (filtrado por visibilidade: rolagens `gm` vão para a sala `campaign:<id>:gm`) | rolagem |
| `campaign:round` | `campaign:<id>` | `{ round }` |
| `campaign:members` | `campaign:<id>` | entrada e saída |
| `presence` | `campaign:<id>` | quem está online e com qual personagem |
| `sync:hint` | `user:<id>` | "há novidades, faça pull" (após reconexão) |

Cliente → servidor: `subscribe { campaignId?, characterId? }` e `unsubscribe`; o servidor confere a autorização antes de pôr o socket na sala. A autenticação do handshake usa o mesmo cookie de sessão (o Vite faz proxy de `/socket.io` no dev; em produção é a mesma origem).

## 9. Autenticação e autorização

### 9.1 Autenticação

- **Protótipo (entra):** e-mail e senha com **Argon2id** (`@node-rs/argon2`, parâmetros OWASP: m=19 MiB, t=2, p=1) ligado ao Better Auth por `password.hash/verify`; senha mínima de 10 caracteres; verificação contra lista de senhas comuns (lista local); sessão no banco, cookie `httpOnly`, `SameSite=Lax`, `Secure` em produção, validade de 30 dias renovada com o uso; "sair dos outros aparelhos"; reset de senha por e-mail (Mailpit no dev). Verificação de e-mail desligada no dev, ligada em produção.
- **Opção pronta no protótipo, desligada por padrão:** OAuth **Discord** (o público de RPG já está lá) e **Google**, ativados só se as variáveis existirem; vinculação de conta por e-mail verificado.
- **Depois (fase 3):** magic link (plugin do Better Auth; depende de e-mail confiável em produção) e passkeys (WebAuthn).
- **Proteções:** rate limit nas rotas de auth (Better Auth + `@fastify/rate-limit`); mensagens que não revelam se o e-mail existe; `trustedOrigins` com a origem do app; mutações exigem `Content-Type: application/json` e Origin conferido (CSRF, somado ao `SameSite=Lax`); `@fastify/helmet` com CSP estrita.

Por que cookie e não JWT no `localStorage`: o cookie httpOnly não é legível por script (mitiga XSS que roube token), a revogação é imediata (sessão no banco) e o Socket.IO reaproveita o mesmo cookie. O custo, a consulta de sessão por requisição, é irrelevante nessa escala (e o Better Auth tem cache de sessão em cookie assinado se precisar).

### 9.2 Autorização

Políticas puras em `apps/api/src/authz/` (testadas em unidade), chamadas por todas as rotas e pela inscrição em salas:

| Recurso e ação | Dono | Mestre da campanha do personagem | Jogador da mesma campanha | Outros |
|---|---|---|---|---|
| Ver ficha completa | sim | sim | só com `partyVisibility=full`; senão resumo | não (404) |
| Editar ficha | sim | **ops de mestre**: conceder CP/FP/DSP, aplicar ferimento e stun, ajustar créditos; registradas com `actor_role=gm` | não | não |
| Histórico e versões | sim | ver | não | não |
| Rolar pelo personagem | sim | não (o mestre rola as suas) | não | não |
| Ver rolagem `table` / `gm` / `private` | autor | sim / sim / não | sim / não / não | não |
| Resolver Wild Die 1 | se `wildOneResolver=roller` | sim | não | não |
| Configurar campanha, convidar, aprovar, avançar round | | sim (`gm`) | não | não |

Regras: recurso sem permissão responde **404** (não revela existência); ids UUID não são enumeráveis, mas a autorização nunca depende disso; testes de IDOR para cada rota (usuário B tentando ler, editar e inscrever-se na sala de A).

## 10. Tempo real

Fluxo de uma rolagem compartilhada:

```mermaid
sequenceDiagram
  participant J as Celular do jogador
  participant API as API (REST)
  participant DB as PostgreSQL
  participant IO as Socket.IO
  participant M as Tablet do mestre
  participant T as Tablet do mesmo jogador
  J->>API: POST /api/rolls {id, characterId, rollType: skill, skillId: blaster}
  API->>DB: lê sheet + play_state; effectivePool (@r2d6/rules)
  API->>API: roll(pool, crypto RNG)
  API->>DB: INSERT rolls (wild_one = true, total = null)
  API-->>J: 201 rolagem (aguardando mestre)
  API->>IO: emit roll:created -> campaign:<id>, user:<jogador>
  IO-->>M: roll:created (botões: normal / complicação / subtrair)
  IO-->>T: roll:created
  M->>API: POST /api/rolls/:id/wild-one {choice: subtract}
  API->>DB: UPDATE rolls (total = 12)
  API->>IO: emit roll:updated
  IO-->>J: total 12
  IO-->>T: total 12
```

- **Aparelhos do mesmo jogador:** cada aparelho entra em `user:<id>` e em `character:<id>` do personagem ativo. Marcar munição no celular gera um `PATCH` com op `inc`; o tablet recebe `character:changed` e aplica as ops (ou faz pull se a revisão pular).
- **Reconexão:** ao reconectar, o cliente faz `GET /api/sync?since=` e reenvia o outbox; eventos perdidos durante a queda não importam porque o estado vem do pull.
- **Presença:** heartbeat do Socket.IO; o painel do mestre mostra quem está conectado.
- **Escala:** uma instância atende milhares de sockets ociosos. Com mais de uma instância, ligar `@socket.io/postgres-adapter` (LISTEN/NOTIFY, sem infraestrutura nova) e sticky sessions no balanceador; Redis só quando o volume de eventos justificar.
- **Por que não SSE:** a comunicação é praticamente só servidor → cliente, e SSE serviria; o Socket.IO ganha por salas, reconexão com backoff, autenticação no handshake e adapters de escala prontos, sem código próprio. Ver ADR-0006.

## 11. Offline e sincronização

### 11.1 O que funciona offline

| Recurso | Offline | Como |
|---|---|---|
| Shell, consulta, glossário, regras, busca | sim | precache do Workbox; bundle de dados com hash no nome |
| Ver e editar as próprias fichas, modo mesa | sim | IndexedDB (Dexie) é a fonte de leitura da UI; edições vão para o outbox |
| Rolagem individual | sim | sorteio local (`rng=client`), enviada depois com selo "offline" |
| Retratos já vistos | sim | cache de runtime (CacheFirst, expiração 30 dias) |
| Criar personagem | sim | id UUIDv7 local; `POST` vai no outbox |
| Campanha, convites, rolagem compartilhada, assistente IA | não | UI avisa e desabilita |
| Login | só se já havia sessão | sessão em cookie; o app guarda o último usuário e as fichas dele |

### 11.2 Protocolo

```mermaid
sequenceDiagram
  participant UI as UI
  participant L as IndexedDB (fichas + outbox)
  participant API as API
  UI->>L: aplica ops localmente (otimista) e grava mutação {mutationId, baseRevision, ops}
  Note over L: sem rede: mutações acumulam
  L->>API: POST /api/sync/batch (em ordem, ao voltar a rede)
  API->>API: para cada mutação: se baseRevision = revision, aplica; senão rebase sobre as ops de character_changes > baseRevision
  API-->>L: por item: aplicada (nova revisão) | conflito (campos + valor do servidor) | rejeitada (schema)
  L->>UI: atualiza ficha; conflitos abrem a tela "manter meu / manter o do servidor"
```

Formato das ops (`@r2d6/contracts`): subconjunto do JSON Patch (RFC 6902: `add`, `remove`, `replace`) mais `inc` para contadores:

```json
{ "op": "inc", "path": "/weapons/0/ammo_used", "value": 1, "match": { "_id": "w_7f3a" } }
```

Regras do rebase (implementadas em `@r2d6/rules/ops.ts`, puras e testadas, usadas no servidor e no cliente):

1. **Contadores comutam.** `character_points`, `force_points`, `dark_side_points`, `credits`, `ammo_used`, `move` são alterados por `inc`; dois aparelhos (ou jogador e mestre concedendo CP) nunca conflitam. Depois do rebase, o servidor aplica limites (não negativo; teto da munição) e registra um aviso se cortou.
2. **Itens de lista têm chave estável.** Armas, armaduras, equipamentos e especializações ganham `_id` (propriedade extra permitida pelo schema); perícias usam `skill`. Ops em itens levam `match`; no rebase o índice é resolvido de novo pela chave. Item apagado do outro lado = conflito.
3. **Conflito real** = a mesma folha (ou um ancestral) alterada por `replace/add/remove` dos dois lados desde a base. Ops sem sobreposição são aplicadas; as conflitantes voltam ao cliente com o valor atual.
4. **Validação depois do rebase.** O documento resultante passa no Ajv (`character-sheet.schema.json`); se falhar, `422` e nada é gravado.
5. **`play_state`** (round, ações declaradas, stuns) é efêmero: último a escrever vence por campo, com `updatedAt` por campo.
6. **Base antiga demais** (fora da retenção de 90 dias de `character_changes`): todo campo divergente vira conflito para o usuário decidir.

Alternativas descartadas: CRDT (Yjs, Automerge) resolve tudo automaticamente, mas guarda documento binário, dificulta a validação pelo schema e as consultas, e é mais difícil de depurar; último-a-escrever-vence no documento inteiro perderia munição e CP na mesa. Ver ADR-0007.

## 12. Segurança, resiliência e observabilidade

**Segurança (OWASP Top 10):**

- Controle de acesso: políticas centralizadas, testes de IDOR, 404 para o que não se pode ver.
- Validação: Zod em toda entrada; Ajv no documento da ficha; limites de tamanho (corpo JSON 256 KB, ficha 128 KB, upload 8 MB).
- Upload: aceitar só JPEG, PNG, WebP e AVIF conferidos pela decodificação do `sharp` (não pela extensão); reencodar para WebP 256 e 768 px; remover EXIF (localização); nome do objeto gerado no servidor.
- XSS: React escapa por padrão; Markdown das regras e respostas da IA renderizado com sanitização (`rehype-sanitize`); CSP sem `unsafe-inline` para scripts.
- Segredos: só em variáveis de ambiente do servidor; `.env` fora do controle de versão; em produção, cofre do provedor.
- IA: o assistente não tem ferramentas nem acesso a dados de usuários; só recebe o corpus de `data/` e a pergunta (risco de prompt injection limitado a respostas ruins, não a vazamento). Limite diário por usuário.
- LGPD: exportar e apagar conta; apagar remove fichas, rolagens, mídia e sessões; logs sem conteúdo de ficha nem senha.
- Dependências: `npm audit` no CI, Renovate ou Dependabot quando houver repositório.

**Resiliência:**

- Ponto único de falha no plano pequeno: a instância e o banco. Mitigado pelo offline-first (a sessão de jogo continua) e por backup diário (`pg_dump` comprimido para o armazenamento de objetos, retenção 30 dias, teste de restauração mensal).
- Desligamento gracioso (fecha sockets, termina requisições). Clientes reconectam com backoff.
- Degradação: sem IA (sem chave ou limite estourado), sem e-mail (reset indisponível), sem armazenamento (retrato com placeholder); o resto funciona.

**Observabilidade:**

- Logs JSON (pino) com `requestId`, `userId`, rota, latência; sem dados pessoais.
- Métricas mínimas (log agregável ou `/metrics` Prometheus depois): conexões de socket, taxa de conflitos de sync, latência de `POST /api/rolls`, erros 5xx, custo de tokens do assistente.
- Sentry (plano gratuito) no front e no back para exceções, opcional por DSN.
- Alertas no plano pequeno: verificação externa de `/readyz` (UptimeRobot ou similar) e falha de backup.

## 13. Dados de `data/` e regras compartilhadas

### 13.1 `@r2d6/data`

- `packages/data/scripts/build.mjs` executa `python tools/build_app_data.py --out packages/data/generated/bundle.json` (o `--out` é uma mudança aditiva no script; sem o argumento ele continua gravando `app/data/bundle.json`, então o v1 não muda). Sem Python, copia `app/data/bundle.json` e avisa.
- Gera também `bundle.meta.json` (`sha256`, data) e `character-sheet.d.ts` (`json-schema-to-typescript`) para tipar a ficha.
- `src/catalog.ts`: `createCatalog(bundle)` com mapas por id, seções de regra e a busca (port de `app/js/data.js`), usado pelo front (consulta) e pelo back (assistente e validação).
- **Front:** importa a URL do bundle (`bundle.json?url`), busca com `fetch` e o Workbox o deixa em precache; o hash no nome do arquivo garante atualização.
- **Back:** lê o bundle no boot; `GET /api/meta` publica o `bundleHash`. Se o cliente tiver bundle diferente, a UI avisa "dados de regras atualizados, recarregue".
- Os dados de regra **não vão para o banco**: são imutáveis por versão do app, e manter em memória evita sincronizar duas fontes. (Se um dia houver conteúdo de campanha criado pelo mestre, aí sim vira tabela.)
- Evolução: portar o gerador para TypeScript quando o Python atrapalhar (por exemplo no CI); até lá, reaproveitar é mais barato e mantém PD-02.

### 13.2 `@r2d6/rules`

- Port de `app/js/dice.js` e `app/js/rules.js` para TypeScript, mantendo nomes, assinaturas, RNG injetável e os comentários RD-xx. O v1 mantém a própria cópia (fica congelado; a duplicação é aceita).
- Os **56 testes** de `app/tests/` são portados para Vitest com as mesmas asserções (exemplos do livro).
- Novos módulos:
  - `sheet.ts`: `validateSheet` (equivalente ao do `store.js`, agora via Ajv com o schema), `blankCharacter`, `skillCode`;
  - `creation.ts`: a lógica do assistente hoje em `app/js/views/creation.js` (`buildCharacter` e validações de passo) extraída como função pura que recebe o catálogo;
  - `ops.ts`: aplicar, inverter e fazer rebase de operações (seção 11);
  - `options.ts`: regras da casa como parâmetros (`{ rd04, rd14, rd19, rd21, rd29 }`), com padrão igual ao comportamento atual.
- **No servidor:** `POST /api/rolls` usa `effectivePool`, `cpLimit`, `canSpendCP`, `canSpendFP`, `roll` e `rollCP` com `crypto.randomInt(1, 7)`; `PATCH` de ficha recalcula `validation` com `validateCreation` e `speciesLimitWarnings` (avisos, nunca bloqueio).

## 14. Testes

| Nível | Ferramenta | O que cobre |
|---|---|---|
| Regras | Vitest (`packages/rules`) | os 56 casos do v1; ops e rebase (tabela de casos: inc+inc, replace+replace, item apagado, índice deslocado); propriedades com `fast-check` (normalização de pips, `apply(rebase(a,b))` comuta para contadores) |
| Dados | Vitest (`packages/data`) | bundle gerado, busca ("wild die" primeiro, "AT-AT"), hash |
| API | Vitest + Fastify `inject` + banco `r2d6_test` (migrações por execução, `TRUNCATE` entre testes) | auth (cadastro, login, sessão, reset com Mailpit), autorização (matriz da seção 9.2 e IDOR), sync (409, 422, idempotência), rolagens (limites de CP, exclusão CP/FP, Wild Die 1), upload (tipo falso rejeitado) |
| Front | Vitest + Testing Library | rolador, ficha, tela de conflito, outbox (Dexie com `fake-indexeddb`) |
| E2E | Playwright (Chromium; WebKit para Safari) | cadastro e login; criar personagem por template; dois contextos de navegador: jogador rola, mestre resolve o Wild Die 1, os dois veem 12; offline (contexto sem rede) marca munição e sincroniza |
| Visual | Playwright em 3 viewports (390, 820, 1280) | layout por plataforma |

CI (quando virar repositório): GitHub Actions com serviço Postgres, `npm ci`, `data:build`, `typecheck`, `lint`, `test`, `test:e2e`.

## 15. Pontos que dependem de decisão do usuário

1. **Login no protótipo:** só e-mail e senha (recomendado) ou já com Discord e/ou Google ligados (exige criar os apps OAuth e informar as chaves)?
2. **Visibilidade entre jogadores:** colegas de mesa veem só o resumo da ficha (padrão proposto) ou a ficha completa?
3. **Fichas do v1:** há fichas no `localStorage` do protótipo que precisam vir para a v2? Se sim, um importador único de JSON do v1; se não, nada de importar/exportar além do "Baixar meus dados" da LGPD.
4. **Quem resolve o Wild Die 1 por padrão:** o mestre (PD-04, proposto) ou o próprio jogador, com o mestre podendo mudar por campanha.
5. **Mestre pode editar a ficha do jogador?** Proposto: só ops de mestre (CP/FP/DSP, ferimentos, créditos), registradas no histórico.
6. **Assistente de IA:** entra no protótipo (requer chave da Anthropic e aceitar custo por uso) ou fica para depois? Modelo padrão proposto: Haiku (barato); Sonnet para respostas melhores.
7. **Hospedagem:** PaaS (menos operação, cerca de US$ 15 a 25/mês) ou VPS próprio (cerca de US$ 6 a 12/mês, você cuida de atualizações e backup)? Nome de domínio?
8. **Uso público ou privado:** abrir o app para qualquer pessoa aumenta o risco de propriedade intelectual (Star Wars) e exige termos de uso; proposto: privado, por convite.
9. **Dados 3D:** queremos dados 3D no rolador (lazy, com fallback 2D) já no protótipo ou numa fase de polimento?

## 16. Deploy e custos

### 16.1 Grupo pequeno (até cerca de 50 usuários, poucas mesas)

Um único serviço (API servindo também o front estático, mesma origem, sem problema de cookie entre domínios) + Postgres gerenciado + R2.

```mermaid
flowchart LR
  U["Navegadores"] -->|HTTPS + WSS| CF["Cloudflare (DNS, proxy, TLS)\nopcional"]
  CF --> SVC["Container: apps/api\n(serve apps/web/dist)"]
  SVC --> PG[("Postgres gerenciado")]
  SVC --> R2[("Cloudflare R2\nretratos + backups")]
  SVC --> MAIL["Resend / Postmark"]
  SVC --> ANT["Anthropic API"]
```

| Opção | Componentes | Custo aproximado/mês | Prós e contras |
|---|---|---|---|
| **A. PaaS (recomendada)** | Render (ou Fly.io, Railway): web service Starter + Postgres Basic; R2; e-mail no plano gratuito | **US$ 13 a 25** | Deploy por Dockerfile, TLS e backups do Postgres inclusos; WebSocket suportado; instância pequena (512 MB) basta. Preços de PaaS mudaram em 2026; conferir antes. |
| B. VPS | Uma VM pequena (Hetzner, DigitalOcean, Oracle) com `docker compose` (Caddy + api + postgres) e `pg_dump` para R2 | **US$ 6 a 12** | Mais barato; você cuida de atualizações, firewall, backup e restauração. Preços de VPS subiram em 2026. |
| IA (qualquer opção) | Haiku com prompt caching | **US$ 1 a 5** para um grupo pequeno | Corpus de regras em cache custa uma fração de centavo por pergunta; limite diário evita surpresa. |
| R2 | 10 GB e egress gratuitos | **US$ 0** nesse porte | Retratos em WebP têm dezenas de KB. |

### 16.2 Escala (milhares de usuários ativos, dezenas de mesas simultâneas)

Referência na AWS (equivalentes diretos em GCP: Cloud Run + Cloud SQL + Memorystore + GCS + Cloud CDN; Azure: Container Apps + Flexible Server):

- CloudFront + S3 para o front; WAF com regras gerenciadas e rate limit;
- ALB (sticky sessions para Socket.IO) + ECS Fargate, 2 ou mais tarefas em duas AZs, autoscaling por CPU e conexões;
- RDS PostgreSQL Multi-AZ com PITR (RPO de minutos);
- Socket.IO com adapter Postgres; ElastiCache Redis quando os eventos crescerem;
- S3 para mídia com URLs assinadas; SES para e-mail; Secrets Manager; CloudWatch + OpenTelemetry.

Ordem de grandeza: **US$ 250 a 800/mês**, com RDS Multi-AZ e Fargate como principais custos; IA proporcional ao uso. Só migrar quando o plano pequeno mostrar limite (CPU sustentada, conexões, necessidade de SLA); a arquitetura não muda, só a hospedagem.

## 17. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Better Auth evolui rápido (versões 1.x frequentes) | quebra em atualização | fixar versão; auth isolado em `apps/api/src/auth`; tabelas simples no nosso banco (migração possível) |
| Complexidade do sync offline | bugs de dados, perda de edição | escopo fechado (ops + `inc` + chaves estáveis); `ops.ts` puro com testes de propriedade; outbox nunca descarta mutação sem resposta do servidor; conflito sempre visível |
| Módulos nativos no Windows (`sharp`, `argon2`) | `npm install` falha | ambos têm binários win32-x64; fallback documentado: scrypt nativo do Node para senha |
| Dados 3D pesados em celular fraco | travamento na mesa | carregar sob demanda; desligar com `prefers-reduced-motion` ou bateria baixa; fallback 2D; o resultado vem do motor de regras (a animação só mostra) |
| Propriedade intelectual (marca, imagens, texto do livro) | notificação de remoção | uso privado por convite; imagens originais; PD-07 continua (só resumos de `data/`); IA instruída a não reproduzir o livro |
| Custo de IA por abuso | conta alta | limite diário por usuário, teto mensal no console da Anthropic, flag para desligar |
| Dependência de Python para gerar dados | atrito no CI | fallback para o bundle do v1; portar para TS se necessário |
| Ponto único de falha no plano pequeno | indisponibilidade | offline-first; backup diário testado; RTO de horas aceito |

## 18. Roadmap

| Fase | Conteúdo | Saída |
|---|---|---|
| **0. Fundação** | monorepo, compose, `@r2d6/rules` (port + 56 testes), `@r2d6/data`, `@r2d6/contracts`, API com health, Drizzle e migrações, seed, auth e-mail+senha, shell React com layout PC/tablet/celular, PWA | login funcionando nos 3 formatos |
| **1. Fichas no servidor** | CRUD de fichas, assistente de criação, ficha, modo mesa e consulta em React; `PATCH` com ops; versões e restauração; retrato; impressão A4; IndexedDB e outbox offline | v1 inteiro, agora com conta e histórico |
| **2. Mesa compartilhada** | campanhas, convites (link, código, QR), aprovação do mestre, painel do mestre, rolagens no servidor com feed em tempo real, Wild Die 1 pelo mestre, round do mestre, sincronização entre aparelhos, presença | sessão de jogo com o grupo |
| **3. Polimento e extras** | OAuth Discord/Google, magic link, assistente de IA, dados 3D, regras da casa por campanha, evolução com custo em CP (RD-40) | protótipo completo |
| **Escala** | deploy, observabilidade, adapter de Socket.IO, Web Push ("a sessão começou"), diário da sessão gerado das rolagens, passkeys | produção |

O que **entra no protótipo** (entregável ao usuário): fases 0 a 2 com login por e-mail e senha; OAuth pronto atrás de variável. Fase 3 conforme as decisões da seção 15.

## 19. Referências externas verificadas (out/2026)

- MinIO: imagens Docker da edição comunitária descontinuadas e repositório em modo de manutenção/arquivado (motivo de não usar MinIO no compose): <https://linuxiac.com/minio-ends-active-development/>, <https://www.besthub.dev/articles/why-minio-dropped-official-docker-images-and-what-it-means-for-users-7d88d2c3bfe4>
- Better Auth, adaptador Drizzle: <https://better-auth.com/docs/adapters/drizzle.md>; plugin comunitário para Fastify: <https://awesome.ecosyste.ms/projects/github.com%2Fflaviodelgrosso%2Ffastify-better-auth> (preferir o handler oficial montado numa rota catch-all; conferir a documentação da versão instalada)
- Render, preços 2026 (Starter cerca de US$ 7, Postgres Basic a partir de cerca de US$ 6): <https://render.com/articles/how-much-does-cloud-application-hosting-cost-for-small-businesses>, <https://jwatte.com/blog/render-com-platform-review.md>
- Hetzner, reajustes de 2026: <https://privatedevops.com/news/hetzner-june-2026-cloud-price-increase-what-to-do>, <https://www.bitdoze.com/md/es/hetzner-cloud-precios-2026.md>
- Cloudflare R2, gratuidade de 10 GB e egress: <https://developers.cloudflare.com/r2/pricing/index.md>
- Claude API (Haiku 4.5 a US$ 1/5 por milhão de tokens de entrada/saída; caching reduz entrada): <https://finout.io/blog/anthropic-api-pricing>; conferir em <https://www.anthropic.com/pricing> antes de orçar.
