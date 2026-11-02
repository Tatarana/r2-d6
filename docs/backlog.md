---
id: backlog
status: living-document
owner: PM r2-d6
---

# Backlog

Prioridade MoSCoW (M/S/C/W). Critério: valor para a mesa, esforço, risco, dependências. Status: `todo`, `doing`, `done`, `blocked`. Stories detalhadas em `docs/product-spec.md` (v1, US-01 a US-15) e `docs/product-spec-v2.md` (v2, US-20 em diante; funcionalidades F-xx); regras em `docs/rules-decisions.md` (RD-xx).

## Protótipo v0.1 (v1, `app/`, congelado)

A v1 fica intacta como referência e fonte da lógica (`dice.js`, `rules.js` e seus testes). Itens abertos da v1 que seguem para a v2 estão marcados.

| ID | Item | Prio | Stories/Regras | Status |
|---|---|---|---|---|
| B-01 | `tools/build_app_data.py` gera `app/data/bundle.json` de `data/` (entidades, tabelas, regras em seções, glossário, errata, mapas derivados) e relata pendências | M | PD-02, RD-31, RD-34, RD-35, RD-42 | done |
| B-02 | Núcleo de dados: parse/format/soma/normalização de códigos | M | RD-01 | done |
| B-03 | Rolador com Wild Die (RNG injetável) e modo dados físicos | M | US-01 a US-03, RD-02 a RD-04 | done |
| B-04 | Penalidades: ações múltiplas, ferimentos, stuns, FP, CP com limites e exclusão | M | US-04 a US-06, RD-07 a RD-16, RD-20, RD-21 | done |
| B-05 | Ferimentos: tabela, progressão, Mortally Wounded, stun de arma | M | US-07, US-08, RD-17 a RD-26 | done |
| B-06 | Calculadora de dano x resistência com escala | M | US-07, RD-23, RD-24 | done |
| B-07 | Assistente: caminho template | M | US-09, RD-28 a RD-37 | done |
| B-08 | Assistente: caminho do zero (espécie) | M | US-10, RD-33, RD-42 | done |
| B-09 | Assistente: equipamento inicial | M | US-11 | done |
| B-10 | Ficha: CRUD local, vários personagens, personagem ativo | M | US-12 | done |
| B-11 | Ficha: exportar/importar JSON (schema) | M | US-13, PD-05 | done (removido na v2, PD-09) |
| B-12 | Ficha: impressão A4 | M | US-14 | done |
| B-13 | Modo mesa: round, ações, CP/FP, ferimentos, munição, histórico | M | US-04 a US-08, RD-27 | done |
| B-14 | Consulta: busca e navegação por regras e entidades, selos de errata | M | US-15 | done |
| B-15 | Glossário | M | M5 | done |
| B-16 | Layout responsivo (PC lateral, tablet abas/split, celular barra inferior), tema escuro | M | `docs/ux-platforms.md` | done |
| B-17 | PWA: manifest + service worker offline | M | PD-01 | done |
| B-18 | Testes `node --test` da lógica com os exemplos do livro | M | US-01 a US-10 | done |
| B-19 | Atalhos de teclado no PC | S | ux | done (parcial: `?` só abre a tela Mais) |
| B-20 | Wake Lock no modo mesa | S | ux | done |
| B-21 | Evolução com custo em CP e tempo de treino (lógica pronta em `rules.js`, falta tela) | S | RD-40 | movido para B-111 (v2) |
| B-22 | Assistente: primeiro clique no menu de passos se perde quando um campo de texto está em foco (o blur re-renderiza) | S | bug de UX | todo (v1); evitar na v2 (critério de B-106) |
| B-23 | Validar visualmente a impressão em PDF e o tablet em retrato | S | US-14 | todo |

## Protótipo v2 (monorepo, `apps/web` + `apps/api`)

Especificação: `docs/product-spec-v2.md`; visual: `docs/visual-direction.md`; imagens: `docs/image-manifest.json`; arquitetura: `docs/architecture.md` e `docs/adr/` (arquiteto). Ordem sugerida = ordem das linhas.

| ID | Item | Prio | Stories/Regras | Status |
|---|---|---|---|---|
| B-100 | Pacote de regras compartilhado (cliente e servidor) a partir de `dice.js`/`rules.js` da v1, com os testes do livro passando nos dois lados | M | US-01 a US-10, PD-10 | done |
| B-101 | Dados do app gerados de `data/` (continua PD-02), servidos ao web e ao api | M | PD-02 | done |
| B-102 | Conta e login: e-mail (link mágico ou senha) + 1 provedor social; perfil; sessão persistente; termos e consentimento | M | US-20, US-21, F-01, D-01 | done (produção: só Google + cadastro por convite; e-mail e senha só no dev) |
| B-103 | Fichas no servidor: CRUD, validação pelo schema, salvamento automático, indicador de sincronia | M | US-23, PD-09, F-02 | done |
| B-104 | Offline: cache de ficha, mesa e consulta; fila de alterações e rolagens; política de conflito por campo | M | US-23, US-24, PD-08 | done |
| B-105 | Migração dos personagens da v1 (localStorage) para a conta | S | US-22, D-03 | todo (ver B-204) |
| B-106 | Tema v2: tokens, fontes, vidro, componentes base (`GlassPanel`, `HoloNumber`, `HoloCard`, `PortraitFrame`, `SyncIndicator`, `Seal`, `EmptyState`, `ErrorState`) | M | `visual-direction.md` | done |
| B-107 | `ImageSlot` lendo `image-manifest.json`, com placeholder padrão, recorte por ponto focal e `srcset` | M | PD-14 | done (parcial: sem `srcset`) |
| B-108 | Hangar: hero, baias de personagens, campanhas, próxima sessão, atividade | M | F-03 | done |
| B-109 | Telas da v1 portadas para o novo visual: assistente (com galeria de cartas de template e espécie), ficha, modo mesa, consulta, glossário, impressão | M | US-01 a US-15 (menos US-13) | done |
| B-110 | Retrato: upload, recorte, moldura | S | F-13 | done (parcial: upload sem recorte manual) |
| B-111 | Evolução guiada: custo (RD-40), tempo de treino, teste de teto de atributo | S | US-25, F-11, p.25-28 | done (ficha › Evoluir; lógica em `packages/rules/src/advance.ts`) |
| B-112 | Linha do tempo do personagem e lista de versões (ver versão antiga) | S | US-25, F-12 | done (histórico de versões) |
| B-113 | Campanha: criar, capa, convite por link e QR, aceitar, papéis, revogar | M | US-26, F-04, D-05 | done |
| B-114 | Console do mestre: estado do grupo ao vivo; conceder CP; ajustar ferimento e stuns; aprovar ficha | M | US-27, F-05, D-10 | done (parcial: aprovar ficha em B-205) |
| B-115 | Feed da mesa: abrir/fechar sessão, rolagens em tempo real com selo de origem, CP no item publicado | M | US-28, US-30, F-06, PD-10 | done |
| B-116 | Wild Die 1 decidido pelo mestre no feed; "decidido na mesa" sem mestre | M | US-29, F-07, PD-11, RD-03 | done |
| B-117 | Rolagem secreta do jogador e teste secreto do mestre | S | US-31, US-32, F-08, PD-12 | parcial (visibilidade "só o mestre"/"só eu"; teste secreto do mestre falta) |
| B-118 | Dados 3D (bandeja, Wild Die âmbar, efeitos de 6 e 1) com fallback 2D e movimento reduzido | S | US-34, F-09 | done |
| B-119 | Modo mesa sincronizado entre aparelhos do mesmo jogador | S | US-33, F-10 | done |
| B-120 | Modo baixa luz e Wake Lock | M | US-35, F-15 | done |
| B-121 | Notas do personagem e Diário da campanha com resumo automático do feed | S | F-14 | todo |
| B-122 | Agenda da sessão: data, local, presença, arquivo .ics | C | F-16 | todo |
| B-123 | Holomapa estático da campanha | C | F-21 | todo |
| B-124 | Ficha pública somente leitura por link | S | F-18 | todo |
| B-125 | Holocron beta (atrás de chave): respostas só com base em `data/`, citação obrigatória, limite diário, feedback | S | US-36, F-17, PD-13, D-08 | parcial (código pronto, falta testar com a API real: B-203) |
| B-126 | Efeitos sonoros dos dados (opt-in) e vibração | C | F-19 | todo |
| B-127 | Conta: preferências, aparelhos, cópia dos meus dados, excluir conta | M | D-02, LGPD | parcial (exportar ok; apagar conta em B-216) |
| B-128 | Produção das imagens P1 do manifesto (templates, espécies, heróis, mesa, ícones, armas, veículos, naves e as reservas de categoria primeiro) | S | `image-briefs.md`, D-09 | done (rascunhos; aprovação pendente com o Fernando) |
| B-130 | Imagens das entidades da consulta ligadas por id (`<família>.<id>`) com a cadeia de reserva do manifesto (item, `fallback`, placeholder) | S | `image-manifest.json` conventions | done (cadeia de reserva do `ArtSlot`) |
| B-131 | Produção das imagens P2 (armaduras, equipamentos) e P3 (perícias, poderes) | C | D-09 | parcial (P2: 69 rascunhos; P3 adiado, usa a arte da categoria) |
| B-129 | Teste de mesa: 1 mestre + 3 jogadores, sessão de 3 h, queda de rede simulada | M | métricas da spec v2 | todo |

## Depois

| ID | Item | Prio | Notas |
|---|---|---|---|
| B-30 | QR da ficha para o mestre | C | Substituído na v2 por campanha (B-113) e ficha pública (B-124). |
| B-31 | Bônus de criação do Ewok automático | C | RD-38. |
| B-32 | Vantagens e desvantagens no assistente | C | RD-39; depende de E-011 a E-014. |
| B-33 | Rolagem simplificada de paradas grandes | C | RD-43, `tables/die-code-simplification.json`. |
| B-34 | Ações combinadas (command) | C | `core-mechanics.md#combined-actions`. |
| B-35 | Ficha de nave do grupo | C | Consulta já existe. |
| B-36 | Droides como personagem (regras do capítulo 19) | W | Fase 2 não destilada; só o template Protocol Droid. |
| B-37 | Ferramentas do mestre | W | Fase 2. |
| B-38 | Sincronização em nuvem / mesa online | W | Sincronização entra na v2 (B-103, B-104); mesa online completa (mapa tático, vídeo) segue fora (F-27). |
| B-40 | Notificações de sessão (push e e-mail) | C | F-16. |
| B-41 | Trilha e sons ambiente | C | F-19. |
| B-42 | Conquistas e marcos automáticos | C | F-20; hoje só marco manual. |
| B-43 | Round compartilhado da mesa e iniciativa do grupo | C | F-22. |
| B-44 | Modo projeção (TV no centro da mesa) | C | F-23. |
| B-45 | Inventário e créditos do grupo | C | F-25. |
| B-46 | Restaurar versão antiga da ficha | S | F-12. |
| B-47 | Passkeys e login com Discord | S | D-01. |
| B-48 | Holocron lendo a ficha ("o que eu rolo?") | C | F-17. |
| B-49 | Co-mestre e denúncia de retrato impróprio | C | 6.2 e 6.7 da spec v2. |

## Questões em aberto para o usuário

v2: decisões D-01 a D-10 em `docs/product-spec-v2.md` seção 11.

v1 (ainda abertas):


1. Aceitar as regras da casa propostas: RD-04, RD-14, RD-19, RD-21, RD-29 e a extensão de RD-30 (mais de um bloco de especializações).
2. Confirmar as leituras provisórias que o app usa: E-009, E-023, E-028, E-044, E-061 (as que mais aparecem no protótipo).
3. Espécie implícita dos templates (RD-34): aceitar "humano" como padrão?
4. Wookiee template: Move 10 (template) ou 11 (espécie)? Registrado como E-063 (proposta).
5. Perícia avançada na criação: valor = dados colocados (1D ou 2D), como implementado?
6. Itens sem preço numérico no assistente: permitir sem descontar (atual) ou bloquear?

## Protótipo v2 (monorepo `apps/` + `packages/`): o que ficou de fora e dívidas

Registro do que o protótipo v2 **não** faz ou faz de forma reduzida. Entrou: fundação (monorepo, compose, `predev`, seed), login e-mail+senha com reset (Mailpit), Hangar, ficha no servidor com autosave e histórico, assistente de criação, modo mesa, campanha (convite por link e QR, feed em tempo real, console do mestre), consulta e glossário, offline com fila e tela de conflito, retrato, dados 3D lazy, baixa luz, tela ligada, `ArtSlot` e `/dev/art`.

| ID | Item | Prio | Nota |
|---|---|---|---|
| B-201 | Magic link e passkeys | S | Decisão: ficam para depois (exigem e-mail de produção confiável). |
| B-202 | Google e Discord testados ponta a ponta | S | Google configurado em produção (só Google, cadastro por convite); falta o Fernando validar o primeiro login e um convite real. Discord segue sem credenciais. |
| B-203 | Holocron testado com a API real | S | Código com `@anthropic-ai/sdk`, modelo `claude-haiku-5-5`, corpus em cache de prompt e citação de página; só o caminho "desligado" (503 + "em breve") foi verificado. Falta rodar com chave e montar o conjunto de perguntas de avaliação. O link `(p.N)` da resposta leva à consulta geral, não ao trecho. |
| B-204 | Migração da v1 (ler `localStorage` do protótipo) | C | Fora: a origem não é garantida (`file`/porta 8080 x 5173). O código legado de importação do v1 está em `packages/rules/src/v1-store.ts` (testado) para quando houver um botão "importar JSON do v1". |
| B-205 | Aprovação do mestre (`review_status`, enviar/aprovar personagem) | S | Coluna existe; sem rotas nem UI. |
| B-206 | Regras da casa por campanha (RD-04/14/19/21/29 liga/desliga) | S | `settings.houseRules` existe e o painel só expõe Wild Die 1 e visibilidade; `@r2d6/rules` ainda não lê as opções (`options.ts` não foi criado). |
| B-207 | Itens de lista com `_id` e `match` nas operações | S | O rebase usa índices; add/remove em lista conflita com qualquer operação na mesma lista (conservador, sem perda de dados). |
| B-208 | Edição pelo mestre fora de CP/FP/DSP/créditos/ferimento | W | Decisão: mestre só concede, fere e ajusta créditos (registrado no histórico). |
| B-209 | Diário da sessão, holomapa, presença rica, rolagens secretas do mestre (`S`) | C | `bg.campaign.holomap`, `empty.journal` e `empty.timeline` têm espaço no manifesto, sem tela. |
| B-210 | Driver S3/R2 para mídia | C | Só o driver `local`; em produção os retratos ficam num volume da Fly com snapshot diário, o que basta por ora. A interface `Storage` está pronta. |
| B-211 | Migrations reversíveis | S | **Feito:** `<tag>.down.sql` escrito à mão ao lado de cada migração, `npm run db:rollback` (produção exige `--yes`) e teste do ciclo up → down → up. Passo a passo em `docs/deploy.md`. |
| B-212 | Rate limit e verificação de e-mail em produção | S | **Resolvido pela decisão de login só com Google em produção** (e-mail já verificado pelo Google; sem senha nem SMTP). Rate limit global e por rota de convite/auth ligados. |
| B-213 | Ajv/Zod: tipagem estrita de `rules.ts` e `dice.ts` | C | Porta direta do JS do v1 com `// @ts-nocheck` (testes dos 56 casos protegem o comportamento). Gerar `character-sheet.d.ts` a partir do schema. |
| B-214 | ESLint e CI | S | **CI feito:** GitHub Actions roda typecheck e testes em todo push/PR e faz deploy na `main`. Falta ESLint e rodar os e2e (Playwright) no CI. |
| B-215 | Rolagem offline: dados de CP e Wild Die 1 | C | Offline, o CP é gasto só na ficha local (o dado de CP não sobe com a rolagem) e o Wild Die 1 é decidido pelo próprio jogador; ao subir, a rolagem entra no feed como "offline". |
| B-216 | "Baixar meus dados" sem imagens e sem "apagar conta" | S | Exporta JSON (usuário, fichas, versões, campanhas, rolagens). Apagar conta (LGPD) não foi feito. |
| B-217 | Lixeira de fichas (restaurar apagadas) | C | `DELETE` é lógico (`deleted_at`), mas não há tela nem rota de restauração. |
| B-218 | Dados 3D: refino | C | Cubo com pips em canvas e animação simples (sobe, quica, para na face certa). Sem física, som, nem trilha animada do 6 explodindo. A fileira 2D sempre acompanha o resultado. |
| B-219 | Paralaxe por giroscópio, sons, Web Push | W | Fora do escopo do protótipo. |
| B-220 | Armadura e escala na calculadora de dano | S | **Feito:** armadura vestida e escalas no estado de mesa; o servidor soma armadura na resistência (físico/energia), tira da Dexterity e aplica a escala no ataque, esquiva, dano e resistência (p.94-95). |
| B-221 | Testes de componentes (Testing Library) | S | Cobertura da UI é só e2e (Playwright). |
| B-222 | WebKit/Safari e dispositivos reais | S | E2E só em Chromium; o layout foi conferido por viewport emulado (375, 768, 1024, 1366). |

## Produção e operação (nov/2026)

Entregue: deploy na Fly.io + Neon (ADR-0012, `docs/deploy.md`), sempre ligado, https://r2-d6.fly.dev; login só com Google
e cadastro por convite (`SIGNUP_MODE=invite`, `SIGNUP_ALLOWLIST`, cookie do convite antes do Google); CI/CD no GitHub
Actions; migrações reversíveis (B-211); abertura com salto para o hiperespaço; Ficha/Mesa esmaecidas sem personagem;
evolução (B-111); armadura e escala nas rolagens (B-220); 20 ícones do jogo em SVG (`components/GameIcon.tsx`);
ondas 1 a 3 de arte em rascunho (350 imagens).

| ID | Item | Prio | Nota |
|---|---|---|---|
| B-223 | Revisão das 350 artes em rascunho (incluindo IP) e refação das escolhidas | M | Com o Fernando; aprovadas vão com `tools/process_art.py --status approved`. Notas de refação nas pranchas de cada lote. |
| B-224 | Ícone do app (PWA) e 2 texturas | S | **Feito:** ícone em SVG (`apps/web/public/icons/icon.svg`, PNGs 192/512 gerados dele, dentro da zona segura do Android) e materiais dos dados 3D gerados por código em `DiceTray3D.tsx` (grafite com pips ciano; Wild Die âmbar com veios e pips brancos). |
| B-225 | Tirar as artes do precache do PWA | S | O service worker baixa ~27 MB de artes na primeira visita; trocar por cache sob demanda (runtime caching). |
| B-226 | Conferir o registro do service worker em produção | S | No navegador embutido apareceu "unknown error when fetching the script" apesar de `sw.js` responder 200. |
| B-227 | Crabshell Yuuzhan Vong: descrição fiel e nova arte | C | A descrição do manifesto é genérica (não cita vonduun/Yuuzhan Vong). |
| B-228 | Evolução: acompanhar treino em andamento | C | Hoje o tempo de treino é informativo; a melhora entra ao aplicar. |
| B-229 | Ícones `icon.*` no manifesto | C | São componentes SVG, não arquivos em `public/art`; o manifesto ainda os marca como sem imagem. |
